import { SaveStore, Session } from "./state.js";
import { STAGES, getStage } from "./stage-data.js";
import { RhythmEngine, calcRank } from "./rhythm-engine.js";
import { createFallLaneRenderer } from "./note-renderer.js";
import { createHandApproachRenderer } from "./hand-renderer.js";
import { InputManager } from "./input.js";
import { BabyReaction } from "./baby-reaction.js";
import { Audio_ } from "./audio.js";
import { getBook, getAllBooks, TOTAL_BOOKS } from "./picture-book.js";
import { BookReader } from "./reading.js";
import { VoiceRecorder } from "./recorder.js";
import { MOOD_GAIN, gainMood, getMoodInfo, renderHeartsHTML, pickReaction } from "./baby-mood.js";

const DIFFICULTIES = ["EASY", "NORMAL", "HARD"];
const TOTAL_STAGES = STAGES.length;

let currentEngine = null;
const input = new InputManager();
const recorder = new VoiceRecorder();

function showScreen(id) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
  const target = document.getElementById(`screen-${id}`);
  if (target) target.classList.add("active");
  onScreenEnter(id);
}

function onScreenEnter(id) {
  if (id === "home") renderHome();
  if (id === "stage-select") renderStageSelect();
  if (id === "ehon-dana") renderEhonDana();
  if (id === "settings") renderSettings();
}

function renderMoodGauge(heartsElId, lvElId) {
  const info = getMoodInfo();
  const heartsEl = document.getElementById(heartsElId);
  if (heartsEl) heartsEl.textContent = renderHeartsHTML();
  if (lvElId) {
    const lvEl = document.getElementById(lvElId);
    if (lvEl) lvEl.textContent = `Lv.${info.level}`;
  }
}

function renderHome() {
  renderMoodGauge("home-mood-hearts", "home-mood-lv");
  const endingUnlocked = SaveStore.data.endingUnlocked;
  document.getElementById("home-complete-badge").hidden = !endingUnlocked;
  document.getElementById("btn-ending").hidden = !endingUnlocked;
  new BabyReaction(document.getElementById("home-baby")).setFace("neutral");
}

// ---------------- HOME / NAV ----------------
function bindNav() {
  document.querySelectorAll("[data-nav]").forEach((el) => {
    el.addEventListener("click", () => {
      if (input) input.disable();
      recorder.cancel();
      showScreen(el.dataset.nav);
    });
  });

  document.getElementById("btn-ending").addEventListener("click", () => {
    SaveStore.data.endingViewed = true;
    SaveStore.save();
    showScreen("ending");
  });

  document.getElementById("btn-goto-ending").addEventListener("click", () => {
    SaveStore.data.endingViewed = true;
    SaveStore.save();
    showScreen("ending");
  });

  document.getElementById("btn-quit-stage").addEventListener("click", () => {
    if (!confirm("ステージを ちゅうだんしますか？\n(とちゅうの スコアは きろくされません)")) return;
    abortStage();
    showScreen("stage-select");
  });
}

// プレイ中にステージを途中で抜けるときの後始末(結果は記録しない)
function abortStage() {
  input.disable();
  if (currentEngine) {
    currentEngine.stop();
    currentEngine = null;
  }
  Audio_.stopBGM();
  document.getElementById("rest-indicator").classList.remove("show");
  document.getElementById("game-hint").classList.remove("show");
}

// ---------------- STAGE SELECT ----------------
function renderStageSelect() {
  const list = document.getElementById("stage-list");
  list.innerHTML = "";
  STAGES.forEach((stage) => {
    const unlocked = SaveStore.isStageUnlocked(stage.id);
    const card = document.createElement("div");
    card.className = "stage-card" + (unlocked ? "" : " locked");

    const clears = DIFFICULTIES.map((d) => {
      const done = SaveStore.isDifficultyCleared(stage.id, d);
      return `<span class="clear-chip${done ? " done" : ""}" title="${d}">${d}</span>`;
    }).join("");

    card.innerHTML = `
      ${unlocked ? "" : '<div class="lock-icon">🔒</div>'}
      <div class="stage-num">STAGE ${stage.id}</div>
      <div class="stage-name">${stage.name}</div>
      <div class="stage-clears">${clears}</div>
    `;

    if (unlocked) {
      card.addEventListener("click", () => {
        Session.currentStageId = stage.id;
        showStageInfo(stage.id);
      });
    }
    list.appendChild(card);
  });
}

// ---------------- STAGE INFO ----------------
function showStageInfo(stageId) {
  const stage = getStage(stageId);
  document.getElementById("stage-info-title").textContent = `STAGE ${stage.id}  ${stage.name}`;
  document.getElementById("stage-info-desc").textContent = stage.description;

  const startBtn = document.getElementById("btn-start-stage");
  const diffButtons = document.querySelectorAll("#difficulty-picker .diff-btn");

  Session.currentDifficulty = "EASY";
  diffButtons.forEach((b) => b.classList.toggle("selected", b.dataset.diff === "EASY"));

  diffButtons.forEach((btn) => {
    btn.onclick = () => {
      diffButtons.forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
      Session.currentDifficulty = btn.dataset.diff;
    };
  });

  startBtn.disabled = !!stage.comingSoon;
  startBtn.textContent = stage.comingSoon ? "Coming Soon" : "スタート";
  startBtn.onclick = () => {
    if (stage.comingSoon) return;
    startStage(stage.id, Session.currentDifficulty);
  };

  showScreen("stage-info");
}

const SLEEP_FACES = ["neutral", "sleepy1", "sleepy2", "sleep"];

const VOICE_LINES = {
  PERFECT: ["きゃっ♪", "きゃはは！", "あー！♪"],
  GREAT: ["えへへ♪", "うふふ"],
  GOOD: ["あー", "にこっ"],
  MISS: ["ふぇ……", "ふにゃ……"],
};

function pickVoiceLine(judgment) {
  const lines = VOICE_LINES[judgment];
  return lines[Math.floor(Math.random() * lines.length)];
}

// ---------------- GAME ----------------
function startStage(stageId, difficulty) {
  const stage = getStage(stageId);
  const chart = stage.charts[difficulty];
  showScreen("game");

  document.getElementById("hud-stage-name").textContent = `STAGE ${stage.id} ${stage.name}`;
  document.getElementById("hud-diff").textContent = difficulty;
  document.getElementById("hud-score").textContent = "0";
  document.getElementById("hud-combo").textContent = "0";

  // レーン・タッチボタンのキャプションをステージ内容に合わせて差し替える
  ["A", "Space", "D"].forEach((key) => {
    const label = (stage.laneLabels && stage.laneLabels[key]) || "";
    const captionEl = document.getElementById(`caption-${key}`);
    if (captionEl) captionEl.textContent = label;
    const touchCaptionEl = document.getElementById(`touch-caption-${key}`);
    if (touchCaptionEl) touchCaptionEl.textContent = label;
  });
  document.getElementById("lane-area").classList.toggle("direction-arrows", stage.reactionStyle === "peekaboo");

  // STAGE1は「親の手がてんに近づく」専用レイアウト、それ以外は従来の落下レーン
  const isHandMode = stage.noteStyle === "hand";
  document.getElementById("lane-area").hidden = isHandMode;
  document.getElementById("hand-stage-area").hidden = !isHandMode;
  document.querySelector(".hud-center").hidden = isHandMode;
  const renderer = isHandMode ? createHandApproachRenderer() : createFallLaneRenderer();

  const babyEl = document.getElementById(isHandMode ? "hand-baby-view" : "baby-stage-view");
  const baby = new BabyReaction(babyEl);
  baby.setBaseFace("neutral");

  if (stage.bgmSrc) Audio_.playBGM(stage.bgmSrc);

  const judgePopup = document.getElementById("judge-popup");
  const speechBubble = document.getElementById("speech-bubble");
  const hintEl = document.getElementById("game-hint");
  const restEl = document.getElementById("rest-indicator");

  if (stage.startHint) {
    hintEl.textContent = stage.startHint;
    hintEl.classList.add("show");
    setTimeout(() => hintEl.classList.remove("show"), 1800);
  }

  // STAGE2「ねんね」: 成功が積み重なるほど眠そうになる
  let calmProgress = 0;
  const totalNotes = chart.notes.length;

  input.enable();
  input.onKeyPress = (key) => currentEngine && currentEngine.handleKeyPress(key);
  input.onKeyRelease = (key) => currentEngine && currentEngine.handleKeyRelease(key);

  currentEngine = new RhythmEngine(chart, {
    onJudge(judgment, note) {
      judgePopup.textContent =
        judgment === "PERFECT" ? "PERFECT!" :
        judgment === "GREAT" ? "GREAT!" :
        judgment === "GOOD" ? "GOOD!" : "MISS...";
      judgePopup.className = `judge-popup ${judgment} show`;
      requestAnimationFrame(() => {
        judgePopup.classList.remove("show");
        void judgePopup.offsetWidth;
        judgePopup.classList.add("show");
      });
      Audio_.playHit(judgment);

      // 判定に合わせて、てんの声をふきだしで一瞬表示する
      speechBubble.textContent = pickVoiceLine(judgment);
      speechBubble.classList.remove("show");
      void speechBubble.offsetWidth;
      speechBubble.classList.add("show");

      if (stage.reactionStyle === "sleep" && judgment !== "MISS") {
        calmProgress++;
        const tier = Math.min(3, Math.floor((calmProgress / totalNotes) * 4));
        baby.setBaseFace(SLEEP_FACES[tier]);
      }

      if (stage.reactionStyle === "cheek" && judgment !== "MISS" && note) {
        baby.pokeCheek(note.key);
      }

      if (note && note.special && judgment !== "MISS") {
        baby.playSpecialBaa();
        Audio_.playClear();
      }
    },
    onComboChange(combo) {
      document.getElementById("hud-combo").textContent = String(combo);
      // コンボが伸びるほど、てんが少しずつ楽しそうに跳ねる
      if (combo > 0 && combo % 5 === 0) {
        babyEl.classList.remove("excited");
        void babyEl.offsetWidth;
        babyEl.classList.add("excited");
      }
    },
    onScoreChange(score) {
      document.getElementById("hud-score").textContent = String(score);
    },
    onBabyReact(kind, judgment) {
      if (kind === "cry") {
        baby.reactToJudgment("MISS");
        Audio_.playCry();
      } else {
        baby.reactToJudgment(judgment);
        if (judgment === "PERFECT") Audio_.playLaugh();
        else if (judgment === "GREAT") Audio_.playVoice();
      }
    },
    onRestChange(inRest) {
      restEl.classList.toggle("show", inRest);
    },
    onFinish(stats) {
      finishStage(stage, difficulty, stats);
    },
  }, renderer);

  currentEngine.start();
}

function finishStage(stage, difficulty, stats) {
  input.disable();
  currentEngine.stop();
  currentEngine = null;
  Audio_.stopBGM();
  document.getElementById("rest-indicator").classList.remove("show");
  document.getElementById("game-hint").classList.remove("show");

  const rank = calcRank(stats);
  const cleared = rank !== "C";
  let newEhonUnlocked = false;

  if (cleared) {
    SaveStore.markCleared(stage.id, difficulty);
    newEhonUnlocked = SaveStore.unlockEhon(stage.id);
    const nextStage = getStage(stage.id + 1);
    if (nextStage && !nextStage.comingSoon) {
      SaveStore.unlockStage(nextStage.id);
    }
    // ステージクリアでごきげん少量UP。高評価(S/A)ならさらにボーナス。
    gainMood(MOOD_GAIN.stageClear + (rank === "S" || rank === "A" ? MOOD_GAIN.highRank : 0));
    SaveStore.checkEndingUnlock(TOTAL_STAGES, TOTAL_BOOKS);
  }
  SaveStore.updateBestScore(stage.id, difficulty, stats.score);
  SaveStore.save();

  Session.lastResult = { stage, difficulty, stats, rank, cleared, newEhonUnlocked };
  Audio_.playClear();
  renderResult(Session.lastResult);
  showScreen("result");
}

function renderResult({ stage, stats, rank, cleared, newEhonUnlocked }) {
  document.getElementById("res-score").textContent = stats.score.toLocaleString();
  document.getElementById("res-perfect").textContent = stats.counts.PERFECT;
  document.getElementById("res-great").textContent = stats.counts.GREAT;
  document.getElementById("res-good").textContent = stats.counts.GOOD;
  // 休符ゾーンでの誤入力は、ノーツのMISSとは分けて「おてつき」として添える
  document.getElementById("res-miss").textContent =
    stats.restMisses > 0
      ? `${stats.counts.MISS}（おてつき ${stats.restMisses}）`
      : String(stats.counts.MISS);
  document.getElementById("res-combo").textContent = stats.maxCombo;
  document.getElementById("result-rank").textContent = rank;

  const baby = new BabyReaction(document.getElementById("result-baby"));
  if (cleared && stage.reactionStyle === "sleep") {
    baby.setFace("sleep");
  } else {
    baby.reactToResult(rank);
  }

  const title = document.querySelector(".result-title");
  title.textContent = cleared ? "🎉 STAGE CLEAR!" : "STAGE FINISH";

  const msgEl = document.getElementById("result-message");
  const book = getBook(stage.id);
  const ehonLine = newEhonUnlocked
    ? `🎉 あたらしい えほんを てにいれました！\n『${book.title}』`
    : cleared
    ? "「えほんだな」で よめるよ。"
    : "";

  if (cleared && stage.isFinalStage) {
    msgEl.textContent = `${stage.clearMessage}\n\n🎉 5つの ステージを クリアしました！\n${ehonLine}`;
  } else if (cleared) {
    msgEl.textContent = `${stage.clearMessage}\n${ehonLine}`;
  } else {
    msgEl.textContent = "もうすこし れんしゅうしてみよう！";
  }

  // クリア時は「次のステージ」(STAGE5クリア時は「えほんを読む」)への導線を出す
  const nextBtn = document.getElementById("btn-next-stage");
  const nextStage = getStage(stage.id + 1);
  if (cleared && stage.isFinalStage) {
    nextBtn.hidden = false;
    nextBtn.textContent = "えほんを読む";
    nextBtn.onclick = () => showScreen("ehon-dana");
  } else if (cleared && nextStage && !nextStage.comingSoon) {
    nextBtn.hidden = false;
    nextBtn.textContent = "次のステージ";
    nextBtn.onclick = () => showStageInfo(nextStage.id);
  } else {
    nextBtn.hidden = true;
    nextBtn.onclick = null;
  }
}

function bindResultButtons() {
  document.getElementById("btn-retry").addEventListener("click", () => {
    const { stage, difficulty } = Session.lastResult;
    startStage(stage.id, difficulty);
  });
}

// ---------------- EHON DANA ----------------
// 表紙は絵文字を土台にし、coverImageの読み込みに成功した場合だけ
// 画像で上書き表示する(画像が用意されるまではエラーにならず絵文字のまま)。
function coverMarkup(book) {
  return `<span class="ehon-cover-emoji">${book.cover}</span>` +
    (book.coverImage
      ? `<img class="ehon-cover-img" src="${book.coverImage}" alt="" onerror="this.remove()">`
      : "");
}

function renderEhonDana() {
  renderMoodGauge("ehon-mood-hearts", "ehon-mood-lv");
  const shelf = document.getElementById("ehon-shelf");
  shelf.innerHTML = "";
  getAllBooks().forEach((book) => {
    const owned = SaveStore.hasEhon(book.stageId);
    const item = document.createElement("div");
    item.className = "ehon-item" + (owned ? "" : " locked");
    item.innerHTML = owned
      ? `<div class="ehon-cover">${coverMarkup(book)}</div><div>『${book.title}』</div>`
      : `<div class="ehon-cover">🔒</div><div>？？？</div><div class="ehon-hint">STAGE ${book.stageId} クリアで かいほう</div>`;
    if (owned) {
      item.addEventListener("click", () => showEhonDetail(book));
    }
    shelf.appendChild(item);
  });

  const completeBanner = document.getElementById("ehon-complete-banner");
  completeBanner.hidden = !SaveStore.hasAllEhon(TOTAL_BOOKS);
}

let activeBook = null;
let activeReader = null;
let usedRecordedVoice = false;

function showEhonPanel(panelId) {
  document.querySelectorAll("#screen-ehon-view .ehon-panel").forEach((p) => p.classList.remove("active"));
  document.getElementById(panelId).classList.add("active");
}

function showEhonDetail(book) {
  activeBook = book;
  usedRecordedVoice = false;
  document.getElementById("ehon-view-title").textContent = book.title;
  document.getElementById("ehon-detail-cover").innerHTML = coverMarkup(book);
  document.getElementById("ehon-detail-desc").textContent = book.description;
  showEhonPanel("ehon-panel-detail");
  showScreen("ehon-view");
}

function startReading() {
  activeReader = new BookReader(activeBook);
  renderReadingPage();
  showEhonPanel("ehon-panel-reading");
}

// 挿絵は用意されていれば表示し、読み込みに失敗した場合(未配置・パス誤りなど)は
// 「準備中」プレースホルダーに差し替える。挿絵が設定されていないページでは
// 画像枠自体を表示しない。どちらの場合もページ送りは継続できる。
function pageImageMarkup(imagePath) {
  if (!imagePath) return "";
  return `<img class="ehon-page-image-img" src="${imagePath}" alt="" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'ehon-page-image-placeholder',textContent:'🖼️ がぞうを じゅんびちゅうです'}))">`;
}

function renderReadingPage() {
  document.getElementById("ehon-page-image").innerHTML = pageImageMarkup(activeReader.currentImage());
  document.getElementById("ehon-page").textContent = activeReader.currentText();
  document.getElementById("page-indicator").textContent =
    `${activeReader.pageIndex + 1} / ${activeReader.totalPages}`;
  document.getElementById("btn-page-prev").disabled = activeReader.isFirstPage();
  document.getElementById("btn-page-next").textContent = activeReader.isLastPage() ? "よみおわる" : "つぎへ →";

  const readingBaby = new BabyReaction(document.getElementById("reading-baby"));
  readingBaby.setFace(["neutral", "smile", "laugh"][Math.floor(Math.random() * 3)]);
  Audio_.playHit("GOOD");
}

function finishReading() {
  const gained = usedRecordedVoice ? MOOD_GAIN.readBookRecorded : MOOD_GAIN.readBook;
  const info = gainMood(gained);
  SaveStore.checkEndingUnlock(TOTAL_STAGES, TOTAL_BOOKS);
  SaveStore.save();

  // エンディングはSTAGE5クリア時点ですでに解放されている場合があるため、
  // 「今回はじめて解放されたか」ではなく「解放済みかつ未視聴か」で案内を出す。
  const canSeeEnding = SaveStore.data.endingUnlocked && !SaveStore.data.endingViewed;

  document.getElementById("finish-voice").textContent = `「${pickReaction()}」`;
  document.getElementById("finish-note").textContent = usedRecordedVoice
    ? "てんは、あなたの こえを うれしそうに きいています。"
    : "てんは うれしそうです。";
  document.getElementById("finish-mood-hearts").textContent = renderHeartsHTML();

  const finishBaby = new BabyReaction(document.getElementById("finish-baby"));
  finishBaby.setFace(info.level >= 4 ? "bigLaugh" : "laugh");

  const endingBtn = document.getElementById("btn-goto-ending");
  endingBtn.hidden = !canSeeEnding;
  if (canSeeEnding) {
    document.getElementById("finish-note").textContent =
      "🎉 5冊の えほんが あつまりました！\nてんとの ものがたりを さいごまで みとどけよう。";
  }

  showEhonPanel("ehon-panel-finish");
}

function bindEhonView() {
  document.getElementById("btn-read-normal").addEventListener("click", () => {
    usedRecordedVoice = false;
    startReading();
  });

  document.getElementById("btn-page-prev").addEventListener("click", () => {
    activeReader.prev();
    renderReadingPage();
  });

  document.getElementById("btn-page-next").addEventListener("click", () => {
    if (activeReader.isLastPage()) {
      finishReading();
    } else {
      activeReader.next();
      renderReadingPage();
    }
  });

  // ---- 録音して読む ----
  const recStatus = document.getElementById("record-status");
  const recStart = document.getElementById("btn-record-start");
  const recStop = document.getElementById("btn-record-stop");
  const recPlayback = document.getElementById("record-playback");
  const recPlay = document.getElementById("btn-record-play");
  const recRetry = document.getElementById("btn-record-retry");
  const recUse = document.getElementById("btn-record-use");

  function resetRecordPanel() {
    recStatus.textContent = recorder.isAvailable() ? "🎤 じゅんび中" : "🎤 マイクが つかえません";
    recStart.hidden = !recorder.isAvailable();
    recStop.hidden = true;
    recPlayback.hidden = true;
    recPlay.hidden = true;
    recRetry.hidden = true;
    recUse.hidden = true;
  }

  document.getElementById("btn-read-record").addEventListener("click", () => {
    recorder.reset();
    resetRecordPanel();
    showEhonPanel("ehon-panel-record");
  });

  recStart.addEventListener("click", async () => {
    try {
      await recorder.start();
      recStatus.textContent = "🔴 ろくおん中……";
      recStart.hidden = true;
      recStop.hidden = false;
    } catch (e) {
      recStatus.textContent = "マイクが りようできないため、つうじょうの よみきかせを りようしてください。";
      recStart.hidden = true;
    }
  });

  recStop.addEventListener("click", async () => {
    try {
      const url = await recorder.stop();
      recPlayback.src = url;
      recPlayback.hidden = false;
      recPlay.hidden = false;
      recRetry.hidden = false;
      recUse.hidden = false;
      recStop.hidden = true;
      recStatus.textContent = "🎤 ろくおん かんりょう";
    } catch (e) {
      recStatus.textContent = "ろくおんに しっぱいしました。もういちど おためしください。";
      recStop.hidden = true;
      recStart.hidden = false;
    }
  });

  recPlay.addEventListener("click", () => {
    recPlayback.play().catch(() => {});
  });

  recRetry.addEventListener("click", () => {
    recorder.reset();
    resetRecordPanel();
  });

  recUse.addEventListener("click", () => {
    usedRecordedVoice = true;
    startReading();
  });

  document.getElementById("btn-record-cancel").addEventListener("click", () => {
    recorder.cancel();
    showEhonPanel("ehon-panel-detail");
  });
}

// ---------------- SETTINGS ----------------
function renderSettings() {
  document.getElementById("vol-bgm").value = SaveStore.data.volume.bgm;
  document.getElementById("vol-se").value = SaveStore.data.volume.se;

  document.querySelectorAll("#bgm-onoff-toggle .toggle-btn").forEach((btn) => {
    btn.classList.toggle("selected", (btn.dataset.onoff === "on") === Audio_.enabled.bgm);
  });
  document.querySelectorAll("#se-onoff-toggle .toggle-btn").forEach((btn) => {
    btn.classList.toggle("selected", (btn.dataset.onoff === "on") === Audio_.enabled.se);
  });
}

function bindSettings() {
  document.getElementById("vol-bgm").addEventListener("input", (e) => {
    SaveStore.data.volume.bgm = Number(e.target.value);
    Audio_.setVolume("bgm", SaveStore.data.volume.bgm);
    SaveStore.save();
  });
  document.getElementById("vol-se").addEventListener("input", (e) => {
    SaveStore.data.volume.se = Number(e.target.value);
    Audio_.setVolume("se", SaveStore.data.volume.se);
    SaveStore.save();
  });

  document.querySelectorAll("#bgm-onoff-toggle .toggle-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      Audio_.setEnabled("bgm", btn.dataset.onoff === "on");
      renderSettings();
    });
  });
  document.querySelectorAll("#se-onoff-toggle .toggle-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      Audio_.setEnabled("se", btn.dataset.onoff === "on");
      renderSettings();
    });
  });

  document.getElementById("btn-reset-save").addEventListener("click", () => {
    if (confirm("セーブデータを すべて さくじょしますか？\nステージの クリアじょうきょう・えほん・ごきげんが すべて きえます。")) {
      SaveStore.reset();
      renderSettings();
      showScreen("home");
    }
  });
}

export function initScreens() {
  bindNav();
  bindResultButtons();
  bindSettings();
  bindEhonView();
  Audio_.setVolume("bgm", SaveStore.data.volume.bgm);
  Audio_.setVolume("se", SaveStore.data.volume.se);
  showScreen("home");
}
