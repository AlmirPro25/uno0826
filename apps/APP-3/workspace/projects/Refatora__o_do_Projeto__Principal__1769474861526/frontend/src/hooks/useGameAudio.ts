
import { useEffect, useRef, useCallback } from 'react';
import { useTacticalStore } from '@/stores/tacticalStore';

/**
 * HOOK: USE GAME AUDIO
 * Aesthetic hook to play sounds on state changes.
 * NOTE: Browsers often block autoplay. User interaction helps.
 * Audio files are expected in `/public/sounds/` with specific names.
 */
export const useGameAudio = () => {
  const { data, error, isFabricating, selectedUnitId } = useTacticalStore();
  const lastLogId = useRef<number | undefined>();
  const lastFabricatingState = useRef(false);
  const lastErrorState = useRef(false);
  const lastSelectedUnitId = useRef<string | null>(null);

  // Memoize playSound to prevent re-creation
  const playSound = useCallback((src: string, volume: number = 0.5) => {
    if (document.visibilityState === 'hidden') return; // Don't play sounds if tab is not active

    const audioEl = document.getElementById(`audio-${src.split('/').pop()?.split('.')[0]}`) as HTMLAudioElement;
    if (audioEl) {
      audioEl.volume = volume;
      audioEl.currentTime = 0; // Reset to start
      audioEl.play().catch(e => {
        // console.warn(`AUDIO: Playback of ${src} blocked or failed:`, e);
      });
    } else {
      // console.warn(`AUDIO: Element for ${src} not found.`);
    }
  }, []);

  // Trigger sound on new log message
  useEffect(() => {
    if (data?.logs && data.logs.length > 0) {
        const currentLastLog = data.logs[data.logs.length - 1];
        if (currentLastLog && currentLastLog.id !== lastLogId.current) {
            // A new log has arrived
            switch (currentLastLog.level) {
                case 'CRITICAL':
                case 'ALERT':
                    playSound('/sounds/alert.mp3', 0.8);
                    break;
                case 'SUCCESS':
                    playSound('/sounds/success.mp3', 0.6);
                    break;
                case 'INFO':
                case 'WARN':
                default:
                    playSound('/sounds/blip.mp3', 0.3);
                    break;
            }
            lastLogId.current = currentLastLog.id;
        }
    }
  }, [data?.logs, playSound]);

  // Play alert on error (when error appears for the first time or changes)
  useEffect(() => {
    if (error && !lastErrorState.current) {
      playSound('/sounds/alert.mp3', 0.7);
    }
    lastErrorState.current = !!error;
  }, [error, playSound]);

  // Play blip on unit selection/deselection
  useEffect(() => {
    if (selectedUnitId !== lastSelectedUnitId.current) {
        if (selectedUnitId !== null) {
            playSound('/sounds/blip.mp3', 0.2); // Smaller blip for selection
        }
        lastSelectedUnitId.current = selectedUnitId;
    }
  }, [selectedUnitId, playSound]);

  // Trigger sound on fabrication start/end (optional, could be blip)
  useEffect(() => {
    if (isFabricating && !lastFabricatingState.current) {
      // playSound('/sounds/fabricate_start.mp3'); // Example: specific sound for fabrication
    } else if (!isFabricating && lastFabricatingState.current) {
      // playSound('/sounds/fabricate_end.mp3'); // Example: specific sound for fabrication
    }
    lastFabricatingState.current = isFabricating;
  }, [isFabricating, playSound]);
};
