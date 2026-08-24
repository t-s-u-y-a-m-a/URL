# URL
https://www.icloud.com/shortcuts/70d4150dfc1943378eb193fbb3cc8b14

/**
 * 気分×行動×天気からAIが1曲を選び、Spotifyで再生 + スプレッドシートに記録するスクリプト
 *
 * ▼ 全体の流れ
 * 1. doGet … iPhoneショートカットから呼ばれ、天気取得→Gemini選曲→シート記録→Spotify URLを返す
 *    （このとき記録した行番号 rowIndex もレスポンスに含める）
 * 2. 15秒後、別のショートカットが doPost を呼び、その rowIndex の評価列に Good/Bad を書き込む
 *
 * ▼ 設定方法（重要）
 * このファイルに直接キーを書き込まず、Apps Scriptの「プロジェクトの設定」→
 * 「スクリプト プロパティ」に以下の3つを登録してください。
 *   SPREADSHEET_ID
 *   WEATHER_API_KEY
 *   GEMINI_API_KEY
 *   API_TOKEN        … doGet/doPostを叩けるURLを知っている人なら誰でも
 *                       スプレッドシートに書き込めてしまうため、
 *                       簡易的な合言葉として使う任意の文字列を設定してください。
 *
 * 設定後は PropertiesService から読み込むので、このコードをコピペで
 * 共有・バックアップしてもキーが漏れません。
 */

const props = PropertiesService.getScriptProperties();
const SPREADSHEET_ID = props.getProperty("SPREADSHEET_ID");
const WEATHER_API_KEY = props.getProperty("WEATHER_API_KEY");
const GEMINI_API_KEY = props.getProperty("GEMINI_API_KEY");
const API_TOKEN = props.getProperty("API_TOKEN"); // 未設定なら認証チェックをスキップ

// 記録先シート名（getActiveSheet()は使わない。スプレッドシート側で
// 別のシートを開いていると誤ったシートに書き込んでしまうため）
// ※実際のシートタブ名に合わせてください
const SHEET_NAME = "SoundLife_Pro_DB";

// ==== 1. AIが選曲し、天気や気温も含めてスプレッドシートへ即座に記録する処理 (doGet) ====
function doGet(e) {
  try {
    // 簡易認証（合言葉）チェック
    if (API_TOKEN && e.parameter.token !== API_TOKEN) {
      return jsonResponse({ status: "error", message: "unauthorized" });
    }

    const lat = e.parameter.lat || "35.6812";
    const lon = e.parameter.lon || "139.7671";
    const activity = sanitizeInput(e.parameter.activity || "日常動作");
    const steps = e.parameter.steps || "0";
    const mood = sanitizeInput(e.parameter.mood || "普通");

    // ① リアルタイムで天気と気温を取得
    const weatherData = getWeatherData(lat, lon);

    // ② 過去の「Good」履歴を取得（学習データ）
    const historyContext = getRecentHighRatedKeywords();

    // ③ Gemini AIに最高の1曲を選ばせる
    const generatedSong = generateSongWithGemini(mood, activity, steps, weatherData, historyContext);

    // ④ スプレッドシート（DB）に天気・気温も含めて自動記録
    //    書き込んだ行番号を受け取っておく（後で評価を書き込むショートカットに渡す）
    const rowIndex = saveToSpreadsheet(activity, steps, weatherData.weather, weatherData.temp, mood, generatedSong);

    // ⑤ Spotifyの再生URLを作成してiPhoneへ返す
    const spotifyUrl = "spotify:search:" + encodeURIComponent(generatedSong);

    // rowIndexをショートカット側に渡しておくと、15秒後の評価ショートカットが
    // 「常に最後の行」ではなく「このリクエストで記録した行」を正確に更新できる
    return jsonResponse({ status: "success", song: generatedSong, spotifyUrl: spotifyUrl, rowIndex: rowIndex });
  } catch (err) {
    console.error("doGetで予期しないエラー: " + err);
    return jsonResponse({ status: "error", message: String(err) });
  }
}

// ==== 2. 15秒後にショートカットから呼ばれ、Good/Bad評価を書き込む処理 (doPost) ====
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    if (API_TOKEN && data.token !== API_TOKEN) {
      return jsonResponse({ status: "error", message: "unauthorized" });
    }

    // Good/Bad以外の値が紛れ込まないようにする
    const feedback = data.feedback === "Bad" ? "Bad" : "Good";

    const sheet = getSheet();

    // doGetのレスポンスで受け取ったrowIndexがあればその行を、
    // 無ければ（後方互換のため）最終行を更新する。
    // ※15秒待つ間に別のリクエストが記録されると「最終行」はズレる可能性があるため、
    //   ショートカット側は doGet で受け取ったrowIndexをできるだけ渡すのがおすすめ。
    const targetRow = data.rowIndex ? Number(data.rowIndex) : sheet.getLastRow();

    if (targetRow > 1) {
      sheet.getRange(targetRow, 8).setValue(feedback);
    }

    return jsonResponse({ status: "logged", rowIndex: targetRow });
  } catch (err) {
    console.error("doPostで予期しないエラー: " + err);
    return jsonResponse({ status: "error", message: String(err) });
  }
}

// ==== 共通ヘルパー ====

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// スプレッドシートを名前で取得（アクティブシート依存を避ける）
function getSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    // シートが無ければ自動作成してヘッダーを入れる
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(["日時", "行動", "歩数", "天気", "気温", "気分", "曲", "評価"]);
  }
  return sheet;
}

// Geminiへ渡す前に危険な改行やプロンプト差し込みっぽい文字列を軽く抑制
function sanitizeInput(text) {
  return String(text).replace(/[\r\n]+/g, " ").slice(0, 100);
}

// スプレッドシートへ全データを1行書き込む関数。書き込んだ行番号を返す
function saveToSpreadsheet(activity, steps, weather, temp, mood, song) {
  try {
    const sheet = getSheet();
    sheet.appendRow([
      new Date(),        // 日時
      activity,          // 行動
      steps,             // 歩数
      weather,           // 天気（自動記録）
      temp + "℃",        // 気温（自動記録）
      mood,              // 気分
      song,              // 選ばれた曲名
      "未評価"           // 評価（初期状態）
    ]);
    return sheet.getLastRow();
  } catch (err) {
    console.error("スプレッドシート書き込みエラー: " + err);
    return null;
  }
}

// 天気APIを呼び出す関数
function getWeatherData(lat, lon) {
  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric&lang=ja`;
    const res = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    const code = res.getResponseCode();
    if (code !== 200) {
      console.error("天気API呼び出し失敗 (HTTP " + code + "): " + res.getContentText());
      return { weather: "晴れ", temp: "20" };
    }
    const json = JSON.parse(res.getContentText());
    return { weather: json.weather[0].description, temp: json.main.temp };
  } catch (err) {
    console.error("天気API取得エラー: " + err);
    return { weather: "晴れ", temp: "20" };
  }
}

// 過去にGoodだった傾向をスプレッドシートから探す関数
function getRecentHighRatedKeywords() {
  try {
    const sheet = getSheet();
    const data = sheet.getDataRange().getValues();
    const goodSongs = [];

    for (let i = data.length - 1; i >= 1 && goodSongs.length < 5; i--) {
      if (data[i][7] === "Good") {
        goodSongs.push(data[i][6]);
      }
    }
    return goodSongs.join(", ");
  } catch (err) {
    console.error("履歴取得エラー: " + err);
    return "";
  }
}

// AIにプロンプトを送って「最高の1曲」を決めさせる関数
function generateSongWithGemini(mood, activity, steps, weatherData, history) {
  // gemini-1.5-flash は提供終了のため、現行の安定版モデルを使用
  const MODEL = "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  const prompt = `あなたはプロの選曲DJです。日本の音楽（J-POPや邦楽）を中心に選曲してください。以下のユーザーの状態に最もマッチする『おすすめの1曲』を選び、「曲名 アーティスト名」の形式で1行だけで出力してください。余計な挨拶や解説は絶対に書かないでください。
【ユーザーの状態】
* 気分: ${mood}
* 今の行動: ${activity}
* 今日の歩数: ${steps} 歩
* 外の天気: ${weatherData.weather}
* 気温: ${weatherData.temp}℃
* 過去にこのユーザーが気に入った曲の傾向: ${history || "特になし"}

出力例: ダンスホール Mrs. GREEN APPLE`;

  const payload = { contents: [{ parts: [{ text: prompt }] }] };
  const options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  try {
    const res = UrlFetchApp.fetch(url, options);
    const code = res.getResponseCode();
    if (code !== 200) {
      console.error("Gemini API呼び出し失敗 (HTTP " + code + "): " + res.getContentText());
      return "ダンスホール Mrs. GREEN APPLE";
    }
    const json = JSON.parse(res.getContentText());
    const text = json.candidates && json.candidates[0] &&
      json.candidates[0].content && json.candidates[0].content.parts &&
      json.candidates[0].content.parts[0] && json.candidates[0].content.parts[0].text;
    if (!text) {
      console.error("Geminiの応答に候補が無い（安全フィルタ等）: " + res.getContentText());
      return "ダンスホール Mrs. GREEN APPLE";
    }
    return text.trim();
  } catch (err) {
    console.error("Gemini呼び出しエラー: " + err);
    return "ダンスホール Mrs. GREEN APPLE";
  }
}
