const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');

router.post('/', async (req, res) => {
    try {
        const customer = new Customer(req.body);
        await customer.save();
        res.status(201).json(customer);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const customer = await Customer.find();
        res.json(customer);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;