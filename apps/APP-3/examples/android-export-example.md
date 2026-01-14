# 🤖 Exemplo: Exportar HTML como App Android

## 📱 Como Funciona

O sistema converte automaticamente seu HTML em um projeto Android completo usando WebView.

## 🎯 Fluxo de Uso

### 1. Gerar HTML no Editor
```
Prompt: "Crie um app de lista de tarefas com design moderno"
```

A IA gera o HTML completo com CSS e JavaScript.

### 2. Exportar para Android
Clique no botão **"📱 Exportar Android"** no CommandBar.

### 3. Configurar o App
No modal que abre, configure:
- **Nome do App:** "Minhas Tarefas"
- **Package Name:** com.meuapp.tarefas
- **Versão:** 1.0.0
- **Orientação:** Retrato
- **Permissões:** JavaScript (obrigatório)

### 4. Gerar Projeto
Clique em **"Gerar Projeto Android"**.

O sistema irá:
1. ✅ Sanitizar o HTML para mobile
2. ✅ Criar MainActivity.kt com WebView
3. ✅ Gerar AndroidManifest.xml
4. ✅ Configurar Gradle
5. ✅ Adicionar interface JavaScript-Android
6. ✅ Criar README com instruções
7. ✅ Empacotar tudo em um ZIP

### 5. Compilar no Android Studio
```bash
# Extrair o ZIP
unzip MeuApp_Android.zip

# Abrir no Android Studio
# File > Open > Selecionar pasta

# Compilar APK
./gradlew assembleDebug

# Instalar no dispositivo
adb install app/build/outputs/apk/debug/app-debug.apk
```

## 🎨 Estrutura Gerada

```
MeuApp_Android/
├── app/
│   ├── src/
│   │   └── main/
│   │       ├── assets/
│   │       │   └── index.html          # ← SEU HTML AQUI
│   │       ├── java/com/meuapp/tarefas/
│   │       │   └── MainActivity.kt     # ← WebView + Bridge
│   │       ├── res/
│   │       │   ├── values/
│   │       │   │   ├── strings.xml
│   │       │   │   ├── colors.xml
│   │       │   │   └── themes.xml
│   │       │   └── mipmap-*/           # ← Ícones
│   │       └── AndroidManifest.xml     # ← Permissões
│   └── build.gradle                    # ← Dependências
├── build.gradle                        # ← Config raiz
├── settings.gradle
├── gradle.properties
├── README.md                           # ← Instruções
└── INSTRUCTIONS.txt                    # ← Guia rápido
```

## 🔌 Interface JavaScript-Android

Seu HTML pode chamar funções nativas do Android:

```javascript
// Mostrar notificação toast
window.AndroidInterface.showToast('Tarefa concluída!');

// Vibrar o dispositivo
window.AndroidInterface.vibrate(100); // 100ms

// Compartilhar texto
window.AndroidInterface.shareText('Confira meu app de tarefas!');
```

## 📋 Exemplo Completo

### HTML Gerado pela IA:
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Minhas Tarefas</title>
  <style>
    body {
      font-family: system-ui;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }
    .task {
      background: white;
      padding: 15px;
      margin: 10px 0;
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
  </style>
</head>
<body>
  <h1>📝 Minhas Tarefas</h1>
  <div id="tasks"></div>
  
  <script>
    function addTask(text) {
      const div = document.createElement('div');
      div.className = 'task';
      div.textContent = text;
      div.onclick = () => {
        // Chamar função nativa do Android
        window.AndroidInterface.showToast('Tarefa concluída!');
        window.AndroidInterface.vibrate(50);
        div.style.opacity = '0.5';
      };
      document.getElementById('tasks').appendChild(div);
    }
    
    addTask('Estudar React');
    addTask('Fazer exercícios');
    addTask('Ler um livro');
  </script>
</body>
</html>
```

### MainActivity.kt Gerado:
```kotlin
package com.meuapp.tarefas

import android.os.Bundle
import android.webkit.WebView
import android.webkit.JavascriptInterface
import android.widget.Toast
import android.os.Vibrator
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {
    private lateinit var webView: WebView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        webView = WebView(this)
        setContentView(webView)

        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
        }

        // Ponte JavaScript-Android
        webView.addJavascriptInterface(AndroidBridge(), "Android")

        // Carregar HTML local
        webView.loadUrl("file:///android_asset/index.html")
    }

    inner class AndroidBridge {
        @JavascriptInterface
        fun showToast(message: String) {
            runOnUiThread {
                Toast.makeText(this@MainActivity, message, Toast.LENGTH_SHORT).show()
            }
        }

        @JavascriptInterface
        fun vibrate(duration: Long) {
            val vibrator = getSystemService(VIBRATOR_SERVICE) as Vibrator
            vibrator.vibrate(duration)
        }
    }
}
```

## 🚀 Casos de Uso

### 1. Landing Page → App
Transforme sua landing page em um app Android para distribuir na Play Store.

### 2. Jogo HTML5 → App
Converta jogos Canvas/WebGL em apps nativos.

### 3. Dashboard → App
Transforme dashboards web em apps mobile.

### 4. Portfólio → App
Crie um app de portfólio a partir do seu site.

### 5. Calculadora → App
Qualquer ferramenta web pode virar app.

## 🎯 Vantagens

✅ **Sem código nativo:** Apenas HTML/CSS/JS
✅ **Rápido:** Gera projeto completo em segundos
✅ **Completo:** Pronto para compilar e publicar
✅ **Flexível:** Personalize tudo depois
✅ **Profissional:** Código limpo e organizado
✅ **Documentado:** README completo incluído

## 🔧 Requisitos para Compilar

- **Android Studio:** Arctic Fox ou superior
- **JDK:** 11 ou superior
- **Android SDK:** API 24+ (Android 7.0)
- **Gradle:** Incluído no projeto

## 📱 Testando

### Emulador:
1. Abra AVD Manager no Android Studio
2. Crie um dispositivo virtual
3. Execute o app (▶️)

### Dispositivo Real:
1. Ative "Depuração USB" no celular
2. Conecte via USB
3. Execute: `adb install app-debug.apk`

## 🎨 Personalizando

### Mudar Ícone:
Substitua os arquivos em `app/src/main/res/mipmap-*/ic_launcher.png`

### Adicionar Splash Screen:
Edite `themes.xml` e adicione `android:windowBackground`

### Mudar Cores:
Edite `app/src/main/res/values/colors.xml`

### Adicionar Permissões:
Edite `AndroidManifest.xml` e adicione `<uses-permission>`

## 🐛 Troubleshooting

### "Gradle sync failed"
```bash
./gradlew clean
./gradlew build --refresh-dependencies
```

### "App crashes on launch"
Verifique os logs:
```bash
adb logcat | grep -i error
```

### "JavaScript not working"
Certifique-se de que `javaScriptEnabled = true` no MainActivity.kt

## 📚 Recursos

- [Documentação WebView](https://developer.android.com/reference/android/webkit/WebView)
- [Guia Android Studio](https://developer.android.com/studio/intro)
- [Publicar na Play Store](https://developer.android.com/distribute)

## 🎉 Pronto!

Agora você pode transformar qualquer HTML em um app Android profissional em minutos! 🚀
