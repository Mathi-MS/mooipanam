import React from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, AlertCircle } from 'lucide-react';
import './NotFound.css';

const NotFound: React.FC = () => {
    return (
        <div className="not-found-container">
            <div className="not-found-content">
                <div className="icon-wrapper">
                    <AlertCircle size={80} strokeWidth={1.5} />
                </div>
                <h1>404</h1>
                <h2>Lost in Transit?</h2>
                <p>
                    The page you are looking for doesn't exist or you don't have
                    permission to access it. Let's get you back on track.
                </p>
                <Link to="/dashboard" className="dashboard-btn">
                    <LayoutDashboard size={20} />
                    Back to Dashboard
                </Link>
            </div>
        </div>
    );
};

export default NotFound;
