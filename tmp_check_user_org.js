const { sequelize } = require('./backend/config/db');
const User = require('./backend/models/User');
const Organization = require('./backend/models/Organization');

async function checkUserOrg() {
    try {
        await sequelize.authenticate();
        const user = await User.findOne({ where: { email: 'gold@gmail.com' } });
        console.log('User:', JSON.stringify(user, null, 2));

        if (user && user.organizationId) {
            const org = await Organization.findByPk(user.organizationId);
            console.log('Organization:', JSON.stringify(org, null, 2));
        } else {
            console.log('User has no organizationId');
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit();
    }
}

checkUserOrg();
