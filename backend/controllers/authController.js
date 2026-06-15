const User = require('../models/User');
const Organization = require('../models/Organization');
const Session = require('../models/Session');
const jwt = require('jsonwebtoken');
const { parseUA } = require('../utils/uaParser');
const { verify2FAToken } = require('../utils/twoFactor');
const { logAudit } = require('../utils/audit');

const generateToken = (id, tokenVersion) => {
    return jwt.sign({ id, tokenVersion }, process.env.JWT_SECRET || 'secret', {
        expiresIn: '30d',
    });
};

const registerUser = async (req, res) => {
    const { name, email, password } = req.body;

    // Validation
    if (!name || name.trim().length < 2) {
        return res.status(400).json({ message: 'Name must be at least 2 characters' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
        return res.status(400).json({ message: 'Please provide a valid email address' });
    }
    if (!password || password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    try {
        const userExists = await User.findOne({ where: { email } });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Enterprise/SaaS Addition: Organization Support
        let organizationId = null;
        let userRole = 'employee';

        if (req.body.organizationName) {
            const org = await Organization.create({
                name: req.body.organizationName,
                subscriptionPlan: 'free'
            });
            organizationId = org.id;
            userRole = 'admin'; // First user of an organization is the admin
        }

        const user = await User.create({
            name,
            email,
            password,
            organizationId,
            role: userRole
        });

        if (user) {
            res.status(201).json({
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                theme: user.theme,
                emailNotifications: user.emailNotifications,
                jobTitle: user.jobTitle,
                department: user.department,
                phoneNumber: user.phoneNumber,
                timezone: user.timezone,
                employeeId: user.employeeId,
                twoFactorEnabled: user.twoFactorEnabled,
                profilePicture: user.profilePicture,
                organizationId: user.organizationId,
                tokenVersion: user.tokenVersion,
                token: generateToken(user.id, user.tokenVersion),


            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Check if user is active
        if (!user.isActive) {
            await logAudit({
                req,
                userId: user.id,
                organizationId: user.organizationId,
                action: 'Login Failed',
                targetType: 'User',
                targetId: user.id,
                details: { method: 'password', reason: 'account_deactivated' }
            });
            return res.status(403).json({ message: 'Your account has been deactivated. Please contact your administrator.' });
        }

        // Check if account is locked
        if (user.lockUntil && user.lockUntil > Date.now()) {
            const minutesRemaining = Math.ceil((user.lockUntil - Date.now()) / (60 * 1000));
            return res.status(403).json({
                message: `Account is locked due to too many failed attempts. Try again in ${minutesRemaining} minutes.`
            });
        }

        if (await user.matchPassword(password)) {
            // Successful login - reset attempts
            user.loginAttempts = 0;
            user.lockUntil = null;
            await user.save();

            // Enterprise Check: Is 2FA enabled?
            if (user.twoFactorEnabled) {
                if (user.twoFactorType === 'email') {
                    const sendEmail = require('../utils/sendEmail');
                    const otp = Math.floor(100000 + Math.random() * 900000).toString();

                    user.twoFactorSecret = otp;
                    user.twoFactorExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
                    await user.save();

                    await sendEmail({
                        email: user.email,
                        subject: 'Finsight - Your Login OTP Code',
                        message: `Your login code is ${otp}. It expires in 10 minutes.`
                    });
                }

                return res.json({
                    requires2FA: true,
                    userId: user.id,
                    twoFactorType: user.twoFactorType,
                    message: user.twoFactorType === 'email' 
                        ? 'Two-factor authentication required. An OTP has been sent to your email.' 
                        : 'Two-factor authentication required. Please enter your authenticator app code.'
                });
            }

            // Fetch organization settings
            const Organization = require('../models/Organization');
            const org = await Organization.findByPk(user.organizationId);
            const orgSettings = org ? org.settings : {};

            await logAudit({
                req,
                userId: user.id,
                organizationId: user.organizationId,
                action: 'Login',
                targetType: 'User',
                targetId: user.id,
                details: { method: 'password' }
            });

            const token = generateToken(user.id, user.tokenVersion);

            // Create Session Tracking
            const uaInfo = parseUA(req.headers['user-agent']);
            await Session.create({
                userId: user.id,
                token: token,
                ipAddress: req.ip || req.connection.remoteAddress,
                userAgent: req.headers['user-agent'],
                browser: uaInfo.browser,
                os: uaInfo.os,
                deviceType: uaInfo.device
            });

            res.json({
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                theme: user.theme,
                organizationId: user.organizationId,
                preferredCurrency: user.preferredCurrency,
                emailNotifications: user.emailNotifications,
                jobTitle: user.jobTitle,
                department: user.department,
                phoneNumber: user.phoneNumber,
                timezone: user.timezone,
                employeeId: user.employeeId,
                twoFactorEnabled: user.twoFactorEnabled,
                profilePicture: user.profilePicture,
                orgSettings: {
                    expenseModuleEnabled: orgSettings.expenseModuleEnabled !== undefined ? orgSettings.expenseModuleEnabled : true,
                    budgetModuleEnabled: orgSettings.budgetModuleEnabled !== undefined ? orgSettings.budgetModuleEnabled : true,
                },
                branding: org ? org.branding : null,
                token,
            });
        } else {
            // Failed password attempt
            user.loginAttempts += 1;
            let message = 'Invalid email or password';

            if (user.loginAttempts >= 5) {
                user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minute lockout
                message = 'Account locked for 15 minutes due to too many failed attempts.';
            } else if (user.loginAttempts >= 3) {
                message = `Invalid password. Warning: ${5 - user.loginAttempts} attempts remaining before account lockout.`;
            }

            await user.save();
            
            await logAudit({
                req,
                userId: user.id,
                organizationId: user.organizationId,
                action: 'Login Failed',
                targetType: 'User',
                targetId: user.id,
                details: { method: 'password', reason: 'invalid_credentials', attempts: user.loginAttempts }
            });

            res.status(401).json({ message });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Verify 2FA Token for Login
// @route   POST /api/auth/verify-2fa
// @access  Public
const verify2FALogin = async (req, res) => {
    const { userId, token } = req.body;

    try {
        const user = await User.findByPk(userId);

        if (!user || !user.twoFactorEnabled || !user.isActive) {
            return res.status(400).json({ message: 'Invalid request' });
        }

        // Check if account is locked
        if (user.lockUntil && user.lockUntil > Date.now()) {
            const minutesRemaining = Math.ceil((user.lockUntil - Date.now()) / (60 * 1000));
            return res.status(403).json({
                message: `Account is locked. Try again in ${minutesRemaining} minutes.`
            });
        }

        let isValid = false;
        let isRecovery = false;

        if (user.twoFactorType === 'totp') {
            const { verify2FAToken } = require('../utils/twoFactor');
            isValid = verify2FAToken(user.twoFactorSecret, token);
            if (!isValid && user.twoFactorRecoveryCodes && user.twoFactorRecoveryCodes.includes(token)) {
                isValid = true;
                isRecovery = true;
                user.twoFactorRecoveryCodes = user.twoFactorRecoveryCodes.filter(c => c !== token);
            }
        } else {
            isValid = token === user.twoFactorSecret && new Date() < user.twoFactorExpires;
            if (!isValid && user.twoFactorRecoveryCodes && user.twoFactorRecoveryCodes.includes(token)) {
                isValid = true;
                isRecovery = true;
                user.twoFactorRecoveryCodes = user.twoFactorRecoveryCodes.filter(c => c !== token);
            }
        }

        if (!isValid) {
            user.loginAttempts += 1;
            let message = 'Invalid OTP or Recovery code';

            if (user.loginAttempts >= 5) {
                user.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
                message = 'Too many failed OTP attempts. Account locked for 15 minutes.';
            }

            await user.save();
            return res.status(401).json({ message });
        }

        // Success - clear email OTP if used
        if (user.twoFactorType === 'email') {
            user.twoFactorSecret = null;
            user.twoFactorExpires = null;
        }

        // Success - reset attempts
        user.loginAttempts = 0;
        user.lockUntil = null;
        await user.save();

        // Fetch organization settings
        const Organization = require('../models/Organization');
        const org = await Organization.findByPk(user.organizationId);
        const orgSettings = org ? org.settings : {};

        const token = generateToken(user.id, user.tokenVersion);

        // Create Session Tracking
        const uaInfo = parseUA(req.headers['user-agent']);
        await Session.create({
            userId: user.id,
            token: token,
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.headers['user-agent'],
            browser: uaInfo.browser,
            os: uaInfo.os,
            deviceType: uaInfo.device
        });

        res.json({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            theme: user.theme,
            organizationId: user.organizationId,
            preferredCurrency: user.preferredCurrency,
            emailNotifications: user.emailNotifications,
            jobTitle: user.jobTitle,
            department: user.department,
            phoneNumber: user.phoneNumber,
            timezone: user.timezone,
            employeeId: user.employeeId,
            twoFactorEnabled: user.twoFactorEnabled,
            profilePicture: user.profilePicture,
            orgSettings: {
                expenseModuleEnabled: orgSettings.expenseModuleEnabled !== undefined ? orgSettings.expenseModuleEnabled : true,
                budgetModuleEnabled: orgSettings.budgetModuleEnabled !== undefined ? orgSettings.budgetModuleEnabled : true,
            },
            branding: org ? org.branding : null,
            token,
        });

        await logAudit({
            req,
            userId: user.id,
            organizationId: user.organizationId,
            action: 'Login',
            targetType: 'User',
            targetId: user.id,
            details: { method: 'email_otp' }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getUserProfile = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id);

        if (user) {
            res.json({
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                theme: user.theme,
                jobTitle: user.jobTitle,
                department: user.department,
                phoneNumber: user.phoneNumber,
                timezone: user.timezone,
                employeeId: user.employeeId,
                preferredCurrency: user.preferredCurrency,
                language: user.language,
                emailNotifications: user.emailNotifications,
                twoFactorEnabled: user.twoFactorEnabled,
                profilePicture: user.profilePicture
            });

        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateUserProfile = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id);

        if (user) {
            user.name = req.body.name || user.name;
            user.email = req.body.email || user.email;
            user.jobTitle = req.body.jobTitle !== undefined ? req.body.jobTitle : user.jobTitle;
            user.department = req.body.department !== undefined ? req.body.department : user.department;
            user.phoneNumber = req.body.phoneNumber !== undefined ? req.body.phoneNumber : user.phoneNumber;
            user.timezone = req.body.timezone || user.timezone;
            user.employeeId = req.body.employeeId !== undefined ? req.body.employeeId : user.employeeId;
            user.preferredCurrency = req.body.preferredCurrency || user.preferredCurrency;
            user.language = req.body.language || user.language;
            user.theme = req.body.theme || user.theme;
            user.bio = req.body.bio !== undefined ? req.body.bio : user.bio;
            user.emailNotifications = req.body.emailNotifications !== undefined ? req.body.emailNotifications : user.emailNotifications;
            user.twoFactorEnabled = req.body.twoFactorEnabled !== undefined ? req.body.twoFactorEnabled : user.twoFactorEnabled;
            if (req.body.password) {
                if (!req.body.currentPassword) {
                    return res.status(400).json({ message: 'Current password is required to set a new password' });
                }
                const isMatch = await user.matchPassword(req.body.currentPassword);
                if (!isMatch) {
                    return res.status(401).json({ message: 'Incorrect current password' });
                }
                user.password = req.body.password;
            }

            const updatedUser = await user.save();

            if (req.body.password) {
                await logAudit({
                    req,
                    action: 'Password Change',
                    targetType: 'User',
                    targetId: user.id,
                    details: {}
                });
            }

            res.json({
                id: updatedUser.id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                theme: updatedUser.theme,
                jobTitle: updatedUser.jobTitle,
                department: updatedUser.department,
                phoneNumber: updatedUser.phoneNumber,
                timezone: updatedUser.timezone,
                employeeId: updatedUser.employeeId,
                profilePicture: updatedUser.profilePicture,
                organizationId: updatedUser.organizationId,
                tokenVersion: updatedUser.tokenVersion,
                preferredCurrency: updatedUser.preferredCurrency,
                language: updatedUser.language,
                bio: updatedUser.bio,
                orgSettings: req.user.orgSettings,
                branding: req.user.branding,
                token: generateToken(updatedUser.id, updatedUser.tokenVersion),
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all users (Admin only)
// @route   GET /api/auth/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized as admin' });
        }
        const users = await User.findAll({
            attributes: ['id', 'name', 'email', 'role', 'createdAt']
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update user role (Admin only)
// @route   PUT /api/auth/users/:id/role
// @access  Private/Admin
const updateUserRole = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized as admin' });
        }
        const user = await User.findByPk(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Prevent admin from demoting themselves (optional safety)
        if (user.id === req.user.id && req.body.role !== 'admin') {
            return res.status(400).json({ message: 'You cannot demote yourself' });
        }

        user.role = req.body.role || user.role;
        await user.save();
        res.json({ message: 'User role updated successfully', user: { id: user.id, name: user.name, role: user.role } });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete user (Admin only)
// @route   DELETE /api/auth/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized as admin' });
        }
        const user = await User.findByPk(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        if (user.id === req.user.id) {
            return res.status(400).json({ message: 'You cannot delete yourself' });
        }
        await user.destroy();
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateProfilePicture = async (req, res) => {
    try {
        console.log('Upload Request Received');
        const user = await User.findByPk(req.user.id);
        if (!user) {
            console.log('User not found:', req.user.id);
            return res.status(404).json({ message: 'User not found' });
        }

        if (req.file) {
            console.log('File received:', req.file.path);
            // Internal path normalization for web access
            const normalizedPath = req.file.path.replace(/\\/g, '/');
            user.profilePicture = normalizedPath;
            await user.save();
            res.json({ message: 'Profile picture updated', profilePicture: normalizedPath });
        } else {

            console.log('No file in request');
            res.status(400).json({ message: 'No file uploaded' });
        }
    } catch (error) {
        console.error('Upload Controller Error:', error);
        res.status(500).json({ message: error.message });
    }
};


module.exports = {
    registerUser,
    loginUser,
    verify2FALogin,
    getUserProfile,
    updateUserProfile,
    getAllUsers,
    updateUserRole,
    deleteUser,
    updateProfilePicture
};


