import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../store/store';
import { loginUser, registerUser, logoutUser, fetchProfile, updateProfile, logout as clearAuth } from '../store/slices/auth-slice';
import type { LoginRequest, RegisterRequest } from '../types/auth.types';

export const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user, isAuthenticated, isLoading, error } = useSelector(
    (state: RootState) => state.auth
  );

  const login = async (credentials: LoginRequest) => {
    await dispatch(loginUser(credentials));
  };

  const register = async (data: RegisterRequest) => {
    await dispatch(registerUser(data));
  };

  const logout = async () => {
    await dispatch(logoutUser());
  };

  const getProfile = async () => {
    await dispatch(fetchProfile());
  };

  const updateUserProfile = async (data: { name?: string; bio?: string; avatar_url?: string }) => {
    await dispatch(updateProfile(data));
  };

  const forceLogout = () => {
    dispatch(clearAuth());
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    getProfile,
    updateUserProfile,
    forceLogout,
  };
};
