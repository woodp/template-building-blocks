let _ = require('../lodashMixins.js');
let v = require('./validation.js');
let validationMessages = require('./ValidationMessages.js');

let defaults = {
    addressPrefixes: ["10.0.0.0/24"],
    subnets: [
        {
            name: "default",
            addressPrefix: "10.0.1.0/16"
        }
    ],
    dnsServers: []
};

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

exports.virtualNetworkSettingsDefaults = defaults;
exports.mergeCustomizer = function (objValue, srcValue, key, object, source, stack) {
    if (key === "subnets") {
        if ((srcValue) && (_.isArray(srcValue)) && (srcValue.length > 0)) {
            return srcValue;
        }
    }
};

exports.virtualNetworkValidations = {
    name: v.validationUtilities.isNullOrWhitespace,
    addressPrefixes: v.validationUtilities.networking.isValidCidr,
    subnets: (result, parentKey, key, value, parent) => {
        let validations = {
            name: v.validationUtilities.isNullOrWhitespace,
            addressPrefix: v.validationUtilities.networking.isValidCidr
        };

        v.reduce(validations, value, parentKey, parent, result);
    },
    dnsServers: v.validationUtilities.isNullOrWhitespace
}