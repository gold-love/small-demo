const { sequelize } = require('./config/db');
const { Expense } = require('./models');

async function run() {
  await sequelize.sync();
  const expenses = await Expense.findAll({ attributes: ['status', 'amount'] });
  
  const statusCounts = {};
  expenses.forEach(e => {
    statusCounts[e.status] = (statusCounts[e.status] || 0) + 1;
  });
  
  console.log('--- Expense Status Counts ---');
  console.log(statusCounts);
  
  process.exit(0);
}
run();
