'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sidebar } from '@/components/layout/Sidebar';
import { useAuthStore } from '@/stores/useAuthStore';
import { 
  Settings, User, Globe, Bell, Palette, Shield,
  Save, LogOut, Moon, Sun, Monitor
} from 'lucide-react';

export default function SettingsPage() {
  const { user, logout } = useAuthStore();
  const [superDomain, setSuperDomain] = useState('sce.local');
  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>('dark');
  const [notifications, setNotifications] = useState({
    deploySuccess: true,
    deployFailed: true,
    systemAlerts: true,
  });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Settings className="w-8 h-8 text-cyan-400" />
            Configurações
          </h1>
          <p className="text-slate-400 mt-1">Personalize sua experiência no SCE</p>
        </div>

        <div className="max-w-3xl space-y-6">
          {/* Profile Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-2xl p-6"
          >
            <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
              <User className="w-5 h-5 text-cyan-400" />
              Perfil
            </h3>

            <div className="flex items-center gap-6 mb-6">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-2xl font-bold text-black">
                {user?.email?.charAt(0).toUpperCase() || 'A'}
              </div>
              <div>
                <p className="font-bold text-lg">{user?.email || 'admin@sce.local'}</p>
                <p className="text-sm text-slate-400">Role: {user?.role || 'ADMIN'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Email</label>
                <input
                  type="email"
                  value={user?.email || 'admin@sce.local'}
                  disabled
                  className="input-field opacity-50 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Role</label>
                <input
                  type="text"
                  value={user?.role || 'ADMIN'}
                  disabled
                  className="input-field opacity-50 cursor-not-allowed"
                />
              </div>
            </div>
          </motion.div>

          {/* Domain Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card rounded-2xl p-6"
          >
            <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
              <Globe className="w-5 h-5 text-cyan-400" />
              Domínio
            </h3>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Super Domínio
              </label>
              <input
                type="text"
                value={superDomain}
                onChange={(e) => setSuperDomain(e.target.value)}
                placeholder="seudominio.com"
                className="input-field"
              />
              <p className="text-xs text-slate-500 mt-2">
                Todas as aplicações serão acessíveis via subdomínios deste domínio.
                Ex: app1.{superDomain}, app2.{superDomain}
              </p>
            </div>
          </motion.div>

          {/* Theme Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card rounded-2xl p-6"
          >
            <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
              <Palette className="w-5 h-5 text-cyan-400" />
              Aparência
            </h3>

            <div className="flex gap-3">
              {[
                { id: 'dark', icon: Moon, label: 'Escuro' },
                { id: 'light', icon: Sun, label: 'Claro' },
                { id: 'system', icon: Monitor, label: 'Sistema' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id as any)}
                  className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                    theme === t.id 
                      ? 'border-cyan-400 bg-cyan-400/5' 
                      : 'border-slate-800 hover:border-slate-600'
                  }`}
                >
                  <t.icon className={`w-6 h-6 mx-auto mb-2 ${
                    theme === t.id ? 'text-cyan-400' : 'text-slate-500'
                  }`} />
                  <p className={`text-sm font-medium ${
                    theme === t.id ? 'text-cyan-400' : 'text-slate-400'
                  }`}>{t.label}</p>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Notifications Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card rounded-2xl p-6"
          >
            <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
              <Bell className="w-5 h-5 text-cyan-400" />
              Notificações
            </h3>

            <div className="space-y-4">
              {[
                { key: 'deploySuccess', label: 'Deploy concluído com sucesso' },
                { key: 'deployFailed', label: 'Falha no deploy' },
                { key: 'systemAlerts', label: 'Alertas do sistema' },
              ].map((item) => (
                <label key={item.key} className="flex items-center justify-between p-3 bg-slate-950 rounded-lg cursor-pointer">
                  <span className="text-slate-300">{item.label}</span>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={notifications[item.key as keyof typeof notifications]}
                      onChange={(e) => setNotifications({
                        ...notifications,
                        [item.key]: e.target.checked
                      })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-700 rounded-full peer peer-checked:bg-cyan-400 transition-colors" />
                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5" />
                  </div>
                </label>
              ))}
            </div>
          </motion.div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-6">
            <button
              onClick={handleLogout}
              className="btn-danger flex items-center gap-2"
            >
              <LogOut className="w-5 h-5" />
              Sair da Conta
            </button>

            <button
              onClick={handleSave}
              className="btn-primary flex items-center gap-2"
            >
              {saved ? (
                <>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                  >
                    ✓
                  </motion.div>
                  Salvo!
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Salvar Alterações
                </>
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
