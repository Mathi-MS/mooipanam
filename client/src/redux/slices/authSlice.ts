import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface User {
    _id: string;
    name: string;
    email: string;
    role: string;
}

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
}

const storedUser = localStorage.getItem('user');
const storedToken = localStorage.getItem('token');
const storedExpiry = localStorage.getItem('tokenExpiry');

const isExpired = storedExpiry ? new Date().getTime() > parseInt(storedExpiry) : true;

const initialState: AuthState = {
    user: (storedUser && !isExpired) ? JSON.parse(storedUser) : null,
    token: (storedToken && !isExpired) ? storedToken : null,
    isAuthenticated: !!storedToken && !isExpired,
};

// Clean up if expired on load
if (isExpired && storedToken) {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('tokenExpiry');
}

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setCredentials: (
            state,
            action: PayloadAction<User & { token: string }>
        ) => {
            const { token, ...userData } = action.payload;
            const expiryTime = new Date().getTime() + 12 * 60 * 60 * 1000; // 12 hours

            state.user = userData;
            state.token = token;
            state.isAuthenticated = true;

            localStorage.setItem('user', JSON.stringify(userData));
            localStorage.setItem('token', token);
            localStorage.setItem('tokenExpiry', expiryTime.toString());
        },
        logout: (state) => {
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            localStorage.removeItem('tokenExpiry');
        },
    },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
