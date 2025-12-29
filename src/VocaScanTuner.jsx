import React from "react";
import { usePitchEngine } from "./hooks/usePitchEngine";
import PitchMeter from "./PitchMeter";

export default function VocaScanTuner() {
  const { isRunning, pitch, note, confidence, diagnosis, start, stop } = usePitchEngine();

  const targetFreq = note !== "--" ? freqFromNote(note) : null;

  return (
    <div style={styles.container}>
      <h2>VocaScan Tuner</h2>

      <div style={styles.panel}>
        <div style={styles.value}>{note}</div>
        <div style={styles.sub}>
          Pitch: {pitch ? pitch.toFixed(2) : "--"} Hz<br />
          安定度: {(confidence * 100).toFixed(0)}%
        </div>
      </div>

      <PitchMeter pitch={pitch} targetFreq={targetFreq} confidence={confidence} />

      <div style={styles.controls}>
        {!isRunning ? (
          <button style={styles.start} onClick={start}>Start</button>
        ) : (
          <button style={styles.stop} onClick={stop}>Stop</button>
        )}
      </div>

      {diagnosis && (
        <div style={styles.diagnosis}>
          <pre>{JSON.stringify(diagnosis, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

// note → freq 変換（PitchAnalyzer と同じロジック）
function freqFromNote(note) {
  if (!note || note === "--") return null;
  const map = { C: 0, "C#": 1, D: 2, "D#": 3, E: 4, F: 5, "F#": 6, G: 7, "G#": 8, A: 9, "A#": 10, B: 11 };
  const m = note.match(/^([A-G]#?)(-?\d+)$/);
  if (!m) return null;
  const [, n, o] = m;
  const midi = (parseInt(o) + 1) * 12 + map[n];
  return 440 * Math.pow(2, (midi - 69) / 12);
}

const styles = {
  container: { padding: 20, textAlign: "center", fontFamily: "sans-serif" },
  panel: { margin: "20px auto", padding: 20, width: 280, borderRadius: 12, background: "#f0f4ff", boxShadow: "0 4px 10px rgba(0,0,0,0.1)" },
  value: { fontSize: 48, fontWeight: "bold" },
  sub: { marginTop: 6, fontSize: 13, color: "#555" },
  controls: { marginTop: 20 },
  start: { padding: "10px 24px", fontSize: 16, borderRadius: 8, border: "none", background: "#4caf50", color: "#fff" },
  stop: { padding: "10px 24px", fontSize: 16, borderRadius: 8, border: "none", background: "#f44336", color: "#fff" },
  diagnosis: { margin: "20px auto", padding: 10, background: "#fff0f0", borderRadius: 8, maxWidth: 400 }
};
