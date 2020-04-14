#!/usr/bin/env node
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var yargs = __importStar(require("yargs"));
var axios_1 = __importDefault(require("axios"));
var debug = require('debug')('all');
var _a = require("child_process"), spawn = _a.spawn, execSync = _a.execSync;
var _maxJobs = 10;
var _jobSpacing = 1500;
var jobIndex = 0;
var jobs = [];
var argv = yargs
    .usage("Usage: $0 [OPTIONS]\n              If no arguments are specified, values will be picked up from environment variables")
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
var snykToken = String(argv["snyk-token"] ? argv["snyk-token"] : process.env.SNYK_TOKEN);
var snykOrg = String(argv["snyk-org"] ? argv["snyk-org"] : process.env.SNYK_ORG);
var artifactoryApiHost = String(argv["artifactory-api-host"] ? argv["artifactory-api-host"] : process.env.ARTIFACTORY_API_HOST);
var artifactoryCliHost = String(argv["artifactory-cli-host"] ? argv["artifactory-cli-host"] : process.env.ARTIFACTORY_CLI_HOST);
var artifactoryUser = String(argv["artifactory-user"] ? argv["artifactory-user"] : process.env.ARTIFACTORY_USER);
var artifactoryKey = String(argv["artifactory-key"] ? argv["artifactory-key"] : process.env.ARTIFACTORY_KEY);
var maxJobs = Number(argv["max-jobs"] ? argv["max-jobs"] : process.env.SNYK_CR_MONITOR_MAX_JOBS);
var jobSpacing = Number(argv["job-spacing"] ? argv["job-spacing"] : process.env.SNYK_CR_MONITOR_JOB_SPACING);
if (!maxJobs) {
    maxJobs = _maxJobs;
}
if (!jobSpacing) {
    jobSpacing = _jobSpacing;
}
var getDockerRepos = function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, axios_1.default.get("https://" + artifactoryApiHost + "/artifactory/api/repositories?packageType=docker", {
                    headers: {
                        Accept: "application/json",
                        "X-JFrog-Art-Api": artifactoryKey
                    }
                })];
            case 1: return [2 /*return*/, _a.sent()];
        }
    });
}); };
var getImageRepos = function (repoKey) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, axios_1.default.get("https://" + artifactoryApiHost + "/artifactory/api/docker/" + repoKey + "/v2/_catalog", {
                    headers: {
                        Accept: "application/json",
                        "X-JFrog-Art-Api": artifactoryKey
                    }
                })];
            case 1: return [2 /*return*/, _a.sent()];
        }
    });
}); };
var getTagToScan = function () {
    // todo: allow for AQL searches to find the image tag based on customized search criteria
    // for now lets use latest 
    return 'latest';
};
var sleep = function (ms) {
    execSync("\"" + process.argv[0] + "\" -e 'setTimeout(function(){}," + ms + ")'");
};
var getLastCommandOutput = function (commandOutput) {
    var lastCommandOutput = '';
    for (var _i = 0, _a = commandOutput.split('\n'); _i < _a.length; _i++) {
        var line = _a[_i];
        if (line.trim() != '') {
            lastCommandOutput = line;
        }
    }
    return lastCommandOutput;
};
var runNextJob = function (jobId) {
    var i = 0;
    var offset = 0;
    if (jobId !== undefined) {
        i = jobId; //initial jobs
        offset = (jobSpacing * i);
    }
    else {
        i = jobIndex; //tracking subsequent jobs
        offset = jobSpacing;
    }
    if (i < jobs.length) {
        debug("Scheduled Job " + i + " / " + jobs.length + " for " + offset / 1000 + " seconds from now");
        (function () {
            setTimeout(function () {
                debug("Testing Job " + i + ": " + JSON.stringify(jobs[i]));
                var _artifactoryCliHost = String(artifactoryCliHost);
                if (String(artifactoryApiHost).includes("jfrog.io")) {
                    _artifactoryCliHost = String(artifactoryCliHost).replace(/(.+).jfrog.io/, '$1-' + jobs[i].dockerRepo + '.jfrog.io');
                }
                debug('_artifactoryCliHost: ' + _artifactoryCliHost);
                var orgString = '';
                if (snykOrg) {
                    orgString = "--org=" + snykOrg;
                }
                var projectName = "docker-image|" + _artifactoryCliHost.split(':')[0] + "/" + jobs[i].imageRepo + ":" + jobs[i].imageTag;
                debug('projectName: ' + projectName);
                var execSnykAuth = "snyk auth " + snykToken + " 2>&1 && ";
                var execDockerLogin = "docker login " + _artifactoryCliHost + " -u " + artifactoryUser + " -p " + artifactoryKey + " 2>&1 && ";
                var execSnykMonitor = "snyk monitor " + orgString + " --docker " + _artifactoryCliHost + "/" + jobs[i].imageRepo + ":" + jobs[i].imageTag + " --project-name=\"" + projectName + "\" 2>&1 && ";
                var execDockerRemove = "docker image rm " + _artifactoryCliHost + "/" + jobs[i].imageRepo + ":" + jobs[i].imageTag + " --force 2>&1";
                var completeExecString = execSnykAuth.concat(execDockerLogin, execSnykMonitor, execDockerRemove);
                debug('Running Command String: ' + completeExecString);
                var commandOutput = '';
                var child = spawn(completeExecString, {
                    detached: true,
                    shell: true
                });
                child.stdout.on('data', function (data) {
                    commandOutput += data;
                });
                child.on('exit', function (code, signal) {
                    console.log("Job " + i + ": " + jobs[i].dockerRepo + "/" + jobs[i].imageRepo + ":" + jobs[i].imageTag + " exited with code " + code);
                    if (code > 0) {
                        console.log("Job " + i + ": " + jobs[i].dockerRepo + "/" + jobs[i].imageRepo + ":" + jobs[i].imageTag + " output: " + getLastCommandOutput(commandOutput));
                    }
                    runNextJob();
                });
            }, offset);
            jobIndex++;
        }());
    }
};
var runInitialJobs = function (jobs) {
    debug("Max simultaneous jobs: " + maxJobs);
    debug("Job delay: " + jobSpacing);
    console.log("Launching jobs with max jobs: " + maxJobs + " and job spacing: " + jobSpacing / 1000 + "s  ...");
    // lets launch first batch of jobs
    for (var i = jobIndex; i < maxJobs; i++) {
        runNextJob(i);
    }
};
var unique = function (value, index, self) {
    return self.indexOf(value) === index;
};
var snykCrMonitor = function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                console.log('Looking for Docker Images in Artifactory...');
                return [4 /*yield*/, getDockerRepos().then(function (response) {
                        var e_1, _a;
                        return __awaiter(this, void 0, void 0, function () {
                            var _b, _c, dockerRepo, e_1_1;
                            return __generator(this, function (_d) {
                                switch (_d.label) {
                                    case 0:
                                        _d.trys.push([0, 6, 7, 12]);
                                        _b = __asyncValues(response.data);
                                        _d.label = 1;
                                    case 1: return [4 /*yield*/, _b.next()];
                                    case 2:
                                        if (!(_c = _d.sent(), !_c.done)) return [3 /*break*/, 5];
                                        dockerRepo = _c.value;
                                        return [4 /*yield*/, getImageRepos(dockerRepo.key).then(function (response) {
                                                var e_2, _a;
                                                return __awaiter(this, void 0, void 0, function () {
                                                    var _b, _c, imageRepo, e_2_1;
                                                    return __generator(this, function (_d) {
                                                        switch (_d.label) {
                                                            case 0:
                                                                _d.trys.push([0, 5, 6, 11]);
                                                                _b = __asyncValues(response.data.repositories);
                                                                _d.label = 1;
                                                            case 1: return [4 /*yield*/, _b.next()];
                                                            case 2:
                                                                if (!(_c = _d.sent(), !_c.done)) return [3 /*break*/, 4];
                                                                imageRepo = _c.value;
                                                                debug('Found: ' + dockerRepo.key + '/' + imageRepo);
                                                                jobs.push({
                                                                    dockerRepo: dockerRepo.key,
                                                                    imageRepo: imageRepo,
                                                                    imageTag: getTagToScan()
                                                                });
                                                                _d.label = 3;
                                                            case 3: return [3 /*break*/, 1];
                                                            case 4: return [3 /*break*/, 11];
                                                            case 5:
                                                                e_2_1 = _d.sent();
                                                                e_2 = { error: e_2_1 };
                                                                return [3 /*break*/, 11];
                                                            case 6:
                                                                _d.trys.push([6, , 9, 10]);
                                                                if (!(_c && !_c.done && (_a = _b.return))) return [3 /*break*/, 8];
                                                                return [4 /*yield*/, _a.call(_b)];
                                                            case 7:
                                                                _d.sent();
                                                                _d.label = 8;
                                                            case 8: return [3 /*break*/, 10];
                                                            case 9:
                                                                if (e_2) throw e_2.error;
                                                                return [7 /*endfinally*/];
                                                            case 10: return [7 /*endfinally*/];
                                                            case 11: return [2 /*return*/];
                                                        }
                                                    });
                                                });
                                            })];
                                    case 3:
                                        _d.sent();
                                        _d.label = 4;
                                    case 4: return [3 /*break*/, 1];
                                    case 5: return [3 /*break*/, 12];
                                    case 6:
                                        e_1_1 = _d.sent();
                                        e_1 = { error: e_1_1 };
                                        return [3 /*break*/, 12];
                                    case 7:
                                        _d.trys.push([7, , 10, 11]);
                                        if (!(_c && !_c.done && (_a = _b.return))) return [3 /*break*/, 9];
                                        return [4 /*yield*/, _a.call(_b)];
                                    case 8:
                                        _d.sent();
                                        _d.label = 9;
                                    case 9: return [3 /*break*/, 11];
                                    case 10:
                                        if (e_1) throw e_1.error;
                                        return [7 /*endfinally*/];
                                    case 11: return [7 /*endfinally*/];
                                    case 12:
                                        debug("Jobs: " + JSON.stringify(jobs));
                                        console.log("Found " + jobs.length + " image sets in " + jobs.map(function (x) { return x.dockerRepo; }).filter(unique).length + " Docker repos");
                                        runInitialJobs(jobs);
                                        return [2 /*return*/];
                                }
                            });
                        });
                    })];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
snykCrMonitor();
