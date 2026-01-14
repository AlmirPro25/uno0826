/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║     📱 MOBILE SUPREME MANIFEST - ARQUITETO MOBILE DEFINITIVO 📱             ║
 * ║                                                                              ║
 * ║     "DO NAVEGADOR AO BOLSO - APPS NATIVOS COM ALMA DE BIG TECH"             ║
 * ║                                                                              ║
 * ║     NÍVEL: 95 (Mobile Architect Supreme)                                    ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 * 
 * CAPACIDADES:
 * - Android Nativo (Kotlin/Java)
 * - iOS Nativo (Swift/SwiftUI)
 * - Híbrido (React Native, Flutter, Capacitor)
 * - WebView Apps (PWA embarcado)
 * - Backend Go integrado
 * - Autenticação completa
 * - Push Notifications
 * - Deep Linking
 * - App Store / Play Store ready
 */

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export type MobilePlatform = 'android' | 'ios' | 'both' | 'hybrid';
export type MobileFramework = 
  | 'kotlin_native'      // Android Nativo com Kotlin
  | 'swift_native'       // iOS Nativo com Swift/SwiftUI
  | 'react_native'       // Cross-platform React Native
  | 'flutter'            // Cross-platform Flutter/Dart
  | 'capacitor'          // Web → Mobile (Ionic/Capacitor)
  | 'webview'            // PWA em WebView
  | 'kotlin_multiplatform'; // KMP - Kotlin Multiplatform

export type AppComplexity = 'simple' | 'medium' | 'complex' | 'enterprise';

export interface MobileAppRequest {
  platform: MobilePlatform;
  framework?: MobileFramework;
  appName: string;
  packageName: string; // com.example.app
  description: string;
  features: string[];
  needsBackend: boolean;
  needsAuth: boolean;
  needsDatabase: boolean;
  needsPushNotifications: boolean;
  needsOfflineSupport: boolean;
  complexity: AppComplexity;
}

export interface MobileArchitecture {
  platform: MobilePlatform;
  framework: MobileFramework;
  structure: {
    android?: AndroidStructure;
    ios?: iOSStructure;
    shared?: SharedStructure;
    backend?: BackendStructure;
  };
  dependencies: string[];
  buildConfig: BuildConfig;
}

export interface AndroidStructure {
  language: 'kotlin' | 'java';
  minSdk: number;
  targetSdk: number;
  architecture: 'mvvm' | 'mvi' | 'clean';
  di: 'hilt' | 'koin' | 'dagger';
  networking: 'retrofit' | 'ktor';
  database: 'room' | 'realm' | 'sqldelight';
  ui: 'compose' | 'xml' | 'hybrid';
  navigation: 'compose_nav' | 'navigation_component';
}

export interface iOSStructure {
  language: 'swift';
  minVersion: string; // "15.0"
  architecture: 'mvvm' | 'viper' | 'clean';
  ui: 'swiftui' | 'uikit' | 'hybrid';
  networking: 'urlsession' | 'alamofire' | 'async_await';
  database: 'coredata' | 'realm' | 'swiftdata';
  di: 'swinject' | 'factory' | 'manual';
}

export interface SharedStructure {
  framework: 'react_native' | 'flutter' | 'kmp';
  stateManagement: string;
  navigation: string;
  styling: string;
}

export interface BackendStructure {
  language: 'go' | 'node' | 'python';
  framework: string;
  database: string;
  auth: string;
  api: 'rest' | 'graphql' | 'grpc';
}

export interface BuildConfig {
  android?: {
    gradle: string;
    agp: string; // Android Gradle Plugin
    kotlin: string;
    proguard: boolean;
    signing: boolean;
  };
  ios?: {
    xcode: string;
    swift: string;
    cocoapods: boolean;
    spm: boolean; // Swift Package Manager
  };
  ci?: {
    platform: 'github_actions' | 'fastlane' | 'bitrise' | 'codemagic';
    autoRelease: boolean;
  };
}

// ============================================================================
// MANIFESTO PRINCIPAL - ANDROID NATIVO (KOTLIN)
// ============================================================================

export const ANDROID_KOTLIN_MANIFEST = `
╔══════════════════════════════════════════════════════════════════════════════╗
║                    🤖 ANDROID KOTLIN SUPREME ARCHITECT 🤖                    ║
╚══════════════════════════════════════════════════════════════════════════════╝

Você é um ARQUITETO ANDROID SÊNIOR com 10+ anos de experiência em apps nativos.

═══════════════════════════════════════════════════════════════════════════════
🏗️ ARQUITETURA OBRIGATÓRIA: CLEAN ARCHITECTURE + MVVM
═══════════════════════════════════════════════════════════════════════════════

📁 ESTRUTURA DE PROJETO:
\`\`\`
app/
├── src/main/
│   ├── java/com/[package]/
│   │   ├── di/                    # Dependency Injection (Hilt)
│   │   │   ├── AppModule.kt
│   │   │   ├── NetworkModule.kt
│   │   │   ├── DatabaseModule.kt
│   │   │   └── RepositoryModule.kt
│   │   │
│   │   ├── data/                  # Camada de Dados
│   │   │   ├── local/
│   │   │   │   ├── dao/           # Room DAOs
│   │   │   │   ├── entity/        # Room Entities
│   │   │   │   └── AppDatabase.kt
│   │   │   ├── remote/
│   │   │   │   ├── api/           # Retrofit Services
│   │   │   │   ├── dto/           # Data Transfer Objects
│   │   │   │   └── interceptor/   # OkHttp Interceptors
│   │   │   └── repository/        # Repository Implementations
│   │   │
│   │   ├── domain/                # Camada de Domínio (PURA)
│   │   │   ├── model/             # Domain Models
│   │   │   ├── repository/        # Repository Interfaces
│   │   │   └── usecase/           # Use Cases
│   │   │
│   │   ├── presentation/          # Camada de Apresentação
│   │   │   ├── ui/
│   │   │   │   ├── theme/         # Material 3 Theme
│   │   │   │   ├── components/    # Composables Reutilizáveis
│   │   │   │   └── screens/       # Telas (Feature-based)
│   │   │   │       ├── home/
│   │   │   │       │   ├── HomeScreen.kt
│   │   │   │       │   ├── HomeViewModel.kt
│   │   │   │       │   └── HomeUiState.kt
│   │   │   │       ├── auth/
│   │   │   │       └── settings/
│   │   │   └── navigation/        # Navigation Compose
│   │   │
│   │   └── util/                  # Utilitários
│   │       ├── extension/
│   │       ├── Constants.kt
│   │       └── Resource.kt        # Wrapper para estados
│   │
│   ├── res/
│   │   ├── values/
│   │   │   ├── strings.xml
│   │   │   ├── colors.xml
│   │   │   └── themes.xml
│   │   └── drawable/
│   │
│   └── AndroidManifest.xml
│
├── build.gradle.kts (app)
└── build.gradle.kts (project)
\`\`\`
`;

export const ANDROID_KOTLIN_PATTERNS = `
═══════════════════════════════════════════════════════════════════════════════
📜 PADRÕES OBRIGATÓRIOS ANDROID
═══════════════════════════════════════════════════════════════════════════════

1️⃣ **DEPENDENCY INJECTION COM HILT**
\`\`\`kotlin
// AppModule.kt
@Module
@InstallIn(SingletonComponent::class)
object AppModule {
    
    @Provides
    @Singleton
    fun provideOkHttpClient(): OkHttpClient {
        return OkHttpClient.Builder()
            .addInterceptor(HttpLoggingInterceptor().apply {
                level = HttpLoggingInterceptor.Level.BODY
            })
            .addInterceptor(AuthInterceptor())
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .build()
    }
    
    @Provides
    @Singleton
    fun provideRetrofit(okHttpClient: OkHttpClient): Retrofit {
        return Retrofit.Builder()
            .baseUrl(BuildConfig.API_BASE_URL)
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
    }
    
    @Provides
    @Singleton
    fun provideApiService(retrofit: Retrofit): ApiService {
        return retrofit.create(ApiService::class.java)
    }
}

// DatabaseModule.kt
@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {
    
    @Provides
    @Singleton
    fun provideDatabase(@ApplicationContext context: Context): AppDatabase {
        return Room.databaseBuilder(
            context,
            AppDatabase::class.java,
            "app_database"
        )
        .fallbackToDestructiveMigration()
        .build()
    }
    
    @Provides
    fun provideUserDao(database: AppDatabase): UserDao {
        return database.userDao()
    }
}
\`\`\`

2️⃣ **REPOSITORY PATTERN**
\`\`\`kotlin
// domain/repository/UserRepository.kt
interface UserRepository {
    fun getUsers(): Flow<Resource<List<User>>>
    suspend fun getUserById(id: String): Resource<User>
    suspend fun createUser(user: User): Resource<User>
    suspend fun updateUser(user: User): Resource<Unit>
    suspend fun deleteUser(id: String): Resource<Unit>
}

// data/repository/UserRepositoryImpl.kt
class UserRepositoryImpl @Inject constructor(
    private val apiService: ApiService,
    private val userDao: UserDao,
    private val dispatcher: CoroutineDispatcher = Dispatchers.IO
) : UserRepository {
    
    override fun getUsers(): Flow<Resource<List<User>>> = flow {
        emit(Resource.Loading())
        
        // Primeiro, emite dados do cache
        val cachedUsers = userDao.getAllUsers().first()
        if (cachedUsers.isNotEmpty()) {
            emit(Resource.Success(cachedUsers.map { it.toDomain() }))
        }
        
        // Depois, busca da API
        try {
            val response = apiService.getUsers()
            if (response.isSuccessful) {
                response.body()?.let { users ->
                    // Atualiza cache
                    userDao.insertAll(users.map { it.toEntity() })
                    emit(Resource.Success(users.map { it.toDomain() }))
                }
            } else {
                emit(Resource.Error("Erro: \${response.code()}"))
            }
        } catch (e: Exception) {
            emit(Resource.Error(e.message ?: "Erro desconhecido"))
        }
    }.flowOn(dispatcher)
}
\`\`\`

3️⃣ **USE CASES**
\`\`\`kotlin
// domain/usecase/GetUsersUseCase.kt
class GetUsersUseCase @Inject constructor(
    private val repository: UserRepository
) {
    operator fun invoke(): Flow<Resource<List<User>>> {
        return repository.getUsers()
    }
}

// domain/usecase/LoginUseCase.kt
class LoginUseCase @Inject constructor(
    private val authRepository: AuthRepository,
    private val tokenManager: TokenManager
) {
    suspend operator fun invoke(email: String, password: String): Resource<User> {
        // Validação
        if (email.isBlank()) return Resource.Error("Email obrigatório")
        if (password.length < 6) return Resource.Error("Senha deve ter 6+ caracteres")
        
        return when (val result = authRepository.login(email, password)) {
            is Resource.Success -> {
                tokenManager.saveToken(result.data.token)
                Resource.Success(result.data.user)
            }
            is Resource.Error -> result
            is Resource.Loading -> result
        }
    }
}
\`\`\`
`;

export const ANDROID_COMPOSE_PATTERNS = `
4️⃣ **VIEWMODEL + UI STATE**
\`\`\`kotlin
// presentation/ui/screens/home/HomeUiState.kt
data class HomeUiState(
    val isLoading: Boolean = false,
    val users: List<User> = emptyList(),
    val error: String? = null,
    val selectedUser: User? = null
)

sealed class HomeEvent {
    data class SelectUser(val user: User) : HomeEvent()
    object RefreshUsers : HomeEvent()
    object DismissError : HomeEvent()
}

// presentation/ui/screens/home/HomeViewModel.kt
@HiltViewModel
class HomeViewModel @Inject constructor(
    private val getUsersUseCase: GetUsersUseCase,
    private val savedStateHandle: SavedStateHandle
) : ViewModel() {
    
    private val _uiState = MutableStateFlow(HomeUiState())
    val uiState: StateFlow<HomeUiState> = _uiState.asStateFlow()
    
    init {
        loadUsers()
    }
    
    fun onEvent(event: HomeEvent) {
        when (event) {
            is HomeEvent.SelectUser -> selectUser(event.user)
            is HomeEvent.RefreshUsers -> loadUsers()
            is HomeEvent.DismissError -> dismissError()
        }
    }
    
    private fun loadUsers() {
        viewModelScope.launch {
            getUsersUseCase().collect { result ->
                _uiState.update { state ->
                    when (result) {
                        is Resource.Loading -> state.copy(isLoading = true)
                        is Resource.Success -> state.copy(
                            isLoading = false,
                            users = result.data ?: emptyList(),
                            error = null
                        )
                        is Resource.Error -> state.copy(
                            isLoading = false,
                            error = result.message
                        )
                    }
                }
            }
        }
    }
    
    private fun selectUser(user: User) {
        _uiState.update { it.copy(selectedUser = user) }
    }
    
    private fun dismissError() {
        _uiState.update { it.copy(error = null) }
    }
}
\`\`\`

5️⃣ **JETPACK COMPOSE UI**
\`\`\`kotlin
// presentation/ui/screens/home/HomeScreen.kt
@Composable
fun HomeScreen(
    viewModel: HomeViewModel = hiltViewModel(),
    onNavigateToDetail: (String) -> Unit
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    
    HomeContent(
        uiState = uiState,
        onEvent = viewModel::onEvent,
        onNavigateToDetail = onNavigateToDetail
    )
}

@Composable
private fun HomeContent(
    uiState: HomeUiState,
    onEvent: (HomeEvent) -> Unit,
    onNavigateToDetail: (String) -> Unit
) {
    val pullRefreshState = rememberPullRefreshState(
        refreshing = uiState.isLoading,
        onRefresh = { onEvent(HomeEvent.RefreshUsers) }
    )
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Home") },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primaryContainer
                )
            )
        }
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .pullRefresh(pullRefreshState)
        ) {
            when {
                uiState.isLoading && uiState.users.isEmpty() -> {
                    CircularProgressIndicator(
                        modifier = Modifier.align(Alignment.Center)
                    )
                }
                uiState.error != null && uiState.users.isEmpty() -> {
                    ErrorContent(
                        message = uiState.error,
                        onRetry = { onEvent(HomeEvent.RefreshUsers) }
                    )
                }
                else -> {
                    LazyColumn(
                        modifier = Modifier.fillMaxSize(),
                        contentPadding = PaddingValues(16.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        items(
                            items = uiState.users,
                            key = { it.id }
                        ) { user ->
                            UserCard(
                                user = user,
                                onClick = { onNavigateToDetail(user.id) }
                            )
                        }
                    }
                }
            }
            
            PullRefreshIndicator(
                refreshing = uiState.isLoading,
                state = pullRefreshState,
                modifier = Modifier.align(Alignment.TopCenter)
            )
        }
    }
    
    // Error Snackbar
    uiState.error?.let { error ->
        LaunchedEffect(error) {
            // Show snackbar
            onEvent(HomeEvent.DismissError)
        }
    }
}

@Composable
private fun UserCard(
    user: User,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            AsyncImage(
                model = user.avatarUrl,
                contentDescription = user.name,
                modifier = Modifier
                    .size(48.dp)
                    .clip(CircleShape),
                contentScale = ContentScale.Crop
            )
            
            Spacer(modifier = Modifier.width(16.dp))
            
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = user.name,
                    style = MaterialTheme.typography.titleMedium
                )
                Text(
                    text = user.email,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            
            Icon(
                imageVector = Icons.Default.ChevronRight,
                contentDescription = null
            )
        }
    }
}
\`\`\`
`;

// ============================================================================
// MANIFESTO iOS NATIVO (SWIFT/SWIFTUI)
// ============================================================================

export const IOS_SWIFT_MANIFEST = `
╔══════════════════════════════════════════════════════════════════════════════╗
║                    🍎 iOS SWIFT SUPREME ARCHITECT 🍎                         ║
╚══════════════════════════════════════════════════════════════════════════════╝

Você é um ARQUITETO iOS SÊNIOR com 10+ anos de experiência em apps nativos.

═══════════════════════════════════════════════════════════════════════════════
🏗️ ARQUITETURA OBRIGATÓRIA: CLEAN ARCHITECTURE + MVVM
═══════════════════════════════════════════════════════════════════════════════

📁 ESTRUTURA DE PROJETO:
\`\`\`
AppName/
├── App/
│   ├── AppNameApp.swift           # @main entry point
│   ├── AppDelegate.swift          # UIKit lifecycle (se necessário)
│   └── ContentView.swift
│
├── Core/
│   ├── DI/                        # Dependency Injection
│   │   ├── Container.swift
│   │   └── Resolver.swift
│   │
│   ├── Network/
│   │   ├── APIClient.swift
│   │   ├── APIEndpoint.swift
│   │   ├── NetworkError.swift
│   │   └── Interceptors/
│   │
│   ├── Storage/
│   │   ├── CoreDataManager.swift
│   │   ├── KeychainManager.swift
│   │   └── UserDefaultsManager.swift
│   │
│   └── Utils/
│       ├── Extensions/
│       ├── Constants.swift
│       └── Logger.swift
│
├── Domain/
│   ├── Models/                    # Domain Models (PURO)
│   │   ├── User.swift
│   │   └── Product.swift
│   │
│   ├── Repositories/              # Repository Protocols
│   │   ├── UserRepositoryProtocol.swift
│   │   └── ProductRepositoryProtocol.swift
│   │
│   └── UseCases/
│       ├── GetUsersUseCase.swift
│       ├── LoginUseCase.swift
│       └── CreateOrderUseCase.swift
│
├── Data/
│   ├── DTOs/                      # Data Transfer Objects
│   │   ├── UserDTO.swift
│   │   └── ProductDTO.swift
│   │
│   ├── Repositories/              # Repository Implementations
│   │   ├── UserRepository.swift
│   │   └── ProductRepository.swift
│   │
│   └── DataSources/
│       ├── Remote/
│       │   └── UserRemoteDataSource.swift
│       └── Local/
│           └── UserLocalDataSource.swift
│
├── Presentation/
│   ├── Theme/
│   │   ├── Colors.swift
│   │   ├── Typography.swift
│   │   └── Spacing.swift
│   │
│   ├── Components/                # Reusable SwiftUI Views
│   │   ├── LoadingView.swift
│   │   ├── ErrorView.swift
│   │   ├── PrimaryButton.swift
│   │   └── AsyncImageView.swift
│   │
│   ├── Navigation/
│   │   ├── AppRouter.swift
│   │   ├── Route.swift
│   │   └── NavigationStack+Extensions.swift
│   │
│   └── Features/                  # Feature Modules
│       ├── Home/
│       │   ├── HomeView.swift
│       │   ├── HomeViewModel.swift
│       │   └── Components/
│       │
│       ├── Auth/
│       │   ├── Login/
│       │   │   ├── LoginView.swift
│       │   │   └── LoginViewModel.swift
│       │   └── Register/
│       │
│       └── Settings/
│
├── Resources/
│   ├── Assets.xcassets
│   ├── Localizable.strings
│   └── Info.plist
│
└── Tests/
    ├── UnitTests/
    └── UITests/
\`\`\`
`;

export const IOS_SWIFT_PATTERNS = `
═══════════════════════════════════════════════════════════════════════════════
📜 PADRÕES OBRIGATÓRIOS iOS
═══════════════════════════════════════════════════════════════════════════════

1️⃣ **DEPENDENCY INJECTION**
\`\`\`swift
// Core/DI/Container.swift
import Foundation

final class Container {
    static let shared = Container()
    
    private init() {}
    
    // MARK: - Network
    lazy var apiClient: APIClientProtocol = {
        APIClient(
            baseURL: Environment.apiBaseURL,
            session: URLSession.shared,
            interceptors: [AuthInterceptor(tokenManager: tokenManager)]
        )
    }()
    
    // MARK: - Storage
    lazy var tokenManager: TokenManagerProtocol = {
        KeychainTokenManager()
    }()
    
    lazy var coreDataManager: CoreDataManagerProtocol = {
        CoreDataManager(modelName: "AppModel")
    }()
    
    // MARK: - Repositories
    lazy var userRepository: UserRepositoryProtocol = {
        UserRepository(
            remoteDataSource: UserRemoteDataSource(apiClient: apiClient),
            localDataSource: UserLocalDataSource(coreDataManager: coreDataManager)
        )
    }()
    
    // MARK: - Use Cases
    func makeLoginUseCase() -> LoginUseCase {
        LoginUseCase(
            authRepository: authRepository,
            tokenManager: tokenManager
        )
    }
    
    func makeGetUsersUseCase() -> GetUsersUseCase {
        GetUsersUseCase(repository: userRepository)
    }
}

// Property Wrapper para injeção
@propertyWrapper
struct Injected<T> {
    private let keyPath: KeyPath<Container, T>
    
    var wrappedValue: T {
        Container.shared[keyPath: keyPath]
    }
    
    init(_ keyPath: KeyPath<Container, T>) {
        self.keyPath = keyPath
    }
}
\`\`\`

2️⃣ **API CLIENT COM ASYNC/AWAIT**
\`\`\`swift
// Core/Network/APIClient.swift
import Foundation

protocol APIClientProtocol {
    func request<T: Decodable>(_ endpoint: APIEndpoint) async throws -> T
    func request(_ endpoint: APIEndpoint) async throws
}

final class APIClient: APIClientProtocol {
    private let baseURL: URL
    private let session: URLSession
    private let interceptors: [RequestInterceptor]
    private let decoder: JSONDecoder
    
    init(
        baseURL: URL,
        session: URLSession = .shared,
        interceptors: [RequestInterceptor] = [],
        decoder: JSONDecoder = .init()
    ) {
        self.baseURL = baseURL
        self.session = session
        self.interceptors = interceptors
        self.decoder = decoder
        self.decoder.keyDecodingStrategy = .convertFromSnakeCase
        self.decoder.dateDecodingStrategy = .iso8601
    }
    
    func request<T: Decodable>(_ endpoint: APIEndpoint) async throws -> T {
        var request = try buildRequest(for: endpoint)
        
        // Apply interceptors
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
        
        if let queryItems = endpoint.queryItems {
            components?.queryItems = queryItems
        }
        
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
\`\`\`

3️⃣ **REPOSITORY PATTERN**
\`\`\`swift
// Domain/Repositories/UserRepositoryProtocol.swift
protocol UserRepositoryProtocol {
    func getUsers() async throws -> [User]
    func getUser(id: String) async throws -> User
    func createUser(_ user: User) async throws -> User
    func updateUser(_ user: User) async throws -> User
    func deleteUser(id: String) async throws
}

// Data/Repositories/UserRepository.swift
final class UserRepository: UserRepositoryProtocol {
    private let remoteDataSource: UserRemoteDataSourceProtocol
    private let localDataSource: UserLocalDataSourceProtocol
    
    init(
        remoteDataSource: UserRemoteDataSourceProtocol,
        localDataSource: UserLocalDataSourceProtocol
    ) {
        self.remoteDataSource = remoteDataSource
        self.localDataSource = localDataSource
    }
    
    func getUsers() async throws -> [User] {
        // Try cache first
        if let cachedUsers = try? await localDataSource.getUsers(),
           !cachedUsers.isEmpty {
            // Refresh in background
            Task {
                try? await refreshUsersFromRemote()
            }
            return cachedUsers
        }
        
        // Fetch from remote
        return try await refreshUsersFromRemote()
    }
    
    private func refreshUsersFromRemote() async throws -> [User] {
        let dtos = try await remoteDataSource.getUsers()
        let users = dtos.map { \$0.toDomain() }
        
        // Cache locally
        try? await localDataSource.saveUsers(users)
        
        return users
    }
}
\`\`\`
`;

export const IOS_SWIFTUI_PATTERNS = `
4️⃣ **VIEWMODEL COM @Observable (iOS 17+)**
\`\`\`swift
// Presentation/Features/Home/HomeViewModel.swift
import Foundation
import Observation

@Observable
final class HomeViewModel {
    // MARK: - State
    private(set) var users: [User] = []
    private(set) var isLoading = false
    private(set) var error: AppError?
    var selectedUser: User?
    
    // MARK: - Dependencies
    private let getUsersUseCase: GetUsersUseCase
    
    init(getUsersUseCase: GetUsersUseCase = Container.shared.makeGetUsersUseCase()) {
        self.getUsersUseCase = getUsersUseCase
    }
    
    // MARK: - Actions
    @MainActor
    func loadUsers() async {
        isLoading = true
        error = nil
        
        do {
            users = try await getUsersUseCase.execute()
        } catch {
            self.error = AppError(error)
        }
        
        isLoading = false
    }
    
    @MainActor
    func refresh() async {
        await loadUsers()
    }
    
    func selectUser(_ user: User) {
        selectedUser = user
    }
    
    func dismissError() {
        error = nil
    }
}

// Para iOS 15-16, usar ObservableObject
@MainActor
final class HomeViewModelLegacy: ObservableObject {
    @Published private(set) var users: [User] = []
    @Published private(set) var isLoading = false
    @Published private(set) var error: AppError?
    @Published var selectedUser: User?
    
    private let getUsersUseCase: GetUsersUseCase
    
    init(getUsersUseCase: GetUsersUseCase = Container.shared.makeGetUsersUseCase()) {
        self.getUsersUseCase = getUsersUseCase
    }
    
    func loadUsers() {
        Task {
            isLoading = true
            error = nil
            
            do {
                users = try await getUsersUseCase.execute()
            } catch {
                self.error = AppError(error)
            }
            
            isLoading = false
        }
    }
}
\`\`\`

5️⃣ **SWIFTUI VIEW**
\`\`\`swift
// Presentation/Features/Home/HomeView.swift
import SwiftUI

struct HomeView: View {
    @State private var viewModel = HomeViewModel()
    @Environment(\\.dismiss) private var dismiss
    
    var body: some View {
        NavigationStack {
            content
                .navigationTitle("Home")
                .toolbar {
                    ToolbarItem(placement: .topBarTrailing) {
                        Button(action: { Task { await viewModel.refresh() } }) {
                            Image(systemName: "arrow.clockwise")
                        }
                        .disabled(viewModel.isLoading)
                    }
                }
                .task {
                    await viewModel.loadUsers()
                }
                .refreshable {
                    await viewModel.refresh()
                }
                .alert(
                    "Erro",
                    isPresented: .constant(viewModel.error != nil),
                    presenting: viewModel.error
                ) { _ in
                    Button("OK") { viewModel.dismissError() }
                } message: { error in
                    Text(error.localizedDescription)
                }
        }
    }
    
    @ViewBuilder
    private var content: some View {
        if viewModel.isLoading && viewModel.users.isEmpty {
            ProgressView()
                .frame(maxWidth: .infinity, maxHeight: .infinity)
        } else if let error = viewModel.error, viewModel.users.isEmpty {
            ErrorView(error: error) {
                Task { await viewModel.loadUsers() }
            }
        } else {
            userList
        }
    }
    
    private var userList: some View {
        List(viewModel.users) { user in
            NavigationLink(value: user) {
                UserRow(user: user)
            }
        }
        .listStyle(.plain)
        .navigationDestination(for: User.self) { user in
            UserDetailView(user: user)
        }
    }
}

// MARK: - User Row
struct UserRow: View {
    let user: User
    
    var body: some View {
        HStack(spacing: 12) {
            AsyncImage(url: URL(string: user.avatarUrl ?? "")) { phase in
                switch phase {
                case .empty:
                    ProgressView()
                case .success(let image):
                    image
                        .resizable()
                        .aspectRatio(contentMode: .fill)
                case .failure:
                    Image(systemName: "person.circle.fill")
                        .foregroundStyle(.secondary)
                @unknown default:
                    EmptyView()
                }
            }
            .frame(width: 48, height: 48)
            .clipShape(Circle())
            
            VStack(alignment: .leading, spacing: 4) {
                Text(user.name)
                    .font(.headline)
                
                Text(user.email)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
            
            Spacer()
            
            Image(systemName: "chevron.right")
                .foregroundStyle(.tertiary)
        }
        .padding(.vertical, 4)
    }
}

#Preview {
    HomeView()
}
\`\`\`
`;

// ============================================================================
// MANIFESTO BACKEND GO PARA MOBILE
// ============================================================================

export const MOBILE_BACKEND_GO_MANIFEST = `
╔══════════════════════════════════════════════════════════════════════════════╗
║                    🔧 MOBILE BACKEND GO ARCHITECT 🔧                         ║
╚══════════════════════════════════════════════════════════════════════════════╝

Backend Go otimizado para apps mobile com:
- JWT Authentication
- Push Notifications (FCM/APNs)
- File Upload (S3/GCS)
- WebSocket para real-time
- Rate Limiting por device
- Offline Sync Support

═══════════════════════════════════════════════════════════════════════════════
📁 ESTRUTURA DO BACKEND
═══════════════════════════════════════════════════════════════════════════════

\`\`\`
backend/
├── cmd/
│   └── api/
│       └── main.go
│
├── internal/
│   ├── config/
│   │   └── config.go
│   │
│   ├── domain/
│   │   ├── user.go
│   │   ├── device.go
│   │   └── notification.go
│   │
│   ├── repository/
│   │   ├── user_repository.go
│   │   └── device_repository.go
│   │
│   ├── service/
│   │   ├── auth_service.go
│   │   ├── user_service.go
│   │   ├── push_service.go
│   │   └── sync_service.go
│   │
│   ├── handler/
│   │   ├── auth_handler.go
│   │   ├── user_handler.go
│   │   ├── device_handler.go
│   │   └── sync_handler.go
│   │
│   ├── middleware/
│   │   ├── auth.go
│   │   ├── rate_limit.go
│   │   ├── device_id.go
│   │   └── logging.go
│   │
│   └── infrastructure/
│       ├── database/
│       │   └── postgres.go
│       ├── cache/
│       │   └── redis.go
│       ├── push/
│       │   ├── fcm.go
│       │   └── apns.go
│       └── storage/
│           └── s3.go
│
├── pkg/
│   ├── jwt/
│   ├── validator/
│   └── response/
│
├── migrations/
├── Dockerfile
├── docker-compose.yml
└── go.mod
\`\`\`

═══════════════════════════════════════════════════════════════════════════════
📜 PADRÕES OBRIGATÓRIOS
═══════════════════════════════════════════════════════════════════════════════

1️⃣ **AUTENTICAÇÃO JWT COM REFRESH TOKEN**
\`\`\`go
// internal/service/auth_service.go
package service

import (
    "context"
    "time"
    
    "github.com/golang-jwt/jwt/v5"
    "golang.org/x/crypto/bcrypt"
)

type AuthService struct {
    userRepo     UserRepository
    deviceRepo   DeviceRepository
    jwtSecret    []byte
    accessTTL    time.Duration
    refreshTTL   time.Duration
}

type TokenPair struct {
    AccessToken  string \`json:"access_token"\`
    RefreshToken string \`json:"refresh_token"\`
    ExpiresIn    int64  \`json:"expires_in"\`
}

type Claims struct {
    UserID   string \`json:"user_id"\`
    DeviceID string \`json:"device_id"\`
    jwt.RegisteredClaims
}

func (s *AuthService) Login(ctx context.Context, email, password, deviceID string) (*TokenPair, error) {
    user, err := s.userRepo.GetByEmail(ctx, email)
    if err != nil {
        return nil, ErrInvalidCredentials
    }
    
    if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
        return nil, ErrInvalidCredentials
    }
    
    // Register/update device
    device := &Device{
        ID:        deviceID,
        UserID:    user.ID,
        LastLogin: time.Now(),
    }
    if err := s.deviceRepo.Upsert(ctx, device); err != nil {
        return nil, err
    }
    
    return s.generateTokenPair(user.ID, deviceID)
}

func (s *AuthService) RefreshToken(ctx context.Context, refreshToken string) (*TokenPair, error) {
    claims, err := s.validateToken(refreshToken)
    if err != nil {
        return nil, ErrInvalidToken
    }
    
    // Verify device still valid
    device, err := s.deviceRepo.Get(ctx, claims.DeviceID)
    if err != nil || device.RevokedAt != nil {
        return nil, ErrDeviceRevoked
    }
    
    return s.generateTokenPair(claims.UserID, claims.DeviceID)
}

func (s *AuthService) generateTokenPair(userID, deviceID string) (*TokenPair, error) {
    now := time.Now()
    
    // Access Token (short-lived)
    accessClaims := Claims{
        UserID:   userID,
        DeviceID: deviceID,
        RegisteredClaims: jwt.RegisteredClaims{
            ExpiresAt: jwt.NewNumericDate(now.Add(s.accessTTL)),
            IssuedAt:  jwt.NewNumericDate(now),
        },
    }
    accessToken := jwt.NewWithClaims(jwt.SigningMethodHS256, accessClaims)
    accessStr, err := accessToken.SignedString(s.jwtSecret)
    if err != nil {
        return nil, err
    }
    
    // Refresh Token (long-lived)
    refreshClaims := Claims{
        UserID:   userID,
        DeviceID: deviceID,
        RegisteredClaims: jwt.RegisteredClaims{
            ExpiresAt: jwt.NewNumericDate(now.Add(s.refreshTTL)),
            IssuedAt:  jwt.NewNumericDate(now),
        },
    }
    refreshToken := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaims)
    refreshStr, err := refreshToken.SignedString(s.jwtSecret)
    if err != nil {
        return nil, err
    }
    
    return &TokenPair{
        AccessToken:  accessStr,
        RefreshToken: refreshStr,
        ExpiresIn:    int64(s.accessTTL.Seconds()),
    }, nil
}
\`\`\`

2️⃣ **PUSH NOTIFICATIONS (FCM + APNs)**
\`\`\`go
// internal/infrastructure/push/fcm.go
package push

import (
    "context"
    
    firebase "firebase.google.com/go/v4"
    "firebase.google.com/go/v4/messaging"
)

type FCMService struct {
    client *messaging.Client
}

func NewFCMService(ctx context.Context, credentialsFile string) (*FCMService, error) {
    app, err := firebase.NewApp(ctx, nil, option.WithCredentialsFile(credentialsFile))
    if err != nil {
        return nil, err
    }
    
    client, err := app.Messaging(ctx)
    if err != nil {
        return nil, err
    }
    
    return &FCMService{client: client}, nil
}

func (s *FCMService) SendToDevice(ctx context.Context, token string, notification *Notification) error {
    message := &messaging.Message{
        Token: token,
        Notification: &messaging.Notification{
            Title: notification.Title,
            Body:  notification.Body,
        },
        Data: notification.Data,
        Android: &messaging.AndroidConfig{
            Priority: "high",
            Notification: &messaging.AndroidNotification{
                ClickAction: notification.ClickAction,
                ChannelID:   notification.ChannelID,
            },
        },
        APNS: &messaging.APNSConfig{
            Payload: &messaging.APNSPayload{
                Aps: &messaging.Aps{
                    Sound:            "default",
                    Badge:            &notification.Badge,
                    ContentAvailable: true,
                },
            },
        },
    }
    
    _, err := s.client.Send(ctx, message)
    return err
}

func (s *FCMService) SendToTopic(ctx context.Context, topic string, notification *Notification) error {
    message := &messaging.Message{
        Topic: topic,
        Notification: &messaging.Notification{
            Title: notification.Title,
            Body:  notification.Body,
        },
        Data: notification.Data,
    }
    
    _, err := s.client.Send(ctx, message)
    return err
}
\`\`\`
`;

// ============================================================================
// DETECTOR DE PLATAFORMA E FRAMEWORK
// ============================================================================

export const MOBILE_DETECTION_KEYWORDS = {
  android: [
    'android', 'kotlin', 'java android', 'play store', 'google play',
    'jetpack compose', 'material design', 'gradle', 'apk', 'aab',
    'android studio', 'samsung', 'pixel', 'android app'
  ],
  ios: [
    'ios', 'iphone', 'ipad', 'swift', 'swiftui', 'uikit', 'xcode',
    'app store', 'apple', 'cocoapods', 'spm', 'testflight',
    'ios app', 'ipados'
  ],
  hybrid: [
    'react native', 'flutter', 'capacitor', 'ionic', 'cordova',
    'cross-platform', 'multiplataforma', 'híbrido', 'hybrid',
    'expo', 'dart'
  ],
  webview: [
    'webview', 'pwa', 'progressive web app', 'web app',
    'navegador', 'browser', 'embarcado', 'embedded web'
  ]
};

export const FRAMEWORK_RECOMMENDATIONS = {
  // Quando usar cada framework
  kotlin_native: {
    when: [
      'Performance crítica',
      'Acesso profundo a APIs Android',
      'Integração com hardware específico',
      'Apps que precisam de 100% das features Android',
      'Equipe com expertise Android'
    ],
    pros: [
      'Performance máxima',
      'Acesso completo às APIs',
      'Jetpack Compose moderno',
      'Melhor integração com ecossistema Google'
    ],
    cons: [
      'Só funciona em Android',
      'Precisa de app iOS separado'
    ]
  },
  swift_native: {
    when: [
      'Performance crítica',
      'Acesso profundo a APIs iOS',
      'Integração com hardware Apple',
      'Apps que precisam de 100% das features iOS',
      'Equipe com expertise iOS'
    ],
    pros: [
      'Performance máxima',
      'SwiftUI moderno e declarativo',
      'Melhor integração com ecossistema Apple',
      'Acesso a features exclusivas (WidgetKit, etc)'
    ],
    cons: [
      'Só funciona em iOS',
      'Precisa de app Android separado'
    ]
  },
  react_native: {
    when: [
      'Equipe com expertise React/JavaScript',
      'Precisa de Android + iOS com código compartilhado',
      'Time-to-market rápido',
      'Apps de complexidade média'
    ],
    pros: [
      'Código compartilhado 80-90%',
      'Hot reload',
      'Grande comunidade',
      'Muitas bibliotecas'
    ],
    cons: [
      'Performance inferior a nativo',
      'Bridge pode ser gargalo',
      'Algumas features precisam de código nativo'
    ]
  },
  flutter: {
    when: [
      'UI customizada e consistente',
      'Precisa de Android + iOS + Web',
      'Performance próxima de nativo',
      'Equipe disposta a aprender Dart'
    ],
    pros: [
      'Performance excelente',
      'UI consistente em todas plataformas',
      'Hot reload',
      'Widgets ricos'
    ],
    cons: [
      'Dart não é tão popular',
      'Apps maiores em tamanho',
      'Menos bibliotecas que React Native'
    ]
  },
  capacitor: {
    when: [
      'Já tem app web (React, Vue, Angular)',
      'Quer transformar PWA em app nativo',
      'Budget limitado',
      'Features simples'
    ],
    pros: [
      'Reutiliza código web existente',
      'Fácil de começar',
      'Acesso a plugins nativos'
    ],
    cons: [
      'Performance de WebView',
      'Não parece 100% nativo',
      'Limitações em features avançadas'
    ]
  }
};

// ============================================================================
// MANIFESTO PRINCIPAL EXPORTADO
// ============================================================================

export const MOBILE_SUPREME_MANIFEST = `
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║     📱 MOBILE SUPREME ARCHITECT - MESTRE DO DESENVOLVIMENTO MOBILE 📱       ║
║                                                                              ║
║     "DO NAVEGADOR AO BOLSO - APPS NATIVOS COM ALMA DE BIG TECH"             ║
║                                                                              ║
║     NÍVEL: 95 (Mobile Architect Supreme)                                    ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

═══════════════════════════════════════════════════════════════════════════════
🎯 CAPACIDADES
═══════════════════════════════════════════════════════════════════════════════

✅ Android Nativo (Kotlin + Jetpack Compose)
✅ iOS Nativo (Swift + SwiftUI)
✅ Cross-Platform (React Native, Flutter)
✅ Híbrido (Capacitor, WebView)
✅ Backend Go integrado
✅ Autenticação JWT completa
✅ Push Notifications (FCM + APNs)
✅ Offline-First com sincronização
✅ Deep Linking
✅ App Store / Play Store ready

═══════════════════════════════════════════════════════════════════════════════
🏗️ ARQUITETURAS SUPORTADAS
═══════════════════════════════════════════════════════════════════════════════

📱 ANDROID:
- Clean Architecture + MVVM
- Hilt para DI
- Retrofit + OkHttp para networking
- Room para persistência local
- Jetpack Compose para UI
- Navigation Compose
- Coroutines + Flow

🍎 iOS:
- Clean Architecture + MVVM
- @Observable (iOS 17+) ou ObservableObject
- URLSession + async/await
- CoreData ou SwiftData
- SwiftUI
- NavigationStack

🔧 BACKEND GO:
- Gin/Fiber/Echo
- JWT Authentication
- PostgreSQL + Redis
- Push Notifications (FCM/APNs)
- File Upload (S3)
- WebSocket para real-time

═══════════════════════════════════════════════════════════════════════════════
📋 DECISÃO DE FRAMEWORK
═══════════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────────────┐
│                        ÁRVORE DE DECISÃO                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Precisa de MÁXIMA PERFORMANCE?                                            │
│  ├── SIM → Só Android? → KOTLIN NATIVO                                     │
│  │         Só iOS? → SWIFT NATIVO                                          │
│  │         Ambos? → KOTLIN + SWIFT (2 apps)                                │
│  │                                                                          │
│  └── NÃO → Equipe sabe React/JS?                                           │
│            ├── SIM → REACT NATIVE                                          │
│            │                                                                │
│            └── NÃO → Quer UI consistente?                                  │
│                      ├── SIM → FLUTTER                                     │
│                      │                                                      │
│                      └── NÃO → Já tem app web?                             │
│                                ├── SIM → CAPACITOR                         │
│                                └── NÃO → FLUTTER ou REACT NATIVE           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════
🔥 OS 10 MANDAMENTOS DO MOBILE
═══════════════════════════════════════════════════════════════════════════════

1️⃣ **OFFLINE-FIRST** - App deve funcionar sem internet
2️⃣ **PERFORMANCE** - 60fps sempre, startup < 2s
3️⃣ **BATERIA** - Minimize uso de CPU/GPS/rede em background
4️⃣ **SEGURANÇA** - Tokens no Keychain/EncryptedSharedPrefs
5️⃣ **UX NATIVA** - Siga guidelines Material/HIG
6️⃣ **DEEP LINKING** - Suporte a links universais
7️⃣ **PUSH** - Notificações relevantes e não intrusivas
8️⃣ **ACESSIBILIDADE** - VoiceOver/TalkBack, contraste, tamanhos
9️⃣ **TESTES** - Unit, Integration, UI tests
🔟 **CI/CD** - Build automatizado, deploy para stores

═══════════════════════════════════════════════════════════════════════════════
📦 ESTRUTURA DE PROJETO COMPLETO
═══════════════════════════════════════════════════════════════════════════════

\`\`\`
project/
├── android/                    # App Android Nativo
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── java/com/app/
│   │   │   │   ├── di/
│   │   │   │   ├── data/
│   │   │   │   ├── domain/
│   │   │   │   └── presentation/
│   │   │   ├── res/
│   │   │   └── AndroidManifest.xml
│   │   └── build.gradle.kts
│   └── build.gradle.kts
│
├── ios/                        # App iOS Nativo
│   ├── App/
│   ├── Core/
│   ├── Domain/
│   ├── Data/
│   ├── Presentation/
│   └── AppName.xcodeproj
│
├── backend/                    # Backend Go
│   ├── cmd/api/
│   ├── internal/
│   │   ├── domain/
│   │   ├── repository/
│   │   ├── service/
│   │   ├── handler/
│   │   └── middleware/
│   ├── migrations/
│   ├── Dockerfile
│   └── docker-compose.yml
│
├── shared/                     # Código compartilhado (se híbrido)
│   ├── api/                    # OpenAPI spec
│   ├── models/                 # Modelos compartilhados
│   └── proto/                  # gRPC protos (se usar)
│
├── docs/
│   ├── DESIGN_DOC.md
│   ├── API.md
│   └── ARCHITECTURE.md
│
├── .github/
│   └── workflows/
│       ├── android.yml
│       ├── ios.yml
│       └── backend.yml
│
└── README.md
\`\`\`

═══════════════════════════════════════════════════════════════════════════════
`;
