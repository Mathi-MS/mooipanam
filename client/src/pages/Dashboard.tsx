import React, { useState, useEffect } from 'react';
import { Users, ClipboardList, PieChart as PieChartIcon, Activity, CalendarPlus, FileText, CreditCard } from 'lucide-react';
import { useSelector } from 'react-redux';
import type { RootState } from '../redux/store';
import api from '../utils/api';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface DashboardData {
    stats: {
        totalRequests: number;
        pendingRequests: number;
        todayRequests: number;
        completedPayments: number;
        totalRevenue: number;
    };
    statusDistribution: Array<{ name: string; value: number }>;
    last5Requests: Array<{ _id: string; details: { name: string, city: string }; status: string; createdAt: string }>;
    last5Payments: Array<{ _id: string; userName: string; requestName: string; method: string; amount: number; paidAt: string }>;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const Dashboard: React.FC = () => {
    const { user } = useSelector((state: RootState) => state.auth);
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
             try {
                 const res = await api.get('/requests/dashboard');
                 setData(res.data);
             } catch (error) {
                 console.error("Failed to load dashboard data", error);
             } finally {
                 setLoading(false);
             }
        };
        fetchDashboardData();
    }, []);

    if (loading) {
        return <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Loading dashboard data...</div>;
    }

    if (!data) return <div style={{ padding: '24px' }}>Error loading data.</div>;

    const { stats, statusDistribution, last5Requests, last5Payments } = data;

    const statCards: Array<{title: string, value: number | string, icon: React.ReactNode, color: string, bg: string}> = [
        { title: 'Total Requests', value: stats.totalRequests, icon: <ClipboardList size={24} />, color: '#3b82f6', bg: '#eff6ff' },
        { title: 'Today\'s Requests', value: stats.todayRequests, icon: <CalendarPlus size={24} />, color: '#ec4899', bg: '#fdf2f8' },
        { title: 'Pending Approval', value: stats.pendingRequests, icon: <Activity size={24} />, color: '#f59e0b', bg: '#fffbeb' },
        { title: 'Processed Payments', value: stats.completedPayments, icon: <PieChartIcon size={24} />, color: '#10b981', bg: '#ecfdf5' },
    ];

    if (user?.role === 'admin' || user?.role === 'superadmin') {
        statCards.push({ title: 'Total Revenue', value: `₹${stats.totalRevenue.toLocaleString()}`, icon: <Users size={24} />, color: '#8b5cf6', bg: '#f5f3ff' });
    }

    return (
        <div className="dashboard-page users-page" >
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text-primary)' }}>
                    Welcome back, {user?.name}!
                </h1>
                <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
                    Here's an overview of your activity on Mooi Panam.
                </p>
            </div>

            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', 
                gap: '24px',
                marginBottom: '32px'
            }}>
                {statCards.map((card, idx) => (
                    <div key={idx} className="stat-card" style={{ 
                        background: 'white', 
                        padding: 'min(5vw, 24px)', 
                        borderRadius: '16px', 
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'min(4vw, 20px)'
                    }}>
                        <div style={{ 
                            background: card.bg, 
                            color: card.color, 
                            width: 'clamp(40px, 12vw, 56px)', 
                            height: 'clamp(40px, 12vw, 56px)', 
                            borderRadius: '12px', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            flexShrink: 0
                        }}>
                            {card.icon}
                        </div>
                        <div>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                {card.title}
                            </p>
                            <h3 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)', marginTop: '4px' }}>
                                {card.value}
                            </h3>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '24px' }}>
                
                {/* Status Distribution Chart */}
                <div style={{ background: 'white', padding: 'min(5vw, 24px)', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', color: 'var(--text-primary)' }}>Request Status</h3>
                    <div style={{ height: '300px' }}>
                        {statusDistribution.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={statusDistribution}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius="60%"
                                        outerRadius="80%"
                                        fill="#8884d8"
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {statusDistribution.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => [value, 'Count']} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>No requests found</div>
                        )}
                    </div>
                </div>

                {/* Last 5 Payments */}
                <div style={{ background: 'white', padding: 'min(5vw, 24px)', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', color: 'var(--text-primary)' }}>Last 5 Payments</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {last5Payments.length > 0 ? last5Payments.map(payment => (
                            <div key={payment._id} className="dashboard-item" style={{ 
                                display: 'flex', 
                                flexDirection: window.innerWidth < 480 ? 'column' : 'row',
                                justifyContent: 'space-between', 
                                alignItems: window.innerWidth < 480 ? 'flex-start' : 'center', 
                                padding: '12px', 
                                border: '1px solid var(--border-color)', 
                                borderRadius: '8px', 
                                gap: '8px' 
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)', flexShrink: 0 }}>
                                        <CreditCard size={18} />
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-primary)' }}>{payment.userName}</div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Req: {payment.requestName} • {new Date(payment.paidAt).toLocaleDateString()}</div>
                                    </div>
                                </div>
                                <div style={{ textAlign: window.innerWidth < 480 ? 'left' : 'right', marginLeft: window.innerWidth < 480 ? '48px' : '0' }}>
                                    <div style={{ fontWeight: '700', fontSize: '15px', color: 'var(--text-primary)' }}>₹{payment.amount.toLocaleString()}</div>
                                    <div style={{ fontSize: '11px', color: payment.method === 'online' ? 'var(--accent-primary)' : '#d97706', fontWeight: '600', textTransform: 'uppercase' }}>{payment.method}</div>
                                </div>
                            </div>
                        )) : (
                            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>No recent payments.</div>
                        )}
                    </div>
                </div>
                
                {/* Last 5 Requests */}
                <div style={{ background: 'white', padding: 'min(5vw, 24px)', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', color: 'var(--text-primary)' }}>Last 5 Requests</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {last5Requests.length > 0 ? last5Requests.map(req => (
                            <div key={req._id} className="dashboard-item" style={{ 
                                display: 'flex', 
                                flexDirection: window.innerWidth < 480 ? 'column' : 'row',
                                justifyContent: 'space-between', 
                                alignItems: window.innerWidth < 480 ? 'flex-start' : 'center', 
                                padding: '12px', 
                                border: '1px solid var(--border-color)', 
                                borderRadius: '8px', 
                                gap: '8px' 
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', flexShrink: 0 }}>
                                        <FileText size={18} />
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-primary)' }}>{req.details.name}</div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{req.details.city} • {new Date(req.createdAt).toLocaleDateString()}</div>
                                    </div>
                                </div>
                                <div style={{ marginLeft: window.innerWidth < 480 ? '48px' : '0' }}>
                                    <span className={`status-badge ${req.status}`} style={{ fontSize: '11px' }}>
                                        {req.status.toUpperCase()}
                                    </span>
                                </div>
                            </div>
                        )) : (
                            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>No recent requests.</div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Dashboard;
