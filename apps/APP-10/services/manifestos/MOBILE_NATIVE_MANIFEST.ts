/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║         📱 MOBILE NATIVE: EXPERIÊNCIAS MÓVEIS PRO - LEVEL 15 📱             ║
 * ║                                                                              ║
 * ║            "APPS DE QUALIDADE DE MERCADO."                                  ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

export const MOBILE_NATIVE_MANIFEST = `
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║         📱 MOBILE NATIVE: EXPERIÊNCIAS MÓVEIS PRO - LEVEL 15 📱             ║
║                                                                              ║
║            "APPS PROFISSIONAIS, RÁPIDOS, FLUIDOS E OTIMIZADOS."             ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

═══════════════════════════════════════════════════════════════════════════════
🍎 iOS NATIVO (SWIFT + SWIFTUI)
═══════════════════════════════════════════════════════════════════════════════

ESTRUTURA DE PROJETO:
MyApp/
├── MyApp.swift              // Entry point
├── ContentView.swift        // Main view
├── Models/
├── Views/
├── ViewModels/
├── Services/
└── Resources/

SWIFTUI BÁSICO:
struct ContentView: View {
    @State private var count = 0
    
    var body: some View {
        VStack {
            Text("Count: \\(count)")
                .font(.largeTitle)
            
            Button("Increment") {
                count += 1
            }
            .buttonStyle(.borderedProminent)
        }
        .padding()
    }
}

NETWORKING:
func fetchData() async throws -> [Item] {
    let url = URL(string: "https://api.example.com/items")!
    let (data, _) = try await URLSession.shared.data(from: url)
    return try JSONDecoder().decode([Item].self, from: data)
}

PERSISTÊNCIA (Core Data / SwiftData):
@Model
class Item {
    var name: String
    var createdAt: Date
    
    init(name: String) {
        self.name = name
        self.createdAt = Date()
    }
}

═══════════════════════════════════════════════════════════════════════════════
🤖 ANDROID NATIVO (KOTLIN + JETPACK COMPOSE)
═══════════════════════════════════════════════════════════════════════════════

ESTRUTURA DE PROJETO:
app/
├── src/main/
│   ├── java/com/example/myapp/
│   │   ├── MainActivity.kt
│   │   ├── ui/
│   │   │   ├── screens/
│   │   │   ├── components/
│   │   │   └── theme/
│   │   ├── data/
│   │   │   ├── repository/
│   │   │   └── model/
│   │   └── di/
│   └── res/
└── build.gradle.kts

JETPACK COMPOSE BÁSICO:
@Composable
fun CounterScreen() {
    var count by remember { mutableStateOf(0) }
    
    Column(
        modifier = Modifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text(
            text = "Count: \$count",
            style = MaterialTheme.typography.headlineLarge
        )
        
        Button(onClick = { count++ }) {
            Text("Increment")
        }
    }
}

VIEWMODEL + FLOW:
class ItemsViewModel(
    private val repository: ItemRepository
) : ViewModel() {
    
    private val _uiState = MutableStateFlow<UiState>(UiState.Loading)
    val uiState: StateFlow<UiState> = _uiState.asStateFlow()
    
    init {
        viewModelScope.launch {
            repository.getItems()
                .catch { _uiState.value = UiState.Error(it.message) }
                .collect { _uiState.value = UiState.Success(it) }
        }
    }
}

ROOM DATABASE:
@Entity
data class Item(
    @PrimaryKey val id: Int,
    val name: String,
    val createdAt: Long
)

@Dao
interface ItemDao {
    @Query("SELECT * FROM item")
    fun getAll(): Flow<List<Item>>
    
    @Insert
    suspend fun insert(item: Item)
}

═══════════════════════════════════════════════════════════════════════════════
🦋 FLUTTER (CROSS-PLATFORM)
═══════════════════════════════════════════════════════════════════════════════

ESTRUTURA DE PROJETO:
lib/
├── main.dart
├── app/
│   ├── routes.dart
│   └── theme.dart
├── features/
│   └── home/
│       ├── presentation/
│       ├── domain/
│       └── data/
├── core/
│   ├── network/
│   ├── storage/
│   └── utils/
└── shared/
    └── widgets/

WIDGET BÁSICO:
class CounterScreen extends StatefulWidget {
  @override
  State<CounterScreen> createState() => _CounterScreenState();
}

class _CounterScreenState extends State<CounterScreen> {
  int _count = 0;
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Counter')),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text('Count: \$_count', style: Theme.of(context).textTheme.headlineLarge),
            SizedBox(height: 16),
            ElevatedButton(
              onPressed: () => setState(() => _count++),
              child: Text('Increment'),
            ),
          ],
        ),
      ),
    );
  }
}

RIVERPOD (State Management):
final counterProvider = StateNotifierProvider<CounterNotifier, int>((ref) {
  return CounterNotifier();
});

class CounterNotifier extends StateNotifier<int> {
  CounterNotifier() : super(0);
  
  void increment() => state++;
  void decrement() => state--;
}

// Uso
Consumer(
  builder: (context, ref, child) {
    final count = ref.watch(counterProvider);
    return Text('Count: \$count');
  },
)

═══════════════════════════════════════════════════════════════════════════════
⚛️ REACT NATIVE
═══════════════════════════════════════════════════════════════════════════════

ESTRUTURA DE PROJETO:
src/
├── App.tsx
├── screens/
├── components/
├── navigation/
├── hooks/
├── services/
├── store/
└── utils/

COMPONENTE BÁSICO:
import { useState } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

export function CounterScreen() {
  const [count, setCount] = useState(0);
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Count: {count}</Text>
      <Button title="Increment" onPress={() => setCount(c => c + 1)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 32, fontWeight: 'bold' },
});

NAVIGATION:
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator();

export function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Details" component={DetailsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

═══════════════════════════════════════════════════════════════════════════════
📊 COMPARATIVO
═══════════════════════════════════════════════════════════════════════════════

| Aspecto          | Swift/iOS | Kotlin/Android | Flutter    | React Native |
|------------------|-----------|----------------|------------|--------------|
| Performance      | ⭐⭐⭐⭐⭐    | ⭐⭐⭐⭐⭐         | ⭐⭐⭐⭐       | ⭐⭐⭐          |
| UI Nativa        | ⭐⭐⭐⭐⭐    | ⭐⭐⭐⭐⭐         | ⭐⭐⭐⭐       | ⭐⭐⭐⭐         |
| Hot Reload       | ⭐⭐⭐       | ⭐⭐⭐           | ⭐⭐⭐⭐⭐      | ⭐⭐⭐⭐⭐        |
| Ecossistema      | ⭐⭐⭐⭐⭐    | ⭐⭐⭐⭐⭐         | ⭐⭐⭐⭐       | ⭐⭐⭐⭐         |
| Curva Aprendizado| ⭐⭐⭐       | ⭐⭐⭐           | ⭐⭐⭐⭐       | ⭐⭐⭐⭐⭐        |
| Code Sharing     | ❌         | ❌             | ⭐⭐⭐⭐⭐      | ⭐⭐⭐⭐⭐        |

QUANDO USAR:
├── iOS only → Swift + SwiftUI
├── Android only → Kotlin + Compose
├── Cross-platform (performance) → Flutter
├── Cross-platform (JS team) → React Native
└── Ambos nativos → KMM (Kotlin Multiplatform)

═══════════════════════════════════════════════════════════════════════════════
📋 CHECKLIST MOBILE
═══════════════════════════════════════════════════════════════════════════════

[ ] Arquitetura limpa (MVVM, Clean Architecture)
[ ] State management adequado
[ ] Navegação estruturada
[ ] Persistência local (SQLite, Room, Core Data)
[ ] Networking com retry e cache
[ ] Error handling graceful
[ ] Loading states
[ ] Pull-to-refresh
[ ] Infinite scroll / pagination
[ ] Deep linking
[ ] Push notifications
[ ] Analytics integrado
[ ] Crash reporting (Firebase Crashlytics)
[ ] Testes unitários e de widget
[ ] CI/CD (Fastlane, Codemagic)
[ ] App Store / Play Store guidelines

═══════════════════════════════════════════════════════════════════════════════

"APPS PROFISSIONAIS, RÁPIDOS, FLUIDOS E OTIMIZADOS."

                    — Mobile Native, Level 15
`;

export function shouldEnableMobileNative(prompt: string): boolean {
  const keywords = [
    'mobile', 'app', 'aplicativo', 'celular', 'smartphone',
    'ios', 'iphone', 'ipad', 'swift', 'swiftui',
    'android', 'kotlin', 'jetpack', 'compose',
    'flutter', 'dart', 'react native', 'expo',
    'play store', 'app store', 'apk', 'ipa'
  ];
  const promptLower = prompt.toLowerCase();
  return keywords.some(kw => promptLower.includes(kw));
}

export default MOBILE_NATIVE_MANIFEST;
