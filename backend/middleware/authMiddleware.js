const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];

            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');

            req.user = await User.findByPk(decoded.id, {
                attributes: { exclude: ['password'] }
            });

            if (!req.user) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }

            // Session Revocation Check
            const Session = require('../models/Session');
            const session = await Session.findOne({ where: { token, userId: req.user.id } });

            // If session exists and is explicitly marked inactive, reject
            if (session && !session.isActive) {
                return res.status(401).json({ message: 'This session has been revoked. Please login again.' });
            }

            // Revocation Check: Does token version match DB?
            if (decoded.tokenVersion !== undefined && req.user.tokenVersion !== decoded.tokenVersion) {
                return res.status(401).json({ message: 'Session expired or revoked. Please login again.' });
            }

            // Update session last active
            if (session) {
                session.lastActive = new Date();
                await session.save();
            }

            next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

module.exports = { protect };
