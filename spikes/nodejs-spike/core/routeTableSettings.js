'use strict';

let _ = require('lodash');
let v = require('./validation.js');
let r = require('./resources.js');

let routeTableSettingsDefaults = {
    virtualNetworks: [],
    routes: [],
    tags: {}
};

let validNextHopTypes = ['VirtualNetworkGateway', 'VnetLocal', 'Internet', 'HyperNetGateway', 'None', 'VirtualAppliance'];

let isValidNextHopType = (nextHopType) => {
    return v.utilities.isStringInArray(nextHopType, validNextHopTypes);
};

let routeValidations = {
    name: v.validationUtilities.isNotNullOrWhitespace,
    addressPrefix: v.validationUtilities.isValidCidr,
    nextHopType: (value) => {
        return {
            result: isValidNextHopType(value),
            message: `Valid values are ${validNextHopTypes.join(',')}`
        };
    },
    nextHopIpAddress: (value, parent) => {
        let result = {
            result: true
        };

        if (parent.nextHopType === 'VirtualAppliance') {
            result = {
                validations: v.validationUtilities.isValidIpAddress
            };
        }
        
        return result;
    }
};

let virtualNetworkValidations = {
    name: v.validationUtilities.isNotNullOrWhitespace,
    subnets: (value) => {
        if ((_.isNil(value)) || (value.length === 0)) {
            return {
                result: false,
                message: 'Value cannot be null, undefined, or an empty array'
            };
        } else {
            return {
                validations: v.validationUtilities.isNotNullOrWhitespace
            };
        }
    }
};

let routeTableSettingsValidations = {
    name: v.validationUtilities.isNotNullOrWhitespace,
    tags: v.tagsValidations,
    routes: (value) => {
        if ((_.isNil(value)) || (value.length === 0)) {
            return {
                result: false,
                message: 'Value cannot be null, undefined, or an empty array'
            };
        }

        // Validate route names
        let names = _.reduce(value, (accumulator, value) => {
            if (!v.utilities.isNullOrWhitespace(value.name)) {
                if (!accumulator[value.name]) {
                    accumulator[value.name] = 0;
                }
                accumulator[value.name] = accumulator[value.name] + 1;
            }

            return accumulator;
        }, {});

        let duplicates = _.reduce(names, (accumulator, value, key) => {
            if (value > 1) {
                accumulator.push(key);
            }

            return accumulator;
        }, []);

        if (duplicates.length > 0) {
            return {
                result: false,
                message: `Duplicate route names: ${duplicates.join(',')}`
            };
        }

        return {
            validations: routeValidations
        };
    },
    virtualNetworks: (value) => {
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
    }
};

let mergeCustomizer = function (objValue, srcValue, key) {
    if (v.utilities.isStringInArray(key, ['routes', 'virtualNetworks'])) {
        if ((!_.isNil(srcValue)) && (_.isArray(srcValue))) {
            return srcValue;
        } else {
            return objValue;
        }
    }
};

function transform(settings) {
    let result = {
        name: settings.name,
        id: r.resourceId(settings.subscriptionId, settings.resourceGroupName, 'Microsoft.Network/routeTables', settings.name),
        resourceGroupName: settings.resourceGroupName,
        subscriptionId: settings.subscriptionId,
        // subnets: _.transform(settings.virtualNetworks, (result, virtualNetwork) => {
        //     _.each(virtualNetwork.subnets, (subnet) => {
        //         result.push(r.resourceId(virtualNetwork.subscriptionId, virtualNetwork.resourceGroupName, 'Microsoft.Network/virtualNetworks/subnets',
        //             virtualNetwork.name, subnet));
        //     });
        // }, []),
        properties: {
            routes: _.map(settings.routes, (value) => {
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

    if (settings.tags) {
        result.tags = settings.tags;
    }

    return result;
}

let merge = ({settings, buildingBlockSettings, defaultSettings = routeTableSettingsDefaults}) => {
    let merged = r.setupResources(settings, buildingBlockSettings, (parentKey) => {
        return ((parentKey === null) || (parentKey === 'virtualNetworks'));
    });

    merged = v.merge(merged, defaultSettings, mergeCustomizer);
    return merged;
};

exports.transform = function ({ settings, buildingBlockSettings }) {
    if (_.isPlainObject(settings)) {
        settings = [settings];
    }

    let buildingBlockErrors = v.validate({
        settings: buildingBlockSettings,
        validations: {
            subscriptionId: v.validationUtilities.isGuid,
            resourceGroupName: v.validationUtilities.isNotNullOrWhitespace,
        }
    });

    if (buildingBlockErrors.length > 0) {
        throw new Error(JSON.stringify(buildingBlockErrors));
    }

    let results = merge({
        settings: settings,
        buildingBlockSettings: buildingBlockSettings
    });

    let errors = v.validate({
        settings: results,
        validations: routeTableSettingsValidations
    });

    if (errors.length > 0) {
        throw new Error(JSON.stringify(errors));
    }

    results = _.transform(results, (result, setting) => {
        result.routeTables.push(transform(setting));
        if ((setting.virtualNetworks) && (setting.virtualNetworks.length > 0)) {
            result.subnets = result.subnets.concat(_.transform(setting.virtualNetworks, (result, virtualNetwork) =>
            {
                _.each(virtualNetwork.subnets, (subnet) => {
                    result.push({
                        id: r.resourceId(virtualNetwork.subscriptionId, virtualNetwork.resourceGroupName, 'Microsoft.Network/virtualNetworks/subnets',
                            virtualNetwork.name, subnet),
                        properties: {
                            routeTable: {
                                id: r.resourceId(setting.subscriptionId, setting.resourceGroupName, 'Microsoft.Network/routeTables', setting.name),
                            }
                        }
                    });
                });
            }, []));
        }
    }, {
        routeTables: [],
        subnets: []
    });

    return results;
};