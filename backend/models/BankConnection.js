const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const BankConnection = sequelize.define('BankConnection', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false
    },
    accessToken: {
        type: DataTypes.STRING,
        allowNull: false
    },
    itemId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    institutionName: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    timestamps: true
});

module.exports = BankConnection;
