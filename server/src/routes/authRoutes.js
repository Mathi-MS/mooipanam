const express = require('express');
const {
    signup,
    verifyOTP,
    login,
    forgotPassword,
    resetPassword,
    getProfile,
    googleLogin
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

// Email/Password Auth
router.post('/signup', signup);
router.post('/verify-otp', verifyOTP);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Google Auth (Client-side)
router.post('/google-login', googleLogin);

// Profile - Protected
router.get('/profile', protect, getProfile);

module.exports = router;
