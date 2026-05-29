import React, { createContext, useContext, useState, ReactNode } from 'react';

export type UserRole = 'user' | 'manager' | 'admin';

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
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for demo
const MOCK_USERS: User[] = [
  {
    id: '1',
    email: 'user@demo.com',
    name: 'John Doe',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
    role: 'user',
    rating: 4.8,
    totalReviews: 24,
    joinedDate: '2024-01-15',
    isEmailVerified: true,
    status: 'active',
  },
  {
    id: '2',
    email: 'manager@demo.com',
    name: 'Sarah Manager',
    role: 'manager',
    rating: 5.0,
    totalReviews: 15,
    joinedDate: '2023-11-20',
    isEmailVerified: true,
    status: 'active',
  },
  {
    id: '3',
    email: 'admin@demo.com',
    name: 'Admin User',
    role: 'admin',
    rating: 5.0,
    totalReviews: 0,
    joinedDate: '2023-10-01',
    isEmailVerified: true,
    status: 'active',
  },
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, password: string) => {
    // Mock login
    const foundUser = MOCK_USERS.find(u => u.email === email);
    if (foundUser) {
      setUser(foundUser);
    } else {
      throw new Error('Invalid credentials');
    }
  };

  const register = async (email: string, password: string, name: string) => {
    // Mock registration
    const newUser: User = {
      id: Date.now().toString(),
      email,
      name,
      role: 'user',
      rating: 0,
      totalReviews: 0,
      joinedDate: new Date().toISOString().split('T')[0],
      isEmailVerified: false,
      status: 'active',
    };
    setUser(newUser);
  };

  const logout = () => {
    setUser(null);
  };

  const updateProfile = (updates: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...updates });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
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
