# OTHERS 表示の安定化（Phase 2）

## 概要

OTHERS は、主要エージェントの返答に対する他のエージェントの反応（reactions）を表示する機能です。Compare / Revision の文脈では、勝敗表示ではなく「比較対象群」を並べて観察するための領域として扱います。
Phase 2 では、開発中に OTHERS が安定して観察できるよう、表示条件の明確化と Compare Mode での表示安定化を実現しました。

## 目的

Phase 2 の最も重要な目的は「OTHERS を常に出す」ことではなく、以下を実現することです：

1. **表示条件の明確化**: OTHERS がなぜ出る/出ないのかを明確にする
2. **開発中の安定性**: dev-only の Compare Mode 中は安定して観察できる状態にする
3. **理由の可視化**: 出ない理由を表示し、「何もない」ではなく「なぜないか」が分かるようにする

## 主な変更点

### 1. 表示条件の集約

`src/runtime/getOthersVisibilityState.js` に OTHERS の表示条件を集約しました。

```javascript
const othersState = getOthersVisibilityState({
  activeSessionId,
  hasPromptForActiveSession,
  isMessagesLoading,
  visibleMessagesCount,
  compareModeEnabled,
  reactions,
  isGenerating,
});
```

返り値:
- `shouldRenderOthers`: OTHERS セクションを表示すべきか
- `reason`: 表示/非表示の理由
- `othersCount`: 候補数
- `hasReactionData`: reactions データの有無
- その他の状態情報

### 2. 表示理由（reason）の種類

| reason | 意味 | 通常モード | Compare Mode |
|--------|------|-----------|--------------|
| `ok` | データあり、正常表示 | ✅ 表示 | ✅ 表示 |
| `no-session` | セッションなし | ❌ 非表示 | ❌ 非表示 |
| `no-prompt` | プロンプトなし | ❌ 非表示 | ⚠️ 理由付き表示 |
| `no-visible-messages` | メッセージ不足 | ❌ 非表示 | ⚠️ 理由付き表示 |
| `loading` | 読み込み中 | ❌ 非表示 | ⚠️ Loading 表示 |
| `generating` | 生成中 | ❌ 非表示 | ⚠️ 生成中表示 |
| `no-candidates` | 候補なし | ❌ 非表示 | ⚠️ Empty 表示 |

### 3. Compare Mode での表示緩和

Compare Mode 中は、以下の条件が満たされれば OTHERS セクションを表示します：

- active session がある
- prompt がある（または visibleMessages >= 1）
- visibleMessages が最低1件ある

reactions データがなくても、セクション自体は表示し、理由を示します。ここで見る OTHERS は比較対象群であり、ランキング表示ではありません。

### 4. 状態表示

#### 通常時
reactions データがある場合のみ、OTHERS ボタンを表示します。

#### Compare Mode / Debug 時
OTHERS セクションに状態情報を表示します：

- `OTHERS: ready (3)` - 3件の候補あり
- `OTHERS: loading` - 読み込み中
- `OTHERS: no prompt yet` - プロンプトがまだない
- `OTHERS: no candidates` - 候補なし

### 5. Empty State

reactions がない場合の表示メッセージ：

- 通常モード: 「他の声はまだありません」
- Compare Mode: 「まだ比較対象がありません」
- プロンプトなし: 「まず1回会話すると OTHERS が出ます」
- 読み込み中: 「読み込み中です...」
- 生成中: 「候補生成中...」

## デバッグ情報

### Agent Gate Debug Panel

`?debugAgent=1` で OTHERS の状態を確認できます：

- `othersState`: 現在の OTHERS 表示状態
  - 例: `OTHERS: ready (3)`
  - 例: `OTHERS: no prompt yet`

### OTHERS ボタン

Compare Mode または Debug 時、OTHERS ボタンに候補数を表示：

```
OTHERS (3)
```

## 使い方

### 通常使用（本番）

通常モードでは、reactions データがあるメッセージにのみ OTHERS セクションが表示されます。
表示条件が満たされない場合、セクションそのものが非表示になります。

### 開発時（Compare Mode）

Compare Mode を有効にすると：

```
?compareMode=1
```

または

```javascript
localStorage.setItem('jibunkaigi:compareMode', '1')
```

OTHERS セクションが安定して表示され、比較対象群としての状態と理由が確認できます。

### デバッグ時

Agent Debug を有効にすると：

```
?debugAgent=1
```

または

```javascript
localStorage.setItem('jibunkaigi:debugAgent', '1')
```

OTHERS の詳細な状態情報が表示されます。

## 実装詳細

### ファイル構成

- `src/runtime/getOthersVisibilityState.js`: 表示条件の集約ロジック
- `src/runtime/getOthersVisibilityState.test.js`: テスト
- `src/App.jsx`: OTHERS セクションのレンダリング
- `src/components/AgentGateDebugPanel.jsx`: デバッグ表示

### テスト

```bash
npm test
```

全 158 テスト中、OTHERS visibility に関するテストが 23 件含まれています。

## 今後の拡張（Phase 3 以降）

Phase 3 では、以下を検討します：

- Compare Mode 専用の OTHERS 固定表示トグル（開発用）
- より詳細な状態遷移の可視化
- OTHERS の候補生成プロセスの透明化

## まとめ

Phase 2 により、OTHERS の表示が以下のように改善されました：

1. **明確な条件**: 表示条件が1か所に集約され、理由が明確に
2. **安定した開発環境**: Compare Mode 中は安定して観察可能
3. **状態の可視化**: 出ない理由が分かり、デバッグが容易に
4. **本番 UX の維持**: 通常モードでは従来通りのシンプルな表示

これにより、比較環境の土台が安定し、Phase 3 以降の機能開発がスムーズに進められるようになりました。
