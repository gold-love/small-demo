const { sequelize } = require('./config/db');

async function checkUserSchema() {
    try {
        const [results] = await sequelize.query(`
            SELECT column_name, is_nullable, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'Users';
        `);
        console.log('Users Schema:');
        console.table(results);
    } catch (error) {
        console.error('Error checking schema:', error);
    } finally {
        await sequelize.close();
    }
}

checkUserSchema();
