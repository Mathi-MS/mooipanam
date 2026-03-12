import React, { useState } from 'react';
import { X } from 'lucide-react';
import './ActionModal.css';

interface ActionModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    placeholder?: string;
    confirmLabel?: string;
    requireInput?: boolean;
    onConfirm: (input?: string) => void;
    onClose: () => void;
}

const ActionModal: React.FC<ActionModalProps> = ({
    isOpen,
    title,
    message,
    placeholder = 'Type here...',
    confirmLabel = 'Confirm',
    requireInput = false,
    onConfirm,
    onClose
}) => {
    const [input, setInput] = useState('');

    if (!isOpen) return null;

    const handleConfirm = () => {
        if (requireInput && !input.trim()) return;
        onConfirm(input);
        setInput('');
    };

    const handleClose = () => {
        setInput('');
        onClose();
    };

    return (
        <div className="action-modal-overlay">
            <div className="action-modal-content">
                <div className="action-modal-header">
                    <h3>{title}</h3>
                    <button className="close-modal" onClick={handleClose}><X size={20} /></button>
                </div>
                <div className="action-modal-body">
                    <p>{message}</p>
                    {requireInput && (
                        <textarea
                            className="action-modal-input"
                            placeholder={placeholder}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            rows={3}
                            autoFocus
                        />
                    )}
                </div>
                <div className="action-modal-footer">
                    <button className="btn-cancel" onClick={handleClose}>Cancel</button>
                    <button
                        className="btn-confirm"
                        onClick={handleConfirm}
                        disabled={requireInput && !input.trim()}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ActionModal;
