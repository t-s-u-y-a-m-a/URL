// てんの「ごきげんゲージ」。減ることはなく、遊ぶほど・読み聞かせるほど増えていく。
import { SaveStore, MOOD_MAX } from "./state.js";

export const MOOD_GAIN = {
  stageClear: 4,
  highRank: 6, // rank S/A のときの追加分
  readBook: 8,
  readBookRecorded: 12,
};

const LEVEL_INFO = {
  1: { hearts: 1, label: "にっこり", reactions: ["あー", "にっこり"] },
  2: { hearts: 2, label: "ごきげん", reactions: ["あー", "うー", "てあし ぱたぱた"] },
  3: { hearts: 3, label: "よくわらう", reactions: ["きゃっ♪", "おやを みる", "うー！"] },
  4: { hearts: 4, label: "とてもごきげん", reactions: ["きゃはは！", "てあし ばたばた", "おやを じっと みる"] },
  5: { hearts: 5, label: "さいこう！", reactions: ["きゃはははは！", "あー！", "うー！", "おおよろこび"] },
};

export function getMoodLevel() {
  return SaveStore.getMoodLevel();
}

export function getMoodInfo() {
  const level = getMoodLevel();
  return { level, mood: SaveStore.data.babyMood, max: MOOD_MAX, ...LEVEL_INFO[level] };
}

export function gainMood(amount) {
  SaveStore.addMood(amount);
  SaveStore.save();
  return getMoodInfo();
}

export function renderHeartsHTML() {
  const { hearts } = getMoodInfo();
  let out = "";
  for (let i = 0; i < 5; i++) out += i < hearts ? "❤️" : "🤍";
  return out;
}

export function pickReaction() {
  const { reactions } = getMoodInfo();
  return reactions[Math.floor(Math.random() * reactions.length)];
}
