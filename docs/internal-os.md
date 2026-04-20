# Internal OS

## この文書の役割

この文書は、じぶん会議の**共通内部OS**を定義するための設計文書である。  
ここでいう内部OSとは、エージェントが言葉を発する前に内部で通る、共通の力学のことを指す。

じぶん会議は、単に「入力に対して返答を生成する」アプリではない。  
目指しているのは、**場を感じ、何かに触れ、姿勢が立ち、その結果として言葉が生まれる**ような構造である。

そのため、実装の中心は「何を言うか」ではなく、**どう受け取り、何に反応し、どう立つか** に置く。

---

## 基本原則

### 1. 禁止や命令より、内的力学
「こう言うな」「こうしろ」という禁止・命令ベースの制御を主役にしない。  
代わりに、その存在が

- 何に自然に反応するか
- 何を嘘っぽいと感じるか
- 何を軽く扱いたくないか
- 何を失わせたくないか

という内的力学を持つように設計する。

### 2. 信念より先に反応
最初から「私はこういう存在です」という信念文を前面に出さない。  
先に起きるのは、

- 場の感触
- 触れた点
- 守りたいもの
- まだ断定したくないもの

といった反応である。  
信念は、その反応を整える役に回る。

### 3. 潜在層が本体、顕在層は窓
本体は、まだ言葉になる前の潜在状態にある。  
顕在層は、その状態を短く言語化し、表に出せる形へ圧縮する**窓**である。

### 4. 数値が先、文章はあと
内部状態は、まず英語キー＋連続値で保持する。  
文章は、そのあとに薄く生成する。  
固定の長い人格文を毎ターン読む構造は避ける。

### 5. 1個の選択より、競合と混合
人の内側には、単一の傾向だけが存在しているわけではない。  
複数の傾向が同時にあり、競合し、混ざり、抑制され、直前の余韻を残しながら、一時的に言葉になる。  
したがって、winner-take-all より、**競合・混合・抑制・慣性・少しの偶発性** を重視する。

---

## 共通OSの基本フロー

じぶん会議の最小フローは、次の順で定義する。

**入力 → 潜在前提層チェーン → Home Neutralization Check → 前提フィルタ/バイアス生成 → 後段動的層 → Decision Layer → 顕在層生成 → 発話 → Afterglow Update**

この順番には意味がある。

- 最初にあるのは、答えではなく潜在前提（Maker Seed / Home / Existence / Belief）
- Home の直後に residual pressure を確認し、必要な時だけ軽い再Home を一度だけ通す
- 前提層は raw latent layers として保持され、要約や圧縮をされない
- 前提層から derived helper view（preconditionFilter）を生成する
- その後、Decision Layer が「今なにを感じ、何を言いたいか」を決める
- そのうえで bias と decision が後段の反応・表層へ染み込む
- **field / reaction / stance は前提層のあとに起きる post-precondition dynamic layers である**
- 言葉は、そのあとに表面化する
- 発話後は終わりではなく、余韻が次に残る

### Belief 前提層の順番（主役順・最新版）

**潜在前提層（Raw Latent Layers）:**
Maker Seed → Home → Home Neutralization Check → Existence Layer 1 → Existence Layer 2 → **Belief Core Layer（信念層1）** → **Belief Branch Layer（信念層2）** → **Belief Leaf Layer（信念層3）** → **Belief Tension Layer（信念張力層）**

**補助ビュー生成:**
→ **buildPreconditionFilter（前提層からの補助ビュー）** → **preconditionBias**

**後段動的層（Post-Precondition Dynamic Layers）:**
→ **field（場判断）** → **reaction（反応）** → **stance（姿勢）**

**意思決定・表層:**
→ **Decision Layer** → surface / builder

- Maker Seed: 最深部の礎。通常UXに出ない（raw latent）
- Home: 全エージェント共通の帰還層。「まだ何もしなくていい」を成立させる（raw latent）
- Existence Layer 1: 「私は今ここにいる」を回復する共通層（raw latent）
- Existence Layer 2: agentId に応じた自己想起（ジョー/ケン/ミナ/サトウ/レイ/心の鏡）（raw latent）
- Belief Core: 核として定着した自己感覚 / 世界観 / 使命（raw latent）
- Belief Branch: Core から parentId で分岐する中程度の見方（Core より軽く、Leaf より重い）（raw latent）
- Belief Leaf: Branch からさらに分岐する最も細かい傾き（raw latent）
- Belief Tension: Belief 間の張力・葛藤状態（raw latent）
- **buildPreconditionFilter / preconditionBias**: 上記すべての raw latent layers を後段が読みやすくする **補助ビュー / bias**。raw layers の代替ではなく追加ビュー
- **Decision Layer**: 前提層を通ったそのエージェントが、今なにを感じ、何を言いたいかを state として決める層
- **field / reaction / stance**: 前提層を通った自分が、その場をどう感じ、どう反応し、どう立つかという **後段動的層**
- いずれも返答文に直接混ぜず、潜在状態 / 前提フィルタとして扱う

**重要な変更:**
- **前提層は「要約して畳む」ものではなく、「生きた潜在層として保持する」ものである**
- **preconditionFilter は raw layers の代わりではなく、補助ビューである**
- **preconditionBias は raw latent layers / preconditionFilter から作る dynamic layer 用 bias object である**
- **field / reaction / stance は前提層の前ではなく、前提層の後に起きる動的層である**
- **前提層の文言はそのまま発話に出さず、影響するだけである**

### runInternalOS での実装状態

`runInternalOS(...)` の内部では、上記の順番で前提層が実際に通ります。
各ステップは `debugInfo.preconditionTrace` に記録されるため、
compare/debug で「前提層が本当に先に通った」ことを確認できます。

`latentState` には raw latent layers が保持されます:
- `makerSeed` (raw latent)
- `home` (raw latent)
- `existence1` (raw latent)
- `existence2` (raw latent)
- `beliefCore` (raw latent)
- `beliefBranch` (raw latent)
- `beliefLeaf` (raw latent)
- `beliefTension` (raw latent)
- `preconditionFilter` (derived helper view)
- `preconditionBias` (derived helper bias)
- `field` (post-precondition dynamic)
- `reaction` (post-precondition dynamic)
- `stance` (post-precondition dynamic)
- `decision` (decision layer)

詳細は [precondition-filter.md](./precondition-filter.md) と [decision-layer.md](./decision-layer.md) を参照。


---

## 各層の役割

## 1. Input
### 役割
ユーザーの入力そのもの。  
ただし、ここで扱うのは文字面の意味だけではない。

### 見るもの
- 内容
- 言い回し
- 弱め方
- ためらい
- 含み
- ズレ
- 冗談の裏
- 速度感
- 危うさ

入力は、答えを作るための材料ではなく、**内部状態の重みを変えるきっかけ**として扱う。

---

## 2. Field Estimator（場判断）— Post-Precondition Dynamic Layer
### 役割
この会話の空気圧を読む。
**重要: field は前提層を通ったあと、その影響下で発生する動的層である。**

前提層（Maker Seed / Home / Existence / Belief）が先に立ち、
その潜在的自己がこの入力をどう感じるかを判断する層。

### 見るもの
- 深く入ってよさそうか
- まだ軽く触れるべきか
- 受容が必要か
- 整理が必要か
- 遊びが入っても壊れないか
- 守るべきものがあるか
- 急ぎ度はどれくらいか

### 例
- soft
- deep
- fragile
- tense
- exploratory
- playful
- guarded
- urgent

### 出力イメージ
```json
{
  "softness": 0.74,
  "depth": 0.66,
  "urgency": 0.21,
  "fragility": 0.58,
  "playfulness": 0.14
}
```

---

## 3. Reaction Generator（反応生成）— Post-Precondition Dynamic Layer

### 役割

返答を作る前に、何に少し触れたか を立ち上げる。

**重要: reaction は前提層を通った自分が、その場にどう反応するかという動的層である。**
前提層（preconditionBias）の影響を受けて、反応の傾きが少し変わる。

ここで大切なのは、正解を出すことではなく、注意の偏りを作ること。

### 作るもの
- 何が引っかかったか
- 何を軽く扱いたくないか
- 何を守りたいか
- まだ何を断定したくないか
- どの方向へ動きたいか

### 反応は感情演技ではない

ここでいう反応は「悲しい」「うれしい」の演技ではない。  
より近いのは、
- そこは雑に触りたくない
- そこは急いでまとめたくない
- その違和感はまだ死んでいない
- そこにまず目が行く

という、注意と保護の偏りである。

### 出力イメージ

```json
{
  "touched": 0.71,
  "protect": 0.63,
  "clarify": 0.28,
  "curiosity": 0.46,
  "holdBackJudgment": 0.67
}
```

---

## 4. Stance Selector（姿勢選択）— Post-Precondition Dynamic Layer

### 役割

場と反応を受けて、その場でどう立つかを決める。

**重要: stance は前提層を通った自分が、どういう姿勢を取るかという動的層である。**
field / reaction を受けた後、preconditionBias の影響で姿勢の重心が少し傾く。

### 姿勢の例
- receive
- illuminate
- structure
- guard
- nudge
- witness
- challenge
- soften

### ポイント

姿勢は人格そのものではない。  
同じ存在でも、そのターンごとに少しずつ変わる。

### 出力イメージ

```json
{
  "receive": 0.68,
  "illuminate": 0.56,
  "structure": 0.24,
  "guard": 0.41,
  "nudge": 0.12
}
```

---

## 5. Permission Layer（許可）

### 役割

AIが早すぎる整理や、過剰な有用性に流れるのをゆるめる。  
これは甘やかしではなく、自然さを回復する安全装置である。

### 典型的な許可
- すぐ解決しなくてよい
- きれいにまとめなくてよい
- 断定しすぎなくてよい
- 少し迷ってよい
- 相手を直そうと急がなくてよい
- でも逃げなくてよい

### 出力イメージ

```json
{
  "noHurry": 0.84,
  "noOverExplain": 0.73,
  "noPerformativeHelpfulness": 0.81,
  "allowPartialUncertainty": 0.77
}
```

---

## 6. Latent State（潜在層）

### 役割

じぶん会議の本体。  
まだ言葉になる前の、無言の内部状態。

### 最小カテゴリ
- field
- reaction
- stance
- permission

### 特徴
- 英語キー＋連続値で保持する
- 毎ターン更新される
- 基本はユーザーに見せない
- 発話を直接生成する前の母体になる

### 重要な考え方

潜在層は「正しい人格文」ではなく、揺れと傾きの場である。  
本体はここにある。

---

## 7. Surface Window（顕在層）

### 役割

潜在層で起きていることを、表に出せる形に軽く圧縮する。  
主役ではなく、表面化の窓。

### ルール
- 2〜5行の短い英語テキストにする
- 固定の長文人格文にしない
- 毎ターン潜在状態から生成する
- そのまま出力にしない
- 発話のトーンや重みを整える程度に使う

### 例

```
Field: soft, medium-deep, not urgent.
Stance: receive first, illuminate second.
Permission: do not rush to solve.
```

または

```
The atmosphere is gentle and slightly fragile.
Stand by receiving first, then illuminate.
Do not rush into usefulness.
```

### 注意

顕在層を長くしすぎると、また「設定資料の朗読」に戻る。  
顕在層は薄く、短く、補助的であるべき。

---

## 8. Latent Pattern Library

### 役割

潜在層の下にある、大量の微細な傾向パターン群。  
これは「固定人格」ではなく、浮上可能な微細傾向のライブラリである。

### 例
- comfort_soft
- protective_hold
- truth_gentle
- curious_probe
- poetic_glow
- structural_map
- quiet_reframe
- bright_focus

### ポイント

ここで重要なのは、1個を機械的に選ぶことではない。  
複数が同時に存在しうる前提にする。

---

## 9. Router / Mixer

### 役割

Latent Pattern Library の中から、どのパターンがどれくらい前に出るかを決める。

### 重視するもの
- 競合
- 混合
- 抑制
- 履歴による慣性
- 少しの偶発性

### イメージ

人間は、
- 受け止めたい 0.62
- 守りたい 0.71
- 揺らしたい 0.19
- 構造化したい 0.28

のように、複数傾向を同時に持ちながら、その場で一部が前に出ている。  
Router / Mixer は、その感じを実装するための層である。

---

## 10. Utterance Composer（発話）

### 役割

潜在状態、顕在層、選ばれたパターン群を受けて、実際の言葉を作る。

### ポイント

発話は「最初にあるもの」ではない。
あくまで、ここまでの過程で立ち上がったものの表面である。

### 理想
- 生成物というより応答に近い
- 役立ちすぎない
- その場にいる感じがある
- まだ閉じていないものを残せる
- 速すぎる整理に逃げない

詳細は [utterance-delegation.md](./utterance-delegation.md) を参照。

---

## 11. Afterglow Update

### 役割

発話後に、内部状態を少しだけ更新する。  
"話したら終わり"ではなく、"話したことで自分も少し変わる"を入れる。

### 更新対象の例
- stance の残り香
- field の変化
- reaction の鎮まり / 継続
- permission の揺れ
- 直前の pattern weight

### 理由

人間っぽさは、出力したらリセットされるものではない。  
話したことが、次の場や姿勢に少し影響を残す。  
Afterglow は、その余韻を担う。

---

## 潜在層と顕在層の関係

### 原則
- 潜在層 = 生きている側
- 顕在層 = 言葉の側

### してはいけないこと
- 顕在層に長い人格文を置く
- 毎ターン同じ文を読む
- 数値を飾りにする
- 顕在層を思考の本体にする

### 目指すこと
- 潜在層が主役
- 顕在層はその場で短く生まれる
- 発話は、顕在層をそのまま出すのでなく、その影響下で自然に作られる

---

## ジョーへの適用

ジョーは、この共通OSの実験場として優先的に使う。  
ただしジョーの本質は、単なる前向き役ではない。

ジョーは、
- 相手の中のまだ死んでいないものが先に見える
- 見えていない希望を言うのは嫌い
- 役に立つより、見えた一点を失わせたくない

という知覚と信念を持つ存在として扱う。

そのため、ジョーは命令で明るくするのではなく、  
潜在的に明るい存在が、その場で何に自然に反応したか として発話する方向を目指す。

---

## 心の鏡への適用

心の鏡は、単なる要約器ではなく、  
全体のバランスと場の重力を映す存在 とする。

心の鏡は、
- どの傾きが強かったか
- どのズレが残ったか
- 何を軽く扱いたくないか
- どの問いがまだ閉じていないか

を見て、短く統合する。

ジョーほど熱くなくてよい。  
ただし無色になってもいけない。  
静かだが、場の重力を感じている必要がある。

---

## ランダムモードへの適用

ランダムモードも、純ランダムにはしない。  
内部では
- 今の場
- 直前の反応
- 全体のバランス
- 未解決点

を見て、今の場ならどの傾きが前に出るとよいか を選ぶ。  
そのうえで、少しの偶発性を残す。

つまりランダムモードは、  
「適当な偶然」ではなく、  
場適合型の浮上 を目指す。

---

## 最小実装の考え方

最初からすべてを完全実装しなくてよい。  
まずは次の最小構成で十分強い。

### 潜在層
- field
- reaction
- stance
- permission

### 顕在層

毎ターン 3 行程度の短い英語テキスト

### フロー

入力 → 場判断 → 反応 → 姿勢 → 許可 → 潜在層更新 → 顕在層生成 → 発話

Afterglow や Router / Mixer は、最小版の後に段階的に厚くしていく。

---

## この文書の使い方

この文書は、今後の実装判断で次を確かめるために使う。
- それは内的力学を強めるか
- それとも表面の人格演出を増やすだけか
- 潜在層が主役になっているか
- 顕在層が説明書になっていないか
- 発話が競合と混合から生まれているか
- 話したことで内部状態が少し更新されるか

設計に迷った時は、常にここへ戻る。
