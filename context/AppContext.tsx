
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { AppConfig, User, Project, Ticket, BoardColumn, BoardGroup, AutomationRule } from '../types';
import { DEFAULT_CONFIG } from '../constants';
import { db, firebaseConfig } from '../src/lib/firebase'; 
// Modular Imports
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, doc, onSnapshot, updateDoc, addDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { useAuth } from './AuthContext';

interface AppContextType {
  config: AppConfig;
  updateConfig: (newConfig: Partial<AppConfig>) => void;
  users: User[];
  addUser: (user: Omit<User, 'id'>) => Promise<void>;
  updateUser: (id: string, data: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  projects: Project[];
  activeProjectId: string;
  setActiveProjectId: (id: string) => void;
  addProject: (title: string) => void;
  updateProject: (id: string, data: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  archiveProject: (id: string, archived: boolean) => void; 
  tickets: Ticket[];
  addItem: (title: string, groupId: string, initialData?: Partial<Ticket>) => void;
  updateItem: (itemId: string, data: Partial<Ticket>, actorId?: string) => void;
  deleteItem: (itemId: string) => void;
  archiveItem: (itemId: string, archived: boolean) => void; 
  addComment: (itemId: string, text: string, userId: string) => void;
  addColumn: (projectId: string, column: BoardColumn) => void;
  updateColumn: (projectId: string, columnId: string, data: Partial<BoardColumn>) => void;
  deleteColumn: (projectId: string, columnId: string) => void;
  addGroup: (projectId: string, group: BoardGroup) => void;
  updateGroup: (projectId: string, groupId: string, data: Partial<BoardGroup>) => void;
  deleteGroup: (projectId: string, groupId: string) => void; 
  archiveGroup: (projectId: string, groupId: string, archived: boolean) => void; 
  addAutomation: (projectId: string, rule: AutomationRule) => void;
  deleteAutomation: (projectId: string, ruleId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string>('');
  const tickets = projects.flatMap(p => p.items);

  useEffect(() => {
    if (!currentUser) return;

    // Listeners using Modular Syntax
    const unsubConfig = onSnapshot(doc(db, 'system', 'config'), 
      (s) => {
        if (s.exists()) setConfig(s.data() as AppConfig);
        else setDoc(doc(db, 'system', 'config'), DEFAULT_CONFIG).catch(console.error);
      },
      (error) => console.error("Error reading config:", error)
    );

    const unsubUsers = onSnapshot(collection(db, 'users'), 
      (s) => setUsers(s.docs.map(d => ({ id: d.id, ...d.data() } as User))),
      (error) => console.error("Error reading users:", error)
    );

    const unsubProjects = onSnapshot(collection(db, 'projects'), 
      (s) => {
        const list = s.docs.map(d => ({ id: d.id, ...d.data() } as Project));
        setProjects(list);
        setActiveProjectId(prev => list.find(p => p.id === prev) ? prev : (list.find(p => !p.archived)?.id || ''));
      },
      (error) => console.error("Error reading projects:", error)
    );
    
    return () => { unsubConfig(); unsubUsers(); unsubProjects(); };
  }, [currentUser]);

  const updateConfig = async (n: Partial<AppConfig>) => { 
    try { await updateDoc(doc(db, 'system', 'config'), n); } catch(e) { console.error("Update config error:", e); }
  };

  const addUser = async (userData: Omit<User, 'id'>) => {
    let secApp;
    try {
        // Modular initialization for secondary app
        secApp = initializeApp(firebaseConfig, "Secondary");
        const secAuth = getAuth(secApp);
        
        const cred = await createUserWithEmailAndPassword(secAuth, userData.email, userData.password || "mudar123");
        
        if (cred.user) {
            await setDoc(doc(db, 'users', cred.user.uid), {
                ...userData, id: cred.user.uid, role: userData.role || 'USER',
                createdAt: new Date().toISOString(), memberSince: new Date().toLocaleDateString(), permissions: []
            });
        }
        
        await signOut(secAuth);
        await deleteApp(secApp);

    } catch (e: any) {
        console.error("Erro ao criar usuário:", e);
        if(secApp) await deleteApp(secApp).catch(console.error);
        alert("Erro ao criar usuário: " + e.message);
    }
  };

  const updateUser = async (id: string, data: Partial<User>) => updateDoc(doc(db, 'users', id), data);
  const deleteUser = async (id: string) => deleteDoc(doc(db, 'users', id));

  // CRUD Functions (Modular)
  const addProject = async (title: string) => {
    const newP: any = { title, description: 'Novo', archived: false, items: [], members: [], automations: [], columns: [{ id: 'c1', title: 'Status', type: 'status', options: [{id:'1', label:'A Fazer', color:'#ccc'}] }], groups: [{ id: 'g1', title: 'Geral', color: '#3b82f6' }] };
    const ref = await addDoc(collection(db, 'projects'), newP);
    setActiveProjectId(ref.id);
  };
  const updateProject = async (id: string, data: Partial<Project>) => updateDoc(doc(db, 'projects', id), data);
  const deleteProject = async (id: string) => deleteDoc(doc(db, 'projects', id));
  const archiveProject = async (id: string, archived: boolean) => updateProject(id, { archived });

  const modProj = async (pid: string, fn: (p: Project) => Partial<Project>) => {
      const p = projects.find(x => x.id === pid);
      if(p) await updateProject(pid, fn(p));
  };

  const addColumn = (pid: string, c: BoardColumn) => modProj(pid, p => ({ columns: [...p.columns, c] }));
  const updateColumn = (pid: string, cid: string, d: Partial<BoardColumn>) => modProj(pid, p => ({ columns: p.columns.map(x => x.id === cid ? {...x, ...d} : x) }));
  const deleteColumn = (pid: string, cid: string) => modProj(pid, p => ({ columns: p.columns.filter(x => x.id !== cid) }));
  const addGroup = (pid: string, g: BoardGroup) => modProj(pid, p => ({ groups: [...p.groups, {...g, color: '#888'}] }));
  const updateGroup = (pid: string, gid: string, d: Partial<BoardGroup>) => modProj(pid, p => ({ groups: p.groups.map(x => x.id === gid ? {...x, ...d} : x) }));
  const deleteGroup = (pid: string, gid: string) => modProj(pid, p => ({ groups: p.groups.filter(x => x.id !== gid) }));
  const archiveGroup = (pid: string, gid: string, a: boolean) => updateGroup(pid, gid, { archived: a });
  const addAutomation = (pid: string, r: AutomationRule) => modProj(pid, p => ({ automations: [...(p.automations||[]), r] }));
  const deleteAutomation = (pid: string, rid: string) => modProj(pid, p => ({ automations: (p.automations||[]).filter(r => r.id !== rid) }));

  const addItem = (title: string, groupId: string, init: any = {}) => {
      const p = projects.find(x => x.id === activeProjectId);
      if(!p) return;
      const item: Ticket = { id: Math.random().toString(36).substr(2,9), title, groupId, data: init.data || {}, comments: [], checklists: [], status: 'A Fazer', priority: 'Média', assigneeId: null, startDate: new Date().toISOString(), dueDate: '' };
      updateProject(p.id, { items: [...p.items, item] });
  };
  const updateItem = (itemId: string, data: Partial<Ticket>) => {
      const p = projects.find(x => x.items.some(i => i.id === itemId));
      if(p) updateProject(p.id, { items: p.items.map(i => i.id === itemId ? {...i, ...data} : i) });
  };
  const deleteItem = (itemId: string) => {
      const p = projects.find(x => x.items.some(i => i.id === itemId));
      if(p) updateProject(p.id, { items: p.items.filter(i => i.id !== itemId) });
  };
  const archiveItem = (itemId: string, archived: boolean) => updateItem(itemId, { archived });
  const addComment = (itemId: string, text: string, userId: string) => {
      const p = projects.find(x => x.items.some(i => i.id === itemId));
      if(p) {
          const item = p.items.find(i => i.id === itemId)!;
          updateItem(itemId, { comments: [{id: Date.now().toString(), userId, text, createdAt: new Date().toISOString()}, ...item.comments] });
      }
  };

  return (
    <AppContext.Provider value={{ 
      config, updateConfig, users, addUser, updateUser, deleteUser,
      projects, activeProjectId, setActiveProjectId, addProject, updateProject, deleteProject, archiveProject,
      tickets, addItem, updateItem, deleteItem, archiveItem, addComment, 
      addColumn, updateColumn, deleteColumn, addGroup, updateGroup, archiveGroup, deleteGroup,
      addAutomation, deleteAutomation
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
