
"use client";

import { useAuthStore } from "@/hooks/use-auth-store";
import { PlusCircle, Search, Sparkles, FolderKanban, Info, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GlassCard } from "@/components/shared/glass-card";
import { useState } from "react";
import { Project } from "@/types/models";
import { formatISODate } from "@/lib/utils";
import { useProjects } from "@/hooks/use-projects"; // Use the new hook

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { projects, isLoading, error } = useProjects(); // Fetch projects using the hook
  const [searchTerm, setSearchTerm] = useState("");

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Carregando projetos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8 space-y-4">
        <h1 className="text-2xl font-bold text-destructive">Erro</h1>
        <p className="text-muted-foreground">{error}</p>
        {/* Potentially add a retry button or redirect to login if auth error */}
        <Button onClick={() => window.location.reload()}>Tentar Novamente</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <h1 className="text-4xl font-bold text-foreground">Olá, {user?.name.split(' ')[0]}!</h1>
        <Button asChild>
          <Link href="/dashboard/new-project" className="flex items-center gap-2">
            <PlusCircle className="h-5 w-5" />
            Novo Projeto
          </Link>
        </Button>
      </div>

      <div className="relative">
        <Input
          type="text"
          placeholder="Buscar projetos..."
          className="pl-10 pr-4 py-2 w-full max-w-lg"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          aria-label="Buscar projetos"
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" aria-hidden="true" />
      </div>

      <h2 className="text-2xl font-semibold text-foreground mt-8">Seus Projetos Recentes</h2>
      {filteredProjects.length === 0 ? (
        <GlassCard className="p-6 text-center text-muted-foreground">
          <FolderKanban className="h-12 w-12 mx-auto mb-4 text-primary/50" />
          <p className="text-lg">Nenhum projeto encontrado. Comece a criar!</p>
          <Button asChild className="mt-4">
            <Link href="/dashboard/new-project">Criar Projeto</Link>
          </Button>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <GlassCard key={project.id} className="p-6 flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-foreground">{project.name}</h3>
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    project.status === "COMPLETED" ? "bg-green-500/20 text-green-500" :
                    project.status === "GENERATING" ? "bg-blue-500/20 text-blue-500" :
                    project.status === "DRAFT" ? "bg-yellow-500/20 text-yellow-500" :
                    "bg-red-500/20 text-red-500"
                  }`}
                >
                  {project.status.replace('_', ' ')}
                </span>
              </div>
              <p className="text-muted-foreground text-sm flex-grow">{project.description}</p>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>Criado em: {formatISODate(project.createdAt)}</p>
                <p>Atualizado em: {formatISODate(project.updatedAt)}</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 mt-4">
                <Button variant="secondary" size="sm" asChild>
                  <Link href={`/dashboard/projects/${project.id}`} aria-label={`Ver detalhes do projeto ${project.name}`}>
                    Ver Detalhes <Info className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                {project.generatedCodeUrl && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={project.generatedCodeUrl} target="_blank" rel="noopener noreferrer" aria-label={`Ver código gerado para ${project.name}`}>
                      Ver Código <Sparkles className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                )}
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
