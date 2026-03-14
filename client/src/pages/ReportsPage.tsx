import React, { useState, useEffect } from 'react';
import { Search, Calendar, MapPin, CreditCard, User, LayoutGrid, List, ChevronLeft, ChevronRight } from 'lucide-react';
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
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [viewMode, setViewMode] = useState<'table' | 'card'>(window.innerWidth < 768 ? 'card' : 'table');

    useEffect(() => {
        // Handle pre-filled search from navigation
        const params = new URLSearchParams(location.search);
        const nameQuery = params.get('name');
        if (nameQuery && !search) {
            setSearch(nameQuery);
        }

        const fetchReports = async () => {
            setLoading(true);
            try {
                const response = await api.get('/requests/reports', {
                    params: { page, limit: 5, search }
                });
                setReports(response.data.reports || []);
                setTotalPages(response.data.totalPages || 1);
                
                // Fetch dashboard stats to get the total revenue metric safely independent of pagination
                const dashResponse = await api.get('/requests/dashboard');
                setTotalRevenue(dashResponse.data?.stats?.totalRevenue || 0);

            } catch (error) {
                toast.error('Failed to fetch reports');
            } finally {
                setLoading(false);
            }
        };
        
        // Debounce search
        const timeoutId = setTimeout(() => {
            fetchReports();
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [page, search, location.search]);

    return (
        <div className="requests-page">
            <div className="page-header" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
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
                        <span style={{ fontSize: '20px', fontWeight: '700', color: 'var(--accent-primary)' }}>₹{totalRevenue.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            <div className="requests-controls">
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', width: '100%' }}>
                    <div className="search-container" style={{ flex: '1', minWidth: 'min(100%, 250px)' }}>
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Search by name, district, or method..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1); // Reset page on search
                            }}
                        />
                    </div>
                    <div style={{ display: 'flex', background: 'var(--bg-secondary)', borderRadius: '8px', padding: '4px', border: '1px solid var(--border-color)' }}>
                        <button 
                            onClick={() => setViewMode('table')} 
                            style={{ padding: '6px', borderRadius: '6px', background: viewMode === 'table' ? 'var(--bg-primary)' : 'transparent', color: viewMode === 'table' ? 'var(--accent-primary)' : 'var(--text-secondary)', boxShadow: viewMode === 'table' ? 'var(--shadow-sm)' : 'none' }}
                        >
                            <List size={18} />
                        </button>
                        <button 
                            onClick={() => setViewMode('card')} 
                            style={{ padding: '6px', borderRadius: '6px', background: viewMode === 'card' ? 'var(--bg-primary)' : 'transparent', color: viewMode === 'card' ? 'var(--accent-primary)' : 'var(--text-secondary)', boxShadow: viewMode === 'card' ? 'var(--shadow-sm)' : 'none' }}
                        >
                            <LayoutGrid size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {viewMode === 'table' ? (
                <div className="table-container" style={{ marginBottom: '24px' }}>
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
                        ) : reports.length === 0 ? (
                            <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>No payment reports found.</td></tr>
                        ) : (
                            reports.map((report) => (
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
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: '16px', marginBottom: '24px' }}>
                    {loading ? (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px' }}>Loading reports...</div>
                    ) : reports.length === 0 ? (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px' }}>No payment reports found.</div>
                    ) : (
                        reports.map((report) => (
                            <div key={report._id} style={{ background: 'var(--bg-primary)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)' }}>
                                            <User size={18} />
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: '600', fontSize: '15px' }}>{report.paymentDetails.name}</div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Request: {report.details.name}</div>
                                        </div>
                                    </div>
                                    <div style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '16px' }}>₹{report.amount.toLocaleString()}</div>
                                </div>
                                
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', marginBottom: '16px', flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}><Calendar size={14} /> Date:</span>
                                        <span style={{ fontWeight: '500' }}>{new Date(report.paymentDetails.paidAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={14} /> Location:</span>
                                        <span style={{ fontWeight: '500' }}>{report.paymentDetails.district}</span>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', background: report.paymentDetails.method === 'online' ? 'rgba(101, 163, 13, 0.1)' : 'rgba(245, 158, 11, 0.1)', color: report.paymentDetails.method === 'online' ? 'var(--accent-primary)' : '#d97706', textTransform: 'uppercase' }}>
                                        <CreditCard size={12} />
                                        {report.paymentDetails.method}
                                    </div>
                                    <span className={`status-badge ${report.paymentStatus === 'paid' ? 'accepted' : 'pending'}`} style={{ fontSize: '10px' }}>
                                        {report.paymentStatus === 'paid' ? 'VERIFIED' : 'PENDING REVIEW'}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
            
            <div className="pagination">
                <div className="pagination-info">
                    Page {page} of {totalPages}
                </div>
                <div className="pagination-controls">
                    <button className="page-btn" disabled={page === 1} onClick={() => setPage(page - 1)}>
                        <ChevronLeft size={18} />
                    </button>
                    <button className="page-btn active">{page}</button>
                    <button className="page-btn" disabled={page === totalPages || totalPages === 0} onClick={() => setPage(page + 1)}>
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReportsPage;
