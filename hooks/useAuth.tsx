import React, { createContext, useContext, useState, useEffect } from 'react';
import { Auth, api } from '../services/api';

interface User {
  id: string;
  phone: string;
  fullName: string;
  balance: number;
  currency: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const loggedIn = await Auth.isLoggedIn();
      if (loggedIn) {
        const data = await api.getProfile();
        setUser({
          id: data.user.id,
          phone: data.user.phone,
          fullName: data.user.full_name,
          balance: parseFloat(data.user.balance) || 0,
          currency: data.user.currency || 'UZS',
        });
      }
    } catch (err) {
      await Auth.removeToken();
    } finally {
      setIsLoading(false);
    }
  }

  async function login(token: string, userData: any) {
    await Auth.saveToken(token);
    const u: User = {
      id: userData.id,
      phone: userData.phone,
      fullName: userData.fullName || userData.full_name,
      balance: 0,
      currency: 'UZS',
    };
    setUser(u);
  }

  async function logout() {
    try {
      await api.logout();
    } catch {}
    await Auth.removeToken();
    setUser(null);
  }

  async function refreshUser() {
    try {
      const data = await api.getProfile();
      setUser({
        id: data.user.id,
        phone: data.user.phone,
        fullName: data.user.full_name,
        balance: parseFloat(data.user.balance) || 0,
        currency: data.user.currency || 'UZS',
      });
    } catch {}
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isLoggedIn: !!user,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
