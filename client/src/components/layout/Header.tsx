import React from 'react';
import { Bell, User as UserIcon, Menu } from 'lucide-react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import type { RootState } from '../../redux/store';
import './Header.css';

interface HeaderProps {
    onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
    const location = useLocation();
    const user = useSelector((state: RootState) => state.auth.user);
    const name = user?.name || "Admin";

    const getPageTitle = () => {
        const path = location.pathname;
        if (path === '/dashboard') return 'Dashboard';
        if (path === '/reports') return 'Reports';
        if (path === '/users') return 'Users Management';
        if (path === '/requests') return 'Requests';
        if (path === '/pending-requests') return 'Pending Requests';
        if (path === '/settings') return 'Settings';
        return 'Mooi Panam';
    };

    return (
        <header className="header glass">
            <div className="header-left">
                <button className="menu-btn" onClick={onMenuClick}>
                    <Menu size={24} />
                </button>
                <h2 className="page-title">{getPageTitle()}</h2>
            </div>
            <div className="header-right">
                <button className="icon-btn">
                    <Bell size={20} />
                </button>
                <div className="user-profile">
                    <div className="avatar">
                        <UserIcon size={20} />
                    </div>
                    <div className="user-info">
                        <span className="user-name" title={name}>
                            {name.length > 7 ? `${name.slice(0, 7)}...` : name}
                        </span>
                        <span className="user-role">{user?.role || 'Administrator'}</span>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
