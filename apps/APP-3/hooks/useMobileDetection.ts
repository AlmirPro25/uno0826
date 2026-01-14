// hooks/useMobileDetection.ts
import { useState, useEffect } from 'react';

export interface MobileState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  orientation: 'portrait' | 'landscape';
  screenSize: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  touchDevice: boolean;
}

export const useMobileDetection = (): MobileState => {
  const [mobileState, setMobileState] = useState<MobileState>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    orientation: 'landscape',
    screenSize: 'lg',
    touchDevice: false,
  });

  useEffect(() => {
    const updateMobileState = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      // Detectar tamanho da tela
      let screenSize: MobileState['screenSize'] = 'lg';
      if (width < 640) screenSize = 'xs';
      else if (width < 768) screenSize = 'sm';
      else if (width < 1024) screenSize = 'md';
      else if (width < 1280) screenSize = 'lg';
      else if (width < 1536) screenSize = 'xl';
      else screenSize = '2xl';

      // Detectar tipo de dispositivo
      const isMobile = width < 768;
      const isTablet = width >= 768 && width < 1024;
      const isDesktop = width >= 1024;

      // Detectar orientação
      const orientation = width > height ? 'landscape' : 'portrait';

      // Detectar touch device
      const touchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

      setMobileState({
        isMobile,
        isTablet,
        isDesktop,
        orientation,
        screenSize,
        touchDevice,
      });
    };

    // Executar na inicialização
    updateMobileState();

    // Escutar mudanças de tamanho e orientação
    window.addEventListener('resize', updateMobileState);
    window.addEventListener('orientationchange', updateMobileState);

    return () => {
      window.removeEventListener('resize', updateMobileState);
      window.removeEventListener('orientationchange', updateMobileState);
    };
  }, []);

  return mobileState;
};

// Hook para detectar se está em modo mobile
export const useIsMobile = (): boolean => {
  const { isMobile } = useMobileDetection();
  return isMobile;
};

// Hook para detectar orientação
export const useOrientation = (): 'portrait' | 'landscape' => {
  const { orientation } = useMobileDetection();
  return orientation;
};