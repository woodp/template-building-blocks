let _ = require('../lodashMixins.js');
//import * as validationMessages from '../ValidationMessages';
let v = require('./validation.js');
let validationMessages = require('./ValidationMessages.js');

exports.routeTableSettingsDefaults = {
    routes: []
};

// function isNullOrWhitespace(result, parentKey, key, value, parent) {
//     let retVal = !_.isNullOrWhitespace(value);
//     if (!retVal) {
//         //result.concat(_.join([parentKey, key], '.'));
//         result.push(_.join((parentKey ? [parentKey, key] : [key]), '.'));
//     }

//     return retVal;
// };

// let cidrRegex = /^(?:([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.)(?:([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.)(?:([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.)([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(?:\/([0-9]|[1-2][0-9]|3[0-2]))$/;
// function isValidCidr(value) {
//     return cidrRegex.test(value);
// }

// function validateCidr(result, parentKey, key, value, parent) {
//     if (!isValidCidr(value)) {
//         result.push({
//             name: _.join((parentKey ? [parentKey, key] : [key]), '.'),
//             message: validationMessages.InvalidCidr
//         })
//     }
// }

// let ipAddressRegex = /^(?:([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.)(?:([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.)(?:([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.)(?:[0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/;

// function isValidIpAddress(value) {
//     return ipAddressRegex.test(value);
// }

exports.transform = function (settings) {
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

exports.routeTableValidations = {
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