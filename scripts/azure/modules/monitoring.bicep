// ===================================================================
// Monitoring Module
// ===================================================================
// Creates Log Analytics Workspace and Application Insights
// for centralized monitoring and observability
// ===================================================================

@description('Azure region for monitoring resources')
param location string

@description('Environment (dev, test, prod)')
param environment string

@description('Log Analytics Workspace name')
param logAnalyticsName string

@description('Application Insights name')
param appInsightsName string

@description('Resource tags')
param tags object = {}

// Environment-specific monitoring configuration
var monitoringConfig = {
  dev: {
    retentionInDays: 30
    dailyQuotaGb: 1
    samplingPercentage: 50
  }
  test: {
    retentionInDays: 90
    dailyQuotaGb: 5
    samplingPercentage: 25
  }
  prod: {
    retentionInDays: 365
    dailyQuotaGb: 10
    samplingPercentage: 10
  }
}

// ===================================================================
// LOG ANALYTICS WORKSPACE
// ===================================================================

resource logAnalyticsWorkspace 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: logAnalyticsName
  location: location
  tags: tags
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: monitoringConfig[environment].retentionInDays
    workspaceCapping: {
      dailyQuotaGb: monitoringConfig[environment].dailyQuotaGb
    }
    features: {
      enableLogAccessUsingOnlyResourcePermissions: true
      disableLocalAuth: false
      enableDataExport: environment == 'prod'
    }
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
  }
}

// ===================================================================
// APPLICATION INSIGHTS
// ===================================================================

resource applicationInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: appInsightsName
  location: location
  tags: tags
  kind: 'web'
  properties: {
    Application_Type: 'web'
    Flow_Type: 'Bluefield'
    Request_Source: 'rest'
    WorkspaceResourceId: logAnalyticsWorkspace.id
    RetentionInDays: monitoringConfig[environment].retentionInDays
    SamplingPercentage: monitoringConfig[environment].samplingPercentage
    DisableIpMasking: environment == 'dev'
    DisableLocalAuth: false
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
    ImmediatePurgeDataOn30Days: environment == 'dev'
  }
}

// ===================================================================
// OUTPUTS
// ===================================================================

@description('Log Analytics Workspace resource ID')
output logAnalyticsWorkspaceId string = logAnalyticsWorkspace.id

@description('Log Analytics Workspace customer ID')
output logAnalyticsCustomerId string = logAnalyticsWorkspace.properties.customerId

@description('Application Insights resource ID')
output appInsightsId string = applicationInsights.id

@description('Application Insights instrumentation key')
@secure()
output appInsightsInstrumentationKey string = applicationInsights.properties.InstrumentationKey

@description('Application Insights connection string')
@secure()
output appInsightsConnectionString string = applicationInsights.properties.ConnectionString

@description('Application Insights App ID')
output appInsightsAppId string = applicationInsights.properties.AppId
