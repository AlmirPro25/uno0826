// test-android-structure-complete.js
// Teste completo da estrutura Android WebView

import { androidWebViewGenerator } from './services/AndroidWebViewGenerator.ts';

async function testCompleteAndroidStructure() {
  console.log('🧪 Testando Estrutura Android WebView Completa...\n');

  // Configuração de teste
  const config = {
    appName: 'Lista de Tarefas',
    packageName: 'com.exemplo.listatarefas',
    versionName: '1.0.0',
    versionCode: 1,
    minSdk: 24,
    targetSdk: 34,
    htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Lista de Tarefas</title>
  <style>
    body { 
      font-family: Arial, sans-serif; 
      padding: 20px;
      background: #f5f5f5;
    }
    .task {
      background: white;
      padding: 15px;
      margin: 10px 0;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    button {
      background: #6200EE;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 16px;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <h1>📝 Minhas Tarefas</h1>
  <div id="tasks"></div>
  <button onclick="addTask()">Adicionar Tarefa</button>
  
  <script>
    let tasks = ['Estudar Android', 'Fazer exercícios', 'Ler livro'];
    
    function renderTasks() {
      const container = document.getElementById('tasks');
      container.innerHTML = tasks.map((task, i) => 
        \`<div class="task">\${i + 1}. \${task}</div>\`
      ).join('');
    }
    
    function addTask() {
      const task = prompt('Nova tarefa:');
      if (task) {
        tasks.push(task);
        renderTasks();
        
        // Notificar Android
        if (typeof Android !== 'undefined') {
          Android.showToast('Tarefa adicionada!');
          Android.vibrate(50);
        }
      }
    }
    
    renderTasks();
  </script>
</body>
</html>
    `,
    enableJavaScript: true,
    enableGeolocation: false,
    enableCamera: false,
    orientation: 'portrait',
    fullscreen: false
  };

  try {
    // Gerar projeto
    console.log('📱 Gerando projeto Android...');
    const project = await androidWebViewGenerator.generateAndroidProject(config);
    
    console.log('\n✅ Projeto gerado com sucesso!\n');
    
    // Validar estrutura
    console.log('🔍 Validando estrutura de arquivos...\n');
    
    const requiredFiles = [
      // Assets
      'app/src/main/assets/index.html',
      
      // Java/Kotlin
      'app/src/main/java/com/exemplo/listatarefas/MainActivity.java',
      'app/src/main/java/com/exemplo/listatarefas/MainActivity.kt',
      
      // Layout
      'app/src/main/res/layout/activity_main.xml',
      
      // Manifesto
      'app/src/main/AndroidManifest.xml',
      
      // Resources
      'app/src/main/res/values/strings.xml',
      'app/src/main/res/values/colors.xml',
      'app/src/main/res/values/themes.xml',
      
      // Gradle
      'app/build.gradle',
      'build.gradle',
      'settings.gradle',
      'gradle.properties',
      'gradle/wrapper/gradle-wrapper.properties',
      'gradlew',
      'gradlew.bat',
      
      // Outros
      '.gitignore',
      'app/proguard-rules.pro',
      'README.md',
      'INSTRUCTIONS.txt'
    ];
    
    let allFilesPresent = true;
    
    for (const file of requiredFiles) {
      if (project.files.has(file)) {
        console.log(`✅ ${file}`);
      } else {
        console.log(`❌ FALTANDO: ${file}`);
        allFilesPresent = false;
      }
    }
    
    console.log(`\n📊 Total de arquivos gerados: ${project.files.size}`);
    console.log(`📋 Arquivos esperados: ${requiredFiles.length}`);
    
    if (allFilesPresent) {
      console.log('\n🎉 SUCESSO! Todos os arquivos necessários foram gerados!');
    } else {
      console.log('\n⚠️ ATENÇÃO! Alguns arquivos estão faltando.');
    }
    
    // Validar conteúdo de arquivos críticos
    console.log('\n🔍 Validando conteúdo dos arquivos...\n');
    
    // Validar MainActivity.java
    const mainActivityJava = project.files.get('app/src/main/java/com/exemplo/listatarefas/MainActivity.java');
    if (mainActivityJava) {
      const checks = [
        { name: 'Package correto', test: mainActivityJava.includes('package com.exemplo.listatarefas') },
        { name: 'WebView criado', test: mainActivityJava.includes('new WebView(this)') },
        { name: 'JavaScript habilitado', test: mainActivityJava.includes('setJavaScriptEnabled(true)') },
        { name: 'Carrega index.html', test: mainActivityJava.includes('file:///android_asset/index.html') },
        { name: 'Ponte JavaScript', test: mainActivityJava.includes('addJavascriptInterface') },
        { name: 'Método showToast', test: mainActivityJava.includes('showToast') },
        { name: 'Método vibrate', test: mainActivityJava.includes('vibrate') },
        { name: 'Método shareText', test: mainActivityJava.includes('shareText') }
      ];
      
      console.log('MainActivity.java:');
      checks.forEach(check => {
        console.log(`  ${check.test ? '✅' : '❌'} ${check.name}`);
      });
    }
    
    // Validar AndroidManifest.xml
    const manifest = project.files.get('app/src/main/AndroidManifest.xml');
    if (manifest) {
      const checks = [
        { name: 'Package correto', test: manifest.includes('package="com.exemplo.listatarefas"') },
        { name: 'Permissão INTERNET', test: manifest.includes('android.permission.INTERNET') },
        { name: 'Activity exportada', test: manifest.includes('android:exported="true"') },
        { name: 'Intent filter MAIN', test: manifest.includes('android.intent.action.MAIN') },
        { name: 'Orientação portrait', test: manifest.includes('android:screenOrientation="portrait"') }
      ];
      
      console.log('\nAndroidManifest.xml:');
      checks.forEach(check => {
        console.log(`  ${check.test ? '✅' : '❌'} ${check.name}`);
      });
    }
    
    // Validar HTML
    const html = project.files.get('app/src/main/assets/index.html');
    if (html) {
      const checks = [
        { name: 'Meta viewport', test: html.includes('viewport') },
        { name: 'Interface Android', test: html.includes('AndroidInterface') },
        { name: 'Conteúdo original', test: html.includes('Lista de Tarefas') }
      ];
      
      console.log('\nindex.html:');
      checks.forEach(check => {
        console.log(`  ${check.test ? '✅' : '❌'} ${check.name}`);
      });
    }
    
    // Validar build.gradle
    const buildGradle = project.files.get('app/build.gradle');
    if (buildGradle) {
      const checks = [
        { name: 'Plugin Android', test: buildGradle.includes('com.android.application') },
        { name: 'Package correto', test: buildGradle.includes('com.exemplo.listatarefas') },
        { name: 'minSdk 24', test: buildGradle.includes('minSdk 24') },
        { name: 'targetSdk 34', test: buildGradle.includes('targetSdk 34') },
        { name: 'Dependências AndroidX', test: buildGradle.includes('androidx.core:core-ktx') }
      ];
      
      console.log('\napp/build.gradle:');
      checks.forEach(check => {
        console.log(`  ${check.test ? '✅' : '❌'} ${check.name}`);
      });
    }
    
    // Mostrar comandos de build
    console.log('\n🚀 Comandos de build disponíveis:');
    project.buildCommands.forEach(cmd => {
      console.log(`  $ ${cmd}`);
    });
    
    // Mostrar instruções
    console.log('\n📖 Instruções:');
    console.log(project.instructions);
    
    console.log('\n✅ TESTE COMPLETO FINALIZADO!');
    console.log('📦 O projeto está pronto para ser exportado como ZIP.');
    
  } catch (error) {
    console.error('\n❌ ERRO NO TESTE:', error);
    throw error;
  }
}

// Executar teste
testCompleteAndroidStructure().catch(console.error);
