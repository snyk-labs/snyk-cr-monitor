#!/usr/bin/env node

import * as yargs from 'yargs';
import axios from 'axios';
const debug = require('debug')('all');

const { spawn, execSync } = require("child_process");

var _maxJobs: number = 10;
var _jobSpacing: number = 1500;

var jobIndex: number = 0;

interface job {
  dockerRepo: string,
  imageRepo: string,
  imageTag: string
}

var jobs: job[]  = [];

const argv = yargs
 .usage(`Usage: $0 [OPTIONS]
              If no arguments are specified, values will be picked up from environment variables`)
 .options({
    'snyk-token': {
       describe: 'Snyk API Key, if not specified $SNYK_TOKEN',
       demandOption: false
    },
    'snyk-org': {
       describe: 'Snyk Organization ID to post test results, if not specified $SNYK_ORG',
       demandOption: false
    },
    'artifactory-api-host': {
       describe: 'Artifactory API HOST, if not specified $ARTIFACTORY_API_HOST',
       demandOption: false
    },
    'artifactory-cli-host': {
      describe: 'Artifactory host used for docker login/pull, if not specified $ARTIFACTORY_CLI_HOST',
      demandOption: false
   },
    'artifactory-user': {
       describe: 'Artifactory API User, if not speciied $ARTIFACTORY_USER',
       demandOption: false
    },
    'artifactory-key': {
       describe: 'Artifactory API Key, if not specified $ARTIFACTORY_KEY',
       demandOption: false
    },
    'max-jobs': {
      describe: 'Number of simultaneous jobs to run',
      demandOption: false
    },
    'job-spacing': {
      describe: 'milliseconds in between job launches',
      demandOption: false
    }
  })
  .help()
 .argv;

const snykToken: string = String(argv["snyk-token"] ? argv["snyk-token"] : process.env.SNYK_TOKEN);
const snykOrg: string = String(argv["snyk-org"] ? argv["snyk-org"] : process.env.SNYK_ORG);
const artifactoryApiHost: string = String(argv["artifactory-api-host"] ? argv["artifactory-api-host"] : process.env.ARTIFACTORY_API_HOST);
const artifactoryCliHost: string = String(argv["artifactory-cli-host"] ? argv["artifactory-cli-host"] : process.env.ARTIFACTORY_CLI_HOST);
const artifactoryUser: string = String(argv["artifactory-user"] ? argv["artifactory-user"] : process.env.ARTIFACTORY_USER);
const artifactoryKey: string = String(argv["artifactory-key"] ? argv["artifactory-key"] : process.env.ARTIFACTORY_KEY);
var maxJobs: number = Number(argv["max-jobs"] ? argv["max-jobs"] : process.env.SNYK_CR_MONITOR_MAX_JOBS);
var jobSpacing: number = Number(argv["job-spacing"] ? argv["job-spacing"] : process.env.SNYK_CR_MONITOR_JOB_SPACING);

if (!maxJobs) { maxJobs = _maxJobs; }
if (!jobSpacing) {jobSpacing = _jobSpacing; }

const getDockerRepos = async () => {  
  return await axios.get(
    `https://${artifactoryApiHost}/artifactory/api/repositories?packageType=docker`, 
    { 
      headers: { 
        Accept: "application/json",
        "X-JFrog-Art-Api": artifactoryKey
      } 
    }
  )
}

const getImageRepos = async (repoKey: string) => {
  return await axios.get(
    `https://${artifactoryApiHost}/artifactory/api/docker/${repoKey}/v2/_catalog`, 
    { 
      headers: { 
        Accept: "application/json",
        "X-JFrog-Art-Api": artifactoryKey
      } 
    }
  )
}

const getTagToScan = () => {
  // todo: allow for AQL searches to find the image tag based on customized search criteria
  // for now lets use latest 
  return 'latest';
}

const sleep = (ms: number) => {
  execSync(`"${process.argv[0]}" -e 'setTimeout(function(){},${ms})'`);
}

const getLastCommandOutput = (commandOutput: string) => {
  let lastCommandOutput = '';
  for (const line of commandOutput.split('\n')) {
    if (line.trim() != '') {
      lastCommandOutput = line;
    }
  }
  return lastCommandOutput;
}

const runNextJob = (jobId?: number) => {
  let i = 0;
  let offset = 0;

  if (jobId !== undefined) {
     i = jobId; //initial jobs
     offset = (jobSpacing * i);
    
  } else {
     i = jobIndex; //tracking subsequent jobs
     offset = jobSpacing;
  }

  if (i < jobs.length) {
    debug(`Scheduled Job ${i} / ${jobs.length} for ${offset/1000} seconds from now`);
    (function() {
      setTimeout(function() {
        debug(`Testing Job ${i}: ${JSON.stringify(jobs[i])}`);
        
        let _artifactoryCliHost: string = String(artifactoryCliHost);

        if (String(artifactoryApiHost).includes("jfrog.io")) {
          _artifactoryCliHost = String(artifactoryCliHost).replace(/(.+).jfrog.io/, '$1-' + jobs[i].dockerRepo + '.jfrog.io');
        }
        debug('_artifactoryCliHost: ' + _artifactoryCliHost);

        let orgString: string = '';
        if (snykOrg) { 
          orgString = `--org=${snykOrg}`; 
        }

        let projectName: string = `docker-image|${_artifactoryCliHost.split(':')[0]}/${jobs[i].imageRepo}:${jobs[i].imageTag}`;
        debug('projectName: ' + projectName);

        let execSnykAuth: string = 
          `snyk auth ${snykToken} 2>&1 && `;
        let execDockerLogin: string = 
          `docker login ${_artifactoryCliHost} -u ${artifactoryUser} -p ${artifactoryKey} 2>&1 && `;
        let execSnykMonitor: string = 
          `snyk monitor ${orgString} --docker ${_artifactoryCliHost}/${jobs[i].imageRepo}:${jobs[i].imageTag} --project-name="${projectName}" 2>&1 && `;
        let execDockerRemove: string = 
          `docker image rm ${_artifactoryCliHost}/${jobs[i].imageRepo}:${jobs[i].imageTag} --force 2>&1`;

        let completeExecString: string = execSnykAuth.concat(execDockerLogin, execSnykMonitor, execDockerRemove);
        debug('Running Command String: ' + completeExecString);

        let commandOutput: string = '';

        const child = spawn(completeExecString , {
          detached: true,
          shell: true
        });
        child.stdout.on('data', function (data) {
          commandOutput += data;
        });
        child.on('exit', function(code, signal) {
          console.log(`Job ${i}: ${jobs[i].dockerRepo}/${jobs[i].imageRepo}:${jobs[i].imageTag} exited with code ${code}`);
          if (code > 0) {
            console.log(`Job ${i}: ${jobs[i].dockerRepo}/${jobs[i].imageRepo}:${jobs[i].imageTag} output: ${getLastCommandOutput(commandOutput)}`);
          }
          runNextJob();
        });  },
        offset);
    jobIndex++;
    }())
  }
}

const runInitialJobs = (jobs) => {
  debug(`Max simultaneous jobs: ${maxJobs}`);
  debug(`Job delay: ${jobSpacing}`);
  console.log(`Launching jobs with max jobs: ${maxJobs} and job spacing: ${jobSpacing/1000}s  ...`);
  // lets launch first batch of jobs
  for ( let i = jobIndex; i < maxJobs; i++ ) {
    runNextJob(i);
  }
}

const unique = (value, index, self) => { 
  return self.indexOf(value) === index;
}

const snykCrMonitor = async () => {
  console.log('Looking for Docker Images in Artifactory...')
  await getDockerRepos().then(async function(response){
    for await (const dockerRepo of response.data) {
      await getImageRepos(dockerRepo.key).then(async function(response){   
        for await (const imageRepo of response.data.repositories) {
          debug('Found: ' + dockerRepo.key + '/' + imageRepo);
          jobs.push(
            { 
              dockerRepo: dockerRepo.key,
              imageRepo: imageRepo,
              imageTag: getTagToScan()
            }
          );
        }
      });
    }
    debug(`Jobs: ${JSON.stringify(jobs)}`);
    console.log(`Found ${jobs.length} image sets in ${jobs.map(x => x.dockerRepo).filter(unique).length} Docker repos`);
    runInitialJobs(jobs);
  });
}

snykCrMonitor();
