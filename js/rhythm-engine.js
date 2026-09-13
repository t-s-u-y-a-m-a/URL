// リズムゲームのコアエンジン。
// ノーツの出現・落下・判定・スコア計算を担当する。
// DOM操作は最小限にとどめ、外部（screens.js）からコールバックで結果を受け取る形にしている。
// tap(通常)とhold(長押し)の両方のノーツタイプに対応する。

const JUDGE_SCORE = {
  PERFECT: 1000,
  GREAT: 700,
  GOOD: 400,
  MISS: 0,
};

const TIER_ORDER = ["PERFECT", "GREAT", "GOOD", "MISS"];
const KEYS = ["A", "Space", "D"];

function worseTier(a, b) {
  return TIER_ORDER[Math.max(TIER_ORDER.indexOf(a), TIER_ORDER.indexOf(b))];
}

export class RhythmEngine {
  /**
   * @param {object} chart - { travelTime, judge: {perfect,great,good}, notes: [{t,key,hold?}] }
   * @param {object} callbacks - { onJudge, onComboChange, onScoreChange, onBabyReact, onFinish, onRestChange }
   * @param {object} renderer - { spawn(note), updatePosition(note,frac), setHolding(note,bool), resolve(note,judgment), clear() }
   *   ノーツの見た目・移動演出を担当する。判定ロジックはここでは一切扱わない。
   */
  constructor(chart, callbacks, renderer) {
    this.chart = chart;
    this.callbacks = callbacks || {};
    this.renderer = renderer;
    this.notes = chart.notes
      .map((n, i) => ({ ...n, id: i, spawned: false, resolved: false, el: null, pressDiff: null }))
      .sort((a, b) => a.t - b.t);
    this.travelTime = chart.travelTime;
    this.judgeWindow = chart.judge; // {perfect, great, good} ms
    this.rests = chart.rests || []; // 休符ゾーン: [{start, end}] (ms) — この間の入力はNG
    this.running = false;
    this.startTime = 0;
    this.elapsed = 0;
    this.rafId = null;

    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.counts = { PERFECT: 0, GREAT: 0, GOOD: 0, MISS: 0 };
    // 休符ゾーンでの誤入力。ノーツのMISSとは別に数える
    // (ノーツ数より多いMISSがリザルトに出てしまうのを避けるため)
    this.restMisses = 0;

    // レーンごとに「現在押しっぱなしにしているホールドノーツ」を保持
    this.activeHold = { A: null, Space: null, D: null };
    this._inRestState = false;

    this._onFrame = this._onFrame.bind(this);
  }

  start() {
    this.running = true;
    this.startTime = performance.now();
    this.rafId = requestAnimationFrame(this._onFrame);
  }

  stop() {
    this.running = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.renderer.clear();
  }

  _onFrame(now) {
    if (!this.running) return;
    this.elapsed = now - this.startTime;

    this._spawnDueNotes();
    this._updateNotePositions();
    this._autoMissExpiredNotes();
    this._updateRestState();

    const lastNoteTime = this.notes.length ? this.notes[this.notes.length - 1].t : 0;
    const allResolved = this.notes.every((n) => n.resolved);
    if (this.elapsed > lastNoteTime + this.travelTime + 400 && allResolved) {
      this._finish();
      return;
    }

    this.rafId = requestAnimationFrame(this._onFrame);
  }

  _spawnDueNotes() {
    for (const note of this.notes) {
      if (note.spawned) continue;
      if (this.elapsed >= note.t - this.travelTime) {
        this._spawnNote(note);
      }
    }
  }

  _spawnNote(note) {
    note.spawned = true;
    this.renderer.spawn(note);
  }

  _updateNotePositions() {
    for (const note of this.notes) {
      if (!note.spawned || note.resolved) continue;
      const frac = (this.elapsed - (note.t - this.travelTime)) / this.travelTime;
      this.renderer.updatePosition(note, frac);
    }
  }

  _autoMissExpiredNotes() {
    const goodMs = this.judgeWindow.good;
    for (const note of this.notes) {
      if (note.resolved) continue;

      const isBeingHeld = this.activeHold[note.key] === note;
      if (isBeingHeld) {
        // ホールド中：離すタイミングを大幅に過ぎても離されない場合は強制MISS
        const releaseDeadline = note.t + (note.hold || 0) + goodMs * 2;
        if (this.elapsed > releaseDeadline) {
          this.activeHold[note.key] = null;
          this._resolveNote(note, "MISS");
        }
        continue;
      }

      if (this.elapsed > note.t + goodMs) {
        this._resolveNote(note, "MISS");
      }
    }
  }

  handleKeyPress(key) {
    if (!this.running || !KEYS.includes(key)) return;
    if (this.activeHold[key]) return; // 既にそのレーンをホールド中

    const candidates = this.notes.filter(
      (n) => n.key === key && n.spawned && !n.resolved
    );
    if (candidates.length === 0) {
      if (this._isInRest(this.elapsed)) this._punishRestViolation();
      return;
    }

    candidates.sort(
      (a, b) => Math.abs(this.elapsed - a.t) - Math.abs(this.elapsed - b.t)
    );
    const note = candidates[0];
    const diff = Math.abs(this.elapsed - note.t);

    if (diff > this.judgeWindow.good) {
      // タイミングが遠すぎる入力は空振り。ただし休符ゾーン中の誤入力はMISS扱いにする
      if (this._isInRest(this.elapsed)) this._punishRestViolation();
      return;
    }

    if (note.hold) {
      // ホールド開始：押し始めの誤差だけ記録し、離すタイミングを待つ
      note.pressDiff = diff;
      this.activeHold[key] = note;
      this.renderer.setHolding(note, true);
      return;
    }

    const judgment =
      diff <= this.judgeWindow.perfect ? "PERFECT" :
      diff <= this.judgeWindow.great ? "GREAT" : "GOOD";
    this._resolveNote(note, judgment);
  }

  handleKeyRelease(key) {
    if (!KEYS.includes(key)) return;
    const note = this.activeHold[key];
    if (!note) return;
    this.activeHold[key] = null;

    const releaseDiff = Math.abs(this.elapsed - (note.t + note.hold));
    const startTier =
      note.pressDiff <= this.judgeWindow.perfect ? "PERFECT" :
      note.pressDiff <= this.judgeWindow.great ? "GREAT" : "GOOD";
    const endTier =
      releaseDiff <= this.judgeWindow.perfect ? "PERFECT" :
      releaseDiff <= this.judgeWindow.great ? "GREAT" :
      releaseDiff <= this.judgeWindow.good ? "GOOD" : "MISS";

    this._resolveNote(note, worseTier(startTier, endTier));
  }

  _updateRestState() {
    if (!this.rests.length) return;
    const inRest = this._isInRest(this.elapsed);
    if (inRest !== this._inRestState) {
      this._inRestState = inRest;
      this.callbacks.onRestChange && this.callbacks.onRestChange(inRest);
    }
  }

  _isInRest(elapsed) {
    return this.rests.some((r) => elapsed >= r.start && elapsed <= r.end);
  }

  _punishRestViolation() {
    // 休符中の誤入力：ノーツを伴わないためnote引数はnullで通知する
    this.restMisses++;
    this.combo = 0;
    this.callbacks.onBabyReact && this.callbacks.onBabyReact("cry");
    this.callbacks.onJudge && this.callbacks.onJudge("MISS", null);
    this.callbacks.onComboChange && this.callbacks.onComboChange(this.combo);
  }

  _resolveNote(note, judgment) {
    note.resolved = true;
    this.renderer.resolve(note, judgment);

    this.counts[judgment]++;

    if (judgment === "MISS") {
      this.combo = 0;
      this.callbacks.onBabyReact && this.callbacks.onBabyReact("cry");
    } else {
      // コンボボーナス: 10コンボごとに+5%（最大+50%）
      const comboMultiplier = 1 + Math.min(Math.floor(this.combo / 10) * 0.05, 0.5);
      this.score += Math.round(JUDGE_SCORE[judgment] * comboMultiplier);
      this.combo++;
      this.maxCombo = Math.max(this.maxCombo, this.combo);
      this.callbacks.onBabyReact && this.callbacks.onBabyReact("happy", judgment);
    }

    this.callbacks.onJudge && this.callbacks.onJudge(judgment, note);
    this.callbacks.onComboChange && this.callbacks.onComboChange(this.combo);
    this.callbacks.onScoreChange && this.callbacks.onScoreChange(this.score);
  }

  _finish() {
    this.running = false;
    const totalNotes = this.notes.length;
    const stats = {
      score: this.score,
      counts: { ...this.counts },
      restMisses: this.restMisses,
      maxCombo: this.maxCombo,
      totalNotes,
    };
    this.callbacks.onFinish && this.callbacks.onFinish(stats);
  }
}

export function calcRank(stats) {
  const { counts, totalNotes } = stats;
  const restMisses = stats.restMisses || 0;
  if (totalNotes === 0) return "C";
  const accuracy =
    (counts.PERFECT * 1 + counts.GREAT * 0.7 + counts.GOOD * 0.4) / totalNotes;
  if (counts.MISS === 0 && restMisses === 0 && accuracy >= 0.95) return "S";
  if (accuracy >= 0.8) return "A";
  if (accuracy >= 0.6) return "B";
  return "C";
}
