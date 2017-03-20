let _ = require('../lodashMixins.js');
//import * as validationMessages from '../ValidationMessages';
let v = require('./validation.js');
let validationMessages = require('./ValidationMessages.js');

exports.routeTableSettingsDefaults = {
    routes: []
};

function isNullOrWhitespace(result, parentKey, key, value, parent) {
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

function validateCidr(result, parentKey, key, value, parent) {
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

// function reduce(validations, value, parentKey, accumulator) {
//     if (_.isNil(value)) {
//         accumulator.push({
//             name: parentKey,
//             message: validationMessages.ValueCannotBeNull
//         });
//     } else if ((_.isArray(value)) && (value.length > 0)) {
//         // This has to handle both individual values, as well as objects, so we'll do that here.
//         if (_.isPlainObject(value[0])) {
//             // This is a plain object, so we need to do two reduces
//             _.reduce(value, (accumulator, item, index) => {
//                 _.reduce(validations, (accumulator, validation, key) => {
//                     validation(accumulator, `${parentKey}[${index}]`, key, item[key], item);
//                     return accumulator;
//                 }, accumulator);
//                 return accumulator;
//             }, accumulator);
//         } else {
//             _.reduce(validations, (accumulator, validation, index) => {
//                     validation(accumulator, `${parentKey}[${index}]`, '', value[index], value);
//                     return accumulator;
//                 }, accumulator);
//         }
//     } else {
//         _.reduce(validations, (accumulator, validation, key) => {
//                 validation(accumulator, `${parentKey}`, key, value[key], value);
//                 return accumulator;
//             }, accumulator);
//     }

//     return accumulator;
// }

exports.routeTableValidations = {
    name: isNullOrWhitespace,
    routes: (result, parentKey, key, value, parent) => {
        let validations = {
            name: isNullOrWhitespace,
            addressPrefix: validateCidr,
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
                            } else if (!isValidIpAddress(parent.nextHopIpAddress)) {
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


exports.validateRequiredSettings2 = function (settings) {
    

    settings = _.merge({}, defaults, settings);

    let missingFields = _.reduce(routeTableValidations, function(result, validation, key) {
        validation(result, '', key, settings[key], settings);
        return result;
    }, []);

    let missingFields2 = reduce(routeTableValidations, settings, '', []);

    if (_.isEqual(missingFields, missingFields2)) {
        console.log("SAME!");
    }

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

exports.validateRequiredSettings = function (settings) {
    let validations = {
        name: isNullOrWhitespace,
        routes: (result, parentKey, key, value, parent) => {
            let validations = {
                name: isNullOrWhitespace,
                addressPrefix: validateCidr,
                nextHopType: (result, parentKey, key, value, parent) => {
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
                                if (parent.hasOwnProperty('nextHopIpAddress')) {
                                    //result.push(_.join((parentKey ? [parentKey, 'nextHopIpAddress'] : ['nextHopIpAddress']), '.'));
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
                                } else if (!isValidIpAddress(parent.nextHopIpAddress)) {
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

            reduceArray(validations, value, 'routes', result);
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