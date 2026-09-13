// 「じぶんの こえで よみきかせ」のための、シンプルな録音マネージャ。
// MediaRecorder / getUserMedia が使えない・許可されない環境でも
// ゲーム全体が壊れないよう、失敗は例外ではなく戻り値/例外メッセージで扱う。
// 録音データはメモリ上のBlob URLとして一時的に保持するだけで、
// localStorageや外部サーバーには一切送信しない。

export class VoiceRecorder {
  constructor() {
    this.available = !!(
      navigator.mediaDevices &&
      navigator.mediaDevices.getUserMedia &&
      window.MediaRecorder
    );
    this.mediaRecorder = null;
    this.stream = null;
    this.chunks = [];
    this.audioUrl = null;
  }

  isAvailable() {
    return this.available;
  }

  async start() {
    if (!this.available) {
      throw new Error("このブラウザは録音に対応していません");
    }
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.chunks = [];
    this.mediaRecorder = new MediaRecorder(this.stream);
    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) this.chunks.push(e.data);
    };
    this.mediaRecorder.start();
  }

  stop() {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error("録音が開始されていません"));
        return;
      }
      this.mediaRecorder.onstop = () => {
        try {
          const blob = new Blob(this.chunks, { type: "audio/webm" });
          this._releaseUrl();
          this.audioUrl = URL.createObjectURL(blob);
          this._releaseStream();
          resolve(this.audioUrl);
        } catch (e) {
          reject(e);
        }
      };
      this.mediaRecorder.stop();
    });
  }

  cancel() {
    if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
      this.mediaRecorder.stop();
    }
    this._releaseStream();
  }

  reset() {
    this._releaseUrl();
    this.chunks = [];
  }

  _releaseStream() {
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
  }

  _releaseUrl() {
    if (this.audioUrl) {
      URL.revokeObjectURL(this.audioUrl);
      this.audioUrl = null;
    }
  }
}
