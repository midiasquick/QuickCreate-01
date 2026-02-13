import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User } from '../../types';
import { auth, db } from '../lib/firebase'; 
import firebase from 'firebase/app';

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
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await db.collection('users').doc(firebaseUser.uid).get();

          if (userDoc.exists) {
            setCurrentUser({ id: firebaseUser.uid, ...userDoc.data() } as User);
          } else {
            // Cria perfil se não existir
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
            await db.collection('users').doc(firebaseUser.uid).set(newUserProfile);
            setCurrentUser(newUserProfile as User);
          }
        } catch (error) {
          console.error("Erro no AuthContext:", error);
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
      await auth.signInWithEmailAndPassword(identifier, password);
      return true;
    } catch (error) {
      console.error("Erro Login:", error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await auth.signOut();
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