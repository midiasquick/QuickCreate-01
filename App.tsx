import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Settings } from './pages/Settings';
import { Profile } from './pages/Profile';
import { Tickets } from './pages/Tickets';
import { Reports } from './pages/Reports';
import { BrandManual } from './pages/BrandManual';
import { Designs } from './pages/Designs';
import { Sidebar } from './components/Layout/Sidebar';
import { Menu } from 'lucide-react';

const AppContent: React.FC = () => {
  const { currentUser, isLoading } = useAuth();
  const { config } = useApp();
  const [currentPath, setCurrentPath] = useState(window.location.hash.replace('#', '') || '/dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const handleHashChange = () => {
      const path = window.location.hash.replace('#', '') || '/dashboard';
      setCurrentPath(path);
      setIsSidebarOpen(false);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = (id: string) => {
    window.location.hash = `/${id}`;
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-100 text-gray-400">Carregando...</div>;
  }

  // Se não estiver logado, mostra Login e nem carrega o resto do App
  if (!currentUser) {
    return <Login />;
  }

  // --- Dynamic CSS Injection for Theming ---
  const primaryColor = config.theme.primaryColor;
  const secondaryColor = config.theme.secondaryColor || '#ec4899';
  
  const dynamicStyles = `
    :root {
      --primary: ${primaryColor};
      --secondary: ${secondaryColor};
    }
    .text-primary { color: var(--primary) !important; }
    .bg-primary { background-color: var(--primary) !important; }
    .bg-primary-light { background-color: ${primaryColor}1a !important; }
    .bg-primary-50 { background-color: ${primaryColor}0d !important; }
    .border-primary { border-color: var(--primary) !important; }
    .hover-text-primary:hover { color: var(--primary) !important; }
    .hover-bg-primary:hover { background-color: var(--primary) !important; }
    .btn-primary { background-color: var(--primary); color: white; }
    .btn-primary:hover { filter: brightness(0.9); }
    .focus-ring-primary:focus { --tw-ring-color: ${primaryColor}40 !important; }
    
    .text-secondary { color: var(--secondary) !important; }
    .bg-secondary { background-color: var(--secondary) !important; }
    .bg-secondary-light { background-color: ${secondaryColor}15 !important; }
  `;

  // --- Router Logic ---
  const renderPage = () => {
    const routeId = currentPath.replace('/', '');
    const menuItem = config.sidebarMenu.find(item => item.path === currentPath);
    
    // Default allowed routes
    if (['dashboard', 'profile', ''].includes(routeId)) {
         return routeId === 'profile' ? <Profile /> : <Dashboard />;
    }

    // Access Control
    if (menuItem) {
        let hasAccess = false;
        if (currentUser.role === 'ADMIN') hasAccess = true;
        else if (menuItem.adminOnly) hasAccess = false;
        else {
            const roleDef = config.roles.find(r => r.id === currentUser.role);
            const allowedByRole = roleDef?.allowedRoutes.includes(menuItem.id) ?? false;
            const allowedByItemConfig = menuItem.allowedRoles?.includes(currentUser.role) ?? false;
            const isExternalOpen = menuItem.type === 'EXTERNAL' && (!menuItem.allowedRoles || menuItem.allowedRoles.length === 0);
            
            hasAccess = allowedByRole || allowedByItemConfig || isExternalOpen;
        }

        if (!hasAccess) {
            setTimeout(() => window.location.hash = '/dashboard', 0);
            return <Dashboard />;
        }
    }

    switch (currentPath) {
      case '/dashboard': return <Dashboard />;
      case '/tickets': return <Tickets />;
      case '/reports': return <Reports />;
      case '/settings': return <Settings />;
      case '/profile': return <Profile />;
      case '/brand-manual': return <BrandManual />;
      case '/designs': return <Designs />;
      default: return (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <h2 className="text-2xl font-bold mb-2">Página em Construção</h2>
            <p>Você está acessando: {currentPath}</p>
          </div>
        );
    }
  };

  const activeTab = currentPath.replace('/', '');

  // Filter Active Notices
  const activeNotices = config.notices.filter(notice => {
      if (!notice.active) return false;
      const now = new Date();
      if (notice.startDate && now < new Date(notice.startDate)) return false;
      if (notice.endDate && now > new Date(notice.endDate)) return false;
      if (notice.targetRoles?.length > 0 && !notice.targetRoles.includes(currentUser.role)) return false;
      if (notice.targetRoutes?.length > 0) {
          const routeToCheck = activeTab === '' ? 'dashboard' : activeTab;
          if (!notice.targetRoutes.includes(routeToCheck)) return false;
      }
      return true;
  });

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row">
      <style>{dynamicStyles}</style>
      
      {/* Mobile Header */}
      <div className="md:hidden bg-white h-16 px-4 flex justify-between items-center shadow-sm sticky top-0 z-20">
         {config.logoUrl.includes('placeholder') ? (
             <h1 className="text-2xl font-bold tracking-tighter text-primary">pwork.</h1>
         ) : (
             <img src={config.logoUrl} alt="Logo" className="h-8 object-contain" />
         )}
         <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-md">
           <Menu size={24} />
         </button>
      </div>

      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-20 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <Sidebar 
        activeTab={activeTab} 
        onNavigate={navigate} 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />

      <main className="flex-1 p-4 md:p-6 overflow-y-auto h-[calc(100vh-64px)] md:h-screen custom-scrollbar">
        {activeNotices.length > 0 && (
          <div className="mb-6 space-y-2">
              {activeNotices.map(notice => (
                <div key={notice.id} className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r shadow-sm flex justify-between items-start animate-fade-in">
                    <div>
                        <h3 className="text-yellow-800 font-bold">{notice.title}</h3>
                        <p className="text-yellow-700 text-sm mt-1">{notice.content}</p>
                    </div>
                </div>
              ))}
          </div>
        )}
        
        {renderPage()}
      </main>
    </div>
  );
};

// ... (mantenha os imports e o componente AppContent iguais até o final)

const App: React.FC = () => {
  return (
    // MUDANÇA AQUI: AuthProvider fica por fora!
    <AuthProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </AuthProvider>
  );
};

export default App;