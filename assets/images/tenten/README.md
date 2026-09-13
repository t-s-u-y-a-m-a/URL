# てんイラスト素材

ユーザー提供の「てん」リアクション素材(`ten_reactions_01-04` 一式)のうち、
生成AIサービスの透かし(ウォーターマーク)が入っていない4枚だけを採用しています。

## 採用した画像

| ファイル | 元ファイル名 | 用途 |
|---|---|---|
| `ten-neutral.jpeg` | krea-980cb3f2-cf65-440e-8980-dfa91e115699.jpeg | neutral(基本の表情) |
| `ten-happy.png` | ten_reaction_02.png | smile / laugh / bigLaugh |
| `ten-surprised.png` | krea-75760ed0-8d5a-4ab5-9a26-121cda19cbf1.png | surprised |
| `ten-sleepy.png` | krea-0d22d7ab-4f51-411f-be27-2546169dd28f.png | sleepy1 |

`js/baby-reaction.js` の `FACES` でこの対応を管理している。画像が無い/
読み込みに失敗した場合は自動的に絵文字表示にフォールバックする。

## 採用しなかった画像(透かしあり・未使用)

以下は右下または左上に生成AIサービスの透かし(「Dreamstime AI」
「DreaminaAI」など)が写り込んでいたため使用していない。

- `ten_reaction_01.png`
- `ten_reaction_03.png`
- `ten_reaction_04.png`
- `Gemini_Generated_Image_lqndbllqndbllqnd.jpeg`

これらを使いたい場合は、透かしの入っていない別カットに差し替えるか、
透かしを除去した版を用意してから追加してください。

## ホーム画面ヘッダー画像

`family-header.jpeg` はホーム画面上部に表示している、家族3人(父・母・てん)の
イラスト。透かし無しを確認して採用(先に提供された同系統の画像には
「DreaminaAI」の透かしが入っていたため、それらは不採用)。

## 未対応の表情

`cry` / `sleepy2` / `sleep` は対応するイラストが無いため、引き続き絵文字
(😢 / 😴 / 💤)で表示される。
