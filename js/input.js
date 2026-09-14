// 入力管理。キーボード(A / Space / D)とタッチボタンを統一的な
// onKeyPress(key) コールバックに変換する。ゲームロジックからは独立している。

const KEYCODE_TO_GAMEKEY = {
  KeyA: "A",
  Space: "Space",
  KeyD: "D",
};

export class InputManager {
  constructor() {
    this.onKeyPress = null; // (key: "A"|"Space"|"D") => void
    this.onKeyRelease = null;
    this._enabled = false;
    this._touchBound = false; // タッチボタンのリスナーはアプリ全体で一度だけ登録する
    this._pressed = new Set();

    this._handleKeyDown = this._handleKeyDown.bind(this);
    this._handleKeyUp = this._handleKeyUp.bind(this);
  }

  enable() {
    if (this._enabled) return;
    this._enabled = true;
    window.addEventListener("keydown", this._handleKeyDown);
    window.addEventListener("keyup", this._handleKeyUp);
    if (!this._touchBound) {
      this._bindTouchButtons();
      this._touchBound = true;
    }
  }

  disable() {
    this._enabled = false;
    window.removeEventListener("keydown", this._handleKeyDown);
    window.removeEventListener("keyup", this._handleKeyUp);
    this._pressed.clear();
  }

  _handleKeyDown(e) {
    const key = KEYCODE_TO_GAMEKEY[e.code];
    if (!key) return;
    e.preventDefault();
    if (this._pressed.has(key)) return; // キーリピート無視
    this._pressed.add(key);
    this._flashTouchButton(key, true);
    this.onKeyPress && this.onKeyPress(key);
  }

  _handleKeyUp(e) {
    const key = KEYCODE_TO_GAMEKEY[e.code];
    if (!key) return;
    this._pressed.delete(key);
    this._flashTouchButton(key, false);
    this.onKeyRelease && this.onKeyRelease(key);
  }

  _bindTouchButtons() {
    const buttons = document.querySelectorAll("#touch-controls .touch-btn");
    buttons.forEach((btn) => {
      const key = btn.dataset.key;
      const press = (e) => {
        e.preventDefault();
        btn.classList.add("pressed");
        this.onKeyPress && this.onKeyPress(key);
      };
      const release = (e) => {
        e.preventDefault();
        btn.classList.remove("pressed");
        this.onKeyRelease && this.onKeyRelease(key);
      };
      btn.addEventListener("touchstart", press, { passive: false });
      btn.addEventListener("touchend", release, { passive: false });
      // touchcancel(スクロール割り込み等で発生)を離しとして扱わないと、
      // ホールド系ノーツ(STAGE2)でそのレーンが押しっぱなし扱いのまま
      // 次の入力を受け付けなくなってしまう。
      btn.addEventListener("touchcancel", release, { passive: false });
      btn.addEventListener("mousedown", press);
      btn.addEventListener("mouseup", release);
      btn.addEventListener("mouseleave", release);
    });
  }

  _flashTouchButton(key, pressed) {
    const btn = document.querySelector(`#touch-controls .touch-btn[data-key="${key}"]`);
    if (!btn) return;
    btn.classList.toggle("pressed", pressed);
  }
}
