// src/hooks/usePitchEngine.js
import { useEffect, useRef, useState } from 'react';
import { CrepeEngine } from '../audio/CrepeEngine';

export function usePitchEngine() {
  const engineRef = useRef(null);
  const [pitch, setPitch] = useState(null);
  const [confidence, setConfidence] = useState(null);

  useEffect(() => {
    const engine = new CrepeEngine();
    engine.onPitch((f0, conf) => {
      setPitch(f0.toFixed(2));
      setConfidence(conf?.toFixed(2));
    });
    engineRef.current = engine;

    return () => engine.stop();
  }, []);

  return {
    pitch,
    confidence,
    start: () => engineRef.current.start(),
    stop: () => engineRef.current.stop()
  };
}
