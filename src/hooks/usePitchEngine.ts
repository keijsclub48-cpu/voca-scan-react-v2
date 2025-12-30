import { useState, useRef, useCallback, useEffect } from "react";
import { CrepeEngine } from "../audio/CrepeEngine";
import { PitchAnalyzer } from "../audio/PitchAnalyzer";
import { PitchData, DiagnosisResult } from "../types";

export function usePitchEngine() {
  const engineRef = useRef<CrepeEngine>(new CrepeEngine());
  const analyzerRef = useRef<PitchAnalyzer>(new PitchAnalyzer());

  const [isRunning, setIsRunning] = useState(false);
  const [pitchData, setPitchData] = useState<PitchData>({
    pitch: null,
    note: "--",
    confidence: 0,
  });
  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null);

  const start = useCallback(async () => {
    if (isRunning) return;
    setDiagnosis(null);
    analyzerRef.current.reset();

    try {
      await engineRef.current.start((rawFreq: number) => {
        const result = analyzerRef.current.analyze(rawFreq);
        if (result) setPitchData(result);
      });
      setIsRunning(true);
    } catch (err) {
      console.error(err);
    }
  }, [isRunning]);

  // src/hooks/usePitchEngine.ts の stop 関数部分
const stop = useCallback(async () => {
  if (!isRunning) return;
  setIsRunning(false);

  try {
    console.log("1. Stopping engine...");
    const result = await engineRef.current.stop();
    
    console.log("2. Result received from engine:", result);
    
    // もし result が undefined でも、強制的にダミーを入れて表示を確認する（デバッグ用）
    const finalData = result || { pitch: 440, stability: 0.8, score: 85 };
    
    console.log("3. Setting diagnosis state with:", finalData);
    setDiagnosis(finalData); // ★ これでステートが更新され、表示が切り替わるはずです
    
  } catch (e) {
    console.error("Hook: Error in stop process", e);
  }
}, [isRunning]);

  // コンポーネントが消える時に強制停止（二重ロード対策）
  useEffect(() => {
    return () => {
      engineRef.current.stop().catch(() => { });
    };
  }, []);

  return { isRunning, ...pitchData, diagnosis, start, stop };
}