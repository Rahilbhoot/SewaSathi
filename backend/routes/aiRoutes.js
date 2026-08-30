const express = require('express');
const router = express.Router();
const { Ollama } = require('ollama');
const Worker = require('../models/Worker');
const Booking = require('../models/Booking');
const { protect } = require('../middleware/authMiddleware');

const ollama = new Ollama();

const wardCoordinates = {
    "Ward 12": [73.8550, 18.5210],
    "Ward 10": [73.8520, 18.5250],
    "Default": [73.8567, 18.5204]
};

const findWorkersTool = {
    type: "function",
    function: {
        name: "find_workers",
        description: "Find nearby verified workers based on requested skill and location.",
        parameters: {
            type: "object",
            properties: {
                skill: { type: "string", description: "The service required (e.g., electrician, plumber)" },
                locationName: { type: "string", description: "The specific ward or area mentioned (e.g., Ward 12)" }
            },
            required: ["skill"]
        }
    }
};

const bookWorkerTool = {
    type: "function",
    function: {
        name: "book_worker",
        description: "Create a booking for a specific worker ID.",
        parameters: {
            type: "object",
            properties: {
                workerId: { type: "string", description: "The MongoDB ID of the selected worker" },
                serviceRequired: { type: "string", description: "The requested service category" },
                notes: { type: "string", description: "Any extra details." },
                scheduledAt: { type: "string", description: "The preferred date and time in ISO format, if mentioned." }
            },
            required: ["workerId", "serviceRequired"]
        }
    }
};

router.post('/dispatch', protect, async (req, res) => {
    try {
        const { prompt, history, lng, lat } = req.body;
        const customerId = req.user._id;

        const systemInstruction = `You are Sahayak, an autonomous dispatcher for a cooperative gig platform. 
    Customer's live/default GPS coordinates: [${lng}, ${lat}]. 
    If the user mentions a specific location like 'Ward 12', extract it and pass it to find_workers. Otherwise, use the live coordinates.
    Your goal is to fulfill the user's request. 
    If deciding who to book on the user's behalf, you MUST ALWAYS suggest and choose the NEAREST worker based on the live geo-location. If multiple workers are equally near, choose the one with the lowest weeklyBookings to ensure fair wage distribution. However, if the user explicitly asks for a specific worker by name, book that specific worker.
    To book a worker, you MUST use the book_worker tool with their workerId and the serviceRequired. You can find the workerId in the chat history. Put any date/time requested into the notes field.`;

        let messages = [
            { role: 'system', content: systemInstruction }
        ];

        if (history && Array.isArray(history) && history.length > 0) {
            const mappedHistory = history.map(msg => ({
                role: msg.role === 'model' ? 'assistant' : msg.role,
                content: msg.parts ? msg.parts[0].text : (msg.content || "")
            }));
            messages = messages.concat(mappedHistory);
        } else {
            messages.push({ role: 'user', content: prompt });
        }

        const response = await ollama.chat({
            model: 'llama3.1',
            messages: messages,
            tools: [findWorkersTool, bookWorkerTool],
            options: {
                temperature: 0.1
            }
        });

        if (response.message.tool_calls && response.message.tool_calls.length > 0) {
            const call = response.message.tool_calls[0];

            if (call.function.name === "find_workers") {
                const { skill, locationName } = call.function.arguments;

                let searchCoords = [parseFloat(lng || wardCoordinates["Default"][0]), parseFloat(lat || wardCoordinates["Default"][1])];

                if (locationName && wardCoordinates[locationName]) {
                    searchCoords = wardCoordinates[locationName];
                }

                const workers = await Worker.find({
                    isVerified: true,
                    skills: skill,
                    location: {
                        $near: {
                            $geometry: { type: "Point", coordinates: searchCoords },
                            $maxDistance: 15000
                        }
                    }
                }).sort({ weeklyBookings: 1 }).limit(3);

                return res.json({
                    action: 'workers_found',
                    message: `Found ${workers.length} workers near ${locationName || 'your location'}.`,
                    data: workers
                });
            }

            if (call.function.name === "book_worker") {
                const { workerId, serviceRequired, notes, scheduledAt } = call.function.arguments;
                const booking = new Booking({
                    customer: customerId,
                    worker: workerId,
                    serviceRequired: serviceRequired,
                    notes: notes,
                    scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
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

        res.json({ action: 'chat', message: response.message.content });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/forecast', protect, async (req, res) => {
    try {
        const recentBookings = await Booking.find().sort({ createdAt: -1 }).limit(50).populate('customer', 'address');

        const summaryData = recentBookings.map(b => ({
            service: b.serviceRequired,
            location: b.customer?.address || 'Unknown',
            date: b.createdAt
        }));

        const prompt = `Analyze the following recent booking data for a household services platform: 
    ${JSON.stringify(summaryData)}
    
    Predict upcoming demand for the next 7 days. Return the output STRICTLY as a JSON array of objects, where each object has these exact keys:
    - "ward" (string, the area)
    - "service" (string, the required skill)
    - "predictedSpikePercentage" (number, estimated increase)
    - "reason" (string, brief logical reason based on trends).`;

        const response = await ollama.chat({
            model: 'llama3.1',
            messages: [{ role: 'user', content: prompt }],
            format: 'json',
            options: {
                temperature: 0.7
            }
        });

        const forecastData = JSON.parse(response.message.content);
        res.json({ success: true, data: forecastData });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;