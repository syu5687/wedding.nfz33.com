# Royal Chester Saga - Form Submission Worker

`/rcs/lp/lp1/` のフォーム送信を **Resend API** でメール送信するための **Cloudflare Worker**。

```
[ユーザー] → [LPフォーム] → [Cloudflare Worker] → [Resend API] → [info@rc-saga.jp]
                                                              → [ユーザー（自動返信）]
```

---

## 📁 構成

```
cloudflare-worker/
├── worker.js         # Worker本体
├── wrangler.toml     # 設定ファイル（公開変数のみ）
├── package.json
├── .gitignore
└── README.md
```

---

## 🚀 初回デプロイ手順

### 1. Resendアカウント準備

1. [resend.com](https://resend.com) でアカウント作成（既存アカウントでもOK）
2. **ドメインを認証** (Domains → Add Domain)
   - 本案件では既に **`nfz33.com`** が認証済みのため、新規追加不要
   - `nfz33.com` をそのまま送信元ドメインとして使用
3. **API Key 発行** (API Keys → Create API Key)
   - 形式: `re_xxxxxxxxxxxxxxxxxxxx`
   - 後で使うのでコピーしておく

### 2. Cloudflare アカウント準備

1. [cloudflare.com](https://cloudflare.com) でアカウント作成（既にあればOK）
2. Workers & Pages を有効化（無料枠で月10万リクエストまで）

### 3. Wrangler CLI のインストール

```bash
cd cloudflare-worker
npm install
```

### 4. Cloudflareにログイン

```bash
npx wrangler login
# ブラウザが開いて認可を求められる → 許可
```

### 5. 環境変数の設定

#### 公開変数（`wrangler.toml` 内に直接記述済み）

- `TO_EMAIL`: 受信メールアドレス
- `FROM_EMAIL`: 送信元メールアドレス（Resendで認証済みドメイン）
- `ALLOWED_ORIGIN`: CORSで許可するオリジン

必要に応じて `wrangler.toml` を編集。

#### シークレット（コマンドで設定）

```bash
npx wrangler secret put RESEND_API_KEY
# プロンプトが出たら re_xxxxxxxxxxx... のAPIキーをペースト
```

### 6. デプロイ

```bash
npx wrangler deploy
```

成功すると以下のようなURLが発行される：
```
https://rcs-form.YOUR-SUBDOMAIN.workers.dev
```

### 7. LP側のエンドポイントを更新

`public/rcs/lp/lp1/assets/js/main.js` の以下を実際のWorker URLに書き換え：

```javascript
const ENDPOINT = 'https://rcs-form.linkup-mng.workers.dev/';
//                ↑ ここをデプロイで発行されたURLに書き換え
```

その後、LP本体（multi-lpのリポジトリ）をデプロイし直す。

---

## 🧪 動作確認

### Worker単体テスト

```bash
curl -X POST https://rcs-form.YOUR-SUBDOMAIN.workers.dev/ \
  -H "Content-Type: application/json" \
  -d '{
    "fair": "プレミアム体験フェア",
    "name": "テスト 太郎",
    "tel": "090-1234-5678",
    "email": "test@example.com",
    "preferred_date": "2026-06-01",
    "message": "テスト送信です"
  }'
```

期待されるレスポンス:
```json
{"ok":true}
```

### LP実機テスト

1. https://rc-saga.jp/rcs/lp/lp1/ にアクセス
2. フォームを入力して送信
3. `info@rc-saga.jp` にメールが届くことを確認
4. ユーザー側にも自動返信メールが届くことを確認

---

## 🔧 トラブルシューティング

### CORS エラー

ブラウザコンソールに `Access-Control-Allow-Origin` のエラーが出る場合：
- `wrangler.toml` の `ALLOWED_ORIGIN` に該当ドメインが含まれているか確認
- 修正後 `npx wrangler deploy` で再デプロイ

### メールが届かない

```bash
# リアルタイムログ確認
npx wrangler tail
```

考えられる原因：
- Resend API Keyが間違っている → `npx wrangler secret put RESEND_API_KEY` で再設定
- 送信元ドメインがResendで未認証 → Resend管理画面でドメイン認証完了を確認
- 受信側のスパムフィルタに入っている → `info@rc-saga.jp` の迷惑メールフォルダを確認

### Worker URL を変更したい

```bash
# 例: rcs-form-prod に変更
# wrangler.toml の name を変更
name = "rcs-form-prod"

# 再デプロイ
npx wrangler deploy
```

旧URLは自動的に削除はされないので、不要なら Dashboard で削除。

---

## 💰 コスト

### Cloudflare Workers
- **無料枠**: 100,000リクエスト/日
- LP1のフォーム送信なら**実質無料**

### Resend
- **無料枠**: 3,000通/月、ドメイン1つまで
- ブライダルLP規模なら**無料枠で十分**
- 超過時: $20/月で50,000通

---

## 📝 メンテナンス

### APIキーのローテーション

```bash
# Resend管理画面で新しいAPI Key発行 → 古いキーを無効化
npx wrangler secret put RESEND_API_KEY
```

### 受信メールアドレスの変更

`wrangler.toml` の `TO_EMAIL` を編集して再デプロイ：
```bash
npx wrangler deploy
```

複数アドレス送信する場合はカンマ区切り：
```toml
TO_EMAIL = "info@rc-saga.jp,planner@rc-saga.jp"
```

---

## 🔒 セキュリティ

実装済みの保護：

- **ハニーポット**: 隠しフィールド `website` にBotが入力すると無視
- **CORS制限**: 許可ドメインのみアクセス可
- **入力サニタイズ**: HTMLエスケープ
- **必須項目検証**: name/tel が無いと拒否
- **Reply-To 設定**: 返信時にユーザーのメールに直接返せる

将来追加検討：
- レートリミット（同一IPから1分間に3回まで等）
- reCAPTCHA v3 連携

---

## 📞 制作

**LINK-UP Management**
