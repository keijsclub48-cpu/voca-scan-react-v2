// src/VocaScanTuner.jsx
import React, { useEffect, useRef, useState } from "react";
import { CrepeEngine } from "./audio/CrepeEngine";
import PitchMeter from "./PitchMeter";

// --- utility ---
function freqToNote(freq) {
  if (!freq || freq <= 0) return "--";
  const noteNames = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
  const midi = Math.round(12 * Math.log2(freq / 440) + 69);
  const name = noteNames[midi % 12];
  const octave = Math.floor(midi / 12) - 1;
  return `${name}${octave}`;
}

function noteToFreq(note) {
  if (!note || note === "--") return null;
  const noteMap = { C:0,"C#":1,D:2,"D#":3,E:4,F:5,"F#":6,G:7,"G#":8,A:9,"A#":10,B:11 };
  const m = note.match(/^([A-G]#?)(-?\d+)$/);
  if (!m) return null;
  const [, name, octave] = m;
  const midi = (parseInt(octave) + 1) * 12 + noteMap[name];
  return 440 * Math.pow(2, (midi - 69) / 12);
}

// --- component ---
export default function VocaScanTuner() {
  const engineRef = useRef(null);

  const [isRunning, setIsRunning] = useState(false);
  const [pitch, setPitch] = useState(null);
  const [note, setNote] = useState("--");
  const [confidence, setConfidence] = useState(0);
  const [diagnosis, setDiagnosis] = useState(null);

  useEffect(() => {
    engineRef.current = new CrepeEngine();
    return () => {
      engineRef.current?.stop();
      engineRef.current = null;
    };
  }, []);

  const start = async () => {
    if (!engineRef.current || isRunning) return;
    setDiagnosis(null);

    await engineRef.current.start({
      onPitch: (freq, conf) => {
        setPitch(freq);
        setNote(freqToNote(freq));
        setConfidence(conf ?? 0);
      },
      onResult: (res) => {
        setDiagnosis(res);
      }
    });

    setIsRunning(true);
  };

  const stop = () => {
    if (!engineRef.current || !isRunning) return;
    engineRef.current.stop();
    setIsRunning(false);
    setPitch(null);
    setNote("--");
    setConfidence(0);
  };

  const targetFreq = noteToFreq(note);

  return (
    <div style={styles.container}>
      <h2>VocaScan Tuner v2</h2>

      <div style={styles.panel}>
        <div style={styles.value}>{note}</div>
        <div style={styles.sub}>
          Pitch: {pitch ? pitch.toFixed(2) : "--"} Hz<br/>
          安定度: {(confidence * 100).toFixed(0)}%
        </div>
      </div>

      <PitchMeter
        pitch={pitch}
        targetFreq={targetFreq}
        confidence={confidence}
      />

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

// --- styles ---
const styles = {
  container: {
    padding: "20px",
    textAlign: "center",
    fontFamily: "sans-serif"
  },
  panel: {
    margin: "20px auto",
    padding: "20px",
    width: "260px",
    borderRadius: "12px",
    background: "#f0f4ff",
    boxShadow: "0 4px 10px rgba(0,0,0,0.1)"
  },
  value: {
    fontSize: "48px",
    fontWeight: "bold"
  },
  sub: {
    marginTop: "6px",
    fontSize: "14px",
    color: "#555"
  },
  controls: {
    marginTop: "20px"
  },
  start: {
    padding: "10px 24px",
    fontSize: "16px",
    borderRadius: "8px",
    border: "none",
    background: "#4caf50",
    color: "#fff",
    cursor: "pointer"
  },
  stop: {
    padding: "10px 24px",
    fontSize: "16px",
    borderRadius: "8px",
    border: "none",
    background: "#f44336",
    color: "#fff",
    cursor: "pointer"
  },
  diagnosis: {
    marginTop: "20px",
    padding: "10px",
    background: "#fff0f0",
    borderRadius: "8px",
    maxWidth: "400px",
    margin: "20px auto",
    textAlign: "left",
    fontSize: "12px"
  }
};
