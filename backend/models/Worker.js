const mongoose = require('mongoose');
const argon2 = require('argon2');

const WorkerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: 'worker' }, // <-- THIS MUST BE HERE
    address: { type: String, required: true },
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

WorkerSchema.pre('save', async function () {
    if (this.isModified('password')) {
        this.password = await argon2.hash(this.password);
    }
});

WorkerSchema.methods.matchPassword = async function (enteredPassword) {
    try {
        return await argon2.verify(this.password, enteredPassword);
    } catch (err) {
        return false;
    }
};

module.exports = mongoose.model('Worker', WorkerSchema);