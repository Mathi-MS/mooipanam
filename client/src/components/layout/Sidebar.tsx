import React, { useState } from 'react';
import { LayoutDashboard, Users, LogOut, ChevronLeft, ChevronRight, PieChart, X, ClipboardList } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../redux/slices/authSlice';
import { useNavigate, useLocation } from 'react-router-dom';
import type { RootState } from '../../redux/store';
import './Sidebar.css';

interface SidebarProps {
    isMobileOpen: boolean;
    onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, onClose }) => {
    const [collapsed, setCollapsed] = useState(false);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useSelector((state: RootState) => state.auth);

    const handleLogout = () => {
        dispatch(logout());
        navigate('/login');
    };

    const getMenuItems = () => {
        const role = user?.role?.toLowerCase() || 'user';

        const items = [
            { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/dashboard' },
        ];

        if (role === 'superadmin') {
            items.push({ icon: <Users size={20} />, label: 'Users', path: '/users' });
        }

        if (role === 'superadmin' || role === 'admin' || role === 'user') {
            items.push({ icon: <PieChart size={20} />, label: 'Reports', path: '/reports' });
        }

        items.push({ icon: <ClipboardList size={20} />, label: 'Request', path: '/requests' });



        return items;
    };

    const menuItems = getMenuItems();

    return (
        <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}>
            <div className="sidebar-header">
                <h1 className="logo">{collapsed ? 'MP' : 'Mooi Panam'}</h1>
                <div className="sidebar-actions">
                    <button onClick={() => setCollapsed(!collapsed)} className="collapse-btn desktop-only">
                        {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                    </button>
                    <button onClick={onClose} className="close-btn mobile-only">
                        <X size={20} />
                    </button>
                </div>
            </div>

            <nav className="sidebar-nav">
                {menuItems.map((item, index) => (
                    <div
                        key={index}
                        className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                        onClick={() => {
                            navigate(item.path);
                            if (window.innerWidth < 768) onClose();
                        }}
                    >
                        {item.icon}
                        {!collapsed && <span>{item.label}</span>}
                        {collapsed && isMobileOpen && <span>{item.label}</span>}
                    </div>
                ))}
            </nav>

            <div className="sidebar-footer">
                <div className="nav-item logout" onClick={handleLogout} style={{ cursor: 'pointer' }}>
                    <LogOut size={20} />
                    {(!collapsed || isMobileOpen) && <span>Logout</span>}
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
