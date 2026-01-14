# 🧱 Estrutura Completa de App Android WebView

## 📚 Guia de Aprendizado para o Sistema

Este documento ensina ao sistema como construir um aplicativo Android WebView completo, pronto para compilar no Android Studio.

---

## 🗂️ Estrutura de Pastas Completa

```
MeuAppWebView/
│
├── app/
│   ├── src/
│   │   ├── main/
│   │   │   ├── AndroidManifest.xml          # Configurações do app
│   │   │   ├── java/
│   │   │   │   └── com/
│   │   │   │       └── exemplo/
│   │   │   │           └── meuapp/
│   │   │   │               ├── MainActivity.java    # Activity principal (Java)
│   │   │   │               └── MainActivity.kt      # Activity principal (Kotlin)
│   │   │   ├── res/
│   │   │   │   ├── layout/
│   │   │   │   │   └── activity_main.xml    # Layout da tela
│   │   │   │   ├── values/
│   │   │   │   │   ├── strings.xml          # Textos do app
│   │   │   │   │   ├── colors.xml           # Cores
│   │   │   │   │   └── themes.xml           # Temas
│   │   │   │   └── mipmap-*/                # Ícones (várias resoluções)
│   │   │   └── assets/
│   │   │       └── index.html               # SEU HTML AQUI!
│   │   └── build.gradle                     # Config do módulo app
│   └── proguard-rules.pro                   # Regras de ofuscação
│
├── gradle/
│   └── wrapper/
│       ├── gradle-wrapper.jar               # JAR do Gradle
│       └── gradle-wrapper.properties        # Config do wrapper
│
├── gradlew                                  # Script Gradle (Linux/Mac)
├── gradlew.bat                              # Script Gradle (Windows)
├── settings.gradle                          # Configurações do projeto
├── build.gradle                             # Config raiz
├── gradle.properties                        # Propriedades do Gradle
├── .gitignore                               # Arquivos ignorados pelo Git
└── README.md                                # Documentação

```

---

## 🧩 Propósito de Cada Arquivo

### 📱 **index.html** (assets/)
- **O QUE É:** Seu aplicativo web (HTML/CSS/JS)
- **ONDE FICA:** `app/src/main/assets/index.html`
- **FUNÇÃO:** Interface do usuário que será exibida no WebView
- **IMPORTANTE:** Deve ter meta tags viewport para mobile

### ⚙️ **MainActivity.java** (java/)
- **O QUE É:** Código Java que carrega o WebView
- **ONDE FICA:** `app/src/main/java/com/exemplo/meuapp/MainActivity.java`
- **FUNÇÃO:** 
  - Cria o WebView
  - Habilita JavaScript
  - Carrega o index.html
  - Cria ponte JavaScript-Android
- **IMPORTANTE:** Package name deve corresponder ao AndroidManifest.xml

### 🎨 **activity_main.xml** (layout/)
- **O QUE É:** Layout XML da tela principal
- **ONDE FICA:** `app/src/main/res/layout/activity_main.xml`
- **FUNÇÃO:** Define como o WebView é exibido na tela
- **IMPORTANTE:** Deve ter um WebView com id="webview"

### 📜 **AndroidManifest.xml**
- **O QUE É:** Manifesto do aplicativo
- **ONDE FICA:** `app/src/main/AndroidManifest.xml`
- **FUNÇÃO:**
  - Define permissões (Internet, Câmera, GPS, etc)
  - Declara a Activity principal
  - Configura orientação da tela
  - Define ícone e nome do app
- **IMPORTANTE:** Package name único (ex: com.exemplo.meuapp)

### 📝 **strings.xml** (values/)
- **O QUE É:** Textos do aplicativo
- **ONDE FICA:** `app/src/main/res/values/strings.xml`
- **FUNÇÃO:** Armazena o nome do app e outros textos
- **IMPORTANTE:** Facilita tradução para outros idiomas

### 🎨 **colors.xml** (values/)
- **O QUE É:** Paleta de cores
- **ONDE FICA:** `app/src/main/res/values/colors.xml`
- **FUNÇÃO:** Define cores usadas no tema do app

### 🎭 **themes.xml** (values/)
- **O QUE É:** Tema visual do app
- **ONDE FICA:** `app/src/main/res/values/themes.xml`
- **FUNÇÃO:** Define aparência (cores, status bar, action bar)

### 🔧 **build.gradle** (app/)
- **O QUE É:** Configuração de build do módulo
- **ONDE FICA:** `app/build.gradle`
- **FUNÇÃO:**
  - Define SDK mínimo e alvo
  - Declara dependências (AndroidX, Material, etc)
  - Configura versão do app
- **IMPORTANTE:** Deve ter plugin Android Application

### 🔧 **build.gradle** (raiz)
- **O QUE É:** Configuração de build raiz
- **ONDE FICA:** `build.gradle`
- **FUNÇÃO:**
  - Define repositórios (Google, Maven)
  - Declara plugins (Android, Kotlin)
  - Configurações globais

### ⚙️ **settings.gradle**
- **O QUE É:** Configurações do projeto
- **ONDE FICA:** `settings.gradle`
- **FUNÇÃO:**
  - Define nome do projeto
  - Inclui módulos (app)
  - Configura repositórios

### 🔧 **gradle.properties**
- **O QUE É:** Propriedades do Gradle
- **ONDE FICA:** `gradle.properties`
- **FUNÇÃO:**
  - Configura memória JVM
  - Habilita AndroidX
  - Configurações de build

### 📦 **gradle-wrapper.properties**
- **O QUE É:** Configuração do Gradle Wrapper
- **ONDE FICA:** `gradle/wrapper/gradle-wrapper.properties`
- **FUNÇÃO:** Define versão do Gradle a ser usada

### 🚀 **gradlew / gradlew.bat**
- **O QUE É:** Scripts de build
- **ONDE FICA:** Raiz do projeto
- **FUNÇÃO:** Executam comandos Gradle sem instalação global

---

## 📝 Código Essencial

### 1️⃣ MainActivity.java (Versão Mínima)

```java
package com.exemplo.meuapp;

import android.os.Bundle;
import android.webkit.WebView;
import android.webkit.WebSettings;
import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        WebView webView = new WebView(this);
        setContentView(webView);
        
        WebSettings webSettings = webView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        
        webView.loadUrl("file:///android_asset/index.html");
    }
}
```

**EXPLICAÇÃO:**
- `WebView webView = new WebView(this)` → Cria o WebView
- `setContentView(webView)` → Define como conteúdo da tela
- `setJavaScriptEnabled(true)` → Habilita JavaScript
- `loadUrl("file:///android_asset/index.html")` → Carrega o HTML

---

### 2️⃣ activity_main.xml (Layout)

```xml
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:orientation="vertical"
    android:layout_width="match_parent"
    android:layout_height="match_parent">

    <WebView
        android:id="@+id/webview"
        android:layout_width="match_parent"
        android:layout_height="match_parent" />

</LinearLayout>
```

**EXPLICAÇÃO:**
- `LinearLayout` → Container vertical
- `WebView` → Componente que exibe HTML
- `match_parent` → Ocupa toda a tela

---

### 3️⃣ AndroidManifest.xml (Mínimo)

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.exemplo.meuapp">

    <uses-permission android:name="android.permission.INTERNET" />

    <application
        android:label="@string/app_name"
        android:theme="@style/Theme.AppCompat.Light.NoActionBar">
        
        <activity android:name=".MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
```

**EXPLICAÇÃO:**
- `package` → Identificador único do app
- `uses-permission INTERNET` → Permite acesso à internet
- `android:exported="true"` → Permite iniciar o app
- `intent-filter MAIN/LAUNCHER` → Define como app principal

---

### 4️⃣ strings.xml

```xml
<resources>
    <string name="app_name">MeuAppWebView</string>
</resources>
```

---

### 5️⃣ index.html (Exemplo Mobile)

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Meu App WebView</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { 
      font-family: sans-serif; 
      text-align: center; 
      padding: 40px;
      margin: 0;
    }
    button { 
      padding: 12px 20px; 
      font-size: 16px;
      background: #6200EE;
      color: white;
      border: none;
      border-radius: 8px;
    }
  </style>
</head>
<body>
  <h1>App WebView funcionando!</h1>
  <button onclick="alert('Oi do WebView!')">Clique aqui</button>
  
  <script>
    // Interface com Android (se disponível)
    if (typeof Android !== 'undefined') {
      Android.showToast('App carregado!');
    }
  </script>
</body>
</html>
```

---

## 🔌 Ponte JavaScript-Android

### Como Criar Comunicação Bidirecional

**No Java (MainActivity.java):**

```java
// Adicionar interface JavaScript
webView.addJavascriptInterface(new AndroidBridge(), "Android");

// Classe da ponte
private class AndroidBridge {
    @JavascriptInterface
    public void showToast(String message) {
        runOnUiThread(() -> {
            Toast.makeText(MainActivity.this, message, Toast.LENGTH_SHORT).show();
        });
    }
}
```

**No HTML (index.html):**

```javascript
// Chamar função Android do JavaScript
window.Android.showToast('Olá do HTML!');
```

---

## 🚀 Comandos de Build

### Compilar APK Debug
```bash
./gradlew assembleDebug
```

### Instalar no Dispositivo
```bash
adb install app/build/outputs/apk/debug/app-debug.apk
```

### Limpar Build
```bash
./gradlew clean
```

---

## 📋 Checklist de Geração

Quando gerar um projeto Android WebView, o sistema deve:

- [ ] Criar estrutura de pastas completa
- [ ] Gerar MainActivity.java com WebView configurado
- [ ] Gerar activity_main.xml com layout
- [ ] Gerar AndroidManifest.xml com permissões
- [ ] Gerar strings.xml com nome do app
- [ ] Gerar colors.xml e themes.xml
- [ ] Gerar build.gradle (app e raiz)
- [ ] Gerar settings.gradle
- [ ] Gerar gradle.properties
- [ ] Gerar gradle-wrapper.properties
- [ ] Gerar scripts gradlew e gradlew.bat
- [ ] Gerar .gitignore
- [ ] Gerar proguard-rules.pro
- [ ] Colocar HTML em assets/index.html
- [ ] Gerar README.md com instruções
- [ ] Exportar tudo como ZIP

---

## 🎯 Regras de Ouro

1. **Package Name Único:** Sempre use formato `com.empresa.nomedoapp`
2. **JavaScript Habilitado:** Essencial para apps web
3. **Meta Tags Viewport:** Obrigatório para responsividade
4. **Permissão Internet:** Sempre incluir no Manifest
5. **Estrutura Completa:** Todos os arquivos necessários
6. **Scripts Gradle:** Incluir gradlew e gradlew.bat
7. **README Claro:** Instruções de compilação

---

## 🧠 Prompt de Geração Universal

```
Gere um projeto Android WebView completo seguindo esta estrutura:

1. Crie todas as pastas: app/src/main/{java,res,assets}
2. Gere MainActivity.java que:
   - Cria WebView programaticamente
   - Habilita JavaScript
   - Carrega file:///android_asset/index.html
   - Adiciona ponte JavaScript-Android
3. Gere activity_main.xml com WebView
4. Gere AndroidManifest.xml com:
   - Package: {packageName}
   - Permissão INTERNET
   - Activity exportada
5. Gere strings.xml com app_name
6. Gere build.gradle (app e raiz)
7. Gere settings.gradle
8. Gere gradle-wrapper.properties
9. Gere scripts gradlew
10. Coloque HTML em assets/index.html
11. Exporte tudo como ZIP

Package: {packageName}
App Name: {appName}
Min SDK: 24
Target SDK: 34
```

---

## ✅ Resultado Final

Um arquivo ZIP contendo projeto Android completo, pronto para:
- Abrir no Android Studio
- Compilar com `./gradlew assembleDebug`
- Instalar em dispositivo Android
- Publicar na Google Play Store (após assinar)

🎉 **Sistema agora sabe construir apps Android WebView completos!**
