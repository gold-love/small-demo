const { sequelize } = require('./config/db');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

async function resetAdmin() {
    try {
        console.log('Connecting to database...');
        await sequelize.authenticate();

        // Load models
        require('./models');

        // Find all admins
        const admins = await User.findAll({ where: { role: 'admin' } });

        if (admins.length === 0) {
            console.log('No admin users found in the database!');
            process.exit(1);
        }

        console.log(`Found ${admins.length} admin(s):`);
        admins.forEach(a => console.log(`- ${a.email} (ID: ${a.id})`));

        // Get the first admin
        const admin = admins[0];

        console.log(`\nResetting password for ${admin.email}...`);

        // We shouldn't hash it here if the User model has a beforeUpdate/beforeSave hook for hashing. 
        // Let's check how password works. SeedAdmin did: 
        // await User.create({ password: adminPassword }); -> implies hook exists.
        // We can just update it using the model instances.

        admin.password = 'gold1234';

        // also disable 2FA to make sure you can login easily now
        admin.twoFactorEnabled = false;
        admin.twoFactorSecret = null;

        await admin.save();

        console.log('-----------------------------------');
        console.log('ADMIN ACCOUNT RESET SUCCESSFULLY!');
        console.log('Email to use: ' + admin.email);
        console.log('New Password: gold1234');
        console.log('2FA has been temporarily disabled so you can log in easily.');
        console.log('-----------------------------------');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit();
    }
}

resetAdmin();
