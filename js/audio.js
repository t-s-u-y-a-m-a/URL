// 音まわりの管理。
// Phase1では外部音源ファイルに依存せず、Web Audio APIで簡易的な効果音を
// その場で合成して鳴らす（ライセンス上の懸念を避けるため）。
// 将来的にBGMやボイスファイルを追加する場合は、loadSound()で読み込んで
// AudioBuffer方式に差し替えられるように構造化してある。

class AudioManager {
  constructor() {
    this.ctx = null;
    this.volumes = { bgm: 0.7, se: 0.8 };
    this.enabled = { bgm: true, se: true };
    this.buffers = {}; // name -> AudioBuffer (将来の実音源用)
  }

  setEnabled(kind, isOn) {
    this.enabled[kind] = !!isOn;
  }

  _ensureCtx() {
    if (!this.ctx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new Ctx();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return this.ctx;
  }

  setVolume(kind, value0to100) {
    this.volumes[kind] = Math.max(0, Math.min(100, value0to100)) / 100;
  }

  // 将来: 実際の音声ファイルを読み込む口
  async loadSound(name, url) {
    try {
      const ctx = this._ensureCtx();
      const res = await fetch(url);
      const arr = await res.arrayBuffer();
      this.buffers[name] = await ctx.decodeAudioData(arr);
    } catch (e) {
      console.warn(`sound load failed: ${name}`, e);
    }
  }

  _beep({ freq = 440, duration = 0.12, type = "sine", gain = 0.2, kind = "se" }) {
    if (!this.enabled[kind]) return;
    try {
      const ctx = this._ensureCtx();
      const osc = ctx.createOscillator();
      const amp = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      const vol = gain * (this.volumes[kind] ?? 0.8);
      amp.gain.setValueAtTime(vol, ctx.currentTime);
      amp.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(amp).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      // AudioContextが使えない環境では無音でフォールスルー
    }
  }

  playHit(judgment) {
    switch (judgment) {
      case "PERFECT":
        this._beep({ freq: 880, duration: 0.13, type: "sine", gain: 0.25 });
        break;
      case "GREAT":
        this._beep({ freq: 660, duration: 0.12, type: "sine", gain: 0.22 });
        break;
      case "GOOD":
        this._beep({ freq: 500, duration: 0.1, type: "triangle", gain: 0.18 });
        break;
      case "MISS":
        this._beep({ freq: 180, duration: 0.18, type: "sawtooth", gain: 0.15 });
        break;
    }
  }

  playCry() {
    this._beep({ freq: 300, duration: 0.25, type: "sawtooth", gain: 0.12 });
  }

  playLaugh() {
    this._beep({ freq: 950, duration: 0.18, type: "sine", gain: 0.16 });
  }

  playClear() {
    [660, 880, 1100].forEach((f, i) => {
      setTimeout(() => this._beep({ freq: f, duration: 0.2, type: "sine", gain: 0.22 }), i * 120);
    });
  }
}

export const Audio_ = new AudioManager();
