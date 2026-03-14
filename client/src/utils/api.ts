import axios from 'axios';
import { store } from '../redux/store';

import { logout } from '../redux/slices/authSlice';

const api = axios.create({
    baseURL: 'https://mooipanam.onrender.com/api',
});

// Interceptor to add token to headers
api.interceptors.request.use((config) => {
    const state = store.getState();
    const token = state.auth.token;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Interceptor to handle 401 errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            store.dispatch(logout());
            window.location.href = '/login'; // Force redirect to login
        }
        return Promise.reject(error);
    }
);

export default api;
