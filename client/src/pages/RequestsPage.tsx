import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Eye, Edit2, Trash2, Search, ChevronLeft, ChevronRight, LayoutGrid, List } from 'lucide-react';
import { useSelector } from 'react-redux';
import type { RootState } from '../redux/store';
import api from '../utils/api';
import { toast } from 'react-toastify';
import ActionModal from '../components/common/ActionModal';
import RequestModal from '../components/requests/RequestModal';
import OfflinePaymentModal from '../components/requests/OfflinePaymentModal';
import QRCodeModal from '../components/requests/QRCodeModal';
import { QrCode, Banknote, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './RequestsPage.css';

interface Request {
    _id: string;
    user: { name: string; email: string };
    details: {
        name: string;
        mobile: string;
        city: string;
        dateTime: string;
        brideName: string;
        groomName: string;
    };
    paymentType: string;
    status: 'pending' | 'accepted' | 'rejected';
    isDeleted: boolean;
    deletionReason?: string;
    createdAt: string;
}

const RequestsPage: React.FC = () => {
    const { user: currentUser } = useSelector((state: RootState) => state.auth);
    const navigate = useNavigate();
    const [requests, setRequests] = useState<Request[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
    const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [viewMode, setViewMode] = useState<'table' | 'card'>(window.innerWidth < 768 ? 'card' : 'table');

    // Modal states
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string }>({ isOpen: false, id: '' });
    const [rejectModal, setRejectModal] = useState<{ isOpen: boolean; id: string }>({ isOpen: false, id: '' });
    const [offlineModal, setOfflineModal] = useState<{ isOpen: boolean; id: string }>({ isOpen: false, id: '' });
    const [qrModal, setQrModal] = useState<{ isOpen: boolean; url: string }>({ isOpen: false, url: '' });

    const fetchRequests = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get('/requests', {
                params: { page, limit: 5, search }
            });
            setRequests(response.data.requests);
            setTotalPages(response.data.totalPages);
        } catch (error) {
            toast.error('Failed to fetch requests');
            console.error('Failed to fetch requests:', error);
        } finally {
            setLoading(false);
        }
    }, [page, search]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchRequests();
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [fetchRequests, search]);

    const handleCreateRequest = async (data: any) => {
        try {
            if (modalMode === 'edit' && selectedRequest) {
                await api.put(`/requests/${selectedRequest._id}`, data);
                toast.success('Request updated successfully!');
            } else {
                await api.post('/requests', data);
                toast.success('Request submitted successfully!');
            }
            setIsModalOpen(false);
            setSelectedRequest(null);
            fetchRequests();
        } catch (error) {
            console.error(`Failed to ${modalMode} request:`, error);
            toast.error(`Failed to ${modalMode === 'edit' ? 'update' : 'submit'} request`);
        }
    };

    const handleView = (req: Request) => {
        setSelectedRequest(req);
        setModalMode('view');
        setIsModalOpen(true);
    };

    const handleEdit = (req: Request) => {
        setSelectedRequest(req);
        setModalMode('edit');
        setIsModalOpen(true);
    };

    const handleOpenCreate = () => {
        setSelectedRequest(null);
        setModalMode('create');
        setIsModalOpen(true);
    };

    const handleDelete = async (reason?: string) => {
        if (!reason) return;
        try {
            await api.delete(`/requests/${deleteModal.id}`, { data: { reason } });
            toast.success('Request deleted successfully');
            setDeleteModal({ isOpen: false, id: '' });
            fetchRequests();
        } catch (error) {
            console.error('Failed to delete request:', error);
            toast.error('Failed to delete request');
        }
    };

    const handleReview = async (id: string, status: 'accepted' | 'rejected', remarks?: string) => {
        if (status === 'rejected' && !remarks) {
            setRejectModal({ isOpen: true, id });
            return;
        }

        try {
            await api.patch(`/requests/${id}/review`, { status, remarks });
            toast.success(`Request ${status} successfully`);
            setRejectModal({ isOpen: false, id: '' });
            fetchRequests();
        } catch (error) {
            console.error('Failed to review request:', error);
            toast.error('Failed to update request status');
        }
    };

    const handleOfflineSubmit = async (data: any) => {
        try {
            await api.post(`/requests/${offlineModal.id}/offline-payment`, data);
            toast.success('Offline payment details submitted!');
            setOfflineModal({ isOpen: false, id: '' });
            fetchRequests();
        } catch (error) {
            toast.error('Failed to submit offline payment');
        }
    };

    const handleOpenQR = (id: string) => {
        const url = `${window.location.origin}/#/payment/${id}`;
        setQrModal({ isOpen: true, url });
    };

    const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'superadmin';

    return (
        <div className="requests-page">
            {/* Action Modals */}
            <ActionModal
                isOpen={deleteModal.isOpen}
                title="Delete Request"
                message="Are you sure you want to delete this request? This action cannot be undone."
                placeholder="Reason for deletion..."
                confirmLabel="Delete"
                requireInput={true}
                onConfirm={handleDelete}
                onClose={() => setDeleteModal({ isOpen: false, id: '' })}
            />

            <ActionModal
                isOpen={rejectModal.isOpen}
                title="Reject Request"
                message="Please provide a reason for rejecting this request."
                placeholder="Rejection remarks..."
                confirmLabel="Reject"
                requireInput={true}
                onConfirm={(remarks) => handleReview(rejectModal.id, 'rejected', remarks)}
                onClose={() => setRejectModal({ isOpen: false, id: '' })}
            />

            <div className="requests-controls">
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <div className="search-container">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Search requests..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1); // Reset page on new search
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
                {!isAdmin && (
                    <button className="btn-add" onClick={handleOpenCreate}>
                        <Plus size={20} />
                        New Request
                    </button>
                )}
            </div>

            {viewMode === 'table' ? (
                <div className="table-container" style={{ marginBottom: '24px' }}>
                    <table className="users-table">
                    <thead>
                        <tr>
                            <th>S.No</th>
                            {isAdmin && <th>User</th>}
                            <th>Bride & Groom</th>
                            <th>Location</th>
                            <th>Date & Time</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>Loading...</td></tr>
                        ) : requests.length === 0 ? (
                            <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>No requests found.</td></tr>
                        ) : (
                            requests.map((req, index) => (
                                <tr key={req._id}>
                                    <td>{(page - 1) * 5 + index + 1}</td>
                                    {isAdmin && (
                                        <td>
                                            <div className="user-info">
                                                <span className="user-name">{req.user?.name}</span>
                                                <span className="user-role" style={{ fontSize: '10px' }}>{req.user?.email}</span>
                                            </div>
                                        </td>
                                    )}
                                    <td>
                                        <div style={{ fontWeight: '600' }}>{req.details.brideName}</div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>& {req.details.groomName}</div>
                                    </td>
                                    <td>{req.details.city}</td>
                                    <td>
                                        <div style={{ fontSize: '13px' }}>
                                            {new Date(req.details.dateTime).toLocaleDateString()}
                                        </div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                            {new Date(req.details.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </td>
                                    <td>
                                        {req.isDeleted ? (
                                            <span className="status-badge deleted" title={`Reason: ${req.deletionReason}`}>
                                                Deleted
                                            </span>
                                        ) : (
                                            <span className={`status-badge ${req.status}`}>
                                                {req.status}
                                            </span>
                                        )}
                                    </td>
                                    <td className="actions-cell">
                                        {!req.isDeleted && (
                                            <>
                                                {!isAdmin ? (
                                                    <>
                                                        <button 
                                                            className="action-icon-btn"
                                                            onClick={() => handleView(req)}
                                                        >
                                                            <Eye size={16} />
                                                        </button>
                                                        {req.status === 'accepted' && (
                                                            <>
                                                                {(req.paymentType === 'online' || req.paymentType === 'both') && (
                                                                    <button 
                                                                        className="action-icon-btn"
                                                                        title="Pay Online (QR)"
                                                                        onClick={() => handleOpenQR(req._id)}
                                                                        style={{ color: 'var(--accent-primary)' }}
                                                                    >
                                                                        <QrCode size={16} />
                                                                    </button>
                                                                )}
                                                                {(req.paymentType === 'offline' || req.paymentType === 'both') && (
                                                                    <button 
                                                                        className="action-icon-btn"
                                                                        title="Submit Offline Payment"
                                                                        onClick={() => setOfflineModal({ isOpen: true, id: req._id })}
                                                                        style={{ color: '#f59e0b' }}
                                                                    >
                                                                        <Banknote size={16} />
                                                                    </button>
                                                                )}
                                                                {/* Report Button for Paid Requests */}
                                                                {(req as any).paymentStatus && (req as any).paymentStatus !== 'unpaid' && (
                                                                    <button 
                                                                        className="action-icon-btn"
                                                                        title="View Payment Report"
                                                                        onClick={() => navigate(`/reports?name=${encodeURIComponent(req.details.name)}`)}
                                                                        style={{ color: '#6366f1' }}
                                                                    >
                                                                        <FileText size={16} />
                                                                    </button>
                                                                )}
                                                            </>
                                                        )}
                                                        {req.status === 'pending' && (
                                                            <button 
                                                                className="action-icon-btn"
                                                                onClick={() => handleEdit(req)}
                                                            >
                                                                <Edit2 size={16} />
                                                            </button>
                                                        )}
                                                        <button
                                                            className="action-icon-btn delete"
                                                            onClick={() => setDeleteModal({ isOpen: true, id: req._id })}
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        {req.status === 'pending' && (
                                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                                <button
                                                                    className="review-btn accept"
                                                                    onClick={() => handleReview(req._id, 'accepted')}
                                                                >
                                                                    Accept
                                                                </button>
                                                                <button
                                                                    className="review-btn reject"
                                                                    onClick={() => handleReview(req._id, 'rejected')}
                                                                >
                                                                    Reject
                                                                </button>
                                                            </div>
                                                        )}
                                                        <button 
                                                            className="action-icon-btn"
                                                            onClick={() => handleView(req)}
                                                        >
                                                            <Eye size={16} />
                                                        </button>
                                                    </>
                                                )}
                                            </>
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
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px' }}>Loading...</div>
                    ) : requests.length === 0 ? (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px' }}>No requests found.</div>
                    ) : (
                        requests.map((req, index) => (
                            <div key={req._id} style={{ background: 'var(--bg-primary)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                    <div>
                                        <div style={{ fontWeight: '600', fontSize: '15px' }}>{req.details.brideName}</div>
                                        <div style={{ fontWeight: '600', fontSize: '15px' }}>& {req.details.groomName}</div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>{new Date(req.details.dateTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</div>
                                    </div>
                                    {req.isDeleted ? (
                                        <span className="status-badge deleted" title={`Reason: ${req.deletionReason}`}>Deleted</span>
                                    ) : (
                                        <span className={`status-badge ${req.status}`}>{req.status}</span>
                                    )}
                                </div>
                                <div style={{ fontSize: '13px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: 'var(--text-secondary)' }}>Location:</span>
                                        <span style={{ fontWeight: '500' }}>{req.details.city}</span>
                                    </div>
                                    {isAdmin && req.user && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ color: 'var(--text-secondary)' }}>Requested By:</span>
                                            <span style={{ fontWeight: '500' }}>{req.user.name}</span>
                                        </div>
                                    )}
                                </div>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                                    {!req.isDeleted && (
                                        <>
                                            {!isAdmin ? (
                                                <>
                                                    <button className="action-icon-btn" onClick={() => handleView(req)}><Eye size={16} /></button>
                                                    {req.status === 'accepted' && (
                                                        <>
                                                            {(req.paymentType === 'online' || req.paymentType === 'both') && (
                                                                <button className="action-icon-btn" title="Pay Online (QR)" onClick={() => handleOpenQR(req._id)} style={{ color: 'var(--accent-primary)' }}><QrCode size={16} /></button>
                                                            )}
                                                            {(req.paymentType === 'offline' || req.paymentType === 'both') && (
                                                                <button className="action-icon-btn" title="Submit Offline Payment" onClick={() => setOfflineModal({ isOpen: true, id: req._id })} style={{ color: '#f59e0b' }}><Banknote size={16} /></button>
                                                            )}
                                                            {(req as any).paymentStatus && (req as any).paymentStatus !== 'unpaid' && (
                                                                <button className="action-icon-btn" title="View Payment Report" onClick={() => navigate(`/reports?name=${encodeURIComponent(req.details.name)}`)} style={{ color: '#6366f1' }}><FileText size={16} /></button>
                                                            )}
                                                        </>
                                                    )}
                                                    {req.status === 'pending' && (
                                                        <button className="action-icon-btn" onClick={() => handleEdit(req)}><Edit2 size={16} /></button>
                                                    )}
                                                    <button className="action-icon-btn delete" onClick={() => setDeleteModal({ isOpen: true, id: req._id })}><Trash2 size={16} /></button>
                                                </>
                                            ) : (
                                                <div style={{ display: 'flex', width: '100%', gap: '8px' }}>
                                                    {req.status === 'pending' && (
                                                        <>
                                                            <button className="review-btn accept" style={{ flex: 1 }} onClick={() => handleReview(req._id, 'accepted')}>Accept</button>
                                                            <button className="review-btn reject" style={{ flex: 1 }} onClick={() => handleReview(req._id, 'rejected')}>Reject</button>
                                                        </>
                                                    )}
                                                    <button className="action-icon-btn" onClick={() => handleView(req)}><Eye size={16} /></button>
                                                </div>
                                            )}
                                        </>
                                    )}
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
                    <button className="page-btn" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>

            <RequestModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setSelectedRequest(null);
                }}
                onSubmit={handleCreateRequest}
                mode={modalMode}
                initialData={selectedRequest}
            />

            <OfflinePaymentModal
                isOpen={offlineModal.isOpen}
                onClose={() => setOfflineModal({ isOpen: false, id: '' })}
                onSubmit={handleOfflineSubmit}
            />

            <QRCodeModal
                isOpen={qrModal.isOpen}
                onClose={() => setQrModal({ isOpen: false, url: '' })}
                paymentUrl={qrModal.url}
            />
        </div>
    );
};

export default RequestsPage;
