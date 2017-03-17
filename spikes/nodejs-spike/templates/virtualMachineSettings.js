


//var _ = require('lodash');
var _ = require('../lodashMixins.js');

// function validate(pathValidations, result, value, key) {
//     // Should we strip down the settings object to only be the fields we are checking?
//     let func = pathValidations[key];
//     if (validation && !func(value)) {
//         //result.push(key);
//         result.concat(key);
//     }

//     return result;
// }
function isNullOrWhitespace(result, parentKey, key, value) {
    let retVal = !_.isNullOrWhitespace(value);
    if (!retVal) {
        //result.concat(_.join([parentKey, key], '.'));
        result.push(_.join((parentKey ? [parentKey, key] : [key]), '.'));
    }

    return retVal;
};

exports.validateRequiredSettings = function (settings) {
    let pathValidations = {
        "namePrefix": isNullOrWhitespace,
        "computerNamePrefix": isNullOrWhitespace,
        "adminUsername": isNullOrWhitespace,
        "adminPassword": isNullOrWhitespace,
        "imageReference": function (result, parentKey, key, value) {
            let pathValidations = {
                "publisher": isNullOrWhitespace,
                "offer": isNullOrWhitespace,
                "sku": isNullOrWhitespace,
                "version": isNullOrWhitespace
            };

            if (_.isNil(value)) {
                // Return an array of the key and it's value names
                result.push(key);
                _.forEach(_.map(_.keys(pathValidations), k => { return key + '.' + k }), v => { result.push(v) });
                return;
            }

            return _.reduce(pathValidations, function(result, validation, key) {
                // Should we strip down the settings object to only be the fields we are checking?
                //let validation = pathValidations[key];
                // if (validation && !validation(value)) {
                //     //result.push(key);
                //     result = result.concat(key);
                // }
                // return result;
                validation(result, 'imageReference', key, value[key]);
                return result;
            }, result);
            // return _.reduce(value, function(result, value, key) {
            //     // Should we strip down the settings object to only be the fields we are checking?
            //     let validation = pathValidations[key];
            //     // if (validation && !validation(value)) {
            //     //     //result.push(key);
            //     //     result = result.concat(key);
            //     // }
            //     // return result;
            //     if (validation) {
            //         validation(result, 'imageReference', key, value);
            //     }
            //     return result;
            // }, result);
        },
        //"osDisk": _.isNil,
        //"osDisk.caching": isNullOrWhitespace
        "osDisk": function (result, parentKey, key, value) {
            let pathValidations = {
                "caching": isNullOrWhitespace
            };

            if (_.isNil(value)) {
                // Return an array of the key and it's value names
                result.push(key);
                _.forEach(_.map(_.keys(pathValidations), k => { return key + '.' + k }), v => { result.push(v) });
                return;
            }

            return _.reduce(pathValidations, function(result, validation, key) {
                validation(result, 'osDisk', key, value[key]);
                return result;
            }, result);
        }
    };

    if (_.isNil(settings)) {
        throw new Error('settings cannot be null or undefined');
    }

    // var missingFields = [];
    // if (_.isNullOrWhitespace(settings.computerNamePrefix)) {
    //     missingFields.push('computerNamePrefix');
    // }

    let missingFields = _.reduce(pathValidations, function(result, validation, key) {
        validation(result, '', key, settings[key]);
        return result;
    }, []);
    // let picked = _.pick(settings, _.keys(pathValidations));
    // let missingFields = _.reduce(picked, function(result, value, key) {
    //     // Should we strip down the settings object to only be the fields we are checking?
    //     let validation = pathValidations[key];
    //     // if (validation && !validation(value)) {
    //     //     //result.push(key);
    //     //     result = result.concat(key);
    //     // }
    //     if (validation) {
    //         validation(result, '', key, value);
    //     }
    //     return result;
    // }, []);

    if (missingFields.length > 0) {
        throw new Error('Missing fields: ' + _.join(missingFields, ','));
    }
};

exports.mergeWithDefaults = function (settings) {
    var defaults = {
        "computerNamePrefix": "cn",
        "size": "Standard_DS2_v2",
        "osType": "windows",
        "imageReference": {
            "publisher": "MicrosoftWindowsServer",
            "offer": "WindowsServer",
            "sku": "2012-R2-Datacenter",
            "version": "latest"
        },
        "osDisk": {
            "caching": "ReadWrite"
        },
        "extensions": [ ]
    };

  // If defaults is nullish, there must not be defaults, so return the object.
//   if (_.isNil(defaults)) {
//     return object;
//   }

  // Get the paths for all of the default values.
  var keyPaths = _.paths(defaults);
  // Pick only the values that have defaults, so we remove extra stuff
  var picked = _.pick(settings, keyPaths);
  // Merge with an empty object so we don't mutate our parameters.
  return _.merge({}, defaults, picked);
};
