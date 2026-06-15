const { sequelize } = require('./config/db');
const Expense = require('./models/Expense');
const { Op } = require('sequelize');

async function run() {
  try {
    const where = { userId: '255a700c-76e5-4e57-8448-2e8915499cc2' }; // the admin user ID
    if ('' !== '') {
        where[Op.or] = [
            { title: { [Op.iLike]: `%%` } },
            { category: { [Op.iLike]: `%%` } }
        ];
    }
    const { count, rows: expenses } = await Expense.findAndCountAll({
        where,
        order: [['date', 'DESC']],
        limit: 15,
        offset: 0,
    });
    console.log(`Success: ${count} expenses found.`);
  } catch (e) {
    console.error("Error:", e);
  }
  process.exit(0);
}
run();
