const { sequelize, User, Expense, Budget } = require('./models/index');
const { Op } = require('sequelize');

async function fixData() {
    try {
        await sequelize.authenticate();
        const user = await User.findOne({ where: { email: 'gold@gmail.com' } });
        if (!user) {
            console.log('User gold@gmail.com not found');
            return;
        }

        const orgId = user.organizationId;
        const userId = user.id;

        console.log(`Fixing data for User: ${userId} (${user.name}) and Org: ${orgId}`);

        const expensesUpdated = await Expense.update(
            { userId: userId, organizationId: orgId },
            { where: { [Op.or]: [{ userId: null }, { organizationId: null }] } }
        );
        console.log(`Updated ${expensesUpdated[0]} matching expenses.`);

        const budgetsUpdated = await Budget.update(
            { userId: userId, organizationId: orgId },
            { where: { [Op.or]: [{ userId: null }, { organizationId: null }] } }
        );
        console.log(`Updated ${budgetsUpdated[0]} matching budgets.`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit();
    }
}

fixData();
