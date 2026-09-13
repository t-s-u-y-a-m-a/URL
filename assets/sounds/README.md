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
- `bgm/stage1.*` と `baby/voice.*` は、拡張子を `.mp3` → `.ogg` → `.wav` の順で
  自動的に探して再生します（`js/audio.js` の `_bgmCandidates`）。どれか1つを
  この中の名前で置くだけで反映されます。`se/` 配下は現状 `.mp3` 固定で読み込むため、
  差し替える場合は同じく `js/audio.js` 内の `SOUND_FILES` のパスも合わせて変更してください。

## STAGE1 BGM: Flowerbed Fields [Loop]

STAGE1のBGMには、OpenGameArt.orgで公開されている
**「Flowerbed Fields [Loop]」**(作者: Zane Little Music、ライセンス: CC0)
を使用する方針です。

- 配布ページ: https://opengameart.org/content/flowerbed-fields-loop
- ライセンス: CC0(パブリックドメイン相当。クレジット表記は法的には不要ですが、
  礼儀として本ファイルのようにクレジットを残すことを推奨します)
- 配布フォーマット: `.ogg`(約1.7MB) / `.wav`(約37MB) — サイズの都合上 `.ogg` 推奨

**注意:** この開発環境(サンドボックス)は外部ネットワークへのアクセスが
制限されており、`opengameart.org` から直接ファイルをダウンロードすることが
できませんでした。そのため、このリポジトリには実際の音声ファイルはまだ
含まれていません。

上記URLから `.ogg` ファイルをダウンロードし、
`assets/sounds/bgm/stage1.ogg` として配置してください。
配置するだけで `js/audio.js` が自動的に読み込みます(コード変更は不要です)。
