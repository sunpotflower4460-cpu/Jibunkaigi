# Universal OTHERS

## 目的

Expo Universal版で、他の会議メンバーの視点を明示的に呼び出せるようにする。

## 方針

OTHERSは自動発火しない。
ユーザーが押した時だけ実行する。

## 理由

複数エージェント応答はコストが高くなりやすいため、明示操作に限定する。

## 対象

- レイ (ray)
- ジョー (joe)
- ケン (ken)
- ミナ (mina)
- サトウ (satou)

心の鏡・委ねるはOTHERSの対象に含めない。

## API

```
POST /api/jibunkaigi/others
```

### リクエスト

```json
{
  "sessionId": "string",
  "userText": "string",
  "currentAgentId": "ray | joe | ken | mina | satou | mirror | delegate",
  "modeId": "flash | dialogue | deep",
  "messages": [...],
  "targetAgentIds": ["ray", "joe", ...],
  "userName": "string | null"
}
```

### レスポンス

```json
{
  "replies": [
    { "agentId": "ray", "agentLabel": "レイ", "text": "..." },
    { "agentId": "joe", "agentLabel": "ジョー", "text": "..." }
  ],
  "model": "gemini-1.5-flash"
}
```

## Proxy未設定時

`EXPO_PUBLIC_JIBUNKAIGI_API_BASE_URL` が未設定の場合、mock fallbackで動く。
アプリが落ちることはない。

## 保存

OTHERS応答は通常メッセージとして保存する。
ただし `origin: "others"` と `groupId` を付ける。

## UI

- `MobileOthersTrigger`: OTHERSボタン。最小44px。押した時だけ発火。
- `MobileMessageBubble`: `origin === "others"` の場合、OTHERSバッジを表示。

## まだやらないこと

- 自動OTHERS
- streaming
- quota
- rate limit本格実装
- 旧Vite Web版のOTHERS完全移行
