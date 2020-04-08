#!/usr/bin/env node

import * as yargs from 'yargs';
import axios from 'axios';
const debug = require('debug')('all');

const { spawn, execSync } = require("child_process");

const maxJobs: number = 15;
const jobSpacing: number = 2500;

var jobIndex: number = 0;

interface job {
  dockerRepo: string,
  imageRepo: string
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
    'artifactory-servername': {
       describe: 'Artifactory server name, if not specified $ARTIFACTORY_SERVERNAME',
       demandOption: false
    },
    'artifactory-user': {
       describe: 'Artifactory API User, if not speciied $ARTIFACTORY_USER',
       demandOption: false
    },
    'artifactory-key': {
       describe: 'Artifactory API Key, if not specified $ARTIFACTORY_KEY',
       demandOption: false
    }
  })
  .help()
 .argv;

const snykToken = argv["snyk-token"] ? argv["snyk-token"] : process.env.SNYK_TOKEN;
const snykOrg = argv["snyk-org"] ? argv["snyk-org"] : process.env.SNYK_ORG;
const artifactoryServername = argv["artifactory-servername"] ? argv["artifactory-servername"] : process.env.ARTIFACTORY_SERVERNAME;
const artifactoryUser = argv["artifactory-user"] ? argv["artifactory-user"] : process.env.ARTIFACTORY_USER;
const artifactoryKey = argv["artifactory-key"] ? argv["artifactory-key"] : process.env.ARTIFACTORY_KEY;

const getDockerRepos = async () => {  
  return await axios.get(
    `https://${artifactoryServername}.jfrog.io/artifactory/api/repositories?packageType=docker`, 
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
    `https://snyk.jfrog.io/artifactory/api/docker/${repoKey}/v2/_catalog`, 
    { 
      headers: { 
        Accept: "application/json",
        "X-JFrog-Art-Api": artifactoryKey
      } 
    }
  )
}

const sleep = (ms: number) => {
  execSync(`"${process.argv[0]}" -e 'setTimeout(function(){},${ms})'`);
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

        let execSnykAuth: string = 
          `snyk auth ${snykToken}; `;
        let execDockerLogin: string = 
          `docker login ${artifactoryServername}-${jobs[i].dockerRepo}.jfrog.io -u ${artifactoryUser} -p ${artifactoryKey} 2>/dev/null; `;
        let execSnykMonitor: string = 
          `snyk monitor --docker ${artifactoryServername}-${jobs[i].dockerRepo}.jfrog.io/${jobs[i].imageRepo}; `;
        let execDockerRemove: string = 
          `docker image rm ${artifactoryServername}-${jobs[i].dockerRepo}.jfrog.io/${jobs[i].imageRepo}`;

        const child = spawn(execSnykAuth.concat(execDockerLogin, execSnykMonitor, execDockerRemove) , {
          detached: true,
          shell: true
        });
        child.on('exit', function(code, signal) {
          console.log(`Job ${i}: ${jobs[i].dockerRepo}/${jobs[i].imageRepo} exited with code ${code}`);
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
  await getDockerRepos().then(async function(response){
    for await (const dockerRepo of response.data) {
      await getImageRepos(dockerRepo.key).then(async function(response){   
        for await (const imageRepo of response.data.repositories) {
          debug('Found: ' + dockerRepo.key + '/' + imageRepo);
          jobs.push(
            { 
              dockerRepo: dockerRepo.key,
              imageRepo: imageRepo
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
