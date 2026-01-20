# Trackly HME Static Web Apps (v2)

This folder deploys two resource groups (`rg-tr-hme-dev`, `rg-tr-hme-prod`) and one Azure Static Web App plus monitoring per environment using Bicep.

## Prerequisites

- Azure CLI v2.58+ with `az bicep install` completed
- Logged in: `az login`
- Correct subscription selected: `az account set --subscription <subscription-id>`

## Deploy both environments (dev and prod)

```sh
cd /Users/neop26/Library/CloudStorage/OneDrive-Personal/Aben_Personal/_Code_Repo/1_Repository/2_Github/attendance-tracker-bundle/deployment/azure/v2
az deployment sub create \
  --location eastasia \
  --name tr-hme-v2-deploy \
  --template-file main.bicep \
  --parameters @main.bicepparam
```

## Inspect deployment outputs

```sh
az deployment sub show \
  --name tr-hme-v2-deploy \
  --query "properties.outputs"
```

## Retrieve deployment tokens (per environment)

1. List the Static Web App names from the outputs (`staticWebAppDetails`).
2. For each app, run:

```sh
az staticwebapp secrets list \
  --name <static-web-app-name> \
  --resource-group <rg-tr-hme-dev|rg-tr-hme-prod> \
  --query properties.apiKey -o tsv
```

## View monitoring connection data

- Application Insights and Log Analytics resource IDs are included in the deployment outputs.
- Connection strings/keys are intentionally not emitted; fetch them as needed:

```sh
az monitor app-insights component show \
  --app <ai-name-from-outputs> \
  --resource-group <rg-tr-hme-dev|rg-tr-hme-prod> \
  --query "{connectionString:properties.ConnectionString, instrumentationKey:properties.InstrumentationKey}"
```

## Cleanup

```sh
az group delete --name rg-tr-hme-dev --yes --no-wait
az group delete --name rg-tr-hme-prod --yes --no-wait
```
