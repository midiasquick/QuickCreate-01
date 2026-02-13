import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { Card } from '../components/ui/Card';
import { Edit2, Save, Lock } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Button } from '../components/ui/Button';

export const Profile: React.FC = () => {
  const { currentUser } = useAuth();
  const { updateUser, config } = useApp();
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    jobTitle: currentUser?.jobTitle || '',
    location: currentUser?.location || '',
    birthDate: currentUser?.birthDate || '',
    phoneNumber: currentUser?.phoneNumber || '',
    bio: currentUser?.bio || '',
    password: '',
    confirmPassword: ''
  });

  if (!currentUser) return null;

  const handleSave = () => {
    const { password, confirmPassword, ...profileData } = formData;
    if (password && password === confirmPassword) {
        alert('Senha atualizada com sucesso!');
    } else if (password !== confirmPassword) {
        alert('As senhas não coincidem!');
        return;
    }
    updateUser(currentUser.id, profileData);
    setIsEditing(false);
    setFormData(prev => ({...prev, password: '', confirmPassword: ''}));
  };

  const roleName = config.roles.find(r => r.id === currentUser.role)?.name || currentUser.role;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row gap-6">
        
        {/* Left Column - Details */}
        <div className="w-full md:w-1/3 space-y-6">
           <Card title="Detalhes do Perfil" className="h-full">
               <div className="space-y-6 py-2">
                   <div>
                       <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Função</label>
                       <div className="mt-1">
                          <span className="bg-slate-500 text-white px-3 py-1 rounded text-xs font-bold uppercase tracking-wide">
                              {roleName}
                          </span>
                       </div>
                   </div>

                   <div className="border-t border-gray-100 pt-4">
                       <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Membro Desde</label>
                       <p className="font-semibold text-slate-700 mt-1">{currentUser.memberSince || 'N/A'}</p>
                   </div>

                   <div className="border-t border-gray-100 pt-4">
                       <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Nome Completo</label>
                       {isEditing ? (
                           <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="mt-1" />
                       ) : (
                           <p className="font-bold text-slate-700 text-lg mt-1">{formData.name}</p>
                       )}
                   </div>

                   {isEditing && (
                       <div className="border-t border-orange-100 bg-orange-50/50 p-3 -mx-3 mt-4 rounded">
                           <div className="flex items-center space-x-2 text-orange-600 mb-2">
                               <Lock size={14} />
                               <span className="text-xs font-bold uppercase tracking-wide">Alterar Senha</span>
                           </div>
                           <div className="space-y-3">
                                <Input type="password" placeholder="Nova Senha" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                                <Input type="password" placeholder="Confirmar Senha" value={formData.confirmPassword} onChange={e => setFormData({...formData, confirmPassword: e.target.value})} />
                           </div>
                       </div>
                   )}

                   <div className="border-t border-gray-100 pt-4">
                       <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Cargo</label>
                       {isEditing ? (
                           <Input value={formData.jobTitle} onChange={e => setFormData({...formData, jobTitle: e.target.value})} className="mt-1" />
                       ) : (
                           <p className="font-bold text-slate-700 text-lg mt-1">{formData.jobTitle}</p>
                       )}
                   </div>

                   <div className="border-t border-gray-100 pt-4">
                       <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Localização</label>
                       {isEditing ? (
                           <Input value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="mt-1" />
                       ) : (
                           <p className="font-bold text-slate-700 text-lg mt-1">{formData.location}</p>
                       )}
                   </div>

                   <div className="border-t border-gray-100 pt-4">
                       <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Data de Nascimento</label>
                       {isEditing ? (
                           <Input value={formData.birthDate} onChange={e => setFormData({...formData, birthDate: e.target.value})} className="mt-1" />
                       ) : (
                           <p className="font-bold text-slate-700 text-lg mt-1">{formData.birthDate}</p>
                       )}
                   </div>

                   <div className="border-t border-gray-100 pt-4">
                       <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Telefone</label>
                       {isEditing ? (
                           <Input value={formData.phoneNumber} onChange={e => setFormData({...formData, phoneNumber: e.target.value})} className="mt-1" />
                       ) : (
                           <p className="font-bold text-indigo-600 text-lg mt-1">{formData.phoneNumber}</p>
                       )}
                   </div>
               </div>
           </Card>
        </div>

        {/* Right Column - Header & Bio */}
        <div className="w-full md:w-2/3 space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left space-y-4 sm:space-y-0 sm:space-x-6 relative">
                 <button 
                    onClick={() => isEditing ? handleSave() : setIsEditing(true)} 
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 text-gray-500 transition"
                    title={isEditing ? "Salvar" : "Editar"}
                 >
                     {isEditing ? <Save size={20} className="text-green-600" /> : <Edit2 size={20} />}
                 </button>

                 <div className="p-1 bg-white border border-gray-200 shadow-sm rounded">
                     <img src={currentUser.avatar} alt={currentUser.name} className="w-32 h-32 object-cover rounded" />
                 </div>
                 <div className="py-2">
                     <h1 className="text-3xl font-bold text-slate-800">{formData.name}</h1>
                     <p className="text-gray-500 italic mt-1 flex items-center justify-center sm:justify-start">
                         Online agora
                     </p>
                 </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-8">
                <h3 className="text-xl font-bold text-slate-800 border-b pb-4 mb-6">Biografia</h3>
                {isEditing ? (
                    <Textarea 
                        rows={6}
                        value={formData.bio}
                        onChange={e => setFormData({...formData, bio: e.target.value})}
                    />
                ) : (
                    <div className="text-gray-600 leading-relaxed whitespace-pre-line">
                        {formData.bio || "Nenhuma biografia fornecida."}
                    </div>
                )}
            </div>
        </div>

      </div>
    </div>
  );
};