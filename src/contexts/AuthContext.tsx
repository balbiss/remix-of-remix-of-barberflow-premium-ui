import React, { createContext, useContext, useState, ReactNode } from 'react';

export type UserRole = 'owner' | 'barber';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  barbershopId: string;
  barbershopName: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  role: UserRole;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  switchRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const mockUsers: Record<UserRole, User> = {
  owner: {
    id: '1',
    name: 'Ricardo Almeida',
    email: 'ricardo@barberflow.com',
    role: 'owner',
    barbershopId: 'bs-001',
    barbershopName: "THE GENTLEMAN'S CLUB",
  },
  barber: {
    id: '2',
    name: 'Carlos Silva',
    email: 'carlos@barberflow.com',
    role: 'barber',
    barbershopId: 'bs-001',
    barbershopName: "THE GENTLEMAN'S CLUB",
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>('owner');

  const login = async (_email: string, _password: string): Promise<boolean> => {
    await new Promise(r => setTimeout(r, 1200));
    setUser(mockUsers[role]);
    return true;
  };

  const logout = () => setUser(null);

  const switchRole = (newRole: UserRole) => {
    setRole(newRole);
    setUser(mockUsers[newRole]);
  };

  return (
    <AuthContext.Provider value={{ user, role, isAuthenticated: !!user, login, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
