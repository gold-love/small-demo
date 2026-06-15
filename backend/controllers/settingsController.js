const User = require('../models/User');
const Expense = require('../models/Expense');
const Budget = require('../models/Budget');
const Organization = require('../models/Organization');
const AuditLog = require('../models/AuditLog');
const Session = require('../models/Session');
const ApiKey = require('../models/ApiKey');
const { Op } = require('sequelize');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');
const { generate2FASecret, verify2FAToken, generateQRCode } = require('../utils/twoFactor');
const { logAudit } = require('../utils/audit');

// --- Profile & Preferences ---

const updateNotificationPreferences = async (req, res) => {
    try {
        const { budgetAlerts, expenseApproved, expenseRejected, weeklyReport, monthlyReport, budgetThreshold } = req.body;
        const user = await User.findByPk(req.user.id);
        user.notificationPreferences = {
            ...user.notificationPreferences,
            budgetAlerts: budgetAlerts !== undefined ? budgetAlerts : user.notificationPreferences.budgetAlerts,
            expenseApproved: expenseApproved !== undefined ? expenseApproved : user.notificationPreferences.expenseApproved,
            expenseRejected: expenseRejected !== undefined ? expenseRejected : user.notificationPreferences.expenseRejected,
            weeklyReport: weeklyReport !== undefined ? weeklyReport : user.notificationPreferences.weeklyReport,
            monthlyReport: monthlyReport !== undefined ? monthlyReport : user.notificationPreferences.monthlyReport
        };
        if (budgetThreshold !== undefined) user.budgetThreshold = budgetThreshold;
        await user.save();
        res.json({ message: 'Notification preferences updated', preferences: user.notificationPreferences });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

const updateAdvancedPreferences = async (req, res) => {
    try {
        const { fiscalYearStart, defaultCategory, defaultBudgetCategory, defaultCurrency, language } = req.body;
        const user = await User.findByPk(req.user.id);
        if (fiscalYearStart !== undefined) user.fiscalYearStart = fiscalYearStart;
        if (defaultCategory !== undefined) user.defaultCategory = defaultCategory;
        if (defaultBudgetCategory !== undefined) user.defaultBudgetCategory = defaultBudgetCategory;
        if (defaultCurrency !== undefined) user.defaultCurrency = defaultCurrency;
        if (language !== undefined) user.language = language;
        await user.save();
        res.json({ message: 'Preferences updated successfully' });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

const exportUserData = async (req, res) => {
    try {
        const userId = req.user.id;
        const { startDate, endDate } = req.query;
        const user = await User.findByPk(userId, { attributes: { exclude: ['password'] } });
        let expenseFilter = { userId };
        if (startDate || endDate) {
            expenseFilter.date = {};
            if (startDate) expenseFilter.date[Op.gte] = new Date(startDate);
            if (endDate) expenseFilter.date[Op.lte] = new Date(endDate);
        }
        const expenses = await Expense.findAll({ where: expenseFilter });
        const budgets = await Budget.findAll({ where: { userId } });
        res.json({ profile: user, expenses, budgets, exportedAt: new Date().toISOString() });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

const deleteAccount = async (req, res) => {
    try {
        const { password } = req.body;
        const user = await User.findByPk(req.user.id);
        if (!(await user.matchPassword(password))) return res.status(401).json({ message: 'Incorrect password' });
        await Expense.destroy({ where: { userId: user.id } });
        await Budget.destroy({ where: { userId: user.id } });
        await user.destroy();
        res.json({ message: 'Account deleted' });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

// --- Security & Sessions ---

const getActiveSessions = async (req, res) => {
    try {
        const sessions = await Session.findAll({ where: { userId: req.user.id, isActive: true }, order: [['createdAt', 'DESC']] });
        res.json(sessions);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

const revokeSpecificSession = async (req, res) => {
    try {
        await Session.update({ isActive: false }, { where: { id: req.params.id, userId: req.user.id } });
        await logAudit({
            req,
            action: 'Session Revocation',
            targetType: 'Session',
            targetId: req.params.id,
            details: { reason: 'manual_revoke' }
        });
        res.json({ message: 'Session revoked' });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

const revokeSessions = async (req, res) => {
    try {
        await Session.update({ isActive: false }, { where: { userId: req.user.id, id: { [Op.ne]: req.body.currentSessionId } } });
        await logAudit({
            req,
            action: 'Session Revocation',
            targetType: 'User',
            targetId: req.user.id,
            details: { scope: 'all_other_sessions' }
        });
        res.json({ message: 'All other sessions revoked' });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

// --- 2FA Management ---

const enable2FA = async (req, res) => {
    try {
        const { type } = req.body; // 'email' or 'totp'
        const user = await User.findByPk(req.user.id);
        
        user.twoFactorType = type === 'totp' ? 'totp' : 'email';

        if (user.twoFactorType === 'totp') {
            const { secret, qrcode } = await generate2FASecret(user.email);
            user.twoFactorSecret = secret; // temporarily store base32 secret before verification
            await user.save();
            res.json({ message: 'TOTP secret generated', secret, qrcode });
        } else {
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            user.twoFactorSecret = otp;
            user.twoFactorExpires = new Date(Date.now() + 10 * 60 * 1000);
            await user.save();
            await sendEmail({
                email: user.email,
                subject: 'Finsight - Enable 2FA Code',
                message: `Your verification code is ${otp}. Use this to enable 2FA in your settings.`
            });
            res.json({ message: 'Verification code sent to email' });
        }
    } catch (error) { res.status(500).json({ message: error.message }); }
};

const verify2FA = async (req, res) => {
    try {
        const { token } = req.body;
        const user = await User.findByPk(req.user.id);
        
        let isValid = false;
        
        if (user.twoFactorType === 'totp') {
            isValid = verify2FAToken(user.twoFactorSecret, token);
        } else {
            isValid = token === user.twoFactorSecret && new Date() < user.twoFactorExpires;
        }

        if (isValid) {
            user.twoFactorEnabled = true;
            if (user.twoFactorType === 'email') {
                user.twoFactorSecret = null;
                user.twoFactorExpires = null;
            }
            
            // Generate recovery codes
            const recoveryCodes = Array.from({ length: 8 }, () => crypto.randomBytes(4).toString('hex'));
            user.twoFactorRecoveryCodes = recoveryCodes;
            
            await user.save();
            await logAudit({
                req,
                action: 'Enable 2FA',
                targetType: 'User',
                targetId: user.id,
                details: { type: user.twoFactorType }
            });
            res.json({ message: '2FA enabled successfully', recoveryCodes });
        } else {
            res.status(400).json({ message: 'Invalid or expired code' });
        }
    } catch (error) { res.status(500).json({ message: error.message }); }
};

const disable2FA = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id);
        user.twoFactorEnabled = false;
        user.twoFactorSecret = null;
        user.twoFactorExpires = null;
        user.twoFactorRecoveryCodes = null;
        await user.save();
        await logAudit({
            req,
            action: 'Disable 2FA',
            targetType: 'User',
            targetId: user.id,
            details: {}
        });
        res.json({ message: '2FA disabled successfully' });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

const get2FAQR = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id);
        if (user.twoFactorType === 'totp' && user.twoFactorSecret) {
            const qrcode = await generateQRCode(user.twoFactorSecret, user.email);
            res.json({ qrcode, message: 'QR Code generated' });
        } else {
            res.json({ qrcode: null, message: 'Email-based 2FA is active or TOTP not set up' });
        }
    } catch (error) { res.status(500).json({ message: error.message }); }
};

// --- Organization & Team Management (Admin Only) ---

const getOrganizationSettings = async (req, res) => {
    try {
        const org = await Organization.findByPk(req.user.organizationId);
        if (!org) return res.status(404).json({ message: 'Organization not found' });
        res.json({
            name: org.name,
            branding: org.branding,
            categories: org.categories,
            ...org.settings
        });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

const updateOrganizationSettings = async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin only' });
        const org = await Organization.findByPk(req.user.organizationId);
        const { branding, categories, ...settings } = req.body;
        if (settings) org.settings = { ...org.settings, ...settings };
        if (branding) org.branding = { ...org.branding, ...branding };
        if (categories) org.categories = categories;
        await org.save();
        res.json({ message: 'Organization settings updated' });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

const getAllUsers = async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin only' });
        const users = await User.findAll({
            where: { organizationId: req.user.organizationId },
            attributes: ['id', 'name', 'email', 'role', 'jobTitle', 'department', 'createdAt', 'isActive']
        });
        res.json(users);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

const updateUserRole = async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin only' });
        const user = await User.findOne({ where: { id: req.params.id || req.body.id, organizationId: req.user.organizationId } });
        if (!user) return res.status(404).json({ message: 'User not found' });
        user.role = req.body.role;
        await user.save();
        res.json({ message: 'Role updated' });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

const toggleUserStatus = async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin only' });
        const user = await User.findOne({ where: { id: req.params.id || req.body.id, organizationId: req.user.organizationId } });
        if (!user) return res.status(404).json({ message: 'User not found' });
        user.isActive = !user.isActive;
        await user.save();
        res.json({ message: `User ${user.isActive ? 'activated' : 'deactivated'}` });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

const inviteUser = async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin only' });
        const { email, name, role } = req.body;
        // In a real app, send invitation email and create pending user
        res.json({ message: `Invitation sent to ${email}` });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

const exportOrganizationData = async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin only' });
        const expenses = await Expense.findAll({ where: { organizationId: req.user.organizationId } });
        const users = await User.findAll({ where: { organizationId: req.user.organizationId }, attributes: { exclude: ['password'] } });
        res.json({ expenses, users, exportedAt: new Date().toISOString() });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

const restoreOrganizationData = async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin only' });
        const { records } = req.body;
        if (!records) return res.status(400).json({ message: 'No data' });
        const cleanRecords = records.map(r => {
            const { id, createdAt, updatedAt, ...rest } = r;
            return { ...rest, organizationId: req.user.organizationId, status: 'pending' };
        });
        await Expense.bulkCreate(cleanRecords);
        res.json({ message: `Restored ${cleanRecords.length} records` });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

// --- API Key Management ---

const getApiKeys = async (req, res) => {
    try {
        const keys = await ApiKey.findAll({ where: { userId: req.user.id }, order: [['createdAt', 'DESC']] });
        res.json(keys);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

const createApiKey = async (req, res) => {
    try {
        const { name } = req.body;
        const rawKey = `fs_${crypto.randomBytes(24).toString('hex')}`;
        const apiKey = await ApiKey.create({
            name,
            key: rawKey,
            userId: req.user.id,
            organizationId: req.user.organizationId
        });
        res.status(201).json(apiKey);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

const revokeApiKey = async (req, res) => {
    try {
        const apiKey = await ApiKey.findOne({ where: { id: req.params.id, userId: req.user.id } });
        if (!apiKey) return res.status(404).json({ message: 'Key not found' });
        await apiKey.destroy();
        res.json({ message: 'Key revoked' });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

module.exports = {
    updateNotificationPreferences,
    updateAdvancedPreferences,
    exportUserData,
    deleteAccount,
    getActiveSessions,
    revokeSpecificSession,
    revokeSessions,
    enable2FA,
    verify2FA,
    disable2FA,
    get2FAQR,
    getOrganizationSettings,
    updateOrganizationSettings,
    getAllUsers,
    updateUserRole,
    toggleUserStatus,
    inviteUser,
    exportOrganizationData,
    restoreOrganizationData,
    getApiKeys,
    createApiKey,
    revokeApiKey
};
