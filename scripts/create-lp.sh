#!/bin/bash
# ===========================================
# 新規LP作成スクリプト
# Usage: ./scripts/create-lp.sh <テナント> <LP-ID>
# 
# 例:
#   ./scripts/create-lp.sh rcs lp2
#   ./scripts/create-lp.sh alcazar lp1
#   ./scripts/create-lp.sh garden-terrace photo-wedding
# ===========================================

set -e

# === 引数チェック ===
if [ $# -ne 2 ]; then
  echo "❌ Usage: $0 <tenant> <lp-id>"
  echo ""
  echo "Examples:"
  echo "  $0 rcs lp2                    # ロイヤルチェスター佐賀 LP2"
  echo "  $0 alcazar lp1                # アルカサルアヴィオ LP1"
  echo "  $0 garden-terrace photo-wedding  # GTF フォトウェディングLP"
  exit 1
fi

TENANT="$1"
LP_ID="$2"
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
TARGET="${ROOT_DIR}/public/${TENANT}/lp/${LP_ID}"
TEMPLATE="${ROOT_DIR}/_template/lp-template"
TODAY=$(date +%Y%m%d)

# === バリデーション ===
# テナント名・LP-IDの英数字・ハイフンチェック
if ! echo "$TENANT" | grep -qE '^[a-z][a-z0-9-]*$'; then
  echo "❌ Tenant name must be lowercase alphanumeric with hyphens (e.g. rcs, alcazar, garden-terrace)"
  exit 1
fi
if ! echo "$LP_ID" | grep -qE '^[a-z0-9][a-z0-9-]*$'; then
  echo "❌ LP-ID must be lowercase alphanumeric with hyphens (e.g. lp1, lp2, photo-wedding)"
  exit 1
fi

# 既存チェック
if [ -d "$TARGET" ]; then
  echo "❌ Already exists: $TARGET"
  echo "   Delete it manually or use a different LP-ID"
  exit 1
fi

# テンプレート存在確認
if [ ! -d "$TEMPLATE" ]; then
  echo "❌ Template not found: $TEMPLATE"
  exit 1
fi

# === コピー実行 ===
echo "📋 Creating new LP..."
echo "   Tenant: $TENANT"
echo "   LP-ID:  $LP_ID"
echo "   Path:   public/${TENANT}/lp/${LP_ID}/"
echo ""

mkdir -p "$(dirname "$TARGET")"
cp -r "$TEMPLATE" "$TARGET"

# === メタ情報を新URLに更新 ===
NEW_URL="https://rc-saga.jp/${TENANT}/lp/${LP_ID}/"
INDEX_FILE="${TARGET}/index.html"

# canonical / og:url を更新 (sed で安全に置換)
# 既存のhref/contentを丸ごと差し替え
sed -i.bak \
  -e "s|<link rel=\"canonical\" href=\"[^\"]*\">|<link rel=\"canonical\" href=\"${NEW_URL}\">|g" \
  -e "s|<meta property=\"og:url\" content=\"[^\"]*\">|<meta property=\"og:url\" content=\"${NEW_URL}\">|g" \
  "$INDEX_FILE"
rm -f "${INDEX_FILE}.bak"

# キャッシュバスティングを今日の日付に
sed -i.bak "s|?v=[0-9]\{8\}|?v=${TODAY}|g" "$INDEX_FILE"
rm -f "${INDEX_FILE}.bak"

# === 完了メッセージ ===
echo "✅ LP created successfully!"
echo ""
echo "📁 Files created:"
find "$TARGET" -type f -not -name ".gitkeep" | sed "s|${ROOT_DIR}/|   |"
echo ""
echo "🌐 URLs (after deploy):"
echo "   Cloud Run: /${TENANT}/lp/${LP_ID}/"
echo "   rc-saga.jp: https://rc-saga.jp/${TENANT}/lp/${LP_ID}/"
echo ""
echo "📝 Next steps:"
echo "   1. Edit ${TARGET}/index.html for new content"
echo "   2. Add images to ${TARGET}/assets/images/"
echo "   3. Add link to public/index.html (Hub) - see snippet below"
echo "   4. Deploy: ./scripts/deploy.sh"
echo ""
echo "📋 Hub snippet (paste into public/index.html):"
echo ""
cat <<EOF
      <a href="/${TENANT}/lp/${LP_ID}/" class="lp-card">
        <div class="lp-card-id">${TENANT^^} / ${LP_ID^^}</div>
        <div class="lp-card-title">[ここに新LPタイトル]</div>
        <div class="lp-card-desc">[ここに簡単な説明]</div>
        <span class="lp-card-arrow">View →</span>
      </a>
EOF
