import { User, AppConfig, Project, AccessLog } from './types';

export const DEFAULT_CONFIG: AppConfig = {
  logoUrl: 'https://via.placeholder.com/150x50?text=PWork',
  companyName: 'PWork Enterprise',
  theme: {
    sidebarColor: '#ffffff',
    sidebarTextColor: '#4b5563',
    primaryColor: '#4f46e5',
    secondaryColor: '#ec4899', // Default Pink/Rose
    loginBackgroundType: 'COLOR',
    loginBackgroundContent: '#0f172a', // Slate 900
    loginCardBackgroundColor: '#ffffff',
  },
  smtpConfig: {
    senderName: 'Equipe PWork',
    senderEmail: 'nao-responda@pwork.com',
    host: 'smtp.pwork.com',
    port: '587',
    username: '',
    password: ''
  },
  emailTemplates: [
    {
      id: '1',
      name: 'Boas-vindas',
      subject: 'Bem-vindo à {companyName}!',
      body: 'Olá {name}, seu acesso foi liberado com sucesso.',
      trigger: 'WELCOME_PASSWORD',
    },
  ],
  notices: [],
  roles: [
    {
      id: 'ADMIN',
      name: 'Administrador',
      allowedRoutes: ['dashboard', 'tickets', 'reports', 'team', 'directories', 'branding', 'agents', 'settings', 'brand-manual', 'designs'],
      capabilities: ['manage_users', 'manage_config', 'delete_records', 'view_all', 'edit_tickets', 'create_tickets', 'edit_fields', 'manage_members'],
    },
    {
      id: 'MANAGER',
      name: 'Gerente',
      allowedRoutes: ['dashboard', 'tickets', 'reports', 'team', 'branding', 'brand-manual', 'designs'],
      capabilities: ['view_reports', 'manage_team', 'edit_tickets', 'create_tickets', 'edit_fields', 'manage_members'],
    },
    {
      id: 'USER',
      name: 'Usuário',
      allowedRoutes: ['dashboard', 'tickets', 'team', 'brand-manual', 'designs'],
      capabilities: ['create_tickets', 'edit_fields'], // Default user capabilities
    },
  ],
  sidebarMenu: [
    { id: 'dashboard', label: 'Dashboard', path: '/dashboard', iconKey: 'LayoutDashboard', visible: true, type: 'INTERNAL' },
    { id: 'tickets', label: 'Chamados', path: '/tickets', iconKey: 'Ticket', visible: true, type: 'INTERNAL' },
    { id: 'designs', label: 'Designs', path: '/designs', iconKey: 'Palette', visible: true, type: 'INTERNAL', allowedRoles: ['ADMIN', 'MANAGER', 'USER'] },
    { id: 'brand-manual', label: 'Manual da Marca', path: '/brand-manual', iconKey: 'BookOpen', visible: true, type: 'INTERNAL', allowedRoles: ['ADMIN', 'MANAGER', 'USER'] },
    { id: 'reports', label: 'Relatórios', path: '/reports', iconKey: 'FileText', visible: true, type: 'INTERNAL', allowedRoles: ['ADMIN', 'MANAGER'] },
    { id: 'settings', label: 'Configurações', path: '/settings', iconKey: 'Settings', visible: true, type: 'INTERNAL', adminOnly: true },
  ],
  brandManual: [
      {
          id: 'b1',
          type: 'HEADER',
          content: { text: 'Nossa Identidade Visual' }
      },
      {
          id: 'b2',
          type: 'PARAGRAPH',
          content: { text: 'Este manual serve como guia para a aplicação correta da nossa marca em todos os canais de comunicação. Manter a consistência visual é fundamental para o reconhecimento e fortalecimento da nossa identidade no mercado.' }
      },
      {
          id: 'b3',
          type: 'HEADER',
          content: { text: 'Cores Principais' }
      },
      {
          id: 'b4',
          type: 'COLOR_PALETTE',
          content: {
              colors: [
                  { hex: '#4f46e5', name: 'Indigo Primary', usage: 'Botões, Links, Destaques' },
                  { hex: '#0f172a', name: 'Slate Dark', usage: 'Fundos, Textos Principais' },
                  { hex: '#64748b', name: 'Slate Grey', usage: 'Bordas, Textos Secundários' }
              ]
          }
      },
      {
          id: 'b5',
          type: 'HEADER',
          content: { text: 'Tipografia' }
      },
      {
          id: 'b6',
          type: 'TYPOGRAPHY',
          content: { text: 'Inter', subText: 'Sans-serif family used for UI elements.' }
      }
  ]
};

export const INITIAL_USERS: User[] = [
  {
    id: '1',
    username: 'demoadmin',
    password: 'demo',
    name: 'Admin User',
    email: 'admin@pwork.com',
    role: 'ADMIN',
    avatar: 'https://ui-avatars.com/api/?name=Admin+User&background=0D8ABC&color=fff',
    memberSince: new Date().toLocaleDateString(),
    jobTitle: 'Administrator',
    location: 'Headquarters',
    birthDate: '',
    phoneNumber: '',
    bio: 'System Administrator',
    permissions: [],
  },
  {
    id: '2',
    username: 'demouser',
    password: 'demo',
    name: 'Demo User',
    email: 'user@pwork.com',
    role: 'USER',
    avatar: 'https://ui-avatars.com/api/?name=Demo+User&background=random',
    memberSince: new Date().toLocaleDateString(),
    jobTitle: 'Team Member',
    location: 'Remote',
    birthDate: '',
    phoneNumber: '',
    bio: 'Standard system user',
    permissions: [],
  }
];

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'p1',
    title: 'Meu Primeiro Projeto',
    description: 'Comece adicionando tarefas',
    columns: [
      { 
          id: 'c1', title: 'Status', type: 'status', width: '150px', 
          options: [
              { id: 'opt1', label: 'Feito', color: '#4ade80' }, // green-400
              { id: 'opt2', label: 'Em Andamento', color: '#fbbf24' }, // amber-400
              { id: 'opt3', label: 'Travado', color: '#f87171' } // red-400
          ] 
      },
      { id: 'c2', title: 'Data', type: 'date', width: '130px' }
    ],
    groups: [
      { id: 'g1', title: 'Grupo Inicial', color: '#3b82f6' }
    ],
    items: [],
    members: ['1', '2']
  }
];

// Mock Data generation for Access Logs (Last 30 days)
const generateMockLogs = (): AccessLog[] => {
    const logs: AccessLog[] = [];
    const now = new Date();
    
    // Generate 50 random logs
    for(let i=0; i<50; i++) {
        const daysAgo = Math.floor(Math.random() * 30);
        const date = new Date(now);
        date.setDate(date.getDate() - daysAgo);
        
        // Random user (1 or 2)
        const userId = Math.random() > 0.4 ? '1' : '2';
        
        logs.push({
            id: `log_${i}`,
            userId: userId,
            timestamp: date.toISOString()
        });
    }
    
    return logs.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

export const MOCK_ACCESS_LOGS = generateMockLogs();