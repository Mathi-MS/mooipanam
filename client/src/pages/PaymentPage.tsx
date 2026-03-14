import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, MapPin, IndianRupee, Loader2, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import api from '../utils/api';
import './PaymentPage.css'; // New premium styles

const PaymentPage: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [request, setRequest] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // Form state
    const [name, setName] = useState('');
    const [district, setDistrict] = useState('');
    const [amount, setAmount] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validateField = (fieldName: string, value: string) => {
        let errorMsg = '';
        if (fieldName === 'name' || fieldName === 'district') {
            if (value.trim().length === 0) {
                errorMsg = ''; // Don't show error if empty during typing until blur or first submit
            } else if (value.trim().length < 3 || value.trim().length > 50) {
                errorMsg = 'Must be between 3 and 50 characters';
            }
        }
        setErrors(prev => ({ ...prev, [fieldName]: errorMsg }));
    };

    useEffect(() => {
        const fetchRequest = async () => {
            try {
                const response = await api.get(`/requests/${id}/public`);
                setRequest(response.data);
                // No autofetch: Name and District should be entered manually by the payer
            } catch (err: any) {
                setError(err.response?.data?.message || 'Failed to load request details');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchRequest();
        }
    }, [id]);

    const handleRazorpayPayment = async () => {
        // Final validation check
        const nameError = (!name || name.trim().length < 3 || name.trim().length > 50) ? 'Must be 3-50 characters' : '';
        const districtError = (!district || district.trim().length < 3 || district.trim().length > 50) ? 'Must be 3-50 characters' : '';
        
        if (nameError || districtError) {
            setErrors({ name: nameError, district: districtError });
            return;
        }

        setSubmitting(true);
        try {
            // Load Razorpay Script
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.async = true;
            document.body.appendChild(script);

            script.onload = async () => {
                try {
                    // 1. Create Order on Backend
                    const orderResponse = await api.post('/requests/create-order', {
                        requestId: id,
                        amount: parseFloat(amount),
                        payerName: name,
                        payerDistrict: district
                    });

                    const options = {
                        key: orderResponse.data.key,
                        amount: orderResponse.data.amount,
                        currency: 'INR',
                        name: 'Mooi Panam',
                        description: `Payment for ${request.details.name}'s Request`,
                        order_id: orderResponse.data.orderId,
                        handler: async function (response: any) {
                            try {
                                // 2. Verify Payment on Backend
                                await api.post('/requests/verify-payment', {
                                    razorpay_order_id: response.razorpay_order_id,
                                    razorpay_payment_id: response.razorpay_payment_id,
                                    razorpay_signature: response.razorpay_signature,
                                    requestId: id,
                                    amount: parseFloat(amount),
                                    payerName: name,
                                    payerDistrict: district
                                });
                                setSuccess(true);
                            } catch (err: any) {
                                setError(err.response?.data?.message || 'Payment verification failed');
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
                } catch (err: any) {
                    setError(err.response?.data?.message || 'Failed to initiate payment');
                }
            };
        } catch (err: any) {
            setError('Something went wrong. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="payment-page-container">
                <Loader2 className="animate-spin" size={48} color="var(--accent-primary)" />
                <p style={{ marginTop: '16px', color: 'var(--text-secondary)', fontWeight: 500 }}>Loading request details...</p>
            </div>
        );
    }

    if (error && !request) {
        return (
            <div className="payment-page-container">
                <div className="payment-card" style={{ textAlign: 'center' }}>
                    <AlertCircle size={64} color="#ef4444" style={{ marginBottom: '20px' }} />
                    <h2 style={{ marginBottom: '12px' }}>Oops!</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>{error}</p>
                    <button className="pay-button" onClick={() => navigate('/')}>Go Home</button>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="payment-page-container">
                <div className="payment-card" style={{ textAlign: 'center' }}>
                    <CheckCircle2 size={80} color="var(--accent-primary)" style={{ marginBottom: '24px' }} />
                    <h2 style={{ fontSize: '28px', color: 'var(--text-primary)', marginBottom: '12px' }}>Payment Successful!</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '16px', marginBottom: '32px' }}>
                        Thank you for your generous contribution. A receipt has been sent to your record.
                    </p>
                    <button className="pay-button" onClick={() => navigate('/')}>Return to Home</button>
                </div>
            </div>
        );
    }

    const isFormValid = name.trim().length >= 3 && name.trim().length <= 50 &&
                      district.trim().length >= 3 && district.trim().length <= 50 &&
                      amount !== '' && parseFloat(amount) > 0;

    return (
        <div className="payment-page-container">
            <div className="payment-logo-section">
                <h1 className="payment-logo" onClick={() => navigate('/')}>Mooi Panam</h1>
            </div>

            <div className="payment-card">
                <div className="payment-details-summary">
                    <p className="summary-label">Paying For</p>
                    <p className="summary-value">{request?.details?.name}'s Wedding Request</p>
                    <div className="summary-subtext">
                        <MapPin size={14} />
                        <span>{request?.details?.town} • {request?.details?.city}</span>
                    </div>
                </div>

                <div className="payment-form">
                    <div className="payment-input-group">
                        <label>Name</label>
                        <div className="payment-input-wrapper">
                            <User size={18} className="payment-input-icon" />
                            <input
                                type="text"
                                value={name}
                                onBlur={() => validateField('name', name)}
                                onChange={(e) => {
                                    setName(e.target.value);
                                    if (errors.name) validateField('name', e.target.value);
                                }}
                                placeholder="Enter your full name"
                                className={`payment-input ${errors.name ? 'error' : ''}`}
                            />
                        </div>
                        {errors.name && <p className="payment-error-msg">{errors.name}</p>}
                    </div>

                    <div className="payment-input-group">
                        <label>District / Town</label>
                        <div className="payment-input-wrapper">
                            <MapPin size={18} className="payment-input-icon" />
                            <input
                                type="text"
                                value={district}
                                onBlur={() => validateField('district', district)}
                                onChange={(e) => {
                                    setDistrict(e.target.value);
                                    if (errors.district) validateField('district', e.target.value);
                                }}
                                placeholder="Enter your district or town"
                                className={`payment-input ${errors.district ? 'error' : ''}`}
                            />
                        </div>
                        {errors.district && <p className="payment-error-msg">{errors.district}</p>}
                    </div>

                    <div className="payment-input-group">
                        <label>Amount (₹)</label>
                        <div className="payment-input-wrapper">
                            <IndianRupee size={18} className="payment-input-icon" />
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="Enter contribution amount"
                                className="payment-input"
                            />
                        </div>
                    </div>

                    {error && request && (
                        <div style={{ background: '#fef2f2', color: '#dc2626', padding: '12px', borderRadius: '10px', fontSize: '14px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <AlertCircle size={16} />
                            <span>{error}</span>
                        </div>
                    )}

                    <button 
                        className="pay-button" 
                        onClick={handleRazorpayPayment}
                        disabled={submitting || !isFormValid}
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="animate-spin" size={20} />
                                <span>Processing...</span>
                            </>
                        ) : (
                            <>
                                <span>Pay Contribution</span>
                                <ArrowRight size={20} />
                            </>
                        )}
                    </button>
                    
                    <p style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-secondary)', marginTop: '20px' }}>
                        Secure payments powered by Razorpay. Your data is protected.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PaymentPage;
