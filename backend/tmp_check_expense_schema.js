const { sequelize } = require('./config/db');

async function checkExpenseSchema() {
    try {
        const [results] = await sequelize.query(`
            SELECT column_name, is_nullable, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'Expenses';
        `);
        console.log('Expenses Schema:');
        console.table(results);
    } catch (error) {
        console.error('Error checking schema:', error);
    } finally {
        await sequelize.close();
    }
}

checkExpenseSchema();
