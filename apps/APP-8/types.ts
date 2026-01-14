export enum AppMode {
  Live = 'LIVE',
  Thinking = 'THINKING',
  Idle = 'IDLE'
}

export interface TranscriptionEntry {
  id: number;
  speaker: 'user' | 'model' | 'analysis' | 'system';
  text: string;
}