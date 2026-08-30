const express = require('express');
const jwt = require('jsonwebtoken');
const Customer = require('../models/Customer');
const Worker = require('../models/Worker');
const router = express.Router();

const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

router.post('/register', async (req, res) => {
    try {
        const { role, phone, password, name, address, location, skills } = req.body;
        let user;

        if (role === 'customer') {
            const exists = await Customer.findOne({ phone });
            if (exists) return res.status(400).json({ error: 'Customer already exists' });
            user = await Customer.create({ name, phone, password, address, location, role });
        } else if (role === 'worker') {
            const exists = await Worker.findOne({ phone });
            if (exists) return res.status(400).json({ error: 'Worker already exists' });
            user = await Worker.create({ name, phone, password, skills, location, address, role });
        } else {
            return res.status(400).json({ error: 'Invalid role' });
        }

        res.status(201).json({
            _id: user._id,
            name: user.name,
            phone: user.phone,
            role: user.role,
            address: user.address,
            skills: user.skills,
            token: generateToken(user._id, user.role)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { phone, password, role } = req.body;
        let user;

        if (role === 'admin') {
            if (phone === 'admin' && password === 'admin123') {
                return res.json({
                    _id: 'admin_id',
                    name: 'Super Admin',
                    role: 'admin',
                    token: generateToken('admin_id', 'admin')
                });
            }
            return res.status(401).json({ error: 'Invalid admin credentials' });
        }

        if (role === 'customer') user = await Customer.findOne({ phone });
        else if (role === 'worker') user = await Worker.findOne({ phone });

        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user._id,
                name: user.name,
                phone: user.phone,
                role: user.role,
                address: user.address,
                skills: user.skills,
                token: generateToken(user._id, user.role)
            });
        } else {
            res.status(401).json({ error: 'Invalid phone or password' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;