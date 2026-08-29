const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/db');

const workerRoutes = require('./routes/workerRoutes');
const customerRoutes = require('./routes/customerRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const aiRoutes = require('./routes/aiRoutes');

connectDB();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/workers', workerRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/ai', aiRoutes);

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Cooperative Gig Platform API Running' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});