// src/audio/PitchAnalyzer.js
export class PitchAnalyzer {
  constructor() {
    this.prevPitch = null;
    this.smooth = null;
  }

  static freqToNote(freq) {
    if (!freq || freq <= 0) return "--";
    const noteNames = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
    const midi = Math.round(12 * Math.log2(freq / 440) + 69);
    const name = noteNames[midi % 12];
    const octave = Math.floor(midi / 12) - 1;
    return `${name}${octave}`;
  }

  static noteToFreq(note) {
    if (!note || note === "--") return null;
    const map = {C:0,"C#":1,D:2,"D#":3,E:4,F:5,"F#":6,G:7,"G#":8,A:9,"A#":10,B:11};
    const m = note.match(/^([A-G]#?)(-?\d+)$/);
    if (!m) return null;
    const [, n, o] = m;
    const midi = (parseInt(o) + 1) * 12 + map[n];
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  analyze(rawFreq) {
    if (!rawFreq) return null;

    if (!this.smooth) this.smooth = rawFreq;
    this.smooth = this.smooth * 0.85 + rawFreq * 0.15;

    const s = this.smooth;

    // confidence 計算
    let confidence = 1;
    if (this.prevPitch) {
      confidence = Math.max(0, 1 - Math.abs(s - this.prevPitch)/this.prevPitch*5);
    }
    this.prevPitch = s;

    const conf = Math.min(1, 0.3 + confidence * 0.7);
    const note = PitchAnalyzer.freqToNote(s);

    return { pitch: s, note, confidence: conf };
  }

  reset() {
    this.prevPitch = null;
    this.smooth = null;
  }
}
