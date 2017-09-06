#!/usr/bin/env node

const program = require('commander');
const versionToggle = require('./src/version-toggle')

/**
 * collectConditions will gather all of the commandline conditions passed into VT
 * @param {*} con 
 * @param {*} conditions 
 */
function collectConditions(con, conditions) {
    var split = con.split(":");
    var string = "{\"" + split[0] + "\":\"" + split[1] + "\"}";
    var condition = JSON.parse(string);
    conditions.push(condition);
    return conditions;
}

//Add the parameters to the application
program
    .version('2.0.0')
    .usage('<options>')
    .option('-i, --inputDir [inputDir]', 'Sets the input directory, defaults to src/', 'src/')
    .option('-o, --outputDir [outputDir]', 'Sets the output directory, defaults to ver/', 'ver/')
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

versionToggle(options);