# Azure Deployment Outputs

Deployment completed: 2026-01-23

## Resource Groups

| Environment | Name | Location | Status |
|-------------|------|----------|--------|
| Dev | rg-eas-tr-hme-dev | East Asia | ✓ Deployed |
| Prod | rg-eas-tr-hme-prod | East Asia | ✓ Deployed |

## Static Web Apps

| Environment | Name | Default Hostname | Resource Group | Status |
|-------------|------|------------------|----------------|--------|
| Dev | swa-eas-tr-hme-dev-qcvbp4jwipodu | witty-bay-0b4318700.1.azurestaticapps.net | rg-eas-tr-hme-dev | ✓ Deployed |
| Prod | swa-eas-tr-hme-prod-ojckwvnpx64za | wonderful-bush-00fa59800.2.azurestaticapps.net | rg-eas-tr-hme-prod | ✓ Deployed |

## Application Insights

| Environment | Name | Resource Group | Status |
|-------------|------|----------------|--------|
| Dev | ai-eas-tr-hme-dev-qcvbp4jwipodu | rg-eas-tr-hme-dev | ✓ Deployed |
| Prod | ai-eas-tr-hme-prod-ojckwvnpx64za | rg-eas-tr-hme-prod | ✓ Deployed |

## App Settings

Both environments have the following settings configured:

### Dev Environment
- `VITE_APP_ENV=dev`
- `VITE_ENABLE_DEBUG=true`
- `VITE_ENABLE_ANALYTICS=false`
- `VITE_PRODUCTION_CONSOLE_LEVEL=debug`

### Prod Environment
- `VITE_APP_ENV=prod`
- `VITE_ENABLE_DEBUG=false`
- `VITE_ENABLE_ANALYTICS=true`
- `VITE_PRODUCTION_CONSOLE_LEVEL=warn`

Both environments also have:
- `APPLICATIONINSIGHTS_CONNECTION_STRING` (configured)
- `VITE_ENABLE_SECURE_LOGGING=true`
- `VITE_APP_VERSION=1.0.0`
- `VITE_BUILD_DATE` (timestamp)

## SWA Deployment Tokens

**Important**: These tokens are used by GitHub Actions to deploy to Static Web Apps. Store them as GitHub secrets.

| Environment | Token (First 20 chars) | Secret Name | Status |
|-------------|----------------------|-------------|--------|
| Dev | d4b9c1b4575057da0fd... | AZURE_STATIC_WEB_APPS_API_TOKEN_DEV | ✓ Retrieved |
| Prod | e42a2f89d68c7172550... | AZURE_STATIC_WEB_APPS_API_TOKEN_PROD | ✓ Retrieved |

Full tokens available via:
```bash
# Dev
az staticwebapp secrets list -n swa-eas-tr-hme-dev-qcvbp4jwipodu --query "properties.apiKey" -o tsv

# Prod
az staticwebapp secrets list -n swa-eas-tr-hme-prod-ojckwvnpx64za --query "properties.apiKey" -o tsv
```

## Next Steps

1. ✅ **Retrieve SWA deployment tokens** - COMPLETED

2. **Set up Supabase production project** at https://supabase.com/dashboard
   - Create new project: `trackly-home-prod`
   - Region: Singapore (ap-southeast-1) - closest to East Asia
   - Document: Project URL, anon key, service role key, project ref, database password

3. **Configure GitHub secrets** using `scripts/setup-github-secrets.sh`
