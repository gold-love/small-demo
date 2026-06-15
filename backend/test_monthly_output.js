const { sequelize } = require('./config/db');
const { Expense } = require('./models');
const { fn, col } = require('sequelize');

async function run() {
  const dateFilter = { userId: '255a700c-76e5-4e57-8448-2e8915499cc2' }; // User with expenses
  const monthAttr = [fn('trim', fn('to_char', col('date'), 'Month')), 'month'];
  const groupBy = [fn('to_char', col('date'), 'Month'), sequelize.literal("EXTRACT(MONTH FROM date)")];
  const orderBy = [sequelize.literal("EXTRACT(MONTH FROM date)"), 'ASC'];

  try {
    const report = await Expense.findAll({
      where: dateFilter,
      attributes: [
        monthAttr,
        [fn('SUM', col('amount')), 'total']
      ],
      group: groupBy,
      order: [orderBy]
    });
    console.log('--- Monthly Report JSON ---');
    console.log(JSON.stringify(report, null, 2));
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}
run();
