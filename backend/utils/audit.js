const AuditLog = require('../models/AuditLog');
const logger = require('./logger');

const logAudit = async ({ req, action, targetType, targetId, details, userId, organizationId }) => {
    try {
        await AuditLog.create({
            userId: userId || (req.user ? req.user.id : null),
            organizationId: organizationId || (req.user ? req.user.organizationId : null),
            action,
            targetType,
            targetId,
            details,
            ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1'
        });
    } catch (error) {
        logger.error('Audit Logging Failed:', error);
    }
};

module.exports = { logAudit };
