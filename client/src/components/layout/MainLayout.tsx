import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import './MainLayout.css';

const MainLayout: React.FC = () => {
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    const toggleMobileSidebar = () => {
        setIsMobileSidebarOpen(!isMobileSidebarOpen);
    };

    const closeMobileSidebar = () => {
        setIsMobileSidebarOpen(false);
    };

    return (
        <div className="main-layout">
            <Sidebar
                isMobileOpen={isMobileSidebarOpen}
                onClose={closeMobileSidebar}
            />
            {isMobileSidebarOpen && (
                <div className="sidebar-overlay" onClick={closeMobileSidebar}></div>
            )}
            <div className="content-area">
                <Header onMenuClick={toggleMobileSidebar} />
                <main className="main-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default MainLayout;

