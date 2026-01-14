// test-melhorias-android.js
// Teste completo das melhorias implementadas no sistema Android

import { AndroidWebViewGenerator } from './services/AndroidWebViewGenerator.ts';

console.log('🧪 TESTANDO MELHORIAS DO SISTEMA ANDROID\n');
console.log('═══════════════════════════════════════════════════════\n');

async function testarMelhorias() {
  try {
    // Configuração de teste
    const config = {
      appName: 'Lista de Tarefas',
      packageName: 'listatarefas', // Será validado automaticamente
      companyDomain: 'minhaempresa.com', // Teste de domínio customizado
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
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
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
      background: #2196F3;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 16px;
      cursor: pointer;
      min-height: 44px;
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
        window.AndroidInterface.showToast('Tarefa adicionada!');
        window.AndroidInterface.vibrate(50);
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
      fullscreen: false,
      generateKeystore: true,
      keystorePassword: 'minhaSenha123'
    };

    console.log('📋 CONFIGURAÇÃO DO TESTE:\n');
    console.log(`   App: ${config.appName}`);
    console.log(`   Package (original): ${config.packageName}`);
    console.log(`   Domínio: ${config.companyDomain}`);
    console.log(`   Keystore: ${config.generateKeystore ? 'Sim' : 'Não'}\n`);

    // Gerar projeto
    console.log('🤖 Gerando projeto Android...\n');
    
    const generator = new AndroidWebViewGenerator();
    const project = await generator.generateAndroidProject(config);

    console.log('\n✅ PROJETO GERADO COM SUCESSO!\n');
    console.log('═══════════════════════════════════════════════════════\n');

    // TESTE 1: Validação de Package Name
    console.log('📦 TESTE 1: VALIDAÇÃO DE PACKAGE NAME\n');
    
    const packageNameFiles = Array.from(project.files.keys()).filter(path => 
      path.includes('MainActivity') || path.includes('AndroidManifest')
    );
    
    let packageNameValidado = null;
    packageNameFiles.forEach(file => {
      const content = project.files.get(file);
      const match = content.match(/package="([^"]+)"|package ([^;]+);/);
      if (match) {
        packageNameValidado = match[1] || match[2];
      }
    });

    console.log(`   Package original: ${config.packageName}`);
    console.log(`   Package validado: ${packageNameValidado}`);
    console.log(`   Domínio usado: ${config.companyDomain}`);
    
    if (packageNameValidado && packageNameValidado.includes('.')) {
      console.log('   ✅ Package name validado corretamente!\n');
    } else {
      console.log('   ❌ Erro na validação do package name\n');
    }

    // TESTE 2: Ícones Gerados
    console.log('🎨 TESTE 2: ÍCONES DO APP\n');
    
    const iconFiles = Array.from(project.files.keys()).filter(path => 
      path.includes('mipmap') && path.includes('ic_launcher')
    );
    
    console.log(`   Total de ícones: ${iconFiles.size}`);
    
    const densities = ['mdpi', 'hdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi'];
    densities.forEach(density => {
      const hasIcon = iconFiles.some(path => path.includes(density));
      console.log(`   ${hasIcon ? '✅' : '❌'} mipmap-${density}`);
    });
    
    if (iconFiles.size >= 10) {
      console.log('   ✅ Todos os ícones foram gerados!\n');
    } else {
      console.log(`   ⚠️ Esperado: 10 ícones, Gerado: ${iconFiles.size}\n`);
    }

    // TESTE 3: Testes Automatizados
    console.log('🧪 TESTE 3: TESTES AUTOMATIZADOS\n');
    
    const testFiles = Array.from(project.files.keys()).filter(path => 
      path.includes('Test.java')
    );
    
    console.log(`   Total de arquivos de teste: ${testFiles.size}`);
    
    testFiles.forEach(file => {
      const type = file.includes('androidTest') ? 'Instrumentado' : 'Unitário';
      console.log(`   ✅ ${type}: ${file.split('/').pop()}`);
    });
    
    if (testFiles.size >= 2) {
      console.log('   ✅ Testes gerados corretamente!\n');
    } else {
      console.log('   ❌ Faltam arquivos de teste\n');
    }

    // TESTE 4: Instruções de Keystore
    console.log('🔐 TESTE 4: INSTRUÇÕES DE KEYSTORE\n');
    
    const keystoreFile = project.files.get('KEYSTORE_INSTRUCTIONS.md');
    
    if (keystoreFile) {
      console.log('   ✅ Arquivo KEYSTORE_INSTRUCTIONS.md gerado');
      
      const hasKeytool = keystoreFile.includes('keytool');
      const hasGradle = keystoreFile.includes('gradle');
      const hasPassword = keystoreFile.includes(config.keystorePassword);
      
      console.log(`   ${hasKeytool ? '✅' : '❌'} Instruções keytool`);
      console.log(`   ${hasGradle ? '✅' : '❌'} Configuração Gradle`);
      console.log(`   ${hasPassword ? '✅' : '❌'} Senha configurada`);
      console.log('');
    } else {
      console.log('   ❌ Arquivo de instruções não foi gerado\n');
    }

    // TESTE 5: Gradle Wrapper
    console.log('📦 TESTE 5: GRADLE WRAPPER\n');
    
    const gradleWrapperFile = project.files.get('gradle/wrapper/GRADLE_WRAPPER_JAR.txt');
    
    if (gradleWrapperFile) {
      console.log('   ✅ Arquivo GRADLE_WRAPPER_JAR.txt gerado');
      
      const hasInstructions = gradleWrapperFile.includes('gradle wrapper');
      const hasDownloadLink = gradleWrapperFile.includes('gradle.org');
      
      console.log(`   ${hasInstructions ? '✅' : '❌'} Instruções de geração`);
      console.log(`   ${hasDownloadLink ? '✅' : '❌'} Link de download`);
      console.log('');
    } else {
      console.log('   ❌ Arquivo de instruções não foi gerado\n');
    }

    // RESUMO GERAL
    console.log('═══════════════════════════════════════════════════════\n');
    console.log('📊 RESUMO GERAL\n');
    
    console.log(`   Total de arquivos: ${project.files.size}`);
    console.log(`   Ícones: ${iconFiles.size}`);
    console.log(`   Testes: ${testFiles.size}`);
    console.log(`   Package validado: ${packageNameValidado}`);
    console.log(`   Keystore: ${keystoreFile ? 'Sim' : 'Não'}`);
    console.log(`   Gradle Wrapper: ${gradleWrapperFile ? 'Sim' : 'Não'}`);
    
    console.log('\n═══════════════════════════════════════════════════════\n');

    // VALIDAÇÃO FINAL
    const checks = [
      { name: 'Package Name Validado', pass: packageNameValidado && packageNameValidado.includes('.') },
      { name: 'Ícones Gerados (10+)', pass: iconFiles.size >= 10 },
      { name: 'Testes Gerados (2+)', pass: testFiles.size >= 2 },
      { name: 'Instruções Keystore', pass: !!keystoreFile },
      { name: 'Gradle Wrapper', pass: !!gradleWrapperFile }
    ];

    const passed = checks.filter(c => c.pass).length;
    const total = checks.length;

    console.log('✅ VALIDAÇÃO FINAL\n');
    checks.forEach(check => {
      console.log(`   ${check.pass ? '✅' : '❌'} ${check.name}`);
    });

    console.log(`\n   Resultado: ${passed}/${total} checks passaram\n`);

    if (passed === total) {
      console.log('🎉 SUCESSO! TODAS AS MELHORIAS ESTÃO FUNCIONANDO!\n');
      console.log('═══════════════════════════════════════════════════════\n');
      
      // Mostrar alguns arquivos importantes
      console.log('📄 ARQUIVOS IMPORTANTES GERADOS:\n');
      
      const importantFiles = [
        'README.md',
        'KEYSTORE_INSTRUCTIONS.md',
        'app/src/main/AndroidManifest.xml',
        'app/src/test/java/com/minhaempresa/listatarefas/ExampleUnitTest.java',
        'app/src/main/res/mipmap-xxxhdpi/ic_launcher.xml'
      ];

      importantFiles.forEach(file => {
        if (project.files.has(file)) {
          console.log(`   ✅ ${file}`);
        }
      });

      console.log('\n═══════════════════════════════════════════════════════\n');
      console.log('🚀 PRÓXIMOS PASSOS:\n');
      console.log('   1. Extrair o ZIP gerado');
      console.log('   2. Abrir no Android Studio');
      console.log('   3. Executar: gradle wrapper');
      console.log('   4. Executar: ./gradlew assembleDebug');
      console.log('   5. Instalar: adb install app/build/outputs/apk/debug/app-debug.apk\n');
      
    } else {
      console.log('⚠️ ATENÇÃO! Algumas melhorias não estão funcionando.\n');
      console.log(`   ${passed}/${total} checks passaram\n`);
    }

    console.log('═══════════════════════════════════════════════════════\n');
    console.log('✅ TESTE COMPLETO FINALIZADO!\n');

  } catch (error) {
    console.error('\n❌ ERRO NO TESTE:', error);
    console.error('\nStack trace:', error.stack);
  }
}

// Executar teste
testarMelhorias().catch(console.error);
