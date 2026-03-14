import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Lock, Bot, ArrowRight } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { setCredentials } from '../redux/slices/authSlice';
import { loginSchema } from '../utils/validators';
import type { LoginData } from '../utils/validators';
import api from '../utils/api';
import './Auth.css';

const Login: React.FC = () => {
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm<LoginData>({
        resolver: zodResolver(loginSchema)
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

    const onSubmit = async (data: LoginData) => {
        try {
            setLoading(true);
            setError('');
            const response = await api.post('/auth/login', data);
            dispatch(setCredentials(response.data));
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Invalid email or password');
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
                <h1 className="auth-title">Welcome Back</h1>
                <p className="auth-subtitle">Sign in to your Mooipanam account</p>

                {error && <div className="auth-error">{error}</div>}

                {/* <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
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
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <label>Password</label>
                            <Link to="/forgot-password" style={{ fontSize: '12px', color: 'var(--accent-primary)', fontWeight: 600 }}>Forgot?</Link>
                        </div>
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
                        {loading ? 'Signing in...' : 'Sign In'} <ArrowRight size={20} />
                    </button>
                </form> */}

                {/* <div className="auth-divider">
                    <span>OR CONTINUE WITH</span>
                </div> */}

                <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                    <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={() => setError('Google login failed')}
                        useOneTap
                        theme="filled_black"
                        shape="rectangular"
                        size="large"
                        text="continue_with"
                    />
                </div>

                {/* <p className="auth-footer">
                    Don't have an account? <Link to="/signup">Sign Up</Link>
                </p> */}
            </div>
        </div>
    );
};

export default Login;
