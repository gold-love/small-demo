const { sequelize } = require('./backend/config/db');
const Expense = require('./backend/models/Expense');
const User = require('./backend/models/User');

async function checkData() {
    try {
        await sequelize.authenticate();
        const expenses = await Expense.findAll();
        console.log(`Total Expenses in DB: ${expenses.length}`);

        for (const exp of expenses) {
            const user = await User.findByPk(exp.userId);
            console.log(`Expense: ${exp.title}, Amount: ${exp.amount}, User: ${user ? user.email : 'Unknown'} (${exp.userId})`);
        }

        const currentUser = await User.findOne({ where: { email: 'gold@gmail.com' } });
        console.log(`Current logged in user ID: ${currentUser ? currentUser.id : 'Not found'}`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit();
    }
}

checkData();
