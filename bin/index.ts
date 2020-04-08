#!/usr/bin/env node

import * as yargs from 'yargs';
import axios from 'axios';
const debug = require('debug')('all');

const { spawn, execSync } = require("child_process");

var maxJobs: number = 15;
var jobSpacing: number = 2500;

var jobIndex = 0;
var jobs = [];

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

var snykToken = argv["snyk-token"] ? argv["snyk-token"] : process.env.SNYK_TOKEN;
var snykOrg = argv["snyk-org"] ? argv["snyk-org"] : process.env.SNYK_ORG;
var artifactoryServername = argv["artifactory-servername"] ? argv["artifactory-servername"] : process.env.ARTIFACTORY_SERVERNAME;
var artifactoryUser = argv["artifactory-user"] ? argv["artifactory-user"] : process.env.ARTIFACTORY_USER;
var artifactoryKey = argv["artifactory-key"] ? argv["artifactory-key"] : process.env.ARTIFACTORY_KEY;

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
     //console.log('intial job run for ' + i);
    
  } else {
     i = jobIndex; //tracking subsequent jobs
     offset = jobSpacing;
  }

  //if (i == jobs.length) { process.exit }

  if (i < jobs.length) {
    debug('Scheduled Job ' + i + ' / ' + jobs.length + ' for ' + offset/1000 + ' seconds from now');
    (function() {
      setTimeout(function() {
        //console.log('3 seconds later...');
        //console.log('job No.: ' + i);
        debug('Testing Job ' + i + ': ' + JSON.stringify(jobs[i]));
        const child = spawn('docker login snyk-' + jobs[i].dockerRepo + '.jfrog.io -u ' + argv["artifactory-user"] + ' -p ' + argv["artifactory-key"] + ' 2>/dev/null;'
          + 'snyk auth ' + argv["snyk-token"] + '; ' + 'docker login snyk-' + jobs[i].dockerRepo + '.jfrog.io -u ' + argv["artifactory-user"] + ' -p ' + argv["artifactory-key"] + ' 2>/dev/null; ' + 'snyk monitor --docker snyk-' + jobs[i].dockerRepo + '.jfrog.io/' + jobs[i].imageRepo + '; docker image rm snyk-'+ jobs[i].dockerRepo + '.jfrog.io/' + jobs[i].imageRepo , {
          detached: true,
          shell: true
        });
        child.on('exit', function(code, signal) {
          console.log('Job ' + i + ': ' + jobs[i].dockerRepo + '/' + jobs[i].imageRepo + ' exited with code ' + code);
          runNextJob();
        });  },
        offset);
    jobIndex++;
    }())
  }
}

const runInitialJobs = (jobs) => {
  debug('Max simultaneous jobs: ' + maxJobs);
  debug('Job delay: ' + jobSpacing);
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
    //let jobs = []; //array of dictionaries to hold the docker repo and image repo names for scanning later
    //console.log(response.data);
    for await (const dockerRepo of response.data) {
      //console.log('Processing Docker Repo: ' + dockerRepo.key)
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
    debug('Jobs: ' + JSON.stringify(jobs));
    console.log(`Found ${jobs.length} image sets in ${jobs.map(x => x.dockerRepo).filter(unique).length} Docker repos`);
    runInitialJobs(jobs);
  });
}

snykCrMonitor();
