const { sequelize } = require('./config/db');
const Expense = require('./models/Expense');

async function debugData() {
    try {
        await sequelize.authenticate();
        const expense = await Expense.findOne();
        if (expense) {
            console.log('Expense keys:', Object.keys(expense.dataValues));
            console.log('Expense sample data:', JSON.stringify(expense.dataValues, null, 2));
        } else {
            console.log('No expenses found');
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit();
    }
}

debugData();
