# Le Diaphane (Royal Chester Saga) - Landing Page

ル・ディアファーヌ ブライダルキャンペーンLP / Cloud Run デプロイ用パッケージ

---

## 📁 ディレクトリ構成

```
lediafane-deploy/
├── Dockerfile                  # PHP 8.1 + Apache (Cloud Run用)
├── cloudbuild.yaml             # Cloud Build CI/CD設定
├── .dockerignore
├── .gitignore
├── apache/
│   ├── ports.conf              # 8080ポート設定
│   └── 000-default.conf        # 仮想ホスト設定 (gzip/cache/security)
└── public/                     # ドキュメントルート
    ├── index.html              # メインHTML
    ├── 404.html                # エラーページ
    ├── .htaccess               # URL正規化・MIME設定
    ├── robots.txt
    └── assets/
        ├── css/style.css       # 約51KB
        └── js/main.js          # 約4KB
```

---

## 🚀 デプロイ手順

### 1. ローカルで動作確認

```bash
# ビルド
docker build -t lediafane-lp .

# 起動
docker run -p 8080:8080 lediafane-lp

# ブラウザで http://localhost:8080 を確認
```

### 2. Cloud Run へ手動デプロイ

```bash
# プロジェクト設定
gcloud config set project YOUR_PROJECT_ID

# ビルド & デプロイ (一括)
gcloud run deploy lediafane-lp \
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

### 3. Cloud Build (GitHub連携) で自動デプロイ

`cloudbuild.yaml` を使用。GitHub Desktop等からのpushでトリガー設定。

```bash
gcloud builds submit --config cloudbuild.yaml
```

---

## 🔄 デプロイ後にCSSやJSが反映されない場合（重要）

### キャッシュ対策の仕組み

このプロジェクトでは以下のキャッシュ戦略を採用しています：

- **HTML**: `no-cache, no-store, must-revalidate`（毎回最新を取得）
- **CSS/JS**: 7日間キャッシュ ＋ `?v=YYYYMMDD` バージョンクエリで強制更新
- **画像/フォント**: 1年間キャッシュ（変更頻度が低い）

### CSS/JSを更新したらやること

`public/index.html` 内の **`?v=YYYYMMDD` の値を更新**してください：

```html
<!-- 修正前 -->
<link rel="stylesheet" href="/assets/css/style.css?v=20260430">
<script src="/assets/js/main.js?v=20260430" defer></script>

<!-- 修正後 (今日の日付に変更) -->
<link rel="stylesheet" href="/assets/css/style.css?v=20260501">
<script src="/assets/js/main.js?v=20260501" defer></script>
```

**1コマンドで一括更新する場合：**
```bash
TODAY=$(date +%Y%m%d)
sed -i.bak "s/\?v=[0-9]\{8\}/\?v=${TODAY}/g" public/index.html
rm public/index.html.bak
```

これでブラウザは新しいファイルとして認識し、強制的に再取得します。

### それでも反映されない場合の確認手順

**1. 自分のブラウザのキャッシュをクリア**

- **iPhone Safari**: 設定 → Safari → 履歴とWebサイトデータを消去
- **Android Chrome**: 設定 → プライバシー → 閲覧履歴データの削除 → キャッシュされた画像とファイル
- **PC Chrome**: Cmd/Ctrl + Shift + R（スーパーリロード）
- **シークレットモード**で開く（最も確実）

**2. Cloud Run の最新リビジョンが反映されているか確認**

```bash
# 現在のリビジョンを確認
gcloud run services describe lediafane-lp --region=asia-northeast1 --format='value(status.latestReadyRevisionName)'

# リビジョンの内容確認
gcloud run revisions describe REVISION_NAME --region=asia-northeast1
```

**3. CDN/プロキシのキャッシュをクリア**

Cloudflare 経由の場合：
```
Cloudflare ダッシュボード → 該当ドメイン → Caching → Purge Everything
```

**4. CSSファイルが正しく配信されているか直接確認**

```bash
# CSSを直接ダウンロードして確認
curl -I https://your-domain.com/assets/css/style.css?v=20260430
# Content-Length が約53KB であればOK

curl -s https://your-domain.com/assets/css/style.css?v=20260430 | grep "lining-nums"
# 数件ヒットすればOK
```

---

## 🌐 カスタムドメイン設定

Cloud Run にデプロイ後、独自ドメインを割り当てる場合:

```bash
gcloud run domain-mappings create \
  --service=lediafane-lp \
  --domain=lediafane.example.com \
  --region=asia-northeast1
```

DNS の CNAME 設定をお忘れなく。

---

## 📝 公開前のチェックリスト

- [ ] `index.html` の `<link rel="canonical" href="">` を本番URLに設定
- [ ] OGP画像 (`og:image`) のURLを設定
- [ ] Google Analytics / GTM タグの追加
- [ ] フォーム送信先（Cloudflare Worker + Resend API）の接続
- [ ] 電話番号: 0952-24-0001 ✅ 設定済み
- [ ] 住所: 〒840-0815 佐賀県佐賀市天神1-1-28 ✅ 設定済み
- [ ] LINE公式アカウントURL の設定 (現在は `#` のダミー)
- [ ] Instagram URL の設定 (現在は `#` のダミー)
- [ ] スタッフ実写真の差し替え (現在はプレースホルダー)
- [ ] 来館特典額の確認 (現在は ¥10,000 / JCBギフトカード)
- [ ] キャンペーン適用期間の調整 (現在 2026年5月末日)
- [ ] アクセスマップ画像 or Google Maps埋め込みの追加
- [ ] フェアの詳細写真の追加
- [ ] お客様の声を実レビューに置き換え
- [ ] お見積もり例3プランの金額確認

---

## 🔧 主な機能

### CV最適化要素
- 緊急性カウントダウンバー
- 来館特典¥10,000確約バナー
- メディア掲載・受賞歴バー
- リアルタイム予約状況表示
- お見積もり例3プラン公開
- 39%OFF特典明示
- 来館の流れ6ステップ可視化
- スタッフ紹介6名
- 競合比較表
- 花嫁さまのリアルな1日 (Instagram風)
- FAQ
- 30秒予約フォーム
- 離脱意図検知モーダル

### 技術仕様
- レスポンシブ対応 (SP優先設計)
- IntersectionObserver スクロールアニメーション
- 3段階セーフティネット付き表示制御
- プリコネクト・プリロード最適化
- gzip圧縮
- ブラウザキャッシュ (CSS/JS 1ヶ月、画像 1年)
- セキュリティヘッダー (X-Frame-Options, HSTS, etc.)

---

## 📞 制作

**LINK-UP Management**

