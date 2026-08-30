const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

// Mock Welfare API (e-Shram Government Scheme Lookup)

router.post('/check-status', async (req, res) => {
    try {
        const { workerId, phone } = req.body;
        const identifier = workerId || phone;

        if (!identifier) {
            return res.status(400).json({ success: false, error: 'Worker identifier (workerId or phone) is required' });
        }

        res.json({
            success: true,
            workerId: identifier,
            eligible: true,
            scheme: 'e-Shram Mock Scheme',
            insuranceEligible: true,
            status: 'ACTIVE',
            message: 'Worker is registered under e-Shram mock scheme and eligible for active insurance coverage'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/check-status', async (req, res) => {
    try {
        const identifier = req.query.workerId || req.query.phone;
        if (!identifier) {
            return res.status(400).json({ error: 'Worker identifier (workerId or phone) is required' });
        }

        res.json({
            success: true,
            workerId: identifier,
            eligible: true,
            scheme: 'e-Shram Mock Scheme',
            insuranceEligible: true,
            status: 'ACTIVE',
            message: 'Worker is registered under e-Shram mock scheme and eligible for active insurance coverage'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/', async (req, res) => {
    try {
        res.json({
            success: true,
            service: 'Mock Worker Welfare & Insurance API',
            scheme: 'e-Shram Mock Scheme',
            status: 'ACTIVE'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

// Allow running directly as standalone script: `node routes/welfareRoutes.js`
if (require.main === module) {
    require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
    const app = express();
    app.use(express.json());
    app.use('/api/welfare', router);
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Welfare route running standalone at http://localhost:${PORT}/api/welfare`));
}
