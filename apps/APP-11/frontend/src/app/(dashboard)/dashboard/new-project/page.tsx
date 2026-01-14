
"use client";

import { useAuthStore } from '@/hooks/use-auth-store';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { useState } from 'react';
import { Loader2, PlusCircle, Trash2, Send } from 'lucide-react';
import { projectService } from '@/services/api/project'; // Use the new projectService
import { APIErrorResponse, CreateProjectRequest } from '@/types/api';
import { Project, ProjectStyle } from '@/types/models';
import { useRouter } from 'next/navigation';

const projectStyles: ProjectStyle[] = ["MODERN", "MINIMALIST", "CORPORATE", "PLAYFUL", "VINTAGE", "CUSTOM"];

const formSchema = z.object({
  name: z.string().min(3, { message: "Nome deve ter no mínimo 3 caracteres." }).max(200, { message: "Nome deve ter no máximo 200 caracteres." }),
  description: z.string().min(10, { message: "Descrição deve ter no mínimo 10 caracteres." }).max(1000, { message: "Descrição deve ter no máximo 1000 caracteres." }),
  requirements: z.array(
    z.string().min(3, { message: "Cada requisito deve ter no mínimo 3 caracteres." })
  ).min(1, { message: "Pelo menos um requisito é necessário." }),
  stylePreference: z.nativeEnum(ProjectStyle).optional(),
  targetAudience: z.string().min(5, { message: "Público-alvo deve ter no mínimo 5 caracteres." }).max(200, { message: "Público-alvo deve ter no máximo 200 caracteres." }).optional().or(z.literal("")),
});

type ProjectFormValues = z.infer<typeof formSchema>;

export default function NewProjectPage() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      requirements: [""],
      stylePreference: ProjectStyle.MODERN,
      targetAudience: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "requirements",
  });

  async function onSubmit(values: ProjectFormValues) {
    if (!user?.id) {
      toast({
        variant: "destructive",
        title: "Erro de Autenticação",
        description: "ID do usuário não encontrado. Por favor, faça login novamente.",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Filter out empty requirements before sending
      const filteredRequirements = values.requirements.filter(req => req.trim() !== "");

      const payload: CreateProjectRequest = { // Use CreateProjectRequest from types/api
        name: values.name,
        description: values.description,
        requirements: filteredRequirements,
        stylePreference: values.stylePreference,
        targetAudience: values.targetAudience || undefined,
      };

      // Use the new projectService
      const response = await projectService.createProject(user.id, payload);

      toast({
        variant: "success",
        title: "Projeto Criado!",
        description: `O projeto "${response.data.name}" foi iniciado. A IA está trabalhando para gerá-lo.`,
      });
      form.reset(); // Clear form on success
      router.push('/dashboard/projects'); // Redirect to projects list
    } catch (error: any) {
      let errorMessage = "Ocorreu um erro ao criar seu projeto. Por favor, tente novamente.";
      if (error.response?.data) {
        const apiError = error.response.data as APIErrorResponse;
        if (apiError.error) {
          errorMessage = apiError.error;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        variant: "destructive",
        title: "Erro na Criação do Projeto",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold text-foreground">Novo Projeto AI Web Weaver</h1>
      <p className="text-lg text-muted-foreground">Descreva seu site e deixe nossa IA fazer a magia acontecer.</p>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" aria-label="Formulário de Criação de Novo Projeto">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome do Projeto</FormLabel>
                <FormControl>
                  <Input placeholder="Meu Site Incrível" {...field} aria-required="true" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição Detalhada</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Quero um site para minha padaria artesanal, com foco em imagens de alta qualidade e um formulário de contato para pedidos personalizados."
                    rows={5}
                    {...field}
                    aria-required="true"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-2">
            <FormLabel>Requisitos do Site</FormLabel>
            {fields.map((item, index) => (
              <FormItem key={item.id} className="flex items-center space-x-2">
                <FormControl className="flex-grow">
                  <Input
                    placeholder={`Requisito ${index + 1}`}
                    {...form.register(`requirements.${index}` as const)}
                    aria-label={`Requisito do projeto ${index + 1}`}
                    aria-required="true"
                  />
                </FormControl>
                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} aria-label={`Remover requisito ${index + 1}`}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
                <FormMessage>{form.formState.errors.requirements?.[index]?.message}</FormMessage>
              </FormItem>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() => append("")}
              className="flex items-center gap-2"
              aria-label="Adicionar novo requisito"
            >
              <PlusCircle className="h-4 w-4" aria-hidden="true" />
              Adicionar Requisito
            </Button>
            {form.formState.errors.requirements?.message && (
                <p className="text-[0.8rem] font-medium text-destructive mt-2">
                    {form.formState.errors.requirements?.message}
                </p>
            )}
          </div>

          <FormField
            control={form.control}
            name="stylePreference"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estilo de Design Preferido</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger aria-label="Selecione o estilo de design preferido">
                      <SelectValue placeholder="Selecione um estilo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {projectStyles.map((style) => (
                      <SelectItem key={style} value={style}>
                        {style.charAt(0).toUpperCase() + style.slice(1).toLowerCase().replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="targetAudience"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Público-alvo (Opcional)</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Jovens empreendedores, pequenas empresas" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full md:w-auto flex items-center gap-2"
            disabled={isLoading}
            aria-disabled={isLoading}
            data-aid="create-project-submit-button"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-label="Criando projeto" />
                Criando Projeto...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" aria-hidden="true" />
                Criar Projeto
              </>
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
