# LP Template

このディレクトリは新規LP作成の**雛形**です。直接編集しないでください。

## 構成

```
lp-template/
├── index.html       # LP本体テンプレート (HTML構造のみ、画像URLは要差替え)
├── assets/
│   ├── css/style.css   # ル・ディアファーヌLP由来のフルスタイル
│   ├── js/main.js      # カウントダウン、フォーム、離脱モーダル等のロジック
│   └── images/      # 空 (新LP用画像をここに配置)
```

## 新規LPを作る時

直接コピーせず、必ず以下のスクリプトを使ってください：

```bash
./scripts/create-lp.sh <テナント> <LP-ID>

# 例
./scripts/create-lp.sh rcs lp2
./scripts/create-lp.sh alcazar lp1
```

スクリプトが以下を自動実行します：
- テンプレートを `public/{テナント}/lp/{LP-ID}/` にコピー
- canonical/og:url を新URLに自動更新
- キャッシュバスティング `?v=YYYYMMDD` を今日の日付に更新
- ルートHubにリンクを追加するための雛形を出力
