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
            <div className="modal-content" style={{ maxWidth: '450px' }}>
                <div className="modal-header">
                    <h3>Offline Payment Details</h3>
                    <button className="close-modal" onClick={onClose}><X size={20} /></button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body" style={{ paddingTop: '24px' }}>
                        <div className="form-group" style={{ marginBottom: '16px' }}>
                            <label>Submitter Name</label>
                            <div style={{ position: 'relative' }}>
                                <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                                <input
                                    type="text"
                                    placeholder="Enter your name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    style={{ paddingLeft: '40px' }}
                                />
                            </div>
                        </div>

                        <div className="form-group" style={{ marginBottom: '16px' }}>
                            <label>District</label>
                            <div style={{ position: 'relative' }}>
                                <MapPin size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                                <input
                                    type="text"
                                    placeholder="Enter your district"
                                    value={district}
                                    onChange={(e) => setDistrict(e.target.value)}
                                    required
                                    style={{ paddingLeft: '40px' }}
                                />
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
                        <button type="submit" className="btn-primary" disabled={!name || !district || !amount}>
                            Submit Details
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default OfflinePaymentModal;
