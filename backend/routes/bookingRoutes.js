const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Worker = require('../models/Worker');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/', protect, authorize('customer'), async (req, res) => {
    try {
        const booking = new Booking({
            ...req.body,
            customer: req.user._id
        });

        // Auto-assign logic for manual bookings
        // Convert to lowercase to match the database skills array format
        const query = {
            isVerified: true,
            skills: (req.body.serviceRequired || "").toLowerCase()
        };
        
        // Find nearest worker first, matching AI logic
        if (req.user.location && req.user.location.coordinates) {
            query.location = {
                $near: {
                    $geometry: { 
                        type: "Point", 
                        coordinates: req.user.location.coordinates 
                    },
                    $maxDistance: 15000
                }
            };
        }

        const bestWorker = await Worker.findOne(query).sort({ weeklyBookings: 1 });

        if (bestWorker) {
            booking.worker = bestWorker._id;
            booking.status = 'assigned';
            
            bestWorker.weeklyBookings += 1;
            await bestWorker.save();
        }

        await booking.save();
        res.status(201).json(booking);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.get('/', protect, async (req, res) => {
    try {
        let query = {};
        if (req.user.role === 'customer') {
            query.customer = req.user._id;
        } else if (req.user.role === 'worker') {
            query.worker = req.user._id;
        }

        const bookings = await Booking.find(query)
            .populate('customer', '-password')
            .populate('worker', '-password');
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.patch('/:id/status', protect, authorize('admin', 'worker'), async (req, res) => {
    try {
        const { status } = req.body;
        const booking = await Booking.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );
        res.json(booking);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;