// VocaScanTuner.jsx
import React, { useEffect, useRef, useState } from "react";
import { CrepeEngine } from "./audio/CrepeEngine";
import { sendAudioToAPI } from "./apiClient";

function freqToNote(freq) {
  if (!freq || freq <= 0) return "--";
  const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const midi = Math.round(12 * Math.log2(freq / 440) + 69);
  const name = noteNames[midi % 12];
  const octave = Math.floor(midi / 12) - 1;
  return `${name}${octave}`;
}

function noteToFreq(note) {
  if (!note || note === "--") return null;
  const noteMap = { C:0, "C#":1, D:2, "D#":3, E:4, F:5, "F#":6, G:7, "G#":8, A:9, "A#":10, B:11 };
  const match = note.match(/^([A-G]#?)(-?\d+)$/);
  if (!match) return null;
  const [, name, octave] = match;
  const midi = (parseInt(octave) + 1) * 12 + noteMap[name];
  return 440 * Math.pow(2, (midi - 69) / 12);
}

// --- PitchMeter Component ---
function PitchMeter({ pitch, targetFreq, confidence }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    if (!pitch || !targetFreq) return;

    // 中央を基準にバー伸縮
    const maxOffset = width / 2 - 10;
    const diff = pitch - targetFreq;
    const barLength = Math.min(Math.abs(diff) * 5, maxOffset); // scale factor 5
    const barColor = `rgba(76,175,80,${confidence})`;

    ctx.fillStyle = barColor;
    if (diff >= 0) {
      // 右に伸びる
      ctx.fillRect(width / 2, height / 4, barLength, height / 2);
    } else {
      // 左に伸びる
      ctx.fillRect(width / 2 - barLength, height / 4, barLength, height / 2);
    }

    // 中央ライン
    ctx.strokeStyle = "#555";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width / 2, height);
    ctx.stroke();
  }, [pitch, targetFreq, confidence]);

  return <canvas ref={canvasRef} width={300} height={50} style={{ display: "block", margin: "10px auto" }} />;
}

// --- Main Component ---
export default function VocaScanTuner() {
  const engineRef = useRef(null);
  const prevPitchRef = useRef(null);
  const smoothRef = useRef(null);
  const confidenceRef = useRef(0);

  const [isRunning, setIsRunning] = useState(false);
  const [pitch, setPitch] = useState(null);
  const [note, setNote] = useState("--");
  const [confidence, setConfidence] = useState(0);
  const [diagnosis, setDiagnosis] = useState(null);

  useEffect(() => {
    engineRef.current = new CrepeEngine();
    return () => engineRef.current?.stop();
  }, []);

  const start = async () => {
    if (!engineRef.current) return;
    setDiagnosis(null);

    await engineRef.current.start((freq) => {
      if (!freq || freq <= 0) {
        confidenceRef.current = 0;
        return;
      }

      if (!smoothRef.current) smoothRef.current = freq;
      smoothRef.current = smoothRef.current * 0.85 + freq * 0.15;
      const smoothed = smoothRef.current;

      let continuity = 1;
      if (prevPitchRef.current) {
        const diff = Math.abs(smoothed - prevPitchRef.current) / prevPitchRef.current;
        continuity = Math.max(0, 1 - diff * 5);
      }
      prevPitchRef.current = smoothed;

      confidenceRef.current = Math.min(1, 0.3 + continuity * 0.7);

      setPitch(smoothed);
      setNote(freqToNote(smoothed));
      setConfidence(confidenceRef.current);
    });

    setIsRunning(true);
  };

  const stop = async () => {
    engineRef.current?.stop();
    setIsRunning(false);

    // API 送信用に pitch バッファを作成する場合はここでまとめて送信
    try {
      const response = await sendAudioToAPI({ pitch, confidence });
      setDiagnosis(response);
    } catch (e) {
      console.error("API通信エラー:", e);
      setDiagnosis({ error: e.message });
    }

    setPitch(null);
    setNote("--");
    setConfidence(0);
    prevPitchRef.current = null;
    smoothRef.current = null;
    confidenceRef.current = 0;
  };

  const targetFreq = noteToFreq(note);

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
          <button onClick={start} style={styles.start}>Start</button>
        ) : (
          <button onClick={stop} style={styles.stop}>Stop</button>
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

const styles = {
  container: { padding: "20px", textAlign: "center", fontFamily: "sans-serif" },
  panel: { margin: "20px auto", padding: "20px", width: "280px", borderRadius: "12px", background: "#f0f4ff", boxShadow: "0 4px 10px rgba(0,0,0,0.1)" },
  value: { fontSize: "48px", fontWeight: "bold" },
  sub: { marginTop: "6px", fontSize: "13px", color: "#555" },
  controls: { marginTop: "20px" },
  start: { padding: "10px 24px", fontSize: "16px", borderRadius: "8px", border: "none", background: "#4caf50", color: "#fff", cursor: "pointer" },
  stop: { padding: "10px 24px", fontSize: "16px", borderRadius: "8px", border: "none", background: "#f44336", color: "#fff", cursor: "pointer" },
  diagnosis: { marginTop: "20px", padding: "10px", background: "#fff0f0", borderRadius: "8px", maxWidth: "400px", margin: "20px auto" }
};
