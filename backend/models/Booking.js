const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    worker: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker' },
    serviceRequired: { type: String, required: true },
    status: { type: String, enum: ['pending', 'assigned', 'completed'], default: 'pending' },
    assignedByAI: { type: Boolean, default: false },
    amount: { type: Number, default: 500 },
    orderId: { type: String },
    paymentId: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Booking', BookingSchema);