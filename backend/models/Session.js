const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Session = sequelize.define('Session', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    token: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    ipAddress: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    userAgent: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    deviceType: {
        type: DataTypes.STRING, // e.g., mobile, desktop, tablet
        allowNull: true,
    },
    browser: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    os: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    lastActive: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    }
});

module.exports = Session;
