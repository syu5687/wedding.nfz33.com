# 運用ガイドライン

## 📐 命名規則

### テナント名（施設・ブランド）

`public/{テナント}/lp/{LP-ID}/` の **テナント** 部分。

**ルール**：
- 英小文字のみ
- ハイフン区切り (キャメルケース・アンダースコア禁止)
- 短く識別性のある名前

**例**：

| テナント名 | 施設 |
|---|---|
| `rcs` | ロイヤルチェスター佐賀 (Royal Chester Saga) |
| `alcazar` | アルカサルアヴィオ |
| `garden-terrace` | ガーデンテラス福岡 |
| `chourakukan` | 長楽館 |
| `rcs-saga` | (rcsとの混乱回避時の長い名称) |

**避けるべき**：
- ❌ `RCS` (大文字)
- ❌ `royal_chester_saga` (アンダースコア)
- ❌ `royalchestersaga` (区切りなし、長い)
- ❌ `loyal-chester` (タイポ)

### LP-ID

`public/{テナント}/lp/{LP-ID}/` の **LP-ID** 部分。

**2つのパターンを使い分け**：

#### A. シンプル連番 `lp1`, `lp2`, `lp3`...
キャンペーンLPで「特に内容を区別する必要がないとき」に使用。  
社内管理上の通し番号として運用。

#### B. 意味のある名前 `photo-wedding`, `summer-2026`, `family-only`
LPの **目的・内容が明確で、長期運用するもの**に使用。  
URLが説明的になりSEOにも有利。

**使い分け基準**：

| 状況 | おすすめ |
|---|---|
| 期間限定キャンペーン (3ヶ月で終わる) | `lp1`, `lp2`... 連番 |
| ターゲット別LP（フォトウェディング、家族婚等） | 意味のある名前 |
| ブランド変更などのリニューアル版 | `brand-renewal-2026` |
| A/Bテスト用 | `lp1-a`, `lp1-b` |

---

## 🌐 URL構造

```
https://wedding-nfz33-com-xxx.run.app/{テナント}/lp/{LP-ID}/
https://rc-saga.jp/{テナント}/lp/{LP-ID}/  (PHPプロキシ経由)
```

**例**：
- `/rcs/lp/lp1/` — ル・ディアファーヌ キャンペーンLP
- `/rcs/lp/photo-wedding/` — ロイヤルチェスター佐賀 フォトウェディング専用LP
- `/alcazar/lp/lp1/` — アルカサル・アヴィオ キャンペーンLP
- `/garden-terrace/lp/beer-festa-2026/` — GTF ビアフェスタ2026

---

## 🗂 ディレクトリ全体像

```
lediafane-multi-lp/
├── _template/                    # 雛形 (直接編集不可)
│   ├── lp-template/              # 新規LPの元
│   └── README.md
├── scripts/                      # 自動化スクリプト
│   ├── create-lp.sh              # 新規LP作成
│   ├── bust-cache.sh             # キャッシュ強制更新
│   ├── deploy.sh                 # Cloud Runデプロイ
│   └── dev.sh                    # ローカル開発サーバ
├── docs/                         # ドキュメント
│   └── OPERATIONS.md             # このファイル
├── apache/                       # Apacheサーバ設定
│   ├── ports.conf
│   └── 000-default.conf
├── proxy-for-rc-saga/            # rc-saga.jp用PHPプロキシ
│   ├── index.php
│   ├── .htaccess
│   └── README.md
├── public/                       # ★ Cloud Runのドキュメントルート
│   ├── index.html                # Hub (施設一覧)
│   ├── 404.html
│   ├── .htaccess
│   ├── robots.txt
│   ├── rcs/                      # ロイヤルチェスター佐賀
│   │   └── lp/
│   │       ├── lp1/              # ル・ディアファーヌLP (現在公開)
│   │       └── lp2/              # (将来追加)
│   ├── alcazar/                  # (将来追加)
│   └── garden-terrace/           # (将来追加)
├── Dockerfile
├── cloudbuild.yaml
└── README.md
```

---

## 🚀 よくある作業フロー

### A. 同じ施設に新しいキャンペーンLPを追加

例: ロイヤルチェスター佐賀の「フォトウェディング専用LP」を追加

```bash
# 1. 新規LP作成
./scripts/create-lp.sh rcs photo-wedding

# 2. 内容編集
# /public/rcs/lp/photo-wedding/index.html を編集

# 3. 画像配置
# /public/rcs/lp/photo-wedding/assets/images/ に画像を配置

# 4. ハブにリンク追加 (スクリプトの最後に表示されるスニペットを貼り付け)
# /public/index.html に追加

# 5. デプロイ
./scripts/deploy.sh
```

### B. 別施設のLPを新規追加

例: アルカサル・アヴィオのキャンペーンLPを追加

```bash
# 1. 新規LP作成
./scripts/create-lp.sh alcazar lp1

# 2. 内容編集
# /public/alcazar/lp/lp1/index.html を編集
#   - ヘッダー (ROYAL CHESTER SAGA → ALCAZAR AVVIO)
#   - 会場名・住所・電話番号
#   - キャンペーン特典
#   - スタッフ・写真

# 3. 画像配置
# /public/alcazar/lp/lp1/assets/images/ に画像を配置

# 4. ハブに新セクション追加
# /public/index.html を編集して "ALCAZAR AVVIO" セクションを追加

# 5. デプロイ
./scripts/deploy.sh
```

### C. 既存LPのコンテンツ修正（CSS/JSなし）

```bash
# 1. HTML修正
# /public/rcs/lp/lp1/index.html を編集

# 2. デプロイ (HTMLは毎回最新が配信されるのでバスティング不要)
./scripts/deploy.sh
```

### D. CSS/JS修正（キャッシュ強制更新が必要）

```bash
# 1. CSS/JS修正
# /public/rcs/lp/lp1/assets/css/style.css などを編集

# 2. キャッシュバスティング更新
./scripts/bust-cache.sh           # 全LP一括
# または
./scripts/bust-cache.sh rcs/lp/lp1  # 特定LPのみ

# 3. デプロイ
./scripts/deploy.sh

# ↓ 一括実行
./scripts/deploy.sh --bust-cache
```

### E. 既存LPの削除

```bash
# 1. ディレクトリ削除
rm -rf public/rcs/lp/old-campaign

# 2. ハブからリンク削除
# /public/index.html から該当の <a class="lp-card"> ブロックを削除

# 3. デプロイ
./scripts/deploy.sh
```

---

## 🎨 共通リソースの管理方針

複数LPで使い回す画像・CSSを「共通化」する場合：

### 共通フォントやアイコン
全LP共通の場合は `/public/_shared/` 配置を推奨。

```
public/
├── _shared/
│   ├── fonts/
│   ├── icons/
│   └── logos/
└── rcs/lp/lp1/...
```

参照例（HTML内）:
```html
<img src="/_shared/logos/memolead-logo.svg" alt="Memolead">
```

### CSSの共通化（高度）
複数LPで共通のスタイルを使う場合、`_shared/css/base.css` を用意して各LPのstyle.cssから import。

ただし**最初のうちは各LPごとに完結したCSS**にしておくほうが、デザイン調整時に他LPに影響しないので運用が楽。

---

## ⚠️ 命名のNG例と推奨例

| ❌ NG | ✅ 推奨 | 理由 |
|---|---|---|
| `RCS` | `rcs` | 大文字使うとURLで判別困難 |
| `lp_2` | `lp2` | URLにアンダースコア非推奨 |
| `summer2026campaign` | `summer-2026` or `summer-campaign-2026` | 区切り無いと読みづらい |
| `LP-Special` | `lp-special` | URL小文字統一 |
| `フェアLP` | `fair-lp` | URLは英小文字のみ |
| `lp` (LP-IDだけだと曖昧) | `lp1` | 連番付与で他と区別 |

---

## 🔍 トラブルシューティング

### Q. 新しいLPを追加したのに404になる

A. 以下を確認:
1. ディレクトリが正しい階層にあるか: `public/{tenant}/lp/{lp-id}/index.html`
2. デプロイは完了したか: `./scripts/deploy.sh`
3. 末尾スラッシュ付きでアクセスしているか: `/rcs/lp/lp1/` (スラッシュなしは301リダイレクト)

### Q. CSSの修正が反映されない

A. `?v=YYYYMMDD` のキャッシュバスティングが古いまま。
```bash
./scripts/bust-cache.sh rcs/lp/lp1
./scripts/deploy.sh
```

### Q. 複数LPでスタイルが食い違う

A. 各LPの `assets/css/style.css` は完全に独立しているため、修正したいLPごとに個別に編集する必要あり。共通化したい場合は `_shared/css/` を導入する。

---

## 📞 制作

**LINK-UP Management**
