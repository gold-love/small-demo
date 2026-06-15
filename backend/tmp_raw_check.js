const { sequelize } = require('./config/db');

async function rawCheck() {
    try {
        await sequelize.authenticate();
        const [results] = await sequelize.query("SELECT id, title, \"userId\", \"organizationId\" FROM \"Expenses\" LIMIT 5");
        console.log('Raw sample data:', JSON.stringify(results, null, 2));
    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit();
    }
}

rawCheck();
