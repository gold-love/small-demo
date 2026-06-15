const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true,
        },
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            isComplex(value) {
                // At least 8 characters, one letter, one number, and one special character
                if (!/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/.test(value)) {
                    throw new Error('Password must be at least 8 characters long and contain at least one letter, one number, and one special character.');
                }
            }
        }
    },
    jobTitle: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    department: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    phoneNumber: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    timezone: {
        type: DataTypes.STRING,
        defaultValue: 'UTC',
    },
    employeeId: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    role: {
        type: DataTypes.ENUM('employee', 'manager', 'admin'),
        defaultValue: 'employee',
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
    organizationId: {
        type: DataTypes.UUID,
        allowNull: true, // Allow null initially for backward compatibility or individual users
    },
    resetPasswordToken: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    resetPasswordExpire: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    emailNotifications: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
    newsletter: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    theme: {
        type: DataTypes.STRING,
        defaultValue: 'light',
    },
    preferredCurrency: {
        type: DataTypes.STRING,
        defaultValue: 'USD',
    },
    // Two-Factor Authentication
    twoFactorEnabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    twoFactorSecret: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    twoFactorExpires: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    twoFactorType: {
        type: DataTypes.STRING,
        defaultValue: 'email', // 'email' or 'totp'
    },
    twoFactorRecoveryCodes: {
        type: DataTypes.JSONB,
        allowNull: true,
    },
    // Granular Notification Preferences
    notificationPreferences: {
        type: DataTypes.JSONB,
        defaultValue: {
            budgetAlerts: true,
            expenseApproved: true,
            expenseRejected: true,
            weeklyReport: false,
            monthlyReport: true
        }
    },
    budgetThreshold: {
        type: DataTypes.INTEGER,
        defaultValue: 80,
    },
    isEmailVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    tokenVersion: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
    },
    // Fiscal Year Settings
    fiscalYearStart: {
        type: DataTypes.INTEGER, // Month number (1-12)
        defaultValue: 1, // January
    },
    // Default Settings for Quick Entry
    defaultCategory: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    defaultBudgetCategory: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    defaultCurrency: {
        type: DataTypes.STRING,
        defaultValue: 'USD',
    },
    language: {
        type: DataTypes.STRING,
        defaultValue: 'en', // 'en', 'am', 'es', etc.
    },
    bio: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    profilePicture: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    managerId: {
        type: DataTypes.UUID,
        allowNull: true,
    },
    bankAccountId: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    // Brute-force protection
    loginAttempts: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    lockUntil: {
        type: DataTypes.DATE,
        allowNull: true,
    },
}, {


    hooks: {
        beforeCreate: async (user) => {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(user.password, salt);
        },
        beforeUpdate: async (user) => {
            if (user.changed('password')) {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(user.password, salt);
            }
        },
    },
});

User.prototype.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = User;
