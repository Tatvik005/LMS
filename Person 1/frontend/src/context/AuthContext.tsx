import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import apiClient, { setAccessToken as setApiAccessToken } from '../api/client';
import { useNavigate } from 'react-router-dom';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'FACULTY' | 'STUDENT';
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Expose token to interceptor
  useEffect(() => {
    setApiAccessToken(accessToken);
  }, [accessToken]);

  // Silent Refresh on Load
  useEffect(() => {
    const initAuth = async () => {
      const storedRefreshToken = localStorage.getItem('refreshToken');
      if (!storedRefreshToken) {
        setIsLoading(false);
        return;
      }

      try {
        const { data } = await apiClient.post('/auth/refresh', { refreshToken: storedRefreshToken });
        setUser(data.user);
        setAccessToken(data.accessToken);
        // The backend also sets HttpOnly cookies. We keep localStorage synchronized for silent refreshes.
        if (data.refreshToken) {
          localStorage.setItem('refreshToken', data.refreshToken);
        }
      } catch (error) {
        localStorage.removeItem('refreshToken');
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (credentials: any) => {
    const { data } = await apiClient.post('/auth/login', credentials);
    setUser(data.user);
    setAccessToken(data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
  };

  const register = async (userData: any) => {
    const { data } = await apiClient.post('/auth/register', userData);
    setUser(data.user);
    setAccessToken(data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
  };

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (e) {
      console.error(e);
    } finally {
      setUser(null);
      setAccessToken(null);
      localStorage.removeItem('refreshToken');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout
      }}
    >
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
