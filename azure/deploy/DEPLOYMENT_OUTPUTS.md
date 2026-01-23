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

## Next Steps

1. **Retrieve SWA deployment tokens:**
   ```bash
   # Dev token
   az staticwebapp secrets list -n swa-eas-tr-hme-dev-qcvbp4jwipodu --query "properties.apiKey" -o tsv
   
   # Prod token
   az staticwebapp secrets list -n swa-eas-tr-hme-prod-ojckwvnpx64za --query "properties.apiKey" -o tsv
   ```

2. **Set up Supabase production project**

3. **Configure GitHub secrets** using `scripts/setup-github-secrets.sh`
