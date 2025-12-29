import React, { useEffect, useRef, useState } from "react";
import { CrepeEngine } from "./audio/CrepeEngine";
import { ScoreClient } from "./api/ScoreClient";
import PitchMeter from "./PitchMeter";

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
  const map = {C:0,"C#":1,D:2,"D#":3,E:4,F:5,"F#":6,G:7,"G#":8,A:9,"A#":10,B:11};
  const m = note.match(/^([A-G]#?)(-?\d+)$/);
  if (!m) return null;
  const [, n, o] = m;
  const midi = (parseInt(o) + 1) * 12 + map[n];
  return 440 * Math.pow(2, (midi - 69) / 12);
}

// function PitchMeter({ pitch, targetFreq, confidence }) {
//   const ref = useRef(null);
//   useEffect(() => {
//     const c = ref.current;
//     if (!c) return;
//     const ctx = c.getContext("2d");
//     const w = c.width, h = c.height;
//     ctx.clearRect(0,0,w,h);
//     if (!pitch || !targetFreq) return;
//     const max = w/2 - 10;
//     const diff = pitch - targetFreq;
//     const len = Math.min(Math.abs(diff)*5, max);
//     ctx.fillStyle = `rgba(76,175,80,${confidence})`;
//     if (diff >= 0) ctx.fillRect(w/2, h/4, len, h/2);
//     else ctx.fillRect(w/2-len, h/4, len, h/2);
//     ctx.strokeStyle="#555"; ctx.lineWidth=2;
//     ctx.beginPath(); ctx.moveTo(w/2,0); ctx.lineTo(w/2,h); ctx.stroke();
//   }, [pitch, targetFreq, confidence]);
//   return <canvas ref={ref} width={300} height={50} style={{margin:"10px auto",display:"block"}} />;
// }

export default function VocaScanTuner() {
  const engineRef = useRef(null);
  const apiRef = useRef(null);
  const prevPitch = useRef(null);
  const smooth = useRef(null);
  const confRef = useRef(0);

  const [isRunning,setIsRunning] = useState(false);
  const [pitch,setPitch] = useState(null);
  const [note,setNote] = useState("--");
  const [confidence,setConfidence] = useState(0);
  const [diagnosis,setDiagnosis] = useState(null);

  useEffect(() => {
    engineRef.current = new CrepeEngine();
    apiRef.current = new ScoreClient();
    return () => {
      engineRef.current?.stop();
      apiRef.current?.cancel();
    };
  }, []);

  const start = async () => {
    if (isRunning) return;
    setDiagnosis(null);
    prevPitch.current = null;
    smooth.current = null;
    confRef.current = 0;

    await engineRef.current.start(freq => {
      if (!freq) return;
      if (!smooth.current) smooth.current = freq;
      smooth.current = smooth.current*0.85 + freq*0.15;
      const s = smooth.current;
      let cont = 1;
      if (prevPitch.current) cont = Math.max(0,1 - Math.abs(s-prevPitch.current)/prevPitch.current*5);
      prevPitch.current = s;
      confRef.current = Math.min(1,0.3+cont*0.7);
      setPitch(s);
      setNote(freqToNote(s));
      setConfidence(confRef.current);
    });

    setIsRunning(true);
  };

  const stop = async () => {
    if (!isRunning) return;
    engineRef.current.stop();
    apiRef.current.cancel();
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

  const targetFreq = noteToFreq(note);

  return (
    <div style={styles.container}>
      <h2>VocaScan Tuner</h2>
      <div style={styles.panel}>
        <div style={styles.value}>{note}</div>
        <div style={styles.sub}>
          Pitch: {pitch ? pitch.toFixed(2) : "--"} Hz<br/>
          安定度: {(confidence*100).toFixed(0)}%
        </div>
      </div>
      <PitchMeter pitch={pitch} targetFreq={targetFreq} confidence={confidence}/>
      <div style={styles.controls}>
        {!isRunning
          ? <button style={styles.start} onClick={start}>Start</button>
          : <button style={styles.stop} onClick={stop}>Stop</button>}
      </div>
      {diagnosis && (
        <div style={styles.diagnosis}>
          <pre>{JSON.stringify(diagnosis,null,2)}</pre>
        </div>
      )}
    </div>
  );
}

const styles = {
  container:{padding:20,textAlign:"center",fontFamily:"sans-serif"},
  panel:{margin:"20px auto",padding:20,width:280,borderRadius:12,background:"#f0f4ff",boxShadow:"0 4px 10px rgba(0,0,0,0.1)"},
  value:{fontSize:48,fontWeight:"bold"},
  sub:{marginTop:6,fontSize:13,color:"#555"},
  controls:{marginTop:20},
  start:{padding:"10px 24px",fontSize:16,borderRadius:8,border:"none",background:"#4caf50",color:"#fff"},
  stop:{padding:"10px 24px",fontSize:16,borderRadius:8,border:"none",background:"#f44336",color:"#fff"},
  diagnosis:{margin:"20px auto",padding:10,background:"#fff0f0",borderRadius:8,maxWidth:400}
};
