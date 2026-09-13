# 音源ファイルの配置について

ここに音声ファイルを置くと、`js/audio.js` が自動的にそちらを再生します。
ファイルが存在しない場合はエラーにならず、Web Audio APIによる簡易合成音に
自動でフォールバックするので、音源を用意していない状態でもゲームは
問題なく遊べます。

## 想定しているファイル構成

```
assets/sounds/
  bgm/
    bgm_stage1_piano_for_babies.mp3            … STAGE1
    bgm_stage2_babies_piano_delicate.mp3       … STAGE2
    bgm_stage3_gentle_care_no2.mp3             … STAGE3
    bgm_stage4_children_piano_gentle_care.mp3  … STAGE4
    bgm_stage5_lullaby.mp3                     … STAGE5
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
- BGM(`stage-data.js` の `bgmSrc`)は、指定した拡張子で見つからない場合
  `.mp3` → `.ogg` → `.wav` の順に自動で探して再生します（`js/audio.js` の
  `_bgmCandidates`）。`se/` 配下は現状 `.mp3` 固定で読み込むため、差し替える
  場合は同じく `js/audio.js` 内の `SOUND_FILES` のパスも合わせて変更してください。

## 各ステージのBGM(採用中)

STAGE1〜5には、それぞれ以下のピアノ主体の穏やかなBGMを割り当てています
(ユーザーから提供されたファイルをそのまま使用。加工・再生成は行っていません)。

| ステージ | ファイル | 曲名(提供時のファイル名より) |
| --- | --- | --- |
| STAGE1 | `bgm/bgm_stage1_piano_for_babies.mp3` | Piano for Babies - Loop |
| STAGE2 | `bgm/bgm_stage2_babies_piano_delicate.mp3` | Babies Piano - Delicate Loop |
| STAGE3 | `bgm/bgm_stage3_gentle_care_no2.mp3` | Gentle Care - Children Piano Loop No. 2 |
| STAGE4 | `bgm/bgm_stage4_children_piano_gentle_care.mp3` | Children Piano - Gentle care |
| STAGE5 | `bgm/bgm_stage5_lullaby.mp3` | Lullaby - Soothing Children Music Loop |

**ライセンスについての注記:** 元のアップロードファイル名(`musicinmedia-...`,
`sonican-...` + 数字のID)は、Pixabayなどのフリー音源配布サイトが自動生成する
ダウンロードファイル名の形式に似ていますが、この環境では配布元ページに
直接アクセスして正式なライセンス条文を確認することができませんでした。
公開・コンテスト提出前に、各曲の入手元ページ(ダウンロード時の履歴やメール等)
を保管し、利用条件(商用利用可否・クレジット表記の要否)を今一度ご確認ください。
