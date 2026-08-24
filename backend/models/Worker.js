const mongoose = require('mongoose');

const WorkerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    skills: [{ type: String }],
    isVerified: { type: Boolean, default: false },
    location: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], required: true }
    },
    weeklyBookings: { type: Number, default: 0 },
    rating: { type: Number, default: 5.0 }
});

WorkerSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Worker', WorkerSchema);