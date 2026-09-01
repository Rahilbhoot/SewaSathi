const express = require('express');
const router = express.Router();
const Worker = require('../models/Worker');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/', async (req, res) => {
    try {
        const worker = new Worker(req.body);
        await worker.save();
        res.status(201).json(worker);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.get('/nearby', async (req, res) => {
    try {
        const { lng, lat, skill, maxDistance = 10000 } = req.query;
        const query = {
            isVerified: true,
            location: {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: [parseFloat(lng), parseFloat(lat)]
                    },
                    $maxDistance: parseInt(maxDistance)
                }
            }
        };
        if (skill) {
            query.skill = skill;
        }
        const workers = await Worker.find(query);
        res.json(workers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/suggest', protect, authorize('admin'), async (req, res) => {
    try {
        const { lng, lat, skill, maxDistance = 15000 } = req.query;
        if (!lng || !lat || !skill) {
            return res.status(400).json({ error: 'lng, lat, and skill are required' });
        }

        const query = {
            isVerified: true,
            skills: skill.toLowerCase(),
            location: {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: [parseFloat(lng), parseFloat(lat)]
                    },
                    $maxDistance: parseInt(maxDistance)
                }
            }
        };

        const workers = await Worker.find(query).sort({ weeklyBookings: 1 });
        res.json(workers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const workers = await Worker.find();
        res.json(workers)
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.patch('/:id/verify', protect, authorize('admin'), async (req, res) => {
    try {
        const worker = await Worker.findByIdAndUpdate(
            req.params.id,
            { isVerified: true },
            { new: true }
        );
        res.json(worker);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;