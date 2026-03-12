import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { User, MapPin, IndianRupee, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../utils/api';
import './Auth.css'; // Reuse auth styles for centering and cards

const PaymentPage: React.FC = () => {
    const { id } = useParams();
    const [request, setRequest] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // Form fields
    const [name, setName] = useState('');
    const [district, setDistrict] = useState('');
    const [amount, setAmount] = useState('');

    useEffect(() => {
        const fetchRequest = async () => {
            try {
                const response = await api.get(`/requests/${id}/public`);
                setRequest(response.data);
                setName(response.data.details.name);
                setDistrict(response.data.details.city || response.data.details.town);
            } catch (err: any) {
                setError(err.response?.data?.message || 'Failed to load request details');
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchRequest();
    }, [id]);

    const handleRazorpayPayment = () => {
        if (!name || !district || !amount) return;
        
        setSubmitting(true);
        
        // Load Razorpay Script
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        
        script.onload = () => {
            const options = {
                key: 'YOUR_RAZORPAY_KEY_ID', // Replace with real key or placeholder
                amount: parseFloat(amount) * 100, // in paise
                currency: 'INR',
                name: 'Mooi Panam',
                description: `Payment for request ${id}`,
                handler: async function (response: any) {
                    try {
                        await api.post(`/requests/${id}/verify-payment`, {
                            name,
                            district,
                            amount: parseFloat(amount),
                            razorpay_payment_id: response.razorpay_payment_id
                        });
                        setSuccess(true);
                    } catch (err) {
                        setError('Payment verification failed. Please contact support.');
                    } finally {
                        setSubmitting(false);
                    }
                },
                prefill: {
                    name: name,
                },
                theme: {
                    color: '#65a30d'
                }
            };

            const rzp = (window as any).Razorpay(options);
            rzp.open();
            setSubmitting(false); // Modal is open, stop loading
        };

        script.onerror = () => {
            setError('Failed to load Razorpay. Please check your connection.');
            setSubmitting(false);
        };

        document.body.appendChild(script);
    };

    if (loading) {
        return (
            <div className="auth-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <Loader2 className="animate-spin" size={48} color="var(--accent-primary)" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="auth-container">
                <div className="auth-card" style={{ textAlign: 'center' }}>
                    <AlertCircle size={48} color="#ef4444" style={{ marginBottom: '16px' }} />
                    <h2 style={{ marginBottom: '12px' }}>Error</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>{error}</p>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="auth-container">
                <div className="auth-card" style={{ textAlign: 'center' }}>
                    <CheckCircle2 size={64} color="var(--accent-primary)" style={{ marginBottom: '16px' }} />
                    <h2 style={{ marginBottom: '12px' }}>Payment Successful!</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                        Your payment has been processed and your request is now updated.
                    </p>
                    <p style={{ fontSize: '14px', fontWeight: 600 }}>Thank you!</p>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-container">
            <div className="auth-header">
                <h1>Online Payment</h1>
                <p>Complete your payment securely via Razorpay</p>
            </div>

            <div className="auth-card">
                <div style={{ marginBottom: '24px', padding: '12px', background: 'rgba(101, 163, 13, 0.1)', borderRadius: '8px', border: '1px solid rgba(101, 163, 13, 0.2)' }}>
                    <p style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 600 }}>Payment for:</p>
                    <p style={{ fontSize: '15px', color: 'var(--accent-primary)', fontWeight: 700 }}>{request?.details?.name}'s Wedding Request</p>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{request?.details?.town}, {request?.details?.city}</p>
                </div>

                <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label>Name</label>
                    <div style={{ position: 'relative' }}>
                        <User size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-secondary)' }} />
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter your name"
                            className="auth-input"
                            style={{ paddingLeft: '40px' }}
                        />
                    </div>
                </div>

                <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label>District / Town</label>
                    <div style={{ position: 'relative' }}>
                        <MapPin size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-secondary)' }} />
                        <input
                            type="text"
                            value={district}
                            onChange={(e) => setDistrict(e.target.value)}
                            placeholder="Enter district or town"
                            className="auth-input"
                            style={{ paddingLeft: '40px' }}
                        />
                    </div>
                </div>

                <div className="form-group" style={{ marginBottom: '24px' }}>
                    <label>Amount (₹)</label>
                    <div style={{ position: 'relative' }}>
                        <IndianRupee size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-secondary)' }} />
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="Enter amount to pay"
                            className="auth-input"
                            style={{ paddingLeft: '40px' }}
                        />
                    </div>
                </div>

                <button 
                    className="auth-btn" 
                    onClick={handleRazorpayPayment}
                    disabled={submitting || !amount || !name || !district}
                >
                    {submitting ? 'Initializing...' : 'Pay with Razorpay'}
                </button>
            </div>
        </div>
    );
};

export default PaymentPage;
