'use strict';
const childProcess = require('child_process');
const os = require('os');
const v = require('./core/validation');
const _ = require('lodash');

let spawnAz = ({args, spawnOptions, azOptions}) => {
    if (!_.isArray(args) || args.length === 0) {
        throw new Error('args must be an array with a length greater than 0');
    }

    spawnOptions = spawnOptions || {
        stdio: 'pipe',
        shell: true
    };

    azOptions = azOptions || {
        debug: false
    };

    if (azOptions.debug) {
        args.push('--debug');
    }
    let child = childProcess.spawnSync('az', args, spawnOptions);
    if (child.status !== 0) {
        let error = `error executing az${os.EOL}`;
        // If our stdio is 'pipe', we should pull the error message out and show it.
        if (spawnOptions.stdio === 'pipe') {
            error += `  message: ${child.stderr.toString().trim()}${os.EOL}`;
        }

        error += `  status: ${child.status}${os.EOL}  arguments: ${args.join(' ')}`;
        throw new Error(error);
    }

    if ((azOptions.debug) && (spawnOptions.stdio === 'pipe')) {
        // The spawn was successful, but we are debugging, so we need to write the stderr, but only if stdio === 'pipe'
        console.error(child.stderr.toString().trim());
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
        args: ['cloud', 'list', '--output', 'json'],
        azOptions: azOptions
    });

    try {
        return JSON.parse(child.stdout.toString());
    } catch (e) {
        throw new Error(`error retrieving cloud list${os.EOL}message: ${e.message}`);
    }
};

exports.createResourceGroupIfNotExists = createResourceGroupIfNotExists;
exports.deployTemplate = deployTemplate;
exports.getRegisteredClouds = getRegisteredClouds;
exports.setSubscription = setSubscription;
exports.setCloud = setCloud;
exports.spawnAz = spawnAz;