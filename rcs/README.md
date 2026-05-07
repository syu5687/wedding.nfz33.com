# Memolead Wedding LP Hub

メモリードグループ ブライダル施設のランディングページ集約サーバ。  
**1つのCloud Runで複数施設・複数LPをパスベースルーティングで配信します。**

---

## 📚 ドキュメント

- **このREADME**: クイックスタート
- **[docs/OPERATIONS.md](docs/OPERATIONS.md)** ★必読: 運用ガイドライン・命名規則・よくある作業フロー
- **[_template/README.md](_template/README.md)**: テンプレート構造
- **[proxy-for-rc-saga/README.md](proxy-for-rc-saga/README.md)**: PHPプロキシ設置手順

---

## ⚡ クイックリファレンス

### 新規LPを追加

```bash
# テナント名 LP-ID
./scripts/create-lp.sh rcs lp2
./scripts/create-lp.sh alcazar lp1
./scripts/create-lp.sh garden-terrace photo-wedding
```

### CSS/JSを修正してデプロイ

```bash
# キャッシュ強制更新付きでデプロイ
./scripts/deploy.sh --bust-cache
```

### ローカル動作確認

```bash
./scripts/dev.sh
# http://localhost:8080 で確認
```

---

## 📁 ディレクトリ構成

```
lediafane-multi-lp/
├── Dockerfile                       # PHP 8.1 + Apache (Cloud Run用)
├── cloudbuild.yaml                  # Cloud Build CI/CD
├── .dockerignore / .gitignore
├── apache/
│   ├── ports.conf                   # 8080ポート設定
│   └── 000-default.conf             # 仮想ホスト設定
├── public/                          # ドキュメントルート
│   ├── index.html                   # 施設一覧Hub (社内向け)
│   ├── 404.html
│   ├── .htaccess                    # 末尾スラッシュ正規化
│   ├── robots.txt
│   └── rcs/                         # ★ ロイヤルチェスター佐賀
│       └── lp/
│           └── lp1/                 # ★ 現在公開中のLP
│               ├── index.html
│               └── assets/
│                   ├── css/style.css
│                   ├── js/main.js
│                   └── images/      (20ファイル / 4.2MB)
└── proxy-for-rc-saga/               # rc-saga.jp用PHPリバースプロキシ
    ├── index.php
    ├── .htaccess
    └── README.md
```

---

## 🌐 公開URL構造

```
https://wedding-nfz33-com-665477084949.asia-northeast1.run.app/
├── /                               → 施設一覧Hub (社内用)
├── /rcs/lp/lp1/                    → ル・ディアファーヌ キャンペーンLP ★現在公開
├── /rcs/lp/lp2/                    → (将来追加予定)
├── /alcazar/lp/lp1/                → (将来: アルカサルアヴィオ)
├── /garden-terrace/lp/lp1/         → (将来: ガーデンテラス福岡)
└── ...
```

リバースプロキシ経由：
```
https://rc-saga.jp/rcs/lp/lp1/  →  Cloud Run /rcs/lp/lp1/
```

---

## 🚀 デプロイ手順

### 初回デプロイ

```bash
gcloud config set project YOUR_PROJECT_ID

gcloud run deploy wedding-nfz33-com \
  --source . \
  --region=asia-northeast1 \
  --platform=managed \
  --allow-unauthenticated \
  --port=8080 \
  --memory=256Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=10
```

### 更新デプロイ

```bash
# (任意) キャッシュバスティング更新 - CSS/JSを修正した時のみ
TODAY=$(date +%Y%m%d)
find public -name "index.html" -exec sed -i "s/\?v=[0-9]\{8\}/\?v=${TODAY}/g" {} \;

# デプロイ
gcloud run deploy wedding-nfz33-com --source . --region=asia-northeast1
```

### Cloud Build (GitHub連携) で自動デプロイ

`cloudbuild.yaml` を使用。GitHubのpushでトリガー。

```bash
gcloud builds submit --config cloudbuild.yaml
```

---

## ➕ LPを追加する手順

### 同じ施設の別LP（例: rcs/lp/lp2 を追加）

1. `public/rcs/lp/lp1/` をコピー：
   ```bash
   cp -r public/rcs/lp/lp1 public/rcs/lp/lp2
   ```
2. `public/rcs/lp/lp2/index.html` の内容を新しいキャンペーンに合わせて編集
3. 必要に応じて `public/rcs/lp/lp2/assets/images/` に新規画像を追加
4. ルートの `public/index.html` (Hub) のリンクを追加
5. 通常通りデプロイ

### 別施設のLPを追加（例: alcazar/lp/lp1 を追加）

1. 新規フォルダ作成：
   ```bash
   mkdir -p public/alcazar/lp/lp1
   cp -r public/rcs/lp/lp1/{index.html,assets} public/alcazar/lp/lp1/
   ```
2. `public/alcazar/lp/lp1/index.html` を新施設用に編集
3. ルートの `public/index.html` (Hub) に新セクション追加
4. デプロイ

**重要**: 各LPの `assets/css/style.css` 内の画像参照は **`../images/`** という相対パスです。これは `assets/css/style.css` から見た `assets/images/` への相対参照なので、フォルダ構造を保てばどこに配置しても動作します。

---

## 🌐 カスタムドメイン設定

```bash
# 例: lp.memolead-wedding.jp を割り当て
gcloud run domain-mappings create \
  --service=wedding-nfz33-com \
  --domain=lp.memolead-wedding.jp \
  --region=asia-northeast1
```

---

## 🔄 PHPリバースプロキシ経由公開（rc-saga.jp）

`proxy-for-rc-saga/` 配下のファイルを共有サーバの `rc-saga.jp/rcs/lp/lp1/` に設置。
詳細は `proxy-for-rc-saga/README.md` 参照。

**プロキシのパスマッピング**

| アクセスURL | プロキシ | Cloud Run側 |
|---|---|---|
| `rc-saga.jp/rcs/lp/lp1/` | パススルー | `/rcs/lp/lp1/` |
| `rc-saga.jp/rcs/lp/lp1/assets/css/style.css` | パススルー | `/rcs/lp/lp1/assets/css/style.css` |

---

## 📝 公開前のチェックリスト

各LP共通：
- [ ] `<link rel="canonical">` を本番URLに設定
- [ ] `<meta property="og:url">` を本番URLに設定
- [ ] `?v=YYYYMMDD` キャッシュバスティングの値を最新化
- [ ] OGP画像 (`og:image`) を設定
- [ ] GA4 / GTM タグを追加
- [ ] フォーム送信先（Cloudflare Worker + Resend API）を接続
- [ ] LINE / Instagram URL を実URL化

---

## 🔧 トラブルシューティング

### CSSが反映されない
1. ブラウザのシークレットモードで再読み込み
2. `?v=YYYYMMDD` の値を更新
3. Cloud Runの最新リビジョンを確認:
   ```bash
   gcloud run services describe wedding-nfz33-com --region=asia-northeast1
   ```

### `/rcs/lp/lp1` (末尾スラッシュなし) でアクセスすると相対パスが壊れる
ルートの `.htaccess` で末尾スラッシュ強制リダイレクトを設定済み。`mod_rewrite` が有効でない場合は手動で `/rcs/lp/lp1/` (末尾スラッシュ付き) でアクセス。

### 404になる
- ファイルが正しく `public/rcs/lp/lp1/` 配下にあるか確認
- Dockerビルド時に `public/` がコピーされているか `Dockerfile` を確認

---

## 📞 制作

**LINK-UP Management**
