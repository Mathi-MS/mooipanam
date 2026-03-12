import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Lock, ShieldCheck, Bot, ArrowRight } from 'lucide-react';
import { resetPasswordSchema } from '../utils/validators';
import type { ResetPasswordData } from '../utils/validators';
import api from '../utils/api';
import './Auth.css';

const ResetPassword: React.FC = () => {
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    const email = location.state?.email;

    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm<ResetPasswordData>({
        resolver: zodResolver(resetPasswordSchema)
    });

    if (!email) {
        navigate('/forgot-password');
        return null;
    }

    const onSubmit = async (data: ResetPasswordData) => {
        try {
            setLoading(true);
            setError('');
            await api.post('/auth/reset-password', {
                email,
                code: (data as any).code, // code field needs to be added to UI or state
                newPassword: data.newPassword
            });
            navigate('/login', { state: { message: 'Password reset successful. Please login.' } });
        } catch (err: any) {
            setError(err.response?.data?.message || 'Invalid OTP or session expired');
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
                <h1 className="auth-title">Reset Password</h1>
                <p className="auth-subtitle">Create a new secure password for your account</p>

                {error && <div className="auth-error">{error}</div>}

                <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
                    <div className="form-group">
                        <label>Verification Code</label>
                        <div className="input-wrapper">
                            <ShieldCheck className="input-icon" size={20} />
                            <input
                                type="text"
                                {...register('code' as any)}
                                placeholder="Enter 6-digit OTP"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>New Password</label>
                        <div className="input-wrapper">
                            <Lock className="input-icon" size={20} />
                            <input
                                {...register('newPassword')}
                                type="password"
                                placeholder="Enter new password"
                            />
                        </div>
                        {errors.newPassword && <span className="error-msg">{errors.newPassword.message}</span>}
                    </div>

                    <div className="form-group">
                        <label>Confirm Password</label>
                        <div className="input-wrapper">
                            <Lock className="input-icon" size={20} />
                            <input
                                {...register('confirmPassword')}
                                type="password"
                                placeholder="Confirm new password"
                            />
                        </div>
                        {errors.confirmPassword && <span className="error-msg">{errors.confirmPassword.message}</span>}
                    </div>

                    <button type="submit" className="auth-btn" disabled={loading}>
                        {loading ? 'Resetting...' : 'Update Password'} <ArrowRight size={20} />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ResetPassword;
