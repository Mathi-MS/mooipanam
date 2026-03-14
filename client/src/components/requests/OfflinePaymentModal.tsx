import React, { useState } from 'react';
import { X, User, MapPin, IndianRupee } from 'lucide-react';
import './RequestModal.css'; // Reuse existing modal styles

interface OfflinePaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: { name: string; district: string; amount: number }) => void;
}

const OfflinePaymentModal: React.FC<OfflinePaymentModalProps> = ({ isOpen, onClose, onSubmit }) => {
    const [name, setName] = useState('');
    const [district, setDistrict] = useState('');
    const [amount, setAmount] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validateField = (fieldName: string, value: string) => {
        let error = '';
        if (fieldName === 'name' || fieldName === 'district') {
            if (value.length > 0 && (value.length < 3 || value.length > 50)) {
                error = 'Must be between 3 and 50 characters';
            }
        }
        setErrors(prev => ({ ...prev, [fieldName]: error }));
    };

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({ 
            name, 
            district, 
            amount: parseFloat(amount) 
        });
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content offline-modal">
                <div className="modal-header">
                    <h3>Offline Payment Details</h3>
                    <button className="close-modal" onClick={onClose}><X size={20} /></button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                    <div className="modal-body">
                        <div className="form-group" style={{ marginBottom: '16px' }}>
                            <label>Submitter Name</label>
                            <div style={{ position: 'relative' }}>
                                <div style={{ position: 'relative' }}>
                                <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                                <input
                                    type="text"
                                    placeholder="Enter your name"
                                    value={name}
                                    onBlur={() => validateField('name', name)}
                                    onChange={(e) => {
                                        setName(e.target.value);
                                        if (errors.name) validateField('name', e.target.value);
                                    }}
                                    required
                                    style={{ paddingLeft: '40px' }}
                                    className={errors.name ? 'error' : ''}
                                />
                                </div>
                                {errors.name && <span className="error-text">{errors.name}</span>}
                            </div>
                        </div>

                        <div className="form-group" style={{ marginBottom: '16px' }}>
                            <label>District</label>
                            <div style={{ position: 'relative' }}>
                                <div style={{ position: 'relative' }}>
                                    <MapPin size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                                <input
                                    type="text"
                                    placeholder="Enter your district"
                                    value={district}
                                    onBlur={() => validateField('district', district)}
                                    onChange={(e) => {
                                        setDistrict(e.target.value);
                                        if (errors.district) validateField('district', e.target.value);
                                    }}
                                    required
                                    style={{ paddingLeft: '40px' }}
                                    className={errors.district ? 'error' : ''}
                                />
                                </div>
                                {errors.district && <span className="error-text">{errors.district}</span>}
                            </div>
                        </div>

                        <div className="form-group" style={{ marginBottom: '16px' }}>
                            <label>Amount Paid (₹)</label>
                            <div style={{ position: 'relative' }}>
                                <IndianRupee size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                                <input
                                    type="number"
                                    placeholder="0.00"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    required
                                    style={{ paddingLeft: '40px' }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn-primary" disabled={!name || !district || !amount || !!errors.name || !!errors.district}>
                            Submit Details
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default OfflinePaymentModal;
