import { usePitchEngine } from './hooks/usePitchEngine';

export default function App() {
  const { pitch, confidence, start, stop } = usePitchEngine();

  return (
    <div style={{ padding: 20 }}>
      <h2>VocaScan V2 CREPE Test</h2>
      <button onClick={start}>Start</button>
      <button onClick={stop}>Stop</button>

      <div style={{ marginTop: 20 }}>
        <div>Pitch: {pitch ?? '--'} Hz</div>
        <div>Confidence: {confidence ?? '--'}</div>
      </div>
    </div>
  );
}
