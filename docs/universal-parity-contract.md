# Jibunkaigi Universal Parity Contract

## 目的

じぶん会議は、iOS / Android / Web で同じUI・同じ機能・同じ文言・同じ操作導線を持つ Universal App として完成させる。
App Store版を主戦場とし、Android / Web も同じ体験を提供する。
旧Vite Web版は、Expo Universal版が完全に追いつくまでの比較元・移行元・保険として扱う。

## 原則

### Principle 1: App Store First, Universal Everywhere

App Store版を主戦場とする。  
ただし、iOS / Android / Web のどれかだけを簡易版にしない。

### Principle 2: No Feature Gap

Web版でユーザーが使える機能は、iOS / Android / Expo Web でも使えるようにする。

### Principle 3: No UI Fork

媒体ごとに別UIを作らない。  
実装上の分岐は許可するが、画面構成・文言・導線・機能は揃える。

### Principle 4: Native Differences Are Absorbed Internally

Safe Area、キーボード、スクロール、フォント差などは内部実装で吸収する。

### Principle 5: Old Vite Web Is a Reference Until Parity

旧Vite Web版は削除しない。  
Expo Universal版が完全に追いつくまで、比較元・移行元・保険として残す。

## 完成条件

以下を満たすまで React Native / Expo Universal 変換完了とは呼ばない。

- iOSで全ユーザー向け機能が動く
- Androidで全ユーザー向け機能が動く
- Expo Webで全ユーザー向け機能が動く
- Web版にできてApp Store版にできないことがない
- App Store版にできてAndroid/Webにできないことがない
- UI・文言・導線が媒体ごとに分岐していない
- Firebase保存が全媒体で同じ
- Gemini Proxy経由のAI応答が全媒体で同じ
