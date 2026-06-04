import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type UserRole = 'user' | 'manager';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: UserRole;
  rating: number;
  totalReviews: number;
  joinedDate: string;
  isEmailVerified: boolean;
  status: 'active' | 'suspended' | 'banned';
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isCustomer: boolean;
  isManager: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = 'http://localhost:5000/api/auth';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = sessionStorage.getItem('user');

    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = async (email: string, password: string) => {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }

    const loggedInUser: User = {
      id: data.user.id,
      email: data.user.email,
      name: data.user.userName,
      role: data.user.role,
      rating: 0,
      totalReviews: 0,
      joinedDate: new Date().toISOString().split('T')[0],
      isEmailVerified: true,
      status: 'active'
    };

    sessionStorage.setItem('token', data.token);
    sessionStorage.setItem('user', JSON.stringify(loggedInUser));

    setUser(loggedInUser);
  };

  const register = async (email: string, password: string, name: string) => {
    const newUser: User = {
      id: Date.now().toString(),
      email,
      name,
      role: 'user',
      rating: 0,
      totalReviews: 0,
      joinedDate: new Date().toISOString().split('T')[0],
      isEmailVerified: false,
      status: 'active'
    };

    sessionStorage.setItem('user', JSON.stringify(newUser));
    setUser(newUser);
  };

  const logout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    setUser(null);
  };

  const updateProfile = (updates: Partial<User>) => {
    if (!user) return;

    const updatedUser = {
      ...user,
      ...updates
    };

    sessionStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isCustomer: user?.role === 'user',
        isManager: user?.role === 'manager',
        login,
        register,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}