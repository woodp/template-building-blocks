let _ = require('../lodashMixins.js');
let v = require('./validation.js');
let r = require('./resources.js');

let validationMessages = require('./validationMessages.js');

let networkSecurityGroupSettingsDefaults = {
    virtualNetworks: [],
    networkInterfaces: [],
    securityRules: []
};

let validProtocols = ['TCP', 'UDP', '*'];
let validDefaultTags = ['VirtualNetwork', 'AzureLoadBalancer', 'Internet', '*'];
let validDirections = ['Inbound', 'Outbound'];
let validAccesses = ['Allow', 'Deny'];

let isValidProtocol = (protocol) => {
    return v.utilities.isStringInArray(protocol, validProtocols);
};

let isValidAddressPrefix = (addressPrefix) => {
    return ((v.utilities.networking.isValidIpAddress(addressPrefix)) ||
        (v.utilities.networking.isValidCidr(addressPrefix)) ||
        (v.utilities.isStringInArray(addressPrefix, validDefaultTags)));
};

let isValidDirection = (direction) => {
    return v.utilities.isStringInArray(direction, validDirections);
};

let isValidPriority = (priority) => {
    priority = _.toNumber(priority);
    return ((!_.isUndefined(priority)) && (_.isFinite(priority)) && (_.inRange(priority, 100, 4097)));
};

let isValidAccess = (access) => {
    return v.utilities.isStringInArray(access, validAccesses);
};

let networkSecurityGroupSettingsSecurityRulesValidations = {
    name: v.utilities.isNotNullOrWhitespace,
    protocol: (value, parent) => {
        return {
            result: isValidProtocol(value),
            message: `Valid values are ${validProtocols.join(',')}`
        };
    },
    sourcePortRange: v.utilities.networking.isValidPortRange,
    destinationPortRange: v.utilities.networking.isValidPortRange,
    sourceAddressPrefix: (value, parent) => {
        return {
            result: isValidAddressPrefix(value),
            message: `Valid values are an IPAddress, a CIDR, or one of the following values: ${validDefaultTags.join(',')}`
        };
    },
    destinationAddressPrefix: (value, parent) => {
        return {
            result: isValidAddressPrefix(value),
            message: `Valid values are an IPAddress, a CIDR, or one of the following values: ${validDefaultTags.join(',')}`
        };
    },
    direction: (value, parent) => {
        return {
            result: isValidDirection(value),
            message: `Valid values are ${validDirections.join(',')}`
        };
    },
    priority: isValidPriority,
    access: (value, parent) => {
        return {
            result: isValidAccess(value),
            message: `Valid values are ${validAccesses.join(',')}`
        };
    }
};

let virtualNetworkValidations = {
    name: v.utilities.isNotNullOrWhitespace,
    subnets: (value, parent) => {
       if ((_.isNil(value)) || (value.length === 0)) {
            return {
                result: false,
                message: 'Value cannot be null, undefined, or an empty array'
            };
        } else {
            return {
                validations: v.utilities.isNotNullOrWhitespace
            };
        }
    }
};

let networkInterfaceValidations = {
    name: v.utilities.isNotNullOrWhitespace
};

let networkSecurityGroupSettingsValidations = {
    name: v.utilities.isNotNullOrWhitespace,
    securityRules: (value, parent) => {
        // We allow empty arrays
        let result = {
            result: true
        };

        if (value.length > 0) {
            // We need to validate if the array isn't empty
            result = {
                validations: networkSecurityGroupSettingsSecurityRulesValidations
            };
        }

        return result;
    },
    virtualNetworks: (value, parent) => {
        // We allow empty arrays
        let result = {
            result: true
        };

        if (value.length > 0) {
            // We need to validate if the array isn't empty
            result = {
                validations: virtualNetworkValidations
            };
        }

        return result;
    },
    networkInterfaces: (value, parent) => {
        // We allow empty arrays
        let result = {
            result: true
        };

        if (value.length > 0) {
            // We need to validate if the array isn't empty
            result = {
                validations: networkInterfaceValidations
            };
        }

        return result;
    }
};

let mergeCustomizer = function (objValue, srcValue, key, object, source, stack) {
    if (v.utilities.isStringInArray(key, ['virtualNetworks', 'networkInterfaces', 'securityRules'])) {
        if ((!_.isNil(srcValue)) && (_.isArray(srcValue))) {
            return srcValue;
        } else {
            return objValue;
        }
    }
};

function transform(settings) {
    return {
        name: settings.name,
        id: r.resourceId(settings.subscriptionId, settings.resourceGroupName, 'Microsoft.Network/networkSecurityGroups', settings.name),
        resourceGroupName: settings.resourceGroupName,
        subscriptionId: settings.subscriptionId,
        subnets: _.transform(settings.virtualNetworks, (result, virtualNetwork) => {
            _.each(virtualNetwork.subnets, (subnet) => {
                result.push(r.resourceId(virtualNetwork.subscriptionId, virtualNetwork.resourceGroupName, 'Microsoft.Network/virtualNetworks/subnets',
                    virtualNetwork.name, subnet));
            })
        }, []),
        networkInterfaces: _.transform(settings.networkInterfaces, (result, networkInterface) => {
            result.push(r.resourceId(networkInterface.subscriptionId, networkInterface.resourceGroupName, 'Microsoft.Network/networkInterfaces',
                    networkInterface.name));
        }, []),
        properties: {
            securityRules: _.map(settings.securityRules, (value, index) => {
                let result = {
                    name: value.name,
                    properties: {
                        direction: value.direction,
                        priority: value.priority,
                        sourceAddressPrefix: value.sourceAddressPrefix,
                        destinationAddressPrefix: value.destinationAddressPrefix,
                        sourcePortRange: value.sourcePortRange,
                        destinationPortRange: value.destinationPortRange,
                        access: value.access,
                        protocol: value.protocol
                    }
                };

                return result;
            })
        }
    };
}

exports.transform = function ({settings, buildingBlockSettings}) {
    if (_.isPlainObject(settings)) {
        settings = [settings];
    }

    let results = _.transform(settings, (result, setting, index) => {
        let merged = v.merge(setting, networkSecurityGroupSettingsDefaults);
        let errors = v.validate({
            settings: merged,
            validations: networkSecurityGroupSettingsValidations
        });
        if (errors.length > 0) {
          throw new Error(JSON.stringify(errors));
        }

        result.push(merged);
    }, []);

    buildingBlockErrors = v.validate({
        settings: buildingBlockSettings,
        validations: {
            subscriptionId: v.utilities.isNotNullOrWhitespace,
            resourceGroupName: v.utilities.isNotNullOrWhitespace,
        }
    });

    if (buildingBlockErrors.length > 0) {
        throw new Error(JSON.stringify(buildingBlockErrors));
    }

    results = _.transform(results, (result, setting) => {
        setting = r.setupResources(setting, buildingBlockSettings, (parentKey) => {
            return ((parentKey === null) || (parentKey === "virtualNetworks") || (parentKey === "networkInterfaces"));
        });
        setting = transform(setting);
        result.push(setting);
    }, []);

    return { settings: results };
};