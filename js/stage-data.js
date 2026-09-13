// ステージ定義とノーツチャートデータ。
// ノーツ: { t: 出現(判定)時刻ms, key: "A"|"Space"|"D", hold: 長押し時間ms(任意) }
// 拡張しやすいように、ステージごとに難易度別のノーツ配列を持たせる。

function seq(startTime, interval, keys) {
  return keys.map((key, i) => ({ t: startTime + i * interval, key }));
}

// ---- STAGE 1: ミルクのあとにトントン ----
// EASY: Space中心。ゆったりした間隔で、リズムの基本だけを覚える。
const stage1Easy = [
  { t: 2000, key: "Space" },
  { t: 3100, key: "Space" },
  { t: 4200, key: "Space" },
  { t: 5500, key: "Space" },
  { t: 7000, key: "Space" },
  { t: 8100, key: "Space" },
  { t: 9200, key: "Space" },
  { t: 10500, key: "Space" },
  { t: 12000, key: "Space" },
  { t: 13100, key: "Space" },
];

// NORMAL: 前半はSpace+A、後半からDが加わる。間隔も少しずつ詰まる。
const stage1Normal = [
  { t: 2000, key: "Space" },
  { t: 2800, key: "A" },
  { t: 3600, key: "Space" },
  { t: 4400, key: "A" },
  { t: 5200, key: "Space" },
  { t: 6000, key: "A" },
  { t: 7200, key: "Space" },
  { t: 7900, key: "A" },
  { t: 8600, key: "D" },
  { t: 9300, key: "Space" },
  { t: 10000, key: "A" },
  { t: 10700, key: "D" },
  { t: 11400, key: "Space" },
  { t: 12100, key: "A" },
  { t: 12800, key: "D" },
];

// HARD: A/Space/Dを均等に使い、後半に2〜3連続の入力を無理のない間隔(300ms)で追加。
const stage1Hard = [
  { t: 2000, key: "Space" },
  { t: 2650, key: "A" },
  { t: 3300, key: "D" },
  { t: 3950, key: "Space" },
  { t: 4600, key: "A" },
  { t: 5250, key: "D" },
  { t: 5900, key: "Space" },
  { t: 6550, key: "A" },
  { t: 7200, key: "D" },
  { t: 7850, key: "Space" },
  // 2連続(300ms間隔)
  { t: 8500, key: "A" },
  { t: 8800, key: "A" },
  { t: 9500, key: "D" },
  { t: 10150, key: "Space" },
  { t: 10800, key: "A" },
  { t: 11450, key: "D" },
  // 3連続(300ms間隔)で締めくくる
  { t: 12100, key: "Space" },
  { t: 12400, key: "A" },
  { t: 12700, key: "D" },
  { t: 13400, key: "Space" },
];

// ---- STAGE 2: ねんね（長押し中心） ----
const stage2Easy = [
  { t: 2000, key: "A", hold: 1000 },
  { t: 4200, key: "Space", hold: 1000 },
  { t: 6400, key: "D", hold: 1000 },
  { t: 8600, key: "A", hold: 1200 },
  { t: 11000, key: "Space", hold: 1200 },
  { t: 13400, key: "D", hold: 1200 },
  { t: 15800, key: "A", hold: 1400 },
  { t: 18400, key: "Space", hold: 1600 },
];

const stage2Normal = [
  { t: 2000, key: "A", hold: 900 },
  { t: 3400, key: "Space" },
  { t: 4400, key: "D", hold: 900 },
  { t: 5800, key: "Space" },
  { t: 7000, key: "A", hold: 800 },
  { t: 8300, key: "D" },
  { t: 9000, key: "Space", hold: 800 },
  { t: 10300, key: "A" },
  { t: 11000, key: "D", hold: 1000 },
  { t: 12500, key: "Space" },
  { t: 13300, key: "A", hold: 900 },
  { t: 14700, key: "D" },
];

const stage2Hard = [
  { t: 2000, key: "A", hold: 700 },
  { t: 3000, key: "Space" },
  { t: 3600, key: "D", hold: 700 },
  { t: 4600, key: "A" },
  { t: 5200, key: "Space", hold: 800 },
  { t: 6400, key: "D" },
  { t: 6900, key: "A", hold: 600 },
  { t: 7800, key: "D", hold: 600 },
  { t: 8700, key: "Space" },
  { t: 9300, key: "A" },
  { t: 9900, key: "D", hold: 800 },
  { t: 11100, key: "Space", hold: 900 },
  { t: 12300, key: "A" },
  { t: 12800, key: "D" },
  { t: 13400, key: "Space", hold: 1000 },
];

// ---- STAGE 3: ほっぺぷにぷに（左右・中央の方向判定） ----
const stage3Easy = [
  ...seq(2000, 1000, ["A", "D", "A", "D"]),
  ...seq(6500, 900, ["A", "D", "A"]),
  ...seq(9800, 850, ["A", "Space", "D", "A"]),
  ...seq(13500, 750, ["D", "A", "D", "Space", "A"]),
];

const stage3Normal = [
  { t: 2000, key: "A" }, { t: 2700, key: "A" }, { t: 3400, key: "D" },
  { t: 4100, key: "Space" }, { t: 4800, key: "D" }, { t: 5500, key: "A" },
  { t: 6600, key: "D" }, { t: 7200, key: "D" }, { t: 7800, key: "A" },
  { t: 8400, key: "Space" }, { t: 9000, key: "A" }, { t: 9600, key: "D" },
  { t: 10700, key: "A" }, { t: 11200, key: "D" }, { t: 11700, key: "Space" },
  { t: 12200, key: "Space" }, { t: 12700, key: "A" }, { t: 13200, key: "D" },
];

const stage3Hard = [
  { t: 2000, key: "A" }, { t: 2500, key: "D" }, { t: 3000, key: "Space" },
  { t: 3500, key: "Space" }, { t: 4000, key: "A" }, { t: 4500, key: "A" },
  { t: 5000, key: "D" }, { t: 5500, key: "Space" },
  { t: 6500, key: "D" }, { t: 6900, key: "Space" }, { t: 7300, key: "A" },
  { t: 7700, key: "D" }, { t: 8100, key: "Space" }, { t: 8500, key: "A" },
  { t: 9500, key: "A" }, { t: 9900, key: "D" }, { t: 10300, key: "Space" },
  { t: 10700, key: "A" }, { t: 11100, key: "D" }, { t: 11500, key: "D" },
  { t: 11900, key: "Space" }, { t: 12300, key: "A" },
];

// ---- STAGE 4: こちょこちょ（連打・速度変化・休符） ----
const stage4Easy = [
  { t: 2000, key: "Space" }, { t: 3200, key: "Space" }, { t: 4400, key: "Space" }, { t: 5600, key: "Space" },
  { t: 7400, key: "A" }, { t: 8400, key: "D" }, { t: 9400, key: "A" }, { t: 10400, key: "D" },
  { t: 13400, key: "Space" }, { t: 13650, key: "Space" },
  { t: 15000, key: "A" }, { t: 15250, key: "D" },
];
const stage4EasyRests = [{ start: 10600, end: 13200 }];

const stage4Normal = [
  { t: 2000, key: "A" }, { t: 2500, key: "A" }, { t: 3000, key: "D" }, { t: 3500, key: "Space" },
  { t: 4500, key: "D" }, { t: 5000, key: "D" }, { t: 5500, key: "A" },
  { t: 8500, key: "Space" }, { t: 9000, key: "A" }, { t: 9500, key: "D" },
  { t: 10300, key: "A" }, { t: 10550, key: "A" }, { t: 10800, key: "D" },
  { t: 11600, key: "Space" }, { t: 12100, key: "A" }, { t: 12600, key: "D" },
];
const stage4NormalRests = [{ start: 5700, end: 8300 }];

const stage4Hard = [
  { t: 2000, key: "Space" }, { t: 2350, key: "A" }, { t: 2700, key: "D" },
  { t: 3050, key: "Space" }, { t: 3400, key: "A" }, { t: 3750, key: "D" },
  { t: 6200, key: "A" }, { t: 6450, key: "A" }, { t: 6700, key: "A" }, { t: 6950, key: "D" }, { t: 7200, key: "Space" },
  { t: 8200, key: "D" }, { t: 8450, key: "Space" }, { t: 8700, key: "A" },
  { t: 9500, key: "Space" }, { t: 9750, key: "A" }, { t: 10000, key: "D" },
];
const stage4HardRests = [{ start: 3950, end: 6000 }];

// ---- STAGE 5: いないいないばあ（集大成） ----
const stage5Easy = [
  { t: 2000, key: "A" }, { t: 3200, key: "D" }, { t: 4400, key: "A" }, { t: 5600, key: "D" },
  { t: 7200, key: "A" }, { t: 8400, key: "D" }, { t: 9600, key: "Space" }, { t: 10800, key: "A" },
  { t: 12400, key: "D", special: true },
];

const stage5Normal = [
  { t: 2000, key: "A" }, { t: 2700, key: "D" }, { t: 3400, key: "Space" }, { t: 4100, key: "A" },
  { t: 4800, key: "Space" }, { t: 5500, key: "D" },
  { t: 6600, key: "A", hold: 600 },
  { t: 7900, key: "Space" },
  { t: 8900, key: "D" }, { t: 9600, key: "A" }, { t: 10300, key: "Space" },
  { t: 11000, key: "D", special: true },
];

const stage5Hard = [
  { t: 2000, key: "A" }, { t: 2500, key: "Space" }, { t: 3000, key: "D" },
  { t: 3500, key: "A" }, { t: 4000, key: "D" }, { t: 4500, key: "Space" },
  { t: 5500, key: "A", hold: 700 },
  { t: 6900, key: "Space" },
  { t: 7400, key: "D" },
  { t: 10200, key: "A" }, { t: 10450, key: "A" }, { t: 10700, key: "D" }, { t: 10950, key: "Space" },
  { t: 11800, key: "D", hold: 600 },
  { t: 13100, key: "A" },
  { t: 13600, key: "Space", special: true },
];
const stage5HardRests = [{ start: 7700, end: 10000 }];

export const STAGES = [
  {
    id: 1,
    name: "ミルクのあとにトントン",
    type: "tap",
    reactionStyle: "basic",
    noteStyle: "hand", // 親の手がてんに近づいてくる方式(STAGE1専用)
    bgmSrc: "assets/sounds/bgm/stage1.mp3",
    description:
      "ミルクを のんだ てんの せなかを、\nやさしく トントンしてあげよう。\n\nSpace / A / D の3つのキーで リズムに あわせて トントンしよう。",
    keys: ["A", "Space", "D"],
    laneLabels: { A: "トントン", Space: "トントン", D: "トントン" },
    startHint: "てんの せなかを トントンしよう",
    clearMessage: "トントン、じょうずに できたね！\nてんが げっぷをして、にっこり わらいました。",
    ehonTitle: "げっぷと えがお",
    ehonBody:
      "むかしむかし……ではなく、きょうのおはなし。\n\nミルクを のんだ てんの せなかを、\nやさしく トントン すると――\n『ぷはっ』\n\nてんは にっこり わらいました。\nおとうさんも おかあさんも、\nいっしょに にっこり。",
    charts: {
      EASY: { travelTime: 2400, judge: { perfect: 110, great: 190, good: 300 }, notes: stage1Easy },
      NORMAL: { travelTime: 1900, judge: { perfect: 80, great: 150, good: 250 }, notes: stage1Normal },
      HARD: { travelTime: 1600, judge: { perfect: 60, great: 120, good: 200 }, notes: stage1Hard },
    },
  },
  {
    id: 2,
    name: "ねんね",
    type: "hold",
    reactionStyle: "sleep",
    description:
      "てんを やさしく ねかしつけよう。\n\nSpace：トントン／A：なでる／D：ゆらす\nキーを おした ながさも たいせつ。長押しで じっくり あやしてあげよう。",
    keys: ["A", "Space", "D"],
    laneLabels: { A: "なでる", Space: "トントン", D: "ゆらす" },
    startHint: "てんを ゆっくり ねかせよう",
    clearMessage: "てんは ぐっすり ねむりました",
    ehonTitle: "おやすみ てん",
    ehonBody:
      "とんとん……ゆらゆら……\n\nてんの まぶたが、だんだん おもくなる。\n『……すぅ、すぅ』\n\nてんは ぐっすり ねむりました。\nおやすみ、てん。また あした。",
    charts: {
      EASY: { travelTime: 2200, judge: { perfect: 110, great: 190, good: 300 }, notes: stage2Easy },
      NORMAL: { travelTime: 1900, judge: { perfect: 90, great: 160, good: 260 }, notes: stage2Normal },
      HARD: { travelTime: 1600, judge: { perfect: 70, great: 130, good: 220 }, notes: stage2Hard },
    },
  },
  {
    id: 3,
    name: "ほっぺぷにぷに",
    type: "direction",
    reactionStyle: "cheek",
    description:
      "てんの ほっぺを やさしく ぷにぷにしよう。\n\nA：ひだりほっぺ／Space：りょうほっぺ／D：みぎほっぺ",
    keys: ["A", "Space", "D"],
    laneLabels: { A: "左ほっぺ", Space: "両ほっぺ", D: "右ほっぺ" },
    startHint: "ほっぺを ぷにぷにしよう",
    clearMessage: "てんは きゃっきゃと よろこびました",
    ehonTitle: "ぷにぷに にっき",
    ehonBody:
      "ひだり、ぷにっ。\nみぎ、ぷにっ。\nりょうほう、ぷにぷにっ。\n\n『きゃっ♪』\n\nてんは とっても きもちよさそう。\nもっと ぷにぷにしてほしいな。",
    charts: {
      EASY: { travelTime: 2200, judge: { perfect: 100, great: 180, good: 280 }, notes: stage3Easy },
      NORMAL: { travelTime: 1900, judge: { perfect: 80, great: 150, good: 250 }, notes: stage3Normal },
      HARD: { travelTime: 1600, judge: { perfect: 60, great: 120, good: 200 }, notes: stage3Hard },
    },
  },
  {
    id: 4,
    name: "こちょこちょ",
    type: "tickle",
    reactionStyle: "tickle",
    description:
      "てんを やさしく こちょこちょ しよう。\n\nA：ひだり／Space：おなか／D：みぎ\n\n『やすみ』の あいだは キーを おさないでね。",
    keys: ["A", "Space", "D"],
    laneLabels: { A: "こちょこちょ", Space: "こちょこちょ", D: "こちょこちょ" },
    startHint: "こちょこちょ → とまる → また こちょこちょ",
    clearMessage: "てんは たくさん わらいました",
    ehonTitle: "わらいごえ",
    ehonBody:
      "こちょこちょ、こちょこちょ……\n『きゃはは！』\n\nぴたっと とまると、てんも まちきれない かお。\nまた こちょこちょ すると――\n『きゃはははは！』\n\nてんの わらいごえで、おへやが いっぱいに なりました。",
    charts: {
      EASY: { travelTime: 2200, judge: { perfect: 100, great: 180, good: 280 }, notes: stage4Easy, rests: stage4EasyRests },
      NORMAL: { travelTime: 1900, judge: { perfect: 80, great: 150, good: 250 }, notes: stage4Normal, rests: stage4NormalRests },
      HARD: { travelTime: 1500, judge: { perfect: 60, great: 110, good: 180 }, notes: stage4Hard, rests: stage4HardRests },
    },
  },
  {
    id: 5,
    name: "いないいないばあ",
    type: "direction",
    reactionStyle: "peekaboo",
    isFinalStage: true,
    description:
      "さいごの ステージ。\n\nA：ひだりから「ばあ！」／Space：まんなかから「ばあ！」／D：みぎから「ばあ！」\n\n長押しは「いない いない……」、はなすと「ばあ！」だよ。\nこれまでの ぜんぶの ちからを あわせよう。",
    keys: ["A", "Space", "D"],
    laneLabels: { A: "左からばあ", Space: "正面からばあ", D: "右からばあ" },
    startHint: "いない いない……ばあ！",
    clearMessage: "てんは おおよろこびで わらいました",
    ehonTitle: "いないいないばあ",
    ehonBody:
      "いない いない……\n\n……ばあ！\n\n『……あ！』\n\nてんは てを おいかけて、\nおおきな こえで わらいました。\n『きゃはははは！』\n\nこれからも、たくさん あそぼうね。",
    charts: {
      EASY: { travelTime: 2300, judge: { perfect: 110, great: 190, good: 300 }, notes: stage5Easy },
      NORMAL: { travelTime: 1950, judge: { perfect: 85, great: 155, good: 255 }, notes: stage5Normal },
      HARD: { travelTime: 1550, judge: { perfect: 65, great: 120, good: 200 }, notes: stage5Hard, rests: stage5HardRests },
    },
  },
];

export function getStage(stageId) {
  return STAGES.find((s) => s.id === stageId);
}
