// One cached noise buffer, at most six short voices. All attacks start on input,
// and the low thump lands with the first frozen impact frame.
export class PunchAudio {
  constructor() { this.voices = new Set(); }
  unlock() {
    try {
      this.context ??= new (window.AudioContext || window.webkitAudioContext)();
      if (this.context.state === "suspended") this.context.resume().catch(() => {});
      if (!this.noise) {
        this.noise = this.context.createBuffer(1, this.context.sampleRate * .12, this.context.sampleRate);
        const data = this.noise.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
      }
      return true;
    } catch { return false; }
  }
  voice(node, volume, duration, delay = 0) {
    if (this.voices.size >= 6) return;
    const c = this.context, gain = c.createGain(), t = c.currentTime + delay;
    gain.gain.setValueAtTime(.001, t); gain.gain.linearRampToValueAtTime(volume, t + .003);
    gain.gain.exponentialRampToValueAtTime(.001, t + duration);
    node.connect(gain); gain.connect(c.destination);
    const voice = { node, gain }; this.voices.add(voice);
    node.onended = () => { node.disconnect(); gain.disconnect(); this.voices.delete(voice); };
    node.start(t); node.stop(t + duration + .01);
  }
  hit({ ko, heavy, event, prop }) {
    if (!this.unlock()) return;
    const c = this.context, t = c.currentTime;
    const thump = c.createOscillator(); thump.type = "sine";
    thump.frequency.setValueAtTime(ko ? 190 : heavy ? 150 : 120, t);
    thump.frequency.exponentialRampToValueAtTime(38, t + .12);
    this.voice(thump, heavy || ko ? .32 : .23, .16);
    const snap = c.createBufferSource(); snap.buffer = this.noise;
    snap.playbackRate.value = heavy ? .75 : 1.5;
    this.voice(snap, .12, .07);
    if (event || ko || prop === "chicken") {
      const squeak = c.createOscillator(); squeak.type = "triangle";
      squeak.frequency.setValueAtTime(event === "spirit" ? 900 : 520, t);
      squeak.frequency.exponentialRampToValueAtTime(event === "spirit" ? 1300 : 170, t + .22);
      this.voice(squeak, .08, .23, .015);
    }
  }
  stop() {
    for (const { node, gain } of this.voices) {
      try { node.stop(); } catch {}
      node.disconnect(); gain.disconnect();
    }
    this.voices.clear();
  }
}
