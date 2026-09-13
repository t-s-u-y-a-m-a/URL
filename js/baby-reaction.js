// 「てん」のリアクション表現。ゲーム画面・結果画面など複数箇所から
// 使い回せるように、対象の要素を渡して制御する小さなクラス。

const FACES = {
  neutral: "👶",
  smile: "😊",
  laugh: "😄",
  bigLaugh: "🤣",
  cry: "😢",
  sleepy1: "😌",
  sleepy2: "😴",
  sleep: "💤",
  surprised: "😲",
};

export class BabyReaction {
  constructor(el) {
    this.el = el;
    this._timeoutId = null;
    this.baseFace = "neutral"; // 判定演出が終わったら戻る「地の表情」
  }

  setFace(faceKey) {
    if (!this.el) return;
    this.el.textContent = FACES[faceKey] || FACES.neutral;
  }

  // ステージ進行（STAGE2の入眠段階など）に応じた「地の表情」を設定する
  setBaseFace(faceKey) {
    this.baseFace = faceKey;
    if (!this._timeoutId) this.setFace(faceKey);
  }

  // 判定結果に応じた一時的な表情変化（一定時間後にbaseFaceへ戻る）
  reactToJudgment(judgment) {
    if (!this.el) return;
    let face = "neutral";
    if (judgment === "PERFECT") face = "bigLaugh";
    else if (judgment === "GREAT") face = "laugh";
    else if (judgment === "GOOD") face = "smile";
    else if (judgment === "MISS") face = "cry";

    this.setFace(face);
    this.el.style.transform = judgment === "MISS" ? "scale(0.92)" : "scale(1.12)";
    clearTimeout(this._timeoutId);
    this._timeoutId = setTimeout(() => {
      this._timeoutId = null;
      this.setFace(this.baseFace);
      this.el.style.transform = "scale(1)";
    }, 400);
  }

  // STAGE3のほっぺぷにぷに演出（左/両/右）
  pokeCheek(side) {
    if (!this.el) return;
    const cls = side === "A" ? "poke-left" : side === "D" ? "poke-right" : "poke-both";
    this.el.classList.remove("poke-left", "poke-right", "poke-both");
    void this.el.offsetWidth;
    this.el.classList.add(cls);
    setTimeout(() => this.el && this.el.classList.remove(cls), 300);
  }

  // STAGE5の特別な最終「ばあ！」演出
  playSpecialBaa() {
    if (!this.el) return;
    this.setFace("bigLaugh");
    this.baseFace = "bigLaugh";
    this.el.classList.add("special-baa");
    setTimeout(() => this.el && this.el.classList.remove("special-baa"), 900);
  }

  reactToResult(rank) {
    if (!this.el) return;
    if (rank === "S" || rank === "A") this.setFace("bigLaugh");
    else if (rank === "B") this.setFace("laugh");
    else this.setFace("smile");
  }
}
