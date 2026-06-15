const { sequelize } = require('./config/db');
const models = require('./models');

async function checkAllData() {
    try {
        await sequelize.authenticate();
        for (const [name, model] of Object.entries(models)) {
            if (model.count) {
                const count = await model.count();
                console.log(`${name}: ${count}`);
            }
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit();
    }
}

checkAllData();
