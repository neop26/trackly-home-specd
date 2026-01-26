// ===================================================================
// Static Web App App Settings Module
// ===================================================================
// Applies application settings to an existing Static Web App
// Should be invoked after the Static Web App resource is provisioned
// ===================================================================

@description('Name of the Static Web App')
param staticWebAppName string

@description('Environment (dev, test, prod)')
param environment string

@description('Application Insights connection string')
param appInsightsConnectionString string

@description('Deployment timestamp for metadata')
param deploymentTimestamp string = utcNow()

// Existing Static Web App reference
resource staticWebApp 'Microsoft.Web/staticSites@2024-04-01' existing = {
  name: staticWebAppName
}

resource appSettings 'Microsoft.Web/staticSites/config@2024-04-01' = {
  parent: staticWebApp
  name: 'appsettings'
  properties: {
    APPLICATIONINSIGHTS_CONNECTION_STRING: appInsightsConnectionString
    VITE_APP_ENV: environment
    VITE_ENABLE_DEBUG: environment == 'dev' ? 'true' : 'false'
    VITE_ENABLE_ANALYTICS: environment == 'prod' ? 'true' : 'false'
    VITE_APP_VERSION: '1.0.0'
    VITE_BUILD_DATE: deploymentTimestamp
    VITE_ENABLE_SECURE_LOGGING: environment != 'dev' ? 'true' : 'false'
    VITE_PRODUCTION_CONSOLE_LEVEL: environment == 'prod' ? 'error' : 'warn'
  }
}
