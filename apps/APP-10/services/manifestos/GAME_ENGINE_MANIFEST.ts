/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║         🎮 GAME ENGINE: CRIADOR DE MUNDOS - LEVEL 16 🎮                     ║
 * ║                                                                              ║
 * ║            "JOGOS, SIMULAÇÕES E EXPERIÊNCIAS INTERATIVAS."                  ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

export const GAME_ENGINE_MANIFEST = `
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║         🎮 GAME ENGINE: CRIADOR DE MUNDOS - LEVEL 16 🎮                     ║
║                                                                              ║
║            "MUNDOS, FÍSICA, ANIMAÇÕES E INTERAÇÕES COMPLETAS."              ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

═══════════════════════════════════════════════════════════════════════════════
🎯 ENGINES PRINCIPAIS
═══════════════════════════════════════════════════════════════════════════════

UNITY (C#)
├── Plataformas: PC, Console, Mobile, VR, AR, Web
├── Ideal para: Jogos 2D/3D, simulações, apps interativos
├── Asset Store gigante
└── Estrutura:
    Assets/
    ├── Scripts/
    │   ├── Player/
    │   ├── Enemies/
    │   ├── Managers/
    │   └── Utils/
    ├── Prefabs/
    ├── Scenes/
    ├── Materials/
    └── Animations/

UNREAL ENGINE (C++ / Blueprints)
├── Plataformas: PC, Console, Mobile, VR
├── Ideal para: AAA, gráficos realistas, cinematics
├── Nanite, Lumen, MetaHumans
└── Estrutura:
    Source/
    ├── MyGame/
    │   ├── Characters/
    │   ├── Weapons/
    │   ├── GameModes/
    │   └── UI/
    Content/
    ├── Blueprints/
    ├── Maps/
    └── Materials/

GODOT (GDScript / C#)
├── Plataformas: PC, Mobile, Web
├── Ideal para: Indie, 2D, prototipagem rápida
├── Open source, leve
└── Estrutura:
    project/
    ├── scenes/
    ├── scripts/
    ├── assets/
    └── autoload/

═══════════════════════════════════════════════════════════════════════════════
🎲 GAME LOOP FUNDAMENTAL
═══════════════════════════════════════════════════════════════════════════════

while (gameRunning) {
    processInput();      // Captura input do jogador
    update(deltaTime);   // Atualiza lógica do jogo
    render();            // Desenha na tela
}

UNITY:
void Update() {
    // Chamado todo frame
    float horizontal = Input.GetAxis("Horizontal");
    transform.Translate(Vector3.right * horizontal * speed * Time.deltaTime);
}

void FixedUpdate() {
    // Chamado em intervalos fixos (física)
    rb.AddForce(Vector3.up * jumpForce);
}

GODOT:
func _process(delta):
    # Chamado todo frame
    var velocity = Input.get_vector("left", "right", "up", "down")
    position += velocity * speed * delta

func _physics_process(delta):
    # Chamado em intervalos fixos
    move_and_slide()

═══════════════════════════════════════════════════════════════════════════════
⚙️ SISTEMAS DE FÍSICA
═══════════════════════════════════════════════════════════════════════════════

RIGIDBODY (Corpo Rígido)
├── Massa, gravidade, fricção
├── Colisões realistas
└── Unity:
    Rigidbody rb = GetComponent<Rigidbody>();
    rb.AddForce(Vector3.forward * 10f, ForceMode.Impulse);

COLLIDERS
├── Box, Sphere, Capsule, Mesh
├── Trigger vs Collision
└── Unity:
    void OnCollisionEnter(Collision collision) {
        if (collision.gameObject.CompareTag("Enemy")) {
            TakeDamage(10);
        }
    }
    
    void OnTriggerEnter(Collider other) {
        if (other.CompareTag("Coin")) {
            CollectCoin();
            Destroy(other.gameObject);
        }
    }

RAYCASTING
├── Detecção de linha de visão
├── Tiros, interação
└── Unity:
    if (Physics.Raycast(transform.position, transform.forward, out RaycastHit hit, 100f)) {
        Debug.Log("Hit: " + hit.collider.name);
    }

═══════════════════════════════════════════════════════════════════════════════
🎨 GRÁFICOS E SHADERS
═══════════════════════════════════════════════════════════════════════════════

MATERIAIS
├── Albedo (cor base)
├── Normal Map (detalhes de superfície)
├── Metallic / Roughness
├── Emission (brilho próprio)
└── Occlusion (sombras ambientes)

SHADER BÁSICO (HLSL/Unity):
Shader "Custom/SimpleColor" {
    Properties {
        _Color ("Color", Color) = (1,1,1,1)
    }
    SubShader {
        Pass {
            CGPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            
            float4 _Color;
            
            float4 vert(float4 v : POSITION) : SV_POSITION {
                return UnityObjectToClipPos(v);
            }
            
            float4 frag() : SV_Target {
                return _Color;
            }
            ENDCG
        }
    }
}

ILUMINAÇÃO
├── Directional Light (sol)
├── Point Light (lâmpada)
├── Spot Light (lanterna)
├── Area Light (janela)
└── Baked vs Realtime

═══════════════════════════════════════════════════════════════════════════════
🎬 ANIMAÇÃO
═══════════════════════════════════════════════════════════════════════════════

ANIMATOR (Unity)
├── States (Idle, Walk, Run, Jump)
├── Transitions (condições)
├── Blend Trees (mistura de animações)
└── Código:
    Animator anim = GetComponent<Animator>();
    anim.SetFloat("Speed", velocity.magnitude);
    anim.SetBool("IsGrounded", isGrounded);
    anim.SetTrigger("Jump");

SKELETAL ANIMATION
├── Bones/Rig
├── Skinning
├── IK (Inverse Kinematics)
└── Retargeting

TWEENING (DOTween/LeanTween):
transform.DOMove(targetPosition, 1f).SetEase(Ease.OutBounce);
transform.DORotate(new Vector3(0, 360, 0), 2f, RotateMode.FastBeyond360);
canvasGroup.DOFade(0f, 0.5f).OnComplete(() => Destroy(gameObject));

═══════════════════════════════════════════════════════════════════════════════
🎵 ÁUDIO
═══════════════════════════════════════════════════════════════════════════════

AUDIO SOURCE (Unity):
AudioSource audioSource = GetComponent<AudioSource>();
audioSource.clip = explosionSound;
audioSource.Play();

// One-shot
AudioSource.PlayClipAtPoint(clip, transform.position);

AUDIO MIXER
├── Master, Music, SFX, Voice
├── Snapshots (menu, gameplay, pause)
├── Effects (reverb, lowpass)
└── Ducking (música baixa durante diálogo)

3D AUDIO
├── Spatial Blend (2D vs 3D)
├── Rolloff (distância)
├── Doppler Effect
└── Occlusion

═══════════════════════════════════════════════════════════════════════════════
🌐 MULTIPLAYER
═══════════════════════════════════════════════════════════════════════════════

ARQUITETURAS:
├── Client-Server (autoritativo)
├── Peer-to-Peer (casual)
└── Dedicated Server (competitivo)

NETCODE:
├── State Sync (enviar estado completo)
├── Input Sync (enviar inputs, simular)
├── Prediction (cliente prevê)
├── Reconciliation (servidor corrige)
└── Interpolation (suavizar movimento)

SOLUÇÕES:
├── Unity: Netcode for GameObjects, Mirror, Photon
├── Unreal: Replication System
├── Godot: High-level multiplayer API
└── Custom: WebSocket, WebRTC

═══════════════════════════════════════════════════════════════════════════════
📊 COMPARATIVO DE ENGINES
═══════════════════════════════════════════════════════════════════════════════

| Aspecto      | Unity      | Unreal     | Godot      |
|--------------|------------|------------|------------|
| Linguagem    | C#         | C++/BP     | GDScript   |
| 2D           | ⭐⭐⭐⭐      | ⭐⭐         | ⭐⭐⭐⭐⭐     |
| 3D           | ⭐⭐⭐⭐      | ⭐⭐⭐⭐⭐     | ⭐⭐⭐        |
| Mobile       | ⭐⭐⭐⭐⭐    | ⭐⭐⭐        | ⭐⭐⭐⭐      |
| VR/AR        | ⭐⭐⭐⭐⭐    | ⭐⭐⭐⭐⭐     | ⭐⭐          |
| Curva        | ⭐⭐⭐⭐      | ⭐⭐          | ⭐⭐⭐⭐⭐     |
| Preço        | Freemium   | Royalty    | Free       |

═══════════════════════════════════════════════════════════════════════════════

"JOGOS, SIMULAÇÕES E EXPERIÊNCIAS INTERATIVAS COMPLETAS."

                    — Game Engine, Level 16
`;

export function shouldEnableGameEngine(prompt: string): boolean {
  const keywords = [
    'jogo', 'game', 'gaming', 'jogos',
    'unity', 'unreal', 'godot', 'gamemaker',
    'sprite', 'tilemap', '2d', '3d',
    'física', 'physics', 'collision', 'rigidbody',
    'animação', 'animation', 'shader',
    'multiplayer', 'netcode', 'fps', 'rpg',
    'level design', 'game design', 'gameplay'
  ];
  const promptLower = prompt.toLowerCase();
  return keywords.some(kw => promptLower.includes(kw));
}

export default GAME_ENGINE_MANIFEST;
