#!/bin/bash

# GitHub Secrets Setup Helper
# This script helps you set up GitHub environment secrets for dev and prod
# It provides a checklist and commands to run for each secret

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}  GitHub Secrets Setup Helper${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}Error: GitHub CLI (gh) is not installed${NC}"
    echo "Install with: brew install gh"
    echo "Then authenticate: gh auth login"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo -e "${RED}Error: Not authenticated with GitHub CLI${NC}"
    echo "Run: gh auth login"
    exit 1
fi

# Get repository info
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)
echo -e "${GREEN}Repository: $REPO${NC}"
echo ""

# Function to set a secret
set_secret() {
    local env=$1
    local name=$2
    local description=$3
    local example=$4
    
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}Secret: $name${NC}"
    echo -e "Environment: ${GREEN}$env${NC}"
    echo -e "Description: $description"
    if [ -n "$example" ]; then
        echo -e "Example: ${YELLOW}$example${NC}"
    fi
    echo ""
    
    # Check if secret already exists
    if gh secret list --env "$env" 2>/dev/null | grep -q "^$name"; then
        echo -e "${YELLOW}⚠️  Secret already exists. Update it? (y/n)${NC}"
        read -r update
        if [ "$update" != "y" ]; then
            echo -e "${BLUE}Skipped${NC}"
            echo ""
            return
        fi
    fi
    
    echo -e "${GREEN}Enter value for $name (input hidden):${NC}"
    read -r -s value
    echo ""
    
    if [ -z "$value" ]; then
        echo -e "${RED}Error: Value cannot be empty${NC}"
        echo ""
        return 1
    fi
    
    # Set the secret
    echo "$value" | gh secret set "$name" --env "$env"
    echo -e "${GREEN}✅ Secret $name set successfully${NC}"
    echo ""
}

# Function to display instructions for retrieving a secret
show_retrieval_instructions() {
    local name=$1
    local instructions=$2
    
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}How to retrieve: $name${NC}"
    echo ""
    echo -e "$instructions"
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

echo -e "${GREEN}What would you like to do?${NC}"
echo "1) Set up dev environment secrets"
echo "2) Set up prod environment secrets"
echo "3) Show secret retrieval instructions"
echo "4) List all current secrets"
echo "5) Exit"
echo ""
read -p "Enter choice [1-5]: " choice

case $choice in
    1)
        echo ""
        echo -e "${BLUE}Setting up DEV environment secrets${NC}"
        echo ""
        
        # Azure SWA Deployment Token
        set_secret "dev" "AZURE_SWA_DEPLOYMENT_TOKEN" \
            "Azure Static Web App deployment token for dev environment" \
            "Run: az staticwebapp secrets list --name <swa-name> --resource-group <rg-name>"
        
        # Vite Supabase URL
        set_secret "dev" "VITE_SUPABASE_URL" \
            "Supabase project URL (build-time env var)" \
            "https://xxxxx.supabase.co"
        
        # Vite Supabase Anon Key
        set_secret "dev" "VITE_SUPABASE_ANON_KEY" \
            "Supabase anon key (build-time env var)" \
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
        
        # Supabase Access Token
        set_secret "dev" "SUPABASE_ACCESS_TOKEN" \
            "Supabase CLI access token (shared across environments)" \
            "sbp_xxxxxxxxxxxxxxxxxxxxx"
        
        # Supabase Project Ref
        set_secret "dev" "SUPABASE_PROJECT_REF" \
            "Supabase project reference ID for dev" \
            "xxxxxxxxxxxxxxxxxxxxx"
        
        # Supabase DB Password
        set_secret "dev" "SUPABASE_DB_PASSWORD" \
            "Supabase database password for dev" \
            ""
        
        # Edge Function Secrets
        set_secret "dev" "SB_URL" \
            "Supabase URL for Edge Functions" \
            "https://xxxxx.supabase.co"
        
        set_secret "dev" "SB_ANON_KEY" \
            "Supabase anon key for Edge Functions" \
            ""
        
        set_secret "dev" "SB_SERVICE_ROLE_KEY" \
            "Supabase service role key for Edge Functions" \
            ""
        
        set_secret "dev" "SITE_URL" \
            "Application site URL for dev" \
            "https://dev.example.com"
        
        set_secret "dev" "ALLOWED_ORIGINS" \
            "CORS allowed origins for dev" \
            "https://dev.example.com,http://localhost:5173"
        
        # Optional: Resend (if using email)
        echo -e "${YELLOW}Configure Resend email service? (y/n)${NC}"
        read -r configure_resend
        if [ "$configure_resend" = "y" ]; then
            set_secret "dev" "RESEND_API_KEY" \
                "Resend API key for email" \
                "re_xxxxxxxxxxxxx"
            
            set_secret "dev" "RESEND_FROM" \
                "Resend from email address" \
                "noreply@example.com"
        fi
        
        echo -e "${GREEN}✅ Dev environment secrets configured!${NC}"
        ;;
        
    2)
        echo ""
        echo -e "${BLUE}Setting up PROD environment secrets${NC}"
        echo -e "${RED}⚠️  Production infrastructure must be deployed first!${NC}"
        echo ""
        echo "Have you deployed production Azure SWA and Supabase? (y/n)"
        read -r deployed
        
        if [ "$deployed" != "y" ]; then
            echo -e "${YELLOW}Please deploy production infrastructure first:${NC}"
            echo "1. Deploy Azure infrastructure: cd azure/deploy && az deployment sub create ..."
            echo "2. Create Supabase production project: https://supabase.com/dashboard"
            echo "3. Then run this script again"
            exit 0
        fi
        
        # Same secrets as dev but for prod environment
        set_secret "prod" "AZURE_SWA_DEPLOYMENT_TOKEN" \
            "Azure Static Web App deployment token for prod environment" \
            ""
        
        set_secret "prod" "VITE_SUPABASE_URL" \
            "Supabase project URL (build-time env var)" \
            "https://xxxxx.supabase.co"
        
        set_secret "prod" "VITE_SUPABASE_ANON_KEY" \
            "Supabase anon key (build-time env var)" \
            ""
        
        # Note: SUPABASE_ACCESS_TOKEN is shared, already set in dev
        
        set_secret "prod" "SUPABASE_PROJECT_REF" \
            "Supabase project reference ID for prod" \
            ""
        
        set_secret "prod" "SUPABASE_DB_PASSWORD" \
            "Supabase database password for prod" \
            ""
        
        set_secret "prod" "SB_URL" \
            "Supabase URL for Edge Functions" \
            ""
        
        set_secret "prod" "SB_ANON_KEY" \
            "Supabase anon key for Edge Functions" \
            ""
        
        set_secret "prod" "SB_SERVICE_ROLE_KEY" \
            "Supabase service role key for Edge Functions" \
            ""
        
        set_secret "prod" "SITE_URL" \
            "Application site URL for prod" \
            "https://app.example.com"
        
        set_secret "prod" "ALLOWED_ORIGINS" \
            "CORS allowed origins for prod" \
            "https://app.example.com"
        
        if [ "$configure_resend" = "y" ]; then
            set_secret "prod" "RESEND_API_KEY" \
                "Resend API key for email" \
                ""
            
            set_secret "prod" "RESEND_FROM" \
                "Resend from email address" \
                ""
        fi
        
        set_secret "prod" "INVITE_TOKEN_SECRET" \
            "Secret for signing invite tokens" \
            ""
        
        echo -e "${GREEN}✅ Prod environment secrets configured!${NC}"
        ;;
        
    3)
        echo ""
        echo -e "${BLUE}Secret Retrieval Instructions${NC}"
        echo ""
        
        show_retrieval_instructions "AZURE_SWA_DEPLOYMENT_TOKEN" \
"1. List your Azure Static Web Apps:
   ${GREEN}az staticwebapp list --query \"[].{name:name, rg:resourceGroup}\" -o table${NC}

2. Get deployment token:
   ${GREEN}az staticwebapp secrets list \\
     --name <static-web-app-name> \\
     --resource-group <resource-group-name> \\
     --query properties.apiKey -o tsv${NC}"
        
        show_retrieval_instructions "Supabase Secrets" \
"1. Go to Supabase Dashboard: ${BLUE}https://supabase.com/dashboard${NC}
2. Select your project
3. Go to Settings → API
   - Project URL: Copy 'URL' value → VITE_SUPABASE_URL, SB_URL
   - Anon key: Copy 'anon public' → VITE_SUPABASE_ANON_KEY, SB_ANON_KEY
   - Service role key: Copy 'service_role' → SB_SERVICE_ROLE_KEY
4. Go to Settings → General
   - Reference ID: Copy 'Reference ID' → SUPABASE_PROJECT_REF
5. Go to Settings → Database
   - Password: Copy 'Password' → SUPABASE_DB_PASSWORD"
        
        show_retrieval_instructions "SUPABASE_ACCESS_TOKEN" \
"1. Go to Supabase Dashboard: ${BLUE}https://supabase.com/dashboard${NC}
2. Click your profile icon (top right)
3. Go to 'Access Tokens'
4. Click 'Generate New Token'
5. Name it 'GitHub Actions' and copy the token
6. This token is ${YELLOW}shared across dev and prod${NC}"
        
        show_retrieval_instructions "Azure OIDC (for infrastructure deployment)" \
"1. Create Azure App Registration:
   ${GREEN}az ad app create --display-name \"GitHub-OIDC-trackly-home\"${NC}

2. Create service principal:
   ${GREEN}az ad sp create --id <app-id-from-step-1>${NC}

3. Create federated credential for main branch:
   ${GREEN}az ad app federated-credential create \\
     --id <app-id> \\
     --parameters '{
       \"name\": \"github-main\",
       \"issuer\": \"https://token.actions.githubusercontent.com\",
       \"subject\": \"repo:<org>/<repo>:ref:refs/heads/main\",
       \"audiences\": [\"api://AzureADTokenExchange\"]
     }'${NC}

4. Assign permissions:
   ${GREEN}az role assignment create \\
     --assignee <service-principal-id> \\
     --role Contributor \\
     --scope /subscriptions/<subscription-id>${NC}

5. Set repository secrets (not environment secrets):
   - AZURE_CLIENT_ID: App ID from step 1
   - AZURE_TENANT_ID: Your Azure tenant ID
   - AZURE_SUBSCRIPTION_ID: Your Azure subscription ID"
        ;;
        
    4)
        echo ""
        echo -e "${BLUE}Current GitHub Secrets${NC}"
        echo ""
        
        echo -e "${GREEN}Dev Environment:${NC}"
        gh secret list --env dev 2>/dev/null || echo "No dev environment found"
        echo ""
        
        echo -e "${GREEN}Prod Environment:${NC}"
        gh secret list --env prod 2>/dev/null || echo "No prod environment found"
        echo ""
        
        echo -e "${GREEN}Repository Secrets (OIDC):${NC}"
        gh secret list 2>/dev/null || echo "No repository secrets found"
        echo ""
        ;;
        
    5)
        echo "Exiting..."
        exit 0
        ;;
        
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}Script completed!${NC}"
echo ""
echo "Next steps:"
echo "1. Verify secrets: gh secret list --env dev"
echo "2. Verify secrets: gh secret list --env prod"
echo "3. Test workflows: .github/workflows/*.yml"
echo ""
