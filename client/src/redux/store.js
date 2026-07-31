import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { authApi } from './api/authApi';
import { usersApi } from './api/usersApi';
import { friendsApi } from './api/friendsApi';
import { messagesApi } from './api/messagesApi';
import { notificationsApi } from './api/notificationsApi';
import authReducer, { logout } from './slices/authSlice';

const appReducer = combineReducers({
    [authApi.reducerPath]: authApi.reducer,
    [usersApi.reducerPath]: usersApi.reducer,
    [friendsApi.reducerPath]: friendsApi.reducer,
    [messagesApi.reducerPath]: messagesApi.reducer,
    [notificationsApi.reducerPath]: notificationsApi.reducer,
    auth: authReducer,
});

const rootReducer = (state, action) => {
    if (action.type === logout.type) {
        return appReducer(undefined, action);
    }
    return appReducer(state, action);
};

export const store = configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(
            authApi.middleware, 
            usersApi.middleware, 
            friendsApi.middleware, 
            messagesApi.middleware,
            notificationsApi.middleware
        ),
});
