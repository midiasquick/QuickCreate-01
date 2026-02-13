import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { 
  LayoutDashboard, 
  Ticket, 
  Puzzle, 
  Users, 
  FolderOpen, 
  BookOpen, 
  Headphones, 
  FileText, 
  Settings, 
  LogOut,
  UserCircle,
  Link as LinkIcon,
  ChevronLeft,
  Palette // Added Palette icon
} from 'lucide-react';

// Map string keys to Components
const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard,
  Ticket,
  Puzzle,
  Users,
  FolderOpen,
  BookOpen, 
  Headphones,
  FileText,
  Settings,
  Palette, // Added to map
  Link: LinkIcon
};

interface SidebarProps {
  activeTab: string;
  onNavigate: (id: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onNavigate, isOpen = false, onClose }) => {
  const { currentUser, logout } = useAuth();
  const { config } = useApp();

  if (!currentUser) return null;

  const handleLogout = () => {
    logout();
    window.location.hash = '';
  };

  const handleProfileClick = () => {
    window.location.hash = '/profile';
  };

  // Get User Role Definition for permission checks
  const userRoleDef = config.roles.find(r => r.id === currentUser.role);

  return (
    <div 
      className={`
        fixed inset-y-0 left-0 z-30 w-64 
        flex flex-col border-r border-gray-200 
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0 md:static md:h-screen
      `}
      style={{ backgroundColor: config.theme.sidebarColor }}
    >
      {/* Header / Logo */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-gray-100/10">
         <img 
            src={config.logoUrl} 
            alt="Logo" 
            className="h-8 object-contain max-w-[120px]" 
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.parentElement!.innerHTML = `<h1 class="text-2xl font-bold tracking-tighter" style="color:${config.theme.primaryColor}">pwork.</h1>`
            }}
          />
          
          {/* Mobile Close Button (Blue Circle Arrow) */}
          <button 
            onClick={onClose}
            className="md:hidden flex items-center justify-center w-8 h-8 rounded-full bg-indigo-500 text-white shadow-lg hover:bg-indigo-600 transition"
            style={{ backgroundColor: config.theme.primaryColor }}
          >
            <ChevronLeft size={20} />
          </button>
      </div>

      {/* User Mini Profile */}
      <div className="px-6 py-4 mb-2 flex flex-col">
        <p className="text-xs font-bold uppercase mb-2 opacity-50" style={{ color: config.theme.sidebarTextColor }}>My Account</p>
        <button 
          onClick={handleProfileClick}
          className="flex items-center space-x-2 py-1 hover:opacity-80 transition-opacity"
          style={{ color: config.theme.sidebarTextColor }}
        >
          <UserCircle size={18} />
          <span className="text-sm font-medium">Minha Conta</span>
        </button>
        <button 
          onClick={handleLogout} 
          className="flex items-center space-x-2 py-1 mt-1 hover:text-red-500 transition-colors"
          style={{ color: config.theme.sidebarTextColor }}
        >
          <LogOut size={18} />
          <span className="text-sm font-medium">Sair</span>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-4 space-y-1">
        <p className="px-2 text-xs font-bold uppercase mb-2 mt-2 opacity-50" style={{ color: config.theme.sidebarTextColor }}>Menu</p>
        {config.sidebarMenu.map((item) => {
          if (!item.visible) return null;

          // --- ACCESS CONTROL LOGIC ---
          let hasAccess = false;

          // 1. Admin always has access
          if (currentUser.role === 'ADMIN') {
              hasAccess = true;
          } 
          // 2. Strict Admin Only check (for non-admins)
          else if (item.adminOnly) {
              hasAccess = false;
          }
          else {
              // 3. Check Role Definition (From Settings -> Roles)
              const allowedByRole = userRoleDef?.allowedRoutes.includes(item.id) ?? false;

              // 4. Check Menu Item Config (From Settings -> Menu)
              // If allowedRoles is defined and not empty, check if user role is in it
              const allowedByItemConfig = item.allowedRoles && item.allowedRoles.length > 0
                  ? item.allowedRoles.includes(currentUser.role)
                  : false;

              // 5. External Links default to true if no specific restrictions
              const isOpenExternal = item.type === 'EXTERNAL' && (!item.allowedRoles || item.allowedRoles.length === 0);

              // Inclusive Check: If enabled in EITHER Roles OR Menu Config, show it.
              hasAccess = allowedByRole || allowedByItemConfig || isOpenExternal;
          }

          if (!hasAccess) return null;

          // Use mapped icon or fallback
          const IconComponent = ICON_MAP[item.iconKey] || LinkIcon;
          const isActive = activeTab === item.path.replace('/', '');

          return (
            <button
              key={item.id}
              onClick={() => {
                  if (item.type === 'EXTERNAL') {
                      window.open(item.path, '_blank');
                  } else {
                      onNavigate(item.id);
                  }
                  if (onClose) onClose();
              }}
              style={{
                backgroundColor: isActive ? `${config.theme.primaryColor}15` : 'transparent',
                color: isActive ? config.theme.primaryColor : config.theme.sidebarTextColor
              }}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-md transition-all hover:bg-black/5`}
            >
              <IconComponent size={18} style={{ color: isActive ? config.theme.primaryColor : config.theme.sidebarTextColor, opacity: isActive ? 1 : 0.5 }} />
              <span className="text-sm font-medium">{item.label}</span>
              {item.id === 'settings' && (
                <span className="ml-auto w-2 h-2 rounded-full bg-red-500"></span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};