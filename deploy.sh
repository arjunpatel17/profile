#!/bin/bash
set -euo pipefail

# ============================================
# Deploy Netflix Profile to Azure Static Web App
# ============================================
# Prerequisites:
#   - Azure CLI installed and logged in (az login)
#   - npm install -g @azure/static-web-apps-cli (for swa deploy)
#
# Usage:
#   chmod +x deploy.sh
#   ./deploy.sh
# ============================================

RESOURCE_GROUP="arjun-profile-rg"
LOCATION="eastus2"
STATIC_WEB_APP_NAME="arjun-netflix-profile"

echo "================================================"
echo "  Deploying Netflix Profile to Azure"
echo "================================================"

# Step 1: Ensure Resource Group exists
echo ""
echo "[1/4] Ensuring resource group: $RESOURCE_GROUP"
az group create --name "$RESOURCE_GROUP" --location "$LOCATION" --output none 2>/dev/null || true

# Step 2: Deploy Infrastructure (Bicep) — idempotent, updates existing resources
echo "[2/4] Deploying Azure infrastructure..."
DEPLOY_OUTPUT=$(az deployment group create \
  --resource-group "$RESOURCE_GROUP" \
  --template-file infra/main.bicep \
  --parameters infra/parameters.json \
  --mode Incremental \
  --query "properties.outputs" \
  --output json)

STATIC_WEB_APP_URL=$(echo "$DEPLOY_OUTPUT" | python3 -c "import sys,json; print(json.load(sys.stdin)['staticWebAppUrl']['value'])")
AI_CONNECTION_STRING=$(echo "$DEPLOY_OUTPUT" | python3 -c "import sys,json; print(json.load(sys.stdin)['appInsightsConnectionString']['value'])")

echo "  Static Web App URL: $STATIC_WEB_APP_URL"

# Step 3: Inject Application Insights connection string into analytics.js
echo "[3/4] Configuring Application Insights..."
if [ -n "$AI_CONNECTION_STRING" ]; then
  sed -i.bak "s|const AI_CONNECTION_STRING = '';|const AI_CONNECTION_STRING = '$AI_CONNECTION_STRING';|" js/analytics.js
  rm -f js/analytics.js.bak
  echo "  Application Insights configured."
fi

# Step 4: Deploy content to Static Web App
echo "[4/4] Deploying content to Static Web App..."
DEPLOYMENT_TOKEN=$(az staticwebapp secrets list \
  --name "$STATIC_WEB_APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --query "properties.apiKey" \
  --output tsv)

# Copy files to a temp output directory for SWA CLI
DEPLOY_DIR=$(mktemp -d)
cp -R index.html css js assets "$DEPLOY_DIR/" 2>/dev/null || true
cp staticwebapp.config.json "$DEPLOY_DIR/" 2>/dev/null || true

npx --yes @azure/static-web-apps-cli deploy \
  --app-location "$DEPLOY_DIR" \
  --output-location "$DEPLOY_DIR" \
  --deployment-token "$DEPLOYMENT_TOKEN" \
  --env production

rm -rf "$DEPLOY_DIR"

# Restore analytics.js (remove injected connection string from source)
git checkout -- js/analytics.js 2>/dev/null || true

echo ""
echo "================================================"
echo "  Deployment complete!"
echo "  URL: $STATIC_WEB_APP_URL"
echo "================================================"
