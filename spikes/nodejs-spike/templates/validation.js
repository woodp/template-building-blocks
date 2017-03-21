let _ = require('../lodashMixins.js');
let validationMessages = require('./ValidationMessages.js');

function mergeAndValidate(settings, defaultSettings, validations, mergeCustomizer) {

    settings = (mergeCustomizer ? _.mergeWith({}, defaultSettings, settings, mergeCustomizer) : _.merge({}, defaultSettings, settings));
    let validationErrors = reduce(validations, settings, '', null, []);

    if (validationErrors.length > 0) {
        return {
            validationErrors: validationErrors
        };
    } else {
        // return {
        //     settings: settings
        // };
        return settings;
    }
}

function reduce(validations, value, parentKey, parentValue, accumulator) {
    if (_.isNil(value)) {
        accumulator.push({
            name: parentKey,
            message: validationMessages.ValueCannotBeNull
        });
    } else if (_.isPlainObject(validations)) {
        // We are working with a validation OBJECT, so we need to iterate the keys
        if (_.isArray(value)) {
            // We need to iterate and recurse
            _.reduce(value, (accumulator, item, index) => {
                reduce(validations, item, `${parentKey}[${index}]`, parentValue, accumulator);
                return accumulator;
            }, accumulator);
        } else {
            // Iterate the validations
            _.reduce(validations, (accumulator, validation, key) => {
                reduce(validation, value[key], `${parentKey}.${key}`, value, accumulator);
                return accumulator;
            }, accumulator);
        }
    } else if (_.isFunction(validations)) {
        // If the value is an array, reduce, then call validation inside
        // Otherwise, just call the validation
        if (_.isArray(value)) {
            _.reduce(value, (accumulator, item, index) => {
                validations(accumulator, `${parentKey}[${index}]`, '', item, parentValue);
                return accumulator;
            }, accumulator);
        } else {
            // We're just a value
            validations(accumulator, `${parentKey}`, '', value, parentValue);
        }
    }

    return accumulator;
}

let cidrRegex = /^(?:([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.)(?:([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.)(?:([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.)([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(?:\/([0-9]|[1-2][0-9]|3[0-2]))$/;
let ipAddressRegex = /^(?:([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.)(?:([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.)(?:([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.)(?:[0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/;


let utilities = {
    resourceId: function(subscriptionId, resourceGroupName, resourceType, resourceName, subresourceName) {
        if (_.isNullOrWhitespace(subscriptionId)) {
            throw `subscriptionId: ${validationMessages.StringCannotBeNullUndefinedEmptyOrOnlyWhitespace}`;
        }

        if (_.isNullOrWhitespace(resourceGroupName)) {
            throw `resourceGroupName: ${validationMessages.StringCannotBeNullUndefinedEmptyOrOnlyWhitespace}`;
        }

        if (_.isNullOrWhitespace(resourceType)) {
            throw `resourceType: ${validationMessages.StringCannotBeNullUndefinedEmptyOrOnlyWhitespace}`;
        }

        let resourceTypeParts = _.split(_.trimEnd(resourceType, '/'), '/');
        if ((resourceTypeParts.length < 2) || (resourceTypeParts.length > 3)) {
            throw `resourceType: Invalid length ${resourceTypeParts.length}`;
        }

        if ((resourceTypeParts.length === 2) && (_.isNullOrWhitespace(resourceName))) {
            throw `resourceName: ${validationMessages.StringCannotBeNullUndefinedEmptyOrOnlyWhitespace}`;
        }

        if ((resourceTypeParts.length === 3) && (_.isNullOrWhitespace(subresourceName))) {
            throw `subresourceName: ${validationMessages.StringCannotBeNullUndefinedEmptyOrOnlyWhitespace}`;
        }

        let resourceId = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/${resourceTypeParts[0]}/${resourceTypeParts[1]}/${resourceName}`;
        if (resourceTypeParts.length === 3) {
            resourceId = `${resourceId}/${resourceTypeParts[2]}/${subresourceName}`;
        }

        return resourceId;
    },
    // resourceId: function () {
    //     // This is using arguments because we want this to behave like the template function
    //     let count = _.reduce(arguments, (accumulator, item, index) => {
    //         if (item.indexOf('/') >= 0) {
    //             accumulator++;
    //         }

    //         return accumulator;
    //     }, 0);

    //     if (count > 1) {
    //         throw "Too many /";
    //     }

    //     let resourceTypeParameterIndex = _.findIndex(arguments, (value) => {
    //         return value.indexOf('/') >= 0;
    //     });

    //     if (resourceTypeParameterIndex > 2) {
    //         throw "InvalidTemplateResourceIdFunctionResourceTypeIndexPosition";
    //     }

    //     let resourceTypeParameterValue = _.trimEnd(arguments[resourceTypeParameterIndex], '/');
    //     let resourceNameParameterValue = _.join(_.takeRight(arguments, arguments.length - (resourceTypeParameterIndex + 1)), '/');
    //     if (arguments.length !== resourceTypeParameterIndex + _.split(resourceNameParameterValue, '/').length) {
    //         throw `InvalidTemplateResourceIdFunctionResourceNameSegmentsCount: ${resourceTypeParameterValue}: ${_.split(resourceTypeParameterValue, '/').length - 1}`;
    //     }

    //     let resourceGroupId = utilities.getResourceGroupId(arguments, resourceTypeParameterIndex);
    // },
    // getResourceGroupId: function (parameterValues, resourceTypeParameterIndex) {
    //     if (resourceTypeParameterIndex < 2) {
    //         return resourceTypeParameterIndex === 0 ?

    //     }
    // },
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
    }
};

exports.utilities = utilities;
exports.validationUtilities = validationUtilities;
exports.mergeAndValidate = mergeAndValidate;
exports.reduce = reduce;