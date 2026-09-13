// STAGE1専用レンダラー:「親の手が てんに近づいてくる」演出。
// RhythmEngineから見ればfall-lane版と同じインターフェース
// ({spawn,updatePosition,setHolding,resolve,clear})を満たすだけで、
// 判定ロジック(タイミング・PERFECT/GREAT/GOOD/MISS)には一切関与しない。
//
// A: 左から中央(てん)へ / Space: 下(正面)から中央へ / D: 右から中央へ
// 手は近づくほど少しずつ大きくなり、判定リング付近で最大になる。

const ANTICIPATE_THRESHOLD = 0.7; // このfracを超えると「もうすぐ来る」とみなしリングを強調

function positionFor(key, frac) {
  const t = Math.max(0, Math.min(frac, 1.3));
  const scale = 0.55 + Math.min(t, 1) * 0.55; // 0.55(出現時) 〜 1.1(到達時)
  if (key === "A") return { left: `${t * 100}%`, top: "50%", scale };
  if (key === "D") return { left: `${(1 - t) * 100}%`, top: "50%", scale };
  return { left: "50%", top: `${(1 - t) * 100}%`, scale }; // Space
}

function applyPosition(el, pos) {
  el.style.left = pos.left;
  el.style.top = pos.top;
  el.style.transform = `translate(-50%, -50%) scale(${pos.scale.toFixed(2)})`;
}

export function createHandApproachRenderer() {
  const zones = {
    A: document.getElementById("hand-zone-A"),
    Space: document.getElementById("hand-zone-Space"),
    D: document.getElementById("hand-zone-D"),
  };
  const stageArea = document.getElementById("hand-stage-area");
  const ring = document.getElementById("judge-ring");

  let approachingCount = 0;

  function setApproaching(note, isApproaching) {
    if (note._approaching === isApproaching) return;
    note._approaching = isApproaching;
    approachingCount += isApproaching ? 1 : -1;
    if (ring) ring.classList.toggle("anticipate", approachingCount > 0);
  }

  function spawnRipple(judgment) {
    if (!stageArea || judgment === "MISS") return;
    const ripple = document.createElement("div");
    ripple.className = `ripple ripple-${judgment.toLowerCase()}`;
    stageArea.appendChild(ripple);
    setTimeout(() => ripple.remove(), 500);
  }

  function spawnSparkle() {
    if (!stageArea) return;
    const positions = [
      { dx: -26, dy: -10 },
      { dx: 24, dy: -14 },
      { dx: 0, dy: -26 },
    ];
    positions.forEach(({ dx, dy }, i) => {
      const s = document.createElement("div");
      s.className = "sparkle";
      s.textContent = "✨";
      s.style.marginLeft = `${dx}px`;
      s.style.marginTop = `${dy}px`;
      s.style.animationDelay = `${i * 40}ms`;
      stageArea.appendChild(s);
      setTimeout(() => s.remove(), 700);
    });
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
      applyPosition(el, positionFor(note.key, 0));
      zone.appendChild(el);
      note.el = el;
      note._approaching = false;
    },

    updatePosition(note, frac) {
      if (!note.el) return;
      const pos = positionFor(note.key, frac);
      applyPosition(note.el, pos);
      setApproaching(note, frac >= ANTICIPATE_THRESHOLD && frac < 1.3);
    },

    setHolding(note, isHolding) {
      if (note.el) note.el.classList.toggle("holding", isHolding);
    },

    resolve(note, judgment) {
      if (note._approaching) setApproaching(note, false);
      pulseRing(judgment);
      if (judgment === "PERFECT") spawnSparkle();
      if (!note.el) return;
      const el = note.el;
      el.classList.remove("holding");
      if (judgment === "MISS") {
        el.classList.add("hand-miss");
      } else {
        el.classList.add("hand-hit");
        spawnRipple(judgment);
      }
      setTimeout(() => el.remove(), 250);
    },

    clear() {
      Object.values(zones).forEach((z) => z && (z.innerHTML = ""));
      if (stageArea) {
        stageArea.querySelectorAll(".ripple, .sparkle").forEach((el) => el.remove());
      }
      if (ring) ring.classList.remove("anticipate");
      approachingCount = 0;
    },
  };
}
