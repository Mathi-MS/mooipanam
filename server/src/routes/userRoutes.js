const express = require('express');
const router = express.Router();
const { getAllUsers, updateUserRole } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All user management routes are restricted to superadmin (or admin if required)
router.get('/', protect, authorize('superadmin'), getAllUsers);
router.patch('/:id/role', protect, authorize('superadmin'), updateUserRole);

module.exports = router;
