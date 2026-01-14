
"use client";

import { useAuthStore } from '@/hooks/use-auth-store';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/components/ui/use-toast';
import { useEffect, useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import { APIErrorResponse } from '@/types/api';
import { UserProfile, UpdateUserProfileRequest } from '@/types/auth';
import { formatISODate } from '@/lib/utils';
import { authService } from '@/services/api/auth'; // Use the new authService

const profileFormSchema = z.object({
  name: z.string().min(2, { message: "Nome deve ter no mínimo 2 caracteres." }).max(100, { message: "Nome deve ter no máximo 100 caracteres." }).optional(),
  email: z.string().email({ message: "Por favor, insira um e-mail válido." }).optional(),
  password: z.string().min(8, { message: "A senha deve ter no mínimo 8 caracteres." }).optional().or(z.literal("")),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function ProfileSettingsPage() {
  const { user, setTokens, accessToken, refreshToken, accessTokenExpiresAt } = useAuthStore();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      password: "",
    },
  });

  // Reset form with user data when user changes or component mounts
  useEffect(() => {
    if (user) {
      form.reset({
        name: user.name,
        email: user.email,
        password: "", // Always clear password field for security
      });
    }
  }, [user, form]);

  async function onSubmit(values: ProfileFormValues) {
    setIsLoading(true);
    try {
      const updatePayload: UpdateUserProfileRequest = {};
      if (values.name && values.name !== user?.name) {
        updatePayload.name = values.name;
      }
      if (values.email && values.email !== user?.email) {
        updatePayload.email = values.email;
      }
      if (values.password) { // Only send password if it's not empty
        updatePayload.password = values.password;
      }

      if (Object.keys(updatePayload).length === 0) {
        toast({
          title: "Nenhuma alteração detectada",
          description: "Nenhum dado foi alterado para ser salvo.",
          variant: "default",
        });
        setIsLoading(false);
        return;
      }

      // Use the new authService
      const updatedUser = await authService.updateProfile(updatePayload);

      // Update Zustand store and localStorage with new user data
      // Note: Access and Refresh tokens should not change on profile update
      if (accessToken && refreshToken && accessTokenExpiresAt) {
        setTokens(accessToken, refreshToken, (accessTokenExpiresAt - Date.now()) / 1000, updatedUser);
      }


      toast({
        variant: "success",
        title: "Sucesso!",
        description: "Seu perfil foi atualizado com sucesso.",
      });
      form.reset({ ...updatedUser, password: "" }); // Reset form with updated data and clear password
    } catch (error: any) {
      let errorMessage = "Ocorreu um erro ao atualizar seu perfil. Por favor, tente novamente.";
      if (error.response?.data) {
        const apiError = error.response.data as APIErrorResponse;
        if (apiError.code === "EMAIL_TAKEN") {
          errorMessage = "Este e-mail já está registrado por outro usuário.";
        } else if (apiError.error) {
          errorMessage = apiError.error;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        variant: "destructive",
        title: "Erro ao Atualizar Perfil",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Carregando perfil...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold text-foreground">Configurações do Perfil</h1>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome Completo</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Seu nome"
                    {...field}
                    aria-required="false"
                    aria-invalid={form.formState.errors.name ? "true" : "false"}
                    data-aid="profile-name-input"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>E-mail</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="seu@email.com"
                    {...field}
                    aria-required="false"
                    aria-invalid={form.formState.errors.email ? "true" : "false"}
                    data-aid="profile-email-input"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nova Senha (deixe em branco para não alterar)</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="********"
                    {...field}
                    value={field.value || ""} // Ensure controlled component behavior
                    aria-required="false"
                    aria-invalid={form.formState.errors.password ? "true" : "false"}
                    data-aid="profile-password-input"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div>
            <Label className="text-sm font-medium leading-none">Membro Desde</Label>
            <p className="text-muted-foreground text-sm mt-1">{user.createdAt ? formatISODate(user.createdAt) : 'N/A'}</p>
          </div>
          <div>
            <Label className="text-sm font-medium leading-none">Última Atualização</Label>
            <p className="text-muted-foreground text-sm mt-1">{user.updatedAt ? formatISODate(user.updatedAt) : 'N/A'}</p>
          </div>

          <Button
            type="submit"
            className="w-full md:w-auto flex items-center gap-2"
            disabled={isLoading}
            aria-disabled={isLoading}
            data-aid="profile-save-button"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-label="Salvando" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" aria-hidden="true" />
                Salvar Alterações
              </>
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
