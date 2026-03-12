const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const seedSuperAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        const superAdminEmail = 'superadmin@mooipanam.com';
        const existing = await User.findOne({ email: superAdminEmail });

        if (!existing) {
            await User.create({
                name: 'Super Admin',
                email: superAdminEmail,
                password: 'adminpassword123', // User should change this
                role: 'superadmin',
                isVerified: true
            });
            console.log('Super Admin created successfully');
        } else {
            console.log('Super Admin already exists');
        }

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

seedSuperAdmin();
