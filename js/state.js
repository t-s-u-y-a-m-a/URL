// ゲーム全体の進行状況・セーブデータ管理
const SAVE_KEY = "tenten-game-save-v1";

const MAX_MOOD = 100;

const DEFAULT_SAVE = {
  player: "father", // "father" | "mother"
  volume: { bgm: 45, se: 80 }, // BGMは声/SEの邪魔をしないよう控えめを初期値にする
  unlockedStages: [1], // クリアしなくても最初はステージ1のみ解放
  clears: {
    // stageId -> { EASY: bool, NORMAL: bool, HARD: bool }
  },
  bestScores: {
    // stageId -> { EASY: score, NORMAL: score, HARD: score }
  },
  ehon: [], // 解放済み絵本の stageId 配列
  babyMood: 0, // 0〜100。てんのごきげん（減ることはない）
  endingUnlocked: false,
  endingViewed: false,
};

function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return structuredClone(DEFAULT_SAVE);
    const parsed = JSON.parse(raw);
    return { ...structuredClone(DEFAULT_SAVE), ...parsed };
  } catch (e) {
    console.warn("セーブデータの読み込みに失敗しました", e);
    return structuredClone(DEFAULT_SAVE);
  }
}

function writeSave(save) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  } catch (e) {
    console.warn("セーブデータの保存に失敗しました", e);
  }
}

export const SaveStore = {
  data: loadSave(),

  save() {
    writeSave(this.data);
  },

  reset() {
    this.data = structuredClone(DEFAULT_SAVE);
    this.save();
  },

  isStageUnlocked(stageId) {
    return this.data.unlockedStages.includes(stageId);
  },

  unlockStage(stageId) {
    if (!this.data.unlockedStages.includes(stageId)) {
      this.data.unlockedStages.push(stageId);
    }
  },

  isDifficultyCleared(stageId, diff) {
    return !!(this.data.clears[stageId] && this.data.clears[stageId][diff]);
  },

  markCleared(stageId, diff) {
    if (!this.data.clears[stageId]) this.data.clears[stageId] = {};
    this.data.clears[stageId][diff] = true;
  },

  updateBestScore(stageId, diff, score) {
    if (!this.data.bestScores[stageId]) this.data.bestScores[stageId] = {};
    const cur = this.data.bestScores[stageId][diff] || 0;
    if (score > cur) this.data.bestScores[stageId][diff] = score;
  },

  unlockEhon(stageId) {
    const isNew = !this.data.ehon.includes(stageId);
    if (isNew) this.data.ehon.push(stageId);
    return isNew;
  },

  hasEhon(stageId) {
    return this.data.ehon.includes(stageId);
  },

  hasAllEhon(totalBooks) {
    return this.data.ehon.length >= totalBooks;
  },

  addMood(amount) {
    this.data.babyMood = Math.max(0, Math.min(MAX_MOOD, this.data.babyMood + amount));
  },

  getMoodLevel() {
    // 1〜5段階。MAX_MOODを5分割。
    return Math.max(1, Math.min(5, Math.floor(this.data.babyMood / (MAX_MOOD / 5)) + 1));
  },

  isAllStagesCleared(totalStages) {
    for (let id = 1; id <= totalStages; id++) {
      const clears = this.data.clears[id];
      if (!clears || !(clears.EASY || clears.NORMAL || clears.HARD)) return false;
    }
    return true;
  },

  checkEndingUnlock(totalStages, totalBooks) {
    if (!this.data.endingUnlocked && this.isAllStagesCleared(totalStages) && this.hasAllEhon(totalBooks)) {
      this.data.endingUnlocked = true;
      return true; // 今回はじめて解放された
    }
    return false;
  },
};

export const MOOD_MAX = MAX_MOOD;

// 現在プレイ中のセッション情報（画面間で受け渡す一時状態）
export const Session = {
  currentStageId: null,
  currentDifficulty: "EASY",
  lastResult: null,
};
