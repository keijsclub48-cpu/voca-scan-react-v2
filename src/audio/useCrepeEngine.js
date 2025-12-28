import p5 from 'p5';

export function createCrepeEngine() {
  let mic, pitch, running = false;
  let cb = null;

  const start = async () => {
    await p5.prototype.userStartAudio();
    mic = new p5.AudioIn();
    mic.start(() => {
      const ac = p5.prototype.getAudioContext();
      pitch = window.ml5.pitchDetection(
        'https://cdn.jsdelivr.net/gh/ml5js/ml5-data-and-models/models/pitch-detection/crepe/',
        ac,
        mic.stream,
        () => loop()
      );
    });
    running = true;
  };

  const stop = () => { running = false; };

  const loop = () => {
    if (!running || !pitch) return;
    pitch.getPitch((err, f0) => {
      if (cb) cb({
        f0: f0 || 0,
        confidence: f0 ? 1 : 0,
        timestamp: performance.now()
      });
      setTimeout(loop, 50);
    });
  };

  return {
    start,
    stop,
    isRunning: () => running,
    onFrame: (fn) => { cb = fn; }
  };
}
