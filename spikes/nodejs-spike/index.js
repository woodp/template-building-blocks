'use strict';

let commander = require('commander');
let fs = require('fs');
let path = require('path');
let _ = require('lodash');

let testCommandLine = ['dummy', 'dummy', '-b', 'nothing-yet', '-s', 'big-guid', '-g', 'my-rg', '-p', 'spec/Parameters/vm-parameters.json'];

let parseParameterFile = ({parameterFile}) => {
    // Resolve the path to be cross-platform safe
    parameterFile = path.resolve(parameterFile);
    let exists = fs.existsSync(parameterFile);
    if (!exists) {
        throw new Error(`Parameters file '${commander.parametersFile}' does not exist`);
    }

    let content = fs.readFileSync(parameterFile, 'UTF-8');

    try {
        let parameters = (JSON.parse(content.replace(/^\uFEFF/, ''))).parameters;

        if (!parameters.buildingBlockSettings.value) {
            throw new Error('buildingBlockSettings not provided.');
        }

        if (Object.keys(parameters).length < 2) {
            throw new Error('Parameters for the building blocks not provided');
        }

        return _.mapValues(parameters, (parameter) => {
            return parameter.value
        });
    } catch (e) {
        throw new Error(`Parameter file is not well-formed: ${e.message}`);
    }
};

let processParameters = ({parameters, processors}) => {
    let result;

    // TODO - Normalize our interfaces, but for now, make it work.  We will loop, but we will only process the first parameter for now
    Object.keys(parameters).forEach((key) => {
        let process;
        switch (key) {
            case 'virtualMachinesSettings':
                process = processors['virtualMachineSettings'].processVirtualMachineSettings;
                break;
            case 'loadBalancerSettings':
                process = processors[key].processLoadBalancerSettings;
                break;
            case 'buildingBlockSettings':
                return;
            default:
                process = processors[key].transform;
                break;
        }

        if (!process) {
            throw new Error(`Processor '${key}' not found.`);
        }

        result = {
            name: key,
            value: process(parameters[key], parameters.buildingBlockSettings)
        };
    });

    return result;
};

let loadModules = () => {
    let modules = {};
    let moduleFiles = fs.readdirSync('./core');
    for (let moduleFile of moduleFiles) {
        if (path.extname(moduleFile) === '.js') {
            let baseName = path.basename(moduleFile, '.js');
            if (baseName.endsWith('Settings')) {
                let resolvedPath = path.resolve('./core', moduleFile);
                modules[baseName] = require(resolvedPath);
                //console.log(moduleFile);
            }
        }
    }

    return modules;
};

let createTemplateParameters = ({parameters}) => {
    let templateParameters = {
        $schema: 'http://schema.management.azure.com/schemas/2015-01-01/deploymentParameters.json#',
        contentVersion: '1.0.0.0',
        parameters: {

        }
    };

    templateParameters.parameters[parameters.name] = {
        value: parameters.value
    };

    return templateParameters;
};

commander
    .version('0.0.1')
    .option('-b, --building-block <building-block>', 'the building block to execute')
    .option('-g, --resource-group <resource-group>', 'the name of the resource group')
    .option('-p, --parameters-file <parameters-file>', 'the path to a parameters file')
    .option('-o, --output-file [output-file]', 'the output file name')
    .option('-s, --subscription <subscription>', 'the subscription identifier')
    //.parse(process.argv);
    .parse(testCommandLine);

console.log(commander.buildingBlock);
console.log(commander.subscription);
console.log(commander.resourceGroup);
console.log(commander.parametersFile);

if (!commander.outputFile) {
    commander.outputFile = path.resolve('output.json');
}

let parameters = parseParameterFile({
    parameterFile: commander.parametersFile
});

let processors = loadModules();

let result = processParameters({
    parameters: parameters,
    processors: processors
});

let templateParameters = createTemplateParameters({
    parameters: result
});

fs.writeFileSync(commander.outputFile, JSON.stringify(templateParameters));

process.exit(0);
