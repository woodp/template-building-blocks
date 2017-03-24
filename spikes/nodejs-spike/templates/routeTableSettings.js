let _ = require('../lodashMixins.js');
let v = require('./validation.js');
let r = require('./resources.js');

let validationMessages = require('./ValidationMessages.js');

let routeTableSettingsDefaults = {
    routes: []
};

let routeTableSettingsValidations = {
    name: v.validationUtilities.isNullOrWhitespace,
    routes: (result, parentKey, key, value, parent) => {
        let validations = {
            name: v.validationUtilities.isNullOrWhitespace,
            addressPrefix: v.validationUtilities.networking.validateCidr,
            nextHopType: (result, parentKey, key, value, parent) => {
                if (_.isNullOrWhitespace(value)) {
                    result.push({
                        name: _.join((parentKey ? [parentKey, key] : [key]), '.'),
                        message: validationMessages.StringCannotBeNullUndefinedEmptyOrOnlyWhitespace
                    });
                } else {
                    // Go ahead and calculate this so we don't have to put it everywhere
                    parentKey = _.join(_.initial(_.split(parentKey, '.')), '.');
                    switch (value) {
                        case 'VirtualNetworkGateway':
                        case 'VnetLocal':
                        case 'Internet':
                        case 'HyperNetGateway':
                        case 'None':
                            if (parent.hasOwnProperty('nextHopIpAddress')) {
                                result.push({
                                    name: _.join((parentKey ? [parentKey, 'nextHopIpAddress'] : ['nextHopIpAddress']), '.'),
                                    message: validationMessages.routeTable.routes.NextHopIpAddressCannotBePresent
                                });
                            }
                            break;
                        case 'VirtualAppliance':
                            if (_.isNullOrWhitespace(parent.nextHopIpAddress)) {
                                result.push({
                                    name: _.join((parentKey ? [parentKey, 'nextHopIpAddress'] : ['nextHopIpAddress']), '.'),
                                    message: validationMessages.routeTable.routes.NextHopIpAddressMustBePresent
                                });
                            } else if (!v.utilities.networking.isValidIpAddress(parent.nextHopIpAddress)) {
                                result.push({
                                    name: _.join((parentKey ? [parentKey, 'nextHopIpAddress'] : ['nextHopIpAddress']), '.'),
                                    message: validationMessages.InvalidIpAddress
                                });
                            }
                            break;
                        default:
                            result.push({
                                name: _.join((parentKey ? [parentKey, 'nextHopType'] : ['nextHopType']), '.'),
                                message: validationMessages.routeTable.routes.InvalidNextHopType
                            })
                            break;
                    }
                }
            }
        }

        v.reduce(validations, value, parentKey, parent, result);
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
                    virtualNetwork.name, subnet.name));
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
        let merged = v.mergeAndValidate(setting, routeTableSettingsDefaults, routeTableSettingsValidations);
        if (merged.validationErrors) {
            _.each(merged.validationErrors, (error) => {
                error.name = `settings[${index}]${error.name}`;
            });
        }

        result.push(merged);
    }, []);

    buildingBlockSettings = v.mergeAndValidate(buildingBlockSettings, {}, {
        subscriptionId: v.validationUtilities.isNullOrWhitespace,
        resourceGroupName: v.validationUtilities.isNullOrWhitespace,
    });

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