// src/CrepeEngine.js
export class CrepeEngine {
  constructor() {
    this.running = false;
  }

  async start(onPitch) {
    if (!window.ml5) {
      throw new Error('ml5 not loaded — load ml5.min.js before using CrepeEngine');
    }

    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    await this.audioContext.resume();

    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    this.detector = await window.ml5.pitchDetection(
      '/model/pitch-detection/crepe/',
      this.audioContext,
      this.stream,
      () => console.log('CREPE loaded')
    );

    this.running = true;
    this.loop(onPitch);
  }

  loop(onPitch) {
    if (!this.running || !this.detector) return;

    this.detector.getPitch((err, freq) => {
      if (!err && freq) onPitch(freq);

      setTimeout(() => this.loop(onPitch), 80);
    });
  }

  stop() {
    this.running = false;
    if (this.stream) this.stream.getTracks().forEach(t => t.stop());
  }
}