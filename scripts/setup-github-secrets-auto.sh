#!/bin/bash

# Automated GitHub Secrets Setup from Credential Files
# Reads from supabase/DEV_CREDENTIALS.md and supabase/PROD_CREDENTIALS.md
# Automatically sets GitHub environment secrets

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}  Automated GitHub Secrets Setup${NC}"
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

# Function to read value from credential file
read_credential() {
    local file=$1
    local var_name=$2

    if [ ! -f "$file" ]; then
        echo -e "${RED}Error: $file not found${NC}"
        return 1
    fi

    local value=$(grep "^${var_name}=" "$file" | cut -d'=' -f2- | sed 's/^ *//;s/ *$//')
    echo "$value"
}

# Function to set secret from credential file
set_secret_from_file() {
    local env=$1
    local var_name=$2
    local cred_file=$3
    local description=$4

    local value=$(read_credential "$cred_file" "$var_name")

    if [ -z "$value" ]; then
        echo -e "${YELLOW}⚠️  $var_name not found or empty in $cred_file${NC}"
        return 1
    fi

    echo -e "${BLUE}Setting $var_name for $env environment...${NC}"

    # Set the secret
    echo "$value" | gh secret set "$var_name" --env "$env" > /dev/null 2>&1

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $var_name set successfully${NC}"
        return 0
    else
        echo -e "${RED}❌ Failed to set $var_name${NC}"
        return 1
    fi
}

# Function to setup environment from credential file
setup_environment() {
    local env=$1
    local cred_file=$2

    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}Setting up $env environment from $cred_file${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    if [ ! -f "$cred_file" ]; then
        echo -e "${RED}Error: $cred_file not found${NC}"
        echo -e "${YELLOW}Please create $cred_file with the required credentials${NC}"
        return 1
    fi

    local success_count=0
    local total_count=0

    # Azure secrets
    ((total_count++))
    if set_secret_from_file "$env" "AZURE_SWA_DEPLOYMENT_TOKEN" "$cred_file" "Azure SWA deployment token"; then
        ((success_count++))
    fi

    # Supabase secrets
    ((total_count++))
    if set_secret_from_file "$env" "VITE_SUPABASE_URL" "$cred_file" "Supabase project URL"; then
        ((success_count++))
    fi

    ((total_count++))
    if set_secret_from_file "$env" "VITE_SUPABASE_ANON_KEY" "$cred_file" "Supabase anon key"; then
        ((success_count++))
    fi

    ((total_count++))
    if set_secret_from_file "$env" "SUPABASE_PROJECT_REF" "$cred_file" "Supabase project ref"; then
        ((success_count++))
    fi

    ((total_count++))
    if set_secret_from_file "$env" "SUPABASE_DB_PASSWORD" "$cred_file" "Supabase DB password"; then
        ((success_count++))
    fi

    # Edge function secrets
    ((total_count++))
    if set_secret_from_file "$env" "SB_URL" "$cred_file" "Supabase URL for Edge Functions"; then
        ((success_count++))
    fi

    ((total_count++))
    if set_secret_from_file "$env" "SB_ANON_KEY" "$cred_file" "Supabase anon key for Edge Functions"; then
        ((success_count++))
    fi

    ((total_count++))
    if set_secret_from_file "$env" "SB_SERVICE_ROLE_KEY" "$cred_file" "Supabase service role key"; then
        ((success_count++))
    fi

    # Application secrets
    ((total_count++))
    if set_secret_from_file "$env" "SITE_URL" "$cred_file" "Application site URL"; then
        ((success_count++))
    fi

    ((total_count++))
    if set_secret_from_file "$env" "ALLOWED_ORIGINS" "$cred_file" "CORS allowed origins"; then
        ((success_count++))
    fi

    # Prod-specific secrets
    if [ "$env" = "prod" ]; then
        ((total_count++))
        if set_secret_from_file "$env" "INVITE_TOKEN_SECRET" "$cred_file" "Invite token secret"; then
            ((success_count++))
        fi
    fi

    # Optional: Resend email (only if configured)
    local resend_key=$(read_credential "$cred_file" "RESEND_API_KEY")
    if [ -n "$resend_key" ]; then
        ((total_count++))
        if set_secret_from_file "$env" "RESEND_API_KEY" "$cred_file" "Resend API key"; then
            ((success_count++))
        fi

        ((total_count++))
        if set_secret_from_file "$env" "RESEND_FROM" "$cred_file" "Resend from email"; then
            ((success_count++))
        fi
    fi

    # Shared secrets (SUPABASE_ACCESS_TOKEN is shared between dev and prod)
    if [ "$env" = "dev" ]; then
        ((total_count++))
        if set_secret_from_file "$env" "SUPABASE_ACCESS_TOKEN" "$cred_file" "Supabase CLI access token"; then
            ((success_count++))
        fi
    fi

    echo ""
    echo -e "${GREEN}✅ $env setup complete: $success_count/$total_count secrets configured${NC}"
    echo ""

    return 0
}

# Main menu
echo -e "${GREEN}What would you like to do?${NC}"
echo "1) Setup dev environment from .secrets/.env.dev"
echo "2) Setup prod environment from .secrets/.env.prod"
echo "3) Setup both environments"
echo "4) List current secrets"
echo "5) Exit"
echo ""
read -p "Enter choice [1-5]: " choice

case $choice in
    1)
        setup_environment "dev" ".secrets/.env.dev"
        ;;
    2)
        setup_environment "prod" ".secrets/.env.prod"
        ;;
    3)
        setup_environment "dev" ".secrets/.env.dev"
        setup_environment "prod" ".secrets/.env.prod"
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
echo "3. Test workflows: Push to trigger .github/workflows/*.yml"
echo ""