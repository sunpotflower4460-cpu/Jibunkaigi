# FloatingAgentBar（下部操作UI）実験版

## 概要

`FloatingAgentBar` は Phase 3 で追加した実験的な下部固定操作バーです。

**目的**: 会話が下に伸びたときに、上部の agent bar まで往復しなくても同じ操作にアクセスできるようにする。

> ⚠️ これは実験版です。最終デザイン確定版ではありません。  
> 上部の agent bar は残したまま、下部に追加で置く形です。

---

## 問題背景

現在のじぶん会議では:

- 会話は下へ伸びる
- でも「委ねる / agent / 心の鏡」操作は上側にある
- 会話を読みながら操作するときに往復が大きい

これを「UX 負債」として軽減するため、下部でも同じ操作へアクセスしやすくする実験版を入れた。

---

## 配置

`src/components/FloatingAgentBar.jsx`

画面下部に `position: fixed` で固定表示。  
AgentGateDebugPanel（右下）との重なりを避けるため、FloatingAgentBar は画面中央下に配置する。

---

## 表示条件

| 条件 | 表示 |
|------|------|
| activeSession がある かつ メッセージが 1件以上 | ✅ 表示 |
| compareMode 有効 | ✅ 表示（初期 open） |
| debugAgent 有効 | ✅ 表示（初期 open） |
| ユーザーが明示的に開いた | ✅ 表示 |
| session なし / 会話前 / full-screen loading | ❌ 非表示 |

---

## 含まれる操作

| ボタン | 呼ぶ関数 |
|--------|---------|
| 心の鏡 | `handleAgentClick('master', true)` |
| 委ねる | `handleRandomResponse()` |
| ジョー | `handleAgentClick('creative')` |
| その他エージェント | `handleAgentClick(agentId)` |
| OTHERS | `scrollRef.current.scrollTo(bottom)` |
| たたむ | `setIsOpen(false)` |

---

## disabled 状態

上部 UI と同じ `canUseAgents` / `agentDisabledReason` を使用。  
compare / debug 時だけ、バー下部に `disabled: <reason>` を小さく表示する。

---

## compare / debug 時の挙動

- `compareModeEnabled` または `isDebugMode` のとき、初期状態は open
- バーの背景をやや不透明にして視認性を上げる
- `agentDisabledReason` をバー下部に表示

---

## AgentGateDebugPanel との共存

- AgentGateDebugPanel: `bottom: 8, right: 8`
- FloatingAgentBar: `bottom: 16（または 120）, center`

`isDebugPanelVisible` が `true` のとき、FloatingAgentBar の `bottom` を `120px` に上げて重なりを防ぐ。

---

## 上部 UI との関係

- 上部の agent bar（`showDelegateBar`）はそのまま残す
- FloatingAgentBar は「新しい機能」ではなく「新しい入口」
- 既存の gate / debug / trace をそのまま活かす

---

## 今後の方針（Phase 4 へ）

- Phase 4（Compare 結果を使った品質改善）では、FloatingAgentBar から compare エントリを直接操作できる導線を追加することを検討する
- 現時点では「往復負債の軽減」を最優先とし、最小構成を維持する
