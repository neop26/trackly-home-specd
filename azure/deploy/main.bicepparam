using './main.bicep'

param location = 'eastasia'
param baseName = 'tr-hme'
param tags = {
  Application: 'trackly'
  Deployedusing: 'bicep-githubactions'
  CostCenter: 'impactnz'
  Project: 'trackly-home'
  Owner: 'tech-team'
}
