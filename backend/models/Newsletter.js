const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Newsletter = sequelize.define('Newsletter', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true,
        },
    },
    status: {
        type: DataTypes.ENUM('active', 'unsubscribed'),
        defaultValue: 'active',
    },
}, {
    timestamps: true,
});

module.exports = Newsletter;
