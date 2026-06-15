const { sequelize } = require('./config/db');
const { User, Expense, Budget } = require('./models');

async function run() {
  await sequelize.sync();
  const expenses = await Expense.findAll({ attributes: ['userId', 'amount'] });
  const budgets = await Budget.findAll({ attributes: ['userId', 'amount'] });
  const users = await User.findAll({ attributes: ['id', 'email'] });
  
  console.log('--- Users ---');
  users.forEach(u => console.log(`ID: ${u.id}, Email: ${u.email}`));
  
  console.log('\n--- Expense User IDs ---');
  const expUserIds = [...new Set(expenses.map(e => e.userId))];
  expUserIds.forEach(id => console.log(`UserID: ${id}, Count: ${expenses.filter(e => e.userId === id).length}`));
  
  console.log('\n--- Budget User IDs ---');
  const budUserIds = [...new Set(budgets.map(b => b.userId))];
  budUserIds.forEach(id => console.log(`UserID: ${id}, Count: ${budgets.filter(b => b.userId === id).length}`));
  
  process.exit(0);
}
run();
