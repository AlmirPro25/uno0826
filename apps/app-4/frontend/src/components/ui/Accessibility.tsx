import React, { useState, useEffect, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Accessibility, 
  Eye, 
  Type, 
  MousePointer2, 
  Volume2, 
  Sun, 
  Moon,
  ZoomIn,
  ZoomOut,
  Contrast,
  X
} from 'lucide-react';
import { Button } from './shadcn/Button';

// Accessibility Context
interface AccessibilitySettings {
  fontSize: 'normal' | 'large' | 'xlarge';
  highContrast: boolean;
  reducedMotion: boolean;
  focusHighlight: boolean;
  screenReaderMode: boolean;
}

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSetting: <K extends keyof AccessibilitySettings>(key: K, value: AccessibilitySettings[K]) => void;
  resetSettings: () => void;
}

const defaultSettings: AccessibilitySettings = {
  fontSize: 'normal',
  highContrast: false,
  reducedMotion: false,
  focusHighlight: false,
  screenReaderMode: false,
};

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('accessibility-settings');
      return saved ? JSON.parse(saved) : defaultSettings;
    }
    return defaultSettings;
  });

  useEffect(() => {
    localStorage.setItem('accessibility-settings', JSON.stringify(settings));
    
    // Apply settings to document
    const root = document.documentElement;
    
    // Font size
    root.style.fontSize = settings.fontSize === 'large' ? '18px' : 
                          settings.fontSize === 'xlarge' ? '20px' : '16px';
    
    // High contrast
    if (settings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    
    // Reduced motion
    if (settings.reducedMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }
    
    // Focus highlight
    if (settings.focusHighlight) {
      root.classList.add('focus-highlight');
    } else {
      root.classList.remove('focus-highlight');
    }
  }, [settings]);

  const updateSetting = <K extends keyof AccessibilitySettings>(
    key: K, 
    value: AccessibilitySettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
  };

  return (
    <AccessibilityContext.Provider value={{ settings, updateSetting, resetSettings }}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
}

// Accessibility Panel Component
interface AccessibilityPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AccessibilityPanel({ isOpen, onClose }: AccessibilityPanelProps) {
  const { settings, updateSetting, resetSettings } = useAccessibility();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />
          
          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-80 bg-background shadow-xl z-50 overflow-y-auto"
          >
            <div className="p-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2">
                  <Accessibility className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold">Acessibilidade</h2>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Settings */}
              <div className="space-y-6">
                {/* Font Size */}
                <div>
                  <label className="flex items-center space-x-2 text-sm font-medium mb-3">
                    <Type className="w-4 h-4" />
                    <span>Tamanho do Texto</span>
                  </label>
                  <div className="flex space-x-2">
                    {(['normal', 'large', 'xlarge'] as const).map((size) => (
                      <button
                        key={size}
                        onClick={() => updateSetting('fontSize', size)}
                        className={`flex-1 py-2 px-3 rounded-lg border-2 text-sm transition-colors ${
                          settings.fontSize === size
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                        }`}
                      >
                        {size === 'normal' ? 'A' : size === 'large' ? 'A+' : 'A++'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* High Contrast */}
                <ToggleSetting
                  icon={<Contrast className="w-4 h-4" />}
                  label="Alto Contraste"
                  description="Aumenta o contraste das cores"
                  checked={settings.highContrast}
                  onChange={(checked) => updateSetting('highContrast', checked)}
                />

                {/* Reduced Motion */}
                <ToggleSetting
                  icon={<MousePointer2 className="w-4 h-4" />}
                  label="Reduzir Animações"
                  description="Minimiza movimentos na tela"
                  checked={settings.reducedMotion}
                  onChange={(checked) => updateSetting('reducedMotion', checked)}
                />

                {/* Focus Highlight */}
                <ToggleSetting
                  icon={<Eye className="w-4 h-4" />}
                  label="Destaque de Foco"
                  description="Destaca elementos focados"
                  checked={settings.focusHighlight}
                  onChange={(checked) => updateSetting('focusHighlight', checked)}
                />

                {/* Screen Reader Mode */}
                <ToggleSetting
                  icon={<Volume2 className="w-4 h-4" />}
                  label="Modo Leitor de Tela"
                  description="Otimiza para leitores de tela"
                  checked={settings.screenReaderMode}
                  onChange={(checked) => updateSetting('screenReaderMode', checked)}
                />

                {/* Reset Button */}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={resetSettings}
                >
                  Restaurar Padrões
                </Button>
              </div>

              {/* Info */}
              <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  Estas configurações são salvas automaticamente e aplicadas em todas as páginas.
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Toggle Setting Component
interface ToggleSettingProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function ToggleSetting({ icon, label, description, checked, onChange }: ToggleSettingProps) {
  return (
    <div className="flex items-start justify-between">
      <div className="flex items-start space-x-3">
        <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
          {icon}
        </div>
        <div>
          <p className="font-medium text-sm">{label}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
        </div>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          checked ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

// Accessibility Button (floating)
export function AccessibilityButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 z-40 p-3 bg-primary text-white rounded-full shadow-lg hover:bg-primary/90 transition-colors"
        aria-label="Abrir configurações de acessibilidade"
      >
        <Accessibility className="w-5 h-5" />
      </button>
      
      <AccessibilityPanel isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}

// Skip to Content Link (for keyboard navigation)
export function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-lg"
    >
      Pular para o conteúdo principal
    </a>
  );
}

// Screen Reader Only Text
export function SrOnly({ children }: { children: React.ReactNode }) {
  return <span className="sr-only">{children}</span>;
}

// Live Region for announcements
export function LiveRegion({ message, priority = 'polite' }: { message: string; priority?: 'polite' | 'assertive' }) {
  return (
    <div
      role="status"
      aria-live={priority}
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  );
}
