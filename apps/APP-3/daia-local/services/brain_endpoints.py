"""
╔══════════════════════════════════════════════════════════════════════════════╗
║                    DAIA Brain Endpoints - API do Cérebro                     ║
╚══════════════════════════════════════════════════════════════════════════════╝

Endpoints FastAPI para interagir com o DAIA Brain (Gemini + Tool Calling).
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import os

router = APIRouter(prefix="/brain", tags=["DAIA Brain"])

# ═══════════════════════════════════════════════════════════════════════════════
# MODELOS PYDANTIC
# ═══════════════════════════════════════════════════════════════════════════════

class ThinkRequest(BaseModel):
    """Requisição para o cérebro pensar."""
    message: str = Field(..., description="Mensagem do usuário")
    current_code: Optional[str] = Field(None, description="Código atual do projeto")
    project_type: Optional[str] = Field(None, description="Tipo do projeto")
    
class ThinkResponse(BaseModel):
    """Resposta do cérebro."""
    response: str
    tools_used: List[Dict[str, Any]]
    conversation_length: int
    
class GenerateWithMemoryRequest(BaseModel):
    """Requisição para gerar código com memória."""
    prompt: str = Field(..., description="O que você quer criar")
    style_preference: Optional[str] = Field(None, description="Preferência de estilo")
    use_templates: bool = Field(True, description="Usar templates como referência")
    
class ApproveCodeRequest(BaseModel):
    """Requisição para aprovar e salvar código."""
    code: str = Field(..., description="Código a ser salvo")
    prompt: str = Field(..., description="Prompt que gerou o código")
    rating: int = Field(85, ge=0, le=100, description="Nota do código")
    
# ═══════════════════════════════════════════════════════════════════════════════
# ESTADO GLOBAL DO BRAIN
# ═══════════════════════════════════════════════════════════════════════════════

_brain_instance = None

async def get_brain():
    """
    Obtém instância do brain (lazy loading).
    
    ⚠️ IMPORTANTE: Esta função SÓ é chamada quando o usuário
    realmente precisa usar o brain (think, generate, approve).
    
    NÃO é chamada em health checks ou status!
    """
    global _brain_instance
    
    if _brain_instance is None:
        print("🧠 Inicializando DAIA Brain pela primeira vez...")
        print("   ⚠️ Isso fará uma chamada à API do Gemini para configurar o modelo.")
        
        try:
            from services.gemini_brain import DAIABrain
            from database.template_store import TemplateStore
            from models.embedder import CodeEmbedder
            from services.similarity import SimilaritySearch
            
            # Inicializa componentes (NÃO usa API do Gemini)
            template_store = TemplateStore("./database/templates.db")
            await template_store.initialize()
            
            embedder = CodeEmbedder()
            similarity_search = SimilaritySearch(embedder, template_store)
            await similarity_search.build_index()
            
            # Inicializa brain (USA API do Gemini apenas para configurar)
            _brain_instance = DAIABrain(
                template_store=template_store,
                similarity_search=similarity_search
            )
            
            print("🧠 DAIA Brain inicializado com sucesso!")
            print("   ✅ Pronto para receber comandos.")
            
        except Exception as e:
            print(f"❌ Erro ao inicializar DAIA Brain: {e}")
            raise HTTPException(status_code=503, detail=f"Brain não disponível: {str(e)}")
            
    return _brain_instance

# ═══════════════════════════════════════════════════════════════════════════════
# ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/think", response_model=ThinkResponse)
async def think(request: ThinkRequest):
    """
    Endpoint principal: envia mensagem para o cérebro DAIA.
    
    O cérebro vai:
    1. Analisar a mensagem
    2. Decidir se precisa buscar templates
    3. Usar as tools necessárias
    4. Retornar resposta inteligente
    """
    brain = await get_brain()
    
    context = {}
    if request.current_code:
        context["current_code"] = request.current_code
    if request.project_type:
        context["project_type"] = request.project_type
        
    result = await brain.think(request.message, context if context else None)
    
    return ThinkResponse(**result)

@router.post("/generate")
async def generate_with_memory(request: GenerateWithMemoryRequest):
    """
    Gera código usando a memória do DAIA.
    
    Automaticamente:
    1. Busca templates similares
    2. Usa como referência de estilo
    3. Gera código consistente
    """
    brain = await get_brain()
    
    # Monta prompt inteligente
    prompt = f"""Preciso que você gere código para: {request.prompt}

{"Use os templates do banco como referência de estilo." if request.use_templates else "Gere do zero, sem usar templates."}
{f"Preferência de estilo: {request.style_preference}" if request.style_preference else ""}

IMPORTANTE:
1. Primeiro busque templates similares no banco
2. Use o estilo e padrões dos templates encontrados
3. Gere código completo e funcional
4. Retorne APENAS o código HTML/CSS/JS, sem explicações"""

    result = await brain.think(prompt)
    
    return {
        "code": result["response"],
        "tools_used": result["tools_used"],
        "templates_referenced": [
            t for t in result["tools_used"] 
            if t["name"] == "search_templates"
        ]
    }

@router.post("/approve")
async def approve_code(request: ApproveCodeRequest):
    """
    Aprova e salva um código no banco de templates.
    
    O cérebro vai:
    1. Analisar a qualidade do código
    2. Detectar categoria automaticamente
    3. Salvar no banco de templates
    """
    brain = await get_brain()
    
    prompt = f"""O usuário APROVOU este código e quer salvar no banco de templates.

CÓDIGO APROVADO:
```html
{request.code[:5000]}
```

PROMPT ORIGINAL: {request.prompt}
NOTA DO USUÁRIO: {request.rating}/100

Por favor:
1. Analise a qualidade do código
2. Detecte a categoria apropriada
3. Salve no banco de templates usando a tool save_template
4. Confirme o salvamento"""

    result = await brain.think(prompt)
    
    # Verifica se salvou
    saved = any(
        t["name"] == "save_template" 
        for t in result["tools_used"]
    )
    
    return {
        "saved": saved,
        "response": result["response"],
        "tools_used": result["tools_used"]
    }

@router.get("/status")
async def brain_status():
    """
    Status do cérebro DAIA (rápido, SEM inicializar).
    
    ⚠️ IMPORTANTE: Este endpoint NUNCA deve inicializar o brain!
    Isso evita chamadas desnecessárias à API do Gemini.
    """
    global _brain_instance
    
    # Carrega .env se necessário
    from dotenv import load_dotenv
    load_dotenv()
    
    has_api_key = bool(os.getenv("GEMINI_API_KEY"))
    
    # Se brain já está inicializado, retorna status completo
    # MAS NÃO FAZ NENHUMA CHAMADA À API!
    if _brain_instance is not None:
        return {
            "status": "online",
            "model": "gemini-2.5-flash",
            "tools_available": 8,
            "conversation_length": len(_brain_instance.get_conversation_history()),
            "has_api_key": has_api_key,
            "api_calls_made": False  # Indica que não fez chamada
        }
    
    # Se não está inicializado, verifica se PODE inicializar
    if not has_api_key:
        return {
            "status": "offline",
            "error": "GEMINI_API_KEY não configurada",
            "has_api_key": False,
            "api_calls_made": False
        }
    
    # Tem API key mas não inicializou ainda - retorna "ready"
    # NÃO INICIALIZA AQUI! Só inicializa quando o usuário realmente usar.
    return {
        "status": "ready",
        "model": "gemini-2.5-flash",
        "tools_available": 8,
        "conversation_length": 0,
        "has_api_key": True,
        "message": "Brain pronto para inicializar no primeiro uso",
        "api_calls_made": False
    }

@router.post("/reset")
async def reset_conversation():
    """Reseta a conversa do cérebro."""
    brain = await get_brain()
    brain.reset_conversation()
    return {"success": True, "message": "Conversa resetada"}

@router.get("/history")
async def get_history():
    """Obtém histórico da conversa."""
    brain = await get_brain()
    return {
        "history": brain.get_conversation_history(),
        "length": len(brain.get_conversation_history())
    }

@router.post("/analyze")
async def analyze_code(code: str):
    """Analisa qualidade de um código."""
    brain = await get_brain()
    
    result = await brain.think(f"""Analise a qualidade deste código usando a tool analyze_code_quality:

```html
{code[:5000]}
```

Retorne uma análise detalhada com score e sugestões de melhoria.""")
    
    return {
        "analysis": result["response"],
        "tools_used": result["tools_used"]
    }

@router.post("/suggest")
async def suggest_for_prompt(prompt: str):
    """
    Verifica se existe template muito similar.
    Retorna sugestão se encontrar.
    """
    brain = await get_brain()
    
    result = await brain.think(f"""Busque templates similares para: "{prompt}"

Se encontrar algo com mais de 80% de similaridade, sugira usar como base.
Se não encontrar, diga que vamos criar do zero.""")
    
    return {
        "suggestion": result["response"],
        "tools_used": result["tools_used"]
    }
