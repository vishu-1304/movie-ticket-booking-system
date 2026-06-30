import React, { createContext, useContext, useState, useEffect } from 'react';
import api, { setAccessToken } from '../../services/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  phoneNumber?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, phoneNumber?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/auth/me');
      setUser(response.data.data.user);
    } catch (error) {
      setUser(null);
      setAccessToken(null);
    }
  };

  const checkAuth = async () => {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (!isLoggedIn) {
      setLoading(false);
      return;
    }
    
    try {
      // First try refreshing the token to see if session is active
      const refreshResponse = await api.post('/auth/refresh');
      const token = refreshResponse.data.data.accessToken;
      setAccessToken(token);
      await fetchProfile();
    } catch (error) {
      // Refresh token failed
      localStorage.removeItem('isLoggedIn');
      setUser(null);
      setAccessToken(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();

    // Listen to session expired event from axios interceptor
    const handleSessionExpired = () => {
      setUser(null);
      setAccessToken(null);
      localStorage.removeItem('isLoggedIn');
    };

    window.addEventListener('auth_session_expired', handleSessionExpired);
    return () => {
      window.removeEventListener('auth_session_expired', handleSessionExpired);
    };
  }, []);

  const login = async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    const { accessToken, user: loggedUser } = response.data.data;
    setAccessToken(accessToken);
    setUser(loggedUser);
    localStorage.setItem('isLoggedIn', 'true');
  };

  const register = async (name: string, email: string, password: string, phoneNumber?: string) => {
    await api.post('/auth/register', { name, email, password, phoneNumber });
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // ignore logout errors on server
    } finally {
      setAccessToken(null);
      setUser(null);
      localStorage.removeItem('isLoggedIn');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
