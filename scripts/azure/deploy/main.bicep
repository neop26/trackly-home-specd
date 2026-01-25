// ===================================================================
// Trackly HME - Dual Static Web App Deployment (Dev + Prod)
// ===================================================================
// - Creates resource group(s) + SWA per environment
// - Provision Application Insights + Log Analytics per environment
// - Keeps GitHub workflow generation disabled (manual deploy tokens only)
// - Supports targeted deployment via `targetEnvironment` (dev|prod|both)
// ===================================================================

targetScope = 'subscription'

// ===================================================================
// PARAMETERS
// ===================================================================

@description('Azure region for all resources')
@allowed([
  'eastasia'
  'australiasoutheast'
  'eastus'
  'westus2'
  'eastus2'
])
param location string = 'eastasia'

@description('Azure Region Short Name for resource naming purposes')
@allowed([
  'eas'
  'ase'
  'eus'
  'wus2'
  'eus2'
])
param locationShortName string = 'eas'

@description('Base name used for resource group and Static Web App names')
param baseName string = 'tr-hme'

@description('Which environment(s) to deploy')
@allowed([
  'dev'
  'prod'
  'both'
])
param targetEnvironment string = 'both'

@description('Deployment timestamp used for app settings metadata')
param deploymentTimestamp string = utcNow()

@description('Tags applied to every resource')
param tags object = {
  Application: 'trackly'
  Deployedusing: 'bicep-githubactions'
  Project: 'trackly-home'
}

// ===================================================================
// ENVIRONMENT CONFIGURATION
// ===================================================================

var allEnvironments = [
  {
    name: 'dev'
    resourceGroupName: 'rg-${locationShortName}-${baseName}-dev'
    staticWebAppName: 'swa-${locationShortName}-${baseName}-dev-${uniqueString(subscription().subscriptionId, baseName, 'dev')}'
    logAnalyticsName: 'law-${locationShortName}-${baseName}-dev-${uniqueString(subscription().subscriptionId, baseName, 'dev')}'
    appInsightsName: 'ai-${locationShortName}-${baseName}-dev-${uniqueString(subscription().subscriptionId, baseName, 'dev')}'
    skuName: 'Free'
    stagingEnvironmentPolicy: 'Enabled'
    publicNetworkAccess: 'Enabled'
  }
  {
    name: 'prod'
    resourceGroupName: 'rg-${locationShortName}-${baseName}-prod'
    staticWebAppName: 'swa-${locationShortName}-${baseName}-prod-${uniqueString(subscription().subscriptionId, baseName, 'prod')}'
    logAnalyticsName: 'law-${locationShortName}-${baseName}-prod-${uniqueString(subscription().subscriptionId, baseName, 'prod')}'
    appInsightsName: 'ai-${locationShortName}-${baseName}-prod-${uniqueString(subscription().subscriptionId, baseName, 'prod')}'
    skuName: 'Standard'
    stagingEnvironmentPolicy: 'Disabled'
    publicNetworkAccess: 'Enabled'
  }
]

// Filtered environments based on targetEnvironment
var environments = targetEnvironment == 'both'
  ? allEnvironments
  : (targetEnvironment == 'dev' ? [allEnvironments[0]] : [allEnvironments[1]])

// ===================================================================
// RESOURCE GROUPS
// ===================================================================

resource resourceGroups 'Microsoft.Resources/resourceGroups@2023-07-01' = [
  for env in environments: {
    name: env.resourceGroupName
    location: location
    tags: union(tags, {
      Environment: env.name
      'azd-env-name': env.name
    })
  }
]

// ===================================================================
// MONITORING (Log Analytics + App Insights)
// ===================================================================

module monitoring '../modules/monitoring.bicep' = [
  for (env, i) in environments: {
    name: 'monitoring-${env.name}'
    scope: resourceGroups[i]
    dependsOn: [
      resourceGroups[i]
    ]
    params: {
      location: location
      environment: env.name
      logAnalyticsName: env.logAnalyticsName
      appInsightsName: env.appInsightsName
      tags: union(tags, {
        Environment: env.name
        Workload: 'static-web-app'
      })
    }
  }
]

// ===================================================================
// STATIC WEB APPS
// ===================================================================

module staticWebApps '../modules/staticwebapp.bicep' = [
  for (env, i) in environments: {
    name: 'staticwebapp-${env.name}'
    scope: resourceGroups[i]
    dependsOn: [
      resourceGroups[i]
      monitoring[i]
    ]
    params: {
      staticWebAppName: env.staticWebAppName
      location: location
      appLocation: '/'
      outputLocation: 'dist'
      skuName: env.skuName
      stagingEnvironmentPolicy: env.stagingEnvironmentPolicy
      publicNetworkAccess: env.publicNetworkAccess
      tags: union(tags, {
        Environment: env.name
        'azd-service-name': 'home'
      })
    }
  }
]

// ===================================================================
// STATIC WEB APP SETTINGS (applied after SWA provisioned)
// ===================================================================
// NOTE: Commented out to avoid race condition during initial deployment
// App settings will be applied via GitHub Actions workflow on first deployment
// Uncomment only if you need to update settings via Bicep after SWA is stable

// module staticWebAppSettings '../modules/staticwebapp-settings.bicep' = [
//   for (env, i) in environments: {
//     name: 'staticwebapp-settings-${env.name}'
//     scope: resourceGroups[i]
//     dependsOn: [
//       staticWebApps[i]
//     ]
//     params: {
//       staticWebAppName: env.staticWebAppName
//       environment: env.name
//       appInsightsConnectionString: monitoring[i].outputs.appInsightsConnectionString
//       deploymentTimestamp: deploymentTimestamp
//     }
//   }
// ]

// ===================================================================
// OUTPUTS
// ===================================================================

@description('Resource groups created for the deployment')
output resourceGroupNames array = [for env in environments: env.resourceGroupName]

@description('Static Web App deployment details by environment')
output staticWebAppDetails array = [
  for (env, i) in environments: {
    environment: env.name
    resourceGroup: env.resourceGroupName
    staticWebAppName: staticWebApps[i].outputs.staticWebAppName
    defaultHostname: staticWebApps[i].outputs.defaultHostname
    logAnalyticsWorkspaceId: monitoring[i].outputs.logAnalyticsWorkspaceId
  }
]
