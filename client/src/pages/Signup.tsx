import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Lock, User, Bot, ArrowRight } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { setCredentials } from '../redux/slices/authSlice';
import { signupSchema } from '../utils/validators';
import type { SignupData } from '../utils/validators';
import api from '../utils/api';
import './Auth.css';

const Signup: React.FC = () => {
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm<SignupData>({
        resolver: zodResolver(signupSchema)
    });

    const handleGoogleSuccess = async (credentialResponse: any) => {
        try {
            setLoading(true);
            const response = await api.post('/auth/google-login', {
                tokenId: credentialResponse.credential
            });
            dispatch(setCredentials(response.data));
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Google authentication failed');
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = async (data: SignupData) => {
        try {
            setLoading(true);
            setError('');
            await api.post('/auth/signup', data);
            // On success, redirect to OTP verification
            navigate('/verify-otp', { state: { email: data.email } });
        } catch (err: any) {
            setError(err.response?.data?.message || 'Something went wrong during signup');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-logo-wrapper">
                    <Bot size={56} />
                </div>
                <h1 className="auth-title">Create Account</h1>
                <p className="auth-subtitle">Join Mooipanam today and start your journey</p>

                {error && <div className="auth-error">{error}</div>}

                <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
                    <div className="form-group">
                        <label>Full Name</label>
                        <div className="input-wrapper">
                            <User className="input-icon" size={20} />
                            <input
                                {...register('name')}
                                type="text"
                                placeholder="Enter your full name"
                            />
                        </div>
                        {errors.name && <span className="error-msg">{errors.name.message}</span>}
                    </div>

                    <div className="form-group">
                        <label>Email Address</label>
                        <div className="input-wrapper">
                            <Mail className="input-icon" size={20} />
                            <input
                                {...register('email')}
                                type="email"
                                placeholder="name@company.com"
                            />
                        </div>
                        {errors.email && <span className="error-msg">{errors.email.message}</span>}
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <div className="input-wrapper">
                            <Lock className="input-icon" size={20} />
                            <input
                                {...register('password')}
                                type="password"
                                placeholder="••••••••"
                            />
                        </div>
                        {errors.password && <span className="error-msg">{errors.password.message}</span>}
                    </div>

                    <button type="submit" className="auth-btn" disabled={loading}>
                        {loading ? 'Creating Account...' : 'Sign Up'} <ArrowRight size={20} />
                    </button>
                </form>

                <div className="auth-divider">
                    <span>OR CONTINUE WITH</span>
                </div>

                <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                    <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={() => setError('Google signup failed')}
                        useOneTap
                        theme="filled_black"
                        shape="rectangular"
                        size="large"
                        text="continue_with"
                    />
                </div>

                <p className="auth-footer">
                    Already have an account? <Link to="/login">Sign In</Link>
                </p>
            </div>
        </div>
    );
};

export default Signup;
