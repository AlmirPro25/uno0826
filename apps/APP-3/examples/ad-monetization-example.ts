/**
 * 💰 Exemplo de Integração de Anúncios
 * 
 * Este arquivo demonstra como usar o AD_MONETIZATION_SUPREME_MANIFEST
 * para gerar código de integração de anúncios automaticamente.
 * 
 * ⚠️ IMPORTANTE: Google UMP (User Messaging Platform) é OBRIGATÓRIO!
 * Sem UMP, o AdMob NÃO serve anúncios na Europa (GDPR).
 * 
 * FLUXO CORRETO:
 * 1. Solicitar ATT (iOS 14.5+)
 * 2. Solicitar consentimento UMP (GDPR)
 * 3. Verificar canRequestAds
 * 4. SÓ ENTÃO inicializar SDK de ads
 * 5. Carregar e exibir anúncios
 */

import { AD_MONETIZATION_SUPREME_MANIFEST, AdConfig } from '../services/manifestos/AD_MONETIZATION_SUPREME_MANIFEST';

// ============================================
// CONFIGURAÇÃO DO PROJETO
// ============================================

const projectConfig: AdConfig = {
  platform: 'react-native',
  appId: 'ca-app-pub-XXXXXXXX~YYYYYYYY',
  adUnits: {
    banner: 'ca-app-pub-XXXXXXXX/banner-id',
    interstitial: 'ca-app-pub-XXXXXXXX/interstitial-id',
    rewarded: 'ca-app-pub-XXXXXXXX/rewarded-id',
  },
  testMode: true, // Usar test ads em desenvolvimento
  compliance: {
    gdpr: true,   // App disponível na Europa
    ccpa: true,   // App disponível na Califórnia
    coppa: false, // Não é app infantil
    att: true,    // iOS requer ATT
  },
  mediation: {
    enabled: true,
    networks: ['meta', 'unity', 'applovin'],
  },
  behavior: {
    interstitialCooldown: 120, // 2 minutos entre interstitials
    bannerRefreshRate: 60,     // Refresh a cada 60 segundos
    preloadAds: true,          // Precarregar ads
  },
};

// ============================================
// GERADOR DE CÓDIGO
// ============================================

class AdCodeGenerator {
  private config: AdConfig;
  private manifest = AD_MONETIZATION_SUPREME_MANIFEST;

  constructor(config: AdConfig) {
    this.config = config;
  }

  /**
   * Gera o serviço de anúncios para React Native
   */
  generateReactNativeAdService(): string {
    const testIds = this.manifest.adNetworks.tier1.admob.testIds;
    
    return `
// AdService.ts - Serviço de Anúncios para React Native
import mobileAds, {
  BannerAd,
  BannerAdSize,
  InterstitialAd,
  RewardedAd,
  AdEventType,
  RewardedAdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';

const AD_UNITS = {
  banner: __DEV__ ? '${testIds.banner}' : '${this.config.adUnits.banner}',
  interstitial: __DEV__ ? '${testIds.interstitial}' : '${this.config.adUnits.interstitial}',
  rewarded: __DEV__ ? '${testIds.rewarded}' : '${this.config.adUnits.rewarded}',
};

const INTERSTITIAL_COOLDOWN = ${this.config.behavior.interstitialCooldown} * 1000; // ms

class AdService {
  private interstitial: InterstitialAd | null = null;
  private rewarded: RewardedAd | null = null;
  private lastInterstitialTime = 0;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    await mobileAds().initialize();
    this.isInitialized = true;
    
    ${this.config.behavior.preloadAds ? `
    // Preload ads
    this.loadInterstitial();
    this.loadRewarded();
    ` : ''}
    
    console.log('[AdService] Initialized');
  }

  // ========== INTERSTITIAL ==========
  
  loadInterstitial(): void {
    this.interstitial = InterstitialAd.createForAdRequest(AD_UNITS.interstitial);
    
    this.interstitial.addAdEventListener(AdEventType.LOADED, () => {
      console.log('[AdService] Interstitial loaded');
    });
    
    this.interstitial.addAdEventListener(AdEventType.ERROR, (error) => {
      console.error('[AdService] Interstitial error:', error);
    });
    
    this.interstitial.addAdEventListener(AdEventType.CLOSED, () => {
      this.loadInterstitial(); // Preload next
    });
    
    this.interstitial.load();
  }

  async showInterstitial(): Promise<boolean> {
    const now = Date.now();
    
    // Verificar cooldown
    if (now - this.lastInterstitialTime < INTERSTITIAL_COOLDOWN) {
      console.log('[AdService] Interstitial cooldown active');
      return false;
    }
    
    if (!this.interstitial?.loaded) {
      console.log('[AdService] Interstitial not loaded');
      return false;
    }
    
    await this.interstitial.show();
    this.lastInterstitialTime = now;
    return true;
  }

  // ========== REWARDED ==========
  
  loadRewarded(): void {
    this.rewarded = RewardedAd.createForAdRequest(AD_UNITS.rewarded);
    
    this.rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
      console.log('[AdService] Rewarded loaded');
    });
    
    this.rewarded.addAdEventListener(AdEventType.ERROR, (error) => {
      console.error('[AdService] Rewarded error:', error);
    });
    
    this.rewarded.addAdEventListener(AdEventType.CLOSED, () => {
      this.loadRewarded(); // Preload next
    });
    
    this.rewarded.load();
  }

  async showRewarded(): Promise<{ type: string; amount: number } | null> {
    return new Promise((resolve) => {
      if (!this.rewarded?.loaded) {
        console.log('[AdService] Rewarded not loaded');
        resolve(null);
        return;
      }
      
      this.rewarded.addAdEventListener(
        RewardedAdEventType.EARNED_REWARD,
        (reward) => {
          console.log('[AdService] Reward earned:', reward);
          resolve(reward);
        }
      );
      
      this.rewarded.show();
    });
  }

  // ========== UTILS ==========
  
  isRewardedReady(): boolean {
    return this.rewarded?.loaded ?? false;
  }

  isInterstitialReady(): boolean {
    return this.interstitial?.loaded ?? false;
  }
}

export const adService = new AdService();
export { AD_UNITS, BannerAd, BannerAdSize };
`;
  }


  /**
   * Gera componente de Banner para React Native
   */
  generateBannerComponent(): string {
    return `
// AdBanner.tsx - Componente de Banner
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { AD_UNITS } from './AdService';

interface AdBannerProps {
  size?: 'BANNER' | 'LARGE_BANNER' | 'MEDIUM_RECTANGLE' | 'ADAPTIVE';
  position?: 'top' | 'bottom';
}

export const AdBanner: React.FC<AdBannerProps> = ({ 
  size = 'ADAPTIVE',
  position = 'bottom' 
}) => {
  const adSize = size === 'ADAPTIVE' 
    ? BannerAdSize.ANCHORED_ADAPTIVE_BANNER 
    : BannerAdSize[size];

  return (
    <View style={[styles.container, position === 'top' ? styles.top : styles.bottom]}>
      <BannerAd
        unitId={AD_UNITS.banner}
        size={adSize}
        requestOptions={{
          requestNonPersonalizedAdsOnly: false,
        }}
        onAdLoaded={() => console.log('[AdBanner] Loaded')}
        onAdFailedToLoad={(error) => console.error('[AdBanner] Failed:', error)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  top: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  bottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
});
`;
  }

  /**
   * Gera serviço de consentimento (GDPR/ATT)
   */
  generateConsentService(): string {
    return `
// ConsentService.ts - Gerenciamento de Consentimento
import { Platform } from 'react-native';
import mobileAds, { AdsConsent, AdsConsentStatus } from 'react-native-google-mobile-ads';

class ConsentService {
  private consentStatus: AdsConsentStatus | null = null;

  /**
   * Solicita consentimento do usuário (GDPR)
   */
  async requestConsent(): Promise<boolean> {
    try {
      // Verificar status atual
      const consentInfo = await AdsConsent.requestInfoUpdate();
      
      // Se precisa de consentimento, mostrar formulário
      if (consentInfo.isConsentFormAvailable && 
          consentInfo.status === AdsConsentStatus.REQUIRED) {
        const result = await AdsConsent.showForm();
        this.consentStatus = result.status;
      } else {
        this.consentStatus = consentInfo.status;
      }
      
      console.log('[ConsentService] Status:', this.consentStatus);
      return this.canRequestAds();
    } catch (error) {
      console.error('[ConsentService] Error:', error);
      return true; // Fallback: permitir ads
    }
  }

  /**
   * Verifica se pode solicitar anúncios
   */
  canRequestAds(): boolean {
    return this.consentStatus !== AdsConsentStatus.REQUIRED;
  }

  /**
   * Solicita permissão ATT (iOS 14.5+)
   */
  async requestATT(): Promise<boolean> {
    if (Platform.OS !== 'ios') return true;
    
    try {
      const { requestTrackingPermission } = await import('react-native-tracking-transparency');
      const status = await requestTrackingPermission();
      
      console.log('[ConsentService] ATT Status:', status);
      return status === 'authorized';
    } catch (error) {
      console.error('[ConsentService] ATT Error:', error);
      return false;
    }
  }

  /**
   * Fluxo completo de consentimento
   */
  async initializeConsent(): Promise<void> {
    // 1. ATT primeiro (iOS)
    if (Platform.OS === 'ios') {
      await this.requestATT();
    }
    
    // 2. GDPR/CMP
    await this.requestConsent();
  }
}

export const consentService = new ConsentService();
`;
  }

  /**
   * Gera configuração do app.json para React Native
   */
  generateAppJson(): string {
    return `
// app.json - Configuração do React Native
{
  "expo": {
    "name": "MyApp",
    "slug": "my-app",
    "plugins": [
      [
        "react-native-google-mobile-ads",
        {
          "androidAppId": "${this.config.appId}",
          "iosAppId": "${this.config.appId}"
        }
      ]
    ]
  },
  "react-native-google-mobile-ads": {
    "android_app_id": "${this.config.appId}",
    "ios_app_id": "${this.config.appId}"
  }
}
`;
  }

  /**
   * Gera todos os arquivos necessários
   */
  generateAll(): Record<string, string> {
    return {
      'src/services/AdService.ts': this.generateReactNativeAdService(),
      'src/components/AdBanner.tsx': this.generateBannerComponent(),
      'src/services/ConsentService.ts': this.generateConsentService(),
      'app.json': this.generateAppJson(),
    };
  }
}

// ============================================
// EXEMPLO DE USO
// ============================================

async function main() {
  console.log('='.repeat(60));
  console.log('💰 AD MONETIZATION CODE GENERATOR');
  console.log('='.repeat(60));
  
  const generator = new AdCodeGenerator(projectConfig);
  const files = generator.generateAll();
  
  console.log('\n📁 Arquivos gerados:');
  for (const [filename, content] of Object.entries(files)) {
    console.log(`\n--- ${filename} ---`);
    console.log(content.substring(0, 500) + '...');
  }
  
  console.log('\n✅ Código de integração de anúncios gerado com sucesso!');
  
  console.log('\n' + '='.repeat(60));
  console.log('🚨 FLUXO OBRIGATÓRIO DE INICIALIZAÇÃO');
  console.log('='.repeat(60));
  console.log(`
// App.tsx - Inicialização CORRETA com consentimento

import { useEffect, useState } from 'react';
import { consentService } from './services/ConsentService';
import { adService } from './services/AdService';

function App() {
  const [adsReady, setAdsReady] = useState(false);

  useEffect(() => {
    async function initializeAds() {
      // 1. PRIMEIRO: Solicitar consentimento (UMP + ATT)
      await consentService.initializeConsent();
      
      // 2. VERIFICAR se pode carregar ads
      if (consentService.canRequestAds()) {
        // 3. SÓ ENTÃO inicializar SDK
        await adService.initialize();
        setAdsReady(true);
      } else {
        console.log('Usuário não consentiu - não mostrar ads');
      }
    }
    
    initializeAds();
  }, []);

  return (
    <View>
      {/* Conteúdo do app */}
      
      {/* Banner SÓ aparece se ads estão prontos */}
      {adsReady && <AdBanner position="bottom" />}
    </View>
  );
}
`);
  
  console.log('\n📋 Próximos passos:');
  console.log('1. Criar conta no AdMob: https://admob.google.com');
  console.log('2. Criar app e ad units no console');
  console.log('3. Configurar mensagem de consentimento no AdMob (GDPR)');
  console.log('4. Substituir IDs de teste pelos IDs reais');
  console.log('5. Testar com usuário simulado da UE');
  console.log('6. Publicar e monitorar métricas');
  
  console.log('\n⚠️  CHECKLIST DE CONSENTIMENTO:');
  console.log('[ ] Google UMP implementado?');
  console.log('[ ] ATT implementado (iOS)?');
  console.log('[ ] Consentimento solicitado ANTES de inicializar SDK?');
  console.log('[ ] canRequestAds verificado antes de carregar ads?');
  console.log('[ ] Testado com usuário da UE?');
}

main().catch(console.error);

export { AdCodeGenerator, projectConfig };
