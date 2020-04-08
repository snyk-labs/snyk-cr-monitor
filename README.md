# snyk-cr-monitor

needs node, docker, snyk 

set environment
```
SNYK_TOKEN=<snyk-token>
SNYK_ORG=<snyk-org>
ARTIFACTORY_API_HOST=<artifactory-api-host> # host for the api
ARTIFACTORY_CLI_HOST=<artifactory-cli-host> # host for the cli
ARTIFACTORY_USER=<artifactory-user>
ARTIFACTORY_KEY=<artifactory-key>

export SNYK_TOKEN SNYK_ORG ARTIFACTORY_API_HOST ARTIFACTORY_CLI_HOST ARTIFACTORY_USER ARTIFACTORY_KEY
```


npm install -g

snyk-cr-monitor
