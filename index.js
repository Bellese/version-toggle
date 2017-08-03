const fs = require('fs-extra');
const path = require('path');
const cmpSem = require('semver-compare');

exports = module.exports = function vt(options) {
    var options = options || {};
    var conditions = (options.conditions ? options.conditions : []);
    if (conditions.length === 0) {
        return console.error('Missing conditions from vt() call. \nUsage: vt({conditions:[{featureName:\'semver\'}]})');
    }
    var inputDir = (options.inputDir ? options.inputDir : 'src/');
    var outputDir = (options.outputDir ? options.outputDir : 'ver/');
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
    if (stat.isDirectory()) {
        //Do nothing
    } else {
        //Strip out the path before the file name
        split = inputDir.split('/');
        split.forEach(function(val, indx) {
            if (indx !== split.length - 1) {
                path += val + '/';
            }
        });
    }

    var promises = [];
    try {
        if (split.length === 0) {
            process(inputDir, outputDir, parsedConditions, inputDir, exactVer, promises);
        } else {
            process(inputDir, outputDir, parsedConditions, path, exactVer, promises);
        }
    } catch (err) {
        return console.error(err);
    }
    // console.log(promises);
    return Promise.all(promises);
}

function process(fileToProcess, outputDir, conditions, baseInput, exactVer, promises) {
    var stat = fs.statSync(fileToProcess);
    if (stat.isDirectory()) {
        //reads the directory to get all children files
        var files = fs.readdirSync(fileToProcess);
        //Calls process on all of the children to continue getting all sub-directories and their children
        files.forEach(function(file, index) {
            //Gets the path to the file and calls process with that full path.
            //This ensures that recursive calls have the full path to the file and not just the last folder
            var fromPath = path.join(fileToProcess, file);
            return process(fromPath, outputDir, conditions, baseInput, exactVer, promises);
        });
    } else {
        var versionedFile;
        var unversioned = fs.readFileSync(fileToProcess, 'utf8');
        versionedFile = applyReplacements(unversioned, path.extname(fileToProcess), conditions, exactVer);
        if (versionedFile === null || versionedFile === undefined) {
            return console.error('Ran into trouble creating the versioned file');
        }
        var fileName;
        //Removes the initial src directory from the new files
        fileName = fileToProcess.replace(baseInput, "");
        promises.push(fs.outputFile(outputDir + fileName, versionedFile.toString()));
        return promises;
    }
}

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
                regex = regexCache[fileExt + key] = getVersionTagsRegExp(commentStart, commentEnd, key);
            }
            var versions = [],
                matchedStrings = [];
            while ((matched = regex.exec(contents)) !== null) {
                //Pushing the version of the matched text for comparison.
                versions.push(matched[1]);
                //Pushing the matched string so we can remove it later if needed.
                matchedStrings.push(matched[0]);
            }
            var indexes = [];
            //If the exact version cannot be found, find the indexes of the previous version.
            //Will only fire if exact version matching has not been set to true.
            if (versions.indexOf(val) === -1 && !exactVer) {
                indexes = findNextVersion(versions, val);
            }
            //Finds the indexes of the passed in version
            else {
                indexes = versions.map(function(version, indx) {
                    if (version === val) {
                        return indx;
                    } else {
                        return -1;
                    }
                })
            }
            //Removes all bad index values and leaves only the correct indexes that match to the code
            //that should be kept
            indexes = indexes.filter(function(val) {
                return val !== -1;
            });
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

function findNextVersion(versions, baseVersion) {
    //Will contain the version previous to the base version
    var highestVer = '-1.0.0';
    var indexes = [];

    //Determines the latest version that is lower than the version passed in
    for (i = 0; i < versions.length; i++) {
        if ((cmpSem(highestVer, versions[i]) == -1) && (cmpSem(baseVersion, versions[i]) !== -1)) {
            highestVer = versions[i];
        }
    }
    //Finds all indexes that the newly found version matches
    if (highestVer !== '-1.0.0') {
        indexes = versions.map(function(version, indx) {
            if (version === highestVer) {
                return indx;
            } else {
                return -1;
            }
        })
    }
    return indexes;
}

function escapeForRegExp(str) {
    return str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

/**
 * Returns the regular expression that will match against the given key parameter.
 * This can be used to extract out code that has been tagged with a feature and release version.
 * @param {*} commentStart - Comment starting style
 * @param {*} commentEnd - Comment ending style
 * @param {*} key - The key param value to match against
 */
function getVersionTagsRegExp(commentStart, commentEnd, key) {
    return new RegExp('\\s*' + escapeForRegExp(commentStart) + '\\s*' + escapeForRegExp(key) +
        ' v\\(((?:\\d+\\.)(?:\\d+\\.)\\d+)\\)\\s*' + escapeForRegExp(commentEnd) + '\\s*' + '(\\n|\\r|.)*?' +
        escapeForRegExp(commentStart) + '\\s*' + escapeForRegExp('end ' + key) +
        ' v\\(((?:\\d+\\.)(?:\\d+\\.)\\d+)\\)\\s*' + escapeForRegExp(commentEnd) + '\\s*', 'gi');
}