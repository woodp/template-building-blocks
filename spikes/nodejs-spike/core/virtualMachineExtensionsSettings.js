let _ = require('lodash');
var fs = require('fs');
let v = require('./validation.js');
var resources = require('./resources.js');
let rewire = require('rewire');

function merge(settings) {
    return settings;
}

function validate(settings) {
    return {
        result: true
    };
}

let processProperties = {
    frontendIPConfigurations: (value, key, parent, accumulator) => {
        let feIpConfigs = [];
        value.forEach((config, index) => {
            if (config.loadBalancerType === 'internal') {
                feIpConfigs.push({
                    name: config.name,
                    properties: {
                        privateIPAllocationMethod: 'Static',
                        privateIPAddress: config.internalLoadBalancerSettings.privateIPAddress,
                        subnet: {
                            id: resources.resourceId(parent.virtualNetwork.subscriptionId, parent.virtualNetwork.resourceGroupName, 'Microsoft.Network/virtualNetworks/subnets', parent.virtualNetwork.name, config.internalLoadBalancerSettings.subnetName),
                        }
                    }
                });
            } else if (config.loadBalancerType === 'public') {
                feIpConfigs.push({
                    name: config.name,
                    properties: {
                        privateIPAllocationMethod: 'Dynamic',
                        publicIPAddress: {
                            id: resources.resourceId(parent.subscriptionId, parent.resourceGroupName, 'Microsoft.Network/publicIPAddresses', `${config.name}-pip`)
                        }
                    }
                });
            }
        });
        accumulator.loadBalancers[0].properties['frontendIPConfigurations'] = feIpConfigs;
    }
};

function process(param, buildingBlockSettings) {
    let accumulator = {extensions: []};
    param.forEach((value) => {
        value.extensions.forEach((ext) => {
            let setting = {
                name: ext.name,
                vms: value.vms
            };

            if (ext.protectedSettings.hasOwnProperty('reference') && ext.protectedSettings.reference.hasOwnProperty('keyVault')) {
                setting.extensionProtectedSettings = ext.protectedSettings;
            } else {
                setting.extensionProtectedSettings = {value: JSON.stringify(ext.protectedSettings)};
            }
            let extension = _.cloneDeep(ext);
            delete extension.protectedSettings;
            delete extension.name;
            setting.extensionSettings = extension;
            accumulator.extensions.push(setting);
        });
    });
    return accumulator;
}

function createTemplateParameters(resources) {
    let templateParameters = {
        $schema: 'http://schema.management.azure.com/schemas/2015-01-01/deploymentParameters.json#',
        contentVersion: '1.0.0.0',
        parameters: {

        }
    };
    templateParameters.parameters = _.transform(resources, (result, value, key) => {
        result[key] = {};
        result[key].value = value;
        return result;
    }, {});
    return templateParameters;
}

function getTemplateParameters(param, buildingBlockSettings) {
    let processedParams = mergeAndProcess(param, buildingBlockSettings);
    return createTemplateParameters(processedParams);
}

function mergeAndProcess(param, buildingBlockSettings) {
    return process(merge(param), buildingBlockSettings);
}

exports.processvirtualMachineExtensionsSettings = mergeAndProcess;
exports.mergeWithDefaults = merge;
exports.validations = validate;
exports.getTemplateParameters = getTemplateParameters;