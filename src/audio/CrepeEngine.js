// src/audio/CrepeEngine.js
import { sendAudioToAPI } from "../apiClient";

export class CrepeEngine {
  constructor() {
    this.running = false;
    this.prevPitch = null;
    this.smooth = null;
    this.buffer = [];
  }

  async start({ onPitch, onResult }) {
    if (!window.ml5) throw new Error("ml5 not loaded");

    this.audioContext = new AudioContext();
    await this.audioContext.resume();
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    this.mediaRecorder = new MediaRecorder(this.stream);
    this.audioChunks = [];
    this.mediaRecorder.ondataavailable = e => this.audioChunks.push(e.data);
    this.mediaRecorder.start();

    this.detector = await window.ml5.pitchDetection(
      "/model/pitch-detection/crepe/",
      this.audioContext,
      this.stream,
      () => console.log("CREPE loaded")
    );

    this.running = true;
    this.loop(onPitch);
    this.onResult = onResult;
  }

  loop(onPitch) {
    if (!this.running) return;

    this.detector.getPitch((err, freq) => {
      if (!err && freq) {
        const smoothed = this._smooth(freq);
        const confidence = this._confidence(smoothed);
        this.buffer.push({ pitch: smoothed, confidence });
        onPitch(smoothed, confidence);
      }
      setTimeout(() => this.loop(onPitch), 80);
    });
  }

  async stop() {
    this.running = false;
    this.stream.getTracks().forEach(t => t.stop());
    this.mediaRecorder.stop();

    const blob = await new Promise(res => {
      this.mediaRecorder.onstop = () =>
        res(new Blob(this.audioChunks, { type: "audio/webm" }));
    });

    const base64 = await this._blobToBase64(blob);
    const result = await sendAudioToAPI(base64);

    this.onResult?.(result);

    this.prevPitch = null;
    this.smooth = null;
    this.buffer = [];
  }

  _smooth(f) {
    if (!this.smooth) this.smooth = f;
    this.smooth = this.smooth * 0.85 + f * 0.15;
    return this.smooth;
  }

  _confidence(f) {
    let c = 1;
    if (this.prevPitch) {
      const diff = Math.abs(f - this.prevPitch) / this.prevPitch;
      c = Math.max(0, 1 - diff * 5);
    }
    this.prevPitch = f;
    return Math.min(1, 0.3 + c * 0.7);
  }

  _blobToBase64(blob) {
    return new Promise(r => {
      const reader = new FileReader();
      reader.onloadend = () => r(reader.result.split(",")[1]);
      reader.readAsDataURL(blob);
    });
  }
}
