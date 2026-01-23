#!/bin/bash

# Apply Static Web App Settings (Post-Deployment)
# Run this AFTER the main infrastructure deployment completes
# This avoids race conditions during SWA provisioning

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}  Apply Static Web App Settings${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo -e "${RED}Error: Azure CLI is not installed${NC}"
    exit 1
fi

# Check if logged in
if ! az account show &> /dev/null; then
    echo -e "${YELLOW}Not logged in to Azure. Logging in...${NC}"
    az login
fi

# Parameters
LOCATION_SHORT="eas"
BASE_NAME="tr-hme"
SUBSCRIPTION_ID=$(az account show --query id -o tsv)

echo -e "${GREEN}Current Subscription: $SUBSCRIPTION_ID${NC}"
echo ""

# Function to apply settings to a Static Web App
apply_settings() {
    local env=$1
    local rg_name="rg-${LOCATION_SHORT}-${BASE_NAME}-${env}"
    local swa_name="swa-${LOCATION_SHORT}-${BASE_NAME}-${env}-$(echo -n "${SUBSCRIPTION_ID}${BASE_NAME}${env}" | shasum -a 256 | cut -c1-13)"
    
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}Environment: ${env}${NC}"
    echo -e "Resource Group: ${rg_name}"
    echo ""
    
    # Check if SWA exists
    if ! az staticwebapp show --name "$swa_name" --resource-group "$rg_name" &> /dev/null; then
        echo -e "${RED}Static Web App not found: $swa_name${NC}"
        echo -e "${YELLOW}Skipping ${env} environment${NC}"
        echo ""
        return 1
    fi
    
    echo -e "${GREEN}Found Static Web App: $swa_name${NC}"
    
    # Get Application Insights connection string
    local ai_name="ai-${LOCATION_SHORT}-${BASE_NAME}-${env}-$(echo -n "${SUBSCRIPTION_ID}${BASE_NAME}${env}" | shasum -a 256 | cut -c1-13)"
    local ai_conn_string=$(az monitor app-insights component show \
        --app "$ai_name" \
        --resource-group "$rg_name" \
        --query connectionString -o tsv)
    
    if [ -z "$ai_conn_string" ]; then
        echo -e "${RED}Could not retrieve Application Insights connection string${NC}"
        return 1
    fi
    
    echo -e "${GREEN}Retrieved Application Insights connection string${NC}"
    
    # Build settings JSON
    local settings_json=$(cat <<EOF
{
  "APPLICATIONINSIGHTS_CONNECTION_STRING": "$ai_conn_string",
  "VITE_APP_ENV": "$env",
  "VITE_ENABLE_DEBUG": "$([ "$env" == "dev" ] && echo "true" || echo "false")",
  "VITE_ENABLE_ANALYTICS": "$([ "$env" == "prod" ] && echo "true" || echo "false")",
  "VITE_APP_VERSION": "1.0.0",
  "VITE_BUILD_DATE": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "VITE_ENABLE_SECURE_LOGGING": "$([ "$env" != "dev" ] && echo "true" || echo "false")",
  "VITE_PRODUCTION_CONSOLE_LEVEL": "$([ "$env" == "prod" ] && echo "error" || echo "warn")"
}
EOF
)
    
    echo -e "${BLUE}Applying app settings...${NC}"
    
    # Apply settings
    az staticwebapp appsettings set \
        --name "$swa_name" \
        --resource-group "$rg_name" \
        --settings "$settings_json" \
        --output none
    
    echo -e "${GREEN}✅ App settings applied successfully for ${env}${NC}"
    echo ""
}

# Ask which environment to configure
echo -e "${YELLOW}Which environment(s) to configure?${NC}"
echo "1) dev"
echo "2) prod"
echo "3) both"
echo ""
read -p "Enter choice [1-3]: " choice

case $choice in
    1)
        apply_settings "dev"
        ;;
    2)
        apply_settings "prod"
        ;;
    3)
        apply_settings "dev"
        apply_settings "prod"
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ App settings configuration complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Retrieve deployment tokens for GitHub Actions:"
echo "   ./scripts/get-deployment-tokens.sh"
echo "2. Set up GitHub secrets:"
echo "   ./scripts/setup-github-secrets.sh"
echo ""
