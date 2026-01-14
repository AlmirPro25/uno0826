/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║     📱 MOBILE ARCHITECT - ARQUITETO DE APPS MOBILE SUPREMO 📱               ║
 * ║                                                                              ║
 * ║     "DO NAVEGADOR AO BOLSO - APPS NATIVOS COM ALMA DE BIG TECH"             ║
 * ║                                                                              ║
 * ║     NÍVEL: 95 (Mobile Architect Supreme)                                    ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 * 
 * Este módulo integra com o AuroraBuilder para:
 * 1. DETECTAR se o pedido é para app mobile
 * 2. ESCOLHER o melhor framework (Kotlin, Swift, React Native, Flutter)
 * 3. GERAR arquitetura completa (frontend mobile + backend Go)
 * 4. CRIAR código pronto para produção
 * 
 * FLUXO:
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  PEDIDO DO USUÁRIO                                              │
 * │         ↓                                                       │
 * │  📱 MOBILE ARCHITECT                                            │
 * │         │                                                       │
 * │         ├─→ Detecta plataforma (Android/iOS/Both)              │
 * │         ├─→ Escolhe framework ideal                            │
 * │         ├─→ Gera arquitetura mobile                            │
 * │         ├─→ Gera backend Go (se necessário)                    │
 * │         ↓                                                       │
 * │  🏗️ AURORA BUILDER (com contexto mobile)                       │
 * │         ↓                                                       │
 * │  ✅ APP MOBILE + BACKEND COMPLETO                               │
 * └─────────────────────────────────────────────────────────────────┘
 */

import { GoogleGenAI } from "@google/genai";
import { ApiKeyManager } from '../../services/ApiKeyManager';
import {
  MobilePlatform,
  MobileFramework,
  MobileAppRequest,
  MobileArchitecture,
  MOBILE_DETECTION_KEYWORDS,
  FRAMEWORK_RECOMMENDATIONS,
  MOBILE_SUPREME_MANIFEST,
  ANDROID_KOTLIN_MANIFEST,
  ANDROID_KOTLIN_PATTERNS,
  ANDROID_COMPOSE_PATTERNS,
  IOS_SWIFT_MANIFEST,
  IOS_SWIFT_PATTERNS,
  IOS_SWIFTUI_PATTERNS,
  MOBILE_BACKEND_GO_MANIFEST
} from '../../services/manifestos/MOBILE_SUPREME_MANIFEST';

// Re-export types for use by other modules
export type { MobilePlatform, MobileFramework };

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export interface MobileArchitectRequest {
  userPrompt: string;
  platform?: MobilePlatform;
  framework?: MobileFramework;
  appName?: string;
  packageName?: string;
  needsBackend?: boolean;
  complexity?: 'simple' | 'medium' | 'complex' | 'enterprise';
}

export interface MobileArchitectResult {
  platform: MobilePlatform;
  framework: MobileFramework;
  architecture: MobileArchitecture;
  auroraContext: string;
  files: MobileFile[];
  logs: string[];
}

export interface MobileFile {
  path: string;
  content: string;
  language: string;
  platform: 'android' | 'ios' | 'backend' | 'shared';
}

// ============================================================================
// DETECTORES
// ============================================================================

/**
 * Detecta se o prompt é para app mobile
 */
export function detectMobileProject(prompt: string): boolean {
  const promptLower = prompt.toLowerCase();
  
  const allKeywords = [
    ...MOBILE_DETECTION_KEYWORDS.android,
    ...MOBILE_DETECTION_KEYWORDS.ios,
    ...MOBILE_DETECTION_KEYWORDS.hybrid,
    ...MOBILE_DETECTION_KEYWORDS.webview,
    'app', 'aplicativo', 'mobile', 'celular', 'smartphone',
    'nativo', 'native'
  ];
  
  return allKeywords.some(keyword => promptLower.includes(keyword));
}

/**
 * Detecta a plataforma alvo
 */
export function detectPlatform(prompt: string): MobilePlatform {
  const promptLower = prompt.toLowerCase();
  
  const hasAndroid = MOBILE_DETECTION_KEYWORDS.android.some(k => promptLower.includes(k));
  const hasIOS = MOBILE_DETECTION_KEYWORDS.ios.some(k => promptLower.includes(k));
  const hasHybrid = MOBILE_DETECTION_KEYWORDS.hybrid.some(k => promptLower.includes(k));
  
  if (hasHybrid) return 'hybrid';
  if (hasAndroid && hasIOS) return 'both';
  if (hasAndroid) return 'android';
  if (hasIOS) return 'ios';
  
  // Default: both (mais comum)
  return 'both';
}

/**
 * Detecta/recomenda o melhor framework
 */
export function detectFramework(prompt: string, platform: MobilePlatform): MobileFramework {
  const promptLower = prompt.toLowerCase();
  
  // Detecção explícita
  if (promptLower.includes('kotlin') || promptLower.includes('jetpack compose')) {
    return 'kotlin_native';
  }
  if (promptLower.includes('swift') || promptLower.includes('swiftui')) {
    return 'swift_native';
  }
  if (promptLower.includes('react native') || promptLower.includes('expo')) {
    return 'react_native';
  }
  if (promptLower.includes('flutter') || promptLower.includes('dart')) {
    return 'flutter';
  }
  if (promptLower.includes('capacitor') || promptLower.includes('ionic')) {
    return 'capacitor';
  }
  if (promptLower.includes('webview') || promptLower.includes('pwa')) {
    return 'webview';
  }
  
  // Recomendação baseada na plataforma
  switch (platform) {
    case 'android':
      return 'kotlin_native';
    case 'ios':
      return 'swift_native';
    case 'both':
    case 'hybrid':
      // Para ambas plataformas, Flutter é a melhor escolha moderna
      return 'flutter';
    default:
      return 'kotlin_native';
  }
}

/**
 * Detecta complexidade do app
 */
export function detectComplexity(prompt: string): 'simple' | 'medium' | 'complex' | 'enterprise' {
  const promptLower = prompt.toLowerCase();
  
  const enterpriseKeywords = [
    'enterprise', 'corporativo', 'multi-tenant', 'compliance',
    'milhões de usuários', 'alta escala', 'fintech', 'banco'
  ];
  
  const complexKeywords = [
    'e-commerce', 'marketplace', 'rede social', 'streaming',
    'chat', 'video', 'pagamento', 'payment'
  ];
  
  const mediumKeywords = [
    'crud', 'dashboard', 'admin', 'lista', 'formulário',
    'autenticação', 'login'
  ];
  
  if (enterpriseKeywords.some(k => promptLower.includes(k))) return 'enterprise';
  if (complexKeywords.some(k => promptLower.includes(k))) return 'complex';
  if (mediumKeywords.some(k => promptLower.includes(k))) return 'medium';
  
  return 'simple';
}

/**
 * Extrai nome do app do prompt
 */
export function extractAppName(prompt: string): string {
  // Tenta extrair nome entre aspas
  const quotedMatch = prompt.match(/["']([^"']+)["']/);
  if (quotedMatch) return quotedMatch[1];
  
  // Tenta extrair após "chamado", "nome", "app"
  const namedMatch = prompt.match(/(?:chamado|nome|app|aplicativo)\s+(\w+)/i);
  if (namedMatch) return namedMatch[1];
  
  // Default
  return 'MyApp';
}

/**
 * Gera package name a partir do app name
 */
export function generatePackageName(appName: string): string {
  const sanitized = appName.toLowerCase().replace(/[^a-z0-9]/g, '');
  return `com.aurora.${sanitized}`;
}

// ============================================================================
// CLASSE PRINCIPAL
// ============================================================================

export class MobileArchitect {
  private genAI: GoogleGenAI | null = null;
  private logs: string[] = [];
  
  constructor() {
    const apiKey = ApiKeyManager.getKeyToUse();
    if (apiKey) {
      this.genAI = new GoogleGenAI({ apiKey });
    }
  }
  
  /**
   * 📱 MÉTODO PRINCIPAL: Gera arquitetura mobile completa
   */
  async generate(request: MobileArchitectRequest): Promise<MobileArchitectResult> {
    this.log('📱 MOBILE ARCHITECT INICIADO');
    this.log(`📝 Prompt: ${request.userPrompt}`);
    
    // Detectar plataforma e framework
    const platform = request.platform || detectPlatform(request.userPrompt);
    const framework = request.framework || detectFramework(request.userPrompt, platform);
    const complexity = request.complexity || detectComplexity(request.userPrompt);
    const appName = request.appName || extractAppName(request.userPrompt);
    const packageName = request.packageName || generatePackageName(appName);
    
    this.log(`🎯 Plataforma: ${platform}`);
    this.log(`🔧 Framework: ${framework}`);
    this.log(`📊 Complexidade: ${complexity}`);
    this.log(`📦 App: ${appName} (${packageName})`);
    
    // Gerar arquitetura
    const architecture = this.buildArchitecture(platform, framework, complexity);
    
    // Gerar arquivos
    const files = await this.generateFiles(request, platform, framework, appName, packageName);
    
    // Criar contexto para AuroraBuilder
    const auroraContext = this.createAuroraContext(platform, framework, architecture);
    
    this.log('✅ Arquitetura mobile gerada com sucesso!');
    this.log(`📁 ${files.length} arquivos gerados`);
    
    return {
      platform,
      framework,
      architecture,
      auroraContext,
      files,
      logs: [...this.logs]
    };
  }
  
  /**
   * 🏗️ Constrói arquitetura baseada nas escolhas
   */
  private buildArchitecture(
    platform: MobilePlatform,
    framework: MobileFramework,
    complexity: string
  ): MobileArchitecture {
    const architecture: MobileArchitecture = {
      platform,
      framework,
      structure: {},
      dependencies: [],
      buildConfig: {}
    };
    
    // Android
    if (platform === 'android' || platform === 'both') {
      architecture.structure.android = {
        language: 'kotlin',
        minSdk: 24,
        targetSdk: 34,
        architecture: 'mvvm',
        di: 'hilt',
        networking: 'retrofit',
        database: 'room',
        ui: 'compose',
        navigation: 'compose_nav'
      };
      
      architecture.buildConfig.android = {
        gradle: '8.2',
        agp: '8.2.0',
        kotlin: '1.9.21',
        proguard: true,
        signing: true
      };
      
      architecture.dependencies.push(
        'androidx.core:core-ktx',
        'androidx.compose.ui:ui',
        'androidx.compose.material3:material3',
        'androidx.hilt:hilt-navigation-compose',
        'com.squareup.retrofit2:retrofit',
        'androidx.room:room-runtime'
      );
    }
    
    // iOS
    if (platform === 'ios' || platform === 'both') {
      architecture.structure.ios = {
        language: 'swift',
        minVersion: '15.0',
        architecture: 'mvvm',
        ui: 'swiftui',
        networking: 'async_await',
        database: 'swiftdata',
        di: 'factory'
      };
      
      architecture.buildConfig.ios = {
        xcode: '15.0',
        swift: '5.9',
        cocoapods: false,
        spm: true
      };
    }
    
    // Backend
    if (complexity !== 'simple') {
      architecture.structure.backend = {
        language: 'go',
        framework: 'gin',
        database: 'postgresql',
        auth: 'jwt',
        api: 'rest'
      };
    }
    
    // CI/CD
    architecture.buildConfig.ci = {
      platform: 'github_actions',
      autoRelease: complexity === 'enterprise'
    };
    
    return architecture;
  }
  
  /**
   * 📁 Gera arquivos do projeto
   */
  private async generateFiles(
    request: MobileArchitectRequest,
    platform: MobilePlatform,
    framework: MobileFramework,
    appName: string,
    packageName: string
  ): Promise<MobileFile[]> {
    const files: MobileFile[] = [];
    
    // Gerar arquivos baseado no framework
    switch (framework) {
      case 'kotlin_native':
        files.push(...this.generateAndroidKotlinFiles(appName, packageName));
        break;
      case 'swift_native':
        files.push(...this.generateiOSSwiftFiles(appName));
        break;
      case 'flutter':
        files.push(...this.generateFlutterFiles(appName, packageName));
        break;
      case 'react_native':
        files.push(...this.generateReactNativeFiles(appName));
        break;
      default:
        if (platform === 'android' || platform === 'both') {
          files.push(...this.generateAndroidKotlinFiles(appName, packageName));
        }
        if (platform === 'ios' || platform === 'both') {
          files.push(...this.generateiOSSwiftFiles(appName));
        }
    }
    
    // Backend Go (se necessário)
    if (request.needsBackend !== false) {
      files.push(...this.generateBackendGoFiles(appName));
    }
    
    // Arquivos compartilhados
    files.push(...this.generateSharedFiles(appName));
    
    return files;
  }

  /**
   * 🤖 Gera arquivos Android Kotlin
   */
  private generateAndroidKotlinFiles(appName: string, packageName: string): MobileFile[] {
    const packagePath = packageName.replace(/\./g, '/');
    
    return [
      // build.gradle.kts (project)
      {
        path: 'android/build.gradle.kts',
        language: 'kotlin',
        platform: 'android',
        content: `// Top-level build file
plugins {
    id("com.android.application") version "8.2.0" apply false
    id("org.jetbrains.kotlin.android") version "1.9.21" apply false
    id("com.google.dagger.hilt.android") version "2.48" apply false
    id("com.google.devtools.ksp") version "1.9.21-1.0.15" apply false
}

tasks.register("clean", Delete::class) {
    delete(rootProject.buildDir)
}`
      },
      // build.gradle.kts (app)
      {
        path: 'android/app/build.gradle.kts',
        language: 'kotlin',
        platform: 'android',
        content: `plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("com.google.dagger.hilt.android")
    id("com.google.devtools.ksp")
}

android {
    namespace = "${packageName}"
    compileSdk = 34

    defaultConfig {
        applicationId = "${packageName}"
        minSdk = 24
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        
        buildConfigField("String", "API_BASE_URL", "\\"https://api.example.com\\"")
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
    
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    
    kotlinOptions {
        jvmTarget = "17"
    }
    
    buildFeatures {
        compose = true
        buildConfig = true
    }
    
    composeOptions {
        kotlinCompilerExtensionVersion = "1.5.6"
    }
}

dependencies {
    // Core
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.6.2")
    implementation("androidx.activity:activity-compose:1.8.1")
    
    // Compose
    implementation(platform("androidx.compose:compose-bom:2023.10.01"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
    
    // Navigation
    implementation("androidx.navigation:navigation-compose:2.7.5")
    implementation("androidx.hilt:hilt-navigation-compose:1.1.0")
    
    // Hilt
    implementation("com.google.dagger:hilt-android:2.48")
    ksp("com.google.dagger:hilt-compiler:2.48")
    
    // Retrofit
    implementation("com.squareup.retrofit2:retrofit:2.9.0")
    implementation("com.squareup.retrofit2:converter-gson:2.9.0")
    implementation("com.squareup.okhttp3:logging-interceptor:4.12.0")
    
    // Room
    implementation("androidx.room:room-runtime:2.6.1")
    implementation("androidx.room:room-ktx:2.6.1")
    ksp("androidx.room:room-compiler:2.6.1")
    
    // Coil (images)
    implementation("io.coil-kt:coil-compose:2.5.0")
    
    // DataStore
    implementation("androidx.datastore:datastore-preferences:1.0.0")
    
    // Testing
    testImplementation("junit:junit:4.13.2")
    androidTestImplementation("androidx.test.ext:junit:1.1.5")
    androidTestImplementation("androidx.compose.ui:ui-test-junit4")
    debugImplementation("androidx.compose.ui:ui-tooling")
}`
      },
      // Application class
      {
        path: `android/app/src/main/java/${packagePath}/${appName}Application.kt`,
        language: 'kotlin',
        platform: 'android',
        content: `package ${packageName}

import android.app.Application
import dagger.hilt.android.HiltAndroidApp

@HiltAndroidApp
class ${appName}Application : Application() {
    
    override fun onCreate() {
        super.onCreate()
        // Initialize any global configurations here
    }
}`
      },
      // MainActivity
      {
        path: `android/app/src/main/java/${packagePath}/MainActivity.kt`,
        language: 'kotlin',
        platform: 'android',
        content: `package ${packageName}

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import dagger.hilt.android.AndroidEntryPoint
import ${packageName}.presentation.navigation.AppNavigation
import ${packageName}.presentation.ui.theme.${appName}Theme

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            ${appName}Theme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    AppNavigation()
                }
            }
        }
    }
}`
      },
      // Navigation
      {
        path: `android/app/src/main/java/${packagePath}/presentation/navigation/AppNavigation.kt`,
        language: 'kotlin',
        platform: 'android',
        content: `package ${packageName}.presentation.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import ${packageName}.presentation.ui.screens.home.HomeScreen
import ${packageName}.presentation.ui.screens.auth.LoginScreen

sealed class Screen(val route: String) {
    object Login : Screen("login")
    object Home : Screen("home")
    object Detail : Screen("detail/{id}") {
        fun createRoute(id: String) = "detail/\$id"
    }
}

@Composable
fun AppNavigation(
    navController: NavHostController = rememberNavController()
) {
    NavHost(
        navController = navController,
        startDestination = Screen.Login.route
    ) {
        composable(Screen.Login.route) {
            LoginScreen(
                onLoginSuccess = {
                    navController.navigate(Screen.Home.route) {
                        popUpTo(Screen.Login.route) { inclusive = true }
                    }
                }
            )
        }
        
        composable(Screen.Home.route) {
            HomeScreen(
                onNavigateToDetail = { id ->
                    navController.navigate(Screen.Detail.createRoute(id))
                }
            )
        }
    }
}`
      },
      // Resource wrapper
      {
        path: `android/app/src/main/java/${packagePath}/util/Resource.kt`,
        language: 'kotlin',
        platform: 'android',
        content: `package ${packageName}.util

sealed class Resource<T>(
    val data: T? = null,
    val message: String? = null
) {
    class Success<T>(data: T) : Resource<T>(data)
    class Error<T>(message: String, data: T? = null) : Resource<T>(data, message)
    class Loading<T>(data: T? = null) : Resource<T>(data)
}`
      },
      // AndroidManifest
      {
        path: 'android/app/src/main/AndroidManifest.xml',
        language: 'xml',
        platform: 'android',
        content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <application
        android:name=".${appName}Application"
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.${appName}"
        android:usesCleartextTraffic="true">
        
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:theme="@style/Theme.${appName}">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>

</manifest>`
      }
    ];
  }

  /**
   * 🍎 Gera arquivos iOS Swift
   */
  private generateiOSSwiftFiles(appName: string): MobileFile[] {
    return [
      // App Entry Point
      {
        path: `ios/${appName}/${appName}App.swift`,
        language: 'swift',
        platform: 'ios',
        content: `import SwiftUI

@main
struct ${appName}App: App {
    @StateObject private var appState = AppState()
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(appState)
        }
    }
}

// MARK: - App State
@MainActor
final class AppState: ObservableObject {
    @Published var isAuthenticated = false
    @Published var currentUser: User?
    
    private let authService = Container.shared.authService
    
    init() {
        checkAuthStatus()
    }
    
    func checkAuthStatus() {
        isAuthenticated = authService.isAuthenticated
        if isAuthenticated {
            Task {
                currentUser = try? await authService.getCurrentUser()
            }
        }
    }
    
    func logout() {
        authService.logout()
        isAuthenticated = false
        currentUser = nil
    }
}`
      },
      // ContentView
      {
        path: `ios/${appName}/${appName}/ContentView.swift`,
        language: 'swift',
        platform: 'ios',
        content: `import SwiftUI

struct ContentView: View {
    @EnvironmentObject var appState: AppState
    
    var body: some View {
        Group {
            if appState.isAuthenticated {
                MainTabView()
            } else {
                LoginView()
            }
        }
        .animation(.easeInOut, value: appState.isAuthenticated)
    }
}

#Preview {
    ContentView()
        .environmentObject(AppState())
}`
      },
      // Container (DI)
      {
        path: `ios/${appName}/Core/DI/Container.swift`,
        language: 'swift',
        platform: 'ios',
        content: `import Foundation

final class Container {
    static let shared = Container()
    
    private init() {}
    
    // MARK: - Network
    lazy var apiClient: APIClientProtocol = {
        APIClient(
            baseURL: Environment.apiBaseURL,
            interceptors: [AuthInterceptor(tokenManager: tokenManager)]
        )
    }()
    
    // MARK: - Storage
    lazy var tokenManager: TokenManagerProtocol = {
        KeychainTokenManager()
    }()
    
    lazy var userDefaults: UserDefaultsManagerProtocol = {
        UserDefaultsManager()
    }()
    
    // MARK: - Services
    lazy var authService: AuthServiceProtocol = {
        AuthService(
            apiClient: apiClient,
            tokenManager: tokenManager
        )
    }()
    
    lazy var userService: UserServiceProtocol = {
        UserService(apiClient: apiClient)
    }()
    
    // MARK: - Use Cases
    func makeLoginUseCase() -> LoginUseCase {
        LoginUseCase(authService: authService)
    }
    
    func makeGetUsersUseCase() -> GetUsersUseCase {
        GetUsersUseCase(userService: userService)
    }
}`
      },
      // API Client
      {
        path: `ios/${appName}/Core/Network/APIClient.swift`,
        language: 'swift',
        platform: 'ios',
        content: `import Foundation

protocol APIClientProtocol {
    func request<T: Decodable>(_ endpoint: APIEndpoint) async throws -> T
}

final class APIClient: APIClientProtocol {
    private let baseURL: URL
    private let session: URLSession
    private let interceptors: [RequestInterceptor]
    private let decoder: JSONDecoder
    
    init(
        baseURL: URL,
        session: URLSession = .shared,
        interceptors: [RequestInterceptor] = []
    ) {
        self.baseURL = baseURL
        self.session = session
        self.interceptors = interceptors
        self.decoder = JSONDecoder()
        self.decoder.keyDecodingStrategy = .convertFromSnakeCase
        self.decoder.dateDecodingStrategy = .iso8601
    }
    
    func request<T: Decodable>(_ endpoint: APIEndpoint) async throws -> T {
        var request = try buildRequest(for: endpoint)
        
        for interceptor in interceptors {
            request = try await interceptor.intercept(request)
        }
        
        let (data, response) = try await session.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw NetworkError.invalidResponse
        }
        
        switch httpResponse.statusCode {
        case 200...299:
            return try decoder.decode(T.self, from: data)
        case 401:
            throw NetworkError.unauthorized
        case 404:
            throw NetworkError.notFound
        case 500...599:
            throw NetworkError.serverError(httpResponse.statusCode)
        default:
            throw NetworkError.unknown(httpResponse.statusCode)
        }
    }
    
    private func buildRequest(for endpoint: APIEndpoint) throws -> URLRequest {
        let url = baseURL.appendingPathComponent(endpoint.path)
        var components = URLComponents(url: url, resolvingAgainstBaseURL: true)
        components?.queryItems = endpoint.queryItems
        
        guard let finalURL = components?.url else {
            throw NetworkError.invalidURL
        }
        
        var request = URLRequest(url: finalURL)
        request.httpMethod = endpoint.method.rawValue
        request.allHTTPHeaderFields = endpoint.headers
        
        if let body = endpoint.body {
            request.httpBody = try JSONEncoder().encode(body)
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        }
        
        return request
    }
}

// MARK: - Network Error
enum NetworkError: LocalizedError {
    case invalidURL
    case invalidResponse
    case unauthorized
    case notFound
    case serverError(Int)
    case unknown(Int)
    
    var errorDescription: String? {
        switch self {
        case .invalidURL: return "URL inválida"
        case .invalidResponse: return "Resposta inválida"
        case .unauthorized: return "Não autorizado"
        case .notFound: return "Não encontrado"
        case .serverError(let code): return "Erro do servidor: \\(code)"
        case .unknown(let code): return "Erro desconhecido: \\(code)"
        }
    }
}`
      },
      // User Model
      {
        path: `ios/${appName}/Domain/Models/User.swift`,
        language: 'swift',
        platform: 'ios',
        content: `import Foundation

struct User: Identifiable, Codable, Hashable {
    let id: String
    let name: String
    let email: String
    let avatarUrl: String?
    let createdAt: Date
    
    init(id: String, name: String, email: String, avatarUrl: String? = nil, createdAt: Date = Date()) {
        self.id = id
        self.name = name
        self.email = email
        self.avatarUrl = avatarUrl
        self.createdAt = createdAt
    }
}

// MARK: - DTO
struct UserDTO: Codable {
    let id: String
    let name: String
    let email: String
    let avatarUrl: String?
    let createdAt: String
    
    func toDomain() -> User {
        User(
            id: id,
            name: name,
            email: email,
            avatarUrl: avatarUrl,
            createdAt: ISO8601DateFormatter().date(from: createdAt) ?? Date()
        )
    }
}`
      },
      // Login View
      {
        path: `ios/${appName}/Presentation/Features/Auth/LoginView.swift`,
        language: 'swift',
        platform: 'ios',
        content: `import SwiftUI

struct LoginView: View {
    @StateObject private var viewModel = LoginViewModel()
    @EnvironmentObject var appState: AppState
    
    var body: some View {
        NavigationStack {
            VStack(spacing: 24) {
                Spacer()
                
                // Logo
                Image(systemName: "app.fill")
                    .font(.system(size: 80))
                    .foregroundStyle(.blue)
                
                Text("${appName}")
                    .font(.largeTitle.bold())
                
                Spacer()
                
                // Form
                VStack(spacing: 16) {
                    TextField("Email", text: $viewModel.email)
                        .textFieldStyle(.roundedBorder)
                        .textContentType(.emailAddress)
                        .keyboardType(.emailAddress)
                        .autocapitalization(.none)
                    
                    SecureField("Senha", text: $viewModel.password)
                        .textFieldStyle(.roundedBorder)
                        .textContentType(.password)
                    
                    if let error = viewModel.error {
                        Text(error)
                            .foregroundStyle(.red)
                            .font(.caption)
                    }
                    
                    Button(action: login) {
                        if viewModel.isLoading {
                            ProgressView()
                                .tint(.white)
                        } else {
                            Text("Entrar")
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.blue)
                    .foregroundStyle(.white)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                    .disabled(viewModel.isLoading || !viewModel.isValid)
                }
                .padding(.horizontal)
                
                Spacer()
            }
            .navigationTitle("Login")
            .navigationBarTitleDisplayMode(.inline)
        }
    }
    
    private func login() {
        Task {
            if await viewModel.login() {
                appState.checkAuthStatus()
            }
        }
    }
}

// MARK: - ViewModel
@MainActor
final class LoginViewModel: ObservableObject {
    @Published var email = ""
    @Published var password = ""
    @Published var isLoading = false
    @Published var error: String?
    
    private let loginUseCase = Container.shared.makeLoginUseCase()
    
    var isValid: Bool {
        !email.isEmpty && password.count >= 6
    }
    
    func login() async -> Bool {
        isLoading = true
        error = nil
        
        do {
            try await loginUseCase.execute(email: email, password: password)
            isLoading = false
            return true
        } catch {
            self.error = error.localizedDescription
            isLoading = false
            return false
        }
    }
}

#Preview {
    LoginView()
        .environmentObject(AppState())
}`
      }
    ];
  }

  /**
   * 🔧 Gera arquivos Backend Go
   */
  private generateBackendGoFiles(appName: string): MobileFile[] {
    const appNameLower = appName.toLowerCase();
    
    return [
      // main.go
      {
        path: 'backend/cmd/api/main.go',
        language: 'go',
        platform: 'backend',
        content: `package main

import (
    "context"
    "log"
    "net/http"
    "os"
    "os/signal"
    "syscall"
    "time"

    "github.com/gin-gonic/gin"
    "${appNameLower}/internal/config"
    "${appNameLower}/internal/handler"
    "${appNameLower}/internal/middleware"
    "${appNameLower}/internal/repository"
    "${appNameLower}/internal/service"
    "${appNameLower}/internal/infrastructure/database"
)

func main() {
    // Load config
    cfg, err := config.Load()
    if err != nil {
        log.Fatalf("Failed to load config: %v", err)
    }

    // Database
    db, err := database.NewPostgres(cfg.DatabaseURL)
    if err != nil {
        log.Fatalf("Failed to connect to database: %v", err)
    }
    defer db.Close()

    // Repositories
    userRepo := repository.NewUserRepository(db)
    deviceRepo := repository.NewDeviceRepository(db)

    // Services
    authService := service.NewAuthService(userRepo, deviceRepo, cfg.JWTSecret)
    userService := service.NewUserService(userRepo)

    // Handlers
    authHandler := handler.NewAuthHandler(authService)
    userHandler := handler.NewUserHandler(userService)

    // Router
    if cfg.Environment == "production" {
        gin.SetMode(gin.ReleaseMode)
    }
    
    r := gin.Default()
    
    // Middleware
    r.Use(middleware.CORS())
    r.Use(middleware.RequestID())
    r.Use(middleware.Logger())
    r.Use(middleware.RateLimiter(100, time.Minute))

    // Routes
    api := r.Group("/api/v1")
    {
        // Public routes
        auth := api.Group("/auth")
        {
            auth.POST("/register", authHandler.Register)
            auth.POST("/login", authHandler.Login)
            auth.POST("/refresh", authHandler.RefreshToken)
        }

        // Protected routes
        protected := api.Group("")
        protected.Use(middleware.Auth(cfg.JWTSecret))
        {
            protected.GET("/users", userHandler.GetUsers)
            protected.GET("/users/:id", userHandler.GetUser)
            protected.PUT("/users/:id", userHandler.UpdateUser)
            protected.DELETE("/users/:id", userHandler.DeleteUser)
            
            protected.GET("/me", userHandler.GetCurrentUser)
            protected.PUT("/me", userHandler.UpdateCurrentUser)
            
            protected.POST("/auth/logout", authHandler.Logout)
        }
    }

    // Health check
    r.GET("/health", func(c *gin.Context) {
        c.JSON(http.StatusOK, gin.H{"status": "ok"})
    })

    // Server
    srv := &http.Server{
        Addr:         ":" + cfg.Port,
        Handler:      r,
        ReadTimeout:  15 * time.Second,
        WriteTimeout: 15 * time.Second,
        IdleTimeout:  60 * time.Second,
    }

    // Graceful shutdown
    go func() {
        log.Printf("Server starting on port %s", cfg.Port)
        if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
            log.Fatalf("Server failed: %v", err)
        }
    }()

    quit := make(chan os.Signal, 1)
    signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
    <-quit

    log.Println("Shutting down server...")
    ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
    defer cancel()

    if err := srv.Shutdown(ctx); err != nil {
        log.Fatalf("Server forced to shutdown: %v", err)
    }

    log.Println("Server exited")
}`
      },
      // Config
      {
        path: 'backend/internal/config/config.go',
        language: 'go',
        platform: 'backend',
        content: `package config

import (
    "os"
    "time"
)

type Config struct {
    Environment  string
    Port         string
    DatabaseURL  string
    JWTSecret    []byte
    AccessTTL    time.Duration
    RefreshTTL   time.Duration
    FCMCredFile  string
}

func Load() (*Config, error) {
    return &Config{
        Environment:  getEnv("ENVIRONMENT", "development"),
        Port:         getEnv("PORT", "8080"),
        DatabaseURL:  getEnv("DATABASE_URL", "postgres://localhost:5432/${appNameLower}?sslmode=disable"),
        JWTSecret:    []byte(getEnv("JWT_SECRET", "your-secret-key-change-in-production")),
        AccessTTL:    15 * time.Minute,
        RefreshTTL:   7 * 24 * time.Hour,
        FCMCredFile:  getEnv("FCM_CREDENTIALS_FILE", ""),
    }, nil
}

func getEnv(key, defaultValue string) string {
    if value := os.Getenv(key); value != "" {
        return value
    }
    return defaultValue
}`
      },
      // Auth Handler
      {
        path: 'backend/internal/handler/auth_handler.go',
        language: 'go',
        platform: 'backend',
        content: `package handler

import (
    "net/http"

    "github.com/gin-gonic/gin"
    "${appNameLower}/internal/service"
)

type AuthHandler struct {
    authService *service.AuthService
}

func NewAuthHandler(authService *service.AuthService) *AuthHandler {
    return &AuthHandler{authService: authService}
}

type RegisterRequest struct {
    Name     string \`json:"name" binding:"required,min=2"\`
    Email    string \`json:"email" binding:"required,email"\`
    Password string \`json:"password" binding:"required,min=6"\`
}

type LoginRequest struct {
    Email    string \`json:"email" binding:"required,email"\`
    Password string \`json:"password" binding:"required"\`
    DeviceID string \`json:"device_id" binding:"required"\`
}

type RefreshRequest struct {
    RefreshToken string \`json:"refresh_token" binding:"required"\`
}

func (h *AuthHandler) Register(c *gin.Context) {
    var req RegisterRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    user, err := h.authService.Register(c.Request.Context(), req.Name, req.Email, req.Password)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    c.JSON(http.StatusCreated, gin.H{"user": user})
}

func (h *AuthHandler) Login(c *gin.Context) {
    var req LoginRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    tokens, err := h.authService.Login(c.Request.Context(), req.Email, req.Password, req.DeviceID)
    if err != nil {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
        return
    }

    c.JSON(http.StatusOK, tokens)
}

func (h *AuthHandler) RefreshToken(c *gin.Context) {
    var req RefreshRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    tokens, err := h.authService.RefreshToken(c.Request.Context(), req.RefreshToken)
    if err != nil {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
        return
    }

    c.JSON(http.StatusOK, tokens)
}

func (h *AuthHandler) Logout(c *gin.Context) {
    userID := c.GetString("user_id")
    deviceID := c.GetString("device_id")

    if err := h.authService.Logout(c.Request.Context(), userID, deviceID); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    c.JSON(http.StatusOK, gin.H{"message": "Logged out successfully"})
}`
      },
      // Auth Middleware
      {
        path: 'backend/internal/middleware/auth.go',
        language: 'go',
        platform: 'backend',
        content: `package middleware

import (
    "net/http"
    "strings"

    "github.com/gin-gonic/gin"
    "github.com/golang-jwt/jwt/v5"
)

func Auth(jwtSecret []byte) gin.HandlerFunc {
    return func(c *gin.Context) {
        authHeader := c.GetHeader("Authorization")
        if authHeader == "" {
            c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
            return
        }

        parts := strings.Split(authHeader, " ")
        if len(parts) != 2 || parts[0] != "Bearer" {
            c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid authorization header"})
            return
        }

        tokenString := parts[1]
        
        token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
            if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
                return nil, jwt.ErrSignatureInvalid
            }
            return jwtSecret, nil
        })

        if err != nil || !token.Valid {
            c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
            return
        }

        claims, ok := token.Claims.(jwt.MapClaims)
        if !ok {
            c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid token claims"})
            return
        }

        c.Set("user_id", claims["user_id"])
        c.Set("device_id", claims["device_id"])
        c.Next()
    }
}`
      },
      // Docker Compose
      {
        path: 'backend/docker-compose.yml',
        language: 'yaml',
        platform: 'backend',
        content: `version: '3.8'

services:
  api:
    build: .
    ports:
      - "8080:8080"
    environment:
      - ENVIRONMENT=development
      - PORT=8080
      - DATABASE_URL=postgres://postgres:postgres@db:5432/${appNameLower}?sslmode=disable
      - JWT_SECRET=your-secret-key-change-in-production
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped

  db:
    image: postgres:16-alpine
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=${appNameLower}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:`
      },
      // Dockerfile
      {
        path: 'backend/Dockerfile',
        language: 'dockerfile',
        platform: 'backend',
        content: `# Build stage
FROM golang:1.21-alpine AS builder

WORKDIR /app

# Install dependencies
RUN apk add --no-cache git

# Copy go mod files
COPY go.mod go.sum ./
RUN go mod download

# Copy source
COPY . .

# Build
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main ./cmd/api

# Final stage
FROM alpine:3.19

RUN apk --no-cache add ca-certificates tzdata

WORKDIR /app

COPY --from=builder /app/main .

EXPOSE 8080

CMD ["./main"]`
      }
    ];
  }

  /**
   * 🦋 Gera arquivos Flutter
   */
  private generateFlutterFiles(appName: string, packageName: string): MobileFile[] {
    const appNameSnake = appName.toLowerCase().replace(/([A-Z])/g, '_$1').replace(/^_/, '');
    
    return [
      // pubspec.yaml
      {
        path: 'flutter/pubspec.yaml',
        language: 'yaml',
        platform: 'shared',
        content: `name: ${appNameSnake}
description: ${appName} - Cross-platform mobile app
publish_to: 'none'
version: 1.0.0+1

environment:
  sdk: '>=3.2.0 <4.0.0'

dependencies:
  flutter:
    sdk: flutter
  
  # State Management
  flutter_riverpod: ^2.4.9
  riverpod_annotation: ^2.3.3
  
  # Navigation
  go_router: ^13.0.0
  
  # Network
  dio: ^5.4.0
  retrofit: ^4.0.3
  
  # Local Storage
  hive: ^2.2.3
  hive_flutter: ^1.1.0
  flutter_secure_storage: ^9.0.0
  
  # UI
  flutter_svg: ^2.0.9
  cached_network_image: ^3.3.1
  shimmer: ^3.0.0
  
  # Utils
  freezed_annotation: ^2.4.1
  json_annotation: ^4.8.1
  intl: ^0.18.1

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^3.0.1
  build_runner: ^2.4.8
  freezed: ^2.4.6
  json_serializable: ^6.7.1
  retrofit_generator: ^8.0.6
  riverpod_generator: ^2.3.9

flutter:
  uses-material-design: true
  
  assets:
    - assets/images/
    - assets/icons/`
      },
      // main.dart
      {
        path: 'flutter/lib/main.dart',
        language: 'dart',
        platform: 'shared',
        content: `import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_flutter/hive_flutter.dart';

import 'core/router/app_router.dart';
import 'core/theme/app_theme.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize Hive
  await Hive.initFlutter();
  
  runApp(
    const ProviderScope(
      child: ${appName}App(),
    ),
  );
}

class ${appName}App extends ConsumerWidget {
  const ${appName}App({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);
    
    return MaterialApp.router(
      title: '${appName}',
      theme: AppTheme.light,
      darkTheme: AppTheme.dark,
      themeMode: ThemeMode.system,
      routerConfig: router,
      debugShowCheckedModeBanner: false,
    );
  }
}`
      },
      // App Router
      {
        path: 'flutter/lib/core/router/app_router.dart',
        language: 'dart',
        platform: 'shared',
        content: `import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/presentation/login_screen.dart';
import '../../features/home/presentation/home_screen.dart';
import '../../features/splash/presentation/splash_screen.dart';
import '../providers/auth_provider.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authStateProvider);
  
  return GoRouter(
    initialLocation: '/splash',
    redirect: (context, state) {
      final isLoggedIn = authState.isAuthenticated;
      final isLoggingIn = state.matchedLocation == '/login';
      final isSplash = state.matchedLocation == '/splash';
      
      if (isSplash) return null;
      
      if (!isLoggedIn && !isLoggingIn) {
        return '/login';
      }
      
      if (isLoggedIn && isLoggingIn) {
        return '/home';
      }
      
      return null;
    },
    routes: [
      GoRoute(
        path: '/splash',
        builder: (context, state) => const SplashScreen(),
      ),
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/home',
        builder: (context, state) => const HomeScreen(),
      ),
    ],
  );
});`
      },
      // Auth Provider
      {
        path: 'flutter/lib/core/providers/auth_provider.dart',
        language: 'dart',
        platform: 'shared',
        content: `import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../../data/repositories/auth_repository.dart';
import '../../domain/models/user.dart';

class AuthState {
  final bool isAuthenticated;
  final User? user;
  final bool isLoading;
  final String? error;

  const AuthState({
    this.isAuthenticated = false,
    this.user,
    this.isLoading = false,
    this.error,
  });

  AuthState copyWith({
    bool? isAuthenticated,
    User? user,
    bool? isLoading,
    String? error,
  }) {
    return AuthState(
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      user: user ?? this.user,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  final AuthRepository _authRepository;
  final FlutterSecureStorage _storage;

  AuthNotifier(this._authRepository, this._storage) : super(const AuthState());

  Future<void> checkAuthStatus() async {
    final token = await _storage.read(key: 'access_token');
    if (token != null) {
      try {
        final user = await _authRepository.getCurrentUser();
        state = state.copyWith(isAuthenticated: true, user: user);
      } catch (_) {
        await logout();
      }
    }
  }

  Future<bool> login(String email, String password, String deviceId) async {
    state = state.copyWith(isLoading: true, error: null);
    
    try {
      final tokens = await _authRepository.login(email, password, deviceId);
      await _storage.write(key: 'access_token', value: tokens.accessToken);
      await _storage.write(key: 'refresh_token', value: tokens.refreshToken);
      
      final user = await _authRepository.getCurrentUser();
      state = state.copyWith(
        isAuthenticated: true,
        user: user,
        isLoading: false,
      );
      return true;
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
      return false;
    }
  }

  Future<void> logout() async {
    await _storage.deleteAll();
    state = const AuthState();
  }
}

final authStateProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  final authRepository = ref.watch(authRepositoryProvider);
  const storage = FlutterSecureStorage();
  return AuthNotifier(authRepository, storage);
});`
      },
      // Theme
      {
        path: 'flutter/lib/core/theme/app_theme.dart',
        language: 'dart',
        platform: 'shared',
        content: `import 'package:flutter/material.dart';

class AppTheme {
  static ThemeData get light {
    return ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: Colors.blue,
        brightness: Brightness.light,
      ),
      appBarTheme: const AppBarTheme(
        centerTitle: true,
        elevation: 0,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
      ),
    );
  }

  static ThemeData get dark {
    return ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: Colors.blue,
        brightness: Brightness.dark,
      ),
      appBarTheme: const AppBarTheme(
        centerTitle: true,
        elevation: 0,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
      ),
    );
  }
}`
      }
    ];
  }

  /**
   * ⚛️ Gera arquivos React Native
   */
  private generateReactNativeFiles(appName: string): MobileFile[] {
    return [
      {
        path: 'react-native/package.json',
        language: 'json',
        platform: 'shared',
        content: `{
  "name": "${appName.toLowerCase()}",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "android": "react-native run-android",
    "ios": "react-native run-ios",
    "start": "react-native start",
    "test": "jest",
    "lint": "eslint ."
  },
  "dependencies": {
    "react": "18.2.0",
    "react-native": "0.73.0",
    "@react-navigation/native": "^6.1.9",
    "@react-navigation/native-stack": "^6.9.17",
    "@tanstack/react-query": "^5.17.0",
    "zustand": "^4.4.7",
    "axios": "^1.6.5",
    "react-native-safe-area-context": "^4.8.2",
    "react-native-screens": "^3.29.0",
    "react-native-keychain": "^8.1.2"
  },
  "devDependencies": {
    "@babel/core": "^7.23.7",
    "@babel/preset-env": "^7.23.7",
    "@babel/runtime": "^7.23.7",
    "@types/react": "^18.2.47",
    "typescript": "^5.3.3",
    "jest": "^29.7.0"
  }
}`
      }
    ];
  }

  /**
   * 📄 Gera arquivos compartilhados (README, CI/CD, etc)
   */
  private generateSharedFiles(appName: string): MobileFile[] {
    return [
      // README
      {
        path: 'README.md',
        language: 'markdown',
        platform: 'shared',
        content: `# ${appName}

Mobile application generated by Aurora Mobile Architect.

## 📱 Platforms

- **Android**: Kotlin + Jetpack Compose
- **iOS**: Swift + SwiftUI
- **Backend**: Go + Gin + PostgreSQL

## 🚀 Getting Started

### Prerequisites

- Android Studio (for Android)
- Xcode 15+ (for iOS)
- Go 1.21+ (for Backend)
- Docker & Docker Compose

### Backend

\`\`\`bash
cd backend
docker-compose up -d
\`\`\`

API will be available at \`http://localhost:8080\`

### Android

\`\`\`bash
cd android
./gradlew assembleDebug
\`\`\`

### iOS

\`\`\`bash
cd ios
pod install
open ${appName}.xcworkspace
\`\`\`

## 🏗️ Architecture

### Mobile (Android/iOS)
- **Clean Architecture** + **MVVM**
- Repository Pattern
- Use Cases
- Dependency Injection

### Backend
- **Hexagonal Architecture**
- JWT Authentication
- PostgreSQL + Redis
- Docker ready

## 📁 Project Structure

\`\`\`
${appName}/
├── android/          # Android app (Kotlin)
├── ios/              # iOS app (Swift)
├── backend/          # Go API
├── docs/             # Documentation
└── .github/          # CI/CD workflows
\`\`\`

## 🔐 Environment Variables

### Backend
\`\`\`env
ENVIRONMENT=development
PORT=8080
DATABASE_URL=postgres://...
JWT_SECRET=your-secret
\`\`\`

## 📄 License

MIT License
`
      },
      // GitHub Actions - Android
      {
        path: '.github/workflows/android.yml',
        language: 'yaml',
        platform: 'shared',
        content: `name: Android CI

on:
  push:
    branches: [main]
    paths:
      - 'android/**'
  pull_request:
    branches: [main]
    paths:
      - 'android/**'

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'
          cache: gradle
      
      - name: Grant execute permission for gradlew
        run: chmod +x android/gradlew
        
      - name: Build with Gradle
        working-directory: android
        run: ./gradlew build
        
      - name: Run tests
        working-directory: android
        run: ./gradlew test
        
      - name: Build APK
        working-directory: android
        run: ./gradlew assembleRelease
        
      - name: Upload APK
        uses: actions/upload-artifact@v4
        with:
          name: app-release
          path: android/app/build/outputs/apk/release/*.apk`
      },
      // GitHub Actions - iOS
      {
        path: '.github/workflows/ios.yml',
        language: 'yaml',
        platform: 'shared',
        content: `name: iOS CI

on:
  push:
    branches: [main]
    paths:
      - 'ios/**'
  pull_request:
    branches: [main]
    paths:
      - 'ios/**'

jobs:
  build:
    runs-on: macos-14
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Select Xcode
        run: sudo xcode-select -s /Applications/Xcode_15.2.app
        
      - name: Build
        working-directory: ios
        run: |
          xcodebuild build \\
            -scheme ${appName} \\
            -destination 'platform=iOS Simulator,name=iPhone 15' \\
            -configuration Debug \\
            CODE_SIGNING_ALLOWED=NO
            
      - name: Run tests
        working-directory: ios
        run: |
          xcodebuild test \\
            -scheme ${appName} \\
            -destination 'platform=iOS Simulator,name=iPhone 15' \\
            -configuration Debug \\
            CODE_SIGNING_ALLOWED=NO`
      },
      // GitHub Actions - Backend
      {
        path: '.github/workflows/backend.yml',
        language: 'yaml',
        platform: 'shared',
        content: `name: Backend CI

on:
  push:
    branches: [main]
    paths:
      - 'backend/**'
  pull_request:
    branches: [main]
    paths:
      - 'backend/**'

jobs:
  build:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Go
        uses: actions/setup-go@v5
        with:
          go-version: '1.21'
          cache-dependency-path: backend/go.sum
          
      - name: Build
        working-directory: backend
        run: go build -v ./...
        
      - name: Test
        working-directory: backend
        run: go test -v -race -coverprofile=coverage.out ./...
        env:
          DATABASE_URL: postgres://postgres:postgres@localhost:5432/test?sslmode=disable
          
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: backend/coverage.out`
      }
    ];
  }

  /**
   * 🌉 Cria contexto para AuroraBuilder
   */
  private createAuroraContext(
    platform: MobilePlatform,
    framework: MobileFramework,
    architecture: MobileArchitecture
  ): string {
    let manifest = MOBILE_SUPREME_MANIFEST;
    
    // Adicionar manifestos específicos
    if (framework === 'kotlin_native' || platform === 'android') {
      manifest += '\n\n' + ANDROID_KOTLIN_MANIFEST;
      manifest += '\n\n' + ANDROID_KOTLIN_PATTERNS;
      manifest += '\n\n' + ANDROID_COMPOSE_PATTERNS;
    }
    
    if (framework === 'swift_native' || platform === 'ios') {
      manifest += '\n\n' + IOS_SWIFT_MANIFEST;
      manifest += '\n\n' + IOS_SWIFT_PATTERNS;
      manifest += '\n\n' + IOS_SWIFTUI_PATTERNS;
    }
    
    if (architecture.structure.backend) {
      manifest += '\n\n' + MOBILE_BACKEND_GO_MANIFEST;
    }
    
    return `
═══════════════════════════════════════════════════════════════════════════════
📱 MOBILE ARCHITECT CONTEXT
═══════════════════════════════════════════════════════════════════════════════

🎯 PLATAFORMA: ${platform}
🔧 FRAMEWORK: ${framework}
📊 ARQUITETURA: Clean Architecture + MVVM

${manifest}

═══════════════════════════════════════════════════════════════════════════════
⚠️ IMPORTANTE: O código gerado DEVE seguir esta arquitetura mobile!
═══════════════════════════════════════════════════════════════════════════════
`;
  }

  /**
   * 📝 Log helper
   */
  private log(message: string): void {
    this.logs.push(message);
    console.log(message);
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default MobileArchitect;
