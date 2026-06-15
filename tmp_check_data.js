const { sequelize } = require('./backend/config/db');
const Expense = require('./backend/models/Expense');
const Budget = require('./backend/models/Budget');

async function checkData() {
    try {
        await sequelize.authenticate();
        const expensesCount = await Expense.count();
        const budgetsCount = await Budget.count();
        console.log(`Expenses count: ${expensesCount}`);
        console.log(`Budgets count: ${budgetsCount}`);

        if (expensesCount > 0) {
            const latestExpenses = await Expense.findAll({ limit: 5, order: [['createdAt', 'DESC']] });
            console.log('Latest Expenses:', JSON.stringify(latestExpenses, null, 2));
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit();
    }
}

checkData();
