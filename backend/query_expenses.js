const { sequelize } = require('./config/db');

async function run() {
  try {
    const [results] = await sequelize.query('SELECT "id", "userId", "organizationId", "amount", "status" FROM "Expenses"');
    console.log('--- Expense Data ---');
    results.forEach(e => {
      console.log(`ID: ${e.id}, UserID: ${e.userId}, OrgID: ${e.organizationId}, Amount: ${e.amount}, Status: ${e.status}`);
    });
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}
run();
