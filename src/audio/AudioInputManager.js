// src/audio/AudioInputManager.js
import { CrepeEngine } from "./CrepeEngine";

export class AudioInputManager {
  constructor() {
    this.engine = new CrepeEngine();
    this.onPitchCallback = null;
  }

  async start(onPitch) {
    this.onPitchCallback = onPitch;
    await this.engine.start(freq => {
      if (this.onPitchCallback) this.onPitchCallback(freq);
    });
  }

  async stop() {
    await this.engine.stop();
  }
}
