const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Organization = sequelize.define('Organization', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    subscriptionPlan: {
        type: DataTypes.ENUM('free', 'pro', 'enterprise'),
        defaultValue: 'free',
    },
    settings: {
        type: DataTypes.JSONB,
        defaultValue: {},
    },
    branding: {
        type: DataTypes.JSONB,
        defaultValue: {
            primaryColor: '#6366f1',
            logoUrl: null,
            companyWebsite: ''
        }
    },
    categories: {
        type: DataTypes.JSONB,
        defaultValue: ['Food', 'Transport', 'Utilities', 'Entertainment', 'Shopping', 'Health', 'Travel', 'Services', 'Taxes', 'Salary', 'Rent', 'Others']
    }
});

module.exports = Organization;
