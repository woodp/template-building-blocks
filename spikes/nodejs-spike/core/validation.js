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

function validate(settings, validations, baseObjectSettings) { 
    return reduce(validations, settings, '', null, baseObjectSettings, []);
}

function reduce(validations, value, parentKey, parentValue, baseObjectSettings, accumulator) {
    if (_.isNil(value)) {
        accumulator.push({
            name: parentKey,
            message: validationMessages.ValueCannotBeNull
        });
    } else if (_.isPlainObject(validations)) {
        // We are working with a validation OBJECT, so we need to iterate the keys
        if (_.isArray(value)) {
            // The value is an array, so we need to iterate it and then reduce
            _.reduce(value, (accumulator, item, index) => {
                reduce(validations, item, `${parentKey}[${index}]`, parentValue, baseObjectSettings, accumulator);
                return accumulator;
            }, accumulator);
        } else {
            // The value is a plain object, so iterate the validations and run them against value[key]
            _.reduce(validations, (accumulator, validation, key) => {
                reduce(validation, value[key], `${parentKey}.${key}`, value, baseObjectSettings, accumulator);
                return accumulator;
            }, accumulator);
        }
    } else if (_.isFunction(validations)) {
        // If the value is an array, reduce, then call validation inside
        // Otherwise, just call the validation
        if (_.isArray(value)) {
            _.reduce(value, (accumulator, item, index) => {
                validations(accumulator, `${parentKey}[${index}]`, index, item, parentValue, baseObjectSettings);
                return accumulator;
            }, accumulator);
        } else {
            // We're just a value
            validations(accumulator, `${parentKey}`, '', value, parentValue, baseObjectSettings);
        }
    }

    return accumulator;
}

let cidrRegex = /^(?:([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.)(?:([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.)(?:([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.)([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(?:\/([0-9]|[1-2][0-9]|3[0-2]))$/;
let ipAddressRegex = /^(?:([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.)(?:([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.)(?:([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.)(?:[0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/;

let guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

let utilities = {
    nameOf: varObj => Object.keys(varObj)[0],
    isGuid: (guid) => guidRegex.test(guid),
    networking: {
        isValidIpAddress: function (value) {
            return ipAddressRegex.test(value);
        },
        isValidCidr: function (value) {
            return cidrRegex.test(value);
        }
    }
};

let validationUtilities = {
    isNullOrWhitespace: function (result, parentKey, key, value, parent) {
        let retVal = !_.isNullOrWhitespace(value);
        if (!retVal) {
            result.push(_.join((parentKey ? [parentKey, key] : [key]), '.'));
        }

        return retVal;
    },
    networking: {
        isValidCidr: function (result, parentKey, key, value, parent) {
            if (!utilities.networking.isValidCidr(value)) {
                result.push({
                    name: _.join((parentKey ? [parentKey, key] : [key]), '.'),
                    message: validationMessages.InvalidCidr
                })
            }
        }
    },
    isNumber: function (result, parentKey, key, value, parent) {
        let retVal = _.isNumber(value);
        if (!retVal) {
            result.push(_.join((parentKey ? [parentKey, key] : [key]), '.'));
        }

        return retVal;
    },
    isBoolean: function (result, parentKey, key, value, parent) {
        let retVal = _.isBoolean(value);
        if (!retVal) {
            result.push(_.join((parentKey ? [parentKey, key] : [key]), '.'));
        }

        return retVal;
    }
};

exports.utilities = utilities;
exports.validationUtilities = validationUtilities;
exports.merge = merge;
exports.validate = validate;
exports.reduce = reduce;