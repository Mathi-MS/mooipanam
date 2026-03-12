import React, { useState, useEffect } from 'react';
import { X, CreditCard, Banknote, Landmark, Info } from 'lucide-react';
import './RequestModal.css';

interface RequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    mode?: 'create' | 'edit' | 'view';
    initialData?: any;
}

const RequestModal: React.FC<RequestModalProps> = ({ 
    isOpen, 
    onClose, 
    onSubmit, 
    mode = 'create',
    initialData 
}) => {
    const [step, setStep] = useState(1);
    const [details, setDetails] = useState({
        name: '',
        mobile: '',
        city: '',
        town: '',
        address: '',
        dateTime: '',
        brideName: '',
        groomName: ''
    });
    const [paymentType, setPaymentType] = useState<'online' | 'offline' | 'both'>('online');
    const [acceptedTerms, setAcceptedTerms] = useState(false);

    const formatDateTimeForInput = (isoString: string) => {
        if (!isoString) return '';
        const date = new Date(isoString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    useEffect(() => {
        if (isOpen) {
            if (initialData && (mode === 'edit' || mode === 'view')) {
                setDetails({
                    name: initialData.details?.name || '',
                    mobile: initialData.details?.mobile || '',
                    city: initialData.details?.city || '',
                    town: initialData.details?.town || '',
                    address: initialData.details?.address || '',
                    dateTime: formatDateTimeForInput(initialData.details?.dateTime || ''),
                    brideName: initialData.details?.brideName || '',
                    groomName: initialData.details?.groomName || ''
                });
                setPaymentType(initialData.paymentType || 'online');
                setAcceptedTerms(initialData.acceptedTerms || (mode === 'view'));
            } else {
                setDetails({
                    name: '',
                    mobile: '',
                    city: '',
                    town: '',
                    address: '',
                    dateTime: '',
                    brideName: '',
                    groomName: ''
                });
                setPaymentType('online');
                setAcceptedTerms(false);
            }
            setStep(1);
        }
    }, [isOpen, initialData, mode]);

    if (!isOpen) return null;

    const handleNext = () => setStep(step + 1);
    const handleBack = () => setStep(step - 1);

    const handleSubmit = () => {
        if (mode === 'view') {
            onClose();
            return;
        }
        if (acceptedTerms) {
            onSubmit({ details, paymentType, acceptedTerms });
        }
    };

    const isStep1Valid = Object.values(details).every(val => val !== '');
    const isView = mode === 'view';

    const getModalTitle = () => {
        if (mode === 'view') return 'Request Details';
        if (mode === 'edit') return 'Edit Request';
        return 'Create New Request';
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h3>{getModalTitle()}</h3>
                    <button className="close-modal" onClick={onClose}><X size={20} /></button>
                </div>

                <div className="stepper">
                    <div className={`step ${step >= 1 ? 'active' : ''}`}>
                        <div className="step-number">1</div>
                        <span>Details</span>
                    </div>
                    <div className="step-divider"></div>
                    <div className={`step ${step >= 2 ? 'active' : ''}`}>
                        <div className="step-number">2</div>
                        <span>Payment</span>
                    </div>
                    <div className="step-divider"></div>
                    <div className={`step ${step >= 3 ? 'active' : ''}`}>
                        <div className="step-number">3</div>
                        <span>Terms</span>
                    </div>
                </div>

                <div className="modal-body">
                    {step === 1 && (
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Your Name</label>
                                <input
                                    type="text"
                                    placeholder="Enter your name"
                                    disabled={isView}
                                    value={details.name}
                                    onChange={(e) => setDetails({ ...details, name: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Mobile Number</label>
                                <input
                                    type="text"
                                    placeholder="Enter mobile number"
                                    disabled={isView}
                                    value={details.mobile}
                                    onChange={(e) => setDetails({ ...details, mobile: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>City / District</label>
                                <input
                                    type="text"
                                    placeholder="City or District"
                                    disabled={isView}
                                    value={details.city}
                                    onChange={(e) => setDetails({ ...details, city: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Town / Village</label>
                                <input
                                    type="text"
                                    placeholder="Town or Village"
                                    disabled={isView}
                                    value={details.town}
                                    onChange={(e) => setDetails({ ...details, town: e.target.value })}
                                />
                            </div>
                            <div className="form-group full-width">
                                <label>Address</label>
                                <input
                                    type="text"
                                    placeholder="Full address details"
                                    disabled={isView}
                                    value={details.address}
                                    onChange={(e) => setDetails({ ...details, address: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Date and Time</label>
                                <input
                                    type="datetime-local"
                                    disabled={isView}
                                    value={details.dateTime}
                                    onChange={(e) => setDetails({ ...details, dateTime: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Bride Name</label>
                                <input
                                    type="text"
                                    placeholder="Enter bride's name"
                                    disabled={isView}
                                    value={details.brideName}
                                    onChange={(e) => setDetails({ ...details, brideName: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Groom Name</label>
                                <input
                                    type="text"
                                    placeholder="Enter groom's name"
                                    disabled={isView}
                                    value={details.groomName}
                                    onChange={(e) => setDetails({ ...details, groomName: e.target.value })}
                                />
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div>
                            <p style={{ margin: '0 0 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                                {isView ? 'Selected payment method:' : 'Select your preferred payment method:'}
                            </p>
                            <div className="payment-options">
                                <div
                                    className={`payment-card ${paymentType === 'online' ? 'selected' : ''} ${isView ? 'disabled' : ''}`}
                                    onClick={() => !isView && setPaymentType('online')}
                                >
                                    <div className="card-icon"><CreditCard size={24} /></div>
                                    <span>Online</span>
                                </div>
                                <div
                                    className={`payment-card ${paymentType === 'offline' ? 'selected' : ''} ${isView ? 'disabled' : ''}`}
                                    onClick={() => !isView && setPaymentType('offline')}
                                >
                                    <div className="card-icon"><Banknote size={24} /></div>
                                    <span>Offline</span>
                                </div>
                                <div
                                    className={`payment-card ${paymentType === 'both' ? 'selected' : ''} ${isView ? 'disabled' : ''}`}
                                    onClick={() => !isView && setPaymentType('both')}
                                >
                                    <div className="card-icon"><Landmark size={24} /></div>
                                    <span>Both</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="terms-step">
                            <div className="commission-notice">
                                <Info size={20} />
                                <div>
                                    <strong>Platform Commission</strong>
                                    <p style={{ margin: '4px 0 0', fontSize: '13px' }}>
                                        A service fee of 5% of the total cost will be applicable upon successful completion.
                                    </p>
                                </div>
                            </div>
                            <div className="terms-container">
                                <div className="terms-content">
                                    <p>By submitting this request, you agree to our terms and conditions. We act as a platform to connect users and facilitate service requests. Please ensure all details provided are accurate.</p>
                                </div>
                                {!isView && (
                                    <label className="checkbox-group">
                                        <input
                                            type="checkbox"
                                            checked={acceptedTerms}
                                            onChange={(e) => setAcceptedTerms(e.target.checked)}
                                        />
                                        <span>I accept all terms and conditions</span>
                                    </label>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="modal-footer">
                    <button
                        className="btn-secondary"
                        onClick={step === 1 ? onClose : handleBack}
                    >
                        {step === 1 ? (isView ? 'Close' : 'Cancel') : 'Back'}
                    </button>
                    {step < 3 ? (
                        <button
                            className="btn-primary"
                            onClick={handleNext}
                            disabled={step === 1 && !isStep1Valid}
                        >
                            Next Step
                        </button>
                    ) : (
                        <button
                            className="btn-primary"
                            disabled={!isView && !acceptedTerms}
                            onClick={handleSubmit}
                        >
                            {isView ? 'Close' : (mode === 'edit' ? 'Update Request' : 'Submit Request')}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RequestModal;
