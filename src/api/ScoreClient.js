// src/api/ScoreClient.js
import { sendAudioToAPI } from "./apiClient";

export class ScoreClient {
  constructor() {
    this.currentController = null;
    this.requestId = 0;
  }

  async submit(payload) {
    this.cancel();

    const id = ++this.requestId;
    const controller = new AbortController();
    this.currentController = controller;

    try {
      const result = await sendAudioToAPI(payload, controller.signal);
      if (id !== this.requestId) return null; // 古い結果は破棄
      return result;
    } finally {
      if (this.currentController === controller) {
        this.currentController = null;
      }
    }
  }

  cancel() {
    if (this.currentController) {
      this.currentController.abort();
      this.currentController = null;
    }
  }
}
