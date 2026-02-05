/**
 * 😴 PRESENCE SERVICE (Gestão de Presença e Sono)
 * Garante que o bot pareça um humano real com horários de atividade.
 * - Horários de sono (não responde às 4h da manhã)
 * - Simulação de "ocupado" (demora mais em horários de trabalho)
 * - Status dinâmicos baseados na hora do dia
 */

import { PrismaClient } from '@prisma/client';
import { LogRepository } from '../repositories/log.repository';

const prisma = new PrismaClient();

export interface PresenceProfile {
    // Horários de atividade (0-23)
    wakeUpHour: number;       // Hora que "acorda" (default: 8)
    sleepHour: number;        // Hora que "dorme" (default: 23)

    // Períodos de baixa atividade
    lunchStart: number;       // Início do almoço (default: 12)
    lunchEnd: number;         // Fim do almoço (default: 14)

    // Configurações de comportamento
    nightModeEnabled: boolean; // Se true, não responde de noite
    slowMorningEnabled: boolean; // Demora mais pra responder de manhã cedo
    weekendLazy: boolean;     // Mais lento nos fins de semana

    // Timezone
    timezone: string;         // default: "America/Sao_Paulo"
}

export interface PresenceState {
    isAwake: boolean;
    isActive: boolean;
    currentMode: 'SLEEPING' | 'WAKING_UP' | 'ACTIVE' | 'LUNCH' | 'WINDING_DOWN' | 'NIGHT_OWL';
    responseDelayMultiplier: number;
    suggestedStatus: string;
    canRespond: boolean;
    nextActiveTime?: Date;
}

export class PresenceService {
    private logRepo = new LogRepository();

    private profile: PresenceProfile = {
        wakeUpHour: 8,
        sleepHour: 23,
        lunchStart: 12,
        lunchEnd: 14,
        nightModeEnabled: true,
        slowMorningEnabled: true,
        weekendLazy: true,
        timezone: 'America/Sao_Paulo'
    };

    constructor(profile?: Partial<PresenceProfile>) {
        if (profile) {
            this.profile = { ...this.profile, ...profile };
        }
    }

    /**
     * Atualiza o perfil de presença
     */
    updateProfile(updates: Partial<PresenceProfile>): void {
        this.profile = { ...this.profile, ...updates };
        this.logRepo.create('INFO', 'PRESENCE_PROFILE_UPDATED', JSON.stringify(updates), undefined);
    }

    /**
     * Retorna o estado atual de presença
     */
    getCurrentState(): PresenceState {
        const now = this.getNow();
        const hour = now.getHours();
        const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

        let mode: PresenceState['currentMode'] = 'ACTIVE';
        let delayMultiplier = 1.0;
        let canRespond = true;
        let suggestedStatus = 'Online';
        let nextActiveTime: Date | undefined;

        // Período de sono (noite)
        if (hour >= this.profile.sleepHour || hour < this.profile.wakeUpHour) {
            if (this.profile.nightModeEnabled) {
                mode = 'SLEEPING';
                canRespond = false;
                delayMultiplier = 0; // Não responde
                suggestedStatus = 'Dormindo 💤';

                // Calcular próximo horário ativo
                nextActiveTime = new Date(now);
                if (hour >= this.profile.sleepHour) {
                    nextActiveTime.setDate(nextActiveTime.getDate() + 1);
                }
                nextActiveTime.setHours(this.profile.wakeUpHour, 0, 0, 0);
            } else {
                mode = 'NIGHT_OWL';
                delayMultiplier = 2.5; // Bem mais lento de noite
                suggestedStatus = 'Insônia 🦉';
            }
        }
        // Acordando (1h após acordar)
        else if (hour >= this.profile.wakeUpHour && hour < this.profile.wakeUpHour + 1) {
            mode = 'WAKING_UP';
            delayMultiplier = this.profile.slowMorningEnabled ? 2.0 : 1.2;
            suggestedStatus = 'Acabei de acordar ☕';
        }
        // Almoço
        else if (hour >= this.profile.lunchStart && hour < this.profile.lunchEnd) {
            mode = 'LUNCH';
            delayMultiplier = 1.8;
            suggestedStatus = 'Almoçando 🍽️';
        }
        // Fim do dia (2h antes de dormir)
        else if (hour >= this.profile.sleepHour - 2 && hour < this.profile.sleepHour) {
            mode = 'WINDING_DOWN';
            delayMultiplier = 1.5;
            suggestedStatus = 'Quase dormindo 😴';
        }
        // Período ativo normal
        else {
            mode = 'ACTIVE';
            delayMultiplier = 1.0;
            suggestedStatus = 'Online 🟢';
        }

        // Ajuste de fim de semana
        if (isWeekend && this.profile.weekendLazy) {
            delayMultiplier *= 1.5;
            if (mode === 'ACTIVE') {
                suggestedStatus = 'Curtindo o fds 🏖️';
            }
        }

        return {
            isAwake: mode !== 'SLEEPING',
            isActive: mode === 'ACTIVE',
            currentMode: mode,
            responseDelayMultiplier: delayMultiplier,
            suggestedStatus,
            canRespond,
            nextActiveTime
        };
    }

    /**
     * Calcula o delay ajustado pela presença
     */
    adjustDelayForPresence(baseDelayMs: number): number {
        const state = this.getCurrentState();

        if (!state.canRespond) {
            return -1; // -1 significa "não responder agora"
        }

        return Math.floor(baseDelayMs * state.responseDelayMultiplier);
    }

    /**
     * Verifica se deve responder agora
     */
    shouldRespondNow(): { canRespond: boolean; reason?: string; resumeAt?: Date } {
        const state = this.getCurrentState();

        if (!state.canRespond) {
            return {
                canRespond: false,
                reason: `Sistema em modo ${state.currentMode}`,
                resumeAt: state.nextActiveTime
            };
        }

        return { canRespond: true };
    }

    /**
     * Gera uma mensagem de "estou ocupado" contextual
     */
    getBusyMessage(): string {
        const state = this.getCurrentState();

        const busyMessages: Record<PresenceState['currentMode'], string[]> = {
            SLEEPING: [
                'zzz... dormindo',
                'volto amanhã bb',
                'sonhando contigo 💤'
            ],
            WAKING_UP: [
                'to acordando ainda',
                'calma, nem tomei café',
                'bom dia, me dá 5 min'
            ],
            LUNCH: [
                'almoçando, já volto',
                'comendo rapidinho',
                'pausa pro rango 🍽️'
            ],
            WINDING_DOWN: [
                'quase dormindo já',
                'to com sono, amanhã a gente conversa?',
                'indo pra cama 😴'
            ],
            NIGHT_OWL: [
                'insônia atacou',
                'não consigo dormir',
                'olha eu aqui ainda 🦉'
            ],
            ACTIVE: [
                'opa, to aqui',
                'oi bb',
                'fala aí'
            ]
        };

        const messages = busyMessages[state.currentMode];
        return messages[Math.floor(Math.random() * messages.length)];
    }

    /**
     * Retorna horário atual ajustado para timezone
     */
    private getNow(): Date {
        // Para simplicidade, usando horário local do servidor
        // Em produção, usar biblioteca como date-fns-tz
        return new Date();
    }

    /**
     * Retorna o perfil atual
     */
    getProfile(): PresenceProfile {
        return { ...this.profile };
    }

    /**
     * Estatísticas de presença
     */
    getPresenceStats(): {
        hoursActiveToday: number;
        currentMode: string;
        nextModeChange: Date;
    } {
        const now = this.getNow();
        const hour = now.getHours();
        const state = this.getCurrentState();

        // Calcular horas ativas hoje
        let activeStart = this.profile.wakeUpHour;
        let activeEnd = Math.min(hour, this.profile.sleepHour);

        // Subtrair almoço se já passou
        let lunchDeduction = 0;
        if (hour > this.profile.lunchEnd) {
            lunchDeduction = this.profile.lunchEnd - this.profile.lunchStart;
        } else if (hour > this.profile.lunchStart) {
            lunchDeduction = hour - this.profile.lunchStart;
        }

        const hoursActiveToday = Math.max(0, activeEnd - activeStart - lunchDeduction);

        // Calcular próxima mudança de modo
        let nextChange = new Date(now);
        if (state.currentMode === 'ACTIVE') {
            if (hour < this.profile.lunchStart) {
                nextChange.setHours(this.profile.lunchStart, 0, 0, 0);
            } else if (hour < this.profile.sleepHour - 2) {
                nextChange.setHours(this.profile.sleepHour - 2, 0, 0, 0);
            } else {
                nextChange.setHours(this.profile.sleepHour, 0, 0, 0);
            }
        } else if (state.currentMode === 'SLEEPING') {
            nextChange = state.nextActiveTime || new Date(now.getTime() + 8 * 60 * 60 * 1000);
        } else {
            // Assume 1-2 hours for transitional states
            nextChange = new Date(now.getTime() + 60 * 60 * 1000);
        }

        return {
            hoursActiveToday,
            currentMode: state.currentMode,
            nextModeChange: nextChange
        };
    }
}
