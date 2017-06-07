'use strict';

let commander = require('commander');
let fs = require('fs');
let path = require('path');
let _ = require('lodash');
let v = require('./core/validation.js');
let childProcess = require('child_process');

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

let processParameters = ({buildingBlock, parameters, buildingBlockSettings, defaultsDirectory}) => {
    let processor = buildingBlocks[buildingBlock];
    if (!processor) {
        throw new Error(`building block '${buildingBlock}' not found.`);
    }

    let parameter = parameters[processor.parameterName];
    if (!parameter) {
        throw new Error(`parameter '${processor.parameterName}' not found.`);
    }

    let defaults;
    if (defaultsDirectory) {
        // Grab defaults, if they exist
        let defaultsFile = path.join(defaultsDirectory, `${processor.parameterName}.json`);
        if (fs.existsSync(defaultsFile)) {
            try {
                let content = fs.readFileSync(defaultsFile, 'UTF-8');
                defaults = JSON.parse(content.replace(/^\uFEFF/, ''));
            } catch (e) {
                throw new Error(`error parsing '${defaultsFile}': ${e.message}`);
            }
        }
    }

    return processor.process({
        settings: parameter,
        buildingBlockSettings: buildingBlockSettings,
        defaultSettings: defaults
    });
};

let buildingBlocks = {
    vm: {
        process: ({settings, buildingBlockSettings}) => {
            let process = require(path.resolve('./core', 'virtualMachineSettings.js')).processVirtualMachineSettings;
            return process(settings, buildingBlockSettings);
        },
        parameterName: 'virtualMachineSettings',
        template: 'https://raw.githubusercontent.com/mspnp/template-building-blocks/andrew/spikes/spikes/nodejs-spike/templates/buildingBlocks/virtualMachines/virtualMachines.json'
    },
    lb: {
        process: ({settings, buildingBlockSettings}) => {
            let process = require(path.resolve('./core', 'loadBalancerSettings.js')).processLoadBalancerSettings;
            return process(settings, buildingBlockSettings);
        },
        parameterName: 'loadBalancerSettings',
        template: 'https://raw.githubusercontent.com/mspnp/template-building-blocks/andrew/spikes/spikes/nodejs-spike/templates/buildingBlocks/loadBalancers/loadBalancers.json'
    },
    nsg: {
        process: require(path.resolve('./core', 'networkSecurityGroupSettings.js')).transform,
        parameterName: 'networkSecurityGroupSettings',
        template: 'https://raw.githubusercontent.com/mspnp/template-building-blocks/andrew/spikes/spikes/nodejs-spike/templates/buildingBlocks/networkSecurityGroups/networkSecurityGroups.json'
    },
    'route-table': {
        process: require(path.resolve('./core', 'routeTableSettings.js')).transform,
        parameterName: 'routeTableSettings',
        template: 'https://raw.githubusercontent.com/mspnp/template-building-blocks/andrew/spikes/spikes/nodejs-spike/templates/buildingBlocks/routeTables/routeTables.json'
    },
    vnet: {
        process: require(path.resolve('./core', 'virtualNetworkSettings.js')).transform,
        parameterName: 'virtualNetworkSettings',
        template: 'https://raw.githubusercontent.com/mspnp/template-building-blocks/andrew/spikes/spikes/nodejs-spike/templates/buildingBlocks/virtualNetworks/virtualNetworks.json'
    },
    'vnet-gateway': {
        process: require(path.resolve('./core', 'virtualNetworkGatewaySettings.js')).transform,
        parameterName: 'virtualNetworkGatewaySettings',
        template: 'https://raw.githubusercontent.com/mspnp/template-building-blocks/andrew/spikes/spikes/nodejs-spike/templates/buildingBlocks/virtualNetworkGateways/virtualNetworkGateways.json'
    },
    'vpn-connection': {
        process: require(path.resolve('./core', 'connectionSettings.js')).transform,
        parameterName: 'connectionSettings',
        template: 'https://raw.githubusercontent.com/mspnp/template-building-blocks/andrew/spikes/spikes/nodejs-spike/templates/buildingBlocks/connections/connections.json'
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

let getRegisteredClouds = () => {
    let child = childProcess.spawnSync('az', ['cloud', 'list'], {
        stdio: 'pipe',
        shell: true
    });

    if (child.status === 0) {
        return JSON.parse(child.stdout.toString());
    } else {
        throw new Error('error getting registered clouds');
    }
};
//let validateOutputModes
//let testCommandLine = ['dummy', 'dummy', '-b', 'vm', '-s', '3b518fac-e5c8-4f59-8ed5-d70b626f8e10', '-g', 'my-rg', '-p', 'spec/Parameters/vm-parameters-cmdline.json', '-o', 'output.json'];

let deployTemplate = ({parameterFile, location, buildingBlockSettings, buildingBlock}) => {
    let buildingBlockMetadata = buildingBlocks[buildingBlock];
    if (!buildingBlockMetadata) {
        throw new Error(`building block ${buildingBlock} was not found`);
    }
    // Get the current date in UTC and remove the separators.  We can use this as our deployment name.
    let deploymentName = `${buildingBlock}-${new Date().toISOString().replace(/[T\:\.\Z-]/g, '')}`;
    // let spawn = require('child_process').spawnSync;
    // let azOutput = spawn('az');
    // if (azOutput.status === 0) {
    //     console.log(azOutput.stdout);
    // } else {
    //     console.log(azOutput.stderr);
    // }
    let spawn = childProcess.spawn;
    let spawnSync = childProcess.spawnSync;
    let child;
    // let currentSubscriptionId;
    // // Since we will be setting the subscription, we should save the current one and reset it at the end
    // child = spawnSync('az', ['account', 'show', '--output', 'json'], {
    //     stdio: 'pipe'
    // });

    // if (child.status === 0) {
    //     currentSubscriptionId = JSON.parse(child.stdout.toString()).id;
    // }

    // // Login first
    // child = spawnSync('az', ['login'], {
    //     stdio: 'inherit',
    //     shell: true
    // });
    // if (child.status !== 0) {
    //     throw Error(`Error executing az login: ${child.stderr}`);
    // }

    //if (child.status === 0) {
        // Set the subscription
        child = spawnSync('az', ['account', 'set', '--subscription', buildingBlockSettings.subscriptionId], {
            stdio: 'inherit',
            shell: true
        });

        if (child.status === 0) {
            // See if the resource group exists, and if not create it.
            child = spawnSync('az', ['group', 'exists', '--name', buildingBlockSettings.resourceGroupName], {
                stdio: 'pipe',
                shell: true
            });
            if (child.status === 0) {
                if (child.stdout.toString().trim() === 'false') {
                    // Create the resource group
                    child = spawnSync('az', ['group', 'create', '--location', location, '--name', buildingBlockSettings.resourceGroupName], {
                        stdio: 'inherit',
                        shell: true
                    });

                    if (child.status !== 0) {
                        throw new Error(`error creating resource group '${buildingBlockSettings.resourceGroupName}' in location '${location}'`);
                    }
                }

                child = spawn('az', ['group', 'deployment', 'create', '--name', deploymentName,
                    '--resource-group', buildingBlockSettings.resourceGroupName,
                    '--template-uri', buildingBlockMetadata.template,
                    '--parameters', `@${parameterFile}`], {
                    stdio: 'inherit',
                    shell: true
                });
                child.on('close', (code) => {
                    if (code !== 0) {
                        console.error(`error executing az group deploy create: ${code}`);
                    }
                });
            } else {
                throw new Error(`error checking resource group existence: ${child.stderr.toString()}`);
            }
            
        } else {
            throw new Error(`error executing az account set${(child.stderr) ? ': ' + child.stderr.toString() : ''}`);
        }
    // } else {
    //     throw new Error(`error executing az login`);
    // }
};

let registeredClouds = getRegisteredClouds();

try {
    commander
        .version('0.0.1')
        .option('-b, --building-block <building-block>', 'the building block to execute', validateBuildingBlockName)
        .option('-g, --resource-group <resource-group>', 'the name of the resource group')
        .option('-p, --parameters-file <parameters-file>', 'the path to a parameters file')
        .option('-o, --output-file <output-file>', 'the output file name')
        .option('-s, --subscription-id <subscription-id>', 'the subscription identifier', validateSubscriptionId)
        .option('-l, --location <location>', 'location in which to create the resource group, if it does not exist')
        .option('-d, --defaults-directory <defaults-directory>', 'directory containing customized building block default values')
        .option('--json', 'output JSON to console')
        .option('--deploy', 'deploy building block using az')
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

    if (!_.isUndefined(commander.defaultsDirectory)) {
        commander.defaultsDirectory = path.resolve(commander.defaultsDirectory);
        if (!fs.existsSync(commander.defaultsDirectory)) {
            throw new Error(`defaults path '${commander.defaultsDirectory}' was not found`);
        }
    }

    if (commander.deploy === true) {
        if (_.isUndefined(commander.location)) {
            throw new Error('--deploy was specified, but no location was specified');
        }

        if (commander.json === true) {
            throw new Error('--deploy cannot be specified with --json');
        }
        // If the deploy flag is specified, see if az is available on the path.  The only reliable way seems to be to try to run it, and
        // if the error code is not 0, az is not available.  Since we are just checking, we'll ignore the stdio and just check the status code.
        let child = childProcess.spawnSync('az', {
            stdio: 'ignore',
            shell: true
        });

        if (child.status !== 0) {
            throw new Error('--deploy was specified but there was an error executing az');
        }
    }

    let parameters = parseParameterFile({
        parameterFile: commander.parametersFile
    });

    let buildingBlockSettings = {
        subscriptionId: commander.subscriptionId,
        resourceGroupName: commander.resourceGroup
    };

    let result = processParameters({
        buildingBlock: commander.buildingBlock,
        parameters: parameters,
        buildingBlockSettings: buildingBlockSettings,
        defaultsDirectory: commander.defaultsDirectory
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

        if (commander.deploy === true) {
            deployTemplate({
                parameterFile: commander.outputFile,
                location: commander.location,
                buildingBlockSettings: buildingBlockSettings,
                buildingBlock: commander.buildingBlock
            });
        }
    }
} catch (e) {
    console.error();
    console.error(`  error: ${e.message}`);
    console.error();
    process.exit(1);
}

//process.exit(0);
