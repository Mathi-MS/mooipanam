import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ShieldCheck, Bot, ArrowRight } from 'lucide-react';
import { otpSchema } from '../utils/validators';
import type { OTPData } from '../utils/validators';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../redux/slices/authSlice';
import api from '../utils/api';
import './Auth.css';

const VerifyOTP: React.FC = () => {
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const email = location.state?.email;

    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm<OTPData>({
        resolver: zodResolver(otpSchema)
    });

    if (!email) {
        navigate('/signup');
        return null;
    }

    const onSubmit = async (data: OTPData) => {
        try {
            setLoading(true);
            setError('');
            const response = await api.post('/auth/verify-otp', {
                email,
                code: data.code
            });
            dispatch(setCredentials(response.data));
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Invalid or expired OTP');
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
                <h1 className="auth-title">Verify Email</h1>
                <p className="auth-subtitle">We've sent a 6-digit verification code to<br /><strong>{email}</strong></p>

                {error && <div className="auth-error">{error}</div>}

                <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
                    <div className="form-group">
                        <label>Verification Code</label>
                        <div className="input-wrapper">
                            <ShieldCheck className="input-icon" size={20} />
                            <input
                                {...register('code')}
                                type="text"
                                maxLength={6}
                                placeholder="Enter 6-digit code"
                                style={{ textAlign: 'center', letterSpacing: '8px', fontSize: '24px' }}
                            />
                        </div>
                        {errors.code && <span className="error-msg">{errors.code.message}</span>}
                    </div>

                    <button type="submit" className="auth-btn" disabled={loading}>
                        {loading ? 'Verifying...' : 'Verify & Continue'} <ArrowRight size={20} />
                    </button>

                    <p className="auth-footer" style={{ marginTop: '24px' }}>
                        Didn't receive the code? <button type="button" style={{ color: 'var(--accent-primary)', fontWeight: 700 }} onClick={() => navigate('/signup')}>Try again</button>
                    </p>
                </form>
            </div>
        </div>
    );
};

export default VerifyOTP;
