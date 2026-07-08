const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

const dialect = (process.env.DB_DIALECT || 'postgres').toLowerCase();

let sequelize;

if (dialect === 'postgres' || dialect === 'postgresql') {
    const databaseUrl = process.env.DATABASE_URL;
    const postgresConfig = {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
        username: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASS || 'postgres',
        database: process.env.DB_NAME || 'finsight_db',
        dialect: 'postgres',
        logging: false,
    };

    if (databaseUrl) {
        sequelize = new Sequelize(databaseUrl, {
            dialect: 'postgres',
            logging: false,
        });
    } else {
        sequelize = new Sequelize(postgresConfig.database, postgresConfig.username, postgresConfig.password, postgresConfig);
    }
} else if (dialect === 'sqlite') {
    sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: process.env.SQLITE_STORAGE || './finsight_db.sqlite',
        logging: false,
    });
} else {
    throw new Error(`Unsupported DB_DIALECT: ${dialect}. Use 'postgres' or 'sqlite'.`);
}

const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log(`${dialect === 'sqlite' ? 'SQLite' : 'PostgreSQL'} Connected...`);

        // Load all models and their relationships
        require('../models');

        // Sync models (use { alter: true } in development, { force: false } in production)
        await sequelize.sync({ alter: false });

        console.log('Database synced');

    } catch (error) {
        console.error(`Error connecting to ${dialect === 'sqlite' ? 'SQLite' : 'PostgreSQL'} Database:`, error);
        console.error('Make sure credentials and connection settings are correct');
        process.exit(1);
    }
};

module.exports = { sequelize, connectDB };


