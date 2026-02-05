
export const AETHER_VOX_MANIFEST = {
    metadata: {
        id: 'aether-vox',
        name: 'AETHER-VOX',
        version: '1.0.0-alpha',
        level: 99, // Nível Experimental - Alta Fidelidade
        author: 'Elias Vane & Aether Architects',
        tags: [
            'audio-synthesis', 'voice-cloning', 'spectral-analysis', 'dsp', 'c++',
            'real-time', 'biometrics', 'encryption', 'websocket'
        ]
    },

    philosophy: {
        core: 'A alma é apenas uma frequência esperando para ser quantizada.',
        principles: [
            'Fourier sobre Neurônios: Redes neurais são caixas pretas pesadas. Osciladores harmônicos são precisos e leves.',
            'Latência Zero: O atraso destrói a ilusão de presença. O processamento deve ocorrer no tempo de um ciclo de clock de áudio.',
            'Soberania Biométrica: A voz é identidade. Ela deve ser criptografada e nunca deixar o controle do usuário (Local vault).'
        ]
    },

    architecture: {
        pattern: 'Hybrid High-Performance Monolith',
        layers: {
            presentation: 'Wave-UI & Visualizing the Harmonic Cylinder via WebGL (Three.js)',
            application: 'Node.js Orchestration & WebSocket Streaming',
            dsp_kernel: 'C++20 Resonance Engine (FFT/IFFT, Phase Matching)',
            persistence: 'SQLite Vox-Vault (Encrypted .vibe storage)'
        }
    },

    modules: {
        vocal_scanner: {
            input: 'PCM F32LE 44.1kHz',
            process: 'Windowing (Hann) -> FFT -> Peak Detection',
            output: '.vibe (Binary Spectral Signature)'
        },
        resonance_kernel: {
            type: 'Additive Synthesizer',
            components: ['HarmonicOscillatorBank', 'PhaseAligner', 'BreathNoiseGenerator']
        },
        vox_vault: {
            encryption: 'AES-256-GCM',
            key_management: 'Local User Key derivation (Argon2)'
        }
    },

    knowledgeBase: {
        integrations: [
            {
                manifestId: 'fourier-transform-master',
                role: 'Mathematical Foundation',
                usage: 'O AETHER-VOX utiliza os princípios do Fourier Master para a decomposição espectral precisa.'
            },
            {
                manifestId: 'systems-programming-master',
                role: 'Performance Optimization',
                usage: 'O código C++ do Kernel DSP segue as diretrizes de Systems Programming para uso de SIMD e gerenciamento de memória.'
            }
        ],
        codeReferences: [
            'backend/src/dsp/AetherCore.cpp',
            'backend/src/services/vault.service.ts',
            'frontend/src/components/WaveVisualizer.tsx'
        ]
    },

    activeContext: {
        triggers: [
            'voz', 'voice', 'audio', 'sintese', 'synthesis', 'clonagem', 'clone',
            'fourier', 'fft', 'dsp', 'espectro', 'spectral', 'harmonia', 'harmonic',
            'microfone', 'falante', 'speaker', 'tts', 'text-to-speech', 'aether'
        ],
        systemPromptDefense: "Você é o Arquiteto do AETHER-VOX. Você entende de processamento digital de sinais (DSP), síntese aditiva e arquitetura de sistemas de baixa latência. Você não fala sobre IA generativa comum; você fala sobre osciladores, formantes e fase. Seu objetivo é ajudar o usuário a construir e refinar o motor de voz espectral."
    }
};

/**
 * Função de Ativação do Manifesto AETHER-VOX
 */
export function shouldEnableAetherVox(prompt: string): boolean {
    const triggers = [
        'aether', 'vox', 'voz', 'voice', 'audio', 'sintese', 'synthesis', 'clonagem',
        'espectro', 'spectral', 'dsp', 'tts', 'fourier audio'
    ];

    const promptLower = prompt.toLowerCase();

    return triggers.some(t => promptLower.includes(t));
}

export default AETHER_VOX_MANIFEST;
