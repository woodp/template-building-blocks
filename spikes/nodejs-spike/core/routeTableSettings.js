let _ = require('../lodashMixins.js');
let v = require('./validation.js');
let r = require('./resources.js');

let validationMessages = require('./validationMessages.js');

let routeTableSettingsDefaults = {
    virtualNetworks: [],
    routes: []
};

let validNextHopTypes = ['VirtualNetworkGateway', 'VnetLocal', 'Internet', 'HyperNetGateway', 'None', 'VirtualAppliance'];

let isValidNextHopType = (nextHopType) => {
    return v.utilities.isStringInArray(nextHopType, validNextHopTypes);
};

let routeValidations = {
    name: v.utilities.isNotNullOrWhitespace,
    addressPrefix: v.utilities.networking.isValidCidr,
    nextHopType: (value, parent) => {
        return {
            result: isValidNextHopType(value),
            message: `Valid values are ${validNextHopTypes.join(',')}`
        };
    },
    nextHopIpAddress: (value, parent) => {
        return (parent.nextHopType !== 'VirtualAppliance') || ((parent.nextHopType === 'VirtualAppliance') && (v.utilities.networking.isValidIpAddress(value)));
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

let routeTableSettingsValidations = {
    name: v.utilities.isNotNullOrWhitespace,
    //routes: routeValidations,
    routes: (value, parent) => {
        if ((_.isNil(value)) || (value.length === 0)) {
            return {
                result: false,
                message: 'Value cannot be null, undefined, or an empty array'
            };
        }

        // Validate route names
        let names = _.reduce(value, (accumulator, value, index, collection) => {
            if (v.utilities.isNotNullOrWhitespace(value.name)) {
                if (!accumulator[value.name]) {
                    accumulator[value.name] = 0;
                }
                accumulator[value.name] = accumulator[value.name] + 1;
            }

            return accumulator;
        }, {});

        let duplicates = _.reduce(names, (accumulator, value, key, collection) => {
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
    }
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
        let errors = v.validate({
            settings: merged,
            validations: routeTableSettingsValidations
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
            return ((parentKey === null) || (parentKey === "virtualNetworks"));
        });
        setting = transform(setting);
        result.push(setting);
    }, []);

    return { settings: results };
};