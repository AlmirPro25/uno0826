'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/shadcn/Card';
import { Button } from '@/components/ui/shadcn/Button';
import { Input } from '@/components/ui/shadcn/Input';
import { Label } from '@/components/ui/shadcn/Label';
import { Alert, AlertDescription } from '@/components/ui/shadcn/Alert';
import { useAuthStore } from '@/hooks/useAuthStore';
import { usersAPI } from '@/api/users';
import { authAPI } from '@/api/auth';
import { User, Save, Mail, Phone, Shield, Calendar, CheckCircle, Loader2, Stethoscope, Trash2, LogOut, Lock, Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/router';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ProfilePage() {
  const { user, login, token, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    specialty: '',
    crm: '',
  });

  useEffect(() => {
    // Wait for auth to be ready
    const checkAuth = async () => {
      // Small delay to ensure Zustand has hydrated
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Check localStorage directly as backup
      let userId = user?.id;
      if (!userId) {
        try {
          const storage = localStorage.getItem('auth-storage');
          if (storage) {
            const parsed = JSON.parse(storage);
            const state = parsed.state || parsed;
            userId = state.user?.id;
          }
        } catch (e) {
          // ignore
        }
      }

      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        const userData = await usersAPI.getUser(userId);
        setFormData({
          fullName: userData.fullName || '',
          email: userData.email || '',
          phone: userData.phone || '',
          specialty: userData.specialty || '',
          crm: userData.crm || '',
        });
      } catch (err) {
        console.error('Error loading profile:', err);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, [user?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      const updatedUser = await usersAPI.updateUser(user!.id, {
        fullName: formData.fullName,
        phone: formData.phone,
        // specialty and crm only for doctors
        ...(user?.role === 'MEDICO' && {
          specialty: formData.specialty,
          crm: formData.crm,
        }),
      });
      
      // Update local state
      if (token && updatedUser) {
        login(token, { ...user!, ...updatedUser });
      }
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao atualizar perfil');
    } finally {
      setSaving(false);
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'Administrador';
      case 'MEDICO': return 'Médico';
      case 'PACIENTE': return 'Paciente';
      default: return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'MEDICO': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'PACIENTE': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <User className="w-8 h-8 text-primary" />
            Meu Perfil
          </h1>
          <p className="text-muted-foreground mt-2">
            Gerencie suas informações pessoais
          </p>
        </div>


        {/* Success Message */}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Alert className="border-green-500 bg-green-500/10">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-600 dark:text-green-400">
                Perfil atualizado com sucesso!
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        {/* Error Message */}
        {error && (
          <Alert className="border-destructive bg-destructive/10">
            <AlertDescription className="text-destructive">{error}</AlertDescription>
          </Alert>
        )}

        {/* Profile Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <CardTitle>{formData.fullName || 'Usuário'}</CardTitle>
                  <CardDescription>{formData.email}</CardDescription>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(user?.role || '')}`}>
                {getRoleLabel(user?.role || '')}
              </span>
            </div>
          </CardHeader>
        </Card>

        {/* Edit Form */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Pessoais</CardTitle>
            <CardDescription>Atualize seus dados cadastrais</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nome Completo</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="pl-10"
                      placeholder="Seu nome completo"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      disabled
                      className="pl-10 bg-muted"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">O email não pode ser alterado</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="pl-10"
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                </div>

                {user?.role === 'MEDICO' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="specialty">Especialidade</Label>
                      <div className="relative">
                        <Stethoscope className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="specialty"
                          value={formData.specialty}
                          onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                          className="pl-10"
                          placeholder="Ex: Cardiologia"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="crm">CRM</Label>
                      <div className="relative">
                        <Shield className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="crm"
                          value={formData.crm}
                          onChange={(e) => setFormData({ ...formData, crm: e.target.value })}
                          className="pl-10"
                          placeholder="CRM/SP 123456"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Salvar Alterações
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Account Info */}
        <Card>
          <CardHeader>
            <CardTitle>Informações da Conta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">Tipo de Conta</span>
              </div>
              <span className="text-sm font-medium">{getRoleLabel(user?.role || '')}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">Status</span>
              </div>
              <span className="text-sm font-medium text-green-600">Ativo</span>
            </div>
          </CardContent>
        </Card>

        {/* Security Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Segurança
            </CardTitle>
            <CardDescription>
              Gerencie sua senha e sessões ativas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <ChangePasswordSection />
            <div className="border-t pt-4">
              <LogoutAllDevicesSection />
            </div>
          </CardContent>
        </Card>

        {/* LGPD - Data Export */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Seus Dados (LGPD)
            </CardTitle>
            <CardDescription>
              Conforme a Lei Geral de Proteção de Dados, você tem direito de acessar e exportar seus dados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ExportDataSection />
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-200 dark:border-red-900">
          <CardHeader>
            <CardTitle className="text-red-600">Zona de Perigo</CardTitle>
            <CardDescription>Ações irreversíveis para sua conta</CardDescription>
          </CardHeader>
          <CardContent>
            <DeleteAccountSection />
          </CardContent>
        </Card>
      </div>
  );
}

function ChangePasswordSection() {
  const [showForm, setShowForm] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [logoutAll, setLogoutAll] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }
    if (newPassword.length < 6) {
      setError('A nova senha deve ter pelo menos 6 caracteres');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await authAPI.changePassword(currentPassword, newPassword, logoutAll);
      setSuccess(true);
      setShowForm(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao alterar senha');
    } finally {
      setSaving(false);
    }
  };

  if (!showForm) {
    return (
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">Alterar senha</p>
          <p className="text-sm text-muted-foreground">
            Atualize sua senha regularmente para maior segurança
          </p>
        </div>
        <Button variant="outline" onClick={() => setShowForm(true)}>
          <Lock className="w-4 h-4 mr-2" />
          Alterar Senha
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {success && (
        <Alert className="border-green-500 bg-green-500/10">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <AlertDescription className="text-green-600 dark:text-green-400">
            Senha alterada com sucesso!
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="currentPassword">Senha atual</Label>
        <div className="relative">
          <Input
            id="currentPassword"
            type={showCurrentPassword ? 'text' : 'password'}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Digite sua senha atual"
          />
          <button
            type="button"
            className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
          >
            {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="newPassword">Nova senha</Label>
        <div className="relative">
          <Input
            id="newPassword"
            type={showNewPassword ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Digite a nova senha"
          />
          <button
            type="button"
            className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
            onClick={() => setShowNewPassword(!showNewPassword)}
          >
            {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
        <Input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirme a nova senha"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="logoutAll"
          checked={logoutAll}
          onChange={(e) => setLogoutAll(e.target.checked)}
          className="rounded border-gray-300"
        />
        <Label htmlFor="logoutAll" className="text-sm font-normal cursor-pointer">
          Desconectar de todos os dispositivos após alterar
        </Label>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <Button variant="outline" onClick={() => {
          setShowForm(false);
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
          setError('');
        }}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Salvar Nova Senha
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

function LogoutAllDevicesSection() {
  const { logout } = useAuthStore();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleLogoutAll = async () => {
    setLoading(true);
    try {
      await authAPI.logoutAllDevices();
      logout();
      router.push('/auth/login?loggedOutAll=true');
    } catch (err) {
      console.error('Error logging out from all devices:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!showConfirm) {
    return (
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">Sair de todos os dispositivos</p>
          <p className="text-sm text-muted-foreground">
            Encerra todas as sessões ativas em outros dispositivos
          </p>
        </div>
        <Button variant="outline" onClick={() => setShowConfirm(true)}>
          <LogOut className="w-4 h-4 mr-2" />
          Sair de Todos
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Alert className="border-yellow-500 bg-yellow-500/10">
        <AlertDescription className="text-yellow-600 dark:text-yellow-400">
          Isso irá desconectar você de todos os dispositivos, incluindo este. Você precisará fazer login novamente.
        </AlertDescription>
      </Alert>

      <div className="flex gap-2">
        <Button variant="outline" onClick={() => setShowConfirm(false)}>
          Cancelar
        </Button>
        <Button variant="destructive" onClick={handleLogoutAll} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saindo...
            </>
          ) : (
            <>
              <LogOut className="w-4 h-4 mr-2" />
              Confirmar
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

function ExportDataSection() {
  const { user } = useAuthStore();
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      // Collect all user data
      const userData = await usersAPI.getUser(user!.id);
      
      // Create export object
      const exportData = {
        exportDate: new Date().toISOString(),
        userData: {
          id: userData.id,
          fullName: userData.fullName,
          email: userData.email,
          phone: userData.phone,
          role: userData.role,
          specialty: userData.specialty,
          crm: userData.crm,
        },
        lgpdInfo: {
          dataController: "MediSync Telemedicina LTDA",
          purpose: "Prestação de serviços de telemedicina",
          legalBasis: "Execução de contrato e tutela da saúde",
          retentionPeriod: "Dados de saúde: 20 anos (conforme legislação)",
          contact: "dpo@medisync.com.br",
        },
      };

      // Download as JSON
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `medisync-meus-dados-${format(new Date(), 'yyyy-MM-dd')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting data:', err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="font-medium">Exportar meus dados</p>
        <p className="text-sm text-muted-foreground">
          Baixe uma cópia de todos os seus dados pessoais
        </p>
      </div>
      <Button variant="outline" onClick={handleExport} disabled={exporting}>
        {exporting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Exportando...
          </>
        ) : (
          <>
            <Save className="w-4 h-4 mr-2" />
            Exportar Dados
          </>
        )}
      </Button>
    </div>
  );
}

function DeleteAccountSection() {
  const { logout } = useAuthStore();
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [password, setPassword] = useState('');
  const [reason, setReason] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    if (!password) {
      setError('Digite sua senha para confirmar');
      return;
    }

    setDeleting(true);
    setError('');

    try {
      await usersAPI.deleteMyAccount(password, reason);
      logout();
      router.push('/auth/login?deleted=true');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao deletar conta');
    } finally {
      setDeleting(false);
    }
  };

  if (!showConfirm) {
    return (
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">Deletar minha conta</p>
          <p className="text-sm text-muted-foreground">
            Esta ação é permanente e não pode ser desfeita
          </p>
        </div>
        <Button
          variant="outline"
          className="text-red-600 border-red-600 hover:bg-red-50 dark:hover:bg-red-950"
          onClick={() => setShowConfirm(true)}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Deletar Conta
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Alert className="border-red-500 bg-red-500/10">
        <AlertDescription className="text-red-600 dark:text-red-400">
          <strong>Atenção!</strong> Ao deletar sua conta, todos os seus dados serão permanentemente removidos.
          Esta ação não pode ser desfeita.
        </AlertDescription>
      </Alert>

      <div className="space-y-2">
        <Label htmlFor="deletePassword">Digite sua senha para confirmar</Label>
        <Input
          id="deletePassword"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Sua senha atual"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="deleteReason">Motivo (opcional)</Label>
        <Input
          id="deleteReason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Por que está saindo?"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={() => {
            setShowConfirm(false);
            setPassword('');
            setReason('');
            setError('');
          }}
        >
          Cancelar
        </Button>
        <Button
          variant="destructive"
          onClick={handleDelete}
          disabled={deleting}
        >
          {deleting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Deletando...
            </>
          ) : (
            <>
              <Trash2 className="w-4 h-4 mr-2" />
              Confirmar Exclusão
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
