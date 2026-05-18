# Jibunkaigi Full Parity Audit

## 目的
既存Vite Web版のじぶん会議を、Expo Universal版へ100%そのまま移植するための完全差分監査。

## Parity定義
- 一致: 旧Vite Web版とExpo Universal版で、機能・文言・導線・状態が同等。
- 部分一致: 主要機能はあるが、UI/文言/導線/挙動の差分が残る。
- 未一致: Expo Universal版に未実装。
- 未確認: コード上または実機上でまだ確認できていない。
- 意図的差分: OS差分やストア事情で完全一致させない。ただし体験は同一にする。

## 監査対象
- Vite Web
- Expo iOS
- Expo Android
- Expo Web

## 確認元
- Vite Web: `/home/runner/work/Jibunkaigi/Jibunkaigi/src/App.jsx`, `src/components/`, `src/runtime/`, `src/services/`
- Expo Universal: `/home/runner/work/Jibunkaigi/Jibunkaigi/apps/mobile/app/index.tsx`, `apps/mobile/components/`, `apps/mobile/state/useUniversalConversation.ts`, `apps/mobile/services/`
- Shared / backend: `/home/runner/work/Jibunkaigi/Jibunkaigi/packages/shared/src/`, `/home/runner/work/Jibunkaigi/Jibunkaigi/workers/jibunkaigi-gemini-proxy/`

## 監査結果サマリー
| 領域 | 状態 | 備考 |
|---|---|---|
| 初回体験 | 未一致 | Webの`IntroOverlay`と同じ文言・表示タイミング・初回のみ表示の保存がExpoにない |
| 会話体験 | 部分一致 | 送受信土台はあるが、本番AI/OTHERS応答の実機確認が未完了 |
| エージェント導線 | 部分一致 | 下部AgentControlBarはあるが、入力欄開閉とFloatingAgentBarが未移植 |
| OTHERS / 反応表示 | 部分一致 | Webは各メッセージ配下のOTHERS/Reaction導線、Expoは下部トリガーで代替 |
| セッション管理 | 部分一致 | 作成・切替・編集・ピン・削除・コピー・共有はあるが、UI配置差分と実機QAが残る |
| 入力欄 | 未一致 | Webの入力欄開閉導線と補助文言がExpoにない |
| ユーザー設定 | 未一致 | Webのユーザー名編集・保存・呼称反映がExpoにない |
| メッセージ操作 | 未一致 | Webのメッセージ個別削除がExpoにない |
| エラー / 状態表示 | 部分一致 | 共通status生成はあるが、実機での最終文言/配置QAが未完了 |
| Copy / Share | 意図的差分 | OS共有シートの見た目は異なるが、機能導線は揃える方針 |
| Debug / Compare / Inspector | 意図的差分 | Webの開発用パネルは本番Parity必須対象外。ただし差分は記録対象 |

## 監査結果詳細
| 領域 | 旧Vite Web | Expo Universal | 状態 | Gap ID / 備考 |
|---|---|---|---|---|
| 初回オンボーディング | `IntroOverlay`でフルスクリーン導入、3ステップ、CTA「会議をはじめる」、`localStorage`で既読管理 | `MobileIntroScreen`はインライン表示。文言・レイアウト・CTA構成が別で、既読保存もない。`handleNewSession`でも毎回再表示 | 未一致 | FP-001 |
| ホーム/空状態 | `EmptyState`と入力欄/AgentControlBarの組み合わせで初期導線を作る | `MobileIntroScreen` / `MobileEmptyState`で別UI。余白・文言・導線が未監査 | 部分一致 | FP-006, FP-007, FP-008 |
| ユーザー名変更 | サイドバーの`UserProfileButton`→`UserNameDialog`で編集、Firestore profileへ保存、呼称に利用 | UIなし。状態にも`userName`がなく、AI/OTHERSリクエストにもユーザー名を渡していない | 未一致 | FP-003 |
| セッション一覧/編集/ピン/削除 | Sidebarに一覧常設。inline edit・pin・deleteあり | Drawer + EditSheetで同等機能はあるが、配置・文言・表示密度が異なる | 部分一致 | FP-007, FP-008 |
| セッションコピー/共有 | セッション全体のcopy/share対応済み | Drawer内でcopy/share対応済み。OS共有シートの見た目はネイティブ差分 | 意図的差分 | FP-008 |
| モード選択 | TopHeader右側に常設 | 下部`MobileModeSelector`に配置 | 部分一致 | FP-007 |
| 入力欄 | `Composer`にhelper text、Enter送信、Shift+Enter改行、閉じるボタン、AgentControlBar側の開閉導線あり | `MobileComposer`は常時表示で、閉じる/開く状態がない。helper textも未移植 | 未一致 | FP-004 |
| AgentControlBar | 心の鏡・委ねる・綴る/閉じる・各エージェントを横並びで表示 | `MobileAgentControlBar`はエージェント選択のみ。helper text、綴る/閉じる、専用導線がない | 部分一致 | FP-004, FP-007 |
| FloatingAgentBar | 初回入力後に固定下部レールが出現し、折りたたみ/展開できる | 該当UIなし | 未一致 | FP-005 |
| AI応答 | Web本番実装あり | `createUniversalAiReply`はproxy優先だが失敗時mock fallback。実環境疎通確認の記録なし | 部分一致 | FP-002, FP-010 |
| OTHERS | メッセージ単位でOTHERSタブ/各反応チップを表示し、`OthersPanel`で展開 | 画面下部の`MobileOthersTrigger`で一括取得し、結果をタイムラインへ追記する方式 | 部分一致 | FP-013 |
| 心の鏡導線 | AgentControlBar・FloatingAgentBar・3往復後のMirror inviteで複数導線あり | Agent bar選択のみ。Mirror inviteや二段導線がない | 部分一致 | FP-005, FP-007 |
| メッセージ個別操作 | ツールバーでcopy / delete、OTHERS / reaction表示あり | copy / shareはあるがdeleteなし。OTHERSも別導線 | 未一致 | FP-012, FP-013 |
| エラー / 設定不足 / ローディング | App内でエラーバナー、config不足カード、loading状態を表示 | `MobileConfigNotice` / `MobileErrorNotice` / `MobileLoadingOverlay` / `MobileStatusStrip`で対応 | 部分一致 | 機能は近いが文言/配置の実機QAが必要 (FP-006, FP-008) |
| Copy / Share | Webの共有はブラウザ依存、copyが主導線 | Expoはメッセージ/セッションでcopy/shareあり。共有シート見た目はOS依存 | 意図的差分 | 体験同等を実機で確認する (FP-008) |
| Debug / Compare / Inspector | Compare panel、Inspector、Joe/Agent debugあり | モバイル側には実装なし | 意図的差分 | 開発用。ユーザー向けParityのブロッカーにはしない |

## 監査メモ
- Expo Universal版は「主要機能がある」段階ではなく、「Webと同じ体験になっているか」で判定する必要がある。
- 現状のExpo側は共有prompt/runtime・session adapter・status基盤までは揃っているが、初回体験・入力導線・下部導線・ユーザー設定・メッセージ周辺でUX差分が残っている。
- `workers/jibunkaigi-gemini-proxy` は reply / OTHERSの入口を持つが、Expo側はproxy失敗時にmockへ自動fallbackするため、本番env未設定でも見かけ上動いてしまう。Parity完了判定には本番疎通確認を別タスクとして残す必要がある。
- 実機確認はまだ未完了のため、iOS / Android / Expo Webの最終判定は`未確認`を含む。コード上の確認結果はGap Registerへ展開する。
