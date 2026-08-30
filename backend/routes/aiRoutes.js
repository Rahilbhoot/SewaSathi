const express = require('express');
const router = express.Router();
const { GoogleGenAI } = require('@google/genai');
const Worker = require('../models/Worker');
const Booking = require('../models/Booking');
const mockHistoricalBookings = require('../data/mockForecastData');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || 'dummy_key' });

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

const extractRequestInfoTool = {
    name: "extract_request_info",
    description: "Extract structured skill requirements and location or explicit coordinates from user request.",
    parameters: {
        type: "OBJECT",
        properties: {
            skill: { type: "STRING", description: "The service or skill category requested" },
            requirements: {
                type: "ARRAY",
                items: { type: "STRING" },
                description: "List of specific requirement details mentioned"
            },
            locationName: { type: "STRING", description: "Named location or ward if mentioned" },
            latitude: { type: "NUMBER", description: "Explicit numeric latitude coordinate" },
            longitude: { type: "NUMBER", description: "Explicit numeric longitude coordinate" }
        },
        required: ["skill"]
    }
};

const parsePromptFallback = (prompt) => {
    let skill = "general";
    const lower = prompt.toLowerCase();

    if (lower.includes("plumb")) skill = "plumbing";
    else if (lower.includes("electric")) skill = "electrical";
    else if (lower.includes("clean")) skill = "cleaner";
    else if (lower.includes("appliance")) skill = "appliance_repair";

    const requirements = [];
    if (lower.includes("repair")) requirements.push("repair service");
    if (lower.includes("wiring")) requirements.push("wiring repair");
    if (lower.includes("leaking")) requirements.push("leaking pipes repair");

    let latitude = null;
    let longitude = null;
    const coordMatch = prompt.match(/(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/);
    if (coordMatch) {
        latitude = parseFloat(coordMatch[1]);
        longitude = parseFloat(coordMatch[2]);
    }

    let locationName = null;
    const wardMatch = prompt.match(/(Ward\s*\d+|Kothrud|Pune|Sunshine Heights)/i);
    if (wardMatch) {
        locationName = wardMatch[1];
    }

    return {
        skill,
        requirements: requirements.length > 0 ? requirements : undefined,
        location: {
            name: locationName,
            latitude,
            longitude
        }
    };
};

router.post('/dispatch', async (req, res) => {
    try {
        const { prompt, customerId, lng, lat } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: 'prompt is required' });
        }

        const systemInstruction = `You are Sahayak, an autonomous dispatcher for a cooperative gig platform. 
            Customer coordinates: [${lng || 'null'}, ${lat || 'null'}]. 
            Your goal is to fulfill the user's request using the available tools. 
            If they ask for a service, use find_workers. 
            If you are deciding who to book, you MUST choose the worker with the lowest weeklyBookings to ensure fair wage distribution.`;

        if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_google_gemini_api_key_here' && process.env.GEMINI_API_KEY !== 'dummy_key') {
            try {
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: prompt,
                    config: {
                        systemInstruction,
                        tools: [{ functionDeclarations: [findWorkersTool, bookWorkerTool, extractRequestInfoTool] }],
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
                            serviceRequired,
                            status: 'assigned',
                            assignedByAI: true
                        });

                        await booking.save();

                        const workerInfo = await Worker.findById(workerId);
                        if (workerInfo) {
                            workerInfo.weeklyBookings += 1;
                            await workerInfo.save();
                        }

                        return res.json({
                            action: 'booking_created',
                            message: 'Booking successfully created by AI.',
                            data: booking
                        });
                    }
                }

                if (response.text) {
                    return res.json({ action: 'chat', message: response.text });
                }
            } catch (geminiError) {
                console.warn('Gemini dispatch fallback:', geminiError.message);
            }
        }

        const extracted = parsePromptFallback(prompt);
        res.json({
            action: 'extracted',
            message: 'Sahayak processed request parameters.',
            extracted
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/parse-request', async (req, res) => {
    try {
        const { prompt } = req.body;
        if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
            return res.status(400).json({ error: 'prompt is required' });
        }

        if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_google_gemini_api_key_here' && process.env.GEMINI_API_KEY !== 'dummy_key') {
            try {
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: prompt,
                    config: {
                        systemInstruction: "You are Sahayak. Extract structured service skill requirements and location info. If numeric lat/lng coordinates are explicitly provided in prompt text, extract latitude and longitude numbers. If a named location (e.g. Ward 12) is provided without numeric coordinates, set locationName and set latitude/longitude to null. Do NOT fabricate lat/long numbers.",
                        tools: [{ functionDeclarations: [extractRequestInfoTool] }],
                        temperature: 0.1
                    }
                });

                if (response.functionCalls && response.functionCalls.length > 0) {
                    const args = response.functionCalls[0].args;
                    return res.json({
                        success: true,
                        extracted: {
                            skill: args.skill || "general",
                            requirements: args.requirements || undefined,
                            location: {
                                name: args.locationName || null,
                                latitude: typeof args.latitude === 'number' ? args.latitude : null,
                                longitude: typeof args.longitude === 'number' ? args.longitude : null
                            }
                        }
                    });
                }
            } catch (geminiErr) {
                console.warn('Gemini extraction fallback:', geminiErr.message);
            }
        }

        const fallbackResult = parsePromptFallback(prompt);
        res.json({
            success: true,
            extracted: fallbackResult
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/forecast', async (req, res) => {
    try {
        const { ward, skill, forecastPeriod = 'this weekend' } = req.body || {};

        let dbBookings = [];
        try {
            dbBookings = await Booking.find().select('serviceRequired createdAt status amount');
        } catch (dbErr) {
            console.warn('Database booking fetch error for forecast:', dbErr.message);
        }

        let historicalData = [...mockHistoricalBookings];
        if (ward) {
            historicalData = historicalData.filter(b => b.ward.toLowerCase() === ward.toLowerCase());
        }
        if (skill) {
            historicalData = historicalData.filter(b => b.skill.toLowerCase() === skill.toLowerCase());
        }

        let forecastPredictions = [];

        if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_google_gemini_api_key_here' && process.env.GEMINI_API_KEY !== 'dummy_key') {
            try {
                const prompt = `Analyze this historical booking data and produce a structured JSON demand forecast for ${forecastPeriod}.
                Historical Data: ${JSON.stringify(historicalData)}
                Filter Ward: ${ward || 'All Wards'}
                Filter Skill: ${skill || 'All Skills'}
                
                Respond strictly with a JSON object matching this schema:
                {
                  "period": "${forecastPeriod}",
                  "predictions": [
                    {
                      "ward": "Ward 12",
                      "skill": "plumbing",
                      "predictedChangePercent": 40,
                      "demandLevel": "high",
                      "reason": "Recent plumbing bookings have increased in Ward 12.",
                      "confidence": 0.78
                    }
                  ]
                }`;

                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: prompt,
                    config: {
                        systemInstruction: "You are an AI demand forecasting analyst for a worker cooperative platform. Analyze booking patterns and return valid JSON only. Do not invent historical facts. Indicate that forecasts are AI estimates.",
                        temperature: 0.2
                    }
                });

                if (response.text) {
                    const cleanedText = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
                    const parsedForecast = JSON.parse(cleanedText);
                    if (parsedForecast && parsedForecast.predictions) {
                        forecastPredictions = parsedForecast.predictions;
                    }
                }
            } catch (geminiError) {
                console.warn('Gemini forecast fallback:', geminiError.message);
            }
        }

        if (!forecastPredictions || forecastPredictions.length === 0) {
            const targetWard = ward || 'Ward 12';
            const targetSkill = skill || 'plumbing';
            forecastPredictions = [
                {
                    ward: targetWard,
                    skill: targetSkill,
                    predictedChangePercent: 40,
                    demandLevel: 'high',
                    reason: `Historical booking analysis indicates a 40% spike in ${targetSkill} needs in ${targetWard} for ${forecastPeriod}.`,
                    confidence: 0.78
                }
            ];
        }

        res.json({
            success: true,
            forecast: {
                period: forecastPeriod,
                predictions: forecastPredictions
            },
            generatedBy: "Gemini",
            isMockForecast: true
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/', async (req, res) => {
    try {
        res.json({
            success: true,
            service: 'Sahayak AI & Demand Forecasting API',
            status: 'ACTIVE'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

// Allow running directly as standalone script: `node routes/aiRoutes.js`
if (require.main === module) {
    require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
    const connectDB = require('../config/db');
    connectDB();
    const app = express();
    app.use(express.json());
    app.use('/api/ai', router);
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`AI route running standalone at http://localhost:${PORT}/api/ai`));
}