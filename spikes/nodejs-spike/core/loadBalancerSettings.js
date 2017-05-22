let _ = require('lodash');
let v = require('./validation.js');
var resources = require('./resources.js');
var pipSettings = require('./pipSettings.js');
let rewire = require('rewire');
let virtualMachineSettings = rewire('../core/virtualMachineSettings.js');

let validLoadBalancerTypes = ['Public', 'Internal'];
let validProtocols = ['Tcp', 'Udp'];
let validLoadDistributions = ['Default', 'SourceIP', 'SourceIPProtocol'];
let validIPAllocationMethods = ['Dynamic', 'Static'];
let validProbeProtocols = ['Http', 'Tcp'];

let isValidLoadBalancerType = (loadBalancerType) => {
    return v.utilities.isStringInArray(loadBalancerType, validLoadBalancerTypes);
};

let isValidProtocol = (protocol) => {
    return v.utilities.isStringInArray(protocol, validProtocols);
};

let isValidLoadDistribution = (loadDistribution) => {
    return v.utilities.isStringInArray(loadDistribution, validLoadDistributions);
};

let isValidIPAllocationMethod = (ipAllocationMethod) => {
    return v.utilities.isStringInArray(ipAllocationMethod, validIPAllocationMethods);
};

let isValidProbeProtocol = (probeProtocol) => {
    return v.utilities.isStringInArray(probeProtocol, validProbeProtocols);
};

let frontendIPConfigurationValidations = {
    name: v.validationUtilities.isNotNullOrWhitespace,
    privateIPAddress: (value, parent) => {
        let result = {
            result: true
        };

        if (parent.privateIPAllocationMethod === 'Static') {
            result = {
                result: v.utilities.networking.isValidIpAddress(value),
                message: 'Value must be a valid IP address'
            };
        } else if ((parent.privateIPAllocationMethod === 'Dynamic') && (!_.isNil(value))) {
            result = {
                result: false,
                message: 'If privateIPAllocationMethod is Dynamic, privateIPAddress cannot be specified'
            };
        }

        return result;
    },
    privateIPAllocationMethod: (value) => {
        return {
            result: isValidIPAllocationMethod(value),
            message: `Valid values are ${validIPAllocationMethods.join(',')}`
        };
    }
};

let loadBalancingRuleValidations = {
    name: v.validationUtilities.isNotNullOrWhitespace,
    protocol: (value) => {
        return {
            result: isValidProtocol(value),
            message: `Valid values are ${validProtocols.join(',')}`
        };
    },
    loadDistribution: (value) => {
        return {
            result: isValidLoadDistribution(value),
            message: `Valid values are ${validLoadDistributions.join(',')}`
        };
    },
    frontendPort: (value) => {
        return {
            result: _.inRange(_.toSafeInteger(value), 1, 65535),
            message: 'Valid values are from 1 to 65534'
        };
    },
    backendPort: (value) => {
        return {
            result: _.inRange(_.toSafeInteger(value), 1, 65536),
            message: 'Valid values are from 1 to 65535'
        };
    },
    idleTimeoutInMinutes: (value, parent) => {
        let result = {
            result: true
        };

        if ((parent.protocol === 'Tcp') && (!_.inRange(4, 31))) {
            result = {
                result: false,
                message: 'Valid values are from 4 to 30'
            };
        } else if ((parent.protocol === 'Udp') && (!_.isNil(value))) {
            result = {
                result: false,
                message: 'If protocol is Udp, idleTimeoutInMinutes cannot be specified'
            };
        }

        return result;
    },
    enableFloatingIP: v.validationUtilities.isBoolean
};

let inboundNatRuleValidations = {
    name: v.validationUtilities.isNotNullOrWhitespace,
    protocol: (value) => {
        return {
            result: isValidProtocol(value),
            message: `Valid values are ${validProtocols.join(',')}`
        };
    },
    frontendPort: (value) => {
        return {
            result: _.inRange(_.toSafeInteger(value), 1, 65535),
            message: 'Valid values are from 1 to 65534'
        };
    },
    backendPort: (value) => {
        return {
            result: _.inRange(_.toSafeInteger(value), 1, 65536),
            message: 'Valid values are from 1 to 65535'
        };
    },
    idleTimeoutInMinutes: (value, parent) => {
        let result = {
            result: true
        };

        if ((parent.protocol === 'Tcp') && (!_.inRange(4, 31))) {
            result = {
                result: false,
                message: 'Valid values are from 4 to 30'
            };
        } else if ((parent.protocol === 'Udp') && (!_.isNil(value))) {
            result = {
                result: false,
                message: 'If protocol is Udp, idleTimeoutInMinutes cannot be specified'
            };
        }

        return result;
    },
    enableFloatingIP: v.validationUtilities.isBoolean
};

let inboundNatPoolValidations = {
    name: v.validationUtilities.isNotNullOrWhitespace,
    protocol: (value) => {
        return {
            result: isValidProtocol(value),
            message: `Valid values are ${validProtocols.join(',')}`
        };
    },
    frontendPortRangeStart: (value) => {
        return {
            result: _.inRange(_.toSafeInteger(value), 1, 65535),
            message: 'Valid values are from 1 to 65534'
        };
    },
    frontendPortRangeEnd: (value) => {
        return {
            result: _.inRange(_.toSafeInteger(value), 1, 65536),
            message: 'Valid values are from 1 to 65535'
        };
    },
    backendPort: (value) => {
        return {
            result: _.inRange(_.toSafeInteger(value), 1, 65536),
            message: 'Valid values are from 1 to 65535'
        };
    }
};

let outboundNatRuleValidations = {
    name: v.validationUtilities.isNotNullOrWhitespace,
    allocatedOutboundPorts: _.isFinite
};

let probeValidations = {
    name: v.validationUtilities.isNotNullOrWhitespace,
    protocol: (value) => {
        return {
            result: isValidProbeProtocol(value),
            message: `Valid values are ${validProbeProtocols.join(',')}`
        };
    },
    port: (value) => {
        return {
            result: _.inRange(_.toSafeInteger(value), 1, 65536),
            message: 'Valid values are from 1 to 65535'
        };
    },
    intervalInSeconds: (value) => {
        return {
            // TODO - Not sure what the upper limit is, so I chose five minutes at random.
            result: _.inRange(_.toSafeInteger(value), 5, 300),
            message: 'Valid values are from 5 to 300'
        };
    },
    numberOfProbes: (value) => {
        return {
            result: _.isFinite(value),
            message: 'Valid value must be a finite number'
        };
    },
    requestPath: (value, parent) => {
        let result = {
            result: true
        };

        if ((parent.protocol === 'Http') && (_.isNullOrWhitespace(value))) {
            result = {
                result: false,
                message: 'If protocol is Http, requestPath cannot be null, undefined, or only whitespace'
            };
        } else if ((parent.protocol === 'Tcp') && (!_.isNil(value))) {
            result = {
                result: false,
                message: 'If protocol is Tcp, requestPath cannot be provided'
            };
        }

        return result;
    }
};

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
    },
    loadBalancingRules: (value, key, parent, accumulator) => {
        let lbRules = [];
        value.forEach((rule) => {
            lbRules.push({
                name: rule.name,
                properties: {
                    frontendIPConfiguration: resources.resourceId(parent.subscriptionId, parent.resourceGroupName, 'Microsoft.Network/loadBalancers/frontendIPConfigurations', parent.name, rule.frontendIPConfigurationName),
                    backendAddressPool: resources.resourceId(parent.subscriptionId, parent.resourceGroupName, 'Microsoft.Network/loadBalancers/backendAddressPools', parent.name, rule.backendPoolName),
                    frontendPort: rule.frontendPort,
                    backendPort: rule.backendPort,
                    protocol: rule.protocol,
                    enableFloatingIP: rule.enableFloatingIP,
                    probe: resources.resourceId(parent.subscriptionId, parent.resourceGroupName, 'Microsoft.Network/loadBalancers/probes', parent.name, rule.probeName),
                }
            });
        });
        accumulator.loadBalancers[0].properties['loadBalancingRules'] = lbRules;
    },
    probes: (value, key, parent, accumulator) => {
        let probes = [];
        value.forEach((probe) => {
            probes.push({
                name: probe.name,
                properties: {
                    port: probe.port,
                    protocol: probe.protocol,
                    requestPath: probe.requestPath,
                    intervalInSeconds: probe.intervalInSeconds,
                    numberOfProbes: probe.numberOfProbes
                }
            });
        });
        accumulator.loadBalancers[0].properties['probes'] = probes;
    },
    backendPools: (value, key, parent, accumulator) => {
        let pools = [];
        let nics = {};
        value.forEach((pool) => {
            pools.push({
                name: pool.name,
            });

            pool.nics.names.forEach((name, index) => {
                ((nics[name]) || (nics[name] = [])).push({
                    id: resources.resourceId(parent.subscriptionId, parent.resourceGroupName, 'Microsoft.Network/loadBalancers/backendAddressPools', parent.name, pool.name)
                });
            });
        });
        accumulator.loadBalancers[0].properties['backendAddressPools'] = pools;
        updateAccumulatorWithNicUpdates('backendPools', nics, accumulator);
    },
    inboundNatRules: (value, key, parent, accumulator) => {
        let natRules = [];
        let nics = {};
        value.forEach((rule) => {
            rule.nics.names.forEach((name, index) => {
                let natRule = {
                    name: rule.name,
                    properties: {
                        frontendIPConfiguration: resources.resourceId(parent.subscriptionId, parent.resourceGroupName, 'Microsoft.Network/loadBalancers/frontendIPConfigurations', parent.name, rule.frontendIPConfigurationName),
                        protocol: rule.protocol,
                        enableFloatingIP: rule.enableFloatingIP,
                        idleTimeoutInMinutes: rule.idleTimeoutInMinutes
                    }
                };
                if (rule.nics.names.length > 1) {
                    natRule.name = `${rule.name}-${index}`;
                }
                if (rule.enableFloatingIP === true) {
                    natRule.properties.frontendPort = rule.frontendPort;
                    natRule.properties.backendPort = rule.frontendPort;
                } else {
                    natRule.properties.frontendPort = rule.startingFrontendPort + index;
                    natRule.properties.backendPort = rule.backendPort;
                }
                natRules.push(natRule);

                ((nics[name]) || (nics[name] = [])).push({
                    id: resources.resourceId(parent.subscriptionId, parent.resourceGroupName, 'Microsoft.Network/loadBalancers/inboundNatRules', parent.name, natRule.name)
                });
            });
        });
        accumulator.loadBalancers[0].properties['inboundNatRules'] = natRules;
        updateAccumulatorWithNicUpdates('inboundNatRules', nics, accumulator);
    }
};

let processChildResources = {
    frontendIPConfigurations: (value, key, parent, accumulator) => {
        let pips = ((accumulator['pips']) || (accumulator['pips'] = [])).concat(processPipsForFrontendIPConfigurations(value));
        accumulator.pips = pips;
    },
    backendVirtualMachinesSettings: (value, key, parent, accumulator) => {
        _.mergeWith(accumulator, virtualMachineSettings.processVirtualMachineSettings(value, {resourceGroupName: parent.resourceGroupName, subscriptionId: parent.subscriptionId}), pipCustomizer);
    }
};

function pipCustomizer(objValue, srcValue, key) {
    if (key === 'pips') {
        return objValue.concat(srcValue);
    }
}

function processPipsForFrontendIPConfigurations(feIpconfig) {
    let pips = [];
    feIpconfig.forEach((config) => {
        if (config.loadBalancerType === 'public') {
            let settings = { namePrefix: config.name, publicIPAllocationMethod: 'Static', domainNameLabel: config.domainNameLabel };
            pips = pips.concat(pipSettings.processPipSettings(settings));
        }
    });
    return pips;
}

function updateAccumulatorWithNicUpdates(key, settings, accumulator) {
    if (!accumulator['nicUpdates']) {
        accumulator['nicUpdates'] = {};
    }
    for (let nic in settings) {
        if ((accumulator.nicUpdates[nic]) || (accumulator.nicUpdates[nic] = { backendPools: [], inboundNatRules: [] })) {
            accumulator.nicUpdates[nic][key] = accumulator.nicUpdates[nic][key].concat(settings[nic]);
        }
    }

}

function updateNicReferencesInLoadBalancer(settings, accumulator) {
    let param = _.cloneDeep(settings);
    let backendPools = param.backendPools;
    backendPools.forEach((pool, i) => {
        let backendPoolNics = [];
        pool.nics.vmIndex.forEach((index) => {
            backendPoolNics.push(accumulator.virtualMachines[index].properties.networkProfile.networkInterfaces[pool.nics.nicIndex].id);
        });
        param.backendPools[i].nics.names = backendPoolNics;
    });

    let natRules = param.inboundNatRules;
    natRules.forEach((rule, i) => {
        let natRuleNics = [];
        rule.nics.vmIndex.forEach((index) => {
            natRuleNics.push(accumulator.virtualMachines[index].properties.networkProfile.networkInterfaces[rule.nics.nicIndex].id);
        });
        param.inboundNatRules[i].nics.names = natRuleNics;
    });

    return param;
}

function augmentResourceGroupAndSubscriptioInfo(param, buildingBlockSettings) {
    param = resources.setupResources(param, buildingBlockSettings, (parentKey) => {
        return ((parentKey === null) || (v.utilities.isStringInArray(parentKey, ['nics', 'virtualNetwork'])));
    });

    return param;
}

function process(param, buildingBlockSettings) {
    // process VM settings
    param.backendVirtualMachinesSettings['virtualNetwork'] = param.virtualNetwork;
    let updatedParams = augmentResourceGroupAndSubscriptioInfo(param, buildingBlockSettings);

    let accumulator = _.transform(updatedParams, (resources, value, key, obj) => {
        if (typeof processChildResources[key] === 'function') {
            processChildResources[key](value, key, obj, resources);
        }
        return resources;
    }, {});

    let updatedLoadBalancerSettings = param;
    if (param.hasOwnProperty('backendVirtualMachinesSettings')) {
        updatedLoadBalancerSettings = updateNicReferencesInLoadBalancer(updatedParams, accumulator);
    }
    accumulator = _.merge(accumulator, {loadBalancers: [{properties: {}}]});
    return _.transform(updatedLoadBalancerSettings, (accumulator, value, key, obj) => {
        if (typeof processProperties[key] === 'function') {
            processProperties[key](value, key, obj, accumulator);
        } else if (key === 'name') {
            accumulator.loadBalancers[0]['name'] = value;
        }
        return accumulator;
    }, accumulator);
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
    let processedParams = process(param, buildingBlockSettings);
    return createTemplateParameters(processedParams);
}

exports.processLoadBalancerSettings = getTemplateParameters;
//exports.mergeWithDefaults = merge;
//exports.validations = validate;