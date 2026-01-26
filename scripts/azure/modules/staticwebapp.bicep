// ===================================================================
// Static Web App Module
// ===================================================================
// Creates an Azure Static Web App without GitHub Actions integration
// Configures environment-specific settings and monitoring
// ===================================================================

@description('Name of the Static Web App')
param staticWebAppName string

@description('Azure region for the Static Web App')
param location string

@description('Application source code location in repository')
param appLocation string = '/'

@description('Build output location')
param outputLocation string = 'dist'

@description('SKU name for the Static Web App')
@allowed(['Free', 'Standard'])
param skuName string = 'Free'

@description('Staging environment policy')
@allowed(['Enabled', 'Disabled'])
param stagingEnvironmentPolicy string = 'Enabled'

@description('Public network access setting')
param publicNetworkAccess string = 'Enabled'

@description('Resource tags')
param tags object = {}

// ===================================================================
// STATIC WEB APP RESOURCE
// ===================================================================

resource staticWebApp 'Microsoft.Web/staticSites@2024-04-01' = {
  name: staticWebAppName
  location: location
  tags: tags
  sku: {
    name: skuName
    tier: skuName
  }
  properties: {
    // Build configuration
    buildProperties: {
      appLocation: appLocation
      outputLocation: outputLocation
      skipGithubActionWorkflowGeneration: true
    }

    // Environment settings
    stagingEnvironmentPolicy: stagingEnvironmentPolicy
    publicNetworkAccess: publicNetworkAccess
    allowConfigFileUpdates: true

    // Enterprise features (Standard tier only)
    enterpriseGradeCdnStatus: skuName == 'Standard' ? 'Enabled' : 'Disabled'
  }
}

// ===================================================================
// OUTPUTS
// ===================================================================

@description('Static Web App resource name')
output staticWebAppName string = staticWebApp.name

@description('Static Web App resource ID')
output staticWebAppId string = staticWebApp.id

@description('Default hostname for the Static Web App')
output defaultHostname string = staticWebApp.properties.defaultHostname

@description('Static Web App deployment token for GitHub Actions')
@secure()
output deploymentToken string = staticWebApp.listSecrets().properties.apiKey

@description('Custom domains associated with the Static Web App')
output customDomains array = staticWebApp.properties.customDomains
