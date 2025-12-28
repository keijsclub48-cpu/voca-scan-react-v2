import React from "react";
import "./PitchMeter.css";

export default function PitchMeter({ pitch, targetFreq }) {
  const hasValue = pitch && targetFreq;

  let cents = 0;
  let percent = 50;

  if (hasValue) {
    cents = 1200 * Math.log2(pitch / targetFreq);
    const clamped = Math.max(-50, Math.min(50, cents));
    percent = clamped + 50;
  }

  return (
    <div className={`pitch-meter ${hasValue ? "" : "inactive"}`}>
      <div className="scale">
        <div className="center-line" />
        <div className="needle" style={{ left: `${percent}%` }} />
      </div>
      <div className="value">
        {hasValue ? cents.toFixed(1) : "--"} cents
      </div>
    </div>
  );
}
