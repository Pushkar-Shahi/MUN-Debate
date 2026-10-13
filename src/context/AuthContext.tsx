// ============================================================
// Auth Context — Mock Authentication Provider
// ============================================================

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'user' | 'admin';
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => void;
}

const AUTH_STORAGE_KEY = 'mun_debate_auth_v1';
const USERS_STORAGE_KEY = 'mun_debate_users_v1';

// Key used to tell the api service which user is logged in so data is namespaced
export const CURRENT_USER_ID_KEY = 'mun_debate_current_user_id';

interface StoredUser extends User {
  password: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as User;
        setUser(parsed);
        // Restore current user id for data namespacing
        localStorage.setItem(CURRENT_USER_ID_KEY, parsed.id);
      }
    } catch {
      // ignore
    }
    setIsLoading(false);
  }, []);

  // Persist session changes
  useEffect(() => {
    if (user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      localStorage.setItem(CURRENT_USER_ID_KEY, user.id);
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem(CURRENT_USER_ID_KEY);
    }
  }, [user]);

  function getUsers(): StoredUser[] {
    try {
      const data = localStorage.getItem(USERS_STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      // Seed default demo user accounts so login works immediately
      const defaultUsers: StoredUser[] = [
        {
          id: 'usr_demo_delegate',
          name: 'Aarav Sharma (Demo)',
          email: 'demo@mun.org',
          password: 'password123',
          role: 'user',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'usr_admin',
          name: 'Platform Admin',
          email: 'admin@mun.org',
          password: 'password123',
          role: 'admin',
          createdAt: new Date().toISOString(),
        },
      ];
      saveUsers(defaultUsers);
      return defaultUsers;
    } catch {
      return [];
    }
  }

  function saveUsers(users: StoredUser[]) {
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    } catch {
      // ignore
    }
  }

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    // Simulate slight network delay
    await new Promise(r => setTimeout(r, 400));

    const users = getUsers();
    const found = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!found) {
      return { success: false, error: 'No account found with this email address.' };
    }
    if (found.password !== password) {
      return { success: false, error: 'Incorrect password. Please try again.' };
    }

    const { password: _, ...userWithoutPw } = found;
    // Set synchronously before state update so API queries immediately resolve the active user
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userWithoutPw));
      localStorage.setItem(CURRENT_USER_ID_KEY, userWithoutPw.id);
    } catch {
      // ignore
    }
    setUser(userWithoutPw);
    return { success: true };
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    await new Promise(r => setTimeout(r, 400));

    const users = getUsers();
    const exists = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (exists) {
      return { success: false, error: 'An account with this email already exists.' };
    }

    const newUser: StoredUser = {
      id: `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name,
      email: email.toLowerCase(),
      password,
      role: 'user',
      createdAt: new Date().toISOString(),
    };

    const updatedUsers = [...users, newUser];
    saveUsers(updatedUsers);

    const { password: _, ...userWithoutPw } = newUser;
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userWithoutPw));
      localStorage.setItem(CURRENT_USER_ID_KEY, userWithoutPw.id);
    } catch {
      // ignore
    }
    setUser(userWithoutPw);
    return { success: true };
  }, []);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem(CURRENT_USER_ID_KEY);
    } catch {
      // ignore
    }
    setUser(null);
  }, []);

  const updateProfile = useCallback((updates: Partial<User>) => {
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...updates };
      // Also update in stored users list
      const users = getUsers();
      const idx = users.findIndex(u => u.id === prev.id);
      if (idx >= 0) {
        users[idx] = { ...users[idx], ...updates };
        saveUsers(users);
      }
      try {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  }, []);

  const value = useMemo(() => ({
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    signup,
    logout,
    updateProfile,
  }), [user, isLoading, login, signup, logout, updateProfile]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
