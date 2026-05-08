#!/bin/bash
# ===========================================
# ローカル開発サーバー
# Usage: ./scripts/dev.sh [port]
# ===========================================

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${1:-8080}"

cd "${ROOT_DIR}/public"

echo "🚀 Starting dev server at http://localhost:${PORT}"
echo ""
echo "📋 Available URLs:"
echo "   Hub:     http://localhost:${PORT}/"
for index_file in $(find . -mindepth 4 -name "index.html" 2>/dev/null); do
  path=$(echo "$index_file" | sed 's|^\./||' | sed 's|/index.html||')
  echo "   LP:      http://localhost:${PORT}/${path}/"
done
echo ""
echo "Press Ctrl+C to stop."
echo ""

python3 -m http.server "$PORT"
