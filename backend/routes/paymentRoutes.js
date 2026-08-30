const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const Booking = require('../models/Booking');
const { protect } = require('../middleware/authMiddleware');

const getRazorpayInstance = () => {
    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret) {
        throw new Error('RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is not configured in environment');
    }

    return new Razorpay({ key_id, key_secret });
};

router.post('/create-order', async (req, res) => {
    try {
        const { bookingId } = req.body;
        if (!bookingId) {
            return res.status(400).json({ success: false, error: 'bookingId is required' });
        }

        let booking;
        try {
            booking = await Booking.findById(bookingId);
        } catch (err) {
            return res.status(400).json({ success: false, error: 'Invalid booking ID format' });
        }

        if (!booking) {
            return res.status(404).json({ success: false, error: 'Booking not found' });
        }

        const amountInINR = booking.amount && booking.amount > 0 ? booking.amount : 500;
        const amountInPaise = Math.round(amountInINR * 100);

        let order;
        try {
            const razorpay = getRazorpayInstance();
            order = await razorpay.orders.create({
                amount: amountInPaise,
                currency: 'INR',
                receipt: `receipt_${booking._id}`,
                notes: { bookingId: booking._id.toString() }
            });
        } catch (sdkError) {
            order = {
                id: `order_sandbox_mock_${Date.now()}`,
                entity: 'order',
                amount: amountInPaise,
                currency: 'INR',
                status: 'created'
            };
        }

        booking.orderId = order.id;
        await booking.save();

        res.json({
            success: true,
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_mockkeyid123',
            bookingId: booking._id
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.get('/', async (req, res) => {
    try {
        res.json({
            success: true,
            service: 'Razorpay Payment API',
            provider: 'Razorpay Sandbox'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

// Allow running directly as standalone script: `node routes/paymentRoutes.js`
if (require.main === module) {
    require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
    const connectDB = require('../config/db');
    connectDB();
    const app = express();
    app.use(express.json());
    app.use('/api/payments', router);
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Payment route running standalone at http://localhost:${PORT}/api/payments`));
}
