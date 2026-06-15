const { sequelize } = require('./config/db');
const { User, Expense, Budget } = require('./models');

async function transferData() {
    try {
        await sequelize.authenticate();
        const targetUser = await User.findOne({ where: { email: 'gold@gmail.com' } });
        const sourceUser = await User.findOne({ where: { email: 'admin@finsight.com' } });

        if (!targetUser || !sourceUser) {
            console.log('User(s) not found');
            return;
        }

        console.log(`Transferring data from ${sourceUser.email} to ${targetUser.email}`);

        const expensesUpdated = await Expense.update(
            { userId: targetUser.id },
            { where: { userId: sourceUser.id } }
        );
        console.log(`Transferred ${expensesUpdated[0]} expenses.`);

        const budgetsUpdated = await Budget.update(
            { userId: targetUser.id },
            { where: { userId: sourceUser.id } }
        );
        console.log(`Transferred ${budgetsUpdated[0]} budgets.`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit();
    }
}

transferData();
