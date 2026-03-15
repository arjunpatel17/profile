@description('The name of the Static Web App')
param staticWebAppName string = 'arjun-netflix-profile'

@description('The location for all resources')
param location string = resourceGroup().location

@description('The name of the Application Insights resource')
param appInsightsName string = 'arjun-profile-insights'

@description('The name of the Log Analytics workspace')
param logAnalyticsName string = 'arjun-profile-logs'

// ---- Log Analytics Workspace (required for App Insights) ----
resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: logAnalyticsName
  location: location
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
  }
}

// ---- Application Insights ----
resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: appInsightsName
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalytics.id
    IngestionMode: 'LogAnalytics'
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
  }
}

// ---- Azure Static Web App ----
resource staticWebApp 'Microsoft.Web/staticSites@2023-12-01' = {
  name: staticWebAppName
  location: location
  sku: {
    name: 'Free'
    tier: 'Free'
  }
  properties: {
    stagingEnvironmentPolicy: 'Enabled'
    allowConfigFileUpdates: true
    buildProperties: {
      skipGithubActionWorkflowGeneration: true
    }
  }
}

// ---- Outputs ----
output staticWebAppUrl string = 'https://${staticWebApp.properties.defaultHostname}'
output appInsightsConnectionString string = appInsights.properties.ConnectionString
output appInsightsInstrumentationKey string = appInsights.properties.InstrumentationKey
