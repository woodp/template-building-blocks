let _ = require('../lodashMixins.js');

let defaults = {
    addressPrefixes: ["11.0.0.0/24"],
    subnets: [{"default": "10.0.3.0/16"}],
    dnsServers: [ "default.mysite.com" ]
};

function isNullOrWhitespace(result, parentKey, key, value) {
    let retVal = !_.isNullOrWhitespace(value);
    if (!retVal) {
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
        result.push(_.join((parentKey ? [parentKey, key] : [key]), '.'));
    }
}

exports.transform = function (settings) {
    return {
        name: settings.name,
        properties: {
            addressSpace: {
                addressPrefixes: settings.addressPrefixes
            },
            subnets: _.map(settings.subnets, (value, index) => {
                return {
                    name: value.name,
                    addressPrefix: value.addressPrefix
                }
            }),
            dhcpOptions: {
                dnsServers: settings.dnsServers
            }
        }
    };
}

exports.validateRequiredSettings = function (settings) {
    let validations = {
        name: isNullOrWhitespace,
        addressPrefixes: (result, parentKey, key, value) => {
            if (_.isNil(value)) {
                result.push(key);
                return;
            } else {
                return _.reduce(value, (result, value, index) => {
                    isNullOrWhitespace(result, key, key + '[' + index + ']', value);
                    return result;
                });
            }
        },
        subnets: (result, parentKey, key, value) => {
            let validations = {
                name: isNullOrWhitespace,
                addressPrefix: validateCidr
            };

            if (_.isNil(value)) {
                result.push(key);
            } else {
                _.reduce(value, (result, subnet, index) => {
                    _.reduce(validations, (result, validation, key) => {
                        validation(result, 'subnets[' + index + ']', key, subnet[key]);
                        return result;
                    }, result);
                    return result;
                }, result);
            }
        },
        dnsServers: (result, parentKey, key, value) => {
            if (_.isNil(value)) {
                result.push(key);
            } else {
                return _.reduce(value, (result, value, index) => {
                    isNullOrWhitespace(result, key, key + '[' + index + ']', value);
                    return result;
                });
            }
        }
    };

    settings = _.merge({}, defaults, settings);
    // if (_.isNil(settings)) {
    //     throw new Error('settings cannot be null or undefined');
    // }

    let missingFields = _.reduce(validations, function(result, validation, key) {
        validation(result, '', key, settings[key]);
        return result;
    }, []);

    if (missingFields.length > 0) {
        throw new Error('Missing fields: ' + _.join(missingFields, ','));
    }

    return settings;
};