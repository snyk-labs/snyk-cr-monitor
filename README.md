# snyk-cr-monitor

### set environment
```
export SNYK_TOKEN=<snyk-token>
export SNYK_ORG=<snyk-org>
export ARTIFACTORY_API_HOST=<artifactory-api-host> # host for the api
export ARTIFACTORY_CLI_HOST=<artifactory-cli-host> # host for the cli
export ARTIFACTORY_USER=<artifactory-user>
export ARTIFACTORY_KEY=<artifactory-key>

```

If connecting to an on-prem Artifactory instance over HTTPS with a self-signed certificate, you will need to set
```
export NODE_TLS_REJECT_UNAUTHORIZED=0
```
or
```
export NODE_EXTRA_CA_CERTS=[your CA certificate file path]
```

=======

### Running as a container
```
docker build -t snyk-cr-monitor .
```
```
docker run -v /var/run/docker.sock:/var/run/docker.sock snyk-cr-monitor \
           -e SNYK_TOKEN=$SNYK_TOKEN \
           -e SNYK_ORG=$SNYK_ORG \
           -e ARTIFACTORY_USER=$ARTIFACTORY_USER \
           -e ARTIFACTORY_KEY=$ARTIFACTORY_KEY \
           -e ARTIFACTORY_API_HOST=$ARTIFACTORY_API_HOST \
           -e ARTIFACTORY_CLI_HOST=$ARTIFACTORY_CLI_HOST
```

### Use bash wrapper script
```
$ chmod +x snyk-cr-monitor
$ snyk-cr-monitor
```
### Running natively 
  requires node, docker, snyk
```
$ npm install -g 
$ snyk-cr-monitor
```

### TODO
- add support for AQL file option for customer image tag searches
