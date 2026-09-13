// STAGE1専用レンダラー:「親の手が てんに近づいてくる」演出。
// RhythmEngineから見ればfall-lane版と同じインターフェース
// ({spawn,updatePosition,setHolding,resolve,clear})を満たすだけで、
// 判定ロジック(タイミング・PERFECT/GREAT/GOOD/MISS)には一切関与しない。
//
// A: 左から中央(てん)へ / Space: 下(正面)から中央へ / D: 右から中央へ

function positionFor(key, frac) {
  const t = Math.max(0, Math.min(frac, 1.3));
  if (key === "A") return { left: `${t * 100}%`, top: "50%" };
  if (key === "D") return { left: `${(1 - t) * 100}%`, top: "50%" };
  return { left: "50%", top: `${(1 - t) * 100}%` }; // Space
}

export function createHandApproachRenderer() {
  const zones = {
    A: document.getElementById("hand-zone-A"),
    Space: document.getElementById("hand-zone-Space"),
    D: document.getElementById("hand-zone-D"),
  };
  const stageArea = document.getElementById("hand-stage-area");
  const ring = document.getElementById("judge-ring");

  function spawnRipple(judgment) {
    if (!stageArea || judgment === "MISS") return;
    const ripple = document.createElement("div");
    ripple.className = `ripple ripple-${judgment.toLowerCase()}`;
    stageArea.appendChild(ripple);
    setTimeout(() => ripple.remove(), 500);
  }

  function pulseRing(judgment) {
    if (!ring) return;
    ring.classList.remove("ring-perfect", "ring-great", "ring-good", "ring-miss");
    void ring.offsetWidth;
    ring.classList.add(`ring-${judgment.toLowerCase()}`);
  }

  return {
    spawn(note) {
      const zone = zones[note.key];
      if (!zone) return;
      const el = document.createElement("div");
      el.className = "hand-note" + (note.special ? " special" : "");
      el.textContent = "👋";
      const pos = positionFor(note.key, 0);
      el.style.left = pos.left;
      el.style.top = pos.top;
      zone.appendChild(el);
      note.el = el;
    },

    updatePosition(note, frac) {
      if (!note.el) return;
      const pos = positionFor(note.key, frac);
      note.el.style.left = pos.left;
      note.el.style.top = pos.top;
    },

    setHolding(note, isHolding) {
      if (note.el) note.el.classList.toggle("holding", isHolding);
    },

    resolve(note, judgment) {
      pulseRing(judgment);
      if (!note.el) return;
      const el = note.el;
      el.classList.remove("holding");
      if (judgment === "MISS") {
        el.classList.add("hand-miss");
      } else {
        el.classList.add("hand-hit");
        spawnRipple(judgment);
      }
      setTimeout(() => el.remove(), 220);
    },

    clear() {
      Object.values(zones).forEach((z) => z && (z.innerHTML = ""));
      if (stageArea) {
        stageArea.querySelectorAll(".ripple").forEach((r) => r.remove());
      }
    },
  };
}
