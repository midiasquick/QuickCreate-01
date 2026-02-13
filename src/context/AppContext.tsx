import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { AppConfig, User, Project, Ticket, BoardColumn, BoardGroup, AutomationRule } from '../types';
import { DEFAULT_CONFIG } from '../constants';
// Importa configurações e instância do Firestore do nosso arquivo centralizado
import { db, firebaseConfig } from '../lib/firebase'; 
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';

interface AppContextType {
  config: AppConfig;
  updateConfig: (newConfig: Partial<AppConfig>) => void;
  users: User[];
  addUser: (user: Omit<User, 'id'>) => Promise<void>;
  updateUser: (id: string, data: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  
  // New Project/Board Methods
  projects: Project[];
  activeProjectId: string;
  setActiveProjectId: (id: string) => void;
  addProject: (title: string) => void;
  updateProject: (id: string, data: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  archiveProject: (id: string, archived: boolean) => void; 

  // Board Item Methods (Proxied to active project)
  tickets: Ticket[]; 
  addItem: (title: string, groupId: string, initialData?: Partial<Ticket>) => void;
  updateItem: (itemId: string, data: Partial<Ticket>, actorId?: string) => void;
  deleteItem: (itemId: string) => void;
  archiveItem: (itemId: string, archived: boolean) => void; 
  addComment: (itemId: string, text: string, userId: string) => void;
  
  // Structure Methods
  addColumn: (projectId: string, column: BoardColumn) => void;
  updateColumn: (projectId: string, columnId: string, data: Partial<BoardColumn>) => void;
  deleteColumn: (projectId: string, columnId: string) => void;
  addGroup: (projectId: string, group: BoardGroup) => void;
  updateGroup: (projectId: string, groupId: string, data: Partial<BoardGroup>) => void;
  deleteGroup: (projectId: string, groupId: string) => void; 
  archiveGroup: (projectId: string, groupId: string, archived: boolean) => void; 
  
  // Automation
  addAutomation: (projectId: string, rule: AutomationRule) => void;
  deleteAutomation: (projectId: string, ruleId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string>('');

  const tickets = projects.flatMap(p => p.items);

  // --- 1. LISTENERS DO FIRESTORE (TEMPO REAL - v8/Compat) ---
  useEffect(() => {
    // Configurações do Sistema
    const unsubConfig = db.collection('system').doc('config').onSnapshot((docSnap) => {
        if (docSnap.exists) {
            setConfig(docSnap.data() as AppConfig);
        } else {
            db.collection('system').doc('config').set(DEFAULT_CONFIG).catch(console.error);
        }
    });

    // Usuários
    const unsubUsers = db.collection('users').onSnapshot((snapshot) => {
        const usersList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
        setUsers(usersList);
    });

    // Projetos
    const unsubProjects = db.collection('projects').onSnapshot((snapshot) => {
        const projectsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
        setProjects(projectsList);
        
        setActiveProjectId(prev => {
            const stillExists = projectsList.find(p => p.id === prev);
            if (stillExists) return prev;
            const firstAvailable = projectsList.find(p => !p.archived) || projectsList[0];
            return firstAvailable ? firstAvailable.id : '';
        });
    });

    return () => {
        unsubConfig();
        unsubUsers();
        unsubProjects();
    };
  }, []);

  // --- 2. OPERAÇÕES DE ESCRITA NO BANCO (v8/Compat) ---

  const updateConfig = async (newConfig: Partial<AppConfig>) => {
    try {
        await db.collection('system').doc('config').update(newConfig);
    } catch (e) {
        console.error("Erro ao atualizar config:", e);
    }
  };

  const addUser = async (userData: Omit<User, 'id'>) => {
    // CRIAÇÃO DE USUÁRIO SECUNDÁRIO (Compat Syntax)
    let secondaryApp: firebase.app.App | undefined;
    
    try {
        // 1. Inicializa App Secundária (Compat)
        secondaryApp = firebase.initializeApp(firebaseConfig, "SecondaryApp");
        const secondaryAuth = secondaryApp.auth();

        // 2. Cria usuário no Auth
        const userCredential = await secondaryAuth.createUserWithEmailAndPassword(
            userData.email, 
            userData.password || "mudar123" 
        );
        
        const uid = userCredential.user?.uid;

        if (uid) {
            // 3. Salva perfil no Firestore (Compat)
            await db.collection('users').doc(uid).set({
                ...userData,
                id: uid,
                role: userData.role || 'USER', 
                createdAt: new Date().toISOString(),
                memberSince: new Date().toLocaleDateString(),
                permissions: []
            });
            console.log("Usuário criado com sucesso:", uid);
        }

        // 4. Limpeza
        await secondaryAuth.signOut();
        await secondaryApp.delete();

    } catch (error: any) {
        console.error("Erro ao criar usuário:", error);
        if (error.code === 'auth/email-already-in-use') {
            alert("Erro: Este e-mail já está cadastrado.");
        } else {
            alert(`Erro ao criar usuário: ${error.message}`);
        }
        
        if(secondaryApp) {
            try { await secondaryApp.delete(); } catch(e) {}
        }
    }
  };

  const updateUser = async (id: string, data: Partial<User>) => {
    try {
      await db.collection('users').doc(id).update(data);
    } catch(e) {
      console.error("Erro ao atualizar usuário", e);
    }
  };

  const deleteUser = async (id: string) => {
    try {
      await db.collection('users').doc(id).delete();
    } catch(e) {
      console.error("Erro ao deletar usuário", e);
    }
  };

  // --- HELPER: Automações ---
  const checkAutomations = (project: Project, item: Ticket, changeContext: { columnId?: string, newValue?: any }, isNewItem: boolean) => {
    if (!project.automations) return item;
    
    let updatedItem = { ...item };
    let hasChanges = false;

    project.automations.forEach(rule => {
        if (!rule.active) return;
        let isTriggered = false;

        if (isNewItem) {
             const val = updatedItem.data[rule.triggerColumnId];
             if (val === rule.triggerValue || (!rule.triggerValue && val)) isTriggered = true;
        } else if (changeContext.columnId === rule.triggerColumnId) {
             if (rule.triggerValue) {
                 if (changeContext.newValue === rule.triggerValue) isTriggered = true;
             } else {
                 isTriggered = true;
             }
        }

        if (isTriggered) {
            if (rule.actionType === 'ASSIGN_USER' && rule.actionTargetId) {
                updatedItem.assigneeId = rule.actionTargetId;
                hasChanges = true;
            }
            if (rule.actionType === 'UPDATE_FIELD' && rule.actionTargetId && rule.actionValue) {
                updatedItem.data = { ...updatedItem.data, [rule.actionTargetId]: rule.actionValue };
                hasChanges = true;
            }
            if (rule.actionType === 'COMPLETE_CHECKLIST' && updatedItem.checklists) {
                updatedItem.checklists = updatedItem.checklists.map(c => ({ ...c, done: true }));
                hasChanges = true;
            }
        }
    });
    return hasChanges ? updatedItem : item;
  };

  // --- Operações de Projeto (v8) ---

  const addProject = async (title: string) => {
    const newProject: Omit<Project, 'id'> = {
      title: title,
      description: 'Novo projeto',
      archived: false,
      columns: [
          { id: 'c1', title: 'Status', type: 'status', width: '150px', options: [{id:'1', label:'A Fazer', color:'#9ca3af'}, {id:'2', label:'Em Andamento', color:'#fbbf24'}, {id:'3', label:'Concluído', color:'#4ade80'}] },
          { id: 'c2', title: 'Responsável', type: 'person', width: '120px' },
          { id: 'c3', title: 'Prazo', type: 'date', width: '130px' }
      ],
      groups: [
          { id: 'g1', title: 'Grupo Inicial', color: '#3b82f6' }
      ],
      items: [],
      members: [], 
      automations: []
    };
    
    try {
        const docRef = await db.collection('projects').add(newProject);
        setActiveProjectId(docRef.id);
    } catch (e) {
        console.error("Erro ao criar projeto:", e);
    }
  };

  const updateProject = async (id: string, data: Partial<Project>) => {
    try {
      await db.collection('projects').doc(id).update(data);
    } catch (e) { console.error(e); }
  };

  const deleteProject = async (id: string) => {
    try {
      await db.collection('projects').doc(id).delete();
    } catch (e) { console.error(e); }
  };

  const archiveProject = async (id: string, archived: boolean) => {
      try {
        await db.collection('projects').doc(id).update({ archived });
      } catch (e) { console.error(e); }
  };

  // --- Operações de Estrutura (v8) ---

  const addColumn = async (projectId: string, column: BoardColumn) => {
      const project = projects.find(p => p.id === projectId);
      if (project) {
          const newColumns = [...project.columns, column];
          await db.collection('projects').doc(projectId).update({ columns: newColumns });
      }
  };

  const updateColumn = async (projectId: string, columnId: string, data: Partial<BoardColumn>) => {
      const project = projects.find(p => p.id === projectId);
      if (project) {
          const newColumns = project.columns.map(c => c.id === columnId ? { ...c, ...data } : c);
          await db.collection('projects').doc(projectId).update({ columns: newColumns });
      }
  };

  const deleteColumn = async (projectId: string, columnId: string) => {
      const project = projects.find(p => p.id === projectId);
      if (project) {
          const newColumns = project.columns.filter(c => c.id !== columnId);
          await db.collection('projects').doc(projectId).update({ columns: newColumns });
      }
  };

  const addGroup = async (projectId: string, group: BoardGroup) => {
      const colors = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#f43f5e'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      
      const project = projects.find(p => p.id === projectId);
      if (project) {
          const newGroups = [...project.groups, { ...group, color: randomColor }];
          await db.collection('projects').doc(projectId).update({ groups: newGroups });
      }
  };

  const updateGroup = async (projectId: string, groupId: string, data: Partial<BoardGroup>) => {
      const project = projects.find(p => p.id === projectId);
      if (project) {
          const newGroups = project.groups.map(g => g.id === groupId ? { ...g, ...data } : g);
          await db.collection('projects').doc(projectId).update({ groups: newGroups });
      }
  };
  
  const archiveGroup = async (projectId: string, groupId: string, archived: boolean) => {
      const project = projects.find(p => p.id === projectId);
      if (project) {
          const newGroups = project.groups.map(g => g.id === groupId ? { ...g, archived } : g);
          await db.collection('projects').doc(projectId).update({ groups: newGroups });
      }
  };

  const deleteGroup = async (projectId: string, groupId: string) => {
      const project = projects.find(p => p.id === projectId);
      if (project) {
          const newGroups = project.groups.filter(g => g.id !== groupId);
          const newItems = project.items.filter(i => i.groupId !== groupId);
          await db.collection('projects').doc(projectId).update({ groups: newGroups, items: newItems });
      }
  };

  // --- Automação (v8) ---

  const addAutomation = async (projectId: string, rule: AutomationRule) => {
      const project = projects.find(p => p.id === projectId);
      if (project) {
          const newAutomations = [...(project.automations || []), rule];
          await db.collection('projects').doc(projectId).update({ automations: newAutomations });
      }
  };

  const deleteAutomation = async (projectId: string, ruleId: string) => {
      const project = projects.find(p => p.id === projectId);
      if (project) {
          const newAutomations = (project.automations || []).filter(r => r.id !== ruleId);
          await db.collection('projects').doc(projectId).update({ automations: newAutomations });
      }
  };

  // --- Itens (Tarefas) (v8) ---

  const addItem = async (title: string, groupId: string, initialData?: Partial<Ticket>) => {
      const project = projects.find(p => p.id === activeProjectId);
      if (project) {
          let newItem: Ticket = {
              id: Math.random().toString(36).substr(2, 9),
              title: title || 'Nova Tarefa',
              groupId,
              description: '',
              checklists: [],
              comments: [],
              archived: false,
              status: 'A Fazer',
              priority: 'Média',
              assigneeId: null,
              startDate: new Date().toISOString().split('T')[0],
              dueDate: new Date().toISOString().split('T')[0],
              ...initialData,
              data: { ...(initialData?.data || {}) } 
          };

          const statusCol = project.columns.find(c => c.type === 'status');
          if (statusCol && newItem.data[statusCol.id]) {
              newItem = checkAutomations(project, newItem, { columnId: statusCol.id, newValue: newItem.data[statusCol.id] }, true);
          } else {
               newItem = checkAutomations(project, newItem, {}, true);
          }

          const newItems = [...project.items, newItem];
          await db.collection('projects').doc(project.id).update({ items: newItems });
      }
  };

  const updateItem = async (itemId: string, data: Partial<Ticket>, actorId?: string) => {
      const project = projects.find(p => p.items.some(i => i.id === itemId));
      
      if (project) {
          const newItems = project.items.map(i => {
              if (i.id === itemId) {
                  let updated = { ...i, ...data };
                  
                  if (data.data) {
                      Object.keys(data.data).forEach(colId => {
                          if (data.data![colId] !== i.data[colId]) {
                              updated = checkAutomations(project, updated, { columnId: colId, newValue: data.data![colId] }, false);
                              
                              const matchingRules = project.automations?.filter(r => 
                                  r.active && 
                                  r.actionType === 'NOTIFY_USER' && 
                                  r.triggerColumnId === colId && 
                                  (r.triggerValue ? r.triggerValue === data.data![colId] : true)
                              );
                              
                              matchingRules?.forEach(rule => {
                                  if (rule.actionTargetId) {
                                      const targetUser = users.find(u => u.id === rule.actionTargetId);
                                      if (targetUser) {
                                           const sysComment = {
                                               id: `sys_${Date.now()}`,
                                               userId: 'system', 
                                               text: `🤖 Automação: @${targetUser.username} notificado sobre mudança para "${data.data![colId]}".`,
                                               createdAt: new Date().toISOString()
                                           };
                                           updated.comments = [sysComment, ...(updated.comments || [])];
                                      }
                                  }
                              });
                          }
                      });
                  }
                  return updated;
              }
              return i;
          });

          await db.collection('projects').doc(project.id).update({ items: newItems });
      }
  };

  const deleteItem = async (itemId: string) => {
      const project = projects.find(p => p.items.some(i => i.id === itemId));
      if (project) {
          const newItems = project.items.filter(i => i.id !== itemId);
          await db.collection('projects').doc(project.id).update({ items: newItems });
      }
  };

  const archiveItem = async (itemId: string, archived: boolean) => {
      const project = projects.find(p => p.items.some(i => i.id === itemId));
      if (project) {
          const newItems = project.items.map(i => i.id === itemId ? { ...i, archived } : i);
          await db.collection('projects').doc(project.id).update({ items: newItems });
      }
  }

  const addComment = async (itemId: string, text: string, userId: string) => {
      const project = projects.find(p => p.items.some(i => i.id === itemId));
      if (project) {
          const newComment = {
              id: Math.random().toString(36).substr(2, 9),
              userId,
              text,
              createdAt: new Date().toISOString()
          };
          const newItems = project.items.map(i => {
              if (i.id === itemId) {
                  return { ...i, comments: [newComment, ...i.comments] };
              }
              return i;
          });
          await db.collection('projects').doc(project.id).update({ items: newItems });
      }
  };

  return (
    <AppContext.Provider value={{ 
      config, updateConfig, 
      users, addUser, updateUser, deleteUser,
      projects, activeProjectId, setActiveProjectId, addProject, updateProject, deleteProject, archiveProject,
      tickets, addItem, updateItem, deleteItem, archiveItem, addComment, addColumn, updateColumn, deleteColumn, addGroup, updateGroup, archiveGroup, deleteGroup,
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