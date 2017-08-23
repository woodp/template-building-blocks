'use strict';
const childProcess = require('child_process');
const os = require('os');
const v = require('./core/validation');

let spawnAz = ({args = [], spawnOptions = {
    stdio: 'pipe',
    shell: true
}, azOptions = {
    debug: false
}}) => {
    if (azOptions.debug === true) {
        args.push('--debug');
    }
    let child = childProcess.spawnSync('az', args, spawnOptions);
    if (child.status !== 0) {
        throw new Error(`error executing az${os.EOL}  status: ${child.status}${os.EOL}  arguments: ${args.join(' ')}`);
    }

    return child;
};

let setSubscription = ({subscriptionId, azOptions}) => {
    if (v.utilities.isNullOrWhitespace(subscriptionId)) {
        throw new Error('subscriptionId cannot be undefined, null, empty, or only whitespace');
    }

    let child = spawnAz({
        args: ['account', 'set', '--subscription', subscriptionId],
        spawnOptions: {
            stdio: 'inherit',
            shell: true
        },
        azOptions: azOptions
    });

    return child;
};

let setCloud = ({name, azOptions}) => {
    if (v.utilities.isNullOrWhitespace(name)) {
        throw new Error('name cannot be undefined, null, empty, or only whitespace');
    }

    let child = spawnAz({
        args: ['cloud', 'set', '--name', name],
        spawnOptions: {
            stdio: 'inherit',
            shell: true
        },
        azOptions: azOptions
    });

    return child;
};

let createResourceGroupIfNotExists = ({resourceGroupName, location, azOptions}) => {

    if (v.utilities.isNullOrWhitespace(resourceGroupName)) {
        throw new Error('resourceGroupName cannot be undefined, null, empty, or only whitespace');
    }

    if (v.utilities.isNullOrWhitespace(location)) {
        throw new Error('location cannot be undefined, null, empty, or only whitespace');
    }

     // See if the resource group exists, and if not create it.
    let child = spawnAz({
        args: ['group', 'exists', '--name', resourceGroupName],
        spawnOptions: {
            stdio: 'pipe',
            shell: true
        }
    });

    // The result has to be trimmed because it has a newline at the end
    if (child.stdout.toString().trim() === 'false') {
        // Create the resource group
        child = spawnAz({
            args: ['group', 'create', '--location', location, '--name', resourceGroupName],
            spawnOptions: {
                stdio: 'inherit',
                shell: true
            },
            azOptions: azOptions
        });
    }

    return child;
};

let deployTemplate = ({deploymentName, resourceGroupName, templateUri, parameterFile, azOptions}) => {
    let args = ['group', 'deployment', 'create', '--name', deploymentName,
        '--resource-group', resourceGroupName,
        '--template-uri', templateUri.replace(/&/g, (os.platform() === 'win32' ? '^^^&' : '\\&')),
        '--parameters', `@${parameterFile}`];

    let child = spawnAz({
        args: args,
        spawnOptions: {
            stdio: 'inherit',
            shell: true
        },
        azOptions: azOptions
    });

    return child;
};

let getRegisteredClouds = ({azOptions} = {}) => {
    let child = spawnAz({
        args: ['cloud', 'list'],
        azOptions: azOptions
    });

    return JSON.parse(child.stdout.toString());
};

exports.createResourceGroupIfNotExists = createResourceGroupIfNotExists;
exports.deployTemplate = deployTemplate;
exports.getRegisteredClouds = getRegisteredClouds;
exports.setSubscription = setSubscription;
exports.setCloud = setCloud;
exports.spawnAz = spawnAz;