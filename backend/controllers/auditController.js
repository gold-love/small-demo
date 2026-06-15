const AuditLog = require('../models/AuditLog');
const User = require('../models/User');

// @desc    Get organization audit logs (Admin only)
// @route   GET /api/settings/audit-logs
// @access  Private/Admin
const getAuditLogs = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized as an admin' });
        }
        const logs = await AuditLog.findAll({
            where: { organizationId: req.user.organizationId },
            include: [{ model: User, attributes: ['name', 'email'] }],
            order: [['createdAt', 'DESC']],
            limit: 100
        });
        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get personal security logs
// @route   GET /api/settings/security-logs
// @access  Private
const getMySecurityLogs = async (req, res) => {
    try {
        const { Op } = require('sequelize');
        const logs = await AuditLog.findAll({
            where: {
                userId: req.user.id,
                action: {
                    [Op.in]: ['Login', 'Login Failed', 'Password Change', 'Enable 2FA', 'Disable 2FA', 'Session Revocation']
                }
            },
            order: [['createdAt', 'DESC']],
            limit: 20
        });
        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getAuditLogs, getMySecurityLogs };
