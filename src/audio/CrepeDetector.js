// src/audio/CrepeDetector.js
export class CrepeDetector {
  constructor(modelPath = "/model/pitch-detection/crepe/") {
    this.modelPath = modelPath;
    this.detector = null;
  }

  async init(context, stream) {
    if (!window.ml5) throw new Error("ml5 not loaded");

    this.detector = await window.ml5.pitchDetection(
      this.modelPath,
      context,
      stream,
      () => console.log("CREPE loaded")
    );
  }

  async getPitch() {
    if (!this.detector) return null;

    return new Promise((resolve) => {
      this.detector.getPitch((err, freq) => {
        if (err || !freq) resolve(null);
        else resolve(freq);
      });
    });
  }

  destroy() {
    this.detector = null;
  }
}
