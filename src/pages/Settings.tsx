import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Textarea } from '../components/ui/Textarea';
import { Button } from '../components/ui/Button';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { EmailTemplate, Notice, RoleDefinition, MenuItemConfig, SmtpConfig } from '../types';
import { Trash2, Edit2, Plus, Save, X, Upload, Mail, AlertTriangle, Shield, Palette, User as UserIcon, List, Link as LinkIcon, Eye, EyeOff, KeyRound, Server, ExternalLink } from 'lucide-react';

export const Settings: React.FC = () => {
  const { config, updateConfig, users, addUser, updateUser, deleteUser } = useApp();
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'branding' | 'menu' | 'emails' | 'notices'>('users');
  
  // --- STATE ---
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUserForm, setNewUserForm] = useState<{name: string, email: string, role: string, username: string, password: string}>({
    name: '', email: '', role: 'USER', username: '', password: ''
  });
  const [newLink, setNewLink] = useState({ label: '', url: '' });
  const [editingEmail, setEditingEmail] = useState<EmailTemplate | null>(null);
  const [previewEmail, setPreviewEmail] = useState<EmailTemplate | null>(null);
  const [smtpForm, setSmtpForm] = useState<SmtpConfig>(config.smtpConfig);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  const [editingRole, setEditingRole] = useState<RoleDefinition | null>(null);

  // ---------------- HANDLERS ----------------

  const handleAddUser = async () => {
    if(newUserForm.name && newUserForm.email && newUserForm.username && newUserForm.password) {
      await addUser({
        ...newUserForm,
        avatar: `https://ui-avatars.com/api/?name=${newUserForm.name}&background=random`,
        role: newUserForm.role, // 'ADMIN' or 'USER'
        permissions: [],
        memberSince: new Date().toLocaleDateString('pt-BR'),
        jobTitle: 'Novo Usuário',
        location: 'Remoto',
        birthDate: '',
        phoneNumber: '',
        bio: ''
      });
      setIsAddingUser(false);
      setNewUserForm({ name: '', email: '', role: 'USER', username: '', password: '' });
      alert("Usuário criado com sucesso!");
    } else {
        alert("Preencha todos os campos obrigatórios.");
    }
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
    if (confirm(`Deseja alterar o nível de acesso deste usuário para ${newRole}?`)) {
      await updateUser(userId, { role: newRole });
    }
  };

  const handleSendPasswordReset = (email: string) => {
      // Mock logic for password reset
      alert(`Um link para redefinição de senha foi enviado para ${email}`);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => updateConfig({ logoUrl: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  const handleLoginBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
         updateConfig({ 
             theme: { 
                 ...config.theme, 
                 loginBackgroundType: 'IMAGE', 
                 loginBackgroundContent: reader.result as string 
             } 
         });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddCustomLink = () => {
      if (!newLink.label || !newLink.url) return;
      const newItem: MenuItemConfig = {
          id: `link_${Date.now()}`,
          label: newLink.label,
          path: newLink.url,
          iconKey: 'Link',
          visible: true,
          type: 'EXTERNAL',
          allowedRoles: []
      };
      updateConfig({ sidebarMenu: [...config.sidebarMenu, newItem] });
      setNewLink({ label: '', url: '' });
  };

  const removeMenuItem = (id: string) => {
      if(confirm('Remover este item do menu?')) {
          updateConfig({ sidebarMenu: config.sidebarMenu.filter(i => i.id !== id) });
      }
  };

  const handleSaveSmtp = () => {
      updateConfig({ smtpConfig: smtpForm });
      alert("Configurações SMTP salvas com sucesso!");
  };

  const handleSaveEmail = () => {
    if (!editingEmail) return;
    const exists = config.emailTemplates.find(t => t.id === editingEmail.id);
    let newTemplates;
    if (exists) {
        newTemplates = config.emailTemplates.map(t => t.id === editingEmail.id ? editingEmail : t);
    } else {
        newTemplates = [...config.emailTemplates, editingEmail];
    }
    updateConfig({ emailTemplates: newTemplates });
    setEditingEmail(null);
  };

  const handleDeleteEmail = (id: string) => {
      if(confirm("Tem certeza que deseja excluir este template?")) {
          updateConfig({ emailTemplates: config.emailTemplates.filter(t => t.id !== id) });
      }
  };

  const handleCreateTemplate = () => {
      setEditingEmail({
          id: `tpl_${Date.now()}`,
          name: 'Novo Template',
          subject: 'Assunto do E-mail',
          body: '<p>Olá {name},</p>',
          trigger: 'TICKET_NEW_ASSIGN'
      });
  };

  const handleSaveNotice = () => {
      if (!editingNotice) return;
      const exists = config.notices.find(n => n.id === editingNotice.id);
      let newNotices;
      if (exists) {
          newNotices = config.notices.map(n => n.id === editingNotice.id ? editingNotice : n);
      } else {
          newNotices = [...config.notices, editingNotice];
      }
      updateConfig({ notices: newNotices });
      setEditingNotice(null);
  };

  const handleDeleteNotice = (id: string) => {
    if(confirm("Excluir este aviso?")) {
        updateConfig({ notices: config.notices.filter(n => n.id !== id) });
    }
  };

  const handleCreateNotice = () => {
      setEditingNotice({
          id: `notice_${Date.now()}`,
          title: 'Novo Aviso',
          content: 'Conteúdo do aviso...',
          active: true,
          type: 'GLOBAL',
          targetRoles: [],
          targetRoutes: []
      });
  };

  const handleCreateRole = () => {
      const newRole: RoleDefinition = {
          id: `ROLE_${Date.now()}`,
          name: 'Nova Função',
          allowedRoutes: ['dashboard'],
          capabilities: []
      };
      updateConfig({ roles: [...config.roles, newRole] });
      setEditingRole(newRole);
  };

  const handleDeleteRole = (id: string) => {
      if(id === 'ADMIN') {
          alert('Não é possível excluir a função de Administrador.');
          return;
      }
      if(confirm('Tem certeza que deseja excluir esta função? Usuários associados perderão o acesso.')) {
          updateConfig({ roles: config.roles.filter(r => r.id !== id) });
          if(editingRole?.id === id) setEditingRole(null);
      }
  };

  const handleSaveRole = () => {
      if (!editingRole) return;
      const newRoles = config.roles.map(r => r.id === editingRole.id ? editingRole : r);
      updateConfig({ roles: newRoles });
      setEditingRole(null);
  };

  const toggleRoleRoute = (routeId: string) => {
      if (!editingRole) return;
      const currentRoutes = editingRole.allowedRoutes;
      const newRoutes = currentRoutes.includes(routeId)
          ? currentRoutes.filter(r => r !== routeId)
          : [...currentRoutes, routeId];
      setEditingRole({ ...editingRole, allowedRoutes: newRoutes });
  };

  const toggleRoleCapability = (cap: string) => {
      if (!editingRole) return;
      const currentCaps = editingRole.capabilities;
      const newCaps = currentCaps.includes(cap)
          ? currentCaps.filter(c => c !== cap)
          : [...currentCaps, cap];
      setEditingRole({ ...editingRole, capabilities: newCaps });
  };

  const toggleMenuItem = (id: string) => {
      const newMenu = config.sidebarMenu.map(item => 
        item.id === id ? { ...item, visible: !item.visible } : item
      );
      updateConfig({ sidebarMenu: newMenu });
  };

  const TabButton = ({ id, icon: Icon, label }: { id: typeof activeTab, icon: any, label: string }) => {
    const isActive = activeTab === id;
    const secondaryColor = config.theme.secondaryColor || '#ec4899';
    
    return (
        <button 
          onClick={() => setActiveTab(id)} 
          className={`w-full text-left px-4 py-3 rounded-lg flex items-center space-x-3 transition-colors ${!isActive ? 'hover:bg-gray-50 text-gray-600' : ''}`}
          style={isActive ? { backgroundColor: `${secondaryColor}15`, color: secondaryColor, fontWeight: 'bold' } : {}}
        >
          <Icon size={18} /> <span>{label}</span>
        </button>
    );
  };

  // Access Control: Only admins can manage users
  const isAdmin = currentUser?.role === 'ADMIN';

  return (
    <div className="flex flex-col md:flex-row gap-6 h-full overflow-hidden">
      
      {/* Sidebar Navigation */}
      <div className="w-full md:w-64 flex-shrink-0 space-y-2">
        {isAdmin && <TabButton id="users" icon={UserIcon} label="Gestão de Usuários" />}
        <TabButton id="roles" icon={Shield} label="Funções e Permissões" />
        <TabButton id="menu" icon={List} label="Menu Lateral" />
        <TabButton id="branding" icon={Palette} label="Branding" />
        <TabButton id="emails" icon={Mail} label="E-mails e Avisos" />
        <TabButton id="notices" icon={AlertTriangle} label="Avisos (Sistêmicos)" />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto pb-10 custom-scrollbar">
        
        {/* === USERS TAB (Admin Only) === */}
        {activeTab === 'users' && (
          isAdmin ? (
            <div className="space-y-6 animate-fade-in">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800">Gerenciar Usuários</h2>
                <Button onClick={() => setIsAddingUser(true)} icon={Plus}>Novo Usuário</Button>
              </div>

              {isAddingUser && (
                <Card title="Adicionar Novo Usuário" className="mb-6 border border-primary-light">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Nome Completo" placeholder="Nome Completo" value={newUserForm.name} onChange={e => setNewUserForm({...newUserForm, name: e.target.value})} />
                    <Input label="E-mail" placeholder="E-mail" type="email" value={newUserForm.email} onChange={e => setNewUserForm({...newUserForm, email: e.target.value})} />
                    <Input label="Login" placeholder="Nome de Usuário" value={newUserForm.username} onChange={e => setNewUserForm({...newUserForm, username: e.target.value})} />
                    <Input label="Senha" placeholder="Senha Inicial" type="password" value={newUserForm.password} onChange={e => setNewUserForm({...newUserForm, password: e.target.value})} />
                    <Select label="Função" value={newUserForm.role} onChange={e => setNewUserForm({...newUserForm, role: e.target.value})}>
                      <option value="USER">Usuário</option>
                      <option value="ADMIN">Administrador</option>
                      {/* Outras roles definidas se houver */}
                      {config.roles.filter(r => r.id !== 'ADMIN' && r.id !== 'USER').map(role => <option key={role.id} value={role.id}>{role.name}</option>)}
                    </Select>
                  </div>
                  <div className="mt-4 flex justify-end space-x-2">
                    <Button variant="secondary" onClick={() => setIsAddingUser(false)}>Cancelar</Button>
                    <Button variant="success" onClick={handleAddUser}>Criar Usuário</Button>
                  </div>
                </Card>
              )}

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Usuário</th>
                      <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Função</th>
                      <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Criado em</th>
                      <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {users.map(user => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 flex items-center space-x-3">
                          <img src={user.avatar} alt="" className="w-8 h-8 rounded-full bg-gray-200" />
                          <div>
                            <p className="font-medium text-slate-800">{user.name}</p>
                            <p className="text-xs text-gray-500">{user.email}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                           {/* Role Switching */}
                           <select 
                              className="text-xs font-bold bg-gray-100 border-none rounded p-1 cursor-pointer focus:ring-2 focus:ring-indigo-200"
                              value={user.role}
                              onChange={(e) => handleChangeRole(user.id, e.target.value)}
                           >
                              <option value="USER">Usuário</option>
                              <option value="ADMIN">Administrador</option>
                              {config.roles.filter(r => r.id !== 'ADMIN' && r.id !== 'USER').map(role => <option key={role.id} value={role.id}>{role.name}</option>)}
                           </select>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs text-gray-500">
                            {user.memberSince || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-1">
                              <button onClick={() => handleSendPasswordReset(user.email)} className="text-gray-400 hover-text-primary p-1" title="Enviar e-mail de redefinição de senha">
                                  <KeyRound size={18} />
                              </button>
                              <button onClick={() => { if(confirm('Excluir usuário? Isso impedirá o acesso.')) deleteUser(user.id) }} className="text-red-400 hover:text-red-600 p-1" title="Excluir usuário">
                                  <Trash2 size={18} />
                              </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                <Shield size={48} className="text-gray-300 mb-4" />
                <h3 className="text-lg font-bold text-gray-600">Acesso Restrito</h3>
                <p className="text-gray-500">Apenas administradores podem gerenciar usuários.</p>
            </div>
          )
        )}

        {/* === ROLES TAB === */}
        {activeTab === 'roles' && (
           <div className="space-y-6 animate-fade-in">
              <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-slate-800">Funções e Permissões</h2>
                  <Button onClick={handleCreateRole} icon={Plus}>Nova Função</Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                      {config.roles.map(role => (
                          <div 
                              key={role.id} 
                              className={`p-4 bg-white rounded-lg shadow-sm border cursor-pointer transition-all ${editingRole?.id === role.id ? 'border-primary ring-1 ring-primary' : 'border-gray-200 hover-border-primary'}`}
                              onClick={() => setEditingRole(role)}
                          >
                              <div className="flex justify-between items-center mb-2">
                                  <h3 className="font-bold text-slate-800">{role.name}</h3>
                                  {role.id !== 'ADMIN' && (
                                      <button onClick={(e) => { e.stopPropagation(); handleDeleteRole(role.id); }} className="text-gray-400 hover:text-red-500">
                                          <Trash2 size={16} />
                                      </button>
                                  )}
                              </div>
                              <p className="text-xs text-gray-500 mb-2">ID: {role.id}</p>
                              <div className="flex flex-wrap gap-2">
                                  {role.allowedRoutes.slice(0, 4).map(r => (
                                      <span key={r} className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[10px] uppercase">{r}</span>
                                  ))}
                                  {role.allowedRoutes.length > 4 && <span className="text-xs text-gray-400">+{role.allowedRoutes.length - 4}</span>}
                              </div>
                          </div>
                      ))}
                  </div>

                  {editingRole ? (
                      <Card title={`Editando: ${editingRole.name}`} className="sticky top-0 h-fit">
                          <div className="space-y-4">
                              <Input 
                                label="Nome da Função" 
                                value={editingRole.name} 
                                onChange={(e) => setEditingRole({...editingRole, name: e.target.value})} 
                                disabled={editingRole.id === 'ADMIN'}
                              />

                              <div>
                                  <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Acesso ao Menu</label>
                                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border p-2 rounded bg-gray-50">
                                      {config.sidebarMenu.map(item => (
                                          <label key={item.id} className="flex items-center space-x-2 text-sm cursor-pointer hover:bg-white p-1 rounded">
                                              <input 
                                                  type="checkbox" 
                                                  checked={editingRole.allowedRoutes.includes(item.id)}
                                                  onChange={() => toggleRoleRoute(item.id)}
                                                  disabled={editingRole.id === 'ADMIN'}
                                                  className="rounded text-primary focus-ring-primary"
                                              />
                                              <span>{item.label}</span>
                                          </label>
                                      ))}
                                  </div>
                              </div>

                              <div>
                                  <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Capacidades Especiais</label>
                                  <div className="space-y-2 border p-2 rounded bg-gray-50">
                                      {[
                                          {id: 'create_tickets', label: 'Abrir Novos Chamados'},
                                          {id: 'edit_fields', label: 'Preencher/Editar Campos'},
                                          {id: 'edit_tickets', label: 'Configurar/Excluir Colunas'},
                                          {id: 'manage_members', label: 'Gerenciar Participantes'},
                                          {id: 'view_reports', label: 'Ver Relatórios Completos'},
                                          {id: 'manage_users', label: 'Gerenciar Usuários'},
                                          {id: 'manage_config', label: 'Acessar Configurações'},
                                          {id: 'delete_records', label: 'Excluir Registros'}
                                      ].map(cap => (
                                          <label key={cap.id} className="flex items-center space-x-2 text-sm cursor-pointer hover:bg-white p-1 rounded">
                                              <input 
                                                  type="checkbox" 
                                                  checked={editingRole.capabilities.includes(cap.id)}
                                                  onChange={() => toggleRoleCapability(cap.id)}
                                                  disabled={editingRole.id === 'ADMIN'}
                                                  className="rounded text-primary focus-ring-primary"
                                              />
                                              <span>{cap.label}</span>
                                          </label>
                                      ))}
                                  </div>
                              </div>

                              <div className="flex justify-end pt-2 border-t">
                                  <Button onClick={handleSaveRole} icon={Save}>Salvar Função</Button>
                              </div>
                          </div>
                      </Card>
                  ) : (
                      <div className="flex items-center justify-center h-64 border-2 border-dashed border-gray-200 rounded-lg text-gray-400 bg-gray-50">
                          Selecione ou crie uma função para editar
                      </div>
                  )}
              </div>
           </div>
        )}

        {/* ... Rest of Tabs (Branding, Menu, etc) ... */}
        {activeTab === 'branding' && (
          <div className="space-y-6 animate-fade-in">
             <h2 className="text-2xl font-bold text-slate-800">Personalização Visual</h2>
             
             <Card title="Identidade Visual">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Logo da Empresa</label>
                    <div className="flex items-center space-x-4">
                      <div className="h-16 w-32 bg-gray-100 border border-gray-200 rounded flex items-center justify-center overflow-hidden">
                        {config.logoUrl ? <img src={config.logoUrl} alt="Logo" className="h-12 object-contain" /> : <span className="text-xs text-gray-400">Sem Logo</span>}
                      </div>
                      <label className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">
                        <Upload size={16} className="inline mr-2"/> Carregar
                        <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                      </label>
                    </div>
                  </div>
                  <Input label="Nome da Empresa" value={config.companyName} onChange={(e) => updateConfig({ companyName: e.target.value })} />
                </div>
             </Card>

             <Card title="Cores e Temas">
               <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="w-full">
                        <Input label="Cor Primária" type="color" className="h-10 p-1" value={config.theme.primaryColor} onChange={(e) => updateConfig({ theme: { ...config.theme, primaryColor: e.target.value } })} />
                        <p className="text-xs text-gray-400 mt-1">Usada em botões principais e destaques.</p>
                      </div>
                      <div className="w-full">
                        <Input label="Cor Secundária" type="color" className="h-10 p-1" value={config.theme.secondaryColor || '#ec4899'} onChange={(e) => updateConfig({ theme: { ...config.theme, secondaryColor: e.target.value } })} />
                        <p className="text-xs text-gray-400 mt-1">Usada em elementos de apoio e detalhes.</p>
                      </div>
                  </div>

                  <div className="border-t border-gray-100 pt-4">
                     <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Fundo da Tela de Login</label>
                     <div className="flex flex-col space-y-3">
                        <div className="flex items-center space-x-4">
                           <label className="flex items-center cursor-pointer">
                              <input type="radio" name="loginBg" checked={config.theme.loginBackgroundType === 'COLOR'} onChange={() => updateConfig({ theme: { ...config.theme, loginBackgroundType: 'COLOR' } })} className="mr-2" />
                              <span className="text-sm">Cor Sólida</span>
                           </label>
                           <label className="flex items-center cursor-pointer">
                              <input type="radio" name="loginBg" checked={config.theme.loginBackgroundType === 'IMAGE'} onChange={() => updateConfig({ theme: { ...config.theme, loginBackgroundType: 'IMAGE' } })} className="mr-2" />
                              <span className="text-sm">Imagem Personalizada</span>
                           </label>
                        </div>

                        {config.theme.loginBackgroundType === 'COLOR' ? (
                            <Input type="color" className="h-10 w-48 p-1" value={config.theme.loginBackgroundContent} onChange={(e) => updateConfig({ theme: { ...config.theme, loginBackgroundContent: e.target.value } })} />
                        ) : (
                            <div className="flex items-center space-x-4">
                                <div className="h-20 w-32 bg-gray-100 rounded border flex items-center justify-center overflow-hidden">
                                     {config.theme.loginBackgroundContent.startsWith('#') ? <span className="text-xs text-gray-400">Sem Imagem</span> : <img src={config.theme.loginBackgroundContent} className="w-full h-full object-cover" />}
                                </div>
                                <label className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">
                                    <Upload size={16} className="inline mr-2"/> Escolher Imagem
                                    <input type="file" className="hidden" accept="image/*" onChange={handleLoginBgUpload} />
                                </label>
                            </div>
                        )}
                     </div>
                  </div>
               </div>
             </Card>
          </div>
        )}

        {activeTab === 'menu' && (
          <div className="space-y-6 animate-fade-in">
             <h2 className="text-2xl font-bold text-slate-800">Menu Lateral</h2>
             <Card title="Links Personalizáveis">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end mb-4">
                     <Input label="Rótulo" placeholder="Ex: Sistema RH" value={newLink.label} onChange={(e) => setNewLink({...newLink, label: e.target.value})} />
                     <Input label="URL" placeholder="https://..." value={newLink.url} onChange={(e) => setNewLink({...newLink, url: e.target.value})} />
                     <div className="h-10 flex items-end">
                        <Button onClick={handleAddCustomLink} icon={Plus} className="w-full">Adicionar</Button>
                     </div>
                 </div>
                 
                 <div className="space-y-2">
                     {config.sidebarMenu.filter(i => i.type === 'EXTERNAL').map(item => (
                         <div key={item.id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded">
                             <div className="flex items-center space-x-3">
                                 <ExternalLink size={16} className="text-gray-400"/>
                                 <div>
                                     <p className="font-bold text-sm text-slate-800">{item.label}</p>
                                     <p className="text-xs text-gray-500 truncate max-w-md">{item.path}</p>
                                 </div>
                             </div>
                             <button onClick={() => removeMenuItem(item.id)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={16}/></button>
                         </div>
                     ))}
                     {config.sidebarMenu.filter(i => i.type === 'EXTERNAL').length === 0 && <p className="text-center text-gray-400 py-4 text-sm bg-gray-50 rounded border border-dashed">Nenhum link externo adicionado.</p>}
                 </div>
             </Card>

             <Card title="Visibilidade dos Itens Padrão">
                <div className="space-y-2">
                   {config.sidebarMenu.filter(i => i.type === 'INTERNAL').map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-white rounded border border-gray-100">
                          <div className="flex items-center space-x-3">
                              <div className={`p-2 rounded ${item.visible ? 'bg-primary-light text-primary' : 'bg-gray-200 text-gray-400'}`}>
                                  <List size={18} /> 
                              </div>
                              <div>
                                  <p className={`font-bold ${item.visible ? 'text-slate-800' : 'text-gray-400'}`}>{item.label}</p>
                              </div>
                          </div>
                          <button onClick={() => toggleMenuItem(item.id)} className={`p-2 rounded transition-colors ${item.visible ? 'text-primary hover-bg-primary-light' : 'text-gray-400 hover:bg-gray-100'}`}>
                             {item.visible ? <Eye size={20} /> : <EyeOff size={20} />}
                          </button>
                      </div>
                   ))}
                </div>
             </Card>
          </div>
        )}

        {/* ... Emails and Notices Tabs ... */}
        {activeTab === 'emails' && (
            <div className="space-y-6 animate-fade-in">
                <h2 className="text-2xl font-bold text-slate-800">E-mails e Notificações</h2>
                <Card title="Configuração SMTP" className="border-t-4 border-t-blue-500">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="Host SMTP" icon={Server} placeholder="smtp.example.com" value={smtpForm.host} onChange={(e) => setSmtpForm({...smtpForm, host: e.target.value})} />
                        <Input label="Porta" placeholder="587" value={smtpForm.port} onChange={(e) => setSmtpForm({...smtpForm, port: e.target.value})} />
                        <Input label="Usuário SMTP" placeholder="email@dominio.com" value={smtpForm.username || ''} onChange={(e) => setSmtpForm({...smtpForm, username: e.target.value})} />
                        <Input label="Senha SMTP" type="password" placeholder="••••••••" value={smtpForm.password || ''} onChange={(e) => setSmtpForm({...smtpForm, password: e.target.value})} />
                        <Input label="Nome do Remetente" placeholder="Minha Empresa" value={smtpForm.senderName} onChange={(e) => setSmtpForm({...smtpForm, senderName: e.target.value})} />
                        <Input label="E-mail do Remetente" type="email" placeholder="no-reply@dominio.com" value={smtpForm.senderEmail} onChange={(e) => setSmtpForm({...smtpForm, senderEmail: e.target.value})} />
                    </div>
                    <div className="mt-4 flex justify-end">
                        <Button onClick={handleSaveSmtp} icon={Save}>Salvar Configuração</Button>
                    </div>
                </Card>

                <div className="flex justify-between items-center mt-8 mb-4">
                    <h3 className="text-lg font-bold text-gray-700">Templates de E-mail</h3>
                    <Button variant="ghost" onClick={handleCreateTemplate} icon={Plus} className="text-primary">Criar Novo</Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {config.emailTemplates.map(tpl => (
                        <div key={tpl.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition">
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="font-bold text-slate-800">{tpl.name}</h4>
                                <div className="flex space-x-2">
                                    <button onClick={() => setPreviewEmail(tpl)} className="text-gray-400 hover:text-blue-500" title="Visualizar Template"><Eye size={16}/></button>
                                    <button onClick={() => setEditingEmail(tpl)} className="text-gray-400 hover-text-primary" title="Editar Template"><Edit2 size={16}/></button>
                                    <button onClick={() => handleDeleteEmail(tpl.id)} className="text-gray-400 hover:text-red-500" title="Excluir Template"><Trash2 size={16}/></button>
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 mb-2">Assunto: {tpl.subject}</p>
                            <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wide border border-gray-200">
                                Gatilho: {tpl.trigger}
                            </span>
                        </div>
                    ))}
                </div>

                {/* EMAIL EDITOR MODAL */}
                {editingEmail && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden animate-fade-in">
                            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                <h3 className="font-bold text-lg text-gray-800">Editar Template</h3>
                                <button onClick={() => setEditingEmail(null)}><X size={20} className="text-gray-400 hover:text-gray-600"/></button>
                            </div>
                            <div className="p-6 space-y-4">
                                <Input label="Nome do Template" value={editingEmail.name} onChange={(e) => setEditingEmail({...editingEmail, name: e.target.value})} />
                                <div className="grid grid-cols-2 gap-4">
                                     <Select label="Gatilho de Disparo" value={editingEmail.trigger} onChange={(e) => setEditingEmail({...editingEmail, trigger: e.target.value as any})}>
                                            <option value="WELCOME_PASSWORD">Boas-vindas (Senha Provisória)</option>
                                            <option value="RESET_PASSWORD">Redefinição de Senha</option>
                                            <option value="TICKET_NEW_ASSIGN">Novo Chamado (Atribuído)</option>
                                            <option value="TICKET_UPDATED">Movimentação no Chamado</option>
                                            <option value="TICKET_COMMENT_REPLY">Resposta/Comentário</option>
                                     </Select>
                                    <Input label="Assunto" value={editingEmail.subject} onChange={(e) => setEditingEmail({...editingEmail, subject: e.target.value})} />
                                </div>
                                <Textarea 
                                    label="Corpo do E-mail (HTML)" 
                                    rows={8} 
                                    value={editingEmail.body} 
                                    onChange={(e) => setEditingEmail({...editingEmail, body: e.target.value})} 
                                    className="font-mono"
                                />
                            </div>
                            <div className="p-4 border-t border-gray-100 flex justify-end bg-gray-50">
                                <Button onClick={handleSaveEmail}>Salvar Template</Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* EMAIL PREVIEW MODAL */}
                {previewEmail && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden animate-fade-in flex flex-col max-h-[90vh]">
                            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                <h3 className="font-bold text-lg text-gray-800">Visualizar: {previewEmail.name}</h3>
                                <button onClick={() => setPreviewEmail(null)}><X size={20} className="text-gray-400 hover:text-gray-600"/></button>
                            </div>
                            <div className="p-4 bg-gray-100 border-b border-gray-200">
                                <p className="text-sm text-gray-600"><span className="font-bold">Assunto:</span> {previewEmail.subject}</p>
                            </div>
                            <div className="p-6 overflow-y-auto bg-white flex-1">
                                <div 
                                    className="prose max-w-none text-sm text-gray-800" 
                                    dangerouslySetInnerHTML={{ __html: previewEmail.body }} 
                                />
                            </div>
                            <div className="p-4 border-t border-gray-100 flex justify-end bg-gray-50">
                                <Button variant="secondary" onClick={() => setPreviewEmail(null)}>Fechar Preview</Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        )}

        {activeTab === 'notices' && (
            <div className="space-y-6 animate-fade-in">
                 <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-slate-800">Avisos e Comunicados</h2>
                    <Button onClick={handleCreateNotice} icon={Plus}>Novo Aviso</Button>
                </div>

                <div className="space-y-4">
                    {config.notices.length === 0 ? (
                        <p className="text-center text-gray-400 py-10 bg-gray-50 rounded-lg border border-dashed border-gray-200">Nenhum aviso ativo.</p>
                    ) : (
                        config.notices.map(notice => (
                            <div key={notice.id} className={`bg-white p-4 rounded-lg border-l-4 shadow-sm flex justify-between items-start ${notice.active ? 'border-l-green-500' : 'border-l-gray-300 opacity-60'}`}>
                                <div>
                                    <div className="flex items-center space-x-2 mb-1">
                                        <h3 className="font-bold text-lg text-slate-800">{notice.title}</h3>
                                        {!notice.active && <span className="bg-gray-200 text-gray-600 text-[10px] px-2 rounded-full uppercase font-bold">Inativo</span>}
                                        {notice.type === 'FIRST_ACCESS' && <span className="bg-blue-100 text-blue-600 text-[10px] px-2 rounded-full uppercase font-bold">Primeiro Acesso</span>}
                                    </div>
                                    <p className="text-gray-600 text-sm mb-2">{notice.content}</p>
                                    <div className="flex space-x-4 text-xs text-gray-400">
                                        <span>Página: {notice.targetRoutes.length > 0 ? notice.targetRoutes.join(', ') : 'Global (Todas)'}</span>
                                        {notice.endDate && <span>Expira em: {new Date(notice.endDate).toLocaleDateString()}</span>}
                                    </div>
                                </div>
                                <div className="flex space-x-2">
                                     <button onClick={() => setEditingNotice(notice)} className="text-gray-400 hover-text-primary p-1"><Edit2 size={18}/></button>
                                     <button onClick={() => handleDeleteNotice(notice.id)} className="text-gray-400 hover:text-red-500 p-1"><Trash2 size={18}/></button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {editingNotice && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden animate-fade-in">
                             <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                <h3 className="font-bold text-lg text-gray-800">Editar Aviso</h3>
                                <button onClick={() => setEditingNotice(null)}><X size={20} className="text-gray-400 hover:text-gray-600"/></button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="flex items-center space-x-4">
                                    <label className="flex items-center space-x-2 cursor-pointer">
                                        <input type="checkbox" checked={editingNotice.active} onChange={e => setEditingNotice({...editingNotice, active: e.target.checked})} className="rounded text-green-600 focus:ring-green-500"/>
                                        <span className="text-sm font-bold text-gray-700">Ativo</span>
                                    </label>
                                    <Select value={editingNotice.type} onChange={e => setEditingNotice({...editingNotice, type: e.target.value as any})} className="w-40">
                                        <option value="GLOBAL">Global (Dashboard)</option>
                                        <option value="FIRST_ACCESS">Primeiro Acesso (Modal)</option>
                                    </Select>
                                </div>
                                <Input label="Título" value={editingNotice.title} onChange={(e) => setEditingNotice({...editingNotice, title: e.target.value})} />
                                <Textarea label="Conteúdo" rows={4} value={editingNotice.content} onChange={(e) => setEditingNotice({...editingNotice, content: e.target.value})} />
                                <Select label="Exibir na Página" value={editingNotice.targetRoutes[0] || ''} onChange={(e) => setEditingNotice({...editingNotice, targetRoutes: e.target.value ? [e.target.value] : []})}>
                                    <option value="">Todas (Global)</option>
                                    <option value="dashboard">Dashboard</option>
                                    <option value="tickets">Chamados</option>
                                    <option value="reports">Relatórios</option>
                                    <option value="designs">Designs</option>
                                    <option value="brand-manual">Manual da Marca</option>
                                </Select>
                                <div className="grid grid-cols-2 gap-4">
                                    <Input label="Data Início" type="date" value={editingNotice.startDate || ''} onChange={(e) => setEditingNotice({...editingNotice, startDate: e.target.value})} />
                                    <Input label="Data Fim" type="date" value={editingNotice.endDate || ''} onChange={(e) => setEditingNotice({...editingNotice, endDate: e.target.value})} />
                                </div>
                            </div>
                             <div className="p-4 border-t border-gray-100 flex justify-end bg-gray-50">
                                <Button onClick={handleSaveNotice}>Salvar Aviso</Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        )}

      </div>
    </div>
  );
};