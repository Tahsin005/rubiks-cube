import { useSelector, useDispatch } from 'react-redux';
import { logout as logoutAction } from '../redux/slices/authSlice';

export const useAuth = () => {
    const { user, token, isAuthenticated } = useSelector((state) => state.auth);
    const dispatch = useDispatch();

    const logout = () => {
        dispatch(logoutAction());
    };

    return {
        user,
        token,
        isAuthenticated,
        logout,
    };
};
