let _ = require('../lodashMixins.js');
let v = require('./validation.js');
let r = require('./resources.js');

let validationMessages = require('./validationMessages.js');

let routeTableSettingsDefaults = {
    routes: []
};

let validNextHopTypes = ['VirtualNetworkGateway', 'VnetLocal', 'Internet', 'HyperNetGateway', 'None', 'VirtualAppliance'];

let isValidNextHopType = (nextHopType) => {
    return v.utilities.isStringInArray(nextHopType, validNextHopTypes);
};

let validate = (settings) => {
    // Validate each setting
    let errors = v.validate({
        settings: settings,
        validations: routeTableSettingsValidations
    });

    // Validate route names
    let names = _.reduce(settings.routes, (accumulator, value, index, collection) => {
        if (!accumulator[value.name]) {
            accumulator[value.name] = 0;
        }
        accumulator[value.name] = accumulator[value.name] + 1;
        return accumulator;
    }, {});

    let duplicates = _.reduce(names, (accumulator, value, key, collection) => {
        if (value > 1) {
            accumulator.push(key);
        }

        return accumulator;
    }, []);

    if (duplicates.length > 0) {
        errors.push({
            name: '.routes',
            message: `Duplicate route names: ${duplicates.join(',')}`
        });
    }

    return errors;
}

let routeTableSettingsValidations = {
    name: v.utilities.isNotNullOrWhitespace,
    routes: {
        name: v.utilities.isNotNullOrWhitespace,
        addressPrefix: v.utilities.networking.isValidCidr,
        nextHopType: (value, parent) => {
            return {
                result: isValidNextHopType(value),
                message: `Valid values are ${validNextHopTypes.join(',')}`
            };
            // if (!isValidNextHopType(value)) {
            //     result.push({
            //         name: _.join((parentKey ? [parentKey, key] : [key]), '.'),
            //         message: validationMessages.routeTable.routes.InvalidNextHopType
            //     });
            // }
        },
        nextHopIpAddress: (value, parent) => {
            return (parent.nextHopType !== 'VirtualAppliance') || ((parent.nextHopType === 'VirtualAppliance') && (v.utilities.networking.isValidIpAddress(value)));
        }
    }
    // name: v.validationUtilities.isNullOrWhitespace,
    // routes: {
    //     name: v.validationUtilities.isNullOrWhitespace,
    //     addressPrefix: v.validationUtilities.networking.isValidCidr,
    //     nextHopType: (result, parentKey, key, value, parent) => {
    //         if (!isValidNextHopType(value)) {
    //             result.push({
    //                 name: _.join((parentKey ? [parentKey, key] : [key]), '.'),
    //                 message: validationMessages.routeTable.routes.InvalidNextHopType
    //             });
    //         }
    //     },
    //     nextHopIpAddress: (result, parentKey, key, value, parent) => {
    //         if ((parent.nextHopType === 'VirtualAppliance') && (!v.utilities.networking.isValidIpAddress(value))) {
    //             result.push({
    //                 name: _.join((parentKey ? [parentKey, 'nextHopIpAddress'] : ['nextHopIpAddress']), '.'),
    //                 message: validationMessages.InvalidIpAddress
    //             });
    //         }
    //     }
    // }
};

function transform(settings) {
    return {
        name: settings.name,
        id: r.resourceId(settings.subscriptionId, settings.resourceGroupName, 'Microsoft.Network/routeTables', settings.name),
        resourceGroupName: settings.resourceGroupName,
        subscriptionId: settings.subscriptionId,
        subnets: _.transform(settings.virtualNetworks, (result, virtualNetwork) => {
            _.each(virtualNetwork.subnets, (subnet) => {
                result.push(r.resourceId(virtualNetwork.subscriptionId, virtualNetwork.resourceGroupName, 'Microsoft.Network/virtualNetworks/subnets',
                    virtualNetwork.name, subnet));
            })
        }, []),
        properties: {
            routes: _.map(settings.routes, (value, index) => {
                let result = {
                    name: value.name,
                    properties: {
                        addressPrefix: value.addressPrefix,
                        nextHopType: value.nextHopType
                    }
                };

                if (value.nextHopIpAddress) {
                    result.properties.nextHopIpAddress = value.nextHopIpAddress;
                }
                
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
        let merged = v.merge(setting, routeTableSettingsDefaults);
        let errors = validate(merged);
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

    // if (buildingBlockSettings.validationErrors) {
    //     _.each(buildingBlockSettings.validationErrors, (error) => {
    //         error.name = `buildingBlockSettings${error.name}`;
    //     });
    // }

    // if (_.some(results, 'validationErrors') || (buildingBlockSettings.validationErrors)) {
    //     results.push(buildingBlockSettings);
    //     return {
    //         validationErrors: _.transform(_.compact(results), (result, value) => {
    //             if (value.validationErrors) {
    //                 result.validationErrors.push(value.validationErrors);
    //             }
    //         }, { validationErrors: [] })
    //     };
    // }

    results = _.transform(results, (result, setting) => {
        setting = r.setupResources(setting, buildingBlockSettings, (parentKey) => {
            return ((parentKey === null) || (parentKey === "virtualNetworks"));
        });
        setting = transform(setting);
        result.push(setting);
    }, []);

    return { settings: results };
};