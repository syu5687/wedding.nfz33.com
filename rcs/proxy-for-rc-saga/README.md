# Le Diaphane LP - リバースプロキシ

`rc-saga.jp/lp/lp1/` で公開するための PHPリバースプロキシです。

---

## 📁 ファイル構成

```
proxy-for-rc-saga/
├── index.php       # プロキシ本体
├── .htaccess       # Apacheルーティング
└── README.md       # このファイル
```

---

## 🚀 設置手順

### 1. Cloud Run側のURLを取得

Cloud Runデプロイ後に発行される URL を控える：

```bash
gcloud run services describe lediafane-lp \
  --region=asia-northeast1 \
  --format='value(status.url)'
```

例: `https://lediafane-lp-abc123def4-an.a.run.app`

### 2. index.php の URL を更新

```php
// 修正前
const CLOUD_RUN_URL = 'https://lediafane-lp-XXXXXXXXXX-an.a.run.app';

// 修正後 (実際のURLに変更)
const CLOUD_RUN_URL = 'https://lediafane-lp-abc123def4-an.a.run.app';
```

### 3. 共有サーバへFTP/SFTPでアップロード

設置先: `rc-saga.jp/lp/lp1/`

```
rc-saga.jp/
└── lp/
    └── lp1/
        ├── index.php   ← このプロキシ
        └── .htaccess   ← このルーティング
```

### 4. 動作確認

ブラウザで `http://rc-saga.jp/lp/lp1/` にアクセスし、Cloud Run側のLPが表示されればOK。

---

## ⚙️ 動作の仕組み

```
ブラウザ
  ↓ http://rc-saga.jp/lp/lp1/
共有サーバ (Apache + PHP)
  ↓ .htaccess が全リクエストを index.php に転送
index.php
  ↓ /lp/lp1/xxx → / (Cloud Run側ルートに変換)
  ↓ cURLで転送
Cloud Run (Apache + LP)
  ↓ レスポンス
index.php
  ↓ ヘッダー転送 + ボディ送信
ブラウザに表示
```

---

## 🔧 トラブルシューティング

### CSSが反映されない

1. ブラウザのキャッシュクリア
2. `index.html` 内の `?v=YYYYMMDD` の値を更新（README参照）

### 502 Bad Gateway

- Cloud Run のURL が正しいか確認
- 共有サーバで cURL拡張が有効か確認 (`php -m | grep curl`)
- Cloud Runサービスが起動しているか確認

### 画像が読み込まれない

画像URLが Cloud Run側のサーバから配信されているか確認。
外部URL（bridal-campaign.web.app等）への参照は問題なし。

### POSTフォームが送信できない

- `index.php` の `CURLOPT_POSTFIELDS` 部分を確認
- フォーム送信先が外部サービス（Cloudflare Worker等）の場合は別途設定

---

## 📝 制作

**LINK-UP Management**
