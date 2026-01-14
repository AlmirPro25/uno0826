import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/shadcn/Card';
import { Button } from '@/components/ui/shadcn/Button';
import { Label } from '@/components/ui/shadcn/Label';
import { Settings, Bell, Eye, Accessibility, Shield, RotateCcw, Check } from 'lucide-react';
import { usePreferences } from '@/hooks/usePreferences';

export default function SettingsPage() {
    const { preferences, updatePreference, resetToDefaults } = usePreferences();
    const [saved, setSaved] = useState(false);

    const handleSave = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const ToggleSwitch = ({ 
        checked, 
        onChange, 
        label, 
        description 
    }: { 
        checked: boolean; 
        onChange: (checked: boolean) => void; 
        label: string; 
        description?: string;
    }) => (
        <div className="flex items-center justify-between py-3">
            <div className="space-y-0.5">
                <Label className="text-base">{label}</Label>
                {description && <p className="text-sm text-muted-foreground">{description}</p>}
            </div>
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                onClick={() => onChange(!checked)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    checked ? 'bg-primary' : 'bg-muted'
                }`}
            >
                <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        checked ? 'translate-x-6' : 'translate-x-1'
                    }`}
                />
            </button>
        </div>
    );

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <Settings className="w-8 h-8 text-primary" />
                    Configurações
                </h1>
                <p className="text-muted-foreground mt-2">
                    Personalize sua experiência no MediSync
                </p>
            </div>

            {/* Notificações */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Bell className="w-5 h-5" />
                            Notificações
                        </CardTitle>
                        <CardDescription>
                            Configure como você deseja receber notificações
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-1 divide-y">
                        <ToggleSwitch
                            checked={preferences.emailNotifications}
                            onChange={(v) => updatePreference('emailNotifications', v)}
                            label="Notificações por email"
                            description="Receba atualizações importantes por email"
                        />
                        <ToggleSwitch
                            checked={preferences.pushNotifications}
                            onChange={(v) => updatePreference('pushNotifications', v)}
                            label="Notificações push"
                            description="Receba notificações no navegador"
                        />
                        <ToggleSwitch
                            checked={preferences.appointmentReminders}
                            onChange={(v) => updatePreference('appointmentReminders', v)}
                            label="Lembretes de consulta"
                            description="Receba lembretes antes das suas consultas"
                        />
                        <ToggleSwitch
                            checked={preferences.marketingEmails}
                            onChange={(v) => updatePreference('marketingEmails', v)}
                            label="Emails promocionais"
                            description="Receba novidades e ofertas especiais"
                        />
                    </CardContent>
                </Card>
            </motion.div>

            {/* Interface */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Eye className="w-5 h-5" />
                            Interface
                        </CardTitle>
                        <CardDescription>
                            Personalize a aparência do sistema
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-1 divide-y">
                        <ToggleSwitch
                            checked={preferences.compactMode}
                            onChange={(v) => updatePreference('compactMode', v)}
                            label="Modo compacto"
                            description="Reduz o espaçamento para mostrar mais conteúdo"
                        />
                        <ToggleSwitch
                            checked={preferences.animationsEnabled}
                            onChange={(v) => updatePreference('animationsEnabled', v)}
                            label="Animações"
                            description="Habilita animações e transições suaves"
                        />
                    </CardContent>
                </Card>
            </motion.div>

            {/* Acessibilidade */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Accessibility className="w-5 h-5" />
                            Acessibilidade
                        </CardTitle>
                        <CardDescription>
                            Opções para melhorar a acessibilidade
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <ToggleSwitch
                            checked={preferences.highContrast}
                            onChange={(v) => updatePreference('highContrast', v)}
                            label="Alto contraste"
                            description="Aumenta o contraste das cores"
                        />
                        <ToggleSwitch
                            checked={preferences.reducedMotion}
                            onChange={(v) => updatePreference('reducedMotion', v)}
                            label="Reduzir movimento"
                            description="Minimiza animações e movimentos"
                        />
                        <div className="py-3">
                            <Label className="text-base">Tamanho da fonte</Label>
                            <p className="text-sm text-muted-foreground mb-3">
                                Ajuste o tamanho do texto
                            </p>
                            <div className="flex gap-2">
                                {(['small', 'medium', 'large'] as const).map((size) => (
                                    <Button
                                        key={size}
                                        variant={preferences.fontSize === size ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => updatePreference('fontSize', size)}
                                    >
                                        {size === 'small' ? 'Pequeno' : size === 'medium' ? 'Médio' : 'Grande'}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Privacidade */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
            >
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="w-5 h-5" />
                            Privacidade
                        </CardTitle>
                        <CardDescription>
                            Controle suas informações de privacidade
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-1 divide-y">
                        <ToggleSwitch
                            checked={preferences.showOnlineStatus}
                            onChange={(v) => updatePreference('showOnlineStatus', v)}
                            label="Mostrar status online"
                            description="Outros usuários podem ver quando você está online"
                        />
                        <ToggleSwitch
                            checked={preferences.shareActivityStatus}
                            onChange={(v) => updatePreference('shareActivityStatus', v)}
                            label="Compartilhar atividade"
                            description="Compartilhe sua atividade com médicos e equipe"
                        />
                    </CardContent>
                </Card>
            </motion.div>

            {/* Ações */}
            <div className="flex items-center justify-between pt-4">
                <Button variant="outline" onClick={resetToDefaults}>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Restaurar padrões
                </Button>
                <Button onClick={handleSave}>
                    {saved ? (
                        <>
                            <Check className="w-4 h-4 mr-2" />
                            Salvo!
                        </>
                    ) : (
                        'Salvar alterações'
                    )}
                </Button>
            </div>
        </div>
    );
}
