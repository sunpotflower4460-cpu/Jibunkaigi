# Universal Real AI / Firebase QA

## 目的

Manual Environment Gate完了後、Firebase保存とGemini Proxy応答が iOS / Android / Expo Web で実際に動くか確認する。

## 現在の状態

このPR時点では、実Firebase値・Gemini API Key・Worker deployは手動ゲート対象。
そのため、実接続は未確認として扱う。

## Environment Matrix

| 環境 | Firebase Remote | Gemini Proxy | OTHERS Proxy | 状態 |
|---|---|---|---|---|
| Expo Web | 未確認 | 未確認 | 未確認 | Manual Gate待ち |
| iOS | 未確認 | 未確認 | 未確認 | Manual Gate待ち |
| Android | 未確認 | 未確認 | 未確認 | Manual Gate待ち |

## Firebase QA

| 項目 | 状態 | 備考 |
|---|---|---|
| 匿名ログイン | 未確認 | env設定後に確認 |
| セッション保存 | 未確認 | env設定後に確認 |
| メッセージ保存 | 未確認 | env設定後に確認 |
| 復元 | 未確認 | env設定後に確認 |
| 削除 | 未確認 | env設定後に確認 |
| 会話クリア | 未確認 | env設定後に確認 |

## Gemini Proxy QA

| 項目 | 状態 | 備考 |
|---|---|---|
| Worker deploy | 未確認 | 手動 |
| reply endpoint | 未確認 | 手動 |
| others endpoint | 未確認 | 手動 |
| Expo Web proxy応答 | 未確認 | 手動 |
| iOS proxy応答 | 未確認 | 手動 |
| Android proxy応答 | 未確認 | 手動 |

## AI Response Quality QA

以下の問いで確認する。

1. 今の自分が何をしたいのか分からない
2. やりたいことは多いのに、進まなくて焦る
3. これは本当に自分の望みなのか知りたい
4. ちょっとだけ背中を押してほしい
5. 現実的に次の一歩を決めたい

確認対象:

- レイ
- ジョー
- ケン
- ミナ
- サトウ
- 心の鏡
- 委ねる
- 一閃
- 対話
- 深淵
- OTHERS

評価観点:

- 一般チャットに寄りすぎていないか
- エージェントの視点が出ているか
- 長すぎないか
- 内部promptを漏らしていないか
- 医療/診断に見えすぎていないか
