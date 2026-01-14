/**
 * 💰 AD MONETIZATION SUPREME MANIFEST
 * 
 * Manifesto completo para integração de anúncios em sites e aplicativos.
 * Suporta: Web, Android, iOS, React Native, Flutter, Unity
 * 
 * @author Micro SaaS Factory
 * @version 1.0.0
 */

export const AD_MONETIZATION_SUPREME_MANIFEST = {
  id: 'ad-monetization-supreme',
  name: 'Ad Monetization Supreme Master',
  version: '1.0.0',
  description: 'Especialista em monetização por anúncios para todas as plataformas',
  
  // Palavras-chave para ativação
  keywords: [
    'anúncios', 'ads', 'publicidade', 'advertising', 'monetização',
    'admob', 'adsense', 'ad manager', 'banner', 'interstitial',
    'rewarded', 'native ads', 'header bidding', 'prebid',
    'cpm', 'cpc', 'ctr', 'ecpm', 'fill rate', 'mediation',
    'unity ads', 'applovin', 'ironsource', 'meta audience network',
    'gdpr', 'ccpa', 'tcf', 'skadnetwork', 'att'
  ],

  // Plataformas suportadas
  platforms: {
    web: {
      frameworks: ['vanilla', 'react', 'vue', 'angular', 'nextjs', 'nuxt'],
      adNetworks: ['adsense', 'ad-manager', 'prebid'],
      formats: ['banner', 'native', 'video', 'interstitial-web']
    },
    android: {
      languages: ['kotlin', 'java'],
      frameworks: ['native', 'jetpack-compose'],
      adNetworks: ['admob', 'meta', 'unity', 'applovin', 'ironsource'],
      formats: ['banner', 'interstitial', 'rewarded', 'native', 'app-open']
    },
    ios: {
      languages: ['swift', 'objective-c'],
      frameworks: ['uikit', 'swiftui'],
      adNetworks: ['admob', 'meta', 'unity', 'applovin', 'ironsource'],
      formats: ['banner', 'interstitial', 'rewarded', 'native', 'app-open']
    },
    reactNative: {
      packages: ['react-native-google-mobile-ads'],
      adNetworks: ['admob', 'meta', 'unity'],
      formats: ['banner', 'interstitial', 'rewarded', 'native']
    },
    flutter: {
      packages: ['google_mobile_ads'],
      adNetworks: ['admob', 'meta', 'unity'],
      formats: ['banner', 'interstitial', 'rewarded', 'native']
    },
    unity: {
      packages: ['com.unity.ads', 'com.google.ads.mobile'],
      adNetworks: ['unity-ads', 'admob', 'ironsource', 'applovin'],
      formats: ['banner', 'interstitial', 'rewarded']
    }
  },


  // Formatos de anúncio
  adFormats: {
    banner: {
      description: 'Banner estático ou animado',
      sizes: {
        mobile: ['320x50', '300x250', '320x100'],
        tablet: ['728x90', '300x250'],
        web: ['728x90', '300x250', '160x600', '970x250']
      },
      avgCpm: { min: 0.10, max: 3.00 },
      intrusiveness: 'low',
      bestFor: ['always-visible', 'footer', 'between-content']
    },
    interstitial: {
      description: 'Anúncio de tela cheia',
      avgCpm: { min: 2.00, max: 15.00 },
      intrusiveness: 'high',
      bestFor: ['level-complete', 'natural-transitions', 'between-articles'],
      frequencyCap: { recommended: 120, min: 60, max: 300 } // segundos
    },
    rewarded: {
      description: 'Vídeo com recompensa para o usuário',
      avgCpm: { min: 5.00, max: 30.00 },
      intrusiveness: 'low', // opt-in
      bestFor: ['extra-lives', 'in-game-currency', 'premium-content'],
      userBenefit: 'required'
    },
    native: {
      description: 'Anúncio integrado ao design do app',
      avgCpm: { min: 1.00, max: 8.00 },
      intrusiveness: 'low',
      bestFor: ['feeds', 'content-lists', 'cards']
    },
    appOpen: {
      description: 'Anúncio na abertura do app',
      avgCpm: { min: 3.00, max: 12.00 },
      intrusiveness: 'medium',
      bestFor: ['app-launch', 'return-from-background']
    },
    video: {
      description: 'Vídeo in-stream ou out-stream',
      avgCpm: { min: 5.00, max: 25.00 },
      intrusiveness: 'high',
      bestFor: ['video-content', 'between-videos']
    }
  },

  // Redes de anúncios
  adNetworks: {
    tier1: {
      admob: {
        name: 'Google AdMob',
        platforms: ['android', 'ios', 'unity', 'flutter', 'react-native'],
        formats: ['banner', 'interstitial', 'rewarded', 'native', 'app-open'],
        sdk: {
          android: 'com.google.android.gms:play-services-ads:23.0.0',
          ios: "pod 'Google-Mobile-Ads-SDK', '~> 11.0'"
        },
        docs: 'https://developers.google.com/admob',
        testIds: {
          banner: 'ca-app-pub-3940256099942544/6300978111',
          interstitial: 'ca-app-pub-3940256099942544/1033173712',
          rewarded: 'ca-app-pub-3940256099942544/5224354917',
          native: 'ca-app-pub-3940256099942544/2247696110'
        }
      },
      adsense: {
        name: 'Google AdSense',
        platforms: ['web'],
        formats: ['banner', 'native', 'in-article', 'matched-content'],
        docs: 'https://support.google.com/adsense'
      },
      adManager: {
        name: 'Google Ad Manager',
        platforms: ['web', 'android', 'ios'],
        formats: ['all'],
        features: ['header-bidding', 'programmatic', 'direct-deals'],
        docs: 'https://support.google.com/admanager'
      }
    },
    tier2: {
      meta: {
        name: 'Meta Audience Network',
        platforms: ['android', 'ios', 'unity'],
        formats: ['banner', 'interstitial', 'rewarded', 'native'],
        mediationAdapter: 'com.google.ads.mediation:facebook:6.16.0.0'
      },
      applovin: {
        name: 'AppLovin MAX',
        platforms: ['android', 'ios', 'unity'],
        formats: ['banner', 'interstitial', 'rewarded', 'native'],
        features: ['in-app-bidding', 'mediation'],
        mediationAdapter: 'com.google.ads.mediation:applovin:12.4.2.0'
      },
      unity: {
        name: 'Unity Ads',
        platforms: ['android', 'ios', 'unity'],
        formats: ['banner', 'interstitial', 'rewarded'],
        mediationAdapter: 'com.google.ads.mediation:unity:4.10.0.0'
      },
      ironsource: {
        name: 'ironSource',
        platforms: ['android', 'ios', 'unity'],
        formats: ['banner', 'interstitial', 'rewarded', 'offerwall'],
        features: ['levelplay-mediation'],
        mediationAdapter: 'com.google.ads.mediation:ironsource:8.0.0.0'
      }
    },
    tier3: ['vungle', 'chartboost', 'inmobi', 'pangle', 'mintegral', 'adcolony', 'tapjoy']
  },


  // Compliance e privacidade
  compliance: {
    gdpr: {
      name: 'General Data Protection Regulation',
      regions: ['EU', 'EEA', 'UK'],
      requirements: [
        'CMP (Consent Management Platform)',
        'TCF 2.2 compliance',
        'Consent before tracking',
        'Data processing agreements'
      ],
      cmps: ['usercentrics', 'onetrust', 'cookiebot', 'quantcast', 'google-funding-choices'],
      docs: 'https://iabeurope.eu/tcf-2-0/'
    },
    ccpa: {
      name: 'California Consumer Privacy Act',
      regions: ['California', 'US'],
      requirements: [
        'Do Not Sell My Personal Information link',
        'Privacy policy',
        'Opt-out mechanism'
      ]
    },
    coppa: {
      name: "Children's Online Privacy Protection Act",
      requirements: [
        'No personalized ads for children',
        'No behavioral tracking',
        'Parental consent for data collection'
      ],
      adConfig: {
        tagForChildDirectedTreatment: true,
        maxAdContentRating: 'G'
      }
    },
    att: {
      name: 'App Tracking Transparency',
      platforms: ['ios'],
      iosVersion: '14.5+',
      requirements: [
        'ATT prompt before IDFA access',
        'NSUserTrackingUsageDescription in Info.plist',
        'Handle denied/authorized states'
      ],
      docs: 'https://developer.apple.com/documentation/apptrackingtransparency'
    },
    skadnetwork: {
      name: 'SKAdNetwork',
      platforms: ['ios'],
      requirements: [
        'SKAdNetworkIdentifier entries in Info.plist',
        'Support for attribution without IDFA'
      ],
      docs: 'https://developer.apple.com/documentation/storekit/skadnetwork'
    }
  },

  // Métricas e KPIs
  metrics: {
    volume: ['impressions', 'requests', 'clicks', 'views'],
    performance: ['fillRate', 'showRate', 'ctr', 'viewability'],
    revenue: ['revenue', 'cpm', 'ecpm', 'arpdau', 'arpu', 'ltv'],
    benchmarks: {
      fillRate: { good: 80, excellent: 95 },
      ctr: { good: 0.5, excellent: 2.0 },
      viewability: { good: 70, excellent: 90 }
    }
  },

  // Boas práticas
  bestPractices: {
    frequency: {
      interstitial: { minInterval: 60, recommended: 120 },
      bannerRefresh: { min: 30, recommended: 60 }
    },
    placement: {
      do: [
        'Show interstitials at natural breaks',
        'Place banners where they dont obstruct content',
        'Make rewarded ads clearly optional',
        'Preload ads in background',
        'Test with test ads before production'
      ],
      dont: [
        'Show ads immediately on app launch',
        'Place ads near interactive elements',
        'Force users to watch ads',
        'Show multiple interstitials in sequence',
        'Refresh banners too frequently'
      ]
    },
    ux: {
      showCloseButton: true,
      showCountdown: true,
      respectUserChoices: true,
      offerAdFreeOption: true
    }
  },


  // Templates de código por plataforma
  codeTemplates: {
    android: {
      dependencies: `
// build.gradle (app)
dependencies {
    implementation("com.google.android.gms:play-services-ads:23.0.0")
    // Mediation adapters (opcional)
    implementation("com.google.ads.mediation:facebook:6.16.0.0")
    implementation("com.google.ads.mediation:unity:4.10.0.0")
}`,
      manifest: `
<!-- AndroidManifest.xml -->
<manifest>
    <application>
        <meta-data
            android:name="com.google.android.gms.ads.APPLICATION_ID"
            android:value="ca-app-pub-XXXXXXXX~YYYYYYYY"/>
    </application>
</manifest>`,
      initialization: `
// MainActivity.kt
MobileAds.initialize(this) { initializationStatus ->
    // SDK initialized, load ads
    loadBannerAd()
    loadInterstitialAd()
    loadRewardedAd()
}`
    },
    ios: {
      podfile: `
# Podfile
pod 'Google-Mobile-Ads-SDK', '~> 11.0'
# Mediation adapters (opcional)
pod 'GoogleMobileAdsMediationFacebook'
pod 'GoogleMobileAdsMediationUnity'`,
      infoPlist: `
<!-- Info.plist -->
<key>GADApplicationIdentifier</key>
<string>ca-app-pub-XXXXXXXX~YYYYYYYY</string>
<key>NSUserTrackingUsageDescription</key>
<string>This identifier will be used to deliver personalized ads to you.</string>
<key>SKAdNetworkItems</key>
<array>
    <dict>
        <key>SKAdNetworkIdentifier</key>
        <string>cstr6suwn9.skadnetwork</string>
    </dict>
</array>`,
      initialization: `
// AppDelegate.swift
import GoogleMobileAds

func application(_ application: UIApplication,
                 didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
    GADMobileAds.sharedInstance().start(completionHandler: nil)
    return true
}`
    },
    web: {
      adsense: `
<!-- AdSense Script -->
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXX"
     crossorigin="anonymous"></script>

<!-- Ad Unit -->
<ins class="adsbygoogle"
     style="display:block"
     data-ad-client="ca-pub-XXXXXXXX"
     data-ad-slot="YYYYYYYY"
     data-ad-format="auto"
     data-full-width-responsive="true"></ins>
<script>(adsbygoogle = window.adsbygoogle || []).push({});</script>`,
      prebid: `
<!-- Prebid.js Header Bidding -->
<script async src="https://cdn.jsdelivr.net/npm/prebid.js@latest/dist/prebid.js"></script>
<script async src="https://securepubads.g.doubleclick.net/tag/js/gpt.js"></script>`
    },
    reactNative: {
      package: 'react-native-google-mobile-ads',
      appJson: `
{
  "react-native-google-mobile-ads": {
    "android_app_id": "ca-app-pub-XXXXXXXX~YYYYYYYY",
    "ios_app_id": "ca-app-pub-XXXXXXXX~YYYYYYYY"
  }
}`
    },
    flutter: {
      pubspec: `
dependencies:
  google_mobile_ads: ^5.0.0`
    },
    unity: {
      packages: `
// Package Manager
com.unity.ads (4.4.2+)
com.google.ads.mobile (9.0.0+)`
    }
  },

  // Arquiteturas de monetização
  architectures: {
    waterfall: {
      name: 'Waterfall Mediation',
      description: 'Redes são chamadas em sequência por eCPM histórico',
      pros: ['Simples de configurar', 'Previsível'],
      cons: ['Não otimiza em tempo real', 'Rede A sempre tem prioridade'],
      revenueImpact: 'baseline',
      recommendedFor: ['apps pequenos', 'início de monetização']
    },
    inAppBidding: {
      name: 'In-App Bidding (Real-Time)',
      description: 'Leilão simultâneo entre todas as redes',
      pros: ['Maior receita (+20-40%)', 'Competição justa', 'Otimização automática'],
      cons: ['Mais complexo', 'Requer SDKs compatíveis'],
      revenueImpact: '+20-40%',
      recommendedFor: ['apps médios/grandes', 'jogos', 'alta escala']
    },
    headerBidding: {
      name: 'Header Bidding (Web)',
      description: 'Prebid.js coleta bids antes de chamar ad server',
      pros: ['Maior receita (+30-50%)', 'Transparência', 'Controle'],
      cons: ['Latência adicional', 'Complexidade técnica'],
      revenueImpact: '+30-50%',
      recommendedFor: ['sites médios/grandes', 'publishers profissionais'],
      tools: ['prebid.js', 'prebid-server', 'google-ad-manager']
    },
    hybrid: {
      name: 'Hybrid (Bidding + Waterfall)',
      description: 'Combina bidding para redes compatíveis + waterfall para outras',
      pros: ['Melhor cobertura', 'Maximiza fill rate'],
      cons: ['Mais complexo de gerenciar'],
      revenueImpact: '+25-45%',
      recommendedFor: ['apps em escala', 'múltiplas redes']
    }
  },

  // Segmentação de usuários
  segmentation: {
    byUserType: {
      whale: {
        criteria: { iapRevenue: { min: 100 } },
        strategy: { showAds: false, reason: 'Não irritar usuários pagantes' }
      },
      engagedNonPayer: {
        criteria: { sessionsPerWeek: { min: 5 }, iapRevenue: { max: 0 } },
        strategy: { 
          interstitialFrequency: 90, 
          rewardedEnabled: true, 
          bannerEnabled: true,
          reason: 'Monetizar via ads já que não paga IAP'
        }
      },
      casual: {
        criteria: { sessionsPerWeek: { max: 2 } },
        strategy: { 
          interstitialFrequency: 180, 
          rewardedEnabled: true, 
          bannerEnabled: true,
          reason: 'Não assustar usuários casuais'
        }
      }
    },
    byCountry: {
      highLTV: {
        countries: ['US', 'UK', 'CA', 'AU', 'DE', 'JP', 'KR'],
        avgCpmMultiplier: 2.5,
        strategy: { 
          interstitialFrequency: 60, 
          premiumNetworksOnly: true,
          reason: 'Países com alto CPM - otimizar para receita'
        }
      },
      mediumLTV: {
        countries: ['FR', 'IT', 'ES', 'NL', 'SE', 'NO', 'DK'],
        avgCpmMultiplier: 1.5,
        strategy: { interstitialFrequency: 90 }
      },
      lowLTV: {
        countries: ['IN', 'BR', 'ID', 'PH', 'VN', 'MX', 'TH'],
        avgCpmMultiplier: 0.5,
        strategy: { 
          interstitialFrequency: 45, 
          allNetworks: true,
          reason: 'Países com baixo CPM - otimizar para volume'
        }
      }
    }
  },

  // A/B Testing para ads
  abTesting: {
    experiments: {
      interstitialFrequency: {
        name: 'Teste de frequência de interstitial',
        variants: [
          { id: 'control', weight: 50, config: { interstitialFrequency: 120 } },
          { id: 'aggressive', weight: 25, config: { interstitialFrequency: 60 } },
          { id: 'conservative', weight: 25, config: { interstitialFrequency: 180 } }
        ],
        metrics: ['arpdau', 'retention_d1', 'retention_d7', 'session_length'],
        duration: 14
      },
      bannerPosition: {
        name: 'Teste de posição do banner',
        variants: [
          { id: 'bottom', weight: 50, config: { bannerPosition: 'bottom' } },
          { id: 'top', weight: 50, config: { bannerPosition: 'top' } }
        ],
        metrics: ['banner_ctr', 'banner_revenue', 'user_complaints'],
        duration: 7
      },
      rewardedPlacement: {
        name: 'Teste de momentos para rewarded',
        variants: [
          { id: 'minimal', weight: 33, config: { placements: ['extra_life'] } },
          { id: 'moderate', weight: 34, config: { placements: ['extra_life', 'game_over'] } },
          { id: 'aggressive', weight: 33, config: { placements: ['extra_life', 'game_over', 'level_complete', 'daily_bonus'] } }
        ],
        metrics: ['rewarded_views', 'rewarded_revenue', 'retention_d7'],
        duration: 14
      }
    },
    analysisFormula: {
      revenueWeight: 0.6,
      retentionWeight: 0.4,
      minConfidence: 0.95
    }
  },

  // SKAdNetwork IDs completos
  skadnetworkIds: {
    google: ['cstr6suwn9.skadnetwork', '4fzdc2evr5.skadnetwork', '4pfyvq9l8r.skadnetwork', 'ydx93a7ass.skadnetwork'],
    meta: ['v9wttpbfk9.skadnetwork', 'n38lu8286q.skadnetwork'],
    unity: ['4dzt52r2t5.skadnetwork', 'bvpn9ufa9b.skadnetwork'],
    applovin: ['ludvb6z3bs.skadnetwork'],
    ironsource: ['su67r6k2v3.skadnetwork'],
    vungle: ['gta9lk7p23.skadnetwork'],
    chartboost: ['f38h382jlk.skadnetwork'],
    inmobi: ['wzmmz9fp6w.skadnetwork'],
    pangle: ['238telecom.skadnetwork', '22mmun2rn5.skadnetwork'],
    mintegral: ['kbd757ywx3.skadnetwork'],
    adcolony: ['4pfyvq9l8r.skadnetwork', 'yclnxrl5pm.skadnetwork'],
    tapjoy: ['ecpz2srf59.skadnetwork'],
    // Lista completa para copiar no Info.plist
    all: [
      'cstr6suwn9.skadnetwork', '4fzdc2evr5.skadnetwork', '4pfyvq9l8r.skadnetwork',
      'ydx93a7ass.skadnetwork', 'v9wttpbfk9.skadnetwork', 'n38lu8286q.skadnetwork',
      '4dzt52r2t5.skadnetwork', 'bvpn9ufa9b.skadnetwork', 'ludvb6z3bs.skadnetwork',
      'su67r6k2v3.skadnetwork', 'gta9lk7p23.skadnetwork', 'f38h382jlk.skadnetwork',
      'wzmmz9fp6w.skadnetwork', '238telecom.skadnetwork', '22mmun2rn5.skadnetwork',
      'kbd757ywx3.skadnetwork', 'yclnxrl5pm.skadnetwork', 'ecpz2srf59.skadnetwork',
      '5lm9lj6jb7.skadnetwork', '7ug5zh24hu.skadnetwork', '9rd848q2bz.skadnetwork',
      'c6k4g5qg8m.skadnetwork', 'cg4yq2srnc.skadnetwork', 'f73kdq92p3.skadnetwork',
      'ggvn48r87g.skadnetwork', 'klf5c3l5u5.skadnetwork', 'p78axxw29g.skadnetwork',
      'ppxm28t8ap.skadnetwork', 'prcb7njmu6.skadnetwork', 't38b2kh725.skadnetwork',
      'uw77j35x4d.skadnetwork', 'v72qych5uu.skadnetwork', 'wg4vff78zm.skadnetwork',
      'y45688jllp.skadnetwork', 'zmvfpc5aq8.skadnetwork', '2u9pt9hc89.skadnetwork',
      '3rd42ekr43.skadnetwork', '3sh42y64q3.skadnetwork', '424m5254lk.skadnetwork',
      '44jx6755aq.skadnetwork', '44n7hlldy6.skadnetwork', '488r3q3dtq.skadnetwork',
      '4468km3ulz.skadnetwork', '5a6flpkh64.skadnetwork', '578prtvx9j.skadnetwork'
    ]
  },

  // Mediation Adapters com versões
  mediationAdapters: {
    android: {
      meta: 'com.google.ads.mediation:facebook:6.16.0.0',
      applovin: 'com.google.ads.mediation:applovin:12.4.2.0',
      unity: 'com.google.ads.mediation:unity:4.10.0.0',
      vungle: 'com.google.ads.mediation:vungle:7.3.0.0',
      ironsource: 'com.google.ads.mediation:ironsource:8.0.0.0',
      pangle: 'com.google.ads.mediation:pangle:5.9.0.6.0',
      chartboost: 'com.google.ads.mediation:chartboost:9.6.1.0',
      inmobi: 'com.google.ads.mediation:inmobi:10.6.7.0',
      mintegral: 'com.google.ads.mediation:mintegral:16.6.71.0',
      adcolony: 'com.google.ads.mediation:adcolony:4.8.0.2'
    },
    ios: {
      meta: 'GoogleMobileAdsMediationFacebook (~> 6.14.0)',
      applovin: 'GoogleMobileAdsMediationAppLovin (~> 12.4.0)',
      unity: 'GoogleMobileAdsMediationUnity (~> 4.10.0)',
      vungle: 'GoogleMobileAdsMediationVungle (~> 7.3.0)',
      ironsource: 'GoogleMobileAdsMediationIronSource (~> 8.0.0)',
      pangle: 'GoogleMobileAdsMediationPangle (~> 5.9.0)',
      chartboost: 'GoogleMobileAdsMediationChartboost (~> 9.6.0)',
      inmobi: 'GoogleMobileAdsMediationInMobi (~> 10.6.0)'
    }
  },

  // Violações de política comuns
  policyViolations: {
    common: [
      {
        violation: 'Invalid click activity',
        description: 'Cliques acidentais ou incentivados',
        prevention: ['Não colocar ads perto de botões', 'Não incentivar cliques', 'Usar frequency cap'],
        severity: 'high',
        consequence: 'Account suspension'
      },
      {
        violation: 'Ad placement policy',
        description: 'Ads cobrindo conteúdo ou em posições proibidas',
        prevention: ['Não sobrepor conteúdo', 'Manter distância de elementos interativos'],
        severity: 'medium',
        consequence: 'Ad serving disabled'
      },
      {
        violation: 'Content policy',
        description: 'Conteúdo adulto, violento ou ilegal',
        prevention: ['Revisar guidelines', 'Moderar conteúdo UGC'],
        severity: 'high',
        consequence: 'Account termination'
      },
      {
        violation: 'Traffic quality',
        description: 'Tráfego de bots ou fontes suspeitas',
        prevention: ['Monitorar fontes de tráfego', 'Usar analytics', 'Bloquear IPs suspeitos'],
        severity: 'high',
        consequence: 'Revenue clawback + suspension'
      },
      {
        violation: 'Interstitial timing',
        description: 'Interstitial imediatamente ao abrir app ou em sequência',
        prevention: ['Esperar interação do usuário', 'Respeitar cooldown'],
        severity: 'medium',
        consequence: 'Ad serving limited'
      }
    ],
    googleSpecific: [
      'Ads in background',
      'Ads that auto-redirect',
      'Ads that mimic system UI',
      'Multiple ad units stacked'
    ],
    appleSpecific: [
      'Tracking without ATT consent',
      'Collecting IDFA without disclosure',
      'Ads in apps for children without COPPA compliance'
    ]
  },

  // Estratégias de otimização de receita
  revenueOptimization: {
    strategies: [
      {
        name: 'Floor Price Optimization',
        description: 'Ajustar preços mínimos por país/formato',
        implementation: 'Usar dados históricos para definir floors que maximizam receita sem perder fill',
        impact: '+10-20% eCPM'
      },
      {
        name: 'Waterfall Optimization',
        description: 'Reordenar redes baseado em performance real',
        implementation: 'Analisar eCPM por rede/país semanalmente e ajustar ordem',
        impact: '+5-15% receita'
      },
      {
        name: 'Format Mix Optimization',
        description: 'Balancear formatos para maximizar receita sem prejudicar UX',
        implementation: 'A/B testar proporção de rewarded vs interstitial',
        impact: '+15-30% ARPDAU'
      },
      {
        name: 'Refresh Rate Tuning',
        description: 'Otimizar taxa de refresh de banners',
        implementation: 'Testar 30s vs 45s vs 60s, monitorar viewability',
        impact: '+5-10% banner revenue'
      },
      {
        name: 'Geo-Targeting',
        description: 'Estratégias diferentes por região',
        implementation: 'Mais ads em países de baixo CPM, menos em alto CPM',
        impact: '+10-25% global revenue'
      }
    ],
    kpiTargets: {
      fillRate: { target: 95, minimum: 80 },
      ecpm: { target: 'varies by format/country' },
      arpdau: { casual: 0.05, midcore: 0.15, hardcore: 0.30 },
      adRevenueShare: { healthy: '30-50% of total revenue' }
    }
  },

  // Troubleshooting
  troubleshooting: {
    lowFillRate: {
      symptoms: ['Fill rate < 50%', 'Many no-fill responses'],
      causes: [
        'Poucas redes configuradas',
        'Região com baixa demanda',
        'Ad units mal configurados',
        'App não aprovado nas redes'
      ],
      solutions: [
        'Adicionar mais redes via mediation',
        'Configurar waterfall com fallbacks',
        'Verificar status de aprovação em cada rede',
        'Usar bidding para aumentar competição',
        'Verificar se ad unit IDs estão corretos'
      ]
    },
    lowCpm: {
      symptoms: ['eCPM muito abaixo do benchmark', 'Receita baixa apesar de impressões'],
      causes: [
        'Região com baixo valor (ex: Índia, Brasil)',
        'Formato de baixo valor (banner)',
        'Baixa viewability',
        'Conteúdo não premium'
      ],
      solutions: [
        'Adicionar formatos de alto valor (rewarded)',
        'Melhorar posicionamento de ads',
        'Segmentar estratégia por país',
        'Usar floor prices',
        'Melhorar viewability (lazy loading)'
      ]
    },
    adsNotLoading: {
      symptoms: ['Ads nunca aparecem', 'Erros de load'],
      causes: [
        'SDK não inicializado',
        'App ID incorreto',
        'Sem conexão de internet',
        'Ad unit não existe',
        'Conta suspensa'
      ],
      solutions: [
        'Verificar logs de erro detalhados',
        'Confirmar IDs no console da rede',
        'Testar com test ads primeiro',
        'Verificar status da conta',
        'Verificar se SDK está inicializado antes de carregar ads'
      ]
    },
    accountSuspended: {
      symptoms: ['Conta banida', 'Ads não servem mais'],
      causes: [
        'Cliques inválidos',
        'Conteúdo proibido',
        'Violação de políticas',
        'Tráfego inválido'
      ],
      solutions: [
        'Apelar com evidências',
        'Revisar políticas detalhadamente',
        'Implementar proteção contra cliques inválidos',
        'Usar redes alternativas enquanto resolve',
        'Contratar consultoria especializada'
      ]
    },
    lowRetention: {
      symptoms: ['Retenção caiu após implementar ads', 'Usuários reclamando'],
      causes: [
        'Ads muito frequentes',
        'Interstitials em momentos ruins',
        'Ads bloqueando conteúdo',
        'UX ruim'
      ],
      solutions: [
        'Reduzir frequência de interstitials',
        'Mostrar ads apenas em transições naturais',
        'A/B testar configurações',
        'Priorizar rewarded sobre interstitial',
        'Oferecer versão premium sem ads'
      ]
    },
    debugTips: {
      android: 'Filtrar Logcat por "Ads" ou "AdMob"',
      ios: 'Usar GADMobileAds.sharedInstance().requestConfiguration.testDeviceIdentifiers',
      reactNative: 'import { setTestDeviceIDAsync } from "react-native-google-mobile-ads"',
      flutter: 'MobileAds.instance.updateRequestConfiguration(RequestConfiguration(testDeviceIds: [...]))',
      web: 'Console do browser + Google Publisher Console'
    }
  },

  // Checklist de implementação
  implementationChecklist: {
    setup: [
      'Create ad network account (AdMob, etc)',
      'Create app in ad network console',
      'Create ad units for each format',
      'Add SDK dependencies',
      'Configure app ID in manifest/plist',
      'Initialize SDK on app start'
    ],
    compliance: [
      'Implement CMP for GDPR (if targeting EU)',
      'Add ATT prompt (iOS)',
      'Add SKAdNetwork IDs (iOS)',
      'Configure COPPA if child-directed',
      'Add privacy policy'
    ],
    implementation: [
      'Implement banner ads',
      'Implement interstitial ads with frequency cap',
      'Implement rewarded ads (if applicable)',
      'Implement native ads (if applicable)',
      'Add preloading logic',
      'Handle ad events (load, show, click, error)'
    ],
    testing: [
      'Test with test ad IDs',
      'Test all ad formats',
      'Test consent flow',
      'Test on multiple devices',
      'Verify no policy violations'
    ],
    analytics: [
      'Track ad impressions',
      'Track ad revenue',
      'Monitor fill rate',
      'Monitor eCPM by country',
      'Set up alerts for anomalies'
    ]
  }
};

// Tipos TypeScript
export interface AdConfig {
  platform: 'android' | 'ios' | 'web' | 'react-native' | 'flutter' | 'unity';
  appId: string;
  adUnits: {
    banner?: string;
    interstitial?: string;
    rewarded?: string;
    native?: string;
    appOpen?: string;
  };
  testMode: boolean;
  compliance: {
    gdpr: boolean;
    ccpa: boolean;
    coppa: boolean;
    att: boolean;
  };
  mediation?: {
    enabled: boolean;
    networks: string[];
  };
  behavior: {
    interstitialCooldown: number;
    bannerRefreshRate: number;
    preloadAds: boolean;
  };
}

export interface AdMetrics {
  impressions: number;
  requests: number;
  clicks: number;
  fillRate: number;
  ctr: number;
  revenue: number;
  ecpm: number;
  arpdau: number;
}

export interface UserSegment {
  id: string;
  criteria: Record<string, { min?: number; max?: number }>;
  adStrategy: {
    showAds: boolean;
    interstitialFrequency?: number;
    rewardedEnabled?: boolean;
    bannerEnabled?: boolean;
    reason?: string;
  };
}

export interface ABTestVariant {
  id: string;
  weight: number;
  config: Record<string, unknown>;
}

export interface ABTestExperiment {
  name: string;
  variants: ABTestVariant[];
  metrics: string[];
  duration: number;
}

// ============================================
// FUNÇÕES HELPER PARA GERAÇÃO DE CÓDIGO v3
// ============================================
// Correções aplicadas:
// 1. Google UMP (User Messaging Platform) integrado - OBRIGATÓRIO para EU
// 2. ConsentService passa status para SDK (personalized/non-personalized)
// 3. Ad Request Options Builder para consistência
// 4. Mediation real que usa o array de networks
// 5. Fallback/try-catch para show() failures
// 6. Listener cleanup para evitar memory leaks
// 7. app.json com NSUserTrackingUsageDescription para iOS
// 8. Preload respeitando consentimento (só carrega após consent)
// 9. ATT (App Tracking Transparency) integrado para iOS
// ============================================r cleanup para evitar memory leaks
// 6. app.json com NSUserTrackingUsageDescription para iOS
// 7. Preload respeitando consentimento (só carrega após consent)
// ============================================

/**
 * Gera a lista de SKAdNetwork IDs para Info.plist
 */
export function generateSkadnetworkPlist(networks: string[] = ['all']): string {
  const manifest = AD_MONETIZATION_SUPREME_MANIFEST;
  let ids: string[] = [];
  
  if (networks.includes('all')) {
    ids = manifest.skadnetworkIds.all;
  } else {
    networks.forEach(network => {
      const networkIds = manifest.skadnetworkIds[network as keyof typeof manifest.skadnetworkIds];
      if (Array.isArray(networkIds)) {
        ids.push(...networkIds);
      }
    });
  }
  
  const uniqueIds = [...new Set(ids)];
  
  return `<key>SKAdNetworkItems</key>
<array>
${uniqueIds.map(id => `    <dict>
        <key>SKAdNetworkIdentifier</key>
        <string>${id}</string>
    </dict>`).join('\n')}
</array>`;
}

/**
 * Gera dependências Gradle para Android
 */
export function generateAndroidDependencies(networks: string[]): string {
  const manifest = AD_MONETIZATION_SUPREME_MANIFEST;
  const adapters = manifest.mediationAdapters.android;
  
  let deps = `// build.gradle (app)
dependencies {
    // Google Mobile Ads SDK
    implementation("com.google.android.gms:play-services-ads:23.0.0")
    
    // Mediation Adapters`;
  
  networks.forEach(network => {
    const adapter = adapters[network as keyof typeof adapters];
    if (adapter) {
      deps += `\n    implementation("${adapter}")`;
    }
  });
  
  deps += '\n}';
  return deps;
}

/**
 * Gera Podfile para iOS
 */
export function generateIOSPodfile(networks: string[]): string {
  const manifest = AD_MONETIZATION_SUPREME_MANIFEST;
  const adapters = manifest.mediationAdapters.ios;
  
  let podfile = `# Podfile
platform :ios, '13.0'

target 'YourApp' do
  use_frameworks!
  
  # Google Mobile Ads SDK
  pod 'Google-Mobile-Ads-SDK', '~> 11.0'
  
  # Mediation Adapters`;
  
  networks.forEach(network => {
    const adapter = adapters[network as keyof typeof adapters];
    if (adapter) {
      podfile += `\n  pod '${adapter.split(' ')[0]}', '${adapter.match(/\(([^)]+)\)/)?.[1] || ''}'`;
    }
  });
  
  podfile += '\nend';
  return podfile;
}

/**
 * Gera configuração de Ad Service para qualquer plataforma
 */
export function generateAdServiceConfig(config: AdConfig): string {
  const { platform, appId, adUnits, testMode, compliance, behavior } = config;
  
  return `// Ad Service Configuration
export const AD_CONFIG = {
  platform: '${platform}',
  appId: '${appId}',
  testMode: ${testMode},
  
  adUnits: {
    banner: '${adUnits.banner || ''}',
    interstitial: '${adUnits.interstitial || ''}',
    rewarded: '${adUnits.rewarded || ''}',
    native: '${adUnits.native || ''}',
    appOpen: '${adUnits.appOpen || ''}'
  },
  
  compliance: {
    gdpr: ${compliance.gdpr},
    ccpa: ${compliance.ccpa},
    coppa: ${compliance.coppa},
    att: ${compliance.att}
  },
  
  behavior: {
    interstitialCooldown: ${behavior.interstitialCooldown}, // seconds
    bannerRefreshRate: ${behavior.bannerRefreshRate}, // seconds
    preloadAds: ${behavior.preloadAds}
  }
};`;
}

/**
 * Gera código de ConsentService para React Native (Google UMP)
 * OBRIGATÓRIO para servir anúncios na Europa
 */
export function generateReactNativeConsentService(config: AdConfig): string {
  return `// ConsentService.ts - React Native (Google UMP)
// OBRIGATÓRIO para GDPR compliance e servir ads na Europa
import { AdsConsent, AdsConsentStatus, AdsConsentDebugGeography } from 'react-native-google-mobile-ads';

export type ConsentStatus = 'UNKNOWN' | 'NOT_REQUIRED' | 'REQUIRED' | 'OBTAINED';

class ConsentService {
  private consentStatus: ConsentStatus = 'UNKNOWN';
  private canRequestAds = false;

  /**
   * Deve ser chamado ANTES de inicializar ads
   * Retorna true se pode carregar anúncios
   */
  async requestConsent(): Promise<boolean> {
    try {
      // 1. Verificar status atual do consentimento
      const consentInfo = await AdsConsent.requestInfoUpdate({
        // Debug: Simular usuário na Europa (remover em produção!)
        // debugGeography: AdsConsentDebugGeography.EEA,
        // tagForUnderAgeOfConsent: false,
      });

      console.log('[Consent] Status:', consentInfo.status);
      console.log('[Consent] Can request ads:', consentInfo.canRequestAds);

      // 2. Se consentimento é necessário e formulário disponível, mostrar
      if (
        consentInfo.isConsentFormAvailable &&
        consentInfo.status === AdsConsentStatus.REQUIRED
      ) {
        console.log('[Consent] Showing consent form...');
        const formResult = await AdsConsent.showForm();
        console.log('[Consent] Form result:', formResult.status);
        
        this.canRequestAds = formResult.canRequestAds;
        this.consentStatus = this.mapStatus(formResult.status);
      } else {
        this.canRequestAds = consentInfo.canRequestAds;
        this.consentStatus = this.mapStatus(consentInfo.status);
      }

      return this.canRequestAds;
    } catch (error) {
      console.error('[Consent] Error:', error);
      // Em caso de erro, assumir que não pode mostrar ads personalizados
      this.canRequestAds = false;
      return false;
    }
  }

  /**
   * Verifica se pode mostrar anúncios personalizados
   */
  canShowPersonalizedAds(): boolean {
    return this.consentStatus === 'OBTAINED';
  }

  /**
   * Retorna se pode carregar anúncios (personalizados ou não)
   */
  canLoadAds(): boolean {
    return this.canRequestAds;
  }

  /**
   * Força reset do consentimento (para testes ou "Gerenciar Privacidade")
   */
  async resetConsent(): Promise<void> {
    await AdsConsent.reset();
    this.consentStatus = 'UNKNOWN';
    this.canRequestAds = false;
  }

  /**
   * Mostra formulário de privacidade novamente (botão "Gerenciar Privacidade")
   */
  async showPrivacyOptionsForm(): Promise<void> {
    try {
      const result = await AdsConsent.showPrivacyOptionsForm();
      this.canRequestAds = result.canRequestAds;
      this.consentStatus = this.mapStatus(result.status);
    } catch (error) {
      console.error('[Consent] Error showing privacy form:', error);
    }
  }

  private mapStatus(status: AdsConsentStatus): ConsentStatus {
    switch (status) {
      case AdsConsentStatus.UNKNOWN:
        return 'UNKNOWN';
      case AdsConsentStatus.NOT_REQUIRED:
        return 'NOT_REQUIRED';
      case AdsConsentStatus.REQUIRED:
        return 'REQUIRED';
      case AdsConsentStatus.OBTAINED:
        return 'OBTAINED';
      default:
        return 'UNKNOWN';
    }
  }

  getStatus(): ConsentStatus {
    return this.consentStatus;
  }
}

export const consentService = new ConsentService();
`;
}

/**
 * Gera código de AdManager para React Native COM Google UMP integrado
 */
export function generateReactNativeAdService(config: AdConfig): string {
  return `// AdService.ts - React Native (com Google UMP integrado)
import mobileAds, {
  BannerAd,
  BannerAdSize,
  InterstitialAd,
  RewardedAd,
  AdEventType,
  RewardedAdEventType,
  TestIds,
  RequestOptions
} from 'react-native-google-mobile-ads';
import { consentService } from './ConsentService';

const AD_UNITS = {
  banner: __DEV__ ? TestIds.BANNER : '${config.adUnits.banner || ''}',
  interstitial: __DEV__ ? TestIds.INTERSTITIAL : '${config.adUnits.interstitial || ''}',
  rewarded: __DEV__ ? TestIds.REWARDED : '${config.adUnits.rewarded || ''}',
};

class AdService {
  private interstitial: InterstitialAd | null = null;
  private rewarded: RewardedAd | null = null;
  private interstitialUnsubscribe: (() => void) | null = null;
  private rewardedUnsubscribe: (() => void) | null = null;
  private lastInterstitialTime = 0;
  private isInitialized = false;
  private readonly INTERSTITIAL_COOLDOWN = ${config.behavior.interstitialCooldown} * 1000;

  /**
   * Inicializa o SDK de ads COM verificação de consentimento
   * DEVE ser chamado no início do app
   */
  async initialize(): Promise<boolean> {
    try {
      // 1. PRIMEIRO: Verificar/obter consentimento (OBRIGATÓRIO para EU)
      const canRequestAds = await consentService.requestConsent();
      
      if (!canRequestAds) {
        console.log('[AdService] Cannot request ads - consent not given');
        return false;
      }

      // 2. Inicializar SDK
      await mobileAds().initialize();
      this.isInitialized = true;
      
      // 3. Preload ads
      this.loadInterstitial();
      this.loadRewarded();
      
      console.log('[AdService] Initialized successfully');
      return true;
    } catch (error) {
      console.error('[AdService] Initialization error:', error);
      return false;
    }
  }

  /**
   * Retorna RequestOptions baseado no status de consentimento
   */
  private getRequestOptions(): RequestOptions {
    return {
      requestNonPersonalizedAdsOnly: !consentService.canShowPersonalizedAds(),
    };
  }

  loadInterstitial(): void {
    if (!this.isInitialized || !consentService.canLoadAds()) return;
    
    // Cleanup listener anterior para evitar memory leak
    this.interstitialUnsubscribe?.();
    
    this.interstitial = InterstitialAd.createForAdRequest(
      AD_UNITS.interstitial,
      this.getRequestOptions()
    );
    
    this.interstitialUnsubscribe = this.interstitial.addAdEventListener(
      AdEventType.LOADED,
      () => console.log('[AdService] Interstitial loaded')
    );
    
    this.interstitial.addAdEventListener(AdEventType.ERROR, (error) => {
      console.error('[AdService] Interstitial error:', error);
    });
    
    this.interstitial.load();
  }

  async showInterstitial(): Promise<boolean> {
    if (!consentService.canLoadAds()) {
      console.log('[AdService] Cannot show ads - no consent');
      return false;
    }
    
    const now = Date.now();
    if (now - this.lastInterstitialTime < this.INTERSTITIAL_COOLDOWN) {
      console.log('[AdService] Interstitial cooldown active');
      return false;
    }
    
    try {
      if (this.interstitial?.loaded) {
        await this.interstitial.show();
        this.lastInterstitialTime = now;
        this.loadInterstitial(); // Preload next
        return true;
      }
    } catch (error) {
      console.error('[AdService] Error showing interstitial:', error);
    }
    return false;
  }

  loadRewarded(): void {
    if (!this.isInitialized || !consentService.canLoadAds()) return;
    
    // Cleanup listener anterior
    this.rewardedUnsubscribe?.();
    
    this.rewarded = RewardedAd.createForAdRequest(
      AD_UNITS.rewarded,
      this.getRequestOptions()
    );
    
    this.rewardedUnsubscribe = this.rewarded.addAdEventListener(
      RewardedAdEventType.LOADED,
      () => console.log('[AdService] Rewarded loaded')
    );
    
    this.rewarded.addAdEventListener(AdEventType.ERROR, (error) => {
      console.error('[AdService] Rewarded error:', error);
    });
    
    this.rewarded.load();
  }

  async showRewarded(): Promise<{ type: string; amount: number } | null> {
    if (!consentService.canLoadAds()) {
      console.log('[AdService] Cannot show ads - no consent');
      return null;
    }
    
    return new Promise((resolve) => {
      try {
        if (this.rewarded?.loaded) {
          const unsubscribe = this.rewarded.addAdEventListener(
            RewardedAdEventType.EARNED_REWARD,
            (reward) => {
              unsubscribe();
              resolve(reward);
            }
          );
          this.rewarded.show();
          this.loadRewarded(); // Preload next
        } else {
          resolve(null);
        }
      } catch (error) {
        console.error('[AdService] Error showing rewarded:', error);
        resolve(null);
      }
    });
  }

  /**
   * Verifica se ads estão disponíveis
   */
  isReady(): boolean {
    return this.isInitialized && consentService.canLoadAds();
  }

  /**
   * Cleanup - chamar quando componente desmonta
   */
  cleanup(): void {
    this.interstitialUnsubscribe?.();
    this.rewardedUnsubscribe?.();
  }
}

export const adService = new AdService();

// ============================================
// EXEMPLO DE USO NO APP
// ============================================
// App.tsx:
// 
// import { useEffect } from 'react';
// import { adService } from './services/AdService';
// 
// function App() {
//   useEffect(() => {
//     // Inicializa ads com consentimento
//     adService.initialize();
//     
//     return () => adService.cleanup();
//   }, []);
//   
//   return <YourApp />;
// }
`;
}

/**
 * Gera código de ConsentService para Flutter (Google UMP)
 * OBRIGATÓRIO para servir anúncios na Europa
 */
export function generateFlutterConsentService(config: AdConfig): string {
  return `// consent_service.dart - Flutter (Google UMP)
// OBRIGATÓRIO para GDPR compliance e servir ads na Europa
import 'package:google_mobile_ads/google_mobile_ads.dart';

enum ConsentStatus { unknown, notRequired, required, obtained }

class ConsentService {
  static final ConsentService _instance = ConsentService._internal();
  factory ConsentService() => _instance;
  ConsentService._internal();

  ConsentStatus _consentStatus = ConsentStatus.unknown;
  bool _canRequestAds = false;

  /// Deve ser chamado ANTES de inicializar ads
  /// Retorna true se pode carregar anúncios
  Future<bool> requestConsent() async {
    try {
      // 1. Configurar parâmetros (debug - remover em produção!)
      final params = ConsentRequestParameters(
        // consentDebugSettings: ConsentDebugSettings(
        //   debugGeography: DebugGeography.debugGeographyEea,
        //   testIdentifiers: ['YOUR_TEST_DEVICE_ID'],
        // ),
      );

      // 2. Atualizar informações de consentimento
      final consentInfo = await ConsentInformation.instance.requestConsentInfoUpdate(params);
      
      print('[Consent] Status: \${consentInfo.consentStatus}');
      print('[Consent] Form available: \${consentInfo.isConsentFormAvailable}');

      // 3. Se formulário disponível e necessário, mostrar
      if (consentInfo.isConsentFormAvailable) {
        if (consentInfo.consentStatus == ConsentStatus.required) {
          await ConsentForm.loadAndShowConsentFormIfRequired((formError) {
            if (formError != null) {
              print('[Consent] Form error: \${formError.message}');
            }
          });
        }
      }

      // 4. Verificar se pode carregar ads
      _canRequestAds = await ConsentInformation.instance.canRequestAds();
      _consentStatus = _mapStatus(await ConsentInformation.instance.getConsentStatus());
      
      print('[Consent] Can request ads: \$_canRequestAds');
      return _canRequestAds;
    } catch (e) {
      print('[Consent] Error: \$e');
      _canRequestAds = false;
      return false;
    }
  }

  /// Verifica se pode mostrar anúncios personalizados
  bool canShowPersonalizedAds() {
    return _consentStatus == ConsentStatus.obtained;
  }

  /// Retorna se pode carregar anúncios (personalizados ou não)
  bool canLoadAds() => _canRequestAds;

  /// Mostra formulário de privacidade novamente
  Future<void> showPrivacyOptionsForm() async {
    try {
      await ConsentForm.showPrivacyOptionsForm((formError) {
        if (formError != null) {
          print('[Consent] Privacy form error: \${formError.message}');
        }
      });
      _canRequestAds = await ConsentInformation.instance.canRequestAds();
    } catch (e) {
      print('[Consent] Error showing privacy form: \$e');
    }
  }

  /// Reset do consentimento (para testes)
  Future<void> reset() async {
    await ConsentInformation.instance.reset();
    _consentStatus = ConsentStatus.unknown;
    _canRequestAds = false;
  }

  ConsentStatus _mapStatus(int status) {
    switch (status) {
      case 0: return ConsentStatus.unknown;
      case 1: return ConsentStatus.notRequired;
      case 2: return ConsentStatus.required;
      case 3: return ConsentStatus.obtained;
      default: return ConsentStatus.unknown;
    }
  }

  ConsentStatus get status => _consentStatus;
}
`;
}

/**
 * Gera código de AdManager para Flutter COM Google UMP integrado
 */
export function generateFlutterAdService(config: AdConfig): string {
  return `// ad_service.dart - Flutter (com Google UMP integrado)
import 'package:google_mobile_ads/google_mobile_ads.dart';
import 'consent_service.dart';

class AdService {
  static final AdService _instance = AdService._internal();
  factory AdService() => _instance;
  AdService._internal();

  final ConsentService _consentService = ConsentService();
  
  BannerAd? _bannerAd;
  InterstitialAd? _interstitialAd;
  RewardedAd? _rewardedAd;
  
  DateTime? _lastInterstitialTime;
  bool _isInitialized = false;
  
  static const _interstitialCooldown = Duration(seconds: ${config.behavior.interstitialCooldown});

  // Ad Unit IDs
  static const _bannerAdUnitId = '${config.adUnits.banner || ''}';
  static const _interstitialAdUnitId = '${config.adUnits.interstitial || ''}';
  static const _rewardedAdUnitId = '${config.adUnits.rewarded || ''}';

  /// Inicializa o SDK de ads COM verificação de consentimento
  /// DEVE ser chamado no início do app
  Future<bool> initialize() async {
    try {
      // 1. PRIMEIRO: Verificar/obter consentimento (OBRIGATÓRIO para EU)
      final canRequestAds = await _consentService.requestConsent();
      
      if (!canRequestAds) {
        print('[AdService] Cannot request ads - consent not given');
        return false;
      }

      // 2. Inicializar SDK
      await MobileAds.instance.initialize();
      _isInitialized = true;
      
      // 3. Preload ads
      _loadInterstitial();
      _loadRewarded();
      
      print('[AdService] Initialized successfully');
      return true;
    } catch (e) {
      print('[AdService] Initialization error: \$e');
      return false;
    }
  }

  /// Cria AdRequest respeitando consentimento
  AdRequest _buildAdRequest() {
    return AdRequest(
      nonPersonalizedAds: !_consentService.canShowPersonalizedAds(),
    );
  }

  BannerAd? loadBanner({required Function(Ad) onLoaded}) {
    if (!_isInitialized || !_consentService.canLoadAds()) {
      print('[AdService] Cannot load banner - not initialized or no consent');
      return null;
    }
    
    _bannerAd = BannerAd(
      adUnitId: _bannerAdUnitId,
      size: AdSize.banner,
      request: _buildAdRequest(),
      listener: BannerAdListener(
        onAdLoaded: onLoaded,
        onAdFailedToLoad: (ad, error) {
          print('[AdService] Banner failed: \${error.message}');
          ad.dispose();
        },
      ),
    )..load();
    return _bannerAd;
  }

  void _loadInterstitial() {
    if (!_consentService.canLoadAds()) return;
    
    InterstitialAd.load(
      adUnitId: _interstitialAdUnitId,
      request: _buildAdRequest(),
      adLoadCallback: InterstitialAdLoadCallback(
        onAdLoaded: (ad) {
          _interstitialAd = ad;
          print('[AdService] Interstitial loaded');
        },
        onAdFailedToLoad: (error) {
          _interstitialAd = null;
          print('[AdService] Interstitial failed: \${error.message}');
        },
      ),
    );
  }

  Future<bool> showInterstitial() async {
    if (!_consentService.canLoadAds()) {
      print('[AdService] Cannot show ads - no consent');
      return false;
    }
    
    final now = DateTime.now();
    if (_lastInterstitialTime != null && 
        now.difference(_lastInterstitialTime!) < _interstitialCooldown) {
      print('[AdService] Interstitial cooldown active');
      return false;
    }
    
    try {
      if (_interstitialAd != null) {
        await _interstitialAd!.show();
        _lastInterstitialTime = now;
        _interstitialAd = null;
        _loadInterstitial(); // Preload next
        return true;
      }
    } catch (e) {
      print('[AdService] Error showing interstitial: \$e');
    }
    return false;
  }

  void _loadRewarded() {
    if (!_consentService.canLoadAds()) return;
    
    RewardedAd.load(
      adUnitId: _rewardedAdUnitId,
      request: _buildAdRequest(),
      rewardedAdLoadCallback: RewardedAdLoadCallback(
        onAdLoaded: (ad) {
          _rewardedAd = ad;
          print('[AdService] Rewarded loaded');
        },
        onAdFailedToLoad: (error) {
          _rewardedAd = null;
          print('[AdService] Rewarded failed: \${error.message}');
        },
      ),
    );
  }

  Future<RewardItem?> showRewarded() async {
    if (!_consentService.canLoadAds()) {
      print('[AdService] Cannot show ads - no consent');
      return null;
    }
    
    if (_rewardedAd == null) return null;
    
    try {
      RewardItem? reward;
      await _rewardedAd!.show(
        onUserEarnedReward: (ad, item) => reward = item,
      );
      _rewardedAd = null;
      _loadRewarded(); // Preload next
      return reward;
    } catch (e) {
      print('[AdService] Error showing rewarded: \$e');
      return null;
    }
  }

  /// Verifica se ads estão disponíveis
  bool isReady() => _isInitialized && _consentService.canLoadAds();

  /// Acesso ao ConsentService para "Gerenciar Privacidade"
  ConsentService get consent => _consentService;
}

// ============================================
// EXEMPLO DE USO NO MAIN.DART
// ============================================
// void main() async {
//   WidgetsFlutterBinding.ensureInitialized();
//   
//   // Inicializa ads com consentimento
//   final adService = AdService();
//   await adService.initialize();
//   
//   runApp(MyApp());
// }
`;
}

/**
 * Gera código de ConsentManager para Android (Google UMP)
 * OBRIGATÓRIO para servir anúncios na Europa
 */
export function generateAndroidConsentManager(config: AdConfig): string {
  return `// ConsentManager.kt - Android (Google UMP)
// OBRIGATÓRIO para GDPR compliance e servir ads na Europa
package com.example.app.ads

import android.app.Activity
import android.content.Context
import android.util.Log
import com.google.android.ump.*

object ConsentManager {
    private const val TAG = "ConsentManager"
    
    private var consentInformation: ConsentInformation? = null
    private var canRequestAds = false

    /**
     * Deve ser chamado ANTES de inicializar ads
     * @param activity Activity atual
     * @param onConsentResult Callback com resultado (true = pode carregar ads)
     */
    fun requestConsent(activity: Activity, onConsentResult: (Boolean) -> Unit) {
        // Configurar parâmetros de debug (remover em produção!)
        val debugSettings = ConsentDebugSettings.Builder(activity)
            // .setDebugGeography(ConsentDebugSettings.DebugGeography.DEBUG_GEOGRAPHY_EEA)
            // .addTestDeviceHashedId("YOUR_TEST_DEVICE_HASHED_ID")
            .build()

        val params = ConsentRequestParameters.Builder()
            .setConsentDebugSettings(debugSettings)
            .setTagForUnderAgeOfConsent(false)
            .build()

        consentInformation = UserMessagingPlatform.getConsentInformation(activity)
        
        consentInformation?.requestConsentInfoUpdate(
            activity,
            params,
            {
                // Sucesso - verificar se precisa mostrar formulário
                Log.d(TAG, "Consent info updated. Status: \${consentInformation?.consentStatus}")
                
                if (consentInformation?.isConsentFormAvailable == true) {
                    loadAndShowConsentForm(activity, onConsentResult)
                } else {
                    canRequestAds = consentInformation?.canRequestAds() ?: false
                    onConsentResult(canRequestAds)
                }
            },
            { error ->
                // Erro - logar mas continuar (sem ads personalizados)
                Log.e(TAG, "Consent info update failed: \${error.message}")
                canRequestAds = false
                onConsentResult(false)
            }
        )
    }

    private fun loadAndShowConsentForm(activity: Activity, onConsentResult: (Boolean) -> Unit) {
        UserMessagingPlatform.loadAndShowConsentFormIfRequired(activity) { formError ->
            if (formError != null) {
                Log.e(TAG, "Consent form error: \${formError.message}")
            }
            
            canRequestAds = consentInformation?.canRequestAds() ?: false
            Log.d(TAG, "Can request ads: \$canRequestAds")
            onConsentResult(canRequestAds)
        }
    }

    /**
     * Verifica se pode mostrar anúncios personalizados
     */
    fun canShowPersonalizedAds(): Boolean {
        return consentInformation?.consentStatus == ConsentInformation.ConsentStatus.OBTAINED
    }

    /**
     * Retorna se pode carregar anúncios (personalizados ou não)
     */
    fun canLoadAds(): Boolean = canRequestAds

    /**
     * Mostra formulário de privacidade novamente (botão "Gerenciar Privacidade")
     */
    fun showPrivacyOptionsForm(activity: Activity, onComplete: () -> Unit) {
        UserMessagingPlatform.showPrivacyOptionsForm(activity) { formError ->
            if (formError != null) {
                Log.e(TAG, "Privacy form error: \${formError.message}")
            }
            canRequestAds = consentInformation?.canRequestAds() ?: false
            onComplete()
        }
    }

    /**
     * Reset do consentimento (para testes)
     */
    fun reset(context: Context) {
        UserMessagingPlatform.getConsentInformation(context).reset()
        canRequestAds = false
    }
}
`;
}

/**
 * Gera código de AdManager para Android Kotlin COM Google UMP integrado
 */
export function generateAndroidAdService(config: AdConfig): string {
  return `// AdManager.kt - Android (com Google UMP integrado)
package com.example.app.ads

import android.app.Activity
import android.content.Context
import android.util.Log
import com.google.android.gms.ads.*
import com.google.android.gms.ads.interstitial.InterstitialAd
import com.google.android.gms.ads.interstitial.InterstitialAdLoadCallback
import com.google.android.gms.ads.rewarded.RewardedAd
import com.google.android.gms.ads.rewarded.RewardedAdLoadCallback

object AdManager {
    private const val TAG = "AdManager"
    
    // Ad Unit IDs
    private const val BANNER_AD_UNIT_ID = "${config.adUnits.banner || ''}"
    private const val INTERSTITIAL_AD_UNIT_ID = "${config.adUnits.interstitial || ''}"
    private const val REWARDED_AD_UNIT_ID = "${config.adUnits.rewarded || ''}"
    
    private var interstitialAd: InterstitialAd? = null
    private var rewardedAd: RewardedAd? = null
    private var lastInterstitialTime = 0L
    private var isInitialized = false
    private const val INTERSTITIAL_COOLDOWN = ${config.behavior.interstitialCooldown * 1000}L

    /**
     * Inicializa o SDK de ads COM verificação de consentimento
     * DEVE ser chamado no onCreate da MainActivity
     */
    fun initialize(activity: Activity, onInitialized: (Boolean) -> Unit) {
        // 1. PRIMEIRO: Verificar/obter consentimento (OBRIGATÓRIO para EU)
        ConsentManager.requestConsent(activity) { canRequestAds ->
            if (!canRequestAds) {
                Log.w(TAG, "Cannot request ads - consent not given")
                onInitialized(false)
                return@requestConsent
            }
            
            // 2. Inicializar SDK
            MobileAds.initialize(activity) {
                Log.d(TAG, "AdMob initialized")
                isInitialized = true
                
                // 3. Preload ads
                loadInterstitial(activity)
                loadRewarded(activity)
                
                onInitialized(true)
            }
        }
    }

    /**
     * Cria AdRequest respeitando consentimento
     */
    private fun buildAdRequest(): AdRequest {
        return AdRequest.Builder().build()
        // Nota: O SDK do AdMob automaticamente respeita o consentimento
        // configurado via UMP. Não é necessário configurar manualmente.
    }

    fun loadBanner(adView: AdView) {
        if (!isInitialized || !ConsentManager.canLoadAds()) {
            Log.w(TAG, "Cannot load banner - not initialized or no consent")
            return
        }
        adView.adUnitId = BANNER_AD_UNIT_ID
        adView.loadAd(buildAdRequest())
    }

    private fun loadInterstitial(context: Context) {
        if (!ConsentManager.canLoadAds()) return
        
        InterstitialAd.load(
            context,
            INTERSTITIAL_AD_UNIT_ID,
            buildAdRequest(),
            object : InterstitialAdLoadCallback() {
                override fun onAdLoaded(ad: InterstitialAd) {
                    interstitialAd = ad
                    Log.d(TAG, "Interstitial loaded")
                }
                override fun onAdFailedToLoad(error: LoadAdError) {
                    interstitialAd = null
                    Log.e(TAG, "Interstitial failed: \${error.message}")
                }
            }
        )
    }

    fun showInterstitial(activity: Activity): Boolean {
        if (!ConsentManager.canLoadAds()) {
            Log.w(TAG, "Cannot show ads - no consent")
            return false
        }
        
        val now = System.currentTimeMillis()
        if (now - lastInterstitialTime < INTERSTITIAL_COOLDOWN) {
            Log.d(TAG, "Interstitial cooldown active")
            return false
        }
        
        return try {
            interstitialAd?.let { ad ->
                ad.show(activity)
                lastInterstitialTime = now
                loadInterstitial(activity) // Preload next
                true
            } ?: false
        } catch (e: Exception) {
            Log.e(TAG, "Error showing interstitial: \${e.message}")
            false
        }
    }

    private fun loadRewarded(context: Context) {
        if (!ConsentManager.canLoadAds()) return
        
        RewardedAd.load(
            context,
            REWARDED_AD_UNIT_ID,
            buildAdRequest(),
            object : RewardedAdLoadCallback() {
                override fun onAdLoaded(ad: RewardedAd) {
                    rewardedAd = ad
                    Log.d(TAG, "Rewarded loaded")
                }
                override fun onAdFailedToLoad(error: LoadAdError) {
                    rewardedAd = null
                    Log.e(TAG, "Rewarded failed: \${error.message}")
                }
            }
        )
    }

    fun showRewarded(activity: Activity, onRewarded: (Int) -> Unit) {
        if (!ConsentManager.canLoadAds()) {
            Log.w(TAG, "Cannot show ads - no consent")
            return
        }
        
        try {
            rewardedAd?.let { ad ->
                ad.show(activity) { reward ->
                    onRewarded(reward.amount)
                }
                loadRewarded(activity) // Preload next
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error showing rewarded: \${e.message}")
        }
    }

    /**
     * Verifica se ads estão disponíveis
     */
    fun isReady(): Boolean = isInitialized && ConsentManager.canLoadAds()
}

// ============================================
// EXEMPLO DE USO NA MAINACTIVITY
// ============================================
// class MainActivity : AppCompatActivity() {
//     override fun onCreate(savedInstanceState: Bundle?) {
//         super.onCreate(savedInstanceState)
//         setContentView(R.layout.activity_main)
//         
//         // Inicializa ads com consentimento
//         AdManager.initialize(this) { success ->
//             if (success) {
//                 Log.d("MainActivity", "Ads ready!")
//             }
//         }
//     }
// }
`;
}

/**
 * Gera código de ConsentManager para iOS Swift (Google UMP + ATT)
 * OBRIGATÓRIO para servir anúncios na Europa e iOS 14.5+
 */
export function generateIOSConsentManager(config: AdConfig): string {
  return `// ConsentManager.swift - iOS (Google UMP + ATT)
// OBRIGATÓRIO para GDPR compliance e iOS App Tracking Transparency
import Foundation
import GoogleMobileAds
import UserMessagingPlatform
import AppTrackingTransparency

enum ConsentStatus {
    case unknown
    case notRequired
    case required
    case obtained
}

class ConsentManager {
    static let shared = ConsentManager()
    private init() {}
    
    private var consentStatus: ConsentStatus = .unknown
    private var canRequestAds = false
    
    /// Deve ser chamado ANTES de inicializar ads
    /// Retorna true se pode carregar anúncios
    func requestConsent(from viewController: UIViewController, completion: @escaping (Bool) -> Void) {
        // 1. PRIMEIRO: Pedir permissão ATT (iOS 14.5+)
        requestATTPermission { [weak self] attGranted in
            guard let self = self else { return }
            
            // 2. DEPOIS: Verificar consentimento GDPR via UMP
            self.requestUMPConsent(from: viewController) { canRequest in
                self.canRequestAds = canRequest
                completion(canRequest)
            }
        }
    }
    
    /// Solicita permissão App Tracking Transparency (iOS 14.5+)
    private func requestATTPermission(completion: @escaping (Bool) -> Void) {
        if #available(iOS 14, *) {
            ATTrackingManager.requestTrackingAuthorization { status in
                DispatchQueue.main.async {
                    switch status {
                    case .authorized:
                        print("[Consent] ATT: Authorized")
                        completion(true)
                    case .denied:
                        print("[Consent] ATT: Denied")
                        completion(false)
                    case .restricted:
                        print("[Consent] ATT: Restricted")
                        completion(false)
                    case .notDetermined:
                        print("[Consent] ATT: Not Determined")
                        completion(false)
                    @unknown default:
                        completion(false)
                    }
                }
            }
        } else {
            // iOS < 14, não precisa de ATT
            completion(true)
        }
    }
    
    /// Solicita consentimento GDPR via Google UMP
    private func requestUMPConsent(from viewController: UIViewController, completion: @escaping (Bool) -> Void) {
        // Configurar parâmetros (debug - remover em produção!)
        let parameters = UMPRequestParameters()
        // let debugSettings = UMPDebugSettings()
        // debugSettings.geography = .EEA
        // debugSettings.testDeviceIdentifiers = ["YOUR_TEST_DEVICE_ID"]
        // parameters.debugSettings = debugSettings
        parameters.tagForUnderAgeOfConsent = false
        
        // Atualizar informações de consentimento
        UMPConsentInformation.sharedInstance.requestConsentInfoUpdate(with: parameters) { [weak self] error in
            guard let self = self else { return }
            
            if let error = error {
                print("[Consent] UMP Error: \\(error.localizedDescription)")
                completion(false)
                return
            }
            
            print("[Consent] UMP Status: \\(UMPConsentInformation.sharedInstance.consentStatus.rawValue)")
            
            // Carregar e mostrar formulário se necessário
            UMPConsentForm.loadAndPresentIfRequired(from: viewController) { [weak self] formError in
                guard let self = self else { return }
                
                if let formError = formError {
                    print("[Consent] Form Error: \\(formError.localizedDescription)")
                }
                
                let canRequest = UMPConsentInformation.sharedInstance.canRequestAds
                self.consentStatus = self.mapStatus(UMPConsentInformation.sharedInstance.consentStatus)
                
                print("[Consent] Can request ads: \\(canRequest)")
                completion(canRequest)
            }
        }
    }
    
    /// Verifica se pode mostrar anúncios personalizados
    func canShowPersonalizedAds() -> Bool {
        return consentStatus == .obtained
    }
    
    /// Retorna se pode carregar anúncios
    func canLoadAds() -> Bool {
        return canRequestAds
    }
    
    /// Mostra formulário de privacidade novamente
    func showPrivacyOptionsForm(from viewController: UIViewController, completion: @escaping () -> Void) {
        UMPConsentForm.presentPrivacyOptionsForm(from: viewController) { [weak self] formError in
            if let formError = formError {
                print("[Consent] Privacy form error: \\(formError.localizedDescription)")
            }
            self?.canRequestAds = UMPConsentInformation.sharedInstance.canRequestAds
            completion()
        }
    }
    
    /// Reset do consentimento (para testes)
    func reset() {
        UMPConsentInformation.sharedInstance.reset()
        consentStatus = .unknown
        canRequestAds = false
    }
    
    private func mapStatus(_ status: UMPConsentStatus) -> ConsentStatus {
        switch status {
        case .unknown: return .unknown
        case .notRequired: return .notRequired
        case .required: return .required
        case .obtained: return .obtained
        @unknown default: return .unknown
        }
    }
    
    func getStatus() -> ConsentStatus {
        return consentStatus
    }
}
`;
}

/**
 * Gera código de AdManager para iOS Swift COM Google UMP + ATT integrado
 */
export function generateIOSAdService(config: AdConfig): string {
  return `// AdManager.swift - iOS (com Google UMP + ATT integrado)
import Foundation
import GoogleMobileAds

class AdManager: NSObject {
    static let shared = AdManager()
    private override init() { super.init() }
    
    // Ad Unit IDs
    private let bannerAdUnitID = "${config.adUnits.banner || ''}"
    private let interstitialAdUnitID = "${config.adUnits.interstitial || ''}"
    private let rewardedAdUnitID = "${config.adUnits.rewarded || ''}"
    
    private var bannerView: GADBannerView?
    private var interstitialAd: GADInterstitialAd?
    private var rewardedAd: GADRewardedAd?
    
    private var lastInterstitialTime: Date?
    private var isInitialized = false
    private let interstitialCooldown: TimeInterval = ${config.behavior.interstitialCooldown}
    
    /// Inicializa o SDK de ads COM verificação de consentimento
    /// DEVE ser chamado no viewDidLoad da primeira ViewController
    func initialize(from viewController: UIViewController, completion: @escaping (Bool) -> Void) {
        // 1. PRIMEIRO: Verificar/obter consentimento (OBRIGATÓRIO)
        ConsentManager.shared.requestConsent(from: viewController) { [weak self] canRequestAds in
            guard let self = self else { return }
            
            if !canRequestAds {
                print("[AdManager] Cannot request ads - consent not given")
                completion(false)
                return
            }
            
            // 2. Inicializar SDK
            GADMobileAds.sharedInstance().start { [weak self] _ in
                guard let self = self else { return }
                
                print("[AdManager] AdMob initialized")
                self.isInitialized = true
                
                // 3. Preload ads
                self.loadInterstitial()
                self.loadRewarded()
                
                completion(true)
            }
        }
    }
    
    /// Cria GADRequest respeitando consentimento
    private func buildAdRequest() -> GADRequest {
        return GADRequest()
        // Nota: O SDK do AdMob automaticamente respeita o consentimento
        // configurado via UMP. Não é necessário configurar manualmente.
    }
    
    // MARK: - Banner
    
    func loadBanner(in container: UIView, rootViewController: UIViewController) {
        guard isInitialized, ConsentManager.shared.canLoadAds() else {
            print("[AdManager] Cannot load banner - not initialized or no consent")
            return
        }
        
        bannerView = GADBannerView(adSize: GADAdSizeBanner)
        bannerView?.adUnitID = bannerAdUnitID
        bannerView?.rootViewController = rootViewController
        bannerView?.load(buildAdRequest())
        
        if let bannerView = bannerView {
            container.addSubview(bannerView)
        }
    }
    
    // MARK: - Interstitial
    
    private func loadInterstitial() {
        guard ConsentManager.shared.canLoadAds() else { return }
        
        GADInterstitialAd.load(
            withAdUnitID: interstitialAdUnitID,
            request: buildAdRequest()
        ) { [weak self] ad, error in
            if let error = error {
                print("[AdManager] Interstitial failed: \\(error.localizedDescription)")
                self?.interstitialAd = nil
                return
            }
            print("[AdManager] Interstitial loaded")
            self?.interstitialAd = ad
        }
    }
    
    func showInterstitial(from viewController: UIViewController) -> Bool {
        guard ConsentManager.shared.canLoadAds() else {
            print("[AdManager] Cannot show ads - no consent")
            return false
        }
        
        // Verificar cooldown
        if let lastTime = lastInterstitialTime,
           Date().timeIntervalSince(lastTime) < interstitialCooldown {
            print("[AdManager] Interstitial cooldown active")
            return false
        }
        
        guard let ad = interstitialAd else { return false }
        
        do {
            try ad.canPresent(fromRootViewController: viewController)
            ad.present(fromRootViewController: viewController)
            lastInterstitialTime = Date()
            loadInterstitial() // Preload next
            return true
        } catch {
            print("[AdManager] Error showing interstitial: \\(error.localizedDescription)")
            return false
        }
    }
    
    // MARK: - Rewarded
    
    private func loadRewarded() {
        guard ConsentManager.shared.canLoadAds() else { return }
        
        GADRewardedAd.load(
            withAdUnitID: rewardedAdUnitID,
            request: buildAdRequest()
        ) { [weak self] ad, error in
            if let error = error {
                print("[AdManager] Rewarded failed: \\(error.localizedDescription)")
                self?.rewardedAd = nil
                return
            }
            print("[AdManager] Rewarded loaded")
            self?.rewardedAd = ad
        }
    }
    
    func showRewarded(from viewController: UIViewController, completion: @escaping (Int) -> Void) {
        guard ConsentManager.shared.canLoadAds() else {
            print("[AdManager] Cannot show ads - no consent")
            return
        }
        
        guard let ad = rewardedAd else { return }
        
        do {
            try ad.canPresent(fromRootViewController: viewController)
            ad.present(fromRootViewController: viewController) {
                let reward = ad.adReward
                completion(reward.amount.intValue)
            }
            loadRewarded() // Preload next
        } catch {
            print("[AdManager] Error showing rewarded: \\(error.localizedDescription)")
        }
    }
    
    /// Verifica se ads estão disponíveis
    func isReady() -> Bool {
        return isInitialized && ConsentManager.shared.canLoadAds()
    }
}

// ============================================
// EXEMPLO DE USO NA VIEWCONTROLLER
// ============================================
// class ViewController: UIViewController {
//     override func viewDidLoad() {
//         super.viewDidLoad()
//         
//         // Inicializa ads com consentimento
//         AdManager.shared.initialize(from: self) { success in
//             if success {
//                 print("Ads ready!")
//             }
//         }
//     }
// }
`;
}

/**
 * Valida configuração de ads
 */
export function validateAdConfig(config: AdConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!config.appId || config.appId.length < 10) {
    errors.push('App ID inválido ou ausente');
  }
  
  if (!config.adUnits.banner && !config.adUnits.interstitial && !config.adUnits.rewarded) {
    errors.push('Pelo menos um ad unit deve ser configurado');
  }
  
  if (config.behavior.interstitialCooldown < 30) {
    errors.push('Cooldown de interstitial muito baixo (mínimo 30s recomendado)');
  }
  
  if (config.behavior.bannerRefreshRate < 30) {
    errors.push('Taxa de refresh de banner muito baixa (mínimo 30s)');
  }
  
  if (config.platform === 'ios' && !config.compliance.att) {
    errors.push('ATT deve estar habilitado para iOS');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Retorna recomendações baseadas no tipo de app
 */
export function getRecommendations(appType: 'game' | 'utility' | 'content' | 'social'): {
  formats: string[];
  frequency: { interstitial: number; bannerRefresh: number };
  networks: string[];
  tips: string[];
} {
  const recommendations = {
    game: {
      formats: ['rewarded', 'interstitial', 'banner'],
      frequency: { interstitial: 90, bannerRefresh: 60 },
      networks: ['admob', 'unity', 'applovin', 'ironsource'],
      tips: [
        'Priorize rewarded ads - usuários de jogos aceitam bem',
        'Mostre interstitial entre fases, não durante gameplay',
        'Use offerwall para monetização adicional',
        'Implemente mediation para maximizar fill rate'
      ]
    },
    utility: {
      formats: ['banner', 'native', 'interstitial'],
      frequency: { interstitial: 180, bannerRefresh: 60 },
      networks: ['admob', 'meta'],
      tips: [
        'Banners discretos funcionam bem',
        'Evite interstitials frequentes - usuários querem eficiência',
        'Considere versão premium sem ads',
        'Native ads integrados ao design são menos intrusivos'
      ]
    },
    content: {
      formats: ['native', 'banner', 'video'],
      frequency: { interstitial: 120, bannerRefresh: 45 },
      networks: ['admob', 'adsense', 'meta'],
      tips: [
        'Native ads no feed de conteúdo',
        'Video ads para conteúdo premium',
        'Header bidding para maximizar receita (web)',
        'Lazy loading de ads para melhor performance'
      ]
    },
    social: {
      formats: ['native', 'rewarded', 'banner'],
      frequency: { interstitial: 150, bannerRefresh: 60 },
      networks: ['admob', 'meta', 'applovin'],
      tips: [
        'Native ads no feed social',
        'Rewarded para features premium temporárias',
        'Evite interromper interações sociais',
        'Personalize ads baseado em interesses'
      ]
    }
  };
  
  return recommendations[appType];
}

/**
 * Gera TODOS os arquivos necessários para uma plataforma
 * Inclui: ConsentService + AdService + Configurações
 */
export function generateCompleteAdIntegration(config: AdConfig): {
  files: { name: string; content: string; description: string }[];
  instructions: string[];
} {
  const files: { name: string; content: string; description: string }[] = [];
  const instructions: string[] = [];

  switch (config.platform) {
    case 'react-native':
      files.push({
        name: 'ConsentService.ts',
        content: generateReactNativeConsentService(config),
        description: 'Serviço de consentimento GDPR (Google UMP)'
      });
      files.push({
        name: 'AdService.ts',
        content: generateReactNativeAdService(config),
        description: 'Serviço de anúncios com consentimento integrado'
      });
      files.push({
        name: 'ad-config.ts',
        content: generateAdServiceConfig(config),
        description: 'Configuração centralizada de ads'
      });
      instructions.push(
        '1. Instale: npm install react-native-google-mobile-ads',
        '2. Configure app.json com os App IDs',
        '3. iOS: Adicione SKAdNetwork IDs no Info.plist',
        '4. iOS: Adicione NSUserTrackingUsageDescription no Info.plist',
        '5. Chame adService.initialize() no App.tsx',
        '6. Use adService.showInterstitial() e adService.showRewarded()'
      );
      break;

    case 'flutter':
      files.push({
        name: 'consent_service.dart',
        content: generateFlutterConsentService(config),
        description: 'Serviço de consentimento GDPR (Google UMP)'
      });
      files.push({
        name: 'ad_service.dart',
        content: generateFlutterAdService(config),
        description: 'Serviço de anúncios com consentimento integrado'
      });
      instructions.push(
        '1. Adicione google_mobile_ads: ^5.0.0 no pubspec.yaml',
        '2. Configure AndroidManifest.xml com App ID',
        '3. Configure Info.plist com App ID e SKAdNetwork IDs',
        '4. iOS: Adicione NSUserTrackingUsageDescription',
        '5. Chame AdService().initialize() no main.dart',
        '6. Use adService.showInterstitial() e adService.showRewarded()'
      );
      break;

    case 'android':
      files.push({
        name: 'ConsentManager.kt',
        content: generateAndroidConsentManager(config),
        description: 'Gerenciador de consentimento GDPR (Google UMP)'
      });
      files.push({
        name: 'AdManager.kt',
        content: generateAndroidAdService(config),
        description: 'Gerenciador de anúncios com consentimento integrado'
      });
      files.push({
        name: 'build.gradle.kts (dependencies)',
        content: generateAndroidDependencies(config.mediation?.networks || []),
        description: 'Dependências Gradle'
      });
      instructions.push(
        '1. Adicione as dependências no build.gradle',
        '2. Configure AndroidManifest.xml com App ID',
        '3. Chame AdManager.initialize(activity) na MainActivity',
        '4. Use AdManager.showInterstitial(activity) e AdManager.showRewarded(activity)'
      );
      break;

    case 'ios':
      files.push({
        name: 'ConsentManager.swift',
        content: generateIOSConsentManager(config),
        description: 'Gerenciador de consentimento GDPR + ATT'
      });
      files.push({
        name: 'AdManager.swift',
        content: generateIOSAdService(config),
        description: 'Gerenciador de anúncios com consentimento integrado'
      });
      files.push({
        name: 'Podfile (dependencies)',
        content: generateIOSPodfile(config.mediation?.networks || []),
        description: 'Dependências CocoaPods'
      });
      files.push({
        name: 'Info.plist (SKAdNetwork)',
        content: generateSkadnetworkPlist(['all']),
        description: 'SKAdNetwork IDs para attribution'
      });
      instructions.push(
        '1. Adicione as dependências no Podfile e rode pod install',
        '2. Configure Info.plist com GADApplicationIdentifier',
        '3. Adicione NSUserTrackingUsageDescription no Info.plist',
        '4. Adicione SKAdNetworkItems no Info.plist',
        '5. Chame AdManager.shared.initialize(from: self) na ViewController',
        '6. Use AdManager.shared.showInterstitial(from: self)'
      );
      break;

    default:
      instructions.push('Plataforma não suportada para geração automática');
  }

  return { files, instructions };
}

/**
 * Gera checklist de compliance para uma região
 */
export function generateComplianceChecklist(regions: ('eu' | 'us' | 'brazil' | 'global')[]): {
  required: string[];
  recommended: string[];
  warnings: string[];
} {
  const required: string[] = [];
  const recommended: string[] = [];
  const warnings: string[] = [];

  if (regions.includes('eu') || regions.includes('global')) {
    required.push(
      '✅ Implementar Google UMP (User Messaging Platform)',
      '✅ Mostrar banner de consentimento ANTES de carregar ads',
      '✅ Respeitar escolha do usuário (personalized vs non-personalized)',
      '✅ Oferecer opção "Gerenciar Privacidade" no app',
      '✅ TCF 2.2 compliance via CMP certificada'
    );
    warnings.push(
      '⚠️ Sem UMP, AdMob NÃO serve anúncios na Europa',
      '⚠️ Multas GDPR podem chegar a 4% do faturamento global'
    );
  }

  if (regions.includes('us') || regions.includes('global')) {
    required.push(
      '✅ Link "Do Not Sell My Personal Information" (CCPA)',
      '✅ Política de privacidade acessível'
    );
    recommended.push(
      '💡 Implementar opt-out de venda de dados',
      '💡 Manter registro de consentimentos'
    );
  }

  if (regions.includes('brazil') || regions.includes('global')) {
    required.push(
      '✅ Política de privacidade em português',
      '✅ Consentimento explícito para coleta de dados (LGPD)'
    );
  }

  // iOS específico (global)
  required.push(
    '✅ [iOS] Implementar ATT (App Tracking Transparency)',
    '✅ [iOS] NSUserTrackingUsageDescription no Info.plist',
    '✅ [iOS] SKAdNetwork IDs para todas as redes de ads'
  );
  warnings.push(
    '⚠️ [iOS] Sem ATT prompt, IDFA não é acessível (CPMs menores)'
  );

  // Apps infantis
  recommended.push(
    '💡 Se app é para crianças: configurar COPPA compliance',
    '💡 Se app é para crianças: tagForChildDirectedTreatment = true'
  );

  return { required, recommended, warnings };
}

export default AD_MONETIZATION_SUPREME_MANIFEST;
