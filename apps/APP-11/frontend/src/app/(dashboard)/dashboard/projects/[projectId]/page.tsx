
"use client";

import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/hooks/use-auth-store';
import { useProjectDetails } from '@/hooks/use-project-details';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/shared/glass-card';
import { Loader2, ArrowLeft, Code, Image as ImageIcon, ExternalLink, Trash2, Edit } from 'lucide-react';
import { formatISODate } from '@/lib/utils';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useState } from 'react';
import { projectService } from '@/services/api/project';
import { useToast } from '@/components/ui/use-toast';
import { APIErrorResponse } from '@/types/api';
import Link from 'next/link';

export default function ProjectDetailsPage() {
  const router = useRouter();
  const { projectId } = useParams() as { projectId: string };
  const { user } = useAuthStore();
  const { project, isLoading, error, refetchProject } = useProjectDetails(projectId);
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteProject = async () => {
    if (!user?.id || !projectId) return;

    setIsDeleting(true);
    try {
      await projectService.deleteProject(user.id, projectId);
      toast({
        variant: "success",
        title: "Projeto Excluído",
        description: `O projeto "${project?.name || 'selecionado'}" foi excluído com sucesso.`,
      });
      router.push('/dashboard/projects'); // Redirect to projects list after deletion
    } catch (err: any) {
      let errorMessage = "Ocorreu um erro ao excluir o projeto.";
      if (err.response?.data) {
        const apiError = err.response.data as APIErrorResponse;
        errorMessage = apiError.error || errorMessage;
      } else if (err.message) {
        errorMessage = err.message;
      }
      toast({
        variant: "destructive",
        title: "Erro na Exclusão",
        description: errorMessage,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Carregando detalhes do projeto...</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="text-center p-8 space-y-4">
        <h1 className="text-2xl font-bold text-destructive">Erro</h1>
        <p className="text-muted-foreground">{error || "Projeto não encontrado."}</p>
        <Button onClick={() => router.push('/dashboard/projects')} className="flex items-center mx-auto gap-2">
          <ArrowLeft className="h-4 w-4" /> Voltar para Projetos
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="Voltar">
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-4xl font-bold text-foreground">{project.name}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GlassCard className="lg:col-span-2 p-6 space-y-4">
          <div className="flex justify-between items-start">
            <h2 className="text-2xl font-semibold text-foreground">Visão Geral do Projeto</h2>
            <span
              className={`text-sm font-semibold px-3 py-1 rounded-full ${
                project.status === "COMPLETED" ? "bg-green-500/20 text-green-500" :
                project.status === "GENERATING" ? "bg-blue-500/20 text-blue-500" :
                project.status === "DRAFT" ? "bg-yellow-500/20 text-yellow-500" :
                "bg-red-500/20 text-red-500"
              }`}
            >
              {project.status.replace('_', ' ')}
            </span>
          </div>
          <p className="text-muted-foreground">{project.description}</p>

          <div className="space-y-2 pt-4">
            <h3 className="text-lg font-medium text-foreground">Requisitos</h3>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1">
              {project.requirements.map((req, index) => (
                <li key={index}>{req}</li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            <div>
              <p className="font-medium text-foreground">Estilo Preferido:</p>
              <p className="text-muted-foreground">{project.stylePreference.replace('_', ' ')}</p>
            </div>
            <div>
              <p className="font-medium text-foreground">Público-alvo:</p>
              <p className="text-muted-foreground">{project.targetAudience || 'Não especificado'}</p>
            </div>
            <div>
              <p className="font-medium text-foreground">Criado em:</p>
              <p className="text-muted-foreground">{formatISODate(project.createdAt)}</p>
            </div>
            <div>
              <p className="font-medium text-foreground">Última Atualização:</p>
              <p className="text-muted-foreground">{formatISODate(project.updatedAt)}</p>
            </div>
          </div>
        </GlassCard>

        <div className="lg:col-span-1 space-y-6">
          {project.previewImageUrl && (
            <GlassCard className="p-4 space-y-4">
              <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
                <ImageIcon className="h-5 w-5" /> Pré-visualização
              </h3>
              <div className="relative aspect-video rounded-lg overflow-hidden border border-border-foreground/10">
                <img src={project.previewImageUrl} alt={`Preview do projeto ${project.name}`} className="w-full h-full object-cover" />
              </div>
              <Button asChild variant="outline" className="w-full flex items-center gap-2">
                <a href={project.previewImageUrl} target="_blank" rel="noopener noreferrer">
                  Ver em Tela Cheia <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </GlassCard>
          )}

          {project.generatedCodeUrl && (
            <GlassCard className="p-4 space-y-4">
              <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
                <Code className="h-5 w-5" /> Código Gerado
              </h3>
              <p className="text-muted-foreground text-sm">Acesse o repositório ou o link do código gerado pela IA.</p>
              <Button asChild className="w-full flex items-center gap-2">
                <a href={project.generatedCodeUrl} target="_blank" rel="noopener noreferrer">
                  Acessar Código <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </GlassCard>
          )}

          <GlassCard className="p-4 space-y-4">
            <h3 className="text-xl font-semibold text-foreground">Ações</h3>
            <Button variant="secondary" className="w-full flex items-center gap-2" asChild>
              <Link href={`/dashboard/projects/${project.id}/edit`}>
                <Edit className="h-4 w-4" /> Editar Projeto (Em breve)
              </Link>
            </Button>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="destructive" className="w-full flex items-center gap-2">
                  <Trash2 className="h-4 w-4" /> Excluir Projeto
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Confirmar Exclusão</DialogTitle>
                  <DialogDescription>
                    Tem certeza de que deseja excluir o projeto &quot;{project.name}&quot;? Esta ação é irreversível.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => {}}>Cancelar</Button>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteProject}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="mr-2 h-4 w-4" />
                    )}
                    Excluir
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
