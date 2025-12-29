// src/hooks/usePitchEngine.js
import { useState, useRef } from "react";
import { AudioInputManager } from "../audio/AudioInputManager";
import { PitchAnalyzer } from "../audio/PitchAnalyzer";
import { ScoreClient } from "../api/ScoreClient";

export function usePitchEngine() {
  const audioRef = useRef(null);
  const analyzerRef = useRef(null);
  const apiRef = useRef(null);

  const [isRunning, setIsRunning] = useState(false);
  const [pitch, setPitch] = useState(null);
  const [note, setNote] = useState("--");
  const [confidence, setConfidence] = useState(0);
  const [diagnosis, setDiagnosis] = useState(null);

  const start = async () => {
    if (isRunning) return;

    analyzerRef.current = new PitchAnalyzer();
    audioRef.current = new AudioInputManager();
    apiRef.current = new ScoreClient();

    analyzerRef.current.reset();
    setDiagnosis(null);
    setPitch(null);
    setNote("--");
    setConfidence(0);

    await audioRef.current.start(rawFreq => {
      const result = analyzerRef.current.analyze(rawFreq);
      if (!result) return;
      setPitch(result.pitch);
      setNote(result.note);
      setConfidence(result.confidence);
    });

    setIsRunning(true);
  };

  const stop = async () => {
    if (!isRunning) return;

    await audioRef.current.stop();
    setIsRunning(false);

    try {
      const res = await apiRef.current.submit({
        audio: "dummy",
        pitch,
        confidence
      });
      if (res) setDiagnosis(res);
    } catch(e) {
      console.error("API error:", e);
    }

    setPitch(null);
    setNote("--");
    setConfidence(0);
  };

  return { isRunning, pitch, note, confidence, diagnosis, start, stop };
}
