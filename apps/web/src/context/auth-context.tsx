"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { UserRole } from "@/types/auth";
import { getCurrentUser, logout as logoutApi } from "@/lib/auth";

type AuthenticatedUser = {
  userId: string;
  role: UserRole;
};

type AuthContextValue = {
  user: AuthenticatedUser | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [loading, setLoading] = useState(true);

  async function refreshUser() {
    try {
      const response = await getCurrentUser();
      setUser(response.user);
    } catch {
      setUser(null);
    }
  }

  async function logout() {
    try {
      await logoutApi();
    } finally {
      setUser(null);
    }
  }

  useEffect(() => {
    async function initializeAuth() {
      try {
        await refreshUser();
      } finally {
        setLoading(false);
      }
    }

    void initializeAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
