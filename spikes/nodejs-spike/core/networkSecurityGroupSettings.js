let _ = require('../lodashMixins.js');
let v = require('./validation.js');
let r = require('./resources.js');

let validationMessages = require('./validationMessages.js');

let networkSecurityGroupSettingsDefaults = {
    securityRules: []
};

let isValidProtocol = (protocol) => {
    return v.utilities.isStringInArray(protocol, ['TCP', 'UDP', '*']);
};

let isValidAddressPrefix = (addressPrefix) => {
    return ((v.utilities.networking.isValidIpAddress(addressPrefix)) ||
        (v.utilities.networking.isValidCidr(addressPrefix)) ||
        (v.utilities.isStringInArray(addressPrefix, ['VirtualNetwork', 'AzureLoadBalancer', 'Internet', '*'])));
};

let isValidDirection = (direction) => {
    return v.utilities.isStringInArray(direction, ['Inbound', 'Outbound']);
};

let isValidPriority = (priority) => {
    priority = _.toNumber(priority);
    return ((!_.isUndefined(priority)) && (_.isFinite(priority)) && (_.inRange(priority, 100, 4097)));
};

let isValidAccess = (access) => {
    return v.utilities.isStringInArray(access, ['Allow', 'Deny']);
};

let networkSecurityGroupSettingsSecurityRulesValidations = {
    name: v.validationUtilities.isNullOrWhitespace,
    protocol: (result, parentKey, key, value, parent) => {
        if (!isValidProtocol(value)) {
            result.push({
                name: _.join((parentKey ? [parentKey, key] : [key]), '.'),
                message: validationMessages.networkSecurityGroup.securityRules.InvalidProtocol
            });
        }
    },
    sourcePortRange: (result, parentKey, key, value, parent) => {
        if (!v.utilities.networking.isValidPortRange(value)) {
            result.push({
                name: _.join((parentKey ? [parentKey, key] : [key]), '.'),
                message: validationMessages.networkSecurityGroup.securityRules.InvalidPortRange
            });
        }
    },
    destinationPortRange: (result, parentKey, key, value, parent) => {
        if (!v.utilities.networking.isValidPortRange(value)) {
            result.push({
                name: _.join((parentKey ? [parentKey, key] : [key]), '.'),
                message: validationMessages.networkSecurityGroup.securityRules.InvalidPortRange
            });
        }
    },
    sourceAddressPrefix: (result, parentKey, key, value, parent) => {
        if (!isValidAddressPrefix(value)) {
            result.push({
                name: _.join((parentKey ? [parentKey, key] : [key]), '.'),
                message: validationMessages.networkSecurityGroup.securityRules.InvalidAddressPrefix
            });
        }
    },
    destinationAddressPrefix: (result, parentKey, key, value, parent) => {
        if (!isValidAddressPrefix(value)) {
            result.push({
                name: _.join((parentKey ? [parentKey, key] : [key]), '.'),
                message: validationMessages.networkSecurityGroup.securityRules.InvalidAddressPrefix
            });
        }                
    },
    direction: (result, parentKey, key, value, parent) => {
        //if (!v.utilities.isStringInArray(value, ['Inbound', 'Outbound'])) {
        if (!isValidDirection(value)) {
            result.push({
                name: _.join((parentKey ? [parentKey, key] : [key]), '.'),
                message: validationMessages.networkSecurityGroup.securityRules.InvalidDirection
            });
        }
    },
    priority: (result, parentKey, key, value, parent) => {
        if (!isValidPriority(value)) {
            result.push({
                name: _.join((parentKey ? [parentKey, key] : [key]), '.'),
                message: validationMessages.networkSecurityGroup.securityRules.InvalidPriority
            });
        }
    },
    access: (result, parentKey, key, value, parent) => {
        if (!isValidAccess(value)) {
            result.push({
                name: _.join((parentKey ? [parentKey, key] : [key]), '.'),
                message: validationMessages.networkSecurityGroup.securityRules.InvalidAccess
            });
        }
    }
};

let networkSecurityGroupSettingsValidations = {
    name: v.validationUtilities.isNullOrWhitespace,
    securityRules: (result, parentKey, key, value, parent) => {
        v.reduce({
            validations: networkSecurityGroupSettingsSecurityRulesValidations,
            value: value,
            parentKey: parentKey,
            parentValue: parent,
            accumulator: result
        });
    }
};

// function transform(settings) {
//     return {
//         name: settings.name,
//         id: r.resourceId(settings.subscriptionId, settings.resourceGroupName, 'Microsoft.Network/routeTables', settings.name),
//         resourceGroupName: settings.resourceGroupName,
//         subscriptionId: settings.subscriptionId,
//         subnets: _.transform(settings.virtualNetworks, (result, virtualNetwork) => {
//             _.each(virtualNetwork.subnets, (subnet) => {
//                 result.push(r.resourceId(virtualNetwork.subscriptionId, virtualNetwork.resourceGroupName, 'Microsoft.Network/virtualNetworks/subnets',
//                     virtualNetwork.name, subnet));
//                     //virtualNetwork.name, subnet.name));
//             })
//         }, []),
//         properties: {
//             routes: _.map(settings.routes, (value, index) => {
//                 let result = {
//                     name: value.name,
//                     properties: {
//                         addressPrefix: value.addressPrefix,
//                         nextHopType: value.nextHopType
//                     }
//                 };

//                 if (value.nextHopIpAddress) {
//                     result.properties.nextHopIpAddress = value.nextHopIpAddress;
//                 }
                
//                 return result;
//             })
//         }
//     };
// }

exports.transform = function ({settings, buildingBlockSettings}) {
    if (_.isPlainObject(settings)) {
        settings = [settings];
    }

    let results = _.transform(settings, (result, setting, index) => {
        //let merged = v.mergeAndValidate(setting, routeTableSettingsDefaults, routeTableSettingsValidations);
        let merged = v.merge(setting, networkSecurityGroupSettingsDefaults);
        let errors = v.validate(merged, networkSecurityGroupSettingsValidations);
        if (errors.length > 0) {
          throw new Error(JSON.stringify(errors));
        }

        if (merged.validationErrors) {
            _.each(merged.validationErrors, (error) => {
                error.name = `settings[${index}]${error.name}`;
            });
        }

        result.push(merged);
    }, []);

    buildingBlockErrors = v.validate(buildingBlockSettings, {
        subscriptionId: v.validationUtilities.isNullOrWhitespace,
        resourceGroupName: v.validationUtilities.isNullOrWhitespace,
    }, buildingBlockSettings);

    if (buildingBlockErrors.length > 0) {
        throw new Error(JSON.stringify(buildingBlockErrors));
    }

    if (buildingBlockSettings.validationErrors) {
        _.each(buildingBlockSettings.validationErrors, (error) => {
            error.name = `buildingBlockSettings${error.name}`;
        });
    }

    if (_.some(results, 'validationErrors') || (buildingBlockSettings.validationErrors)) {
        results.push(buildingBlockSettings);
        return {
            validationErrors: _.transform(_.compact(results), (result, value) => {
                if (value.validationErrors) {
                    result.validationErrors.push(value.validationErrors);
                }
            }, { validationErrors: [] })
        };
    }

    results = _.transform(results, (result, setting) => {
        setting = r.setupResources(setting, buildingBlockSettings, (parentKey) => {
            return ((parentKey === null) || (parentKey === "virtualNetworks"));
        });
        setting = transform(setting);
        result.push(setting);
    }, []);

    return { settings: results };
};