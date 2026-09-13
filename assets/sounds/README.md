# 音源ファイルの配置について

ここに音声ファイルを置くと、`js/audio.js` が自動的にそちらを再生します。
ファイルが存在しない場合はエラーにならず、Web Audio APIによる簡易合成音に
自動でフォールバックするので、音源を用意していない状態でもゲームは
問題なく遊べます。

## 想定しているファイル構成

```
assets/sounds/
  bgm/
    stage1.mp3      … STAGE1開始時に再生されるBGM(ループ)
  se/
    tap.mp3          … GOOD判定時
    great.mp3        … GREAT判定時
    perfect.mp3      … PERFECT判定時
    miss.mp3         … MISS判定時
    clear.mp3        … ステージクリア時
  baby/
    laugh.mp3        … てんの笑い声(PERFECT時などに追加再生)
    cry.mp3          … てんの泣き声(MISS時に追加再生)
```

- 音源は著作権・利用規約上問題のないもの（商用利用可否を確認したもの）を使用してください。
- ファイル形式はブラウザで再生できるもの(mp3/ogg/wav等)であれば、
  `js/audio.js` 内の `SOUND_FILES` のパスを合わせて変更してください。
