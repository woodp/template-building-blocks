let _ = require('../lodashMixins.js');
//import * as validationMessages from '../ValidationMessages';
let validationMessages = require('./ValidationMessages.js');

let defaults = {
    routes: []
};

function isNullOrWhitespace(result, parentKey, key, value) {
    let retVal = !_.isNullOrWhitespace(value);
    if (!retVal) {
        //result.concat(_.join([parentKey, key], '.'));
        result.push(_.join((parentKey ? [parentKey, key] : [key]), '.'));
    }

    return retVal;
};

let cidrRegex = /^(?:([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.)(?:([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.)(?:([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.)([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(?:\/([0-9]|[1-2][0-9]|3[0-2]))$/;
function isValidCidr(value) {
    return cidrRegex.test(value);
}

function validateCidr(result, parentKey, key, value) {
    if (!isValidCidr(value)) {
        result.push({
            name: _.join((parentKey ? [parentKey, key] : [key]), '.'),
            message: validationMessages.InvalidCidr
        })
    }
}

let ipAddressRegex = /^(?:([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.)(?:([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.)(?:([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.)(?:[0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/;

function isValidIpAddress(value) {
    return ipAddressRegex.test(value);
}

// function validateIpAddress(result, parentKey, key, value) {
//     if (!isValidCidr(value)) {
//         result.push({
//             name: _.join((parentKey ? [parentKey, key] : [key]), '.'),
//             message: validationMessages.InvalidIpAddress
//         })
//     }
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

function reduceArray(array, validations, parentKey, accumulator) {
    if (_.isNil(array)) {
        accumulator.push({
            name: parentKey,
            message: validationMessages.ArrayCannotBeNull
        });
    } else {
        _.reduce(array, (accumulator, item, index, array) => {
            _.reduce(validations, (accumulator, validation, key) => {
                validation(accumulator, `${parentKey}[${index}]`, key, item[key], item);
                return accumulator;
            }, accumulator);
            return accumulator;
        }, accumulator);
    }
}

exports.validateRequiredSettings = function (settings) {
    let validations = {
        name: isNullOrWhitespace,
        routes: (result, parentKey, key, value, parent) => {
            let validations = {
                name: isNullOrWhitespace,
                addressPrefix: validateCidr,
                nextHopType: (result, parentKey, key, value, route) => {
                    if (_.isNullOrWhitespace(value)) {
                        result.push({
                            name: _.join((parentKey ? [parentKey, key] : [key]), '.'),
                            message: validationMessages.StringCannotBeNullUndefinedEmptyOrOnlyWhitespace
                        });
                    } else {
                        switch (value) {
                            case 'VirtualNetworkGateway':
                            case 'VnetLocal':
                            case 'Internet':
                            case 'HyperNetGateway':
                            case 'None':
                                if (route.hasOwnProperty('nextHopIpAddress')) {
                                    //result.push(_.join((parentKey ? [parentKey, 'nextHopIpAddress'] : ['nextHopIpAddress']), '.'));
                                    result.push({
                                        name: _.join((parentKey ? [parentKey, 'nextHopIpAddress'] : ['nextHopIpAddress']), '.'),
                                        message: validationMessages.routeTable.routes.NextHopIpAddressCannotBePresent
                                    });
                                }
                                break;
                            case 'VirtualAppliance':
                                if (_.isNullOrWhitespace(route.nextHopIpAddress)) {
                                    result.push({
                                        name: _.join((parentKey ? [parentKey, 'nextHopIpAddress'] : ['nextHopIpAddress']), '.'),
                                        message: validationMessages.routeTable.routes.NextHopIpAddressMustBePresent
                                    });
                                } else if (!isValidIpAddress(route.nextHopIpAddress)) {
                                    result.push({
                                        name: _.join((parentKey ? [parentKey, 'nextHopIpAddress'] : ['nextHopIpAddress']), '.'),
                                        message: validationMessages.InvalidIpAddress
                                    });
                                }
                                break;
                            default:
                                //result.push(_.join((parentKey ? [parentKey, key] : [key]), '.'));
                                result.push({
                                    name: _.join((parentKey ? [parentKey, key] : [key]), '.'),
                                    message: validationMessages.routeTable.routes.InvalidNextHopType
                                })
                                break;
                        }
                    }
                }
            }

            reduceArray(value, validations, 'routes', result);
            // if (_.isNil(value)) {
            //     result.push(key);
            // } else {
            //     _.reduce(value, (result, route, index) => {
            //         _.reduce(validations, (result, validation, key) => {
            //             validation(result, `routes[${index}]`, key, route[key], route);
            //             return result;
            //         }, result);
            //         return result;
            //     }, result);
            // }
        }
    };

    settings = _.merge({}, defaults, settings);
    // if (_.isNil(settings)) {
    //     throw new Error('settings cannot be null or undefined');
    // }

    let missingFields = _.reduce(validations, function(result, validation, key) {
        validation(result, '', key, settings[key], settings);
        return result;
    }, []);

    // if (missingFields.length > 0) {
    //     throw new Error('Missing fields: ' + _.join(missingFields, ','));
    // }

    //return settings;
    if (missingFields.length > 0) {
        return {
            missingFields: missingFields
        };
    } else {
        return {
            settings: settings
        };
    }
};