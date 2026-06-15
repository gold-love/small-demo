const { sequelize } = require('./config/db');

async function fixSchema() {
    try {
        console.log('Altering AuditLogs table to make organizationId nullable...');
        await sequelize.query('ALTER TABLE "AuditLogs" ALTER COLUMN "organizationId" DROP NOT NULL;');
        console.log('Success!');
    } catch (error) {
        console.error('Error fixing schema:', error);
    } finally {
        await sequelize.close();
    }
}

fixSchema();
