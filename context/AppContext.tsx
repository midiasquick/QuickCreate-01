import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { AppConfig, User, Project, Ticket, BoardColumn, BoardGroup, AutomationRule } from '../types';
import { DEFAULT_CONFIG, INITIAL_USERS, INITIAL_PROJECTS } from '../constants';

interface AppContextType {
  config: AppConfig;
  updateConfig: (newConfig: Partial<AppConfig>) => void;
  users: User[];
  addUser: (user: Omit<User, 'id'>) => void;
  updateUser: (id: string, data: Partial<User>) => void;
  deleteUser: (id: string) => void;
  
  // New Project/Board Methods
  projects: Project[];
  activeProjectId: string;
  setActiveProjectId: (id: string) => void;
  addProject: (title: string) => void;
  updateProject: (id: string, data: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  archiveProject: (id: string, archived: boolean) => void; 

  // Board Item Methods (Proxied to active project)
  tickets: Ticket[]; // Flattened list for compatibility
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
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [activeProjectId, setActiveProjectId] = useState<string>(INITIAL_PROJECTS[0].id);

  // Computed flat tickets for dashboard compatibility
  const tickets = projects.flatMap(p => p.items);

  const updateConfig = (newConfig: Partial<AppConfig>) => {
    setConfig((prev) => ({ ...prev, ...newConfig }));
  };

  const addUser = (userData: Omit<User, 'id'>) => {
    const newUser: User = { ...userData, id: Math.random().toString(36).substr(2, 9) };
    setUsers((prev) => [...prev, newUser]);
  };

  const updateUser = (id: string, data: Partial<User>) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...data } : u)));
  };

  const deleteUser = (id: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  // --- HELPER: AUTOMATION RUNNER ---
  const checkAutomations = (project: Project, item: Ticket, changeContext: { columnId?: string, newValue?: any }, isNewItem: boolean) => {
    if (!project.automations) return item;
    
    let updatedItem = { ...item };
    let hasChanges = false;

    project.automations.forEach(rule => {
        if (!rule.active) return;

        let isTriggered = false;

        // 1. Check Trigger Logic
        if (isNewItem) {
             const val = updatedItem.data[rule.triggerColumnId];
             if (val === rule.triggerValue || (!rule.triggerValue && val)) {
                 isTriggered = true;
             }
        } else if (changeContext.columnId === rule.triggerColumnId) {
             if (rule.triggerValue) {
                 if (changeContext.newValue === rule.triggerValue) isTriggered = true;
             } else {
                 isTriggered = true;
             }
        }

        if (isTriggered) {
            // 2. Perform Actions
            if (rule.actionType === 'ASSIGN_USER' && rule.actionTargetId) {
                updatedItem.assigneeId = rule.actionTargetId;
                hasChanges = true;
            }
            if (rule.actionType === 'UPDATE_FIELD' && rule.actionTargetId && rule.actionValue) {
                updatedItem.data = { ...updatedItem.data, [rule.actionTargetId]: rule.actionValue };
                hasChanges = true;
            }
            if (rule.actionType === 'COMPLETE_CHECKLIST') {
                if (updatedItem.checklists) {
                    updatedItem.checklists = updatedItem.checklists.map(c => ({ ...c, done: true }));
                    hasChanges = true;
                }
            }
            if (rule.actionType === 'NOTIFY_USER' && rule.actionTargetId) {
                const notifUser = users.find(u => u.id === rule.actionTargetId);
                // Notification logic handled in item update loop as side effect
            }
        }
    });

    return hasChanges ? updatedItem : item;
  };

  // --- Project Operations ---

  const addProject = (title: string) => {
    const newId = Math.random().toString(36).substr(2, 9);
    const newProject: Project = {
      id: newId,
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
      members: ['1', '2'], // Add default members
      automations: []
    };
    
    setProjects(prev => [...prev, newProject]);
    // Immediately set active
    setActiveProjectId(newId);
  };

  const updateProject = (id: string, data: Partial<Project>) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
  };

  const deleteProject = (id: string) => {
    setProjects(prev => {
        const remaining = prev.filter(p => p.id !== id);
        
        // If we deleted the active project, switch to another non-archived one
        if (activeProjectId === id) {
            const next = remaining.find(p => !p.archived);
            if (next) {
                setActiveProjectId(next.id);
            } else {
                setActiveProjectId(''); // No projects left
            }
        }
        return remaining;
    });
  };

  const archiveProject = (id: string, archived: boolean) => {
      setProjects(prev => {
          const updated = prev.map(p => p.id === id ? { ...p, archived } : p);
          
          if (archived && activeProjectId === id) {
              const visible = updated.filter(p => !p.archived && p.id !== id);
              if (visible.length > 0) {
                  setActiveProjectId(visible[0].id);
              } 
          }
          return updated;
      });
  };

  const addColumn = (projectId: string, column: BoardColumn) => {
      setProjects(prev => prev.map(p => {
          if (p.id === projectId) {
              return { ...p, columns: [...p.columns, column] };
          }
          return p;
      }));
  };

  const updateColumn = (projectId: string, columnId: string, data: Partial<BoardColumn>) => {
      setProjects(prev => prev.map(p => {
          if (p.id === projectId) {
              return { 
                  ...p, 
                  columns: p.columns.map(c => c.id === columnId ? { ...c, ...data } : c)
              };
          }
          return p;
      }));
  };

  const deleteColumn = (projectId: string, columnId: string) => {
      setProjects(prev => prev.map(p => {
          if (p.id === projectId) {
              return { ...p, columns: p.columns.filter(c => c.id !== columnId) };
          }
          return p;
      }));
  };

  const addGroup = (projectId: string, group: BoardGroup) => {
      const colors = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#f43f5e'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      
      setProjects(prev => prev.map(p => {
          if (p.id === projectId) {
              return { ...p, groups: [...p.groups, { ...group, color: randomColor }] };
          }
          return p;
      }));
  };

  const updateGroup = (projectId: string, groupId: string, data: Partial<BoardGroup>) => {
      setProjects(prev => prev.map(p => {
          if (p.id === projectId) {
              return { 
                  ...p, 
                  groups: p.groups.map(g => g.id === groupId ? { ...g, ...data } : g)
              };
          }
          return p;
      }));
  };
  
  const archiveGroup = (projectId: string, groupId: string, archived: boolean) => {
      setProjects(prev => prev.map(p => {
          if (p.id === projectId) {
              return { 
                  ...p, 
                  groups: p.groups.map(g => g.id === groupId ? { ...g, archived } : g)
              };
          }
          return p;
      }));
  };

  const deleteGroup = (projectId: string, groupId: string) => {
      setProjects(prev => prev.map(p => {
          if (p.id === projectId) {
              return { 
                  ...p, 
                  groups: p.groups.filter(g => g.id !== groupId),
                  items: p.items.filter(i => i.groupId !== groupId)
              };
          }
          return p;
      }));
  };

  // --- Automation Management ---

  const addAutomation = (projectId: string, rule: AutomationRule) => {
      setProjects(prev => prev.map(p => {
          if (p.id === projectId) {
              return { ...p, automations: [...(p.automations || []), rule] };
          }
          return p;
      }));
  };

  const deleteAutomation = (projectId: string, ruleId: string) => {
      setProjects(prev => prev.map(p => {
          if (p.id === projectId) {
              return { ...p, automations: (p.automations || []).filter(r => r.id !== ruleId) };
          }
          return p;
      }));
  };

  // --- Item Operations ---

  const addItem = (title: string, groupId: string, initialData?: Partial<Ticket>) => {
      setProjects(prev => prev.map(p => {
          if (p.id === activeProjectId) {
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

              const statusCol = p.columns.find(c => c.type === 'status');
              if (statusCol && newItem.data[statusCol.id]) {
                  newItem = checkAutomations(p, newItem, { columnId: statusCol.id, newValue: newItem.data[statusCol.id] }, true);
              } else {
                   newItem = checkAutomations(p, newItem, {}, true);
              }

              return { ...p, items: [...p.items, newItem] };
          }
          return p;
      }));
  };

  const updateItem = (itemId: string, data: Partial<Ticket>, actorId?: string) => {
      setProjects(prev => prev.map(p => {
          // Check if item exists in this project to prevent searching indefinitely if IDs were UUIDs
          if (p.items.some(i => i.id === itemId)) {
              return {
                  ...p,
                  items: p.items.map(i => {
                      if (i.id === itemId) {
                          let updated = { ...i, ...data };
                          
                          if (data.data) {
                              Object.keys(data.data).forEach(colId => {
                                  if (data.data![colId] !== i.data[colId]) {
                                      updated = checkAutomations(p, updated, { columnId: colId, newValue: data.data![colId] }, false);
                                      
                                      const matchingRules = p.automations?.filter(r => 
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
                                                   updated.comments = [sysComment, ...updated.comments];
                                              }
                                          }
                                      });
                                  }
                              });
                          }

                          return updated;
                      }
                      return i;
                  })
              };
          }
          return p;
      }));
  };

  const deleteItem = (itemId: string) => {
      setProjects(prev => prev.map(p => ({
          ...p,
          items: p.items.filter(i => i.id !== itemId)
      })));
  };

  const archiveItem = (itemId: string, archived: boolean) => {
      setProjects(prev => prev.map(p => {
          // Optimization: only map items if we find the item in this project
          if(p.items.some(i => i.id === itemId)) {
              return {
                  ...p,
                  items: p.items.map(i => i.id === itemId ? { ...i, archived } : i)
              }
          }
          return p;
      }));
  }

  const addComment = (itemId: string, text: string, userId: string) => {
      const newComment = {
          id: Math.random().toString(36).substr(2, 9),
          userId,
          text,
          createdAt: new Date().toISOString()
      };

      setProjects(prev => prev.map(p => {
          if (p.items.some(i => i.id === itemId)) {
              return {
                  ...p,
                  items: p.items.map(i => {
                      if (i.id === itemId) {
                          return { ...i, comments: [newComment, ...i.comments] };
                      }
                      return i;
                  })
              };
          }
          return p;
      }));
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