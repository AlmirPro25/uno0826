
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
import { BetaSubscriptionRequest } from '@/types/api';
import { betaService } from '@/services/api/beta'; // Use the new betaService
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Send } from 'lucide-react';
import { APIErrorResponse } from '@/types/api';

const formSchema = z.object({
  name: z.string().min(2, { message: "Nome deve ter no mínimo 2 caracteres." }).max(100, { message: "Nome deve ter no máximo 100 caracteres." }),
  email: z.string().email({ message: "Por favor, insira um e-mail válido." }),
});

export function BetaSignupForm() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      // Use the new betaService
      await betaService.subscribe(values as BetaSubscriptionRequest);
      toast({
        variant: "success",
        title: "Sucesso!",
        description: "Sua inscrição para o acesso beta foi recebida. Verifique seu e-mail.",
      });
      form.reset(); // Clear form on success
    } catch (error: any) {
      let errorMessage = "Ocorreu um erro ao processar sua inscrição. Por favor, tente novamente.";
      if (error.response?.data) {
        const apiError = error.response.data as APIErrorResponse;
        if (apiError.code === "BETA_EMAIL_ALREADY_SUBSCRIBED") {
          errorMessage = "Este e-mail já está inscrito no programa beta.";
        } else if (apiError.error) {
          errorMessage = apiError.error;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        variant: "destructive",
        title: "Erro na Inscrição",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" aria-label="Formulário de Inscrição Beta">
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
                  aria-required="true"
                  aria-invalid={form.formState.errors.name ? "true" : "false"}
                  data-aid="beta-name-input"
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
                  aria-required="true"
                  aria-invalid={form.formState.errors.email ? "true" : "false"}
                  data-aid="beta-email-input"
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
          data-aid="beta-submit-button"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-label="Enviando" />
              Enviando...
            </>
          ) : (
            <>
              <Send className="h-4 w-4" aria-hidden="true" />
              Solicitar Acesso Beta
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}
