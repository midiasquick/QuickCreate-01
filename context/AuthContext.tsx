
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User } from '../types';
import { auth, db } from '../src/lib/firebase'; 
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface AuthContextType {
  currentUser: User | null;
  login: (identifier: string, password?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Modular Syntax: Pass auth instance as first argument
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            setCurrentUser({ id: firebaseUser.uid, ...userDoc.data() } as User);
          } else {
            // Create default profile if not exists
            const newUserProfile: any = {
                id: firebaseUser.uid,
                username: firebaseUser.email?.split('@')[0] || 'user',
                email: firebaseUser.email || '',
                name: firebaseUser.displayName || 'Novo Usuário',
                role: 'USER', 
                avatar: `https://ui-avatars.com/api/?name=${firebaseUser.email}&background=random`,
                memberSince: new Date().toLocaleDateString(),
                permissions: []
            };
            await setDoc(userDocRef, newUserProfile);
            setCurrentUser(newUserProfile as User);
          }
        } catch (error) {
          console.error("Auth Error:", error);
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (identifier: string, password?: string): Promise<boolean> => {
    try {
      if (!password) return false;
      // Modular Syntax
      await signInWithEmailAndPassword(auth, identifier, password);
      return true;
    } catch (error) {
      console.error("Login Error:", error);
      return false;
    }
  };

  const logout = async () => {
    try {
      // Modular Syntax
      await signOut(auth);
      localStorage.removeItem('pwork_user');
      setCurrentUser(null);
    } catch (error) { console.error(error); }
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
