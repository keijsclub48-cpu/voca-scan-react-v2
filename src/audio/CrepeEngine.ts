import { sendAudioToAPI } from "../apiClient";
import { DiagnosisResult } from "../types";

export class CrepeEngine {
  private running = false;
  private audioContext: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private detector: any = null;

  async start(onRawFrequency: (freq: number) => void): Promise<void> {
    if (this.running) return;

    const ml5 = (window as any).ml5;
    if (!ml5) throw new Error("ml5 not loaded");

    this.audioContext = new AudioContext();
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    this.mediaRecorder = new MediaRecorder(this.stream, { mimeType: "audio/webm" });
    this.audioChunks = [];
    this.mediaRecorder.ondataavailable = e => {
      if (e.data.size > 0) this.audioChunks.push(e.data);
    };
    this.mediaRecorder.start(1000); // 1秒ごとにchunk化

    this.detector = await ml5.pitchDetection(
      "/model/pitch-detection/crepe/",
      this.audioContext,
      this.stream,
      () => console.log("CREPE loaded")
    );

    this.running = true;
    this.loop(onRawFrequency);
  }

  private loop(callback: (freq: number) => void) {
    if (!this.running || !this.detector) return;

    this.detector.getPitch((err: any, freq: number) => {
      if (this.running && !err && freq) callback(freq);
      requestAnimationFrame(() => this.loop(callback));
    });
  }

  async stop(): Promise<DiagnosisResult> {
    this.running = false;

    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) return reject(new Error("No recorder"));

      this.mediaRecorder.onstop = () => {
        // UI解放を優先
        setTimeout(async () => {
          try {
            const blob = new Blob(this.audioChunks, { type: "audio/webm" });
            const base64 = await this.blobToBase64(blob);
            const result = await sendAudioToAPI(base64);
            resolve(result);
          } catch (e) {
            reject(e);
          } finally {
            this.cleanup();
          }
        }, 0);
      };

      this.mediaRecorder.stop();
    });
  }

  private cleanup() {
    this.stream?.getTracks().forEach(t => t.stop());
    this.audioContext?.close();
    this.mediaRecorder = null;
    this.detector = null;
    this.audioChunks = [];
  }

private blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Failed to convert blob to base64"));
        return;
      }

      const base64 = result.split(",")[1];
      if (!base64) {
        reject(new Error("Invalid base64 format"));
        return;
      }

      resolve(base64);
    };

    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

}
