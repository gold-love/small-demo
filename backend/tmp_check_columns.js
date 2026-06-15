const { sequelize } = require('./config/db');

async function checkColumns() {
    try {
        await sequelize.authenticate();
        // For PostgreSQL
        const [results, metadata] = await sequelize.query(
            "SELECT column_name FROM information_schema.columns WHERE table_name = 'Expenses'"
        );
        console.log('Columns in Expenses table:', results.map(r => r.column_name));
    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit();
    }
}

checkColumns();
