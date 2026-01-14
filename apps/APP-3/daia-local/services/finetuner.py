"""
╔══════════════════════════════════════════════════════════════════════════════╗
║                    DAIA - Fine-Tuner (Opcional)                              ║
║                                                                              ║
║              Fine-tuning de modelos locais com LoRA                          ║
╚══════════════════════════════════════════════════════════════════════════════╝

⚠️ ATENÇÃO: Este módulo é OPCIONAL e requer mais recursos.
Para i3 7ª geração com 8GB RAM, use com cuidado.

Modelos suportados:
- Qwen2-0.5B (recomendado para i3)
- TinyLlama-1.1B
- Phi-2 (requer mais RAM)

Técnica: LoRA (Low-Rank Adaptation)
- Treina apenas ~1% dos parâmetros
- Reduz uso de memória drasticamente
- Permite fine-tuning em CPU
"""

import os
import json
import asyncio
from datetime import datetime
from typing import Optional, List, Dict, Any
from pathlib import Path


class FineTuner:
    """
    Fine-tuning de modelos locais usando LoRA.
    
    Otimizado para hardware limitado:
    - Gradient checkpointing
    - Mixed precision (quando disponível)
    - Batch size pequeno
    - LoRA rank baixo
    """
    
    # Modelos suportados com configurações otimizadas
    SUPPORTED_MODELS = {
        "Qwen/Qwen2-0.5B": {
            "ram_required_gb": 2,
            "lora_rank": 8,
            "lora_alpha": 16,
            "batch_size": 2,
            "gradient_accumulation": 4
        },
        "TinyLlama/TinyLlama-1.1B-Chat-v1.0": {
            "ram_required_gb": 4,
            "lora_rank": 8,
            "lora_alpha": 16,
            "batch_size": 2,
            "gradient_accumulation": 4
        },
        "microsoft/phi-2": {
            "ram_required_gb": 6,
            "lora_rank": 4,
            "lora_alpha": 8,
            "batch_size": 1,
            "gradient_accumulation": 8
        }
    }
    
    def __init__(
        self,
        model_name: str = "Qwen/Qwen2-0.5B",
        output_dir: str = "./models/finetuned",
        status_file: str = "./models/finetune_status.json"
    ):
        self.model_name = model_name
        self.output_dir = output_dir
        self.status_file = status_file
        self.model = None
        self.tokenizer = None
        self.trainer = None
        
        # Verifica se modelo é suportado
        if model_name not in self.SUPPORTED_MODELS:
            print(f"⚠️ Modelo {model_name} não está na lista de suportados.")
            print(f"   Modelos recomendados: {list(self.SUPPORTED_MODELS.keys())}")
            
        # Cria diretórios
        Path(output_dir).mkdir(parents=True, exist_ok=True)
        Path(status_file).parent.mkdir(parents=True, exist_ok=True)
        
    def _update_status(self, status: str, progress: float = 0, message: str = "") -> None:
        """Atualiza arquivo de status."""
        status_data = {
            "status": status,
            "progress": progress,
            "message": message,
            "model": self.model_name,
            "timestamp": datetime.utcnow().isoformat()
        }
        with open(self.status_file, "w") as f:
            json.dump(status_data, f, indent=2)
            
    def _check_dependencies(self) -> bool:
        """Verifica se dependências estão instaladas."""
        try:
            import torch
            import transformers
            import peft
            return True
        except ImportError as e:
            print(f"❌ Dependência não encontrada: {e}")
            print("   Execute: pip install torch transformers peft datasets")
            return False
            
    async def train(
        self,
        data: List[Dict[str, str]],
        epochs: int = 3,
        batch_size: Optional[int] = None,
        learning_rate: float = 2e-5,
        max_length: int = 512
    ) -> Dict[str, Any]:
        """
        Executa fine-tuning do modelo.
        
        Args:
            data: Lista de {"prompt": "...", "completion": "..."}
            epochs: Número de épocas
            batch_size: Tamanho do batch (auto se None)
            learning_rate: Taxa de aprendizado
            max_length: Comprimento máximo de sequência
            
        Returns:
            Dict com métricas de treinamento
        """
        if not self._check_dependencies():
            self._update_status("error", 0, "Dependências não instaladas")
            return {"error": "Dependencies not installed"}
            
        self._update_status("starting", 0, "Iniciando fine-tuning...")
        
        try:
            import torch
            from transformers import (
                AutoModelForCausalLM,
                AutoTokenizer,
                TrainingArguments,
                Trainer,
                DataCollatorForLanguageModeling
            )
            from peft import LoraConfig, get_peft_model, TaskType
            from datasets import Dataset
            
            # Configurações do modelo
            config = self.SUPPORTED_MODELS.get(self.model_name, {
                "lora_rank": 8,
                "lora_alpha": 16,
                "batch_size": 2,
                "gradient_accumulation": 4
            })
            
            if batch_size is None:
                batch_size = config["batch_size"]
                
            self._update_status("loading", 10, "Carregando modelo base...")
            
            # Carrega tokenizer
            self.tokenizer = AutoTokenizer.from_pretrained(
                self.model_name,
                trust_remote_code=True
            )
            if self.tokenizer.pad_token is None:
                self.tokenizer.pad_token = self.tokenizer.eos_token
                
            # Carrega modelo
            self.model = AutoModelForCausalLM.from_pretrained(
                self.model_name,
                torch_dtype=torch.float32,  # CPU não suporta float16
                device_map="cpu",
                trust_remote_code=True
            )
            
            self._update_status("configuring", 20, "Configurando LoRA...")
            
            # Configura LoRA
            lora_config = LoraConfig(
                task_type=TaskType.CAUSAL_LM,
                r=config["lora_rank"],
                lora_alpha=config["lora_alpha"],
                lora_dropout=0.1,
                target_modules=["q_proj", "v_proj"],  # Ajustar por modelo
                bias="none"
            )
            
            self.model = get_peft_model(self.model, lora_config)
            self.model.print_trainable_parameters()
            
            self._update_status("preparing", 30, "Preparando dataset...")
            
            # Prepara dataset
            def format_example(example):
                text = f"### Prompt:\n{example['prompt']}\n\n### Code:\n{example['completion']}"
                return {"text": text}
                
            dataset = Dataset.from_list(data)
            dataset = dataset.map(format_example)
            
            # Tokeniza
            def tokenize(example):
                return self.tokenizer(
                    example["text"],
                    truncation=True,
                    max_length=max_length,
                    padding="max_length"
                )
                
            tokenized_dataset = dataset.map(tokenize, remove_columns=["text", "prompt", "completion"])
            
            self._update_status("training", 40, "Iniciando treinamento...")
            
            # Argumentos de treinamento
            training_args = TrainingArguments(
                output_dir=self.output_dir,
                num_train_epochs=epochs,
                per_device_train_batch_size=batch_size,
                gradient_accumulation_steps=config["gradient_accumulation"],
                learning_rate=learning_rate,
                weight_decay=0.01,
                logging_steps=10,
                save_steps=100,
                save_total_limit=2,
                fp16=False,  # CPU não suporta
                gradient_checkpointing=True,
                optim="adamw_torch",
                report_to="none"
            )
            
            # Data collator
            data_collator = DataCollatorForLanguageModeling(
                tokenizer=self.tokenizer,
                mlm=False
            )
            
            # Trainer
            self.trainer = Trainer(
                model=self.model,
                args=training_args,
                train_dataset=tokenized_dataset,
                data_collator=data_collator
            )
            
            # Treina
            train_result = self.trainer.train()
            
            self._update_status("saving", 90, "Salvando modelo...")
            
            # Salva modelo LoRA
            self.model.save_pretrained(self.output_dir)
            self.tokenizer.save_pretrained(self.output_dir)
            
            self._update_status("completed", 100, "Fine-tuning concluído!")
            
            return {
                "success": True,
                "output_dir": self.output_dir,
                "epochs": epochs,
                "samples": len(data),
                "train_loss": train_result.training_loss,
                "train_runtime": train_result.metrics.get("train_runtime", 0)
            }
            
        except Exception as e:
            error_msg = str(e)
            self._update_status("error", 0, f"Erro: {error_msg}")
            return {"error": error_msg}
            
    def get_status(self) -> Dict[str, Any]:
        """Retorna status atual do fine-tuning."""
        if os.path.exists(self.status_file):
            with open(self.status_file, "r") as f:
                return json.load(f)
        return {"status": "idle", "message": "Nenhum fine-tuning em andamento"}
        
    def list_finetuned_models(self) -> List[Dict[str, Any]]:
        """Lista modelos fine-tuned disponíveis."""
        models = []
        
        if os.path.exists(self.output_dir):
            for item in os.listdir(self.output_dir):
                model_path = os.path.join(self.output_dir, item)
                if os.path.isdir(model_path):
                    # Verifica se é um modelo válido
                    if os.path.exists(os.path.join(model_path, "adapter_config.json")):
                        models.append({
                            "name": item,
                            "path": model_path,
                            "created_at": datetime.fromtimestamp(
                                os.path.getctime(model_path)
                            ).isoformat()
                        })
                        
        return models
        
    async def generate(
        self,
        prompt: str,
        max_new_tokens: int = 512,
        temperature: float = 0.7
    ) -> str:
        """
        Gera código usando o modelo fine-tuned.
        
        Args:
            prompt: Prompt do usuário
            max_new_tokens: Máximo de tokens a gerar
            temperature: Temperatura de sampling
            
        Returns:
            Código gerado
        """
        if self.model is None or self.tokenizer is None:
            return "Modelo não carregado. Execute train() primeiro."
            
        try:
            import torch
            
            # Formata prompt
            formatted_prompt = f"### Prompt:\n{prompt}\n\n### Code:\n"
            
            # Tokeniza
            inputs = self.tokenizer(
                formatted_prompt,
                return_tensors="pt",
                truncation=True,
                max_length=512
            )
            
            # Gera
            with torch.no_grad():
                outputs = self.model.generate(
                    **inputs,
                    max_new_tokens=max_new_tokens,
                    temperature=temperature,
                    do_sample=True,
                    top_p=0.9,
                    pad_token_id=self.tokenizer.pad_token_id
                )
                
            # Decodifica
            generated = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
            
            # Extrai apenas o código gerado
            if "### Code:" in generated:
                code = generated.split("### Code:")[-1].strip()
                return code
                
            return generated
            
        except Exception as e:
            return f"Erro na geração: {str(e)}"
