# 💰 Guia de Monetização por Anúncios

## Visão Geral

Este guia documenta o sistema de integração de anúncios do Micro SaaS Factory, permitindo que projetos gerados já venham com capacidade de monetização.

## Arquivos Criados

```
.kiro/steering/ad-monetization-supreme-master.md  # Manifesto completo (steering)
services/manifestos/AD_MONETIZATION_SUPREME_MANIFEST.ts  # Manifesto TypeScript
examples/ad-monetization-example.ts  # Exemplo de uso
```

## Plataformas Suportadas

| Plataforma | SDK Principal | Formatos |
|------------|---------------|----------|
| Android | AdMob | Banner, Interstitial, Rewarded, Native, App Open |
| iOS | AdMob | Banner, Interstitial, Rewarded, Native, App Open |
| React Native | react-native-google-mobile-ads | Banner, Interstitial, Rewarded, Native |
| Flutter | google_mobile_ads | Banner, Interstitial, Rewarded, Native |
| Unity | Unity Ads + AdMob | Banner, Interstitial, Rewarded |
| Web | AdSense / Prebid.js | Banner, Native, Video, In-Article |

## Formatos de Anúncio

### Mobile

| Formato | CPM Médio | Quando Usar |
|---------|-----------|-------------|
| Banner | $0.10-$3.00 | Sempre visível, rodapé |
| Interstitial | $2.00-$15.00 | Transições naturais |
| Rewarded | $5.00-$30.00 | Recompensas in-app |
| Native | $1.00-$8.00 | Feeds, cards |
| App Open | $3.00-$12.00 | Splash screen |

### Web

| Formato | CPM Médio | Quando Usar |
|---------|-----------|-------------|
| Leaderboard (728x90) | $0.50-$3.00 | Header |
| Medium Rectangle (300x250) | $1.00-$5.00 | Sidebar, in-content |
| Video | $5.00-$25.00 | Conteúdo de vídeo |
| Native | $1.00-$6.00 | Feed de conteúdo |

## 🚨 CRÍTICO: Google UMP é OBRIGATÓRIO!

> **SEM GOOGLE UMP = SEM ANÚNCIOS NA EUROPA!**

O Google UMP (User Messaging Platform) é **OBRIGATÓRIO** para qualquer app que use AdMob. Sem ele:

- ❌ AdMob **NÃO SERVE ANÚNCIOS** para usuários da UE
- ❌ Fill rate cai para **ZERO** em países europeus
- ❌ ~30% do tráfego global é **PERDIDO**

### Fluxo Obrigatório de Inicialização

```
1. App Inicia
      ↓
2. Solicitar ATT (iOS 14.5+)
      ↓
3. Solicitar Consentimento UMP
      ↓
4. Verificar canRequestAds
      ↓
5. SE canRequestAds === true:
      → Inicializar SDK de Ads
      → Carregar e exibir anúncios
   SENÃO:
      → Não mostrar anúncios
```

### Implementação Mínima

```typescript
// React Native - FLUXO CORRETO
import { AdsConsent } from 'react-native-google-mobile-ads';

async function initializeAds() {
  // 1. Solicitar consentimento PRIMEIRO
  const consentInfo = await AdsConsent.requestInfoUpdate();
  
  if (consentInfo.isConsentFormAvailable) {
    await AdsConsent.showForm();
  }
  
  // 2. SÓ inicializar SDK se pode mostrar ads
  if (consentInfo.canRequestAds) {
    await mobileAds().initialize();
    // Agora pode carregar ads
  }
}
```

### Checklist de Consentimento

- [ ] Google UMP implementado em TODAS as plataformas?
- [ ] Consentimento solicitado ANTES de inicializar SDK?
- [ ] `canRequestAds` verificado antes de carregar ads?
- [ ] ATT implementado para iOS 14.5+?
- [ ] Testado com usuário simulado da UE?

---

## Compliance Obrigatório

### GDPR (Europa)
- Implementar CMP (Consent Management Platform) - **USE GOOGLE UMP!**
- Suportar TCF 2.2
- Coletar consentimento ANTES de carregar ads

### iOS ATT (App Tracking Transparency)
- Mostrar prompt ATT antes de acessar IDFA
- Adicionar `NSUserTrackingUsageDescription` no Info.plist
- Adicionar SKAdNetwork IDs

### COPPA (Apps Infantis)
- Marcar como child-directed
- Sem ads personalizados
- Conteúdo apropriado (rating G)

## Quick Start

### 1. React Native

```bash
npm install react-native-google-mobile-ads
```

```json
// app.json
{
  "react-native-google-mobile-ads": {
    "android_app_id": "ca-app-pub-xxx~yyy",
    "ios_app_id": "ca-app-pub-xxx~yyy"
  }
}
```

### 2. Flutter

```yaml
# pubspec.yaml
dependencies:
  google_mobile_ads: ^5.0.0
```

### 3. Web (AdSense)

```html
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-xxx"
     crossorigin="anonymous"></script>
```

## Métricas Importantes

- **Fill Rate**: % de requests que resultam em ad (meta: >80%)
- **eCPM**: Receita por 1000 impressões
- **ARPDAU**: Receita média por usuário ativo diário
- **CTR**: Taxa de cliques (meta: 0.5-2%)

## Boas Práticas

✅ **Fazer:**
- Interstitial a cada 2-3 minutos
- Rewarded sempre opt-in
- Preload ads em background
- Testar com test ads primeiro

❌ **Não Fazer:**
- Ads no primeiro segundo do app
- Múltiplos interstitials seguidos
- Cliques acidentais por design
- Refresh de banner < 30 segundos

## Links Úteis

- [AdMob Docs](https://developers.google.com/admob)
- [AdSense Docs](https://support.google.com/adsense)
- [Prebid.js Docs](https://docs.prebid.org)
- [IAB TCF 2.2](https://iabeurope.eu/tcf-2-0/)
- [Apple SKAdNetwork](https://developer.apple.com/documentation/storekit/skadnetwork)
