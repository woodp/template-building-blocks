let _ = require('../lodashMixins.js');
let v = require('./validation.js');
let r = require('./resources.js');

let validationMessages = require('./validationMessages.js');

let expressRouteCircuitSettingsDefaults = {
    skuTier: 'Standard',
    skuFamily: 'UnlimitedData',
    allowClassicOperations: false
};

let validSkuTiers = ['Standard', 'Premium'];
let validSkuFamilies = ['UnlimitedData', 'MeteredData'];

let isValidSkuTier = (tier) => {
    return v.utilities.isStringInArray(tier, validSkuTiers);
};

let isValidSkuFamily = (family) => {
    return v.utilities.isStringInArray(family, validSkuFamilies);
}

let expressRouteCircuitSettingsValidations = {
    name: v.utilities.isNotNullOrWhitespace,
    skuTier: (value, parent) => {
        return {
            result: isValidSkuTier(value),
            message: `Valid values are ${validSkuTiers.join(',')}`
        };
    },
    skuFamily: (value, parent) => {
        return {
            result: isValidSkuFamily(value),
            message: `Valid values are ${validSkuFamilies.join(',')}`
        };
    },
    serviceProviderName: v.utilities.isNotNullOrWhitespace,
    peeringLocation: v.utilities.isNotNullOrWhitespace,
    bandwidthInMbps: _.isFinite,
    allowClassicOperations: _.isBoolean
};

function transform(settings) {
    let result = {
        name: settings.name,
        id: r.resourceId(settings.subscriptionId, settings.resourceGroupName, 'Microsoft.Network/connections', settings.name),
        resourceGroupName: settings.resourceGroupName,
        subscriptionId: settings.subscriptionId,
        sku: {
            name: `${settings.skuTier}_${settings.skuFamily}`,
            tier: settings.skuTier,
            family: settings.skuFamily
        },
        properties: {
            serviceProviderProperties: {
                serviceProviderName: settings.serviceProviderName,
                peeringLocation: settings.peeringLocation,
                bandwidthInMbps: settings.bandwidthInMbps
            },
            allowClassicOperations: settings.allowClassicOperations
        }
    };

    return result;
}

exports.transform = function ({ settings, buildingBlockSettings }) {
    if (_.isPlainObject(settings)) {
        settings = [settings];
    }

    let results = _.transform(settings, (result, setting, index) => {
        let merged = v.merge(setting, expressRouteCircuitSettingsDefaults);
        let errors = v.validate({
            settings: merged,
            validations: expressRouteCircuitSettingsValidations
        });
        if (errors.length > 0) {
            throw new Error(JSON.stringify(errors));
        }

        result.push(merged);
    }, []);

    buildingBlockErrors = v.validate({
        settings: buildingBlockSettings,
        validations: {
            subscriptionId: v.utilities.isNotNullOrWhitespace,
            resourceGroupName: v.utilities.isNotNullOrWhitespace,
        }
    });

    if (buildingBlockErrors.length > 0) {
        throw new Error(JSON.stringify(buildingBlockErrors));
    }

    results = _.transform(results, (result, setting) => {
        setting = r.setupResources(setting, buildingBlockSettings, (parentKey) => {
            return (parentKey === null);
        });
        setting = transform(setting);
        result.push(setting);
    }, []);

    return { settings: results };
};