import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './redux/store';
import MainLayout from './components/layout/MainLayout';
import { ProtectedRoute, PublicRoute } from './components/RouteGuard';
import './index.css';

import Login from './pages/Login';
import Signup from './pages/Signup';
import VerifyOTP from './pages/VerifyOTP';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import NotFound from './pages/NotFound';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import UsersPage from './pages/UsersPage';
import RequestsPage from './pages/RequestsPage';
import PaymentPage from './pages/PaymentPage';
import ReportsPage from './pages/ReportsPage';

import Dashboard from './pages/Dashboard';

function App() {
  return (
    <Provider store={store}>
      <Router>
        <ToastContainer position="top-right" autoClose={3000} />
        <Routes>
          {/* Public Routes */}
          <Route element={<PublicRoute />}>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/verify-otp" element={<VerifyOTP />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
          </Route>

          {/* Truly Public Routes */}
          <Route path="/payment/:id" element={<PaymentPage />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/requests" element={<RequestsPage />} />

              {/* superadmin only */}
              <Route element={<ProtectedRoute allowedRoles={['superadmin']} />}>
                <Route path="/users" element={<UsersPage />} />
              </Route>



              {/* Redirect root of layout to dashboard */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Route>

          {/* Catch-all for non-existing routes or unauthorized access */}
          <Route path="/not-found" element={<NotFound />} />
          <Route path="*" element={<Navigate to="/not-found" replace />} />
        </Routes>
      </Router>
    </Provider>
  );
}

export default App;
