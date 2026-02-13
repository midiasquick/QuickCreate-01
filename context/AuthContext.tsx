import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User } from '../types';
import { auth, db } from '../src/lib/firebase'; 
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { INITIAL_USERS } from '../constants';

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
    // Check for mock session first
    const mockSession = localStorage.getItem('pwork_mock_user');
    if (mockSession) {
        try {
            setCurrentUser(JSON.parse(mockSession));
            setIsLoading(false);
            return;
        } catch(e) {
            localStorage.removeItem('pwork_mock_user');
        }
    }

    // SINTAXE MODULAR: Passamos 'auth' como parâmetro
    let unsubscribe = () => {};
    try {
        unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
            try {
            const userDocRef = doc(db, 'users', firebaseUser.uid);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
                setCurrentUser({ id: firebaseUser.uid, ...userDoc.data() } as User);
            } else {
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
                // Try saving, if fails (due to perms or key), just set state
                try { await setDoc(userDocRef, newUserProfile); } catch(e) {}
                setCurrentUser(newUserProfile as User);
            }
            } catch (error) {
            console.error("Erro ao carregar perfil:", error);
            // If we have a firebase user but cant load profile, create a temp one
            setCurrentUser({
                id: firebaseUser.uid,
                username: 'temp',
                email: firebaseUser.email || '',
                name: 'Temp User',
                role: 'USER',
                avatar: '',
                memberSince: '',
                permissions: []
            } as User);
            }
        } else {
            // Only clear if no mock session
            if (!localStorage.getItem('pwork_mock_user')) {
                setCurrentUser(null);
            }
        }
        setIsLoading(false);
        }, (error) => {
            console.warn("Auth Listener Error (Demo Mode):", error);
            setIsLoading(false);
        });
    } catch (e) {
        console.error("Auth Init Error:", e);
        setIsLoading(false);
    }
    return () => unsubscribe();
  }, []);

  const login = async (identifier: string, password?: string): Promise<boolean> => {
    if (!password) return false;

    // 1. Try Firebase
    try {
      await signInWithEmailAndPassword(auth, identifier, password);
      localStorage.removeItem('pwork_mock_user');
      return true;
    } catch (error: any) {
      console.warn("Firebase Login Failed:", error.code);
      
      // 2. Fallback to Mock Data
      const mockUser = INITIAL_USERS.find(u => 
        (u.username === identifier || u.email === identifier) && 
        u.password === password
      );

      if (mockUser) {
          console.info("Logging in with Mock User");
          setCurrentUser(mockUser);
          localStorage.setItem('pwork_mock_user', JSON.stringify(mockUser));
          return true;
      }
      
      return false;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) { console.error(error); }
    localStorage.removeItem('pwork_mock_user');
    localStorage.removeItem('pwork_user'); // Cleanup legacy
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