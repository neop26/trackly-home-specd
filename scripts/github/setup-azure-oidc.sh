#!/bin/bash

# Azure OIDC Setup for GitHub Actions
# This script configures Azure AD federated credentials for GitHub OIDC authentication

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}  Azure OIDC Setup for GitHub Actions${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo -e "${RED}Error: Azure CLI is not installed${NC}"
    echo "Install with: brew install azure-cli"
    exit 1
fi

# Check if logged in
if ! az account show &> /dev/null; then
    echo -e "${YELLOW}Not logged in to Azure. Logging in...${NC}"
    az login
fi

# Get current subscription
SUBSCRIPTION_ID=$(az account show --query id -o tsv)
TENANT_ID=$(az account show --query tenantId -o tsv)

echo -e "${GREEN}Current Azure Subscription:${NC}"
echo "Subscription ID: $SUBSCRIPTION_ID"
echo "Tenant ID: $TENANT_ID"
echo ""

# Get GitHub repository info
echo -e "${YELLOW}Enter your GitHub repository (format: owner/repo):${NC}"
read -r GITHUB_REPO

if [ -z "$GITHUB_REPO" ]; then
    echo -e "${RED}Error: Repository cannot be empty${NC}"
    exit 1
fi

# App registration name
APP_NAME="GitHub-OIDC-${GITHUB_REPO//\//-}"

echo ""
echo -e "${BLUE}Creating Azure AD App Registration: $APP_NAME${NC}"

# Create app registration
APP_ID=$(az ad app create \
    --display-name "$APP_NAME" \
    --query appId -o tsv)

echo -e "${GREEN}✅ App Registration created${NC}"
echo "App ID: $APP_ID"
echo ""

# Create service principal
echo -e "${BLUE}Creating Service Principal...${NC}"
SP_ID=$(az ad sp create --id "$APP_ID" --query id -o tsv)
echo -e "${GREEN}✅ Service Principal created${NC}"
echo "Service Principal ID: $SP_ID"
echo ""

# Create federated credentials for main branch
echo -e "${BLUE}Creating federated credential for main branch...${NC}"

cat > /tmp/federated-cred-main.json <<EOF
{
  "name": "github-main",
  "issuer": "https://token.actions.githubusercontent.com",
  "subject": "repo:${GITHUB_REPO}:ref:refs/heads/main",
  "description": "GitHub Actions OIDC for main branch",
  "audiences": [
    "api://AzureADTokenExchange"
  ]
}
EOF

az ad app federated-credential create \
    --id "$APP_ID" \
    --parameters @/tmp/federated-cred-main.json

echo -e "${GREEN}✅ Federated credential created for main branch${NC}"
echo ""

# Create federated credential for dev branch
echo -e "${BLUE}Creating federated credential for dev branch...${NC}"

cat > /tmp/federated-cred-dev.json <<EOF
{
  "name": "github-dev",
  "issuer": "https://token.actions.githubusercontent.com",
  "subject": "repo:${GITHUB_REPO}:ref:refs/heads/dev",
  "description": "GitHub Actions OIDC for dev branch",
  "audiences": [
    "api://AzureADTokenExchange"
  ]
}
EOF

az ad app federated-credential create \
    --id "$APP_ID" \
    --parameters @/tmp/federated-cred-dev.json

echo -e "${GREEN}✅ Federated credential created for dev branch${NC}"
echo ""

# Create federated credential for pull requests
echo -e "${BLUE}Creating federated credential for pull requests...${NC}"

cat > /tmp/federated-cred-pr.json <<EOF
{
  "name": "github-pr",
  "issuer": "https://token.actions.githubusercontent.com",
  "subject": "repo:${GITHUB_REPO}:pull_request",
  "description": "GitHub Actions OIDC for pull requests",
  "audiences": [
    "api://AzureADTokenExchange"
  ]
}
EOF

az ad app federated-credential create \
    --id "$APP_ID" \
    --parameters @/tmp/federated-cred-pr.json

echo -e "${GREEN}✅ Federated credential created for pull requests${NC}"
echo ""

# Assign Contributor role to service principal
echo -e "${BLUE}Assigning Contributor role to service principal...${NC}"
az role assignment create \
    --assignee "$SP_ID" \
    --role Contributor \
    --scope "/subscriptions/$SUBSCRIPTION_ID"

echo -e "${GREEN}✅ Contributor role assigned${NC}"
echo ""

# Clean up temp files
rm -f /tmp/federated-cred-*.json

# Summary
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Azure OIDC setup complete!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}GitHub Repository Secrets (NOT environment secrets):${NC}"
echo ""
echo "Set these as repository secrets in GitHub:"
echo "Settings → Secrets and variables → Actions → New repository secret"
echo ""
echo -e "${GREEN}AZURE_CLIENT_ID${NC}"
echo "$APP_ID"
echo ""
echo -e "${GREEN}AZURE_TENANT_ID${NC}"
echo "$TENANT_ID"
echo ""
echo -e "${GREEN}AZURE_SUBSCRIPTION_ID${NC}"
echo "$SUBSCRIPTION_ID"
echo ""

# Optionally set via gh CLI
echo -e "${YELLOW}Set these secrets automatically? (requires gh CLI) (y/n)${NC}"
read -r set_secrets

if [ "$set_secrets" = "y" ]; then
    if command -v gh &> /dev/null; then
        echo "$APP_ID" | gh secret set AZURE_CLIENT_ID
        echo "$TENANT_ID" | gh secret set AZURE_TENANT_ID
        echo "$SUBSCRIPTION_ID" | gh secret set AZURE_SUBSCRIPTION_ID
        echo -e "${GREEN}✅ Secrets set in GitHub repository${NC}"
    else
        echo -e "${RED}GitHub CLI not found. Please set secrets manually.${NC}"
    fi
else
    echo -e "${YELLOW}Remember to set these secrets manually in GitHub!${NC}"
fi

echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Verify secrets in GitHub: Settings → Secrets and variables → Actions"
echo "2. Test OIDC authentication with azure-infra-deploy.yml workflow"
echo "3. Deploy Azure infrastructure: cd azure/deploy && ..."
echo ""
