let _ = require('../lodashMixins.js');
let v = require('./validation.js');
let r = require('./resources.js');
let validationMessages = require('./ValidationMessages.js');

let virtualNetworkSettingsDefaults = {
    addressPrefixes: ["10.0.0.0/24"],
    subnets: [
        {
            name: "default",
            addressPrefix: "10.0.1.0/16"
        }
    ],
    dnsServers: []
};

let virtualNetworkSettingsValidations = {
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
};

function transform(settings) {
    return {
        name: settings.name,
        resourceGroupName: settings.resourceGroupName,
        subscriptionId: settings.subscriptionId,
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

let mergeCustomizer = function (objValue, srcValue, key, object, source, stack) {
    if (key === "subnets") {
        if ((srcValue) && (_.isArray(srcValue)) && (srcValue.length > 0)) {
            return srcValue;
        }
    }
};

exports.transform = function (settings, buildingBlockSettings) {
    // Settings is an array, so we need to loop through and validate all of them, and collect
    let results = _.transform(settings, (result, setting, index) => {
        let merged = v.mergeAndValidate(setting, virtualNetworkSettingsDefaults, virtualNetworkSettingsValidations, mergeCustomizer);
        if (merged.validationErrors) {
            _.each(merged.validationErrors, (error) => {
                error.name = `settings[${index}]${error.name}`;
            });
        }

        result.push(merged);
    }, []);

    // Merge with our defaults
    // Process the subscription id and resource group from the building block settings
    buildingBlockSettings = v.mergeAndValidate(buildingBlockSettings, {}, {
        subscriptionId: v.validationUtilities.isNullOrWhitespace,
        resourceGroupName: v.validationUtilities.isNullOrWhitespace,
    });

    if (buildingBlockSettings.validationErrors) {
        _.each(buildingBlockSettings.validationErrors, (error) => {
            error.name = `buildingBlockSettings${error.name}`;
        });
    }

    if (_.some(results, 'validationErrors') || (buildingBlockSettings.validationErrors)) {
        results.push(buildingBlockSettings);
        return _.transform(_.compact(results), (result, value) => {
            if (value.validationErrors) {
                result.validationErrors.push(value.validationErrors);
            }
        }, { validationErrors: [] });
    }

    results = _.transform(results, (result, setting) => {
        setting = r.setupResources(setting, buildingBlockSettings, (parentKey) => {
            return (parentKey === null);
        });
        setting = transform(setting);
        result.push(setting);
    }, []);

    return results;
    // let result = v.mergeAndValidate(settings, virtualNetworkSettingsDefaults, virtualNetworkSettingsValidations, mergeCustomizer);
    // buildingBlockSettings = v.mergeAndValidate(buildingBlockSettings, {}, {
    //     subscriptionId: v.validationUtilities.isNullOrWhitespace,
    //     resourceGroupName: v.validationUtilities.isNullOrWhitespace,
    // });

    // // If we have validation errors anywhere, merge them for now?
    // // NOTE: We need to generalize this!
    // if ((result.validationErrors) || (buildingBlockSettings.validationErrors)) {
    //     result.validationErrors = _.concat(result.validationErrors, buildingBlockSettings.validationErrors);
    // } else {
    //     result = r.setupResources(result, buildingBlockSettings, (parentKey) => {
    //         return (parentKey === null);
    //     });
    //     result = transform(result);
    // }

    // return result;
};