const User = require('../models/User');

// @desc    Get all users with pagination and search
// @route   GET /api/users
// @access  Private/SuperAdmin
const getAllUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const { search, role } = req.query;
        let query = {};

        // Role filter
        if (role) {
            if (role === 'admin') {
                query.role = { $in: ['superadmin', 'admin'] };
            } else if (role === 'user') {
                query.role = 'user';
            }
        }

        // Search filter (name or email)
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const users = await User.find(query)
            .select('-password')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalUsers = await User.countDocuments(query);
        const totalPages = Math.ceil(totalUsers / limit);

        res.json({
            users,
            totalPages,
            currentPage: page,
            totalUsers
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update user role
// @route   PATCH /api/users/:id/role
// @access  Private/SuperAdmin
const updateUserRole = async (req, res) => {
    const { role } = req.body;

    if (!['admin', 'user'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role' });
    }

    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.role === 'superadmin') {
            return res.status(400).json({ message: 'Cannot change role of superadmin' });
        }

        user.role = role;
        await user.save();

        res.json({ message: `User role updated to ${role}`, user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getAllUsers, updateUserRole };
