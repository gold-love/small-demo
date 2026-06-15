const { sequelize } = require('./config/db');
const { Expense } = require('./models');

async function run() {
  await sequelize.sync();
  const expenses = await Expense.findAll();
  
  console.log('--- Expense Data ---');
  expenses.forEach(e => {
    console.log(`ID: ${e.id}, UserID: ${e.userId}, OrgID: ${e.organizationId}, Amount: ${e.amount}, Status: ${e.status}`);
  });
  
  process.exit(0);
}
run();
