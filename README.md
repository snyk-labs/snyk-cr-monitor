# snyk-cr-monitor

### Basic Flow

- Query the Artifactory API to gather Docker repos to test
- Iterate through results, running `snyk monitor` against each `*repo*` for the `*latest*` image
- Provides mechanism to run multiple jobs simultaneously that is configurable

### References

**API** **Documentation** [Artificatory APIs](https://www.jfrog.com/confluence/display/RTF6X/Artifactory+REST+API#ArtifactoryRESTAPI-Authentication)

### set environment
required:
```
export SNYK_TOKEN=<snyk-token>
export SNYK_ORG=<snyk-org>
export ARTIFACTORY_API_HOST=<artifactory-api-host> # host for the api
export ARTIFACTORY_CLI_HOST=<artifactory-cli-host> # host for the cli
export ARTIFACTORY_USER=<artifactory-user>
export ARTIFACTORY_KEY=<artifactory-key>
```

optional:
```
export SNYK_CR_MONITOR_MAX_JOBS=<num-jobs>
export SNYK_CR_MONITOR_JOB_SPACING=<milliseconds-between-job-launches>
```

If connecting to an on-prem Artifactory instance over HTTPS with a self-signed certificate, you will need to set
```
export NODE_TLS_REJECT_UNAUTHORIZED=0
```
or
```
export NODE_EXTRA_CA_CERTS=[your CA certificate file path]
```



### Running as a container
```
docker build -t snyk-cr-monitor .
```
```
docker run -v /var/run/docker.sock:/var/run/docker.sock \
           -e SNYK_TOKEN=$SNYK_TOKEN \
           -e SNYK_ORG=$SNYK_ORG \
           -e ARTIFACTORY_USER=$ARTIFACTORY_USER \
           -e ARTIFACTORY_KEY=$ARTIFACTORY_KEY \
           -e ARTIFACTORY_API_HOST=$ARTIFACTORY_API_HOST \
           -e ARTIFACTORY_CLI_HOST=$ARTIFACTORY_CLI_HOST \
           -e SNYK_CR_MONITOR_MAX_JOBS=$SNYK_CR_MONITOR_MAX_JOBS \
           -e SNYK_CR_MONITOR_JOB_SPACING=$SNYK_CR_MONITOR_JOB_SPACING
       snyk-cr-monitor
```

* If extra environment variables are needed for self-signed certs, add them to the command above or the script below.

### Use bash wrapper script
modify arguments as needed for your environment
```
$ chmod +x snyk-cr-monitor
$ ./snyk-cr-monitor
```
### Running natively 
  requires node, docker, snyk
```
$ npm install -g 
$ snyk-cr-monitor
```

### TODO
- add support for AQL file option for customer image tag searches
- add tests
