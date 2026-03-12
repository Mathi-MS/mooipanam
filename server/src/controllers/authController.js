const User = require('../models/User');
const { generateToken, generateOTP } = require('../utils/authUtils');
const sendEmail = require('../utils/emailService');

// @desc    Register user & Send OTP
// @route   POST /api/auth/signup
const signup = async (req, res) => {
    const { name, email, password } = req.body;

    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            if (userExists.isVerified) {
                return res.status(400).json({ message: 'User already exists' });
            }
            // If user exists but not verified, update their info and send new OTP
            userExists.name = name;
            userExists.password = password;
            const otpCode = generateOTP();
            userExists.otp = {
                code: otpCode,
                expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 mins
            };
            await userExists.save();
            await sendEmail({
                to: email,
                subject: 'Verify your Mooi Panam account',
                html: `<h1>OTP: ${otpCode}</h1><p>Expires in 10 minutes.</p>`
            });
            return res.status(200).json({ message: 'OTP sent to your email' });
        }

        const otpCode = generateOTP();
        const user = await User.create({
            name,
            email,
            password,
            otp: {
                code: otpCode,
                expiresAt: new Date(Date.now() + 10 * 60 * 1000)
            }
        });

        await sendEmail({
            to: email,
            subject: 'Verify your Mooi Panam account',
            html: `<h1>OTP: ${otpCode}</h1><p>Expires in 10 minutes.</p>`
        });

        res.status(201).json({ message: 'OTP sent to your email' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
const verifyOTP = async (req, res) => {
    const { email, code } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user || user.otp.code !== code || user.otp.expiresAt < Date.now()) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        user.isVerified = true;
        user.otp = undefined;
        user.lastLogin = new Date();
        await user.save();

        res.status(200).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id)
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (user && (await user.comparePassword(password))) {
            if (!user.isVerified) {
                return res.status(401).json({ message: 'Please verify your email first' });
            }

            user.lastLogin = new Date();
            await user.save();

            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user._id)
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Forgot Password
// @route   POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const otpCode = generateOTP();
        user.otp = {
            code: otpCode,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000)
        };
        await user.save();

        await sendEmail({
            to: email,
            subject: 'Reset your Mooi Panam password',
            html: `<h1>OTP to reset password: ${otpCode}</h1><p>Expires in 10 minutes.</p>`
        });

        res.json({ message: 'OTP sent to your email' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Reset Password
// @route   POST /api/auth/reset-password
const resetPassword = async (req, res) => {
    const { email, code, newPassword } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user || user.otp.code !== code || user.otp.expiresAt < Date.now()) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        user.password = newPassword;
        user.otp = undefined;
        await user.save();

        res.json({ message: 'Password reset successful' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// @desc    Google Login
// @route   POST /api/auth/google-login
const googleLogin = async (req, res) => {
    const { tokenId } = req.body;

    try {
        const ticket = await client.verifyIdToken({
            idToken: tokenId,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const { name, email, sub: googleId, picture } = ticket.getPayload();

        let user = await User.findOne({ email });

        if (user) {
            // Update googleId if not present (transition from email/password to SSO)
            if (!user.googleId) {
                user.googleId = googleId;
                user.isVerified = true; // Google accounts are verified
                await user.save();
            }
        } else {
            user = await User.create({
                name,
                email,
                googleId,
                isVerified: true,
                role: 'user',
                lastLogin: new Date()
            });
        }

        if (user && !user.isNew) {
            user.lastLogin = new Date();
            await user.save();
        }

        res.status(200).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id)
        });
    } catch (error) {
        res.status(400).json({ message: 'Google authentication failed', error: error.message });
    }
};

module.exports = { signup, verifyOTP, login, forgotPassword, resetPassword, getProfile, googleLogin };
