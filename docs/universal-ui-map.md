# Jibunkaigi Universal UI Map

## 目的

旧Vite Web版のUIを、Expo Universal版へ100%対応させるための対応表。

## UI対応表

| Vite Web | Expo Universal予定 | 状態 | 備考 |
|---|---|---|---|
| App.jsx | UniversalAppRoot | 未移植 | 現在は apps/mobile/app/index.tsx が土台 |
| BackgroundLayer | UniversalBackground | 一部土台あり | MobileBackground |
| TopHeader | UniversalTopHeader | 未移植 | |
| Sidebar | UniversalSessionDrawer | 未移植 | iOS/Android/Webで同じ導線にする |
| Composer | UniversalComposer | 一部土台あり | MobileComposer |
| AgentControlBar | UniversalAgentControlBar | 一部土台あり | MobileAgentControlBar |
| ChatTimeline | UniversalChatTimeline | 一部土台あり | MobileChatTimeline |
| MessageBubble | UniversalMessageBubble | 一部土台あり | MobileMessageBubble |
| IntroOverlay | UniversalIntroScreen | 一部土台あり | MobileIntroScreen |
| UserNameDialog | UniversalUserNameSheet | 未移植 | |
| DeleteSessionDialog | UniversalDeleteSessionDialog | 未移植 | |
| BeliefsDialog | UniversalBeliefsSheet | 未移植 | 会議メンバー説明 |
| FloatingAgentBar | UniversalFloatingAgentBar | 未移植 | |
| CompareModePanel | UniversalComparePanel | 開発用 | 本番は隠してよい |
| SurfaceDebugPanel | UniversalDebugPanel | 開発用 | 本番は隠してよい |
| JoeDebugPanel | UniversalJoeDebugPanel | 開発用 | 本番は隠してよい |
| AgentInspectorPanel | UniversalInspectorPanel | 開発用 | 本番は隠してよい |

## 命名方針

現状は `Mobile*` コンポーネント名でよい。  
ただし最終的には、iOS / Android / Web 共通本体であることを明確にするため `Universal*` への移行を検討する。
今回のPRで無理にリネームしない。

## UI差分禁止

iOS / Android / Webで以下を分けない。

- エージェントバーの位置
- Composerの基本構造
- メッセージ表示
- セッション導線
- 心の鏡
- 委ねる
- OTHERS
- モード選択
