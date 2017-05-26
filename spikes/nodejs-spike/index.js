'use strict';

let commander = require('commander');
let fs = require('fs');
let path = require('path');
let _ = require('lodash');
let v = require('./core/validation.js');

let parseParameterFile = ({parameterFile}) => {
    // Resolve the path to be cross-platform safe
    parameterFile = path.resolve(parameterFile);
    let exists = fs.existsSync(parameterFile);
    if (!exists) {
        throw new Error(`parameters file '${commander.parametersFile}' does not exist`);
    }

    let content = fs.readFileSync(parameterFile, 'UTF-8');

    try {
        return JSON.parse(content.replace(/^\uFEFF/, '')).parameters;
    } catch (e) {
        throw new Error(`parameter file '${commander.parametersFile}' is not well-formed: ${e.message}`);
    }
};

let processParameters = ({buildingBlock, parameters, buildingBlockSettings}) => {
    let processor = buildingBlocks[buildingBlock];
    if (!processor) {
        throw new Error(`building block '${buildingBlock}' not found.`);
    }

    return processor.process(parameters, buildingBlockSettings);
};

let buildingBlocks = {
    vm: {
        process: require(path.resolve('./core', 'virtualMachineSettings.js')).processVirtualMachineSettings,
        template: ''
    },
    lb: {
        process: require(path.resolve('./core', 'loadBalancerSettings.js')).processLoadBalancerSettings,
        template: ''
    },
    vnet: {
        process: require(path.resolve('./core', 'virtualNetworkSettings.js')).transform,
        template: ''
    }
};

let createTemplateParameters = ({parameters}) => {
    let templateParameters = {
        $schema: 'http://schema.management.azure.com/schemas/2015-01-01/deploymentParameters.json#',
        contentVersion: '1.0.0.0',
        parameters: _.transform(parameters, (result, value, key) => {
            result[key] = {
                value: value
            };

            return result;
        }, {})
    };

    return templateParameters;
};

let validateBuildingBlockName = (value) => {
    if (!v.utilities.isStringInArray(value, Object.keys(buildingBlocks))) {
        throw new Error(`invalid building block name '${value}'`);
    }

    return value;
};

let validateSubscriptionId = (value) => {
    if (!v.utilities.isGuid(value)) {
        throw new Error(`invalid subscription-id '${value}'`);
    }

    return value;
}

let validateOutputModes
//let testCommandLine = ['dummy', 'dummy', '-b', 'vm', '-s', '3b518fac-e5c8-4f59-8ed5-d70b626f8e10', '-g', 'my-rg', '-p', 'spec/Parameters/vm-parameters-cmdline.json', '-o', 'output.json'];

try {
    commander
        .version('0.0.1')
        .option('-b, --building-block <building-block>', 'the building block to execute', validateBuildingBlockName)
        .option('-g, --resource-group <resource-group>', 'the name of the resource group')
        .option('-p, --parameters-file <parameters-file>', 'the path to a parameters file')
        .option('-o, --output-file <output-file>', 'the output file name')
        .option('-s, --subscription-id <subscription-id>', 'the subscription identifier', validateSubscriptionId)
        .option('--json', 'output JSON to console')
        .parse(process.argv);
        //.parse(testCommandLine);

    if (_.isUndefined(commander.buildingBlock)) {
        throw new Error('no building block specified');
    }

    if (_.isUndefined(commander.resourceGroup)) {
        throw new Error('no resource group specified');
    }

    if (_.isUndefined(commander.subscriptionId)) {
        throw new Error('no subscription id specified');
    }
    if (((_.isUndefined(commander.outputFile)) && (_.isUndefined(commander.json))) ||
        ((!_.isUndefined(commander.outputFile)) && (!_.isUndefined(commander.json)))) {
        // Either both output types are not specified, or both of them were.  It's still invalid!
        throw new Error('either --output-file or --json must be specified, but not both');
    } else if (!_.isUndefined(commander.outputFile)) {
        // File output was specified.  See if it needs the default file or if one was specified.
        commander.outputFile = path.resolve(commander.outputFile);
    }


    let parameters = parseParameterFile({
        parameterFile: commander.parametersFile
    });

    let result = processParameters({
        buildingBlock: commander.buildingBlock,
        parameters: parameters,
        buildingBlockSettings: {
            subscriptionId: commander.subscriptionId,
            resourceGroupName: commander.resourceGroup
        }
    });

    let templateParameters = createTemplateParameters({
        parameters: result
    });

    // Prettify the json just in case we want to inspect the file.
    let output = JSON.stringify(templateParameters, null, 2);
    if (commander.json === true) {
        console.log(output);
    } else {
        fs.writeFileSync(commander.outputFile, output);
        console.log();
        console.log(`  parameters written to ${commander.outputFile}`);
        console.log();
    }
} catch (e) {
    console.error();
    console.error(`  error: ${e.message}`);
    console.error();
    process.exit(1);
}

process.exit(0);
