// 「てん」のリアクション表現。ゲーム画面・結果画面など複数箇所から
// 使い回せるように、対象の要素を渡して制御する小さなクラス。

// 各表情の絵文字と、対応するイラスト画像(あれば)。イラストは
// assets/images/tenten/ に配置。画像が無い/読み込み失敗の場合は
// 自動的に絵文字表示にフォールバックする。
const FACES = {
  neutral: { emoji: "👶", image: "assets/images/tenten/ten-neutral.jpeg" },
  smile: { emoji: "😊", image: "assets/images/tenten/ten-happy.png" },
  laugh: { emoji: "😄", image: "assets/images/tenten/ten-happy.png" },
  bigLaugh: { emoji: "🤣", image: "assets/images/tenten/ten-happy.png" },
  cry: { emoji: "😢" },
  sleepy1: { emoji: "😌", image: "assets/images/tenten/ten-sleepy.png" },
  sleepy2: { emoji: "😴" },
  sleep: { emoji: "💤" },
  surprised: { emoji: "😲", image: "assets/images/tenten/ten-surprised.png" },
};

export class BabyReaction {
  // bgEl: 任意。指定すると、表情が変わるたびに同じ画像をこの要素にも
  // 反映する(プレイ画面の背景演出などに使う)。見た目(サイズ・ぼかし等)は
  // CSS側でbgEl固有のクラスに対して調整する想定。
  constructor(el, bgEl) {
    this.el = el;
    this.bgEl = bgEl || null;
    this._timeoutId = null;
    this.baseFace = "neutral"; // 判定演出が終わったら戻る「地の表情」
  }

  setFace(faceKey) {
    const face = FACES[faceKey] || FACES.neutral;
    this._renderInto(this.el, face);
    this._renderInto(this.bgEl, face);
  }

  _renderInto(el, face) {
    if (!el) return;
    if (face.image) {
      el.innerHTML =
        `<img class="baby-face-img" src="${face.image}" alt="" ` +
        `onerror="this.replaceWith(document.createTextNode('${face.emoji}'))">`;
    } else {
      el.textContent = face.emoji;
    }
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
