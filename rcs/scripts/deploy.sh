#!/bin/bash
# ===========================================
# Cloud Run デプロイスクリプト
# Usage: ./scripts/deploy.sh [--bust-cache]
# ===========================================

set -e

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SERVICE_NAME="wedding-nfz33-com"
REGION="asia-northeast1"

cd "$ROOT_DIR"

# --bust-cache オプション付きならキャッシュバスティング先実行
if [ "$1" = "--bust-cache" ]; then
  echo "🔄 Running cache bust before deploy..."
  ./scripts/bust-cache.sh
  echo ""
fi

# プロジェクト確認
PROJECT=$(gcloud config get-value project 2>/dev/null)
if [ -z "$PROJECT" ]; then
  echo "❌ No GCP project set. Run: gcloud config set project YOUR_PROJECT"
  exit 1
fi

echo "📦 Deploy info:"
echo "   Project: $PROJECT"
echo "   Service: $SERVICE_NAME"
echo "   Region:  $REGION"
echo ""

# 確認
read -p "Continue deploy? [y/N] " yn
if [ "$yn" != "y" ] && [ "$yn" != "Y" ]; then
  echo "Cancelled."
  exit 0
fi

# デプロイ実行
echo ""
echo "🚀 Deploying..."
gcloud run deploy "$SERVICE_NAME" \
  --source . \
  --region="$REGION" \
  --platform=managed \
  --allow-unauthenticated \
  --port=8080 \
  --memory=256Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=10

echo ""
echo "✅ Deploy complete!"
echo ""

# URL取得
URL=$(gcloud run services describe "$SERVICE_NAME" --region="$REGION" --format='value(status.url)')
echo "🌐 Service URL: $URL"
echo ""
echo "📋 Quick links:"
echo "   Hub:     $URL/"
for index_file in $(find public -mindepth 4 -name "index.html" 2>/dev/null); do
  path=$(echo "$index_file" | sed 's|public||' | sed 's|/index.html|/|')
  echo "   LP:      ${URL}${path}"
done
