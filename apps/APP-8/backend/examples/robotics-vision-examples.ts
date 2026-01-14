/**
 * 🤖 Exemplos de Uso do Robotics Vision
 */

import { roboticsVisionService } from '../src/services/roboticsVisionService.js';
import { executorService } from '../src/services/executorService.js';

// ============================================
// EXEMPLO 1: Detectar todos os botões na tela
// ============================================
async function example1_DetectButtons() {
  console.log('\n📦 EXEMPLO 1: Detectar Botões\n');
  
  const buttons = await roboticsVisionService.detect2DBoundingBoxes('buttons', 20);
  
  console.log(`✅ Encontrados ${buttons.length} botões:`);
  buttons.forEach((btn, i) => {
    console.log(`  ${i + 1}. ${btn.label}`);
    console.log(`     Posição: (${(btn.x * 100).toFixed(1)}%, ${(btn.y * 100).toFixed(1)}%)`);
    console.log(`     Tamanho: ${(btn.width * 100).toFixed(1)}% × ${(btn.height * 100).toFixed(1)}%`);
  });
}

// ============================================
// EXEMPLO 2: Encontrar e clicar em um botão
// ============================================
async function example2_FindAndClick() {
  console.log('\n🎯 EXEMPLO 2: Encontrar e Clicar\n');
  
  const result = await roboticsVisionService.findAndClick('close button');
  
  if (result.success) {
    console.log(`✅ Clicado em "${result.label}" na posição (${result.clicked?.x}, ${result.clicked?.y})`);
  } else {
    console.log('❌ Botão não encontrado');
  }
}

// ============================================
// EXEMPLO 3: Detectar ícones com pontos
// ============================================
async function example3_DetectIcons() {
  console.log('\n📍 EXEMPLO 3: Detectar Ícones (Points)\n');
  
  const icons = await roboticsVisionService.detectPoints('icons', 15);
  
  console.log(`✅ Encontrados ${icons.length} ícones:`);
  icons.forEach((icon, i) => {
    console.log(`  ${i + 1}. ${icon.label} - (${(icon.x * 100).toFixed(1)}%, ${(icon.y * 100).toFixed(1)}%)`);
  });
}

// ============================================
// EXEMPLO 4: Workflow completo - Abrir app
// ============================================
async function example4_OpenApplication() {
  console.log('\n🚀 EXEMPLO 4: Abrir Aplicação\n');
  
  // 1. Detecta ícones na área de trabalho
  console.log('1️⃣ Detectando ícones...');
  const icons = await roboticsVisionService.detectPoints('application icons', 20);
  
  // 2. Procura pelo Chrome
  const chromeIcon = icons.find(icon => 
    icon.label.toLowerCase().includes('chrome') ||
    icon.label.toLowerCase().includes('browser')
  );
  
  if (chromeIcon) {
    console.log(`2️⃣ Encontrado: ${chromeIcon.label}`);
    
    // 3. Obtém dimensões da tela
    const screenInfo = await executorService.getScreenInfo();
    const x = Math.round(chromeIcon.x * screenInfo.screen.width);
    const y = Math.round(chromeIcon.y * screenInfo.screen.height);
    
    // 4. Duplo clique para abrir
    console.log(`3️⃣ Abrindo em (${x}, ${y})...`);
    await executorService.doubleClick(x, y);
    
    console.log('✅ Aplicação aberta!');
  } else {
    console.log('❌ Ícone não encontrado');
  }
}

// ============================================
// EXEMPLO 5: Navegação visual em formulário
// ============================================
async function example5_FillForm() {
  console.log('\n📝 EXEMPLO 5: Preencher Formulário\n');
  
  // 1. Detecta campos de entrada
  console.log('1️⃣ Detectando campos...');
  const fields = await roboticsVisionService.detect2DBoundingBoxes('input fields', 10);
  
  console.log(`✅ Encontrados ${fields.length} campos`);
  
  // 2. Procura campo de email
  const emailField = fields.find(f => 
    f.label.toLowerCase().includes('email') ||
    f.label.toLowerCase().includes('e-mail')
  );
  
  if (emailField) {
    console.log(`2️⃣ Campo de email encontrado: ${emailField.label}`);
    
    // 3. Clica no campo
    const screenInfo = await executorService.getScreenInfo();
    const x = Math.round((emailField.x + emailField.width / 2) * screenInfo.screen.width);
    const y = Math.round((emailField.y + emailField.height / 2) * screenInfo.screen.height);
    
    await executorService.click('left', x, y);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 4. Digita email
    console.log('3️⃣ Digitando email...');
    await executorService.type('[email]@example.com');
    
    console.log('✅ Formulário preenchido!');
  }
}

// ============================================
// EXEMPLO 6: Detecção com Thinking habilitado
// ============================================
async function example6_ThinkingMode() {
  console.log('\n🧠 EXEMPLO 6: Modo Thinking (Cena Complexa)\n');
  
  console.log('Detectando com Thinking habilitado (mais lento, mais preciso)...');
  
  const startTime = Date.now();
  const objects = await roboticsVisionService.detect2DBoundingBoxes(
    'all interactive elements',
    30,
    true // enableThinking
  );
  const duration = Date.now() - startTime;
  
  console.log(`✅ Detectados ${objects.length} elementos em ${(duration / 1000).toFixed(2)}s`);
  
  // Agrupa por tipo
  const byType: Record<string, number> = {};
  objects.forEach(obj => {
    const type = obj.label.split(' ').pop() || 'unknown';
    byType[type] = (byType[type] || 0) + 1;
  });
  
  console.log('\n📊 Resumo por tipo:');
  Object.entries(byType).forEach(([type, count]) => {
    console.log(`  ${type}: ${count}`);
  });
}

// ============================================
// EXEMPLO 7: Comparação de modos
// ============================================
async function example7_CompareDetectionModes() {
  console.log('\n⚖️  EXEMPLO 7: Comparação de Modos\n');
  
  const target = 'buttons';
  
  // Modo 1: 2D Bounding Boxes
  console.log('1️⃣ Testando 2D Bounding Boxes...');
  const start1 = Date.now();
  const boxes = await roboticsVisionService.detect2DBoundingBoxes(target, 10);
  const time1 = Date.now() - start1;
  console.log(`   ✅ ${boxes.length} objetos em ${time1}ms`);
  
  // Modo 2: Points
  console.log('2️⃣ Testando Points...');
  const start2 = Date.now();
  const points = await roboticsVisionService.detectPoints(target, 10);
  const time2 = Date.now() - start2;
  console.log(`   ✅ ${points.length} pontos em ${time2}ms`);
  
  // Modo 3: Segmentation Masks
  console.log('3️⃣ Testando Segmentation Masks...');
  const start3 = Date.now();
  const masks = await roboticsVisionService.detectSegmentationMasks(target, 10);
  const time3 = Date.now() - start3;
  console.log(`   ✅ ${masks.length} máscaras em ${time3}ms`);
  
  console.log('\n📊 Resumo:');
  console.log(`   Bounding Boxes: ${time1}ms`);
  console.log(`   Points: ${time2}ms`);
  console.log(`   Segmentation: ${time3}ms`);
}

// ============================================
// EXECUTAR EXEMPLOS
// ============================================
async function runExamples() {
  console.log('🤖 EXEMPLOS DE ROBOTICS VISION');
  console.log('═'.repeat(60));
  
  try {
    // Descomente o exemplo que quiser testar:
    
    // await example1_DetectButtons();
    // await example2_FindAndClick();
    // await example3_DetectIcons();
    // await example4_OpenApplication();
    // await example5_FillForm();
    // await example6_ThinkingMode();
    // await example7_CompareDetectionModes();
    
    console.log('\n✅ Exemplos concluídos!');
  } catch (error) {
    console.error('\n❌ Erro:', error);
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  runExamples();
}

export {
  example1_DetectButtons,
  example2_FindAndClick,
  example3_DetectIcons,
  example4_OpenApplication,
  example5_FillForm,
  example6_ThinkingMode,
  example7_CompareDetectionModes
};
