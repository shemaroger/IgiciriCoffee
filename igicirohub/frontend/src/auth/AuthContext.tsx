import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, tokenStorage } from '../services/api';

export type UserRole = 'cooperative' | 'buyer' | 'guest';

export interface UserSession {
  id: number;
  email: string;
  displayName: string;
  role: UserRole;
  phone?: string;
  location?: string;
  district?: string;
}

interface RegisterPayload {
  email: string;
  password: string;
  password2: string;
  first_name?: string;
  last_name?: string;
  role: UserRole;
  phone?: string;
  location?: string;
  district?: string;
  business_name?: string;
  display_name?: string;
}

interface AuthContextType {
  session: UserSession | null;
  isLoading: boolean;
  login: (email: string, password: string, role?: UserRole) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterPayload) => Promise<{ success: boolean; error?: string }>;
  loginAsGuest: () => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

const normalizeRole = (role: string): UserRole => {
  if (role === 'farmer')      return 'cooperative';
  if (role === 'buyer')       return 'buyer';
  if (role === 'cooperative') return 'cooperative';
  return 'cooperative';
};

const buildSession = (u: any): UserSession => ({
  id:          u.id,
  email:       u.email,
  displayName: u.display_name || u.first_name || u.username || 'User',
  role:        normalizeRole(u.role || ''),
  phone:       u.phone,
  location:    u.location,
  district:    u.district,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession]   = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = await tokenStorage.getAccess();
        if (token) {
          const result = await api.get<any>('/auth/me/');
          if (result.data) {
            setSession(buildSession(result.data));
          } else {
            await tokenStorage.clearAll();
          }
        }
      } catch {
        await tokenStorage.clearAll();
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = async (email: string, password: string, role?: UserRole) => {
    const result = await api.post<any>('/auth/login/', { email, password, role }, false);
    if (result.error) return { success: false, error: result.error };
    await tokenStorage.setAccess(result.data.tokens.access);
    await tokenStorage.setRefresh(result.data.tokens.refresh);
    setSession(buildSession(result.data.user));
    return { success: true };
  };

  const register = async (payload: RegisterPayload) => {
    const result = await api.post<any>('/auth/register/', payload, false);
    if (result.error) return { success: false, error: result.error };
    await tokenStorage.setAccess(result.data.tokens.access);
    await tokenStorage.setRefresh(result.data.tokens.refresh);
    setSession(buildSession(result.data.user));
    return { success: true };
  };

  const loginAsGuest = () => {
    setSession({ id: 0, email: 'guest', displayName: 'Guest', role: 'guest' });
  };

  const logout = async () => {
    try {
      const refresh = await tokenStorage.getRefresh();
      if (refresh) await api.post('/auth/logout/', { refresh });
    } catch {}
    await tokenStorage.clearAll();
    setSession(null);
  };

  const refreshUser = async () => {
    const result = await api.get<any>('/auth/me/');
    if (result.data) setSession(buildSession(result.data));
  };

  return (
    <AuthContext.Provider value={{ session, isLoading, login, register, loginAsGuest, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);