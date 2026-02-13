import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, User as UserIcon } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

const getContrastColor = (hexColor: string) => {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return (((r * 299) + (g * 587) + (b * 114)) / 1000) >= 128 ? '#1f2937' : '#ffffff';
};

export const Login: React.FC = () => {
  const { login } = useAuth();
  const { config } = useApp();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    // Agora o login espera a resposta do Firebase
    const success = await login(identifier, password);
    
    if (!success) {
      setError('Acesso negado. Verifique usuário e senha.');
    }
    setIsLoading(false);
  };

  const contrastColor = getContrastColor(config.theme.primaryColor);

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4" 
         style={{ backgroundColor: config.theme.loginBackgroundContent }}>
      
      <div className="max-w-md w-full rounded-lg shadow-xl overflow-hidden relative z-10 bg-white">
        <div className="p-8 text-center" style={{ backgroundColor: config.theme.primaryColor, color: contrastColor }}>
            <h1 className="text-3xl font-bold tracking-tighter">pwork.</h1>
            <p className="mt-2 opacity-80">Acesso Restrito</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && <div className="bg-red-50 text-red-600 p-3 rounded text-sm text-center">{error}</div>}

          <Input label="E-mail" icon={UserIcon} value={identifier} onChange={(e) => setIdentifier(e.target.value)} required />
          <Input label="Senha" type="password" icon={Lock} value={password} onChange={(e) => setPassword(e.target.value)} required />

          <Button type="submit" className="w-full" disabled={isLoading} style={{ backgroundColor: config.theme.primaryColor, color: contrastColor }}>
            {isLoading ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>
      </div>
    </div>
  );
};