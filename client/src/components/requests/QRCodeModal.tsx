import React from 'react';
import { X, ExternalLink } from 'lucide-react';
import './RequestModal.css';

interface QRCodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    paymentUrl: string;
}

const QRCodeModal: React.FC<QRCodeModalProps> = ({ isOpen, onClose, paymentUrl }) => {
    if (!isOpen) return null;

    // Use a public QR code API
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(paymentUrl)}`;

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center' }}>
                <div className="modal-header">
                    <h3>Scan to Pay</h3>
                    <button className="close-modal" onClick={onClose}><X size={20} /></button>
                </div>

                <div className="modal-body" style={{ padding: '32px 24px' }}>
                    <p style={{ marginBottom: '20px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                        Scan this QR code with your phone to complete the payment.
                    </p>
                    
                    <div style={{ 
                        background: 'white', 
                        padding: '16px', 
                        borderRadius: '12px', 
                        display: 'inline-block',
                        border: '1px solid var(--border-color)',
                        marginBottom: '20px'
                    }}>
                        <img src={qrCodeUrl} alt="Payment QR Code" style={{ width: '200px', height: '200px' }} />
                    </div>

                    <div style={{ marginTop: '10px' }}>
                        <a 
                            href={paymentUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="btn-secondary"
                            style={{ 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                gap: '8px',
                                textDecoration: 'none',
                                fontSize: '14px'
                            }}
                        >
                            Open Payment Link <ExternalLink size={14} />
                        </a>
                    </div>
                </div>

                <div className="modal-footer" style={{ justifyContent: 'center' }}>
                    <button className="btn-primary" onClick={onClose}>Done</button>
                </div>
            </div>
        </div>
    );
};

export default QRCodeModal;
