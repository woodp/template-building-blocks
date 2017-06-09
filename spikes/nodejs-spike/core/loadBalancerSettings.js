let _ = require('lodash');
var fs = require('fs');
let v = require('./validation.js');
var resources = require('./resources.js');
var pipSettings = require('./pipSettings.js');
let virtualMachineSettings = require('./virtualMachineSettings.js');
const defaultsPath = './defaults/loadBalancerSettings.json';

function merge(settings) {
    let defaults = JSON.parse(fs.readFileSync(defaultsPath, 'UTF-8'));

    let merged = v.merge(settings, defaults, defaultsCustomizer);
    merged = v.merge(merged, {}, (objValue, srcValue, key) => {
        if (key === 'backendVirtualMachinesSettings') {
            return virtualMachineSettings.mergeWithDefaults(srcValue);
        }
    });

    return merged;
}

function defaultsCustomizer(objValue, srcValue, key) {
    if (objValue && key === 'backendVirtualMachinesSettings') {
        if (srcValue.nics && _.isArray(srcValue.nics) && srcValue.nics.length >= 0) {
            objValue.nics = [];
        }
    }
    if (objValue && key === 'frontendIPConfigurations') {
        if (srcValue && _.isArray(srcValue) && srcValue.length > 0) {
            objValue.splice(0, 1);
        }
    }
    if (objValue && key === 'backendPools') {
        if (srcValue && _.isArray(srcValue) && srcValue.length > 0) {
            objValue.splice(0, 1);
        }
    }
    if (objValue && key === 'probes') {
        return v.merge(srcValue, objValue);
    }
}

let validLoadBalancerTypes = ['Public', 'Internal'];
let validProtocols = ['Tcp', 'Udp'];
let validIPAllocationMethods = ['Dynamic', 'Static'];
let validProbeProtocols = ['Http', 'Tcp'];
let validLoadDistributions = [ 'Default', 'SourceIP', 'SourceIPProtocol' ];

let isValidLoadBalancerType = (loadBalancerType) => {
    return v.utilities.isStringInArray(loadBalancerType, validLoadBalancerTypes);
};

let isValidProtocol = (protocol) => {
    return v.utilities.isStringInArray(protocol, validProtocols);
};

let isValidIPAllocationMethod = (ipAllocationMethod) => {
    return v.utilities.isStringInArray(ipAllocationMethod, validIPAllocationMethods);
};

let isValidProbeProtocol = (probeProtocol) => {
    return v.utilities.isStringInArray(probeProtocol, validProbeProtocols);
};

let isValidLoadDistribution = (loadDistribution) => {
    return v.utilities.isStringInArray(loadDistribution, validLoadDistributions);
};

let frontendIPConfigurationValidations = {
    name: v.validationUtilities.isNotNullOrWhitespace,
    loadBalancerType: (value) => {
        return {
            result: isValidLoadBalancerType(value),
            message: `Valid values are ${validLoadBalancerTypes.join(',')}`
        };
    },
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

function validate(settings) {
    return v.validate({
        settings: settings,
        validations: loadBalancerValidations
    });
}

let loadBalancerValidations = {
    frontendIPConfigurations: () => {
        return {
            validations: frontendIPConfigurationValidations
        };
    },
    loadBalancingRules: (value, parent) => {
        let baseSettings = parent;
        let loadBalancingRuleValidations = {
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
            enableFloatingIP: v.validationUtilities.isBoolean,
            frontendIPConfigurationName: (value, parent) => {
                let result = {
                    result: false,
                    message: `Invalid frontendIPConfigurationName. loadBalancingRule: ${parent.name}, frontendIPConfigurationName: ${value}`
                };
                baseSettings.frontendIPConfigurations.forEach((config) => {
                    if (config.name === value) {
                        return { result: true };
                    }
                });
                return result;
            },
            backendPoolName: (value, parent) => {
                let result = {
                    result: false,
                    message: `Invalid backendPoolName. loadBalancingRule: ${parent.name}, backendPoolName: ${value}`
                };
                baseSettings.backendPools.forEach((config) => {
                    if (config.name === value) {
                        return { result: true };
                    }
                });
                return result;
            },
            probeName: (value, parent) => {
                let result = {
                    result: false,
                    message: `Invalid probeName. loadBalancingRule: ${parent.name}, probeName: ${value}`
                };
                baseSettings.probes.forEach((config) => {
                    if (config.name === value) {
                        return { result: true };
                    }
                });
                return result;
            },
            loadDistribution: (value) => {
                let result = {
                    result: true
                };

                // loadDistribution is not required.
                if (!_.isUndefined(value)) {
                    result = {
                        result: isValidLoadDistribution(value),
                        message: `Valid values are ${validLoadDistributions.join(',')}`
                    };
                }

                return result;
            }
        };
        return {
            validations: loadBalancingRuleValidations
        };
    },
    probes: () => {
        return {
            validations: probeValidations
        };
    },
    backendPools: (value, parent) => {
        let baseSettings = parent;
        let backendPoolsValidations = {
            name: v.validationUtilities.isNotNullOrWhitespace,
            nics: (value) => {
                let nicsValidations = {
                    vmIndex: (value) => {
                        return {
                            result: !value <= (baseSettings.backendVirtualMachinesSettings.vmCount - 1),
                            message: 'vmIndex cannot be greated than number of VMs'
                        };
                    },
                    nicIndex: (value) => {
                        return {
                            result: !value <= (baseSettings.backendVirtualMachinesSettings.nics.length - 1),
                            message: 'nicIndex cannot be greated than nics specified in backendVirtualMachinesSettings'
                        };
                    }
                };
                return {
                    validations: nicsValidations
                };
            }
        };
        return {
            validations: backendPoolsValidations
        };
    },
    inboundNatRules: (value, parent) => {
        let baseSettings = parent;
        let inboundNatRuleValidations = {
            name: v.validationUtilities.isNotNullOrWhitespace,
            protocol: (value) => {
                return {
                    result: isValidProtocol(value),
                    message: `Valid values are ${validProtocols.join(',')}`
                };
            },
            startingFrontendPort: (value) => {
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
            enableFloatingIP: v.validationUtilities.isBoolean,
            frontendIPConfigurationName: (value, parent) => {
                let result = {
                    result: false,
                    message: `Invalid frontendIPConfigurationName. inboundNatRule: ${parent.name}, frontendIPConfigurationName: ${value}`
                };
                baseSettings.frontendIPConfigurations.forEach((config) => {
                    if (config.name === value) {
                        return { result: true };
                    }
                });
                return result;
            },
            nics: (value) => {
                let nicsValidations = {
                    vmIndex: (value) => {
                        return {
                            result: !value <= (baseSettings.backendVirtualMachinesSettings.vmCount - 1),
                            message: 'vmIndex cannot be greated than number of VMs'
                        };
                    },
                    nicIndex: (value) => {
                        return {
                            result: !value <= (baseSettings.backendVirtualMachinesSettings.nics.length - 1),
                            message: 'nicIndex cannot be greated than nics specified in backendVirtualMachinesSettings'
                        };
                    }
                };
                return {
                    validations: nicsValidations
                };
            }
        };
        return {
            validations: inboundNatRuleValidations
        };
    },
    virtualNetwork: () => {
        return {
            validations: {
                name: v.validationUtilities.isNotNullOrWhitespace
            }
        };
    },
    backendVirtualMachinesSettings: () => {
        return {
            validations: virtualMachineSettings.validations
        };
    }

};

let processProperties = {
    frontendIPConfigurations: (value, key, parent, accumulator) => {
        let feIpConfigs = [];
        value.forEach((config) => {
            if (config.loadBalancerType === 'Internal') {
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
            } else if (config.loadBalancerType === 'Public') {
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
                    frontendIPConfiguration: {
                        id: resources.resourceId(parent.subscriptionId, parent.resourceGroupName, 'Microsoft.Network/loadBalancers/frontendIPConfigurations', parent.name, rule.frontendIPConfigurationName)
                    },
                    backendAddressPool: {
                        id: resources.resourceId(parent.subscriptionId, parent.resourceGroupName, 'Microsoft.Network/loadBalancers/backendAddressPools', parent.name, rule.backendPoolName)
                    },
                    frontendPort: rule.frontendPort,
                    backendPort: rule.backendPort,
                    protocol: rule.protocol,
                    enableFloatingIP: rule.enableFloatingIP,
                    probe: {
                        id: resources.resourceId(parent.subscriptionId, parent.resourceGroupName, 'Microsoft.Network/loadBalancers/probes', parent.name, rule.probeName)
                    },
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

            pool.nics.ids.forEach((i) => {
                ((nics[i]) || (nics[i] = [])).push({
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
            rule.nics.ids.forEach((i, index) => {
                let natRule = {
                    name: rule.name,
                    properties: {
                        frontendIPConfiguration: {
                            id: resources.resourceId(parent.subscriptionId, parent.resourceGroupName, 'Microsoft.Network/loadBalancers/frontendIPConfigurations', parent.name, rule.frontendIPConfigurationName)
                        },
                        protocol: rule.protocol,
                        enableFloatingIP: rule.enableFloatingIP,
                        idleTimeoutInMinutes: rule.idleTimeoutInMinutes
                    }
                };
                if (rule.nics.ids.length > 1) {
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

                ((nics[i]) || (nics[i] = [])).push({
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
        _.mergeWith(accumulator, virtualMachineSettings.processVirtualMachineSettings(value, { resourceGroupName: parent.resourceGroupName, subscriptionId: parent.subscriptionId }), pipCustomizer);
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
        if (config.loadBalancerType === 'Public') {
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
        if (!pool.nics.hasOwnProperty('vmIndex') || pool.nics.vmIndex.length === 0) {
            let count = accumulator.virtualMachines.length;
            pool.nics.vmIndex = [];
            for (let i = 0; i < count; i++) {
                pool.nics.vmIndex.push(i);
            }
        }
        pool.nics.vmIndex.forEach((index) => {
            backendPoolNics.push(accumulator.virtualMachines[index].properties.networkProfile.networkInterfaces[pool.nics.nicIndex].id);
        });
        param.backendPools[i].nics.ids = backendPoolNics;
    });

    let natRules = param.inboundNatRules;
    natRules.forEach((rule, i) => {
        let natRuleNics = [];
        if (!rule.nics.hasOwnProperty('vmIndex') || rule.nics.vmIndex.length === 0) {
            let count = accumulator.virtualMachines.length;
            rule.nics.vmIndex = [];
            for (let i = 0; i < count; i++) {
                rule.nics.vmIndex.push(i);
            }
        }
        rule.nics.vmIndex.forEach((index) => {
            natRuleNics.push(accumulator.virtualMachines[index].properties.networkProfile.networkInterfaces[rule.nics.nicIndex].id);
        });
        param.inboundNatRules[i].nics.ids = natRuleNics;
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
    // add virtual network info from the load balancer settings to the VM property
    param.backendVirtualMachinesSettings['virtualNetwork'] = param.virtualNetwork;

    let updatedParams = augmentResourceGroupAndSubscriptioInfo(param, buildingBlockSettings);

    let accumulator = _.transform(updatedParams, (resources, value, key, obj) => {
        if (typeof processChildResources[key] === 'function') {
            processChildResources[key](value, key, obj, resources);
        }
        return resources;
    }, {});

    let updatedLoadBalancerSettings = updateNicReferencesInLoadBalancer(updatedParams, accumulator);
    accumulator = _.merge(accumulator, { loadBalancers: [{ properties: {} }] });
    _.transform(updatedLoadBalancerSettings, (accumulator, value, key, obj) => {
        if (typeof processProperties[key] === 'function') {
            processProperties[key](value, key, obj, accumulator);
        } else if (key === 'name') {
            accumulator.loadBalancers[0]['name'] = value;
        }
        return accumulator;
    }, accumulator);


    accumulator.nicUpdates = _.transform(_.cloneDeep(accumulator.nicUpdates), (result, value, key) => {
        result.push({
            id: key,
            properties: {
                loadBalancerBackendAddressPools: value.backendPools,
                loadBalancerInboundNatRules: value.inboundNatRules
            }
        });
        return result;
    }, []);

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

exports.processLoadBalancerSettings = mergeAndProcess;
exports.mergeWithDefaults = merge;
exports.validations = validate;
exports.getTemplateParameters = getTemplateParameters;