const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/', protect, authorize('customer'), async (req, res) => {
    try {
        const booking = new Booking({
            ...req.body,
            customer: req.user._id
        });
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