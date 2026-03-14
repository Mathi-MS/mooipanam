import React, { useState, useEffect, useCallback } from 'react';
import { Search, ChevronLeft, ChevronRight, User as UserIcon, Shield, LayoutGrid, List } from 'lucide-react';
import { toast } from 'react-toastify';
import ActionModal from '../components/common/ActionModal';
import api from '../utils/api';
import './UsersPage.css';

interface User {
    _id: string;
    name: string;
    email: string;
    role: 'superadmin' | 'admin' | 'staff' | 'user';
    createdAt: string;
    lastLogin?: string;
}

const UsersPage: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [activeTab, setActiveTab] = useState<'admin' | 'user'>('user');
    const [viewMode, setViewMode] = useState<'table' | 'card'>(window.innerWidth < 768 ? 'card' : 'table');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalUsers, setTotalUsers] = useState(0);
    const [loading, setLoading] = useState(false);

    // Modal state
    const [roleModal, setRoleModal] = useState<{ isOpen: boolean; userId: string; currentRole: string }>({
        isOpen: false,
        userId: '',
        currentRole: ''
    });

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get('/users', {
                params: {
                    page,
                    limit: 5,
                    role: activeTab,
                    search: search || undefined
                }
            });
            setUsers(response.data.users);
            setTotalPages(response.data.totalPages);
            setTotalUsers(response.data.totalUsers);
        } catch (error) {
            toast.error('Failed to fetch users');
            console.error('Failed to fetch users:', error);
        } finally {
            setLoading(false);
        }
    }, [page, activeTab, search]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchUsers();
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [fetchUsers]);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
        setPage(1); // Reset to first page on search
    };

    const handleTabChange = (tab: 'admin' | 'user') => {
        setActiveTab(tab);
        setPage(page === 1 ? 1 : 1); // Reset to first page on tab change
        setPage(1);
    };

    const handleRoleUpdate = async () => {
        const { userId, currentRole } = roleModal;
        const newRole = currentRole === 'user' ? 'admin' : 'user';

        try {
            await api.patch(`/users/${userId}/role`, { role: newRole });
            toast.success(`User role updated to ${newRole}`);
            setRoleModal({ isOpen: false, userId: '', currentRole: '' });
            fetchUsers(); // Refresh the list
        } catch (error) {
            console.error('Failed to update role:', error);
            toast.error('Failed to update user role');
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'Never';
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="users-page">
            <ActionModal
                isOpen={roleModal.isOpen}
                title="Change User Role"
                message={`Are you sure you want to change this user's role to ${roleModal.currentRole === 'user' ? 'admin' : 'user'}?`}
                confirmLabel="Confirm"
                onConfirm={handleRoleUpdate}
                onClose={() => setRoleModal({ isOpen: false, userId: '', currentRole: '' })}
            />
            <div className="users-header">
                <div className="tabs">
                    <button
                        className={`tab ${activeTab === 'user' ? 'active' : ''}`}
                        onClick={() => handleTabChange('user')}
                    >
                        Users
                    </button>
                    <button
                        className={`tab ${activeTab === 'admin' ? 'active' : ''}`}
                        onClick={() => handleTabChange('admin')}
                    >
                        Admins
                    </button>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <div className="search-container">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={search}
                            onChange={handleSearch}
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
                                <th>S.No</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Created At</th>
                                <th>Last Login</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>
                                        Loading users...
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>
                                        No users found.
                                    </td>
                                </tr>
                            ) : (
                                users.map((user, index) => (
                                    <tr key={user._id}>
                                        <td>{(page - 1) * 5 + index + 1}</td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                {user.role === 'user' ? <UserIcon size={16} /> : <Shield size={16} />}
                                                {user.name}
                                            </div>
                                        </td>
                                        <td>{user.email}</td>
                                        <td>
                                            <span className={`role-badge ${user.role}`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td>{formatDate(user.createdAt)}</td>
                                        <td>{formatDate(user.lastLogin)}</td>
                                        <td>
                                            {user.role !== 'superadmin' && (
                                                <button
                                                    className="action-btn"
                                                    onClick={() => setRoleModal({ isOpen: true, userId: user._id, currentRole: user.role })}
                                                >
                                                    Change to {user.role === 'user' ? 'Admin' : 'User'}
                                                </button>
                                            )}
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
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px' }}>Loading users...</div>
                    ) : users.length === 0 ? (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px' }}>No users found.</div>
                    ) : (
                        users.map((user, index) => (
                            <div key={user._id} style={{ background: 'var(--bg-primary)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)' }}>
                                            {user.role === 'user' ? <UserIcon size={20} /> : <Shield size={20} />}
                                        </div>
                                        <div>
                                            <h4 style={{ margin: 0, fontSize: '15px', color: 'var(--text-primary)' }}>{user.name}</h4>
                                            <span className={`role-badge ${user.role}`} style={{ display: 'inline-block', marginTop: '4px' }}>{user.role}</span>
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600' }}>#{((page - 1) * 5 + index + 1)}</div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', marginBottom: '16px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: 'var(--text-secondary)' }}>Email:</span>
                                        <span style={{ fontWeight: '500' }}>{user.email}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: 'var(--text-secondary)' }}>Created:</span>
                                        <span style={{ fontWeight: '500' }}>{formatDate(user.createdAt)}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: 'var(--text-secondary)' }}>Last Login:</span>
                                        <span style={{ fontWeight: '500' }}>{formatDate(user.lastLogin)}</span>
                                    </div>
                                </div>
                                {user.role !== 'superadmin' && (
                                    <button
                                        style={{ width: '100%', padding: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--accent-primary)', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}
                                        onClick={() => setRoleModal({ isOpen: true, userId: user._id, currentRole: user.role })}
                                    >
                                        Change to {user.role === 'user' ? 'Admin' : 'User'}
                                    </button>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}

            <div className="pagination">
                <div className="pagination-info">
                    Page {page} of {totalPages} ({totalUsers} users)
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

export default UsersPage;
