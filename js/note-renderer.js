// STAGE2〜5で使用する「上から降ってくるノーツ」のレンダラー。
// RhythmEngineは判定ロジックだけを持ち、見た目の生成・移動・演出は
// このレンダラー(NoteRenderer)が担当する。将来ステージ固有の見た目を
// 追加する場合は、同じインターフェース({spawn,updatePosition,setHolding,resolve,clear})
// を満たす別のレンダラーを用意すればよい。

export function createFallLaneRenderer() {
  const tracks = {
    A: document.getElementById("track-A"),
    Space: document.getElementById("track-Space"),
    D: document.getElementById("track-D"),
  };

  return {
    spawn(note) {
      const track = tracks[note.key];
      if (!track) return;
      const el = document.createElement("div");
      el.className = "note" + (note.hold ? " hold" : "") + (note.special ? " special" : "");
      el.style.top = "-40px";
      if (note.hold) {
        el.style.height = `${26 + note.hold / 12}px`;
      }
      track.appendChild(el);
      note.el = el;
    },

    updatePosition(note, frac) {
      if (!note.el) return;
      const track = note.el.parentElement;
      const trackHeight = track ? track.clientHeight : 400;
      const judgeY = trackHeight * 0.86;
      const top = Math.min(frac, 1.3) * judgeY;
      // ホールドノーツは下方向に帯が伸びた分だけ判定ラインへの到達(＝押すタイミング)が
      // 見た目より早く見えてしまうため、帯の下端がタップ用ノーツと同じ位置に
      // 揃うよう、伸ばした高さの分だけ上端を引き上げる。
      const holdHeightOffset = note.hold ? note.hold / 12 : 0;
      note.el.style.top = `${top - 17 - holdHeightOffset}px`;
    },

    setHolding(note, isHolding) {
      if (note.el) note.el.classList.toggle("holding", isHolding);
    },

    resolve(note, judgment) {
      if (!note.el) return;
      note.el.classList.remove("holding");
      note.el.classList.add("hit");
      const el = note.el;
      setTimeout(() => el.remove(), 200);
    },

    clear() {
      Object.values(tracks).forEach((t) => t && (t.innerHTML = ""));
    },
  };
}
