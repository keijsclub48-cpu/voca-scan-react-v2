// src/audio/CrepeEngine.js

export const EngineState = {
  idle: 'idle',
  starting: 'starting',
  running: 'running',
  stopping: 'stopping'
};

export class CrepeEngine {
  constructor() {
    this.state = EngineState.idle;
    this.running = false;
    this.abortController = null;
  }

  async start(onPitch) {
    if (this.state !== EngineState.idle) {
      console.warn('CrepeEngine.start ignored, state=', this.state);
      return;
    }

    this.state = EngineState.starting;

    this.abortController = new AbortController();
    const { signal } = this.abortController;

    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    await this.audioContext.resume();

    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    this.detector = await window.ml5.pitchDetection(
      '/model/pitch-detection/crepe/',
      this.audioContext,
      this.stream,
      () => console.log('CREPE loaded')
    );

    if (signal.aborted) {
      await this._cleanup();
      return;
    }

    this.running = true;
    this.state = EngineState.running;
    this._loop(onPitch, signal);
  }

  async stop() {
    if (this.state !== EngineState.running && this.state !== EngineState.starting) {
      return;
    }

    this.state = EngineState.stopping;
    this.running = false;

    if (this.abortController) {
      this.abortController.abort();
    }

    await this._cleanup();
    this.state = EngineState.idle;
  }

  async _cleanup() {
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }

    if (this.audioContext) {
      await this.audioContext.close();
      this.audioContext = null;
    }

    this.detector = null;
  }

  _loop(onPitch, signal) {
    if (!this.running || signal.aborted) return;

    this.detector.getPitch((err, freq) => {
      if (!signal.aborted && !err && freq) {
        onPitch(freq);
      }

      setTimeout(() => this._loop(onPitch, signal), 80);
    });
  }
}
