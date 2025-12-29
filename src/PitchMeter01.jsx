function PitchMeter({ pitch, targetFreq, confidence }) {
  const ref = useRef(null);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    const w = c.width, h = c.height;
    ctx.clearRect(0,0,w,h);

    // 背景バー
    ctx.fillStyle = "#e3f2fd";
    ctx.fillRect(0, h/2 - 6, w, 12);

    // 中央線
    ctx.strokeStyle = "#1976d2";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(w/2, 0);
    ctx.lineTo(w/2, h);
    ctx.stroke();

    if (!pitch || !targetFreq) return;

    const cents = 1200 * Math.log2(pitch / targetFreq);
    const maxCents = 50; // ±50 cent 表示
    const x = w/2 + Math.max(-1, Math.min(1, cents / maxCents)) * (w/2 - 10);

    // ゲージ（針）
    ctx.strokeStyle = `rgba(33,150,243,${confidence})`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x, h/2 - 10);
    ctx.lineTo(x, h/2 + 10);
    ctx.stroke();
  }, [pitch, targetFreq, confidence]);

  return (
    <canvas
      ref={ref}
      width={300}
      height={50}
      style={{ margin: "10px auto", display: "block" }}
    />
  );
}
