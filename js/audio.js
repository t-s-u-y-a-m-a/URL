// 音まわりの管理。
// assets/sounds/ 以下に音源ファイルを置けばそちらを再生し、
// ファイルが存在しない場合はWeb Audio APIで合成した簡易効果音に
// 自動フォールバックする（どちらの状態でもゲームがエラーで止まらない）。
//
// 想定しているファイル構成:
//   assets/sounds/bgm/stage1.mp3
//   assets/sounds/se/{tap,perfect,great,good(未使用/tapを共用),miss,clear}.mp3
//   assets/sounds/baby/{laugh,cry,voice}.mp3
// ここにファイルを追加するだけで自動的に使われる。何も置かなければ
// これまでどおり合成音のままプレイできる。

const SOUND_FILES = {
  se: {
    PERFECT: "assets/sounds/se/perfect.mp3",
    GREAT: "assets/sounds/se/great.mp3",
    GOOD: "assets/sounds/se/tap.mp3",
    MISS: "assets/sounds/se/miss.mp3",
    CLEAR: "assets/sounds/se/clear.mp3",
  },
  baby: {
    LAUGH: "assets/sounds/baby/laugh.mp3",
    CRY: "assets/sounds/baby/cry.mp3",
    VOICE: "assets/sounds/baby/voice.mp3",
  },
};

class AudioManager {
  constructor() {
    this.ctx = null;
    this.volumes = { bgm: 0.7, se: 0.8 };
    this.enabled = { bgm: true, se: true };
    this.bgmEl = null;
  }

  setEnabled(kind, isOn) {
    this.enabled[kind] = !!isOn;
    if (kind === "bgm" && !this.enabled.bgm) this.stopBGM();
  }

  setVolume(kind, value0to100) {
    this.volumes[kind] = Math.max(0, Math.min(100, value0to100)) / 100;
    if (kind === "bgm" && this.bgmEl) this.bgmEl.volume = this.volumes.bgm;
  }

  // ---- BGM ----
  // ユーザー操作(ステージ開始など)の後に呼ぶこと。ブラウザの自動再生制限や
  // ファイル未配置で再生できない場合は、何もせず静かに失敗させる。
  playBGM(url) {
    this.stopBGM();
    if (!this.enabled.bgm || !url) return;
    try {
      const audio = new Audio(url);
      audio.loop = true;
      audio.volume = this.volumes.bgm;
      audio.play().catch(() => {
        /* ファイルが無い / 自動再生がブロックされた場合はBGM無しで継続 */
      });
      this.bgmEl = audio;
    } catch (e) {
      this.bgmEl = null;
    }
  }

  stopBGM() {
    if (this.bgmEl) {
      this.bgmEl.pause();
      this.bgmEl.src = "";
      this.bgmEl = null;
    }
  }

  // ---- 効果音: ファイル再生を試み、失敗したら合成音にフォールバック ----
  _tryPlayFile(url, kind, fallbackFn) {
    if (!this.enabled[kind]) return;
    if (!url) {
      fallbackFn && fallbackFn();
      return;
    }
    let fallbackDone = false;
    const fallback = () => {
      if (fallbackDone) return;
      fallbackDone = true;
      fallbackFn && fallbackFn();
    };
    try {
      const audio = new Audio(url);
      audio.volume = this.volumes[kind] ?? 0.8;
      audio.addEventListener("error", fallback, { once: true });
      const playPromise = audio.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(fallback);
      }
    } catch (e) {
      fallback();
    }
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

  _beepForJudgment(judgment) {
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

  playHit(judgment) {
    this._tryPlayFile(SOUND_FILES.se[judgment], "se", () => this._beepForJudgment(judgment));
  }

  playCry() {
    this._tryPlayFile(SOUND_FILES.baby.CRY, "se", () =>
      this._beep({ freq: 300, duration: 0.25, type: "sawtooth", gain: 0.12 })
    );
  }

  playLaugh() {
    this._tryPlayFile(SOUND_FILES.baby.LAUGH, "se", () =>
      this._beep({ freq: 950, duration: 0.18, type: "sine", gain: 0.16 })
    );
  }

  // GREAT時などの「あー♪」的な軽い声
  playVoice() {
    this._tryPlayFile(SOUND_FILES.baby.VOICE, "se", () =>
      this._beep({ freq: 720, duration: 0.14, type: "sine", gain: 0.14 })
    );
  }

  playClear() {
    this._tryPlayFile(SOUND_FILES.se.CLEAR, "se", () => {
      [660, 880, 1100].forEach((f, i) => {
        setTimeout(() => this._beep({ freq: f, duration: 0.2, type: "sine", gain: 0.22 }), i * 120);
      });
    });
  }
}

export const Audio_ = new AudioManager();
