import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthState, Role } from '../types';
import {
  loginUser,
  registerUser,
  updateUserProfile as sbUpdateProfile,
  updateLastActive,
  getUserById,
} from '../services/supabase';

const AuthContext = createContext<AuthState | undefined>(undefined);

const SESSION_KEY = 'ruldatest_session_user_id';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Sahifa ochilganda sessiyani tiklash
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const savedId = localStorage.getItem(SESSION_KEY);
        if (savedId) {
          const userData = await getUserById(savedId);
          if (userData) {
            setUser(userData);
            updateLastActive(userData.id);
          } else {
            localStorage.removeItem(SESSION_KEY);
          }
        }
      } catch (e) {
        console.error('Session restore error', e);
      } finally {
        setLoading(false);
      }
    };
    restoreSession();
  }, []);

  // Har daqiqada online statusni yangilash
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => updateLastActive(user.id), 60000);
    return () => clearInterval(interval);
  }, [user?.id]);

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem(SESSION_KEY, userData.id);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
    window.location.href = '#/';
  };

  const updateProfile = async (updatedUser: User) => {
    const success = await sbUpdateProfile(updatedUser);
    if (success) {
      setUser(updatedUser);
      localStorage.setItem(SESSION_KEY, updatedUser.id);
    }
    return success;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 to-cyan-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-sky-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-semibold">RuldaTest.Uz yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      login,
      logout,
      updateUserProfile: updateProfile as any,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

// Login sahifasi uchun helper funksiyalar
export { loginUser, registerUser };
