#!/bin/bash
# ===================================================================
# Apply Static Web App Settings (Non-Interactive - Both Environments)
# ===================================================================
# Applies app settings to both dev and prod Static Web Apps
# Run this after infrastructure deployment completes
# ===================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}  Apply Static Web App Settings (Both Envs)${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo -e "${GREEN}Current Subscription: $SUBSCRIPTION_ID${NC}"
echo ""

# Function to apply settings to a Static Web App
apply_settings() {
    local env=$1
    local rg_name="rg-${LOCATION_SHORT}-${BASE_NAME}-${env}"
    
    # Get the actual SWA name from Azure instead of trying to calculate it
    local swa_name=$(az staticwebapp list --resource-group "$rg_name" --query "[0].name" -o tsv 2>/dev/null)
    
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}Environment: ${env}${NC}"
    echo -e "Resource Group: ${rg_name}"
    echo ""
    
    # Check if SWA exists
    if [ -z "$swa_name" ]; then
        echo -e "${RED}Static Web App not found in ${rg_name}${NC}"
        echo -e "${YELLOW}Skipping ${env} environment${NC}"
        return 1
    fi
    
    echo -e "Found Static Web App: ${GREEN}${swa_name}${NC}"
    echo ""
    
    # Get Application Insights connection string
    local ai_name=$(az resource list --resource-group "$rg_name" \
        --resource-type "Microsoft.Insights/components" \
        --query "[0].name" -o tsv 2>/dev/null)
    
    if [ -z "$ai_name" ]; then
        echo -e "${RED}Application Insights not found${NC}"
        return 1
    fi
    
    local ai_connection_string=$(az monitor app-insights component show \
        --app "$ai_name" \
        --resource-group "$rg_name" \
        --query "connectionString" -o tsv 2>/dev/null)
    
    if [ -z "$ai_connection_string" ]; then
        echo -e "${RED}Failed to get Application Insights connection string${NC}"
        return 1
    fi
    
    echo -e "Application Insights: ${GREEN}${ai_name}${NC}"
    echo ""
    
    # Environment-specific settings
    local enable_debug="false"
    local enable_analytics="false"
    local console_level="warn"
    local enable_secure_logging="true"
    
    if [ "$env" == "dev" ]; then
        enable_debug="true"
        console_level="debug"
    else
        enable_analytics="true"
    fi
    
    # Build settings JSON
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    local settings_json=$(cat <<EOF
{
    "APPLICATIONINSIGHTS_CONNECTION_STRING": "${ai_connection_string}",
    "VITE_APP_ENV": "${env}",
    "VITE_ENABLE_DEBUG": "${enable_debug}",
    "VITE_ENABLE_ANALYTICS": "${enable_analytics}",
    "VITE_APP_VERSION": "1.0.0",
    "VITE_BUILD_DATE": "${timestamp}",
    "VITE_ENABLE_SECURE_LOGGING": "${enable_secure_logging}",
    "VITE_PRODUCTION_CONSOLE_LEVEL": "${console_level}"
}
EOF
)
    
    echo -e "${BLUE}Applying settings...${NC}"
    
    # Apply settings using az CLI
    if az staticwebapp appsettings set \
        --name "$swa_name" \
        --resource-group "$rg_name" \
        --setting-names $(echo "$settings_json" | jq -r 'to_entries | map("\(.key)=\(.value)") | join(" ")') \
        > /dev/null 2>&1; then
        
        echo -e "${GREEN}✓ Settings applied successfully to ${env}${NC}"
        echo ""
        return 0
    else
        echo -e "${RED}✗ Failed to apply settings to ${env}${NC}"
        echo ""
        return 1
    fi
}

# Apply settings to both environments
dev_success=false
prod_success=false

if apply_settings "dev"; then
    dev_success=true
fi

if apply_settings "prod"; then
    prod_success=true
fi

# Summary
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}Summary:${NC}"
if [ "$dev_success" = true ]; then
    echo -e "  Dev:  ${GREEN}✓ Success${NC}"
else
    echo -e "  Dev:  ${RED}✗ Failed${NC}"
fi

if [ "$prod_success" = true ]; then
    echo -e "  Prod: ${GREEN}✓ Success${NC}"
else
    echo -e "  Prod: ${RED}✗ Failed${NC}"
fi
echo ""

if [ "$dev_success" = true ] && [ "$prod_success" = true ]; then
    echo -e "${GREEN}✓ All settings applied successfully!${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠ Some environments failed${NC}"
    exit 1
fi
