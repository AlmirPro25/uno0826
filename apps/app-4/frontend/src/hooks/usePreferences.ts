import { useLocalStorage } from './useLocalStorage';

export interface UserPreferences {
    // Notificações
    emailNotifications: boolean;
    pushNotifications: boolean;
    appointmentReminders: boolean;
    marketingEmails: boolean;
    
    // Interface
    compactMode: boolean;
    animationsEnabled: boolean;
    
    // Acessibilidade
    highContrast: boolean;
    reducedMotion: boolean;
    fontSize: 'small' | 'medium' | 'large';
    
    // Privacidade
    showOnlineStatus: boolean;
    shareActivityStatus: boolean;
}

const defaultPreferences: UserPreferences = {
    emailNotifications: true,
    pushNotifications: true,
    appointmentReminders: true,
    marketingEmails: false,
    compactMode: false,
    animationsEnabled: true,
    highContrast: false,
    reducedMotion: false,
    fontSize: 'medium',
    showOnlineStatus: true,
    shareActivityStatus: true,
};

export function usePreferences() {
    const [preferences, setPreferences, resetPreferences] = useLocalStorage<UserPreferences>(
        'user-preferences',
        defaultPreferences
    );

    const updatePreference = <K extends keyof UserPreferences>(
        key: K,
        value: UserPreferences[K]
    ) => {
        setPreferences(prev => ({ ...prev, [key]: value }));
    };

    const resetToDefaults = () => {
        resetPreferences();
    };

    return {
        preferences,
        updatePreference,
        setPreferences,
        resetToDefaults,
        defaultPreferences,
    };
}
