const express = require('express');
const router = express.Router();
const { GoogleGenAI } = require('@google/genai');
const Worker = require('../models/Worker');
const Booking = require('../models/Booking');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const findWorkersTool = {
    name: "find_workers",
    description: "Find nearby verified workers based on requested skill.",
    parameters: {
        type: "OBJECT",
        properties: {
            skill: { type: "STRING", description: "The service required (e.g., electrician, plumber)" },
            lng: { type: "NUMBER", description: "Longitude of the customer" },
            lat: { type: "NUMBER", description: "Latitude of the customer" }
        },
        required: ["skill", "lng", "lat"]
    }
};

const bookWorkerTool = {
    name: "book_worker",
    description: "Create a booking for a specific worker ID.",
    parameters: {
        type: "OBJECT",
        properties: {
            workerId: { type: "STRING", description: "The MongoDB ID of the selected worker" },
            serviceRequired: { type: "STRING", description: "The requested service category" }
        },
        required: ["workerId", "serviceRequired"]
    }
};

router.post('/dispatch', async (req, res) => {
    try {
        const { prompt, customerId, lng, lat } = req.body;

        const systemInstruction = `You are Sahayak, an autonomous dispatcher for a cooperative gig platform. 
            Customer coordinates: [${lng}, ${lat}]. 
            Your goal is to fulfill the user's request using the available tools. 
            If they ask for a service, use find_workers. 
            If you are deciding who to book, you MUST choose the worker with the lowest weeklyBookings to ensure fair wage distribution.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
                tools: [{ functionDeclarations: [findWorkersTool, bookWorkerTool] }],
                temperature: 0.1
            }
        });

        if (response.functionCalls && response.functionCalls.length > 0) {
            const call = response.functionCalls[0];

            if (call.name === "find_workers") {
                const { skill, lng: reqLng, lat: reqLat } = call.args;
                const workers = await Worker.find({
                    isVerified: true,
                    skills: skill,
                    location: {
                        $near: {
                            $geometry: { type: "Point", coordinates: [reqLng, reqLat] },
                            $maxDistance: 15000
                        }
                    }
                }).sort({ weeklyBookings: 1 }).limit(3);

                return res.json({
                    action: 'workers_found',
                    message: `Found ${workers.length} workers.`,
                    data: workers
                });
            }

            if (call.name === "book_worker") {
                const { workerId, serviceRequired } = call.args;
                const booking = new Booking({
                    customer: customerId,
                    worker: workerId,
                    serviceRequired: serviceRequired,
                    status: 'assigned',
                    assignedByAI: true
                });

                await booking.save();

                const workerInfo = await Worker.findById(workerId);
                workerInfo.weeklyBookings += 1;
                await workerInfo.save();

                return res.json({
                    action: 'booking_created',
                    message: 'Booking successfully created by AI.',
                    data: booking
                });
            }
        }

        res.json({ action: 'chat', message: response.text });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;