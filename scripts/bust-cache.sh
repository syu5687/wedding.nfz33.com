#!/bin/bash
# ===========================================
# キャッシュバスティング一括更新
# Usage: ./scripts/bust-cache.sh [tenant/lp-id]
#
# CSS/JSを変更した時に全LP（または指定LP）のバージョンクエリを
# 今日の日付に更新する。これでブラウザキャッシュが強制更新される。
#
# 例:
#   ./scripts/bust-cache.sh             # 全LP一括更新
#   ./scripts/bust-cache.sh rcs/lp/lp1  # 特定LPのみ
# ===========================================

set -e

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
TODAY=$(date +%Y%m%d)
TARGET="$1"

if [ -z "$TARGET" ]; then
  # 全LP更新
  echo "🔄 Updating cache version on ALL LPs to ?v=${TODAY}..."
  COUNT=0
  for index_file in $(find "${ROOT_DIR}/public" -name "index.html"); do
    if grep -q '?v=' "$index_file"; then
      sed -i.bak "s|?v=[0-9]\{8\}|?v=${TODAY}|g" "$index_file"
      rm -f "${index_file}.bak"
      echo "   ✓ Updated: ${index_file#$ROOT_DIR/}"
      COUNT=$((COUNT + 1))
    fi
  done
  echo ""
  echo "✅ Updated $COUNT files"
else
  # 特定LP
  TARGET_FILE="${ROOT_DIR}/public/${TARGET}/index.html"
  if [ ! -f "$TARGET_FILE" ]; then
    echo "❌ File not found: $TARGET_FILE"
    exit 1
  fi
  sed -i.bak "s|?v=[0-9]\{8\}|?v=${TODAY}|g" "$TARGET_FILE"
  rm -f "${TARGET_FILE}.bak"
  echo "✅ Updated: ${TARGET_FILE#$ROOT_DIR/}"
fi

echo ""
echo "💡 Now deploy with: ./scripts/deploy.sh"
