// VocaScanTuner.jsx
import React, { useState, useRef, useEffect, useCallback } from "react";
import { CrepeEngine } from "./audio/CrepeEngine";
import PitchMeter from "./PitchMeter";
import { sendAudioToAPI } from "./apiClient";

// note ↔ freq 変換
function freqToNote(freq) {
  if (!freq || freq <= 0) return "--";
  const noteNames = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
  const midi = Math.round(12 * Math.log2(freq/440)+69);
  const name = noteNames[midi % 12];
  const octave = Math.floor(midi/12)-1;
  return `${name}${octave}`;
}

function noteToFreq(note) {
  if (!note || note==="--") return null;
  const noteMap={C:0,"C#":1,D:2,"D#":3,E:4,F:5,"F#":6,G:7,"G#":8,A:9,"A#":10,B:11};
  const match=note.match(/^([A-G]#?)(-?\d+)$/);
  if(!match) return null;
  const [,name,octave]=match;
  const midi=(parseInt(octave)+1)*12+noteMap[name];
  return 440*Math.pow(2,(midi-69)/12);
}

export default function VocaScanTuner() {
  const engineRef = useRef(null);
  const prevPitchRef = useRef(null);
  const smoothRef = useRef(null);
  const confidenceRef = useRef(0);
  const rafIdRef = useRef(null);

  const [isRunning, setIsRunning] = useState(false);
  const [pitch, setPitch] = useState(null);
  const [note, setNote] = useState("--");
  const [confidence, setConfidence] = useState(0);
  const [apiResult, setApiResult] = useState(null);

  // stop を useCallback で定義
  const stop = useCallback(async () => {
    setIsRunning(false);
    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    engineRef.current?.stop();
    prevPitchRef.current = null;
    smoothRef.current = null;
    confidenceRef.current = 0;

    // 録音データがある場合 API に送信
    if (engineRef.current?.getAudioBuffer) {
      const audioBuffer = engineRef.current.getAudioBuffer();
      if (audioBuffer) {
        try {
          const result = await sendAudioToAPI(audioBuffer);
          setApiResult(result);
        } catch (e) {
          console.error("API 通信エラー:", e);
        }
      }
    }
  }, []);

  // アンマウント時に stop
  useEffect(() => {
    if (!window.crepeEngine) window.crepeEngine = new CrepeEngine();
    engineRef.current = window.crepeEngine;
    return () => stop();
  }, [stop]);

  // ピッチ測定ループ
  const loop = (onPitch) => {
    if (!engineRef.current?.running) return;
    engineRef.current.getPitch((freq) => {
      if (!freq || freq <= 0) {
        confidenceRef.current = 0;
      } else {
        // スムージング
        if (!smoothRef.current) smoothRef.current = freq;
        smoothRef.current = smoothRef.current*0.85 + freq*0.15;
        const smoothed = smoothRef.current;

        // 連続性
        let continuity = 1;
        if(prevPitchRef.current){
          const diff = Math.abs(smoothed-prevPitchRef.current)/prevPitchRef.current;
          continuity = Math.max(0,1-diff*5);
        }
        prevPitchRef.current = smoothed;
        confidenceRef.current = Math.min(1,0.3+continuity*0.7);

        setPitch(smoothed);
        setNote(freqToNote(smoothed));
        setConfidence(confidenceRef.current);
      }
      rafIdRef.current = requestAnimationFrame(() => loop(onPitch));
    });
  };

  const start = async () => {
    if (!engineRef.current) return;
    await engineRef.current.start();
    setIsRunning(true);
    loop();
  };

  const targetFreq = noteToFreq(note);

  return (
    <div style={styles.container}>
      <h2>VocaScan Tuner</h2>

      <div style={styles.panel}>
        <div style={styles.value}>{note}</div>
        <div style={styles.sub}>
          Pitch: {pitch ? pitch.toFixed(2) : "--"} Hz
          安定度: {(confidence*100).toFixed(0)}%
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

      {apiResult && (
        <div style={styles.apiResult}>
          <pre>{JSON.stringify(apiResult, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {padding:"20px", textAlign:"center", fontFamily:"sans-serif"},
  panel: {margin:"20px auto", padding:"20px", width:"280px", borderRadius:"12px", background:"#f0f4ff", boxShadow:"0 4px 10px rgba(0,0,0,0.1)"},
  value: {fontSize:"48px", fontWeight:"bold"},
  sub: {marginTop:"6px", fontSize:"13px", color:"#555"},
  controls: {marginTop:"20px"},
  start: {padding:"10px 24px", fontSize:"16px", borderRadius:"8px", border:"none", background:"#4caf50", color:"#fff", cursor:"pointer"},
  stop: {padding:"10px 24px", fontSize:"16px", borderRadius:"8px", border:"none", background:"#f44336", color:"#fff", cursor:"pointer"},
  apiResult: {marginTop:"20px", textAlign:"left", maxWidth:"600px", margin:"20px auto", padding:"10px", background:"#e8f0ff", borderRadius:"8px"}
};
