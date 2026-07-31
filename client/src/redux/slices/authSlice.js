import { createSlice } from '@reduxjs/toolkit';
import { authApi } from '../api/authApi';

const token = localStorage.getItem('token') || null;
const userString = localStorage.getItem('user');
const user = userString ? JSON.parse(userString) : null;

const initialState = {
    user,
    token,
    isAuthenticated: !!token,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        logout: (state) => {
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        },
    },
    extraReducers: (builder) => {
        builder.addMatcher(
            authApi.endpoints.login.matchFulfilled,
            (state, { payload }) => {
                state.user = payload.data.user;
                state.token = payload.data.token;
                state.isAuthenticated = true;
                localStorage.setItem('token', payload.data.token);
                localStorage.setItem('user', JSON.stringify(payload.data.user));
            }
        );
        builder.addMatcher(
            authApi.endpoints.register.matchFulfilled,
            (state, { payload }) => {
                state.user = payload.data.user;
                state.token = payload.data.token;
                state.isAuthenticated = true;
                localStorage.setItem('token', payload.data.token);
                localStorage.setItem('user', JSON.stringify(payload.data.user));
            }
        );
    },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
