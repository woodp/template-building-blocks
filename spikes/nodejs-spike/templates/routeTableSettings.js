let _ = require('../lodashMixins.js');
let v = require('./validation.js');
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

exports.transform = function (settings) {
    let result = v.mergeAndValidate(settings, routeTableSettingsDefaults, routeTableSettingsValidations);
    if (!result.validationErrors) {
        result = transform(result);
    }

    return result;
};