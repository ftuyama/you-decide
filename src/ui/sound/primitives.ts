export function playOneShotTone(
  ctx: AudioContext,
  dest: AudioNode,
  freq: number,
  dur: number,
  vol: number,
  type: OscillatorType = 'sine',
): void {
  if (vol <= 0) return;
  const o = ctx.createOscillator();
  const gn = ctx.createGain();
  o.type = type;
  o.frequency.value = freq;
  gn.gain.value = vol;
  o.connect(gn);
  gn.connect(dest);
  o.start();
  o.stop(ctx.currentTime + dur);
}

export function triggerKick(ctx: AudioContext, dest: AudioNode, t: number, vol: number): void {
  if (vol <= 0) return;
  const o = ctx.createOscillator();
  const gn = ctx.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(120, t);
  o.frequency.exponentialRampToValueAtTime(55, t + 0.06);
  gn.gain.setValueAtTime(vol, t);
  gn.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
  o.connect(gn);
  gn.connect(dest);
  o.start(t);
  o.stop(t + 0.11);
}

export function triggerSnare(ctx: AudioContext, dest: AudioNode, t: number, vol: number): void {
  if (vol <= 0) return;
  const len = 4096;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 1800;
  const gn = ctx.createGain();
  gn.gain.setValueAtTime(vol, t);
  gn.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
  src.connect(bp);
  bp.connect(gn);
  gn.connect(dest);
  src.start(t);
  src.stop(t + 0.12);
}

export function triggerHat(ctx: AudioContext, dest: AudioNode, t: number, vol: number): void {
  if (vol <= 0) return;
  const o = ctx.createOscillator();
  const gn = ctx.createGain();
  o.type = 'square';
  o.frequency.value = 8000 + Math.random() * 400;
  gn.gain.setValueAtTime(vol, t);
  gn.gain.exponentialRampToValueAtTime(0.01, t + 0.03);
  o.connect(gn);
  gn.connect(dest);
  o.start(t);
  o.stop(t + 0.04);
}

export function triggerArp(ctx: AudioContext, dest: AudioNode, t: number, vol: number): void {
  if (vol <= 0) return;
  const notes = [220, 261.63, 293.66, 329.63];
  notes.forEach((f, i) => {
    const o = ctx.createOscillator();
    const gn = ctx.createGain();
    o.type = 'square';
    o.frequency.value = f;
    gn.gain.setValueAtTime(vol, t + i * 0.05);
    gn.gain.exponentialRampToValueAtTime(0.01, t + i * 0.05 + 0.08);
    o.connect(gn);
    gn.connect(dest);
    o.start(t + i * 0.05);
    o.stop(t + i * 0.05 + 0.09);
  });
}

export function triggerPluck(
  ctx: AudioContext,
  dest: AudioNode,
  t: number,
  freq: number,
  vol: number,
  type: OscillatorType = 'triangle',
  decay = 0.2,
): void {
  if (vol <= 0) return;
  const o = ctx.createOscillator();
  const gn = ctx.createGain();
  const tone = ctx.createBiquadFilter();

  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  tone.type = 'lowpass';
  tone.frequency.value = 2400;
  tone.Q.value = 0.9;

  gn.gain.setValueAtTime(0.0001, t);
  gn.gain.linearRampToValueAtTime(vol, t + 0.012);
  gn.gain.exponentialRampToValueAtTime(0.0001, t + decay);

  o.connect(tone);
  tone.connect(gn);
  gn.connect(dest);
  o.start(t);
  o.stop(t + decay + 0.04);
}
