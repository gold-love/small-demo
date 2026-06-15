const { sequelize } = require('./config/db');
const { User, Expense, Budget } = require('./models');

async function run() {
  await sequelize.sync();
  const exps = await Expense.count();
  const buds = await Budget.count();
  const users = await User.count();
  console.log(`Expenses: ${exps}, Budgets: ${buds}, Users: ${users}`);
  process.exit(0);
}
run();
