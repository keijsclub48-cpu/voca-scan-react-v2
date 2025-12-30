import { sendAudioToAPI } from "../apiClient";
import { DiagnosisResult } from "../types";

export class CrepeEngine {
  private running: boolean = false;
  private audioContext: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private detector: any = null;

  async start(onRawFrequency: (freq: number) => void): Promise<void> {
    if (this.running) return;
    const ml5 = (window as any).ml5;

    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    this.mediaRecorder = new MediaRecorder(this.stream);
    this.audioChunks = [];
    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.audioChunks.push(e.data);
    };
    this.mediaRecorder.start();

    this.detector = await ml5.pitchDetection(
      "/model/pitch-detection/crepe/",
      this.audioContext,
      this.stream,
      () => console.log("CREPE loaded")
    );

    this.running = true;
    this.loop(onRawFrequency);
  }

  private loop(callback: (freq: number) => void): void {
    if (!this.running || !this.detector) return;
    this.detector.getPitch((err: any, freq: number) => {
      if (this.running) {
        if (!err && freq) callback(freq);
        setTimeout(() => this.loop(callback), 80);
      }
    });
  }

  // ★ 修正のキモ：Promiseを確実に resolve まで導く
  async stop(): Promise<DiagnosisResult> {
    this.running = false;
    // デバッグ用：APIを待たずに即座に値を返してみる
  return {
    pitch: 440,
    stability: 0.9,
    score: 85
  };
  
    console.log("CrepeEngine: Stopping...");

    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) return reject("No recorder");

      // 1. 先にイベントハンドラを登録
      this.mediaRecorder.onstop = async () => {
        try {
          console.log("CrepeEngine: onstop triggered");
          const blob = new Blob(this.audioChunks, { type: "audio/webm" });
          const base64 = await this._blobToBase64(blob);

          // ここでテスト用の値を直接入れてみます（apiClientを通さない）
          const dummyResult: DiagnosisResult = {
            pitch: 440,
            stability: 0.9,
            score: 85
          };

          console.log("CrepeEngine: Resolving with:", dummyResult);
          resolve(dummyResult); // ★ ここで値が確定し、呼び出し元へ戻る
        } catch (e) {
          reject(e);
        } finally {
          this.cleanup();
        }
      };

      // 2. 停止実行（これにより onstop が走る）
      this.mediaRecorder.stop();
    });
  }

  private cleanup() {
    this.stream?.getTracks().forEach(t => t.stop());
    if (this.audioContext?.state !== "closed") this.audioContext?.close();
  }

  private _blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        if (result) {
          // 結果が undefined にならないように空文字でフォールバック
          resolve(result.split(",")[1] || "");
        } else {
          reject(new Error("Base64 conversion failed"));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}