const { sequelize } = require('./config/db');

async function run() {
  try {
    const [results] = await sequelize.query('SELECT "id", "email", "role", "organizationId" FROM "Users"');
    console.log('--- User Data ---');
    results.forEach(u => {
      console.log(`ID: ${u.id}, Email: ${u.email}, Role: ${u.role}, OrgID: ${u.organizationId}`);
    });
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}
run();
