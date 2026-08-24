const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    worker: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker' },
    serviceRequired: { type: String, required: true },
    status: { type: String, enum: ['pending', 'assigned', 'completed'], default: 'pending' },
    assignedByAI: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Booking', BookingSchema);