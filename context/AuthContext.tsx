import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User } from '../types';
import { useApp } from './AppContext';

interface AuthContextType {
  currentUser: User | null;
  login: (identifier: string, password?: string) => boolean;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { users } = useApp();

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('pwork_user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        // Verify if user still exists in the system (e.g. hasn't been deleted)
        const validUser = users.find(u => u.id === parsedUser.id);
        if (validUser) {
          setCurrentUser(validUser);
        } else {
          localStorage.removeItem('pwork_user');
        }
      } catch (e) {
        localStorage.removeItem('pwork_user');
      }
    }
    setIsLoading(false);
  }, [users]);

  const login = (identifier: string, password?: string) => {
    // Check against both username and email, and verify password
    const user = users.find((u) => {
        const isIdMatch = u.username.toLowerCase() === identifier.toLowerCase() || u.email.toLowerCase() === identifier.toLowerCase();
        // If password is provided in user record, check it. Otherwise allow for legacy/dev
        const isPassMatch = u.password ? u.password === password : true;
        
        return isIdMatch && isPassMatch;
    });

    if (user) {
      setCurrentUser(user);
      localStorage.setItem('pwork_user', JSON.stringify(user));
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem('pwork_user');
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};