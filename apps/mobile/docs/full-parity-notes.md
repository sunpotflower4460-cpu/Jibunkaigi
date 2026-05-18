# Expo Universal Full Parity Notes

## 目的
apps/mobile は「モバイル用簡易版」ではない。  
旧Vite Web版じぶん会議を100%そのままExpo Universal化する本体である。

## 実装時の注意
- UIを勝手に簡略化しない
- Web版にある導線を消さない
- iOSだけ別UIにしない
- Androidだけ後回しにしない
- Expo Webも同じ導線にする
- 未実装は必ずGap Registerへ残す

## 最終完成条件
Full Parity Gap Registerが全て完了すること。
