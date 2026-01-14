import { GeminiResponse, NetworkArchitecture } from '../types';

// Respostas de exemplo para quando a API falha
const FALLBACK_RESPONSES: { [key: string]: GeminiResponse } = {
  'classificador_imagem': {
    pythonCode: `import tensorflow as tf
from tensorflow import keras
import numpy as np
import matplotlib.pyplot as plt

# Carregar e preprocessar dados CIFAR-10
(x_train, y_train), (x_test, y_test) = tf.keras.datasets.cifar10.load_data()

# Normalizar pixels para [0,1]
x_train = x_train.astype('float32') / 255.0
x_test = x_test.astype('float32') / 255.0

# Converter labels para categorical
y_train = tf.keras.utils.to_categorical(y_train, 10)
y_test = tf.keras.utils.to_categorical(y_test, 10)

# Criar modelo com Transfer Learning
base_model = tf.keras.applications.MobileNetV2(
    input_shape=(32, 32, 3),
    include_top=False,
    weights='imagenet'
)

# Congelar camadas base
base_model.trainable = False

# Adicionar cabeçalho personalizado
model = tf.keras.Sequential([
    tf.keras.layers.UpSampling2D(size=(7, 7)),  # MobileNetV2 espera 224x224
    base_model,
    tf.keras.layers.GlobalAveragePooling2D(),
    tf.keras.layers.Dropout(0.2),
    tf.keras.layers.Dense(10, activation='softmax')
])

# Compilar modelo
model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

# Treinar modelo
history = model.fit(
    x_train, y_train,
    batch_size=32,
    epochs=10,
    validation_data=(x_test, y_test),
    verbose=1
)

# Avaliar modelo
test_loss, test_accuracy = model.evaluate(x_test, y_test, verbose=0)
print(f"Acurácia no teste: {test_accuracy:.4f}")

# Salvar modelo
model.save('classificador_cifar10.keras')
print("Modelo salvo como 'classificador_cifar10.keras'")`,

    explanation: `# Classificador de Imagens CIFAR-10 com Transfer Learning

## Visão Geral
Este modelo utiliza **Transfer Learning** com MobileNetV2 para classificar imagens do dataset CIFAR-10 em 10 categorias diferentes.

## Arquitetura
- **Base Model**: MobileNetV2 pré-treinado no ImageNet
- **Upsampling**: Redimensiona imagens 32x32 para 224x224
- **Global Average Pooling**: Reduz dimensionalidade
- **Dropout**: Previne overfitting (20%)
- **Dense Layer**: Classificação final (10 classes)

## Processo de Treinamento
1. **Pré-processamento**: Normalização de pixels [0,1]
2. **Transfer Learning**: Usa features pré-treinadas
3. **Fine-tuning**: Treina apenas o cabeçalho
4. **Otimização**: Adam optimizer com learning rate 0.001

## Resultados Esperados
- Acurácia esperada: ~85-90%
- Tempo de treinamento: ~5-10 minutos
- Modelo final: ~9MB`,

    architecture: {
      layers: [
        {
          name: "input_layer",
          type: "Input",
          inputs: [],
          shape: [32, 32, 3]
        },
        {
          name: "upsampling",
          type: "UpSampling2D",
          inputs: ["input_layer"],
          shape: [224, 224, 3]
        },
        {
          name: "mobilenetv2_base",
          type: "MobileNetV2 (Pré-treinado)",
          inputs: ["upsampling"],
          shape: [7, 7, 1280]
        },
        {
          name: "global_avg_pooling",
          type: "GlobalAveragePooling2D",
          inputs: ["mobilenetv2_base"],
          shape: [1280]
        },
        {
          name: "dropout",
          type: "Dropout",
          inputs: ["global_avg_pooling"],
          rate: 0.2,
          shape: [1280]
        },
        {
          name: "output_layer",
          type: "Dense",
          inputs: ["dropout"],
          neurons: 10,
          activation: "softmax",
          shape: [10]
        }
      ]
    }
  },

  'analise_sentimentos': {
    pythonCode: `import tensorflow as tf
from tensorflow import keras
import numpy as np

# Carregar dados IMDB
(x_train, y_train), (x_test, y_test) = tf.keras.datasets.imdb.load_data(num_words=10000)

# Preprocessar sequências
x_train = tf.keras.preprocessing.sequence.pad_sequences(x_train, maxlen=500)
x_test = tf.keras.preprocessing.sequence.pad_sequences(x_test, maxlen=500)

# Criar modelo de análise de sentimentos
model = tf.keras.Sequential([
    tf.keras.layers.Embedding(10000, 128, input_length=500),
    tf.keras.layers.LSTM(64, dropout=0.5, recurrent_dropout=0.5),
    tf.keras.layers.Dense(1, activation='sigmoid')
])

# Compilar modelo
model.compile(
    optimizer='adam',
    loss='binary_crossentropy',
    metrics=['accuracy']
)

# Treinar modelo
history = model.fit(
    x_train, y_train,
    batch_size=32,
    epochs=15,
    validation_data=(x_test, y_test),
    verbose=1
)

# Avaliar modelo
test_loss, test_accuracy = model.evaluate(x_test, y_test, verbose=0)
print(f"Acurácia no teste: {test_accuracy:.4f}")

# Salvar modelo
model.save('analise_sentimentos.keras')
print("Modelo salvo como 'analise_sentimentos.keras'")`,

    explanation: `# Análise de Sentimentos com LSTM

## Visão Geral
Este modelo classifica reviews de filmes como positivos ou negativos usando uma rede LSTM.

## Arquitetura
- **Embedding**: Converte palavras em vetores densos (128 dimensões)
- **LSTM**: Processa sequências com memória de longo prazo (64 unidades)
- **Dropout**: Regularização para prevenir overfitting
- **Dense**: Classificação binária com sigmoid

## Dataset
- **IMDB Movie Reviews**: 50,000 reviews balanceados
- **Vocabulário**: 10,000 palavras mais frequentes
- **Sequência**: Máximo 500 palavras por review

## Resultados Esperados
- Acurácia esperada: ~87-92%
- Tempo de treinamento: ~10-15 minutos`,

    architecture: {
      layers: [
        {
          name: "input_layer",
          type: "Input",
          inputs: [],
          shape: [500]
        },
        {
          name: "embedding",
          type: "Embedding",
          inputs: ["input_layer"],
          max_tokens: 10000,
          output_dim: 128,
          shape: [500, 128]
        },
        {
          name: "lstm",
          type: "LSTM",
          inputs: ["embedding"],
          neurons: 64,
          shape: [64]
        },
        {
          name: "output_layer",
          type: "Dense",
          inputs: ["lstm"],
          neurons: 1,
          activation: "sigmoid",
          shape: [1]
        }
      ]
    }
  }
};

export const getFallbackResponse = (prompt: string): GeminiResponse | null => {
  const lowerPrompt = prompt.toLowerCase();
  
  // Detectar tipo de modelo baseado no prompt
  if (lowerPrompt.includes('classificar') && (lowerPrompt.includes('imagem') || lowerPrompt.includes('cifar') || lowerPrompt.includes('foto'))) {
    return FALLBACK_RESPONSES.classificador_imagem;
  }
  
  if (lowerPrompt.includes('sentimento') || lowerPrompt.includes('review') || lowerPrompt.includes('imdb') || lowerPrompt.includes('texto')) {
    return FALLBACK_RESPONSES.analise_sentimentos;
  }
  
  // Fallback genérico
  return {
    pythonCode: `import tensorflow as tf
from tensorflow import keras
import numpy as np

# Exemplo de rede neural simples
model = tf.keras.Sequential([
    tf.keras.layers.Dense(128, activation='relu', input_shape=(784,)),
    tf.keras.layers.Dropout(0.2),
    tf.keras.layers.Dense(10, activation='softmax')
])

model.compile(
    optimizer='adam',
    loss='sparse_categorical_crossentropy',
    metrics=['accuracy']
)

print("Modelo criado com sucesso!")
print("Configure seus dados e execute model.fit() para treinar.")`,

    explanation: `# Rede Neural Básica

## Nota Importante
Este é um exemplo básico gerado offline devido a problemas de conectividade com a API.

## Arquitetura Simples
- Camada densa com 128 neurônios e ativação ReLU
- Dropout para regularização
- Camada de saída com 10 classes

## Próximos Passos
1. Configure seus dados de treinamento
2. Ajuste a arquitetura conforme necessário
3. Execute o treinamento com model.fit()`,

    architecture: {
      layers: [
        {
          name: "input_layer",
          type: "Input",
          inputs: [],
          shape: [784]
        },
        {
          name: "dense_1",
          type: "Dense",
          inputs: ["input_layer"],
          neurons: 128,
          activation: "relu",
          shape: [128]
        },
        {
          name: "dropout",
          type: "Dropout",
          inputs: ["dense_1"],
          rate: 0.2,
          shape: [128]
        },
        {
          name: "output_layer",
          type: "Dense",
          inputs: ["dropout"],
          neurons: 10,
          activation: "softmax",
          shape: [10]
        }
      ]
    }
  };
};

export const isApiAvailable = async (): Promise<boolean> => {
  try {
    // Teste simples de conectividade
    const response = await fetch('https://generativelanguage.googleapis.com', {
      method: 'HEAD',
      mode: 'no-cors'
    });
    return true;
  } catch {
    return false;
  }
};