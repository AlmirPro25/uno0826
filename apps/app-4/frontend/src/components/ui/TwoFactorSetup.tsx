import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Smartphone, Key, Check, Copy, AlertTriangle } from 'lucide-react';
import { Button } from './shadcn/Button';
import { Input } from './shadcn/Input';
import { Modal } from './Modal';
import { useToast } from './Toast';

interface TwoFactorSetupProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export function TwoFactorSetup({ isOpen, onClose, onComplete }: TwoFactorSetupProps) {
  const [step, setStep] = useState(1);
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const toast = useToast();

  // Mock QR code and secret (in production, this would come from the backend)
  const mockSecret = 'JBSWY3DPEHPK3PXP';
  const mockQRCode = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=otpauth://totp/MediSync:user@example.com?secret=${mockSecret}&issuer=MediSync`;

  const handleVerify = async () => {
    setIsVerifying(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mock verification (in production, verify with backend)
    if (verificationCode.length === 6) {
      // Generate backup codes
      const codes = Array.from({ length: 8 }, () => 
        Math.random().toString(36).substring(2, 6).toUpperCase() + '-' + 
        Math.random().toString(36).substring(2, 6).toUpperCase()
      );
      setBackupCodes(codes);
      setStep(3);
      toast.success('2FA ativado com sucesso!');
    } else {
      toast.error('Código inválido. Tente novamente.');
    }
    
    setIsVerifying(false);
  };

  const copySecret = () => {
    navigator.clipboard.writeText(mockSecret);
    toast.success('Chave copiada!');
  };

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'));
    toast.success('Códigos de backup copiados!');
  };

  const handleComplete = () => {
    onComplete();
    onClose();
    setStep(1);
    setVerificationCode('');
    setBackupCodes([]);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Configurar Autenticação de Dois Fatores" size="md">
      <div className="space-y-6">
        {/* Progress Steps */}
        <div className="flex items-center justify-center space-x-4">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= s 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
              }`}>
                {step > s ? <Check className="w-4 h-4" /> : s}
              </div>
              {s < 3 && (
                <div className={`w-12 h-1 mx-2 ${
                  step > s ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
                }`} />
              )}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Introduction */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Proteja sua conta
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  A autenticação de dois fatores adiciona uma camada extra de segurança à sua conta.
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
                <div className="flex items-start space-x-3">
                  <Smartphone className="w-5 h-5 text-primary-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Aplicativo Autenticador</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Use Google Authenticator, Authy ou similar
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Key className="w-5 h-5 text-primary-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Códigos de Backup</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Códigos de emergência caso perca o celular
                    </p>
                  </div>
                </div>
              </div>

              <Button onClick={() => setStep(2)} className="w-full">
                Começar Configuração
              </Button>
            </motion.div>
          )}

          {/* Step 2: QR Code and Verification */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="text-center">
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Escaneie o QR code com seu aplicativo autenticador
                </p>
                <div className="bg-white p-4 rounded-lg inline-block">
                  <img src={mockQRCode} alt="QR Code" className="w-48 h-48" />
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Ou insira a chave manualmente:
                </p>
                <div className="flex items-center space-x-2">
                  <code className="flex-1 bg-white dark:bg-gray-900 px-3 py-2 rounded text-sm font-mono">
                    {mockSecret}
                  </code>
                  <Button variant="outline" size="sm" onClick={copySecret}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Digite o código de 6 dígitos
                </label>
                <Input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="text-center text-2xl tracking-widest"
                  maxLength={6}
                />
              </div>

              <div className="flex space-x-3">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  Voltar
                </Button>
                <Button 
                  onClick={handleVerify} 
                  disabled={verificationCode.length !== 6 || isVerifying}
                  className="flex-1"
                >
                  {isVerifying ? 'Verificando...' : 'Verificar'}
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Backup Codes */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  2FA Ativado!
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  Guarde seus códigos de backup em um local seguro
                </p>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    Estes códigos só serão mostrados uma vez. Guarde-os em um local seguro!
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Códigos de Backup
                  </span>
                  <Button variant="outline" size="sm" onClick={copyBackupCodes}>
                    <Copy className="w-4 h-4 mr-1" />
                    Copiar
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {backupCodes.map((code, index) => (
                    <code 
                      key={index}
                      className="bg-white dark:bg-gray-900 px-3 py-2 rounded text-sm font-mono text-center"
                    >
                      {code}
                    </code>
                  ))}
                </div>
              </div>

              <Button onClick={handleComplete} className="w-full">
                Concluir
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Modal>
  );
}

// Component to disable 2FA
interface TwoFactorDisableProps {
  isOpen: boolean;
  onClose: () => void;
  onDisable: () => void;
}

export function TwoFactorDisable({ isOpen, onClose, onDisable }: TwoFactorDisableProps) {
  const [password, setPassword] = useState('');
  const [isDisabling, setIsDisabling] = useState(false);
  const toast = useToast();

  const handleDisable = async () => {
    if (!password) {
      toast.error('Digite sua senha');
      return;
    }

    setIsDisabling(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast.success('2FA desativado');
    onDisable();
    onClose();
    setPassword('');
    setIsDisabling(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Desativar 2FA" size="sm">
      <div className="space-y-4">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
            <p className="text-sm text-red-800 dark:text-red-200">
              Desativar a autenticação de dois fatores tornará sua conta menos segura.
            </p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Confirme sua senha
          </label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Digite sua senha"
          />
        </div>

        <div className="flex space-x-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDisable}
            disabled={!password || isDisabling}
            className="flex-1"
          >
            {isDisabling ? 'Desativando...' : 'Desativar 2FA'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
