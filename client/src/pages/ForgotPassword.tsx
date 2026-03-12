import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Bot, ArrowRight, ChevronLeft } from 'lucide-react';
import { forgotPasswordSchema } from '../utils/validators';
import type { ForgotPasswordData } from '../utils/validators';
import api from '../utils/api';
import './Auth.css';

const ForgotPassword: React.FC = () => {
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm<ForgotPasswordData>({
        resolver: zodResolver(forgotPasswordSchema)
    });

    const onSubmit = async (data: ForgotPasswordData) => {
        try {
            setLoading(true);
            setError('');
            await api.post('/auth/forgot-password', data);
            setSuccess(true);
            setTimeout(() => {
                navigate('/reset-password', { state: { email: data.email } });
            }, 2000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Email not found');
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
                <h1 className="auth-title">Forgot Password?</h1>
                <p className="auth-subtitle">Enter your email and we'll send you an OTP to reset your password</p>

                {error && <div className="auth-error">{error}</div>}
                {success && <div className="auth-error" style={{ background: '#f0fdf4', color: '#16a34a' }}>OTP sent! Redirecting...</div>}

                <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
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

                    <button type="submit" className="auth-btn" disabled={loading || success}>
                        {loading ? 'Sending...' : 'Send OTP'} <ArrowRight size={20} />
                    </button>

                    <Link to="/login" className="auth-footer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
                        <ChevronLeft size={18} /> Back to Sign In
                    </Link>
                </form>
            </div>
        </div>
    );
};

export default ForgotPassword;
