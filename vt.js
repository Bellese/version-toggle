#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const cmpSem = require('semver-compare');
const program = require('commander');

/**
 * collectConditions will gather all of the commandline conditions passed into VT
 * @param {*} con 
 * @param {*} conditions 
 */
function collectConditions(con, conditions){
    var split = con.split(":");
    var string = "{\""+split[0]+"\":\""+split[1]+"\"}";
    var condition = JSON.parse(string);
    conditions.push(condition);
    return conditions;
}

//Add the parameters to the application
program
.version('2.0.0')
.usage('<options>')
.option('-i, --inputDir [inputDir]', 'Sets the input directory, defaults to src/','src/')
.option('-o, --outputDir [outputDir]', 'Sets the output directory, defaults to ver/','ver/')
.option('-c, --conditions <conditions>', 'Sets the conditions for version toggling. Can be called multiple times to add in multiple conditions. Condition object structure: featureName:sem.ver.sion', collectConditions, [])
.option('-e, --exact [exact]', 'Set to false to allow loose matching, defaults to true (exact matching)', true)
.parse(process.argv);

//Gathers the parameters to pass into the vt call
var options = {
    inputDir: program.inputDir,
    outputDir: program.outputDir,
    exact: program.exact,
    conditions: program.conditions
}

vt(options);

/**
 * vt takes in the users parameters and begins the call to processFiles to get all of the files version toggled.
 * Will return one single promise that contains all promises from calling processFiles to ensure that when vt finishes, all files that were contained within the input directory have finished being copied and version toggled.
 * @param {*} options - parameters that users passed to the vt call.
 */
function vt(options) {
    console.log(options);
    var conditions = (options.conditions ? options.conditions : []);
    if (conditions.length === 0) {
        throw 'Missing conditions from vt() call. \nUsage: vt -c featureName:sem.ve.r -c otherFeatureName:sem.ve.r';
    }
    if (matchingFeatures(conditions)) {
        throw 'You can not pass in the same feature multiple times.';
    }
    var inputDir = (options.inputDir ? options.inputDir : 'src/');
    var outputDir = (options.outputDir ? options.outputDir : 'ver/');
    //Check to ensure that the inputDir is not the same as outputDir
    if (inputDir === outputDir) {
        throw 'Input Directory can not be the same as the Output Directory.\nPlease note that the default inputDir is src/ and the default outputDir is ver/';
    }
    var exactVer = (options.exact ? options.exact : false);
    var parsedConditions = [];

    //Gathers the features and versions into an easily iterable state for use
    conditions.forEach(function(condition) {
        Object.keys(condition).forEach(function(obj) {
            parsedConditions.push({ key: obj, val: condition[obj] });
        })
    });

    var stat = fs.statSync(inputDir);
    var split = [];
    var path = '';
    if (!stat.isDirectory()) {
        //Strip out the path before the file name
        split = inputDir.split('/');
        split.forEach(function(val, indx) {
            if (indx !== split.length - 1) {
                path += val + '/';
            }
        });
    }

    //Begin going through all of the files to strip out versions
    var promises = [];
    //If split is empty, then the inputDir is actually a directory so no need to pass in a modified path
    if (split.length === 0) {
        processFiles(inputDir, outputDir, parsedConditions, inputDir, exactVer, promises);
    }
    //If split is not empty, then the inputDir is actually a file so pass in the modified path object
    else {
        processFiles(inputDir, outputDir, parsedConditions, path, exactVer, promises);
    }
    //Returns a promise that only resolves when all of the files have finished being processed to ensure
    //that systems can reliably know that the version toggling is finished before doing anything else.
    return Promise.all(promises);
}

/**
 * processFiles recursively goes through the input directory for all folders and calls applyReplacements for all files found.
 * This returns an array of promises of all files being created/copied so that calls to vt can reliably know when all files have been finished.
 * @param {*} fileToProcess - file or folder to process
 * @param {*} outputDir - output directory passed in by the user
 * @param {*} conditions - list of features and versions to match the code against
 * @param {*} baseInput - the top level folder that all files are gathered from. Used to clean up file names on creation
 * @param {*} exactVer - boolean value where if true, versions must match exactly to what was passed in and if false, can match against the next lowest version
 * @param {*} promises - array of promises that is passed through the recursive function to gather all promises created
 */
function processFiles(fileToProcess, outputDir, conditions, baseInput, exactVer, promises) {
    var stat = fs.statSync(fileToProcess);
    if (stat.isDirectory()) {
        //reads the directory to get all children files
        var files = fs.readdirSync(fileToProcess);
        //Calls process on all of the children to continue getting all sub-directories and their children
        files.forEach(function(file, index) {
            //Gets the path to the file and calls process with that full path.
            //This ensures that recursive calls have the full path to the file and not just the last folder
            var fromPath = path.join(fileToProcess, file);
            return processFiles(fromPath, outputDir, conditions, baseInput, exactVer, promises);
        });
    } else {
        var versionedFile;
        var unversioned = fs.readFileSync(fileToProcess, 'utf8');
        versionedFile = applyReplacements(unversioned, path.extname(fileToProcess), conditions, exactVer);
        if (versionedFile === null || versionedFile === undefined) {
            throw 'Error with creating versioned file.\nPlease look at file: ' + fileToProcess + ' for any incorrect formating';
        }
        var fileName;
        //Removes the initial src directory from the new files
        fileName = fileToProcess.replace(baseInput, "");
        promises.push(fs.outputFile(outputDir + fileName, versionedFile.toString()));
        return promises;
    }
}

/**
 * applyReplacements takes in the contents of a file and returns those contents with all versions of the features passed in stripped out from the file.
 * @param {*} buffer - Contents of the file being version controlled
 * @param {*} fileExt - File type to determine commenting style
 * @param {*} conditions - Features and versions to keep in the code
 * @param {*} exactVer - Whether the versions need to match exactly to the conditions or can find the next lower version
 */
function applyReplacements(buffer, fileExt, conditions, exactVer) {
    //Currently only checks for css, html, or js files. All other files will just return out of this function
    //with the same buffer that was passed in
    switch (fileExt) {
        case '.css':
            commentStart = '/*';
            commentEnd = '*/';
            break;
        case '.html':
            commentStart = '<!--';
            commentEnd = '-->';
            break;
        case '.js':
            commentStart = '//';
            commentEnd = '';
            break;
        default:
            return buffer;
    }

    var contents = buffer.toString('utf8');
    var regexCache = {};
    if (contents.length > 0) {
        for (var i = 0; i < conditions.length; i++) {
            var key = conditions[i].key,
                regex = regexCache[fileExt + key],
                val = conditions[i].val;

            //If the regex hasn't already been created, then create the regex.
            if (!regex) {
                regex = regexCache[fileExt + key] = getStartVersionTagsRegExp(commentStart, commentEnd, key);
            }
            var versions = [],
                matchedStrings = [];
            while ((matched = regex.exec(contents)) !== null) {
                var versionRegex = getVersionSpecificTagRegExp(commentStart, commentEnd, key, matched[1]);
                //Pushing the version of the matched text for comparison.
                versions.push(matched[1]);
                //Getting the full block of code now that the version number has been grabbed
                versionMatched = versionRegex.exec(contents);
                //If versionMatched is null then there was no closing block found for that feature version so error
                if (versionMatched === null || versionMatched === undefined) {
                    throw "No closing comment found for " + key + " v(" + matched[1] + ")";
                }
                //Pushing the matched string so we can remove it later if needed.
                matchedStrings.push(versionMatched[0]);
            }
            var ver = val,
                indexes = [];
            //If the exact version cannot be found, find the indexes of the previous version.
            //Will only fire if exact version matching has not been set to true.
            if (versions.indexOf(val) === -1 && !exactVer) {
                ver = findNextVersion(versions, val);
            }
            //If the the version passed in has no lower version in the code, then leave indexes blank.
            //This will make sure that all code of this feature is removed.
            if (ver !== '-1.0.0') {
                //Finds all indexes that the version matches
                indexes = versions.map(function(version, indx) {
                    if (version === ver) {
                        return indx;
                    } else {
                        return -1;
                    }
                })

                //Removes all bad index values and leaves only the correct indexes that match to the code
                //that should be kept
                indexes = indexes.filter(function(val) {
                    return val !== -1;
                });
            }
            //Removes the elements of matched strings that are to be kept in the code.
            matchedStrings = matchedStrings.filter(function(val, indx) {
                return indexes.indexOf(indx) === -1;
            });
            //Removes all elements of matched strings from the content
            for (j = 0; j < matchedStrings.length; j++) {
                contents = contents.replace(matchedStrings[j], '');
            }
        }
    }

    var buff = new Buffer(contents);
    return buff;
}

/**
 * findNextVersion returns the next version that shows in the code that is lower than the passed in version.
 * If there is no such lower version, then it returns -1.0.0
 * @param {*} versions - Array of semantic versions that are in the code
 * @param {*} baseVersion - The version that was passed into the vt call
 */
function findNextVersion(versions, baseVersion) {
    var highestVer = '-1.0.0';
    var indexes = [];

    //Determines the latest version that is lower than the version passed in
    for (i = 0; i < versions.length; i++) {
        if ((cmpSem(highestVer, versions[i]) == -1) && (cmpSem(baseVersion, versions[i]) !== -1)) {
            highestVer = versions[i];
        }
    }
    return highestVer;
}

/**
 * escapeForRegExp takes in a string and returns a string that has been cleaned for regular expression creation use
 * @param {*} str - string to escape regex for
 */
function escapeForRegExp(str) {
    return str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

/**
 * getStartVersionTagsRegExp returns the regular expression that will match against the given key parameter.
 * This is used to grab the start comment of a code block and extract the version of that block
 * @param {*} commentStart - Comment starting style
 * @param {*} commentEnd - Comment ending style
 * @param {*} key - The key param value to match against
 */
function getStartVersionTagsRegExp(commentStart, commentEnd, key) {
    return new RegExp(escapeForRegExp(commentStart) + '\\s*' + escapeForRegExp(key) +
        ' v\\(((?:\\d+\\.)(?:\\d+\\.)\\d+)\\)\\s*' + escapeForRegExp(commentEnd), 'gi');
}

/**
 * getVersionSpecificTagRegExp returns the regular expression that will match against the given key parameter.
 * This is used to grab the entire code block of an exact version for code stripping
 * @param {*} commentStart - Comment starting style
 * @param {*} commentEnd - Comment ending style
 * @param {*} key - The key param value to match against
 * @param {*} version - The version that this code block is for
 */
function getVersionSpecificTagRegExp(commentStart, commentEnd, key, version) {
    return new RegExp(escapeForRegExp(commentStart) + '\\s*' + escapeForRegExp(key) +
        ' v\\(' + escapeForRegExp(version) + '\\)\\s*' + escapeForRegExp(commentEnd) + '\\s*' + '(?:\\n|\\r|.)*?' +
        escapeForRegExp(commentStart) + '\\s*' + escapeForRegExp('end ' + key) +
        ' v\\(' + escapeForRegExp(version) + '\\)\\s*' + escapeForRegExp(commentEnd) + '\\s*', 'gi');
}

/**
 * matchingFeatures will take in the conditions passed into vt and determines if any features have been
 * listed multiple times. Will return true if multiples of the same feature exist, otherwise returns false
 * @param {*} conditions - array of features and versions passed into vt
 */
function matchingFeatures(conditions) {
    var keys = [];
    for (var i = 0; i < conditions.length; i++) {
        var objKeys = Object.keys(conditions[i]);
        var key = objKeys[0];
        if (keys.indexOf(key) === -1) {
            keys.push(key);
        } else {
            return true;
        }
    }
    return false;
}