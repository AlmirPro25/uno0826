
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
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
import { useToast } from '@/components/ui/use-toast';
import { Loader2, LogIn, UserPlus } from 'lucide-react';
import { APIErrorResponse } from '@/types/api';
import { LoginRequest, RegisterRequest } from '@/types/auth';
import { loginUser, registerUser } from '@/lib/auth';
import { useRouter } from 'next/navigation';

const loginFormSchema = z.object({
  email: z.string().email({ message: "Por favor, insira um e-mail válido." }),
  password: z.string().min(1, { message: "A senha é obrigatória." }),
});

const registerFormSchema = z.object({
  name: z.string().min(2, { message: "Nome deve ter no mínimo 2 caracteres." }).max(100, { message: "Nome deve ter no máximo 100 caracteres." }),
  email: z.string().email({ message: "Por favor, insira um e-mail válido." }),
  password: z.string().min(8, { message: "A senha deve ter no mínimo 8 caracteres." }),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;
type RegisterFormValues = z.infer<typeof registerFormSchema>;

interface AuthFormProps {
  type: 'login' | 'register';
}

export function AuthForm({ type }: AuthFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<LoginFormValues | RegisterFormValues>({
    resolver: zodResolver(type === 'login' ? loginFormSchema : registerFormSchema),
    defaultValues: type === 'login' ? { email: "", password: "" } : { name: "", email: "", password: "" },
  });

  async function onSubmit(values: LoginFormValues | RegisterFormValues) {
    setIsLoading(true);
    try {
      if (type === 'login') {
        await loginUser(values as LoginRequest);
        toast({
          variant: "success",
          title: "Login bem-sucedido!",
          description: "Bem-vindo de volta ao AI Web Weaver.",
        });
        router.push('/dashboard');
      } else {
        await registerUser(values as RegisterRequest);
        toast({
          variant: "success",
          title: "Registro bem-sucedido!",
          description: "Sua conta foi criada com sucesso. Redirecionando para o dashboard.",
        });
        router.push('/dashboard');
      }
      form.reset();
    } catch (error: any) {
      let errorMessage = `Ocorreu um erro ao ${type === 'login' ? 'fazer login' : 'registrar'}. Por favor, tente novamente.`;
      if (error.response?.data) {
        const apiError = error.response.data as APIErrorResponse;
        if (apiError.code === "EMAIL_TAKEN") {
          errorMessage = "Este e-mail já está registrado.";
        } else if (apiError.code === "INVALID_CREDENTIALS") {
          errorMessage = "E-mail ou senha inválidos.";
        } else if (apiError.error) {
          errorMessage = apiError.error;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        variant: "destructive",
        title: `Erro de ${type === 'login' ? 'Login' : 'Registro'}`,
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" aria-label={`Formulário de ${type === 'login' ? 'Login' : 'Registro'}`}>
        {type === 'register' && (
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Seu nome"
                    {...field}
                    aria-required="true"
                    aria-invalid={form.formState.errors.name ? "true" : "false"}
                    data-aid="auth-name-input"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
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
                  aria-required="true"
                  aria-invalid={form.formState.errors.email ? "true" : "false"}
                  data-aid="auth-email-input"
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
              <FormLabel>Senha</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="********"
                  {...field}
                  aria-required="true"
                  aria-invalid={form.formState.errors.password ? "true" : "false"}
                  data-aid="auth-password-input"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          className="w-full flex items-center gap-2"
          disabled={isLoading}
          aria-disabled={isLoading}
          data-aid={`auth-${type}-submit-button`}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-label="Processando" />
              Processando...
            </>
          ) : (
            <>
              {type === 'login' ? <LogIn className="h-4 w-4" aria-hidden="true" /> : <UserPlus className="h-4 w-4" aria-hidden="true" />}
              {type === 'login' ? 'Entrar' : 'Criar Conta'}
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}
