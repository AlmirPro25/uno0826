// Sound utilities for queue notifications

export function playNotificationSound() {
    // Try to play audio file first
    const audio = new Audio('/sounds/notification.mp3');
    audio.play().catch(() => {
        // Fallback to Web Audio API beep
        playBeep();
    });
}

export function playBeep(frequency = 800, duration = 300, volume = 0.5) {
    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;

        const ctx = new AudioContext();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
        gainNode.gain.setValueAtTime(volume, ctx.currentTime);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + duration / 1000);

        // Play a second beep for emphasis
        setTimeout(() => {
            const ctx2 = new AudioContext();
            const osc2 = ctx2.createOscillator();
            const gain2 = ctx2.createGain();
            osc2.connect(gain2);
            gain2.connect(ctx2.destination);
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(frequency * 1.2, ctx2.currentTime);
            gain2.gain.setValueAtTime(volume, ctx2.currentTime);
            osc2.start(ctx2.currentTime);
            osc2.stop(ctx2.currentTime + duration / 1000);
        }, duration + 100);
    } catch (err) {
        console.error('Error playing beep:', err);
    }
}

export function playSuccessSound() {
    playBeep(523, 150, 0.3); // C5
    setTimeout(() => playBeep(659, 150, 0.3), 150); // E5
    setTimeout(() => playBeep(784, 200, 0.3), 300); // G5
}

export function playAlertSound() {
    playBeep(880, 200, 0.5); // A5
    setTimeout(() => playBeep(880, 200, 0.5), 300);
    setTimeout(() => playBeep(880, 400, 0.5), 600);
}

export function speakText(text: string, lang = 'pt-BR', rate = 0.9) {
    if (!('speechSynthesis' in window)) return;
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = rate;
    speechSynthesis.speak(utterance);
}

export function speakTicketCall(ticketNumber: string, counter: string) {
    const text = `Atenção! Senha ${ticketNumber.split('').join(' ')}. Dirija-se ao ${counter}`;
    speakText(text);
}
