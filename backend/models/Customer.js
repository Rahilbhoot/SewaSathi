const mongoose = require('mongoose');
const argon2 = require('argon2');

const CustomerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: 'customer' }, // <-- THIS MUST BE HERE
    address: { type: String, required: true },
    location: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], required: true }
    }
});

CustomerSchema.index({ location: '2dsphere' });

CustomerSchema.pre('save', async function () {
    if (this.isModified('password')) {
        this.password = await argon2.hash(this.password);
    }
});

CustomerSchema.methods.matchPassword = async function (enteredPassword) {
    try {
        return await argon2.verify(this.password, enteredPassword);
    } catch (err) {
        return false;
    }
};

module.exports = mongoose.model('Customer', CustomerSchema);