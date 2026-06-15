const { sequelize } = require('./config/db');

async function checkUser() {
    try {
        await sequelize.authenticate();
        const [results] = await sequelize.query("SELECT id, name, email FROM \"Users\" WHERE id = '18897f83-d302-4fa3-baa1-c7dd466d635e'");
        console.log('User found:', JSON.stringify(results, null, 2));
    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit();
    }
}

checkUser();
