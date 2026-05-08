import { createContext, useState, useEffect, useCallback } from 'react';
import { mockRegister, mockLogin, mockLogout } from '../services/mockAuth';
import { authApi, setTokens, clearTokens, getRefreshToken } from '../services/api';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try { setUser(JSON.parse(stored)); }
      catch { clearTokens(); }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email, password) => {
    let result;
    try {
      const { data } = await authApi.post('/api/auth/login', { email, password });
      result = data.data;
    } catch (err) {
      if (err.response) throw err;
      result = await mockLogin({ email, password });
    }
    setTokens(result.accessToken, result.refreshToken);
    localStorage.setItem('user', JSON.stringify(result.user));
    setUser(result.user);
    return result.user;
  }, []);

  const register = useCallback(async (formData) => {
    let result;
    try {
      const { data } = await authApi.post('/api/auth/register', formData);
      result = data.data;
    } catch (err) {
      if (err.response) throw err;
      result = await mockRegister(formData);
    }
    if (result.accessToken && result.refreshToken) {
      setTokens(result.accessToken, result.refreshToken);
      localStorage.setItem('user', JSON.stringify(result.user));
      setUser(result.user);
    }
    return result;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.post('/api/auth/logout', { refreshToken: getRefreshToken() });
    } catch {
      await mockLogout();
    }
    finally { clearTokens(); setUser(null); }
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
