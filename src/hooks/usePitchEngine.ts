import { useState, useRef, useCallback, useEffect } from "react";
import { CrepeEngine } from "../audio/CrepeEngine";
import { PitchAnalyzer } from "../audio/PitchAnalyzer";
import { PitchData, DiagnosisResult } from "../types";

export type EngineStatus = "idle" | "running" | "loading" | "success" | "error";

export function usePitchEngine() {
  const engineRef = useRef<CrepeEngine>(new CrepeEngine());
  const analyzerRef = useRef<PitchAnalyzer>(new PitchAnalyzer());

  const [isRunning, setIsRunning] = useState(false);
  const [status, setStatus] = useState<EngineStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const [pitchData, setPitchData] = useState<PitchData>({
    pitch: null,
    note: "--",
    confidence: 0,
  });

  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null);

  const start = useCallback(async () => {
    if (isRunning) return;

    setDiagnosis(null);
    setStatus("running");
    setError(null);
    analyzerRef.current.reset();

    try {
      await engineRef.current.start((rawFreq: number) => {
        const result = analyzerRef.current.analyze(rawFreq);
        if (result) setPitchData(result);
      });
      setIsRunning(true);
    } catch (err) {
      console.error("start error:", err);
      setStatus("error");
      setError("マイクの起動に失敗しました");
    }
  }, [isRunning]);

  const stop = useCallback(async () => {
    if (!isRunning) return;

    setIsRunning(false);
    setStatus("loading");
    setError(null);

    try {
      const result = await engineRef.current.stop();
      setDiagnosis(result);
      setStatus("success");
    } catch (err) {
      console.error("stop error:", err);
      setStatus("error");
      setError("解析に失敗しました");
    }
  }, [isRunning]);

  useEffect(() => {
    return () => {
      engineRef.current.stop().catch(() => {});
    };
  }, []);

  return {
    isRunning,
    status,
    error,
    ...pitchData,
    diagnosis,
    start,
    stop,
  };
}
