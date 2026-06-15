const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

// SQLite Configuration
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './finsight_db.sqlite',
    logging: false
});

const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('SQLite Connected...');

        // Load all models and their relationships
        require('../models');

        // Sync models (use { alter: true } in development, { force: false } in production)
        await sequelize.sync({ alter: false });

        console.log('Database synced');

    } catch (error) {
        console.error('Error connecting to SQLite Database:', error);
        console.error('Make sure credentials and file paths are correct');
        process.exit(1);
    }
};

module.exports = { sequelize, connectDB };


