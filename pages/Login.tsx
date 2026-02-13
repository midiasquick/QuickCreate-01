import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, User as UserIcon } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

// Helper to determine text color based on background luminance
const getContrastColor = (hexColor: string) => {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 128) ? '#1f2937' : '#ffffff'; // slate-800 or white
};

export const Login: React.FC = () => {
  const { login } = useAuth();
  const { config } = useApp();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');

  const contrastColor = getContrastColor(config.theme.primaryColor);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(identifier, password)) {
      setError('');
    } else {
      setError('Acesso negado. Usuário ou senha incorretos.');
    }
  };

  const handleForgotPassword = (e: React.MouseEvent) => {
      e.preventDefault();
      alert(`Uma solicitação de redefinição de senha foi enviada para o administrador do sistema.`);
  };

  const containerStyle: React.CSSProperties = config.theme.loginBackgroundType === 'IMAGE' 
    ? { 
        backgroundImage: `url(${config.theme.loginBackgroundContent})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }
    : {
        backgroundColor: config.theme.loginBackgroundContent
      };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4" style={containerStyle}>
      {/* Overlay if image to ensure text readability */}
      {config.theme.loginBackgroundType === 'IMAGE' && <div className="absolute inset-0 bg-black/40 z-0"></div>}
      
      <div 
        className="max-w-md w-full rounded-lg shadow-xl overflow-hidden relative z-10"
        style={{ backgroundColor: config.theme.loginCardBackgroundColor }}
      >
        <div 
          className="p-8 text-center"
          style={{ backgroundColor: config.theme.primaryColor, color: contrastColor }}
        >
            {config.logoUrl.includes('placeholder') ? (
                 <h1 className="text-3xl font-bold tracking-tighter" style={{ color: contrastColor }}>pwork<span style={{ color: contrastColor, opacity: 0.5 }}>.</span></h1>
            ) : (
                <img src={config.logoUrl} alt="Logo" className="h-12 mx-auto object-contain bg-white/10 rounded p-1" />
            )}
          <p className="mt-2" style={{ color: contrastColor, opacity: 0.8 }}>Acesso Restrito à Plataforma</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded text-sm text-center">
              {error}
            </div>
          )}

          <Input 
            label="Usuário" 
            icon={UserIcon} 
            value={identifier} 
            onChange={(e) => setIdentifier(e.target.value)} 
            placeholder="Ex: demoadmin"
            required 
          />
          
          <Input 
            label="Senha" 
            type="password" 
            icon={Lock} 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            placeholder="••••"
            required 
          />

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 focus:ring-offset-0"
                style={{ accentColor: config.theme.primaryColor }}
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900 cursor-pointer">
                Me manter logado
              </label>
            </div>

            <div className="text-sm">
              <a 
                href="#" 
                onClick={handleForgotPassword} 
                className="font-medium hover:opacity-80 transition"
                style={{ color: config.theme.primaryColor }}
              >
                Esqueci a minha senha
              </a>
            </div>
          </div>

          <Button type="submit" className="w-full" style={{ backgroundColor: config.theme.primaryColor, color: contrastColor }}>
            Entrar
          </Button>
        </form>

        <div className="bg-gray-50 px-8 py-4 text-center border-t border-gray-100">
          <p className="text-xs text-gray-500 mb-1">Credenciais de Demonstração:</p>
          <div className="flex justify-center space-x-4 text-xs">
             <div><span className="font-bold text-slate-700">Admin:</span> demoadmin / demo</div>
             <div><span className="font-bold text-slate-700">User:</span> demouser / demo</div>
          </div>
        </div>
      </div>
    </div>
  );
};