import React, { useState, useEffect } from 'react';
import { Search, Calendar, MapPin, CreditCard, User } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import api from '../utils/api';
import { toast } from 'react-toastify';
import './RequestsPage.css';

interface PaymentReport {
    _id: string;
    user: { name: string; email: string };
    details: {
        name: string;
        city: string;
        town: string;
        dateTime: string;
    };
    amount: number;
    paymentStatus: string;
    paymentDetails: {
        method: 'online' | 'offline';
        transactionId?: string;
        name: string;
        district: string;
        paidAt: string;
    };
}

const ReportsPage: React.FC = () => {
    const location = useLocation();
    const [reports, setReports] = useState<PaymentReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        // Handle pre-filled search from navigation
        const params = new URLSearchParams(location.search);
        const nameQuery = params.get('name');
        if (nameQuery) {
            setSearch(nameQuery);
        }

        const fetchReports = async () => {
            try {
                const response = await api.get('/requests/reports');
                setReports(response.data);
            } catch (error) {
                toast.error('Failed to fetch reports');
            } finally {
                setLoading(false);
            }
        };
        fetchReports();
    }, []);

    const filteredReports = reports.filter(report => 
        report.details.name.toLowerCase().includes(search.toLowerCase()) ||
        report.paymentDetails.district.toLowerCase().includes(search.toLowerCase()) ||
        report.paymentDetails.method.toLowerCase().includes(search.toLowerCase())
    );

    const totalAmount = filteredReports.reduce((sum, report) => sum + report.amount, 0);

    return (
        <div className="requests-page">
            <div className="page-header" style={{ marginBottom: '24px' }}>
                <div>
                    <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)' }}>Payment Reports</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>View and manage platform transactions</p>
                </div>
                <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ 
                        background: 'var(--bg-secondary)', 
                        padding: '12px 20px', 
                        borderRadius: '12px', 
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-end'
                    }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>Total Revenue</span>
                        <span style={{ fontSize: '20px', fontWeight: '700', color: 'var(--accent-primary)' }}>₹{totalAmount.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            <div className="requests-controls">
                <div className="search-container">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Search by name, district, or method..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="table-container">
                <table className="users-table">
                    <thead>
                        <tr>
                            <th>Transaction Date</th>
                            <th>Payer Details</th>
                            <th>Location</th>
                            <th>Amount</th>
                            <th>Method</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>Loading reports...</td></tr>
                        ) : filteredReports.length === 0 ? (
                            <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>No payment reports found.</td></tr>
                        ) : (
                            filteredReports.map((report) => (
                                <tr key={report._id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Calendar size={14} style={{ color: 'var(--text-secondary)' }} />
                                            <div>
                                                <div style={{ fontSize: '13px', fontWeight: '500' }}>
                                                    {new Date(report.paymentDetails.paidAt).toLocaleDateString()}
                                                </div>
                                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                                    {new Date(report.paymentDetails.paidAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{ 
                                                width: '32px', 
                                                height: '32px', 
                                                borderRadius: '50%', 
                                                background: 'var(--bg-secondary)', 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                justifyContent: 'center',
                                                color: 'var(--accent-primary)'
                                            }}>
                                                <User size={16} />
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: '600', fontSize: '14px' }}>{report.paymentDetails.name}</div>
                                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Request: {report.details.name}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                                            <MapPin size={14} style={{ color: 'var(--text-secondary)' }} />
                                            {report.paymentDetails.district}
                                        </div>
                                    </td>
                                    <td style={{ fontWeight: '700', color: 'var(--text-primary)' }}>
                                        ₹{report.amount.toLocaleString()}
                                    </td>
                                    <td>
                                        <div style={{ 
                                            display: 'inline-flex', 
                                            alignItems: 'center', 
                                            gap: '6px',
                                            padding: '4px 10px',
                                            borderRadius: '20px',
                                            fontSize: '11px',
                                            fontWeight: '600',
                                            background: report.paymentDetails.method === 'online' ? 'rgba(101, 163, 13, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                            color: report.paymentDetails.method === 'online' ? 'var(--accent-primary)' : '#d97706',
                                            textTransform: 'uppercase'
                                        }}>
                                            <CreditCard size={12} />
                                            {report.paymentDetails.method}
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`status-badge ${report.paymentStatus === 'paid' ? 'accepted' : 'pending'}`} style={{ fontSize: '10px' }}>
                                            {report.paymentStatus === 'paid' ? 'VERIFIED' : 'PENDING REVIEW'}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ReportsPage;
