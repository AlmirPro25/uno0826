import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useWebSocket } from '@/hooks/useWebSocket';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/shadcn/Dialog';
import { Button } from '@/components/ui/shadcn/Button';
import { Phone, Video } from 'lucide-react';

export const CallNotification = () => {
    // Initialize WebSocket connection via the hook
    const { isConnected } = useWebSocket();
    const [incomingCall, setIncomingCall] = useState<{ appointmentId: number; roomName: string } | null>(null);
    const router = useRouter();

    useEffect(() => {
        const handleMessage = (e: CustomEvent) => {
            const data = e.detail;
            if (data.type === 'incoming_call') {
                setIncomingCall({
                    appointmentId: data.appointmentId,
                    roomName: data.roomName
                });

                // Optional: Play sound
                // const audio = new Audio('/ringtone.mp3');
                // audio.play().catch(console.error);
            }
        };

        window.addEventListener('medisync-ws-message', handleMessage as EventListener);
        return () => window.removeEventListener('medisync-ws-message', handleMessage as EventListener);
    }, []);

    const handleAccept = () => {
        if (incomingCall) {
            router.push(`/video-call/${incomingCall.appointmentId}`);
            setIncomingCall(null);
        }
    };

    const handleDecline = () => {
        setIncomingCall(null);
    };

    return (
        <Dialog open={!!incomingCall} onOpenChange={(open) => !open && setIncomingCall(null)}>
            <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border-border z-[9999]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Video className="w-6 h-6 text-primary animate-pulse" />
                        Chamada de Vídeo Entrando
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Seu médico está iniciando a consulta. Deseja participar agora?
                    </DialogDescription>
                </DialogHeader>
                <div className="flex justify-center py-8">
                    <div className="relative">
                        <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping duration-1000"></div>
                        <div className="bg-green-100 dark:bg-green-900/30 p-6 rounded-full relative z-10 border-2 border-green-500">
                            <Phone className="w-12 h-12 text-green-600 dark:text-green-400" />
                        </div>
                    </div>
                </div>
                <DialogFooter className="flex gap-2 sm:justify-center w-full">
                    <Button variant="outline" onClick={handleDecline} className="flex-1 text-destructive hover:bg-destructive/10 border-destructive/20">
                        Recusar
                    </Button>
                    <Button onClick={handleAccept} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                        Aceitar e Entrar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
