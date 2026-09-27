/**
 * DevFlow Focus Timer & Web Audio Ambient Sound Generator
 */

export class FocusTimer {
  constructor({ onTick, onComplete, initialSeconds = 25 * 60 }) {
    this.totalSeconds = initialSeconds;
    this.remainingSeconds = initialSeconds;
    this.isRunning = false;
    this.intervalId = null;
    this.onTick = onTick;
    this.onComplete = onComplete;
  }

  setDuration(minutes) {
    this.pause();
    this.totalSeconds = minutes * 60;
    this.remainingSeconds = this.totalSeconds;
    if (this.onTick) this.onTick(this.remainingSeconds, this.totalSeconds);
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;

    this.intervalId = setInterval(() => {
      this.remainingSeconds--;
      if (this.onTick) this.onTick(this.remainingSeconds, this.totalSeconds);

      if (this.remainingSeconds <= 0) {
        this.pause();
        if (this.onComplete) this.onComplete(Math.round(this.totalSeconds / 60));
      }
    }, 1000);
  }

  pause() {
    if (!this.isRunning) return;
    this.isRunning = false;
    clearInterval(this.intervalId);
  }

  reset() {
    this.pause();
    this.remainingSeconds = this.totalSeconds;
    if (this.onTick) this.onTick(this.remainingSeconds, this.totalSeconds);
  }
}

// Web Audio API Ambient Sound Synthesizer (Zero external audio asset dependencies!)
export class AmbientSynthesizer {
  constructor() {
    this.ctx = null;
    this.currentMode = null;
    this.noiseNode = null;
    this.gainNode = null;
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
  }

  play(mode = 'white_noise') {
    this.init();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    this.stop();

    this.currentMode = mode;
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      if (mode === 'white_noise') {
        data[i] = Math.random() * 2 - 1;
      } else if (mode === 'rain') {
        // Pink-ish filtered noise
        data[i] = (Math.random() * 2 - 1) * 0.7;
      } else {
        // Cyber drone
        data[i] = Math.sin(i / 10) * 0.4 + (Math.random() * 0.1);
      }
    }

    this.noiseNode = this.ctx.createBufferSource();
    this.noiseNode.buffer = buffer;
    this.noiseNode.loop = true;

    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.setValueAtTime(0.04, this.ctx.currentTime); // Soft background volume

    // Low pass filter to make it pleasant
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(mode === 'white_noise' ? 1200 : 700, this.ctx.currentTime);

    this.noiseNode.connect(filter);
    filter.connect(this.gainNode);
    this.gainNode.connect(this.ctx.destination);

    this.noiseNode.start();
  }

  stop() {
    if (this.noiseNode) {
      try { this.noiseNode.stop(); } catch {}
      this.noiseNode = null;
    }
    this.currentMode = null;
  }
}
