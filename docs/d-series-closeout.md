# D Series Closeout (D-0〜D-5)

この文書は、D 系で「何が終わり、何を次フェーズへ渡すか」を固定する closeout です。  
新理論の追加ではなく、現実装の総括と E/M 系への橋渡しだけを目的にします。

関連文書:
- [Jibunkaigi Compass](./jibunkaigi-compass.md)
- [Micro-Signal Stream](./micro-signal-stream.md)
- [Joe reentry composition](./joe-reentry-composition.md)
- [Dual Stream Architecture](./dual-stream-architecture.md)
- [Dual Stream Manual Review](./dual-stream-manual-review.md)

## 1. D-0〜D-5 で入ったもの

- **D-0: Joe Debug の観測基盤**
  - runtime の観測を継続できる土台を整備。
  - micro-signal delta / reentry composition / fusedState / protoMeaning の確認導線を確保。
- **D-1: Internal OS bias の入口整理**
  - `estimateState(...)` と `runInternalOS` 内 `lexicalState` を観測系の入口として固定。
  - 値は決め打ち文ではなく、後段 dynamic layer に効く内部値として扱う。
- **D-2: tagged selection の互換経路を維持**
  - `getJoeReentry(...)` を legacy / compatibility path として保持。
  - D-4 正本への移行中も互換性を切らない構成を残した。
- **D-3: Micro-Signal 注入**
  - 句読点・言いよどみ・距離化などを数値化し、`field / reaction / stance` と reentry に薄く注入。
  - 置換ではなく微小補正（delta）として扱う設計を固定。
- **D-4: dynamic reentry composition**
  - Joe の runtime activation path 正本を `composeJoeReentry(...)` 系へ移行。
  - `observation / judgment / outputConstraint` の 3 パート合成を導入。
- **D-5: Dual Stream（fusedState / protoMeaning）**
  - Lexical Stream と Micro-Signal Stream を `fusedState` で束ね、`protoMeaning` を生成。
  - 既存主経路を壊さず、並行観測 + 低優先補助入力として運用。

## 2. D 系で意図的に変えなかったもの

- D は既存 `runInternalOS` の主経路（field/reaction/stance/decision）を置換しない。
- D は fixed persona を強化するための施策ではない。
- D の導入目的は、テンプレ人格の厚塗りではなく、内的傾向の観測と前景化である。
- D の値は **diagnosis（診断）ではなく runtime bias** であり、ラベリング用途に使わない。
- D-2 の tagged selection は互換経路として残し、急な断絶を避ける。

## 3. 現時点の制約

- D 系は観測・前景化・軽い bias までがスコープで、身体化・予測・記憶統合は未着手。
- micro-signal と protoMeaning は「方向を寄せる」補助であり、勝ち筋の差し替えはしない。
- D-5 下流反映は Joe（creative）中心で、適用範囲は限定的。
- ルールベース中心であり、長期的な学習・再編成を行う仕組みは D 単体では持たない。
- D は「今ターンでの観測可能性」を上げる段階で、長期連続性の保証は M 系に依存する。

## 4. E/M 系への引き渡し事項

- **D は観測・前景化・軽い bias まで** を担当し、ここで close する。
- **E は身体化と予測へ進む**（D の観測値を、より身体的・予測的な状態遷移へ接続する）。
- **M は記憶化と再統合へ進む**（D/E の結果を長期連続性として保持・再編成する）。
- D の数値は **diagnosis ではなく runtime bias**。E/M 側でも診断ラベルとして再解釈しない。
- D の導入目的は **fixed persona の強化ではない**。E/M 側でも人格固定化を目標にしない。

実装者向けメモ:
- E/M の Issue 化では、D の成果を「完成形」ではなく「観測層の完了」として扱う。
- 「D があるので身体化・記憶は不要」という読みに繋がる要件定義は避ける。
