#!/bin/bash
set -euo pipefail

# ============================================
# Deploy Netflix Profile to Azure
# ============================================
# Prerequisites:
#   - Azure CLI installed and logged in (az login)
#   - Docker installed and running
#
# Usage:
#   chmod +x deploy.sh
#   ./deploy.sh
# ============================================

RESOURCE_GROUP="arjun-profile-rg"
LOCATION="eastus2"
ACR_NAME="arjunprofileacr"
IMAGE_NAME="netflix-profile"
IMAGE_TAG="latest"

echo "================================================"
echo "  Deploying Netflix Profile to Azure"
echo "================================================"

# Step 1: Create Resource Group
echo ""
echo "[1/5] Creating resource group: $RESOURCE_GROUP"
az group create --name "$RESOURCE_GROUP" --location "$LOCATION" --output none

# Step 2: Deploy Infrastructure (Bicep)
echo "[2/5] Deploying Azure infrastructure..."
DEPLOY_OUTPUT=$(az deployment group create \
  --resource-group "$RESOURCE_GROUP" \
  --template-file infra/main.bicep \
  --parameters infra/parameters.json \
  --query "properties.outputs" \
  --output json)

ACR_LOGIN_SERVER=$(echo "$DEPLOY_OUTPUT" | python3 -c "import sys,json; print(json.load(sys.stdin)['acrLoginServer']['value'])")
WEB_APP_URL=$(echo "$DEPLOY_OUTPUT" | python3 -c "import sys,json; print(json.load(sys.stdin)['webAppUrl']['value'])")
AI_CONNECTION_STRING=$(echo "$DEPLOY_OUTPUT" | python3 -c "import sys,json; print(json.load(sys.stdin)['appInsightsConnectionString']['value'])")

echo "  ACR: $ACR_LOGIN_SERVER"
echo "  Web App: $WEB_APP_URL"

# Step 3: Inject Application Insights connection string into analytics.js
echo "[3/5] Configuring Application Insights..."
if [ -n "$AI_CONNECTION_STRING" ]; then
  sed -i.bak "s|const AI_CONNECTION_STRING = '';|const AI_CONNECTION_STRING = '$AI_CONNECTION_STRING';|" js/analytics.js
  rm -f js/analytics.js.bak
  echo "  Application Insights configured."
fi

# Step 4: Build and push Docker image
echo "[4/5] Building and pushing Docker image..."
az acr login --name "$ACR_NAME"
docker build -t "$ACR_LOGIN_SERVER/$IMAGE_NAME:$IMAGE_TAG" .
docker push "$ACR_LOGIN_SERVER/$IMAGE_NAME:$IMAGE_TAG"

# Restore analytics.js (remove injected connection string from source)
git checkout -- js/analytics.js 2>/dev/null || true

# Step 5: Restart Web App to pull latest image
echo "[5/5] Restarting Web App..."
az webapp restart --name "arjun-netflix-profile" --resource-group "$RESOURCE_GROUP"

echo ""
echo "================================================"
echo "  Deployment complete!"
echo "  URL: $WEB_APP_URL"
echo "================================================"
