import React, { useState, useEffect, useCallback } from 'react';
import { Search, ChevronLeft, ChevronRight, User as UserIcon, Shield } from 'lucide-react';
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
        fetchUsers();
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

                <div className="search-container">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={search}
                        onChange={handleSearch}
                    />
                </div>
            </div>

            <div className="table-container">
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

                <div className="pagination">
                    <div className="pagination-info">
                        Showing {users.length} of {totalUsers} users
                    </div>
                    <div className="pagination-controls">
                        <button
                            className="page-btn"
                            disabled={page === 1}
                            onClick={() => setPage(page - 1)}
                        >
                            <ChevronLeft size={18} />
                        </button>

                        {[...Array(totalPages)].map((_, i) => (
                            <button
                                key={i + 1}
                                className={`page-btn ${page === i + 1 ? 'active' : ''}`}
                                onClick={() => setPage(i + 1)}
                            >
                                {i + 1}
                            </button>
                        ))}

                        <button
                            className="page-btn"
                            disabled={page === totalPages}
                            onClick={() => setPage(page + 1)}
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UsersPage;
