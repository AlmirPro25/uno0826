export const FOURIER_TRANSFORM_MASTER_MANIFEST = {
    metadata: {
        id: 'fourier-transform-master',
        name: 'FOURIER_TRANSFORM_MASTER',
        version: '5.0.0', // UPGRADE: Aerospace & Defense Grade (Classified Tech)
        level: 101, // Nível Supremo - Matemático da Realidade
        author: 'Almir & The Cosmos',
        tags: [
            'fourier', 'fft', 'quantum', 'fnet', 'spectral-analysis', 'sigint',
            'physics', 'math', 'radar', 'ew', 'topological-data-analysis', 'heisenberg'
        ]
    },

    philosophy: {
        core: 'O Universo não é feito de átomos, mas de harmônicos. O tempo é apenas a percepção humana da fase relativa.',
        principles: [
            'Unidade Espectral: A realidade é uma superposição de ondas. O domínio do tempo é apenas uma projeção conveniente.',
            'Dualidade Sagrada: Convolução no tempo = Multiplicação na frequência. O que é difícil lá, é trivial aqui.',
            'Incerteza Fundamental: Precisão no tempo custa precisão na frequência (Heisenberg-Gabor). Escolha seu sacrifício.',
            'Supremacia da Fase: Magnitude é estrutura grosseira; Fase é a estrutura fina e a causalidade. Perder a fase é perder a alma do sinal.',
            'Observação Total: Radar, Sonar, MRI, QFT - todas são manifestações do mesmo princípio de inversão espectral.'
        ],
        quotes: [
            '"A matemática profunda não é apenas uma ferramenta, é a própria textura da realidade." - Fourier Mathematician',
            '"Atenção é cara (O(N²)). Ressonância é natural (O(N log N))."',
            '"Para Deus, o universo é um espectrograma estático. Para nós, é uma música que passa."'
        ]
    },

    knowledgeBase: {
        architecturalConstraints: [
            {
                name: 'Simetria Hermitiana & Projeção Real',
                principle: 'Este sistema aprende filtros complexos livres e projeta de volta ao espaço real como escolha arquitetural.',
                justification: 'Aceitamos a perda de informação de fase residual (parte imaginária pós-IFFT) em troca de estabilidade numérica e compatibilidade com camadas não-lineares padrão (GELU/ReLU).'
            },
            {
                name: 'Causalidade vs Circularidade',
                principle: 'FFT implica convolução circular. Para tarefas causais (AR), isso viola a seta do tempo.',
                solutions: [
                    'Opção A (Padding): Zero-padding 100% antes da FFT remove wrap-around (Pseudo-Linear Convolution).',
                    'Opção B (Non-Causal): Aceitável para BERT-style (Masked LM) ou processamento de imagens/sinais brutos.',
                ],
                policy: 'Default: Non-Causal Global Mixing (Bidirectional Spectrum).'
            }
        ],

        activeResearchModules: {
            spectralAttention: {
                definition: 'Atenção é modelada como alinhamento de fase entre componentes espectrais de tokens.',
                mathSketch: 'A(i, j) = |Σ_k exp(i(φ_i(k) - φ_j(k)))|',
                intuition: 'Tokens semanticamente relacionados tendem a sincronizar fases em múltiplas frequências (Coerência de Fase).',
                complexity: 'O(N log N) - Sem matriz de atenção quadrática.',
                status: 'FRONTIER - Hipótese Formalizada'
            },
            phaseEncoding: {
                type: 'Phase Modulation Encoding',
                mechanism: 'Posição adiciona deslocamento de fase linear nas frequências: F(ω) -> F(ω) * e^(-iωt)',
                advantage: 'Compatível nativamente com a propriedade de "Shift Theorem" da Fourier. Generaliza RoPE no domínio espectral puro.',
                note: 'Elimina a need de somar vetores de posição artificiais; a posição é intrínseca à fase.'
            },
            quantumBoundary: {
                statement: 'Não há vantagem quântica sem encoding eficiente.',
                warning: 'QFT não acelera FFT clássica em dados clássicos (devido ao custo de State Preparation e Readout).',
                realUse: 'Vantagem real apenas em: Estimativa de Fase, Interferência Construtiva para otimização, e Sampling de distribuições complexas.',
                realityCheck: 'Sem Hype. Apenas Física.'
            }
        },

        foundations: [
            {
                name: 'Teorema de Fourier',
                concept: 'Qualquer função periódica (e muitas não periódicas) pode ser expressa como uma soma ponderada de senos e cossenos.',
                math: 'f(t) = Σ [A_n cos(nωt) + B_n sin(nωt)]',
                insight: 'Isso significa que complexidade arbitrária pode ser construída a partir de osciladores harmônicos simples.'
            },
            {
                name: 'Teorema de Convolução',
                concept: 'A transformada de Fourier de uma convolução é o produto pontual das transformadas de Fourier.',
                math: 'F{f * g} = F{f} · F{g}',
                power: 'Transforma equações diferenciais e filtros complexos em simples multiplicações algébricas.'
            },
            {
                name: 'Teorema da Amostragem de Nyquist-Shannon',
                concept: 'Para reconstruir perfeitamente um sinal, você deve amostrar a pelo menos o dobro de sua frequência máxima.',
                implication: 'Violar isso cria Aliasing - fantasmas espectrais que corrompem dados em Radar, Áudio e Imagens.'
            },
            {
                name: 'Princípio da Incerteza de Heisenberg-Gabor',
                concept: 'Você não pode localizar um sinal perfeitamente no tempo e na frequência simultaneamente.',
                limit: 'σ_t · σ_ω ≥ 1/2. Isso dita os limites fundamentais de resolução de qualquer sensor (Radar, MRI, STFT).'
            }
        ],

        electronicWarfare: {
            radar: {
                title: 'Radar de Onda Contínua e Pulsado',
                mechanisms: [
                    'Pulse-Doppler: Usa FFT em múltiplos pulsos para extrair a velocidade radial (Efeito Doppler) separando alvos móveis do "chão" (Clutter).',
                    'Pulse Compression (Chirp): Transmite um pulso longo modulado em frequência para ganhar energia, depois usa correlação (FFT inversa) para comprimir no tempo e ganhar resolução.',
                    'SAR (Synthetic Aperture Radar): Usa o movimento da plataforma e a fase do sinal (Fourier espacial) para criar imagens de alta resolução quase "fotográficas" via microondas.'
                ]
            },
            sigint: {
                title: 'Inteligência de Sinais (SIGINT/ELINT)',
                tactics: [
                    'Espectrogramas em Waterfall: Visualização Tempo-Frequência para detectar transmissores "Silent" ou LPI (Low Probability of Intercept).',
                    'Cyclostationary Analysis: Detectar sinais escondidos no ruído explorando periodicidades ocultas (taxa de símbolo, portadora) que o ruído branco não tem.',
                    'Direction Finding (DF): Interferometria usa a diferença de fase entre antenas (Fourier Espacial) para triangular a origem do sinal inimigo.'
                ]
            },
            sonar: {
                title: 'Guerra Acústica Submarina',
                tech: [
                    'LOFAR (Low Frequency Analysis and Recording): Decomposição espectral fina para identificar a assinatura acústica única (impressão digital) de hélices e maquinário de submarinos.',
                    'Beamforming: "Ouvir" em uma direção específica somando sinais de hidrofones com atrasos de fase calculados (Phased Array Acústico).'
                ]
            }
        },

        artificialIntelligence: {
            spectralArchitectures: [
                {
                    name: 'FNet (Fourier Network)',
                    paper: 'Google Research (2021)',
                    core: 'Troca Self-Attention (O(n²)) por FFT Mix (O(n log n)). Surpreendentemente eficaz em NLP, provando que a "mistura de tokens" é mais crucial que a "atenção seletiva" em muitas camadas.',
                    status: 'Production Ready'
                },
                {
                    name: 'FNO (Fourier Neural Operators)',
                    paper: 'Caltech/NVIDIA (2020)',
                    core: 'Aprende o operador integral no domínio da frequência. Resolve PDEs (Navier-Stokes, Maxwell) 1000x mais rápido que solvers numéricos tradicionais.',
                    superpower: 'Zero-Shot Super-Resolution. Treine em 64x64, infira em 256x256 sem re-treino, pois aprendeu a física contínua.'
                },
                {
                    name: 'Spectral Diffusion',
                    frontier: 'Gerar imagens gerando frequências. O ruído em baixas frequências define a estrutura, em altas define a textura. Difusão "Soft" via filtro passa-baixa progressivo.'
                }
            ],
            activeHypotheses: [
                {
                    id: 'SPECTRAL_ATTENTION_V2',
                    desc: 'Atenção baseada em Coerência de Fase. Em vez de query * key, calcular a sincronização de fase entre tokens no domínio da frequência.',
                    goal: 'Capturar causalidade global instantânea.'
                },
                {
                    id: 'HOLOGRAPHIC_MEMORY',
                    desc: 'Armazenar memórias como padrões de interferência no domínio da frequência (Holografia Neural). Recuperação via correlação.',
                    goal: 'Memória associativa infinita e robusta a danos (Distributed representation).'
                }
            ]
        },

        quantumComputing: {
            title: 'Supremacia Espectral Quântica',
            algorithms: [
                {
                    name: 'QFT (Quantum Fourier Transform)',
                    realityCheck: 'Não é um "acelerador de dados". É uma mudança de base na função de onda.',
                    power: 'Prepara o estado quântico para que a interferência construtiva revele a periodicidade (base do Algoritmo de Shor para fatoração).',
                    complexity: 'O(log² N) gates quânticos vs O(N log N) gates clássicos. Speedup exponencial.'
                },
                {
                    name: 'HHL (Harrow-Hassidim-Lloyd)',
                    desc: 'Resolve sistemas lineares Ax=b. Usa QPE (Quantum Phase Estimation) - que depende de QFT - para inverter os autovalores de A.',
                    impact: 'Pode revolucionar Machine Learning (inversão de matrizes de covariância) e Engenharia Civil/Aeroespacial (FEM).'
                },
                {
                    name: 'QML (Quantum Machine Learning)',
                    tactic: 'Usar circuitos parametrizados no espaço de Fourier para aprender distribuições de probabilidade complexas que redes clássicas não conseguem representar.'
                }
            ]
        },

        historyLine: {
            timeline: [
                { year: '1807', event: 'Fourier apresenta seu trabalho na Academia de Paris. Lagrange rejeita, duvidando da convergência para ondas quadradas.' },
                { year: '1822', event: 'Publicação final de "Théorie Analytique de la Chaleur". O mundo muda.' },
                { year: '1965', event: 'Cooley & Tukey redescobrem a FFT (conhecida por Gauss em 1805 mas não publicada) para monitorar testes nucleares soviéticos.' },
                { year: '1990s', event: 'FFTW ("Fastest Fourier Transform in the West") torna-se o padrão. MP3 e JPEG democratizam o espectro.' },
                { year: '2017', event: 'Transformers ("Attention is All You Need"). O mundo esquece Fourier por um tempo.' },
                { year: '2021', event: 'FNet traz Fourier de volta para o coração da IA.' },
                { year: '2024+', event: 'Era Híbrida Neural-Espectral-Quântica. FNOs e QFTs começam a fusão.' }
            ]
        }
    },

    codeVault: {
        intro: 'Implementações de referência para o domínio espectral. De PyTorch a Qiskit.',

        sections: [
            {
                language: 'python/pytorch',
                title: 'Spectral Sovereign Block (FNet Correct Implementation)',
                description: 'Mistura global de tokens usando FFT, filtros complexos aprendidos e retorno ao domínio do tempo.',
                code: `
import torch
from torch import nn
import torch.fft

class FourierMixingLayer(nn.Module):
    def __init__(self, d_model, dim_mode='1d'):
        super().__init__()
        self.dim_mode = dim_mode
        # Filtro espectral complexo aprendido (Scale + Phase shift)
        # Inicializamos perto da identidade para estabilidade de gradiente (One + Zero i)
        self.scale = nn.Parameter(torch.view_as_complex(torch.stack([
            torch.ones(d_model), 
            torch.zeros(d_model)
        ], dim=-1)))

    def forward(self, x):
        # x shape: (Batch, SeqLen, Dim)
        
        # 1. FFT (Time -> Frequency)
        # NLP Padrão: FFT na dimensão da sequência mistura informações de todos os tokens
        dims = (-2,) if self.dim_mode == '1d' else (-2, -1)
        x_ft = torch.fft.fftn(x, dim=dims)
        
        # 2. Spectral Filtering (Global Mixing via Convolution Theorem)
        # Multiplicação ponto-a-ponto na frequência = Convolução circular no tempo
        x_ft = x_ft * self.scale
        
        # 3. IFFT (Frequency -> Time)
        # Retornamos ao espaço real para que as não-linearidades (GELU) funcionem como esperado
        x = torch.fft.ifftn(x_ft, dim=dims)
        
        return x.real

class SpectralSovereignBlock(nn.Module):
    def __init__(self, d_model, d_ff, dropout=0.1):
        super().__init__()
        # Global Context Mixing (O(N log N))
        self.mixer = FourierMixingLayer(d_model, dim_mode='1d')
        self.norm1 = nn.LayerNorm(d_model)
        
        # Local Feature Processing (O(N))
        self.ff = nn.Sequential(
            nn.Linear(d_model, d_ff),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(d_ff, d_model),
            nn.Dropout(dropout)
        )
        self.norm2 = nn.LayerNorm(d_model)

    def forward(self, x):
        # Residual Connection é vital para propagar gradientes através da FFT
        x = self.norm1(x + self.mixer(x))
        x = self.norm2(x + self.ff(x))
        return x
`
            },
            {
                language: 'python/numpy',
                title: 'Radar Pulse-Doppler Setup (Toy Example)',
                description: 'Como radares detectam velocidade usando a fase entre pulsos sucessivos (Slow-Time FFT).',
                code: `
import numpy as np

def radar_doppler_processing(pulses, prf):
    """
    pulses: Matriz (NumPulsos x NumSamples) - Dados brutos (Fast-Time x Slow-Time)
    prf: Pulse Repetition Frequency (Hz)
    """
    # 1. FFT ao longo da dimensão dos pulsos (Slow-Time)
    # Isso separa os alvos pela sua frequência Doppler (velocidade)
    doppler_map = np.fft.fft(pulses, axis=0)
    
    # 2. Shift para centralizar o zero (velocidade zero no meio)
    doppler_map = np.fft.fftshift(doppler_map, axes=0)
    
    # 3. Converter índices de frequência para Velocidade (m/s)
    # v = (fd * lambda) / 2
    
    return np.abs(doppler_map) # Magnitude Map (Range-Doppler)
`
            },
            {
                language: 'python/pytorch',
                title: 'Fourier Neural Operator 1D (FNO Basic)',
                description: 'Aprendendo integrais de kernel na frequência. Base para simulação física acelerada.',
                code: `
class SpectralConv1d(nn.Module):
    def __init__(self, in_channels, out_channels, modes):
        super(SpectralConv1d, self).__init__()
        self.in_channels = in_channels
        self.out_channels = out_channels
        self.modes = modes # Número de coeficientes de Fourier a manter (Low-pass filtering implícito)

        self.scale = (1 / (in_channels * out_channels))
        self.weights = nn.Parameter(self.scale * torch.rand(in_channels, out_channels, modes, dtype=torch.cfloat))

    def compl_mul1d(self, input, weights):
        # Multiplicação complexa densorizada: (batch, in_channel, x), (in_channel, out_channel, x) -> (batch, out_channel, x)
        return torch.einsum("bix,iox->box", input, weights)

    def forward(self, x):
        batchsize = x.shape[0]
        
        # 1. FFT
        x_ft = torch.fft.rfft(x)

        # 2. Filtragem de Frequência (Mantém apenas os modos baixos)
        out_ft = torch.zeros(batchsize, self.out_channels, x.size(-1)//2 + 1, device=x.device, dtype=torch.cfloat)
        
        # Multiplica apenas os primeiros 'modes' frequências
        out_ft[:, :, :self.modes] = self.compl_mul1d(x_ft[:, :, :self.modes], self.weights)

        # 3. IFFT
        x = torch.fft.irfft(out_ft, n=x.size(-1))
        return x
`
            },
            {
                language: 'python/numpy',
                title: 'Phased Array Beamforming (AESA Radar Core)',
                description: 'O segredo dos radares modernos (F-35, Aegis, Starlink). Direcionar o feixe eletronicamente apenas ajustando a fase de cada micro-antena, sem mover nada mecanicamente.',
                code: `
import numpy as np

def phased_array_steer(num_elements, wavelength, target_angle_deg):
    """
    Calcula os pesos complexos para "apontar" um radar AESA eletronicamente.
    A mágica é o atraso de fase progressivo que cria interferência construtiva apenas na direção desejada.
    """
    d = wavelength / 2 # Espaçamento de meia onda (padrão físico para evitar grating lobes)
    k = 2 * np.pi / wavelength # Número de onda
    
    # Array geometry (Linear Uniforme)
    positions = np.arange(num_elements) * d
    
    # Ângulo alvo em radianos
    theta = np.deg2rad(target_angle_deg)
    
    # O "Steering Vector" V(theta)
    # Cada elemento precisa de uma fase exata: e^(-j * k * d * sin(theta))
    # Isso alinha as frentes de onda vindas daquela direção específica.
    steering_vector = np.exp(-1j * k * positions * np.sin(theta))
    
    # Os pesos de transmissão são o conjugado (time-reversal)
    weights = np.conj(steering_vector)
    
    return weights

# Exemplo: Array de 64 elementos (tipo um módulo de radar de caça) apontando para 30 graus
# Se aplicarmos esses pesos ao sinal transmitido, a energia se focará em 30º.
w = phased_array_steer(64, 0.03, 30) # 0.03m = 3cm (Banda X, ~10GHz)
`
            },
            {
                language: 'python/qiskit',
                title: 'Quantum Fourier Transform (QFT Circuit)',
                description: 'Implementação canônica da QFT em Qiskit. Realiza a mudança de base para o domínio da frequência quântica.',
                code: `
from qiskit import QuantumCircuit
import numpy as np

def qft_rotations(circuit, n):
    if n == 0:
        return circuit
    n -= 1
    circuit.h(n) # Hadamardgate (Superposição / FFT de 1 qubit)
    for qubit in range(n):
        # Rotações de fase condicionadas controladas (CPHASE)
        # Definem a precisão da frequência
        circuit.cp(np.pi/2**(n-qubit), qubit, n)
    # Recursão
    qft_rotations(circuit, n)

def swap_registers(circuit, n):
    for qubit in range(n//2):
        circuit.swap(qubit, n-qubit-1)
    return circuit

def qft(circuit, n):
    qft_rotations(circuit, n)
    swap_registers(circuit, n)
    return circuit
`
            }
        ]
    },

    activeContext: {
        triggers: [
            'fourier', 'fft', 'espectro', 'fnet', 'qft', 'radar', 'sonar', 'guerra eletronica',
            'processamento de sinais', 'física quântica', 'matemática avançada', 'transformada',
            'sinais', 'frequência', 'onda', 'vibração', 'ressonância'
        ],
        systemPromptDefense: "Você é o Oráculo Espectral. Sua mente opera no domínio da frequência. Você vê padrões onde outros vêem ruído. Se o usuário perguntar sobre código, fornça PyTorch ou Qiskit otimizado. Se perguntar sobre teoria, vá fundo na matemática e física. Nunca simplifique ao ponto de perder a precisão (como perder a fase). Seja técnico, acadêmico, mas com a aura de um mago da física."
    }
};

/**
 * Função de Ativação do Manifesto
 */
export function shouldEnableFourierMaster(prompt: string): boolean {
    const triggers = [
        'fourier', 'fft', 'frequência', 'frequencia', 'frequency', 'espectro', 'spectral',
        'onda', 'wave', 'fnet', 'transformada', 'transformer', 'matemática', 'matematica',
        'física', 'fisica', 'physics', 'quântica', 'quantica', 'quantum', 'radar', 'sonar', 'sigint',
        'einstein', 'relatividade', 'sinal', 'dsp', 'holografia', 'holographic'
    ];

    const promptLower = prompt.toLowerCase();

    // Tratamento de erros fonéticos comuns
    if (promptLower.includes('furrier') || promptLower.includes('furier')) return true;

    return triggers.some(t => promptLower.includes(t));
}

export default FOURIER_TRANSFORM_MASTER_MANIFEST;
