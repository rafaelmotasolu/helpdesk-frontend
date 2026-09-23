import React, { createContext, useContext, useState } from 'react';
import type { User } from '../types';
import { authService } from '../api/authService';

interface AuthContextData {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('token');
  });

  const [user, setUser] = useState<User | null>(() => {
    const storagedUser = localStorage.getItem('user');
    if (!storagedUser) return null;
    try {
      return JSON.parse(storagedUser);
    } catch {
      return null;
    }
  });

  const login = async (email: string, pass: string) => {
    const data = await authService.login(email, pass);
    const loggedUser: User = {
      id: data.userId,
      name: data.name,
      email: data.email,
      role: data.role,
    };

    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(loggedUser));
    setToken(data.token);
    setUser(loggedUser);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
