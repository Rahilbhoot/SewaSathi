const jwt = require('jsonwebtoken');
const Worker = require('../models/Worker');
const Customer = require('../models/Customer');

const protect = async (req, res, next) => {
    let token;

    if (req.header.authorization && req.header.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            if (decoded.role === 'worker') {
                req.user = await Worker.findById(decoded.id).select('-password');
            } else if (decoded.role === 'customer') {
                req.user = await Customer.findById(decoded.id).select('-password');
            } else if (decoded.role === 'admin') {
                req.user = { id: decoded.id, role: 'admin' };
            }

            if (!req.user) {
                return res.status(401).json({ error: 'Not authorized, user not found' });
            }

            next();
        } catch (error) {
            res.status(401).json({ error: 'Not authorized, token failed' });
        }
    }
    else {
        res.status(401).json({ error: 'Not authorized, no token' });
    }
}

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: `User role ${req.user.role} is not authorized to access this route` });
        }
        next();
    };
};

module.exports = { protect, authorize };