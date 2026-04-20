# ラベル形式の指示の削除

## 背景

2026-04-19 に実施した「外部 guidance の削除」では、自然文の指示を
構造化ラベル(`[pacing:slow, intent:..., lines:4]` 等)に圧縮する形で
プロンプトに残していた。

これは「自然文操縦の削除」は達成したが、「LLM への操縦の削除」としては
未達だった。ラベル形式も LLM に届くため、指示として機能してしまう。

## 本 PR の変更

- buildAgentSurfaceGuidance / buildAgentStateGuide / buildAgentInternalFrame
  を LLM 向けには空返しに変更
- renderBiasSections の LLM への流し込みを削除
- 各エージェントの system prompt を最小存在宣言 + 粒子提示のみに
- テストに「ラベル形式の指示を検出するパターン」を追加

## 原則

今後、削除した指示の「意図」を LLM に届けたくなった場合、以下の優先順で対応する:

1. 粒子の tonalHints / stanceHints / avoidHints に追加する(LLM には届かない)
2. activate/select の重み計算に組み込む(LLM には届かない)
3. 上記で達成不可能な場合は PR で maker に相談する

**LLM に新しい指示を届ける形で解決することは、浄化方針に反する**。
