const { sequelize } = require('./config/db');

async function fixAuditLogs() {
    try {
        console.log('Connecting to database...');
        await sequelize.authenticate();
        console.log('Altering AuditLogs table...');
        await sequelize.query('ALTER TABLE "AuditLogs" ALTER COLUMN "organizationId" DROP NOT NULL;');
        console.log('Successfully altered AuditLogs table to allow null organizationId.');
    } catch (error) {
        console.error('Error altering table:', error);
    } finally {
        process.exit();
    }
}

fixAuditLogs();
