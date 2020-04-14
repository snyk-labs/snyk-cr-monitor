# snyk-cr-monitor


set environment
```
export SNYK_TOKEN=<snyk-token>
export SNYK_ORG=<snyk-org>
export ARTIFACTORY_API_HOST=<artifactory-api-host> # host for the api
export ARTIFACTORY_CLI_HOST=<artifactory-cli-host> # host for the cli
export ARTIFACTORY_USER=<artifactory-user>
export ARTIFACTORY_KEY=<artifactory-key>

export SNYK_TOKEN SNYK_ORG ARTIFACTORY_API_HOST ARTIFACTORY_CLI_HOST ARTIFACTORY_USER ARTIFACTORY_KEY
```

If connecting to an on-prem Artifactory instance over HTTPS with a self-signed certificate, you will need to set
```
export NODE_TLS_REJECT_UNAUTHORIZED=0
```
Running as a container
```
docker build -t snyk-cr-monitor .
```
```
docker run -e BROKER_TOKEN=secret-broker-token \
           -e GITHUB_TOKEN=secret-github-token \
           -e PORT=8000 \
           -e BROKER_CLIENT_URL=http://my.broker.client:8000 \
       snyk/broker:github-com
```
Running natively
```
npm install -g 
./snyk-cr-monitor
```
