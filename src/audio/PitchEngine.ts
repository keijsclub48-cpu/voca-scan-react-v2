export interface PitchFrame {
  f0: number;
  confidence: number;
  timestamp: number;
}

export interface PitchEngine {
  start(): Promise<void>;
  stop(): void;
  onFrame(cb: (frame: PitchFrame) => void): void;
  isRunning(): boolean;
}
