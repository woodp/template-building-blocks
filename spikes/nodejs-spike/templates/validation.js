let _ = require('../lodashMixins.js');
let validationMessages = require('./ValidationMessages.js');

exports.mergeAndValidate = function (settings, defaultSettings, validations) {
    settings = _.merge({}, defaultSettings, settings);
    // let missingFields = _.reduce(validations, function(result, validation, key) {
    //     validation(result, '', key, settings[key], settings);
    //     return result;
    // }, []);
    let missingFields = reduce(validations, settings, '', null, []);

    if (missingFields.length > 0) {
        return {
            missingFields: missingFields
        };
    } else {
        return {
            settings: settings
        };
    }
}

exports.reduce = reduce;

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
    // else if ((_.isArray(value)) && (value.length > 0)) {
    //     // This has to handle both individual values, as well as objects, so we'll do that here.
    //     if (_.isPlainObject(value[0])) {
    //         // This is a plain object, so we need to do two reduces
    //         _.reduce(value, (accumulator, item, index) => {
    //             _.reduce(validations, (accumulator, validation, key) => {
    //                 validation(accumulator, `${parentKey}[${index}]`, key, item[key], item);
    //                 return accumulator;
    //             }, accumulator);
    //             return accumulator;
    //         }, accumulator);
    //     } else {
    //         _.reduce(validations, (accumulator, validation, index) => {
    //                 validation(accumulator, `${parentKey}[${index}]`, '', value[index], value);
    //                 return accumulator;
    //             }, accumulator);
    //     }
    // } else {
    //     _.reduce(validations, (accumulator, validation, key) => {
    //             validation(accumulator, `${parentKey}`, key, value[key], value);
    //             return accumulator;
    //         }, accumulator);
    // }

    return accumulator;
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