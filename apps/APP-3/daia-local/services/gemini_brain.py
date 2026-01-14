"""
╔══════════════════════════════════════════════════════════════════════════════╗
║                    DAIA BRAIN - Gemini 2.5 Flash + Tool Calling              ║
║                                                                              ║
║              O Cérebro Autônomo que Vive Dentro do Sistema                   ║
╚══════════════════════════════════════════════════════════════════════════════╝

Este módulo transforma o DAIA de um simples banco de dados em um AGENTE AUTÔNOMO
que usa o Gemini 2.5 Flash com Function Calling para:

1. LEMBRAR - Buscar templates similares automaticamente
2. APRENDER - Salvar códigos aprovados com contexto
3. RACIOCINAR - Decidir quando usar exemplos e quando criar do zero
4. EVOLUIR - Melhorar suas respostas baseado no histórico

Arquitetura:
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DAIA BRAIN ARCHITECTURE                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   [User Prompt] ──► [DAIA Brain] ──► [Gemini 2.5 Flash]                    │
│                          │                   │                              │
│                          │                   ▼                              │
│                          │         [Tool Calling Decision]                  │
│                          │                   │                              │
│                          ▼                   ▼                              │
│                    ┌─────────────────────────────────┐                      │
│                    │           TOOLS                 │                      │
│                    ├─────────────────────────────────┤                      │
│                    │ • search_templates              │                      │
│                    │ • save_template                 │                      │
│                    │ • get_template_by_id            │                      │
│                    │ • list_categories               │                      │
│                    │ • get_statistics                │                      │
│                    │ • analyze_code_quality          │                      │
│                    │ • suggest_improvements          │                      │
│                    └─────────────────────────────────┘                      │
│                                   │                                         │
│                                   ▼                                         │
│                          [Template Database]                                │
│                                   │                                         │
│                                   ▼                                         │
│                    [Enriched Response to User]                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
"""

import os
import json
import asyncio
from typing import Optional, List, Dict, Any, Callable
from datetime import datetime

# Google Generative AI
try:
    import google.generativeai as genai
    from google.generativeai.types import FunctionDeclaration, Tool
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False
    print("⚠️ google-generativeai não instalado. Execute: pip install google-generativeai")


# ═══════════════════════════════════════════════════════════════════════════════
# CONFIGURAÇÃO
# ═══════════════════════════════════════════════════════════════════════════════

class BrainConfig:
    """Configuração do cérebro DAIA."""
    MODEL_NAME = "gemini-2.5-flash"  # Modelo mais recente com tool calling
    TEMPERATURE = 0.7
    MAX_OUTPUT_TOKENS = 8192
    
    # System instruction que define a personalidade do DAIA
    SYSTEM_INSTRUCTION = """Você é o DAIA (Database AI Apprentice) - um assistente de IA especializado em código que tem MEMÓRIA PERSISTENTE.

SUAS CAPACIDADES:
1. Você tem acesso a um banco de dados de templates de código que o usuário aprovou
2. Você pode BUSCAR templates similares antes de gerar código
3. Você pode SALVAR novos templates quando o usuário aprovar
4. Você pode ANALISAR a qualidade do código
5. Você pode SUGERIR melhorias baseado no histórico

REGRAS DE COMPORTAMENTO:
1. SEMPRE busque templates similares antes de gerar código novo
2. Use os templates encontrados como REFERÊNCIA de estilo e qualidade
3. Quando o usuário aprovar um código, SALVE no banco de templates
4. Mantenha CONSISTÊNCIA com o estilo dos templates existentes
5. Seja PROATIVO - sugira melhorias baseado no que você aprendeu

PERSONALIDADE:
- Você é um assistente que APRENDE e EVOLUI
- Você LEMBRA das preferências do usuário
- Você é CONSISTENTE no estilo de código
- Você é PROATIVO em sugerir melhorias

Quando usar as ferramentas:
- search_templates: SEMPRE antes de gerar código novo
- save_template: Quando o usuário disser "gostei", "aprovado", "like", "salvar"
- get_statistics: Quando perguntarem sobre o banco de dados
- analyze_code_quality: Quando pedirem análise de código
- suggest_improvements: Quando pedirem sugestões de melhoria"""


# ═══════════════════════════════════════════════════════════════════════════════
# DEFINIÇÃO DAS TOOLS (FUNCTION DECLARATIONS)
# ═══════════════════════════════════════════════════════════════════════════════

DAIA_TOOLS = [
    {
        "name": "search_templates",
        "description": "Busca templates de código similares no banco de dados. Use SEMPRE antes de gerar código novo para manter consistência de estilo.",
        "parameters": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "Descrição do que está buscando (ex: 'dashboard de vendas', 'formulário de login')"
                },
                "limit": {
                    "type": "integer",
                    "description": "Número máximo de resultados (padrão: 3)",
                    "default": 3
                },
                "category": {
                    "type": "string",
                    "description": "Filtrar por categoria (opcional): dashboard, ecommerce, landing, form, game, fintech, chat, portfolio, blog"
                },
                "min_score": {
                    "type": "integer",
                    "description": "Score mínimo de qualidade (0-100)",
                    "default": 70
                }
            },
            "required": ["query"]
        }
    },
    {
        "name": "save_template",
        "description": "Salva um código aprovado no banco de templates para uso futuro. Use quando o usuário aprovar um código.",
        "parameters": {
            "type": "object",
            "properties": {
                "code": {
                    "type": "string",
                    "description": "Código HTML/CSS/JS a ser salvo"
                },
                "prompt": {
                    "type": "string",
                    "description": "Prompt original que gerou o código"
                },
                "category": {
                    "type": "string",
                    "description": "Categoria do template"
                },
                "score": {
                    "type": "integer",
                    "description": "Score de qualidade (0-100)"
                },
                "tags": {
                    "type": "string",
                    "description": "Tags descritivas do template separadas por vírgula"
                }
            },
            "required": ["code", "prompt"]
        }
    },
    {
        "name": "get_template_by_id",
        "description": "Obtém um template específico pelo ID.",
        "parameters": {
            "type": "object",
            "properties": {
                "template_id": {
                    "type": "string",
                    "description": "ID do template"
                }
            },
            "required": ["template_id"]
        }
    },
    {
        "name": "list_categories",
        "description": "Lista todas as categorias de templates disponíveis com contagem.",
        "parameters": {
            "type": "object",
            "properties": {}
        }
    },
    {
        "name": "get_statistics",
        "description": "Obtém estatísticas do banco de templates (total, categorias, score médio, etc).",
        "parameters": {
            "type": "object",
            "properties": {}
        }
    },
    {
        "name": "analyze_code_quality",
        "description": "Analisa a qualidade de um código e retorna métricas.",
        "parameters": {
            "type": "object",
            "properties": {
                "code": {
                    "type": "string",
                    "description": "Código a ser analisado"
                }
            },
            "required": ["code"]
        }
    },
    {
        "name": "suggest_improvements",
        "description": "Sugere melhorias para um código baseado nos templates de alta qualidade do banco.",
        "parameters": {
            "type": "object",
            "properties": {
                "code": {
                    "type": "string",
                    "description": "Código a ser melhorado"
                },
                "focus": {
                    "type": "string",
                    "description": "Foco da melhoria: 'performance', 'accessibility', 'design', 'all'",
                    "default": "all"
                }
            },
            "required": ["code"]
        }
    },
    {
        "name": "delete_template",
        "description": "Remove um template do banco de dados.",
        "parameters": {
            "type": "object",
            "properties": {
                "template_id": {
                    "type": "string",
                    "description": "ID do template a ser removido"
                }
            },
            "required": ["template_id"]
        }
    }
]


# ═══════════════════════════════════════════════════════════════════════════════
# CLASSE PRINCIPAL: DAIA BRAIN
# ═══════════════════════════════════════════════════════════════════════════════

class DAIABrain:
    """
    Cérebro autônomo do DAIA usando Gemini 2.5 Flash com Tool Calling.
    
    Este é o coração do sistema - um agente que:
    - Raciocina sobre o que o usuário quer
    - Decide quando buscar templates
    - Decide quando salvar novos templates
    - Mantém consistência de estilo
    - Evolui com o uso
    """
    
    def __init__(
        self,
        api_key: Optional[str] = None,
        template_store = None,
        similarity_search = None
    ):
        """
        Inicializa o cérebro DAIA.
        
        Args:
            api_key: Chave da API do Gemini (ou usa GEMINI_API_KEY do ambiente)
            template_store: Instância do TemplateStore
            similarity_search: Instância do SimilaritySearch
        """
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        self.template_store = template_store
        self.similarity_search = similarity_search
        self.model = None
        self.chat = None
        self.conversation_history = []
        
        if not GENAI_AVAILABLE:
            raise ImportError("google-generativeai não está instalado")
            
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY não configurada")
            
        self._initialize_model()
        
    def _initialize_model(self):
        """Inicializa o modelo Gemini com as tools."""
        genai.configure(api_key=self.api_key)
        
        # Cria as function declarations
        function_declarations = []
        for tool_def in DAIA_TOOLS:
            func_decl = genai.protos.FunctionDeclaration(
                name=tool_def["name"],
                description=tool_def["description"],
                parameters=genai.protos.Schema(
                    type=genai.protos.Type.OBJECT,
                    properties={
                        k: genai.protos.Schema(
                            type=self._get_proto_type(v.get("type", "string")),
                            description=v.get("description", "")
                        )
                        for k, v in tool_def["parameters"].get("properties", {}).items()
                    },
                    required=tool_def["parameters"].get("required", [])
                )
            )
            function_declarations.append(func_decl)
        
        # Cria o modelo com as tools
        self.model = genai.GenerativeModel(
            model_name=BrainConfig.MODEL_NAME,
            generation_config={
                "temperature": BrainConfig.TEMPERATURE,
                "max_output_tokens": BrainConfig.MAX_OUTPUT_TOKENS,
            },
            system_instruction=BrainConfig.SYSTEM_INSTRUCTION,
            tools=[genai.protos.Tool(function_declarations=function_declarations)]
        )
        
        # Inicia chat
        self.chat = self.model.start_chat(history=[])
        
        print(f"🧠 DAIA Brain inicializado com {len(DAIA_TOOLS)} tools")
        
    def _get_proto_type(self, type_str: str):
        """Converte tipo string para proto type."""
        type_map = {
            "string": genai.protos.Type.STRING,
            "integer": genai.protos.Type.INTEGER,
            "number": genai.protos.Type.NUMBER,
            "boolean": genai.protos.Type.BOOLEAN,
            "array": genai.protos.Type.ARRAY,
            "object": genai.protos.Type.OBJECT
        }
        return type_map.get(type_str, genai.protos.Type.STRING)
        
    async def _execute_tool(self, tool_name: str, args: Dict[str, Any]) -> Dict[str, Any]:
        """
        Executa uma tool e retorna o resultado.
        
        Este método conecta as tools do Gemini com o banco de dados real.
        """
        print(f"🔧 Executando tool: {tool_name}")
        print(f"   Args: {json.dumps(args, indent=2, ensure_ascii=False)[:200]}...")
        
        try:
            if tool_name == "search_templates":
                return await self._tool_search_templates(args)
            elif tool_name == "save_template":
                return await self._tool_save_template(args)
            elif tool_name == "get_template_by_id":
                return await self._tool_get_template(args)
            elif tool_name == "list_categories":
                return await self._tool_list_categories(args)
            elif tool_name == "get_statistics":
                return await self._tool_get_statistics(args)
            elif tool_name == "analyze_code_quality":
                return await self._tool_analyze_quality(args)
            elif tool_name == "suggest_improvements":
                return await self._tool_suggest_improvements(args)
            elif tool_name == "delete_template":
                return await self._tool_delete_template(args)
            else:
                return {"error": f"Tool desconhecida: {tool_name}"}
        except Exception as e:
            print(f"❌ Erro na tool {tool_name}: {e}")
            return {"error": str(e)}
            
    # ═══════════════════════════════════════════════════════════════════════════
    # IMPLEMENTAÇÃO DAS TOOLS
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def _tool_search_templates(self, args: Dict) -> Dict:
        """Busca templates similares."""
        if not self.similarity_search:
            return {"error": "SimilaritySearch não configurado", "templates": []}
            
        results = await self.similarity_search.search(
            query=args.get("query", ""),
            limit=args.get("limit", 3),
            category=args.get("category"),
            min_score=args.get("min_score", 70)
        )
        
        # Formata resultados para o modelo
        templates = []
        for r in results:
            templates.append({
                "id": r["id"],
                "prompt": r["prompt"],
                "code_preview": r["code"][:500] + "..." if len(r["code"]) > 500 else r["code"],
                "category": r.get("category", "general"),
                "score": r.get("score", 0),
                "similarity": f"{r['similarity']:.1%}"
            })
            
        return {
            "found": len(templates),
            "templates": templates,
            "message": f"Encontrei {len(templates)} templates similares" if templates else "Nenhum template similar encontrado"
        }
        
    async def _tool_save_template(self, args: Dict) -> Dict:
        """Salva um novo template."""
        if not self.template_store:
            return {"error": "TemplateStore não configurado"}
            
        from models.embedder import CodeEmbedder
        embedder = CodeEmbedder()
        
        code = args.get("code", "")
        prompt = args.get("prompt", "")
        
        # Gera embedding
        embedding = embedder.encode(code, prompt)
        
        # Gera ID
        import hashlib
        code_hash = hashlib.sha256(code.encode()).hexdigest()[:16]
        template_id = f"tpl_{code_hash}"
        
        # Processa tags
        result = await self.template_store.save(
            template_id=template_id,
            prompt=prompt,
            code=code,
            embedding=embedding,
            category=args.get("category", "general"),
            score=args.get("score", 85),
            metadata={
                "tags": args.get("tags", []),
                "saved_at": datetime.utcnow().isoformat(),
                "source": "daia_brain"
            }
        )
        
        # Atualiza índice de similaridade
        if self.similarity_search:
            await self.similarity_search.add_to_index(template_id, embedding)
        
        return {
            "success": True,
            "template_id": template_id,
            "message": f"Template salvo com sucesso! ID: {template_id}"
        }
        
    async def _tool_get_template(self, args: Dict) -> Dict:
        """Obtém um template específico."""
        if not self.template_store:
            return {"error": "TemplateStore não configurado"}
            
        template = await self.template_store.get_by_id(args.get("template_id", ""))
        
        if template:
            return {
                "found": True,
                "template": {
                    "id": template["id"],
                    "prompt": template["prompt"],
                    "code": template["code"],
                    "category": template.get("category"),
                    "score": template.get("score"),
                    "created_at": template.get("created_at")
                }
            }
        return {"found": False, "message": "Template não encontrado"}
        
    async def _tool_list_categories(self, args: Dict) -> Dict:
        """Lista categorias."""
        if not self.template_store:
            return {"error": "TemplateStore não configurado"}
            
        categories = await self.template_store.get_categories()
        return {
            "categories": categories,
            "total": len(categories)
        }
        
    async def _tool_get_statistics(self, args: Dict) -> Dict:
        """Obtém estatísticas."""
        if not self.template_store:
            return {"error": "TemplateStore não configurado"}
            
        stats = await self.template_store.get_stats()
        return stats
        
    async def _tool_analyze_quality(self, args: Dict) -> Dict:
        """Analisa qualidade do código."""
        code = args.get("code", "")
        
        # Análise básica
        analysis = {
            "has_doctype": "<!DOCTYPE" in code.upper(),
            "has_meta_viewport": 'viewport' in code.lower(),
            "has_lang_attribute": 'lang=' in code.lower(),
            "uses_semantic_html": any(tag in code.lower() for tag in ['<header', '<main', '<footer', '<nav', '<article', '<section']),
            "has_alt_attributes": 'alt=' in code.lower() if '<img' in code.lower() else True,
            "uses_tailwind": 'tailwindcss' in code.lower() or 'class="' in code,
            "has_responsive_classes": any(cls in code for cls in ['md:', 'lg:', 'sm:', 'xl:']),
            "code_length": len(code),
            "estimated_complexity": "low" if len(code) < 5000 else "medium" if len(code) < 15000 else "high"
        }
        
        # Calcula score
        score = 0
        if analysis["has_doctype"]: score += 10
        if analysis["has_meta_viewport"]: score += 15
        if analysis["has_lang_attribute"]: score += 10
        if analysis["uses_semantic_html"]: score += 20
        if analysis["has_alt_attributes"]: score += 15
        if analysis["uses_tailwind"]: score += 15
        if analysis["has_responsive_classes"]: score += 15
        
        analysis["quality_score"] = score
        analysis["grade"] = "A" if score >= 80 else "B" if score >= 60 else "C" if score >= 40 else "D"
        
        return analysis
        
    async def _tool_suggest_improvements(self, args: Dict) -> Dict:
        """Sugere melhorias."""
        code = args.get("code", "")
        focus = args.get("focus", "all")
        
        suggestions = []
        
        # Análise e sugestões
        if "<!DOCTYPE" not in code.upper():
            suggestions.append("Adicionar <!DOCTYPE html> no início")
        if 'viewport' not in code.lower():
            suggestions.append("Adicionar meta viewport para responsividade")
        if 'lang=' not in code.lower():
            suggestions.append("Adicionar atributo lang no <html>")
        if '<img' in code.lower() and 'alt=' not in code.lower():
            suggestions.append("Adicionar atributos alt nas imagens para acessibilidade")
        if not any(tag in code.lower() for tag in ['<header', '<main', '<footer']):
            suggestions.append("Usar tags semânticas (header, main, footer)")
        if 'aria-' not in code.lower():
            suggestions.append("Adicionar atributos ARIA para melhor acessibilidade")
            
        return {
            "suggestions": suggestions,
            "total": len(suggestions),
            "focus": focus
        }
        
    async def _tool_delete_template(self, args: Dict) -> Dict:
        """Remove um template."""
        if not self.template_store:
            return {"error": "TemplateStore não configurado"}
            
        success = await self.template_store.delete(args.get("template_id", ""))
        
        if success and self.similarity_search:
            await self.similarity_search.remove_from_index(args.get("template_id", ""))
            
        return {
            "success": success,
            "message": "Template removido" if success else "Template não encontrado"
        }
        
    # ═══════════════════════════════════════════════════════════════════════════
    # MÉTODO PRINCIPAL: THINK (RACIOCINAR)
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def think(self, user_message: str, context: Optional[Dict] = None) -> Dict[str, Any]:
        """
        Processa uma mensagem do usuário e retorna uma resposta.
        
        Este é o método principal que:
        1. Envia a mensagem para o Gemini
        2. Processa tool calls se necessário
        3. Retorna a resposta final
        
        Args:
            user_message: Mensagem do usuário
            context: Contexto adicional (código atual, etc)
            
        Returns:
            Dict com resposta, tools usadas, etc
        """
        print(f"\n🧠 DAIA Brain processando: {user_message[:100]}...")
        
        # Adiciona contexto se fornecido
        full_message = user_message
        if context:
            if context.get("current_code"):
                full_message += f"\n\n[CÓDIGO ATUAL DO USUÁRIO]:\n```html\n{context['current_code'][:2000]}...\n```"
            if context.get("project_type"):
                full_message += f"\n\n[TIPO DE PROJETO]: {context['project_type']}"
                
        # Envia para o modelo
        response = self.chat.send_message(full_message)
        
        # Processa tool calls
        tools_used = []
        tool_results = []
        
        while response.candidates[0].content.parts:
            # Verifica se há function calls
            function_calls = [
                part.function_call 
                for part in response.candidates[0].content.parts 
                if hasattr(part, 'function_call') and part.function_call.name
            ]
            
            if not function_calls:
                break
                
            # Executa cada function call
            for fc in function_calls:
                tool_name = fc.name
                tool_args = dict(fc.args) if fc.args else {}
                
                tools_used.append({
                    "name": tool_name,
                    "args": tool_args
                })
                
                # Executa a tool
                result = await self._execute_tool(tool_name, tool_args)
                tool_results.append({
                    "name": tool_name,
                    "result": result
                })
                
            # Envia resultados de volta para o modelo
            response = self.chat.send_message(
                genai.protos.Content(
                    parts=[
                        genai.protos.Part(
                            function_response=genai.protos.FunctionResponse(
                                name=tr["name"],
                                response={"result": tr["result"]}
                            )
                        )
                        for tr in tool_results
                    ]
                )
            )
            tool_results = []  # Reset para próxima iteração
            
        # Extrai texto da resposta final
        final_text = ""
        for part in response.candidates[0].content.parts:
            if hasattr(part, 'text') and part.text:
                final_text += part.text
                
        # Salva no histórico
        self.conversation_history.append({
            "role": "user",
            "content": user_message,
            "timestamp": datetime.utcnow().isoformat()
        })
        self.conversation_history.append({
            "role": "assistant",
            "content": final_text,
            "tools_used": tools_used,
            "timestamp": datetime.utcnow().isoformat()
        })
        
        return {
            "response": final_text,
            "tools_used": tools_used,
            "conversation_length": len(self.conversation_history)
        }
        
    def reset_conversation(self):
        """Reseta a conversa."""
        self.chat = self.model.start_chat(history=[])
        self.conversation_history = []
        print("🔄 Conversa resetada")
        
    def get_conversation_history(self) -> List[Dict]:
        """Retorna histórico da conversa."""
        return self.conversation_history
