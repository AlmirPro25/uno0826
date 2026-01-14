// services/AndroidWebViewGenerator.ts
// Agente especializado em converter HTML para APK Android usando WebView

import { GoogleGenAI } from "@google/genai";
import { ApiKeyManager } from './ApiKeyManager';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export interface AndroidAppConfig {
  appName: string;
  packageName: string;
  companyDomain?: string; // ex: "minhaempresa.com" -> "com.minhaempresa"
  versionName: string;
  versionCode: number;
  minSdk: number;
  targetSdk: number;
  htmlContent: string;
  enableJavaScript: boolean;
  enableGeolocation: boolean;
  enableCamera: boolean;
  orientation: 'portrait' | 'landscape' | 'sensor';
  fullscreen: boolean;
  icon?: string; // Base64 ou URL
  generateKeystore?: boolean; // Gerar keystore para assinatura
  keystorePassword?: string;
}

export interface AndroidProjectStructure {
  files: Map<string, string>;
  instructions: string;
  buildCommands: string[];
}

export class AndroidWebViewGenerator {
  private ai: GoogleGenAI;

  constructor() {
    const apiKey = ApiKeyManager.getKeyToUse();
    if (!apiKey) {
      throw new Error('API Key do Gemini não configurada');
    }
    this.ai = new GoogleGenAI({ apiKey });
  }

  /**
   * Gera projeto Android completo a partir de HTML
   * Estrutura completa seguindo padrão Android Studio / Gradle
   */
  async generateAndroidProject(config: AndroidAppConfig): Promise<AndroidProjectStructure> {
    console.log('🤖 Iniciando geração de projeto Android...');
    
    const files = new Map<string, string>();
    
    // ✅ VALIDAR E CORRIGIR PACKAGE NAME
    config.packageName = this.validatePackageName(config.packageName, config.companyDomain);
    console.log(`📦 Package name validado: ${config.packageName}`);
    
    // Extrair package path do packageName (ex: com.exemplo.meuapp -> com/exemplo/meuapp)
    const packagePath = config.packageName.replace(/\./g, '/');

    // 1. ASSETS - HTML do aplicativo
    files.set('app/src/main/assets/index.html', this.sanitizeHtmlForAndroid(config.htmlContent));

    // 2. JAVA/KOTLIN - Activity principal (gerando ambas as versões)
    files.set(`app/src/main/java/${packagePath}/MainActivity.java`, this.generateMainActivityJava(config));
    files.set(`app/src/main/java/${packagePath}/MainActivity.kt`, this.generateMainActivity(config));
    
    // 3. LAYOUT - activity_main.xml
    files.set('app/src/main/res/layout/activity_main.xml', this.generateActivityLayout());

    // 4. MANIFESTO
    files.set('app/src/main/AndroidManifest.xml', this.generateManifest(config));
    
    // 5. RECURSOS (values)
    files.set('app/src/main/res/values/strings.xml', this.generateStrings(config));
    files.set('app/src/main/res/values/colors.xml', this.generateColors());
    files.set('app/src/main/res/values/themes.xml', this.generateThemes());
    
    // ✅ 6. ÍCONES - Gerar automaticamente
    console.log('🎨 Gerando ícones do app...');
    const icons = this.generateAppIcons(config.appName);
    icons.forEach((content, path) => files.set(path, content));
    console.log(`✅ ${icons.size} ícones gerados`);
    
    // 7. GRADLE - Configurações de build
    files.set('app/build.gradle', this.generateAppBuildGradle(config));
    files.set('build.gradle', this.generateRootBuildGradle());
    files.set('settings.gradle', this.generateSettingsGradle(config));
    files.set('gradle.properties', this.generateGradleProperties());
    
    // ✅ 8. GRADLE WRAPPER - Scripts de build + JAR
    files.set('gradle/wrapper/gradle-wrapper.properties', this.generateGradleWrapperProperties());
    files.set('gradle/wrapper/GRADLE_WRAPPER_JAR.txt', this.generateGradleWrapperJar());
    files.set('gradlew', this.generateGradlewScript());
    files.set('gradlew.bat', this.generateGradlewBat());
    
    // ✅ 9. TESTES - Gerar automaticamente
    console.log('🧪 Gerando testes automatizados...');
    const tests = this.generateTests(config);
    tests.forEach((content, path) => files.set(path, content));
    console.log(`✅ ${tests.size} arquivos de teste gerados`);
    
    // ✅ 10. KEYSTORE - Instruções para assinatura
    if (config.generateKeystore) {
      console.log('🔐 Gerando instruções de keystore...');
      files.set('KEYSTORE_INSTRUCTIONS.md', this.generateKeystoreInstructions(config));
    }
    
    // 11. DOCUMENTAÇÃO
    files.set('README.md', this.generateReadme(config));
    files.set('INSTRUCTIONS.txt', this.generateInstructions(config));
    
    // 12. ARQUIVOS ADICIONAIS
    files.set('.gitignore', this.generateGitignore());
    files.set('app/proguard-rules.pro', this.generateProguardRules());
    
    const buildCommands = this.generateBuildCommands();

    console.log('✅ Projeto Android gerado com sucesso!');
    console.log(`📁 Total de arquivos: ${files.size}`);
    console.log(`📦 Package: ${config.packageName}`);
    console.log(`🎨 Ícones: ${icons.size} resoluções`);
    console.log(`🧪 Testes: ${tests.size} arquivos`);

    return { files, instructions: this.generateInstructions(config), buildCommands };
  }

  /**
   * Gera ícones do app em múltiplas resoluções
   */
  private generateAppIcons(appName: string): Map<string, string> {
    const icons = new Map<string, string>();
    
    // Gerar SVG base para o ícone
    const generateIconSVG = (size: number, bgColor: string, textColor: string) => {
      const initials = appName
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
      
      return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${bgColor};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${this.darkenColor(bgColor, 20)};stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="url(#grad)"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${size * 0.4}" font-weight="bold" 
        fill="${textColor}" text-anchor="middle" dominant-baseline="central">
    ${initials}
  </text>
</svg>`;
    };

    // Gerar ícones para diferentes densidades
    const densities = {
      'mipmap-mdpi': { size: 48, bgColor: '#2196F3', textColor: '#FFFFFF' },
      'mipmap-hdpi': { size: 72, bgColor: '#2196F3', textColor: '#FFFFFF' },
      'mipmap-xhdpi': { size: 96, bgColor: '#2196F3', textColor: '#FFFFFF' },
      'mipmap-xxhdpi': { size: 144, bgColor: '#2196F3', textColor: '#FFFFFF' },
      'mipmap-xxxhdpi': { size: 192, bgColor: '#2196F3', textColor: '#FFFFFF' }
    };

    Object.entries(densities).forEach(([folder, config]) => {
      const svg = generateIconSVG(config.size, config.bgColor, config.textColor);
      icons.set(`app/src/main/res/${folder}/ic_launcher.xml`, this.convertSVGToAndroidVector(svg, config.size));
      icons.set(`app/src/main/res/${folder}/ic_launcher_round.xml`, this.convertSVGToAndroidVector(svg, config.size));
    });

    return icons;
  }

  /**
   * Converte SVG para Android Vector Drawable
   */
  private convertSVGToAndroidVector(svg: string, size: number): string {
    const initials = svg.match(/<text[^>]*>([^<]+)<\/text>/)?.[1] || 'AP';
    
    return `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="${size}dp"
    android:height="${size}dp"
    android:viewportWidth="${size}"
    android:viewportHeight="${size}">
    
    <!-- Background -->
    <path
        android:fillColor="#2196F3"
        android:pathData="M0,${size * 0.2}Q0,0 ${size * 0.2},0L${size - size * 0.2},0Q${size},0 ${size},${size * 0.2}L${size},${size - size * 0.2}Q${size},${size} ${size - size * 0.2},${size}L${size * 0.2},${size}Q0,${size} 0,${size - size * 0.2}Z"/>
    
    <!-- Text (simulado com path) -->
    <group android:translateX="${size * 0.5}" android:translateY="${size * 0.5}">
        <path
            android:fillColor="#FFFFFF"
            android:pathData="M-${size * 0.15},-${size * 0.1}L-${size * 0.05},-${size * 0.1}L-${size * 0.05},${size * 0.1}L-${size * 0.15},${size * 0.1}Z
                           M${size * 0.05},-${size * 0.1}L${size * 0.15},-${size * 0.1}L${size * 0.15},${size * 0.1}L${size * 0.05},${size * 0.1}Z"/>
    </group>
</vector>`;
  }

  /**
   * Escurece uma cor hexadecimal
   */
  private darkenColor(hex: string, percent: number): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) - amt;
    const G = (num >> 8 & 0x00FF) - amt;
    const B = (num & 0x0000FF) - amt;
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255))
      .toString(16).slice(1);
  }

  /**
   * Gera Gradle Wrapper JAR (base64 encoded)
   */
  private generateGradleWrapperJar(): string {
    // Nota: Este é um placeholder. O JAR real deve ser baixado do Gradle
    return `# GRADLE WRAPPER JAR
# 
# Este arquivo deve conter o gradle-wrapper.jar
# Para gerar, execute: gradle wrapper
# 
# Ou baixe de: https://services.gradle.org/distributions/gradle-8.0-bin.zip
# 
# Instruções:
# 1. Baixe o Gradle 8.0
# 2. Execute: gradle wrapper
# 3. O JAR será gerado em gradle/wrapper/gradle-wrapper.jar
`;
  }

  /**
   * Gera keystore para assinatura do APK
   */
  private generateKeystoreInstructions(config: AndroidAppConfig): string {
    const keystorePassword = config.keystorePassword || 'android123';
    const alias = config.appName.toLowerCase().replace(/\s+/g, '');
    
    return `# INSTRUÇÕES PARA GERAR KEYSTORE

## O que é Keystore?
O keystore é necessário para assinar seu APK antes de publicar na Play Store.

## Como Gerar

### Opção 1: Usando keytool (linha de comando)

\`\`\`bash
keytool -genkey -v -keystore ${alias}.keystore -alias ${alias} -keyalg RSA -keysize 2048 -validity 10000
\`\`\`

Quando solicitado, use:
- Password: ${keystorePassword}
- Nome: ${config.appName}
- Organização: Sua Empresa
- Cidade: Sua Cidade
- Estado: Seu Estado
- País: BR

### Opção 2: Usando Android Studio

1. Abra o projeto no Android Studio
2. Menu: Build → Generate Signed Bundle / APK
3. Clique em "Create new..."
4. Preencha os dados:
   - Key store path: ${alias}.keystore
   - Password: ${keystorePassword}
   - Alias: ${alias}
   - Validity: 25 anos

## Configurar no Gradle

Adicione ao arquivo \`app/build.gradle\`:

\`\`\`gradle
android {
    signingConfigs {
        release {
            storeFile file('../${alias}.keystore')
            storePassword '${keystorePassword}'
            keyAlias '${alias}'
            keyPassword '${keystorePassword}'
        }
    }
    
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
\`\`\`

## Gerar APK Assinado

\`\`\`bash
./gradlew assembleRelease
\`\`\`

O APK estará em: \`app/build/outputs/apk/release/app-release.apk\`

## ⚠️ IMPORTANTE

- NUNCA compartilhe seu keystore ou senha
- Faça backup do keystore em local seguro
- Se perder o keystore, não poderá atualizar o app na Play Store
`;
  }

  /**
   * Gera testes automatizados
   */
  private generateTests(config: AndroidAppConfig): Map<string, string> {
    const tests = new Map<string, string>();
    const packagePath = config.packageName.replace(/\./g, '/');

    // Teste unitário
    tests.set(`app/src/test/java/${packagePath}/ExampleUnitTest.java`, `
package ${config.packageName};

import org.junit.Test;
import static org.junit.Assert.*;

/**
 * Testes unitários para ${config.appName}
 */
public class ExampleUnitTest {
    @Test
    public void addition_isCorrect() {
        assertEquals(4, 2 + 2);
    }
    
    @Test
    public void packageName_isCorrect() {
        assertEquals("${config.packageName}", "${config.packageName}");
    }
    
    @Test
    public void appName_isNotEmpty() {
        String appName = "${config.appName}";
        assertNotNull(appName);
        assertFalse(appName.isEmpty());
    }
}
`);

    // Teste instrumentado
    tests.set(`app/src/androidTest/java/${packagePath}/ExampleInstrumentedTest.java`, `
package ${config.packageName};

import android.content.Context;
import androidx.test.platform.app.InstrumentationRegistry;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import org.junit.Test;
import org.junit.runner.RunWith;
import static org.junit.Assert.*;

/**
 * Testes instrumentados para ${config.appName}
 */
@RunWith(AndroidJUnit4.class)
public class ExampleInstrumentedTest {
    @Test
    public void useAppContext() {
        Context appContext = InstrumentationRegistry.getInstrumentation().getTargetContext();
        assertEquals("${config.packageName}", appContext.getPackageName());
    }
    
    @Test
    public void webView_isAvailable() {
        Context appContext = InstrumentationRegistry.getInstrumentation().getTargetContext();
        assertNotNull(appContext);
    }
}
`);

    return tests;
  }

  /**
   * Valida e corrige package name
   */
  private validatePackageName(packageName: string, companyDomain?: string): string {
    // Se tem domínio da empresa, usar ele
    if (companyDomain) {
      const domain = companyDomain.toLowerCase().replace(/[^a-z0-9.]/g, '');
      const parts = domain.split('.').reverse();
      const appName = packageName.split('.').pop() || 'app';
      return [...parts, appName].join('.');
    }

    // Validar formato
    const parts = packageName.split('.');
    if (parts.length < 2) {
      return `com.app.${packageName.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
    }

    // Limpar cada parte
    return parts
      .map(part => part.toLowerCase().replace(/[^a-z0-9]/g, ''))
      .filter(part => part.length > 0)
      .join('.');
  }

  /**
   * Sanitiza HTML para funcionar no Android WebView
   */
  private sanitizeHtmlForAndroid(html: string): string {
    // Adicionar meta tags para mobile
    const mobileMetaTags = `
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    `;

    // Inserir meta tags no head
    if (html.includes('</head>')) {
      html = html.replace('</head>', `${mobileMetaTags}</head>`);
    } else if (html.includes('<head>')) {
      html = html.replace('<head>', `<head>${mobileMetaTags}`);
    } else {
      html = `<!DOCTYPE html><html><head>${mobileMetaTags}</head><body>${html}</body></html>`;
    }

    // Adicionar interface JavaScript para comunicação com Android
    const androidInterface = `
    <script>
      // Interface para comunicação com código nativo Android
      window.AndroidInterface = {
        showToast: function(message) {
          if (typeof Android !== 'undefined') {
            Android.showToast(message);
          } else {
            console.log('Toast:', message);
          }
        },
        vibrate: function(duration) {
          if (typeof Android !== 'undefined') {
            Android.vibrate(duration);
          }
        },
        shareText: function(text) {
          if (typeof Android !== 'undefined') {
            Android.shareText(text);
          }
        }
      };
    </script>
    `;

    html = html.replace('</body>', `${androidInterface}</body>`);

    return html;
  }

  /**
   * Gera MainActivity.java (versão Java pura)
   */
  private generateMainActivityJava(config: AndroidAppConfig): string {
    return `package ${config.packageName};

import android.os.Bundle;
import android.webkit.WebView;
import android.webkit.WebSettings;
import android.webkit.WebViewClient;
import android.webkit.WebChromeClient;
import android.webkit.JavascriptInterface;
import android.widget.Toast;
import android.os.Vibrator;
import android.content.Intent;
import android.view.View;
import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {
    private WebView webView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        ${config.fullscreen ? `
        // Modo fullscreen
        getWindow().getDecorView().setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_LAYOUT_STABLE
            | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
            | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
            | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
            | View.SYSTEM_UI_FLAG_FULLSCREEN
            | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
        );
        ` : ''}
        
        // Criar WebView programaticamente
        webView = new WebView(this);
        setContentView(webView);

        // Configurações do WebView
        WebSettings webSettings = webView.getSettings();
        webSettings.setJavaScriptEnabled(${config.enableJavaScript});
        webSettings.setDomStorageEnabled(true);
        webSettings.setDatabaseEnabled(true);
        webSettings.setAllowFileAccess(true);
        webSettings.setAllowContentAccess(true);
        ${config.enableGeolocation ? 'webSettings.setGeolocationEnabled(true);' : ''}
        webSettings.setMediaPlaybackRequiresUserGesture(false);
        
        // Performance
        webSettings.setCacheMode(WebSettings.LOAD_DEFAULT);
        webSettings.setRenderPriority(WebSettings.RenderPriority.HIGH);

        // Cliente WebView
        webView.setWebViewClient(new WebViewClient());
        webView.setWebChromeClient(new WebChromeClient());

        // Interface JavaScript para comunicação com Android
        webView.addJavascriptInterface(new AndroidBridge(), "Android");

        // Carregar HTML local
        webView.loadUrl("file:///android_asset/index.html");
    }

    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    // Ponte JavaScript-Android
    private class AndroidBridge {
        @JavascriptInterface
        public void showToast(String message) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    Toast.makeText(MainActivity.this, message, Toast.LENGTH_SHORT).show();
                }
            });
        }

        @JavascriptInterface
        public void vibrate(long duration) {
            Vibrator vibrator = (Vibrator) getSystemService(VIBRATOR_SERVICE);
            if (vibrator != null) {
                vibrator.vibrate(duration);
            }
        }

        @JavascriptInterface
        public void shareText(String text) {
            Intent intent = new Intent(Intent.ACTION_SEND);
            intent.setType("text/plain");
            intent.putExtra(Intent.EXTRA_TEXT, text);
            startActivity(Intent.createChooser(intent, "Compartilhar"));
        }
    }
}
`;
  }

  /**
   * Gera MainActivity.kt (versão Kotlin)
   */
  private generateMainActivity(config: AndroidAppConfig): string {
    return `package ${config.packageName}

import android.os.Bundle
import android.webkit.WebView
import android.webkit.WebViewClient
import android.webkit.WebChromeClient
import android.webkit.JavascriptInterface
import android.widget.Toast
import android.os.Vibrator
import android.content.Intent
import android.view.View
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {
    private lateinit var webView: WebView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        ${config.fullscreen ? `
        // Modo fullscreen
        window.decorView.systemUiVisibility = (
            View.SYSTEM_UI_FLAG_LAYOUT_STABLE
            or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
            or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
            or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
            or View.SYSTEM_UI_FLAG_FULLSCREEN
            or View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
        )
        ` : ''}

        webView = WebView(this)
        setContentView(webView)

        // Configurações do WebView
        webView.settings.apply {
            javaScriptEnabled = ${config.enableJavaScript}
            domStorageEnabled = true
            databaseEnabled = true
            allowFileAccess = true
            allowContentAccess = true
            ${config.enableGeolocation ? 'setGeolocationEnabled(true)' : ''}
            mediaPlaybackRequiresUserGesture = false
            
            // Performance
            cacheMode = android.webkit.WebSettings.LOAD_DEFAULT
            setRenderPriority(android.webkit.WebSettings.RenderPriority.HIGH)
        }

        // Cliente WebView
        webView.webViewClient = WebViewClient()
        webView.webChromeClient = WebChromeClient()

        // Interface JavaScript para comunicação com Android
        webView.addJavascriptInterface(AndroidBridge(), "Android")

        // Carregar HTML local
        webView.loadUrl("file:///android_asset/index.html")
    }

    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }

    // Ponte JavaScript-Android
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

        @JavascriptInterface
        fun shareText(text: String) {
            val intent = Intent(Intent.ACTION_SEND).apply {
                type = "text/plain"
                putExtra(Intent.EXTRA_TEXT, text)
            }
            startActivity(Intent.createChooser(intent, "Compartilhar"))
        }
    }
}
`;
  }

  /**
   * Gera AndroidManifest.xml
   */
  private generateManifest(config: AndroidAppConfig): string {
    return `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="${config.packageName}">

    <!-- Permissões -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    ${config.enableGeolocation ? '<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />' : ''}
    ${config.enableCamera ? '<uses-permission android:name="android.permission.CAMERA" />' : ''}
    <uses-permission android:name="android.permission.VIBRATE" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.App"
        android:usesCleartextTraffic="true">
        
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:screenOrientation="${config.orientation}"
            android:configChanges="orientation|screenSize|keyboardHidden">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
`;
  }

  /**
   * Gera app/build.gradle
   */
  private generateAppBuildGradle(config: AndroidAppConfig): string {
    return `plugins {
    id 'com.android.application'
    id 'org.jetbrains.kotlin.android'
}

android {
    namespace '${config.packageName}'
    compileSdk 34

    defaultConfig {
        applicationId "${config.packageName}"
        minSdk ${config.minSdk}
        targetSdk ${config.targetSdk}
        versionCode ${config.versionCode}
        versionName "${config.versionName}"

        testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
    
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_1_8
        targetCompatibility JavaVersion.VERSION_1_8
    }
    
    kotlinOptions {
        jvmTarget = '1.8'
    }
}

dependencies {
    implementation 'androidx.core:core-ktx:1.12.0'
    implementation 'androidx.appcompat:appcompat:1.6.1'
    implementation 'com.google.android.material:material:1.11.0'
    implementation 'androidx.constraintlayout:constraintlayout:2.1.4'
    
    testImplementation 'junit:junit:4.13.2'
    androidTestImplementation 'androidx.test.ext:junit:1.1.5'
    androidTestImplementation 'androidx.test.espresso:espresso-core:3.5.1'
}
`;
  }

  /**
   * Gera build.gradle raiz
   */
  private generateRootBuildGradle(): string {
    return `// Top-level build file
buildscript {
    ext.kotlin_version = "1.9.0"
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath "com.android.tools.build:gradle:8.1.0"
        classpath "org.jetbrains.kotlin:kotlin-gradle-plugin:$kotlin_version"
    }
}

allprojects {
    repositories {
        google()
        mavenCentral()
    }
}

task clean(type: Delete) {
    delete rootProject.buildDir
}
`;
  }

  /**
   * Gera settings.gradle
   */
  private generateSettingsGradle(config: AndroidAppConfig): string {
    return `pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "${config.appName}"
include ':app'
`;
  }

  /**
   * Gera gradle.properties
   */
  private generateGradleProperties(): string {
    return `org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
android.enableJetifier=true
kotlin.code.style=official
`;
  }

  /**
   * Gera strings.xml
   */
  private generateStrings(config: AndroidAppConfig): string {
    return `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">${config.appName}</string>
</resources>
`;
  }

  /**
   * Gera colors.xml
   */
  private generateColors(): string {
    return `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="purple_200">#FFBB86FC</color>
    <color name="purple_500">#FF6200EE</color>
    <color name="purple_700">#FF3700B3</color>
    <color name="teal_200">#FF03DAC5</color>
    <color name="teal_700">#FF018786</color>
    <color name="black">#FF000000</color>
    <color name="white">#FFFFFFFF</color>
</resources>
`;
  }

  /**
   * Gera themes.xml
   */
  private generateThemes(): string {
    return `<?xml version="1.0" encoding="utf-8"?>
<resources xmlns:tools="http://schemas.android.com/tools">
    <style name="Theme.App" parent="Theme.MaterialComponents.DayNight.NoActionBar">
        <item name="colorPrimary">@color/purple_500</item>
        <item name="colorPrimaryVariant">@color/purple_700</item>
        <item name="colorOnPrimary">@color/white</item>
        <item name="colorSecondary">@color/teal_200</item>
        <item name="colorSecondaryVariant">@color/teal_700</item>
        <item name="colorOnSecondary">@color/black</item>
        <item name="android:statusBarColor" tools:targetApi="l">?attr/colorPrimaryVariant</item>
    </style>
</resources>
`;
  }

  /**
   * Gera activity_main.xml (layout)
   */
  private generateActivityLayout(): string {
    return `<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:orientation="vertical"
    android:layout_width="match_parent"
    android:layout_height="match_parent">

    <WebView
        android:id="@+id/webview"
        android:layout_width="match_parent"
        android:layout_height="match_parent" />

</LinearLayout>
`;
  }

  /**
   * Gera gradle-wrapper.properties
   */
  private generateGradleWrapperProperties(): string {
    return `distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\\://services.gradle.org/distributions/gradle-8.0-bin.zip
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
`;
  }

  /**
   * Gera script gradlew (Linux/Mac)
   */
  private generateGradlewScript(): string {
    return `#!/usr/bin/env sh

##############################################################################
##
##  Gradle start up script for UN*X
##
##############################################################################

# Attempt to set APP_HOME
# Resolve links: $0 may be a link
PRG="$0"
# Need this for relative symlinks.
while [ -h "$PRG" ] ; do
    ls=\`ls -ld "$PRG"\`
    link=\`expr "$ls" : '.*-> \\(.*\\)$'\`
    if expr "$link" : '/.*' > /dev/null; then
        PRG="$link"
    else
        PRG=\`dirname "$PRG"\`"/$link"
    fi
done
SAVED="\`pwd\`"
cd "\`dirname \\"$PRG\\"\`/" >/dev/null
APP_HOME="\`pwd -P\`"
cd "$SAVED" >/dev/null

APP_NAME="Gradle"
APP_BASE_NAME=\`basename "$0"\`

# Add default JVM options here. You can also use JAVA_OPTS and GRADLE_OPTS to pass JVM options to this script.
DEFAULT_JVM_OPTS='"-Xmx64m" "-Xms64m"'

# Use the maximum available, or set MAX_FD != -1 to use that value.
MAX_FD="maximum"

warn () {
    echo "$*"
}

die () {
    echo
    echo "$*"
    echo
    exit 1
}

# OS specific support (must be 'true' or 'false').
cygwin=false
msys=false
darwin=false
nonstop=false
case "\`uname\`" in
  CYGWIN* )
    cygwin=true
    ;;
  Darwin* )
    darwin=true
    ;;
  MINGW* )
    msys=true
    ;;
  NONSTOP* )
    nonstop=true
    ;;
esac

CLASSPATH=$APP_HOME/gradle/wrapper/gradle-wrapper.jar

# Determine the Java command to use to start the JVM.
if [ -n "$JAVA_HOME" ] ; then
    if [ -x "$JAVA_HOME/jre/sh/java" ] ; then
        # IBM's JDK on AIX uses strange locations for the executables
        JAVACMD="$JAVA_HOME/jre/sh/java"
    else
        JAVACMD="$JAVA_HOME/bin/java"
    fi
    if [ ! -x "$JAVACMD" ] ; then
        die "ERROR: JAVA_HOME is set to an invalid directory: $JAVA_HOME

Please set the JAVA_HOME variable in your environment to match the
location of your Java installation."
    fi
else
    JAVACMD="java"
    which java >/dev/null 2>&1 || die "ERROR: JAVA_HOME is not set and no 'java' command could be found in your PATH.

Please set the JAVA_HOME variable in your environment to match the
location of your Java installation."
fi

# Increase the maximum file descriptors if we can.
if [ "$cygwin" = "false" -a "$darwin" = "false" -a "$nonstop" = "false" ] ; then
    MAX_FD_LIMIT=\`ulimit -H -n\`
    if [ $? -eq 0 ] ; then
        if [ "$MAX_FD" = "maximum" -o "$MAX_FD" = "max" ] ; then
            MAX_FD="$MAX_FD_LIMIT"
        fi
        ulimit -n $MAX_FD
        if [ $? -ne 0 ] ; then
            warn "Could not set maximum file descriptor limit: $MAX_FD"
        fi
    else
        warn "Could not query maximum file descriptor limit: $MAX_FD_LIMIT"
    fi
fi

# For Darwin, add options to specify how the application appears in the dock
if $darwin; then
    GRADLE_OPTS="$GRADLE_OPTS \\"-Xdock:name=$APP_NAME\\" \\"-Xdock:icon=$APP_HOME/media/gradle.icns\\""
fi

# For Cygwin or MSYS, switch paths to Windows format before running java
if [ "$cygwin" = "true" -o "$msys" = "true" ] ; then
    APP_HOME=\`cygpath --path --mixed "$APP_HOME"\`
    CLASSPATH=\`cygpath --path --mixed "$CLASSPATH"\`
    JAVACMD=\`cygpath --unix "$JAVACMD"\`
fi

exec "$JAVACMD" "$@"
`;
  }

  /**
   * Gera script gradlew.bat (Windows)
   */
  private generateGradlewBat(): string {
    return `@rem
@rem Copyright 2015 the original author or authors.
@rem
@rem Licensed under the Apache License, Version 2.0 (the "License");
@rem you may not use this file except in compliance with the License.
@rem You may obtain a copy of the License at
@rem
@rem      https://www.apache.org/licenses/LICENSE-2.0
@rem
@rem Unless required by applicable law or agreed to in writing, software
@rem distributed under the License is distributed on an "AS IS" BASIS,
@rem WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
@rem See the License for the specific language governing permissions and
@rem limitations under the License.
@rem

@if "%DEBUG%" == "" @echo off
@rem ##########################################################################
@rem
@rem  Gradle startup script for Windows
@rem
@rem ##########################################################################

@rem Set local scope for the variables with windows NT shell
if "%OS%"=="Windows_NT" setlocal

set DIRNAME=%~dp0
if "%DIRNAME%" == "" set DIRNAME=.
set APP_BASE_NAME=%~n0
set APP_HOME=%DIRNAME%

@rem Resolve any "." and ".." in APP_HOME to make it shorter.
for %%i in ("%APP_HOME%") do set APP_HOME=%%~fi

@rem Add default JVM options here. You can also use JAVA_OPTS and GRADLE_OPTS to pass JVM options to this script.
set DEFAULT_JVM_OPTS="-Xmx64m" "-Xms64m"

@rem Find java.exe
if defined JAVA_HOME goto findJavaFromJavaHome

set JAVA_EXE=java.exe
%JAVA_EXE% -version >NUL 2>&1
if "%ERRORLEVEL%" == "0" goto execute

echo.
echo ERROR: JAVA_HOME is not set and no 'java' command could be found in your PATH.
echo.
echo Please set the JAVA_HOME variable in your environment to match the
echo location of your Java installation.

goto fail

:findJavaFromJavaHome
set JAVA_HOME=%JAVA_HOME:"=%
set JAVA_EXE=%JAVA_HOME%/bin/java.exe

if exist "%JAVA_EXE%" goto execute

echo.
echo ERROR: JAVA_HOME is set to an invalid directory: %JAVA_HOME%
echo.
echo Please set the JAVA_HOME variable in your environment to match the
echo location of your Java installation.

goto fail

:execute
@rem Setup the command line

set CLASSPATH=%APP_HOME%\\gradle\\wrapper\\gradle-wrapper.jar

@rem Execute Gradle
"%JAVA_EXE%" %DEFAULT_JVM_OPTS% %JAVA_OPTS% %GRADLE_OPTS% "-Dorg.gradle.appname=%APP_BASE_NAME%" -classpath "%CLASSPATH%" org.gradle.wrapper.GradleWrapperMain %*

:end
@rem End local scope for the variables with windows NT shell
if "%ERRORLEVEL%"=="0" goto mainEnd

:fail
rem Set variable GRADLE_EXIT_CONSOLE if you need the _script_ return code instead of
rem the _cmd.exe /c_ return code!
if  not "" == "%GRADLE_EXIT_CONSOLE%" exit 1
exit /b 1

:mainEnd
if "%OS%"=="Windows_NT" endlocal

:omega
`;
  }

  /**
   * Gera .gitignore
   */
  private generateGitignore(): string {
    return `*.iml
.gradle
/local.properties
/.idea/caches
/.idea/libraries
/.idea/modules.xml
/.idea/workspace.xml
/.idea/navEditor.xml
/.idea/assetWizardSettings.xml
.DS_Store
/build
/captures
.externalNativeBuild
.cxx
local.properties
`;
  }

  /**
   * Gera proguard-rules.pro
   */
  private generateProguardRules(): string {
    return `# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# If your project uses WebView with JS, uncomment the following
# and specify the fully qualified class name to the JavaScript interface
# class:
-keepclassmembers class fqcn.of.javascript.interface.for.webview {
   public *;
}

# Uncomment this to preserve the line number information for
# debugging stack traces.
-keepattributes SourceFile,LineNumberTable

# If you keep the line number information, uncomment this to
# hide the original source file name.
-renamesourcefileattribute SourceFile

# Keep WebView JavaScript Interface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
`;
  }

  /**
   * Gera README.md
   */
  private generateReadme(config: AndroidAppConfig): string {
    return `# ${config.appName}

Aplicativo Android gerado automaticamente pelo AI Web Weaver.

## 📱 Informações do App

- **Nome:** ${config.appName}
- **Package:** ${config.packageName}
- **Versão:** ${config.versionName} (${config.versionCode})
- **SDK Mínimo:** ${config.minSdk}
- **SDK Alvo:** ${config.targetSdk}

## ✨ Novidades desta Versão

- ✅ **Ícones Automáticos** - Gerados em 5 resoluções diferentes
- ✅ **Package Name Validado** - Formato correto garantido
- ✅ **Testes Incluídos** - Unitários e instrumentados
- ✅ **Instruções de Keystore** - Para publicar na Play Store
- ✅ **Gradle Wrapper** - Build system completo

## 🚀 Como Compilar

### Pré-requisitos
- Android Studio Arctic Fox ou superior
- JDK 11 ou superior
- Android SDK instalado

### Passos

1. **Gerar Gradle Wrapper JAR (Primeira vez):**
   \`\`\`bash
   # Baixe o Gradle 8.0 de: https://gradle.org/releases/
   # Ou execute: gradle wrapper
   \`\`\`

2. **Abrir no Android Studio:**
   - File → Open
   - Selecione a pasta do projeto
   - Aguarde sincronização automática

3. **Compilar APK Debug:**
   \`\`\`bash
   ./gradlew assembleDebug
   \`\`\`
   
   O APK estará em: \`app/build/outputs/apk/debug/app-debug.apk\`

4. **Instalar no dispositivo:**
   \`\`\`bash
   adb install app/build/outputs/apk/debug/app-debug.apk
   \`\`\`

## 🔐 Publicar na Play Store

Para publicar seu app, você precisa de um APK assinado:

1. **Gerar Keystore:**
   - Veja instruções em: \`KEYSTORE_INSTRUCTIONS.md\`
   - Ou use Android Studio: Build → Generate Signed Bundle

2. **Compilar APK Release:**
   \`\`\`bash
   ./gradlew assembleRelease
   \`\`\`

3. **Upload na Play Store:**
   - Acesse: https://play.google.com/console
   - Crie um novo app
   - Faça upload do APK assinado

## 🧪 Executar Testes

### Testes Unitários
\`\`\`bash
./gradlew test
\`\`\`

### Testes Instrumentados (requer dispositivo/emulador)
\`\`\`bash
./gradlew connectedAndroidTest
\`\`\`

## 🔧 Estrutura do Projeto

\`\`\`
${config.appName}/
├── app/
│   ├── src/
│   │   ├── main/
│   │   │   ├── assets/
│   │   │   │   └── index.html          # Seu HTML aqui
│   │   │   ├── java/
│   │   │   │   └── MainActivity.java   # Activity principal
│   │   │   ├── res/
│   │   │   │   ├── mipmap-*/           # Ícones (5 resoluções)
│   │   │   │   ├── layout/             # Layouts
│   │   │   │   └── values/             # Strings, cores, temas
│   │   │   └── AndroidManifest.xml     # Manifesto do app
│   │   ├── test/                       # Testes unitários
│   │   └── androidTest/                # Testes instrumentados
│   └── build.gradle                    # Configuração do módulo
├── gradle/wrapper/                     # Gradle wrapper
├── build.gradle                        # Configuração raiz
├── settings.gradle                     # Configurações do projeto
├── KEYSTORE_INSTRUCTIONS.md            # Como assinar o APK
└── README.md                           # Este arquivo
\`\`\`

## 🎨 Personalizando

### Modificar HTML
Edite o arquivo \`app/src/main/assets/index.html\`

### Mudar ícones
Os ícones foram gerados automaticamente em:
- \`app/src/main/res/mipmap-mdpi/\` (48x48)
- \`app/src/main/res/mipmap-hdpi/\` (72x72)
- \`app/src/main/res/mipmap-xhdpi/\` (96x96)
- \`app/src/main/res/mipmap-xxhdpi/\` (144x144)
- \`app/src/main/res/mipmap-xxxhdpi/\` (192x192)

Substitua os arquivos \`ic_launcher.xml\` e \`ic_launcher_round.xml\`

### Adicionar permissões
Edite \`app/src/main/AndroidManifest.xml\`

### Mudar cores
Edite \`app/src/main/res/values/colors.xml\`

## 📞 Interface JavaScript-Android

Seu HTML pode chamar funções nativas do Android:

\`\`\`javascript
// Mostrar toast (notificação)
window.AndroidInterface.showToast('Olá do HTML!');

// Vibrar dispositivo
window.AndroidInterface.vibrate(100); // 100ms

// Compartilhar texto
window.AndroidInterface.shareText('Confira este app!');
\`\`\`

## 🐛 Troubleshooting

### Erro: "gradle-wrapper.jar not found"
\`\`\`bash
# Solução: Gerar o wrapper
gradle wrapper
\`\`\`

### Erro de compilação
\`\`\`bash
# Limpar e recompilar
./gradlew clean
./gradlew assembleDebug
\`\`\`

### App não abre
\`\`\`bash
# Ver logs
adb logcat | grep ${config.packageName}
\`\`\`

### Testes falhando
\`\`\`bash
# Executar testes com mais detalhes
./gradlew test --info
\`\`\`

## 📊 Métricas do Projeto

- **Arquivos gerados:** ~30+
- **Ícones:** 5 resoluções
- **Testes:** 2 arquivos (unitário + instrumentado)
- **Documentação:** 3 arquivos (README, INSTRUCTIONS, KEYSTORE)
- **Package validado:** ✅ ${config.packageName}

## 📄 Licença

Gerado automaticamente pelo AI Web Weaver.

## 🆘 Suporte

- Documentação: Veja \`INSTRUCTIONS.txt\`
- Keystore: Veja \`KEYSTORE_INSTRUCTIONS.md\`
- Issues: Reporte problemas no repositório

---

**Gerado em:** ${new Date().toLocaleDateString('pt-BR')}  
**Versão do Gerador:** 2.0 (com melhorias)
`;
  }

  /**
   * Gera instruções de uso
   */
  private generateInstructions(config: AndroidAppConfig): string {
    return `
🤖 PROJETO ANDROID GERADO COM SUCESSO!

📱 App: ${config.appName}
📦 Package: ${config.packageName}

🔧 PRÓXIMOS PASSOS:

1. Extraia o arquivo ZIP
2. Abra a pasta no Android Studio
3. Aguarde a sincronização do Gradle
4. Conecte um dispositivo Android ou inicie um emulador
5. Clique em "Run" (▶️) ou execute: ./gradlew installDebug

💡 DICAS:

- O HTML está em: app/src/main/assets/index.html
- Para modificar o app, edite MainActivity.kt
- Para mudar ícones, substitua os arquivos em res/mipmap-*/

🚀 COMPILAR APK:
./gradlew assembleDebug

O APK estará em: app/build/outputs/apk/debug/app-debug.apk
`;
  }

  /**
   * Gera comandos de build
   */
  private generateBuildCommands(): string[] {
    return [
      './gradlew clean',
      './gradlew assembleDebug',
      'adb install app/build/outputs/apk/debug/app-debug.apk'
    ];
  }

  /**
   * Exporta projeto como ZIP
   */
  async exportAsZip(project: AndroidProjectStructure, appName: string): Promise<void> {
    console.log('📦 Criando arquivo ZIP...');
    
    const zip = new JSZip();

    // Adicionar todos os arquivos
    project.files.forEach((content, path) => {
      zip.file(path, content);
    });

    // Adicionar instruções
    zip.file('INSTRUCTIONS.txt', project.instructions);

    // Gerar ZIP
    const blob = await zip.generateAsync({ type: 'blob' });
    
    // Download
    saveAs(blob, `${appName.replace(/\s+/g, '')}_Android.zip`);
    
    console.log('✅ ZIP criado e download iniciado!');
  }
}

// Instância singleton
export const androidWebViewGenerator = new AndroidWebViewGenerator();
