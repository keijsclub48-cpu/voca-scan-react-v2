import { useRef, useEffect } from "react";
import "./PitchMeter.css";

type Props = {
  freq: number;
  target: number;
  cents: number;
};

export default function PitchMeter({ freq, target, cents }: Props) {
  const meterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!meterRef.current) return;

    // メーター幅設定
    const meterWidth = 200; // px
    const maxCents = 50; // ±50 cent
    const limited = Math.max(Math.min(cents, maxCents), -maxCents);

    // 0 を中央にして左右に動かす
    const offsetX = ((limited + maxCents) / (maxCents * 2)) * meterWidth;

    meterRef.current.style.transform = `translateX(${offsetX}px)`;
  }, [cents]);

  return (
    <div className="pitch-meter-wrapper">
      <div className="pitch-meter-background">
        <div ref={meterRef} className="pitch-meter-indicator"></div>
      </div>
    </div>
  );
}
