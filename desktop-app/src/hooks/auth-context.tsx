import React, { createContext, useContext, useEffect, useState } from "react";
import { login, register, logout, onAuthChange, User } from "@/lib/auth-service";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User | null>;
  register: (email: string, password: string, displayName?: string) => Promise<User | null>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      if (user) {
        setUser({
          uid: user.uid,
          email: user.email || "",
          displayName: user.displayName,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleLogin = async (email: string, password: string) => {
    setLoading(true);
    try {
      const fbUser = await login(email, password);
      const mappedUser = fbUser
        ? {
            uid: fbUser.uid,
            email: fbUser.email || "",
            displayName: fbUser.displayName || undefined,
          }
        : null;
      setUser(mappedUser);
      return mappedUser;
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (email: string, password: string, displayName?: string) => {
    setLoading(true);
    try {
      const fbUser = await register(email, password, displayName);
      const mappedUser = fbUser
        ? {
            uid: fbUser.uid,
            email: fbUser.email || "",
            displayName: fbUser.displayName || undefined,
          }
        : null;
      setUser(mappedUser);
      return mappedUser;
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logout();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login: handleLogin, register: handleRegister, logout: handleLogout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
