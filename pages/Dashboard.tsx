import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { 
  Settings,
  X,
  Ticket,
  CheckCircle2,
  Briefcase,
  Bell,
  MessageCircle,
  AlertCircle,
  StickyNote,
  Trash2,
  Save,
  ArrowDownRight,
  AtSign
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';

// Widget Definition Interface
interface WidgetConfig {
  id: string;
  title: string;
  visible: boolean;
  size: 1 | 2 | 3 | 4; // Represents 1/4, 2/4 (half), 3/4, 4/4 (full)
}

export const Dashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const { config, projects, tickets, users } = useApp();

  // --- STATE: WIDGETS ---
  const [widgets, setWidgets] = useState<WidgetConfig[]>([
    { id: 'my_tickets_status', title: 'Meus Chamados por Status', visible: true, size: 2 }, // 2/4
    { id: 'quick_notes', title: 'Bloco de Notas', visible: true, size: 2 }, // 2/4
  ]);

  // --- STATE: RESIZING ---
  const [resizingWidgetId, setResizingWidgetId] = useState<string | null>(null);
  const [initialX, setInitialX] = useState<number>(0);
  const [initialWidth, setInitialWidth] = useState<number>(0);
  const [initialSize, setInitialSize] = useState<number>(0);
  const widgetRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // --- STATE: NOTES ---
  const [noteContent, setNoteContent] = useState(() => {
      // Load from local storage based on user ID to persist across reloads
      if (currentUser) {
          return localStorage.getItem(`notes_${currentUser.id}`) || '';
      }
      return '';
  });

  // Auto-save notes effect
  useEffect(() => {
      if (currentUser) {
          const timer = setTimeout(() => {
              localStorage.setItem(`notes_${currentUser.id}`, noteContent);
          }, 500); // Debounce save
          return () => clearTimeout(timer);
      }
  }, [noteContent, currentUser]);

  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Close notifications on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- RESIZE LOGIC ---
  const handleResizeStart = (e: React.MouseEvent, widget: WidgetConfig) => {
      e.preventDefault();
      const widgetEl = widgetRefs.current[widget.id];
      if (widgetEl) {
          setResizingWidgetId(widget.id);
          setInitialX(e.clientX);
          setInitialWidth(widgetEl.getBoundingClientRect().width);
          setInitialSize(widget.size);
          document.body.style.cursor = 'ew-resize';
      }
  };

  useEffect(() => {
      const handleMouseMove = (e: MouseEvent) => {
          if (!resizingWidgetId) return;

          const deltaX = e.clientX - initialX;
          
          const currentWidget = widgets.find(w => w.id === resizingWidgetId);
          if(!currentWidget) return;

          const threshold = 100; 
          
          let newSize = initialSize;

          if (deltaX > threshold) newSize = Math.min(4, initialSize + 1);
          else if (deltaX > threshold * 2) newSize = Math.min(4, initialSize + 2); // Fast drag
          else if (deltaX < -threshold) newSize = Math.max(1, initialSize - 1);
          else if (deltaX < -threshold * 2) newSize = Math.max(1, initialSize - 2); // Fast drag

          if (newSize !== currentWidget.size) {
               setWidgets(prev => prev.map(w => w.id === resizingWidgetId ? { ...w, size: newSize as 1|2|3|4 } : w));
          }
      };

      const handleMouseUp = () => {
          if (resizingWidgetId) {
              setResizingWidgetId(null);
              document.body.style.cursor = 'default';
          }
      };

      if (resizingWidgetId) {
          window.addEventListener('mousemove', handleMouseMove);
          window.addEventListener('mouseup', handleMouseUp);
      }

      return () => {
          window.removeEventListener('mousemove', handleMouseMove);
          window.removeEventListener('mouseup', handleMouseUp);
      };
  }, [resizingWidgetId, initialX, initialSize, widgets]);


  // Toggle Visibility
  const toggleVisibility = (id: string) => {
    setWidgets(prev => prev.map(w => w.id === id ? { ...w, visible: !w.visible } : w));
  };

  const resetWidgets = () => {
      setWidgets([
        { id: 'my_tickets_status', title: 'Meus Chamados por Status', visible: true, size: 2 },
        { id: 'quick_notes', title: 'Bloco de Notas', visible: true, size: 2 },
      ]);
  };

  // --- LOGIC: Calculate Ticket Stats for Current User ---
  const ticketStats = useMemo(() => {
    if (!currentUser) return { total: 0, byStatus: [] };

    const statusMap: Record<string, { count: number; color: string }> = {};
    let totalCount = 0;

    projects.forEach(project => {
        const statusCol = project.columns.find(c => c.type === 'status');
        // Identify all columns that store people (assignees)
        const personColIds = project.columns.filter(c => c.type === 'person').map(c => c.id);

        const myItems = project.items.filter(item => {
            if (item.archived) return false;
            // Check legacy assigneeId
            if (item.assigneeId === currentUser.id) return true;
            
            // Check dynamic person columns data
            return personColIds.some(colId => {
                const val = item.data[colId];
                if (Array.isArray(val)) return val.includes(currentUser.id);
                return val === currentUser.id;
            });
        });

        myItems.forEach(item => {
            totalCount++;
            let statusLabel = 'Sem Status';
            let statusColor = '#94a3b8'; // slate-400

            if (statusCol) {
                const val = item.data[statusCol.id];
                if (val) {
                    statusLabel = val;
                    const opt = statusCol.options?.find(o => o.label === val);
                    if (opt) statusColor = opt.color;
                }
            }

            if (!statusMap[statusLabel]) {
                statusMap[statusLabel] = { count: 0, color: statusColor };
            }
            statusMap[statusLabel].count++;
        });
    });

    const byStatus = Object.entries(statusMap).map(([label, data]) => ({
        label,
        count: data.count,
        color: data.color
    })).sort((a, b) => b.count - a.count);

    return { total: totalCount, byStatus };

  }, [projects, currentUser]);

  // --- REAL NOTIFICATIONS LOGIC ---
  const notifications = useMemo(() => {
     if (!currentUser) return [];
     
     // Added timestamp for sorting
     const alerts: { id: string, type: 'alert'|'ticket'|'comment', title: string, desc: string, time: string, timestamp: number, isRead: boolean }[] = [];

     // Iterate projects instead of flattened tickets to access column definitions if needed
     projects.forEach(p => {
         const personColIds = p.columns.filter(c => c.type === 'person').map(c => c.id);

         p.items.forEach(t => {
             if (t.archived) return;

             const ticketTime = new Date(t.startDate).getTime();
             
             // Check if user is assigned (using new dynamic column logic)
             const isAssigned = t.assigneeId === currentUser.id || personColIds.some(colId => {
                const val = t.data[colId];
                return Array.isArray(val) ? val.includes(currentUser.id) : val === currentUser.id;
             });

             if (isAssigned) {
                 alerts.push({
                     id: `assign_${t.id}`,
                     type: 'ticket',
                     title: 'Chamado Atribuído',
                     desc: `Você é o responsável por: "${t.title}"`,
                     time: new Date(t.startDate).toLocaleDateString(),
                     timestamp: ticketTime,
                     isRead: false
                 });
             }
             
             // Comments & Mentions
             if (t.comments && t.comments.length > 0) {
                 t.comments.forEach(c => {
                     const commentTime = new Date(c.createdAt).getTime();
                     const timeDisplay = new Date(c.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', day: '2-digit', month: '2-digit'});

                     // A. Direct Mention (@username)
                     const mentionTag = `@${currentUser.username}`;
                     if (c.userId !== currentUser.id && c.text.toLowerCase().includes(mentionTag.toLowerCase())) {
                         const authorName = users.find(u => u.id === c.userId)?.name || 'Alguém';
                         alerts.push({
                             id: `mention_${c.id}`,
                             type: 'alert',
                             title: 'Você foi mencionado',
                             desc: `${authorName} citou você em "${t.title}"`,
                             time: timeDisplay,
                             timestamp: commentTime,
                             isRead: false
                         });
                     }
                     // B. General New Comment (if assigned to user but not author)
                     else if (isAssigned && c.userId !== currentUser.id) {
                         alerts.push({
                             id: `comment_${c.id}`,
                             type: 'comment',
                             title: 'Novo Comentário',
                             desc: `Em: "${t.title}"`,
                             time: timeDisplay,
                             timestamp: commentTime,
                             isRead: false
                         });
                     }
                 });
             }
         });
     });

     // 4. System Alerts
     config.notices.filter(n => n.active).forEach(n => {
         alerts.push({
             id: n.id,
             type: 'alert',
             title: n.title,
             desc: n.content,
             time: 'Aviso',
             timestamp: Date.now(), // Pin to top roughly or use start date
             isRead: false
         });
     });

     // Sort by Timestamp Descending (Newest First)
     // Unique IDs to prevent dupes if multiple passes (though logic above prevents it mostly)
     const uniqueAlerts = Array.from(new Map(alerts.map(item => [item.id, item])).values());
     uniqueAlerts.sort((a, b) => b.timestamp - a.timestamp);

     return uniqueAlerts.slice(0, 15); // Top 15 recent
  }, [projects, currentUser, config.notices, users]);

  // Render Functions for each Widget Content
  const renderWidgetContent = (id: string) => {
    switch (id) {
      case 'my_tickets_status':
        return (
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8 p-2 h-full">
                {/* Total Counter */}
                <div className="flex flex-col items-center justify-center p-6 bg-primary-50 rounded-xl border border-primary-light min-w-[150px] h-full flex-shrink-0">
                    <div className="p-4 bg-white rounded-full shadow-sm mb-3">
                        <Ticket size={32} className="text-primary" />
                    </div>
                    <span className="text-4xl font-bold text-primary">{ticketStats.total}</span>
                    <span className="text-sm font-medium text-primary uppercase tracking-wide mt-1 text-center">Total Atribuído</span>
                </div>

                {/* Status Grid */}
                <div className="flex-1 w-full overflow-y-auto max-h-[250px] custom-scrollbar">
                    <h4 className="text-sm font-bold text-gray-500 uppercase mb-4 flex items-center sticky top-0 bg-white pb-2 z-10">
                        <CheckCircle2 size={16} className="mr-2"/> Distribuição por Status
                    </h4>
                    
                    {ticketStats.byStatus.length === 0 ? (
                        <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                            <Briefcase size={24} className="mx-auto text-gray-300 mb-2"/>
                            <p className="text-gray-400 text-sm">Nenhuma tarefa encontrada.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {ticketStats.byStatus.map((stat, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                                    <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: stat.color }}></div>
                                    <div className="pl-2 truncate">
                                        <span className="block text-sm font-medium text-gray-600 group-hover:text-gray-900 transition-colors truncate" title={stat.label}>{stat.label}</span>
                                    </div>
                                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-50 font-bold text-xs text-slate-700 border border-gray-100 flex-shrink-0">
                                        {stat.count}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
      case 'quick_notes':
          return (
              <div className="flex flex-col h-full p-1">
                  <textarea 
                      className="flex-1 w-full p-4 bg-yellow-50/50 border border-yellow-200 rounded-lg resize-none outline-none focus:ring-2 focus:ring-yellow-400 text-slate-700 text-sm leading-relaxed"
                      placeholder="Digite suas anotações rápidas aqui... (Salvo automaticamente)"
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                  ></textarea>
              </div>
          );
      default:
        return null;
    }
  };

  // Helper to get grid column span class based on size (1-4)
  const getColSpanClass = (size: number) => {
      switch(size) {
          case 1: return 'lg:col-span-1'; // 1/4
          case 2: return 'lg:col-span-2'; // 2/4 (Half)
          case 3: return 'lg:col-span-3'; // 3/4
          case 4: return 'lg:col-span-4'; // 4/4 (Full)
          default: return 'lg:col-span-2';
      }
  };

  return (
    <div className="relative space-y-6">
      {/* Welcome Banner & Settings Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-4">
          <img 
            src={currentUser?.avatar} 
            alt="Profile" 
            className="w-16 h-16 rounded-full border-4 border-white shadow-sm"
          />
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              Bem-vindo, <span className="text-primary">{currentUser?.name}</span>
            </h2>
            <p className="text-gray-500 text-sm">
              Visão Geral de Tarefas e Projetos
            </p>
          </div>
        </div>
        
        <div className="flex space-x-3">
             {/* Notification Bell */}
             <div className="relative" ref={notificationRef}>
                 <button 
                    onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                    className={`p-2 bg-white rounded-lg shadow-sm text-slate-500 hover-text-primary hover-bg-primary-light transition border border-gray-200 ${isNotificationsOpen ? 'text-primary bg-primary-50' : ''}`}
                    title="Notificações e Avisos"
                >
                    <Bell size={20} />
                    {notifications.length > 0 && <span className="absolute top-1 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>}
                </button>

                {isNotificationsOpen && (
                    <div className="absolute right-0 top-full mt-2 w-80 bg-white shadow-2xl rounded-lg border border-gray-100 z-50 animate-fade-in origin-top-right">
                         <div className="p-3 border-b border-gray-50 bg-gray-50 rounded-t-lg flex justify-between items-center">
                             <h4 className="font-bold text-sm text-gray-700">Central de Avisos</h4>
                             <span className="text-xs text-primary font-medium cursor-pointer hover:underline">Marcar lidas</span>
                         </div>
                         <div className="max-h-[300px] overflow-y-auto">
                             {notifications.length === 0 ? (
                                 <div className="p-4 text-center text-gray-400 text-xs">Nenhuma notificação nova.</div>
                             ) : (
                                 notifications.map(n => (
                                     <div key={n.id} className="p-3 border-b border-gray-50 hover:bg-gray-50 flex items-start space-x-3 transition-colors">
                                         <div className={`p-2 rounded-full shrink-0 ${
                                             n.type === 'alert' ? 'bg-purple-100 text-purple-600' : // Mentions are purple
                                             n.type === 'ticket' ? 'bg-blue-100 text-blue-600' : 
                                             'bg-green-100 text-green-600'
                                         }`}>
                                             {n.type === 'alert' ? <AtSign size={16}/> : n.type === 'ticket' ? <Ticket size={16}/> : <MessageCircle size={16}/>}
                                         </div>
                                         <div>
                                             <p className="text-sm font-bold text-gray-800">{n.title}</p>
                                             <p className="text-xs text-gray-500 mt-0.5 leading-snug">{n.desc}</p>
                                             <p className="text-[10px] text-gray-400 mt-1">{n.time}</p>
                                         </div>
                                     </div>
                                 ))
                             )}
                         </div>
                    </div>
                )}
             </div>

            {/* Widget Config Settings */}
            <button 
                onClick={() => setIsConfigOpen(true)}
                className="p-2 bg-white rounded-lg shadow-sm text-slate-500 hover-text-primary hover-bg-primary-light transition border border-gray-200"
                title="Personalizar Dashboard"
            >
                <Settings size={20} />
            </button>
        </div>
      </div>

      {/* Widget Settings Sidebar (Drawer) */}
      {isConfigOpen && (
        <>
            <div className="fixed inset-0 bg-black/20 z-40 backdrop-blur-sm" onClick={() => setIsConfigOpen(false)}></div>
            <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-2xl z-50 p-6 flex flex-col animate-slide-in-right">
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                    <h3 className="text-lg font-bold text-slate-800">Widgets</h3>
                    <button onClick={() => setIsConfigOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
                </div>
                
                <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                    {widgets.map(widget => (
                        <div key={widget.id} className="bg-gray-50 p-3 rounded-lg flex items-center justify-between group">
                            <div className="flex items-center space-x-3">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" checked={widget.visible} onChange={() => toggleVisibility(widget.id)} />
                                    <div className={`w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary`}></div>
                                </label>
                                <span className={`text-sm font-medium ${widget.visible ? 'text-gray-700' : 'text-gray-400'}`}>{widget.title}</span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-4 pt-4 border-t">
                    <button 
                        onClick={resetWidgets}
                        className="w-full py-2 border border-red-200 text-red-600 rounded hover:bg-red-50 text-sm font-medium transition"
                    >
                        Redefinir Padrão
                    </button>
                </div>
            </div>
        </>
      )}
      
      {/* Dynamic Grid Layout (4 Columns) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pb-8 select-none">
        {widgets.map(widget => {
            if (!widget.visible) return null;
            return (
                <div 
                    key={widget.id}
                    ref={(el) => { widgetRefs.current[widget.id] = el; }}
                    className={`${getColSpanClass(widget.size)} transition-all duration-100 ease-linear relative group/widget`}
                >
                    <Card title={widget.title} className="h-full min-h-[300px]">
                        {renderWidgetContent(widget.id)}
                    </Card>
                    
                    {/* Resize Handle (Bottom Right) */}
                    <div 
                        onMouseDown={(e) => handleResizeStart(e, widget)}
                        className="absolute bottom-1 right-1 cursor-ew-resize p-1 text-gray-300 hover-text-primary opacity-0 group-hover/widget:opacity-100 transition-opacity z-10 bg-white rounded-tl-lg shadow-sm hidden md:block"
                        title="Arrastar para redimensionar"
                    >
                        <ArrowDownRight size={20} />
                    </div>
                </div>
            )
        })}
      </div>
    </div>
  );
};