let _ = require('../lodashMixins.js');
let validationMessages = require('./validationMessages.js');

function merge(settings, defaultSettings, mergeCustomizer, childResources) {

    let mergedSettings = (mergeCustomizer ? _.mergeWith({}, defaultSettings, settings, mergeCustomizer) : _.merge({}, defaultSettings, settings));
    if(_.isNil(childResources)) return mergedSettings;

    for(let key in childResources){
        mergedSettings[key] = childResources[key](mergedSettings[key], key);
    }
    return mergedSettings;
}

let toString = (value) => {
    return _.isUndefined(value) ? '<undefined>' : _.isNull(value) ? '<null>' : _.isString(value) ? `'${value}'` : _.toString(value);
};

function validate({settings, validations, parentKey = '', parentValue = null}) { 
    return reduce({
        validations: validations,
        value: settings,
        parentKey: parentKey,
        parentValue: parentValue,
        accumulator: []
    });
}

function reduce({validations, value, parentKey, parentValue, accumulator}) {
    if (_.isPlainObject(validations)) {
        // We are working with a validation OBJECT, so we need to iterate the keys
        if (_.isNil(value)) { 
            accumulator.push({ 
                name: `${parentKey}`,
                message: validationMessages.ValueCannotBeNull
            });
        } else if (_.isArray(value)) {
            // The value is an array, so we need to iterate it and then reduce
            _.reduce(value, (accumulator, item, index) => {
                reduce({
                    validations: validations,
                    value: item,
                    parentKey: `${parentKey}[${index}]`,
                    parentValue: parentValue,
                    accumulator: accumulator
                });
                return accumulator;
            }, accumulator);
        } else {
            // The value is a plain object, so iterate the validations and run them against value[key]
            _.reduce(validations, (accumulator, validation, key) => {
                reduce({
                    validations: validation,
                    value: value[key],
                    parentKey: `${parentKey}.${key}`,
                    parentValue: value,
                    accumulator: accumulator
                });
                return accumulator;
            }, accumulator);
        }
    } else if (_.isFunction(validations)) {
        // If the value is an array, reduce, then call validation inside
        // Otherwise, just call the validation
        if (_.isArray(value)) {
            _.reduce(value, (accumulator, item, index) => {
                let result = validationWrapper(validations, item, parentValue);
                // We can either get a boolean, an object with the error, or an array of objects with errors.
                // We may be able to wrap this later, but let's brute force it for now
                if ((_.isArray(result)) && (result.length > 0)) {
                    // An array of already materialized errors, so just add them.
                    _.forEach(result, (value) => {
                        accumulator.push(value);
                    });
                //} else if (((_.isBoolean(result)) && (!result)) || ((_.isBoolean(result.result)) && (!result.result))) {
                } else if ((_.isBoolean(result.result)) && (!result.result)) {
                    let {message, name} = result;
                    accumulator.push({
                        name: name ? name : `${parentKey}[${index}]`,
                        message: `Invalid value: ${toString(item)}.` + (message ? '  ' + message : '')
                    });
                } else if (result.validations) {
                    // We got back more validations to run
                    reduce({
                        validations: result.validations,
                        value: value,
                        parentKey: `${parentKey}[${index}]`,
                        parentValue: parentValue,
                        accumulator: accumulator
                    });
                }

                return accumulator;
            }, accumulator);
        } else {
            // We're just a value
            let result = validationWrapper(validations, value, parentValue);
            if (_.isArray(result)) {
                if (result.length > 0) {
                    // An array of already materialized errors, so just add them.
                    _.forEach(result, (value) => {
                        accumulator.push(value);
                    });
                }
            // } else if (((_.isBoolean(result)) && (!result)) || ((_.isBoolean(result.result)) && (!result.result))) {
            } else if ((_.isBoolean(result.result)) && (!result.result)) {
                let {message, name} = result;
                accumulator.push({
                    name: name ? name : `${parentKey}`,
                    message: `Invalid value: ${toString(value)}.` + (message ? '  ' + message : '')
                });
            } else if (result.validations) {
                // We got back more validations to run
                reduce({
                    validations: result.validations,
                    value: value,
                    parentKey: `${parentKey}`,
                    parentValue: parentValue,
                    accumulator: accumulator
                });
            }
        }
    }

    return accumulator;
}

let validationWrapper = (validation, value, parent) => {
    let r = validation(value, parent);
    // We need to check the result and mutate accordingly.
    // If the result is just a boolean, this was a true/false function, so we need to wrap the result in an object with a default message so we can destructure
    // If the result is an object, this is likely a user-defined function so it could return custom messages.
    if (_.isBoolean(r)) {
        return { result: r };
    } else {
        // Hopefully it's the right shape!
        return r;
    }
}
let cidrRegex = /^(?:([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.)(?:([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.)(?:([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.)([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(?:\/([0-9]|[1-2][0-9]|3[0-2]))$/;
let ipAddressRegex = /^(?:([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.)(?:([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.)(?:([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.)(?:[0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/;

let guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

let utilities = {
    nameOf: varObj => Object.keys(varObj)[0],
    isGuid: (guid) => guidRegex.test(guid),
    isStringInArray: (value, array) => _.indexOf(array, value) > -1,
    isNotNullOrWhitespace: (value) => !_.isNullOrWhitespace(value),
    networking: {
        isValidIpAddress: function (value) {
            return ipAddressRegex.test(value);
        },
        isValidCidr: function (value) {
            return cidrRegex.test(value);
        },
        isValidPortRange: value => {
            if (_.isFinite(value)) {
                // If value is a number, make sure it's in the proper range.
                return _.inRange(value, 1, 65536);
            } else if (value === '*') {
                return true;
            } else {
                let split = _.split(value, '-');
                if (split.length !== 2) {
                    return false;
                }

                var [low, high] = _.map(split, (value, index, collection) => {
                    return _.toNumber(value);
                });

                // Make sure it only has two parts
                if (_.isUndefined(low) || _.isUndefined(high) || !_.isFinite(low) || !_.isFinite(high)) {
                    return false;
                }

                // Make sure both numbers are in the valid range
                return _.inRange(low, 1, 65536) && _.inRange(high, 1, 65536);
            }
        }
    }
};

let validationUtilities = {
    isBoolean: (value, parent) => {
        return {
            result: _.isBoolean(value),
            message: 'Value must be Boolean'
        };
    }
};

exports.utilities = utilities;
exports.validationUtilities = validationUtilities;
exports.merge = merge;
exports.validate = validate;
exports.reduce = reduce;