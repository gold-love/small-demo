const { sequelize } = require('./config/db');

async function checkExpenseSchema() {
    try {
        const [results] = await sequelize.query(`
            SELECT column_name, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'Expenses'
            ORDER BY column_name;
        `);
        results.forEach(row => console.log(`${row.column_name}: ${row.is_nullable}`));
    } catch (error) {
        console.error('Error checking schema:', error);
    } finally {
        await sequelize.close();
    }
}

checkExpenseSchema();
