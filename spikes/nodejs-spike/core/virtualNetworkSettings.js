'use strict';

let _ = require('lodash');
let v = require('./validation.js');
let r = require('./resources.js');
let validationMessages = require('./validationMessages.js');

let virtualNetworkSettingsDefaults = {
    addressPrefixes: ['10.0.0.0/16'],
    subnets: [
        {
            name: 'default',
            addressPrefix: '10.0.1.0/24'
        }
    ],
    dnsServers: [],
    virtualNetworkPeerings: [],
    tags: {}
};

let virtualNetworkPeeringsSettingsDefaults = {
    allowForwardedTraffic: false,
    allowGatewayTransit: false,
    useRemoteGateways: false
};

let virtualNetworkSettingsSubnetsValidations = {
    name: v.validationUtilities.isNotNullOrWhitespace,
    addressPrefix: v.validationUtilities.isValidCidr
};

let virtualNetworkSettingsPeeringValidations = {
    name: (value) => {
        // Undefined is okay, as it will be generated, but null or whitespace is not.
        if (_.isUndefined(value)) {
            return {
                result: true
            };
        } else {
            return {
                validations: v.validationUtilities.isNotNullOrWhitespace
            };
        }
    },
    remoteVirtualNetwork: {
        name: v.validationUtilities.isNotNullOrWhitespace
    },
    allowForwardedTraffic: v.validationUtilities.isBoolean,
    allowGatewayTransit: v.validationUtilities.isBoolean,
    useRemoteGateways: v.validationUtilities.isBoolean
};

let virtualNetworkSettingsValidations = {
    name: v.validationUtilities.isNotNullOrWhitespace,
    addressPrefixes: v.validationUtilities.isValidCidr,
    subnets: virtualNetworkSettingsSubnetsValidations,
    dnsServers: (value) => {
        // An empty array is okay
        let result = {
            result: true
        };

        if (_.isNil(value)) {
            result = {
                result: false,
                message: validationMessages.ValueCannotBeNull
            };
        } else if (value.length > 0) {
            result = {
                validations: v.validationUtilities.isValidIpAddress
            };
        }

        return result;
    },
    tags: v.tagsValidations,
    virtualNetworkPeerings: (value) => {
        // An empty array is okay
        let result = {
            result: true
        };

        if (_.isNil(value)) {
            result = {
                result: false,
                message: validationMessages.ValueCannotBeNull
            };
        } else if (value.length > 0) {
            result = {
                validations: virtualNetworkSettingsPeeringValidations
            };
        }

        return result;
    }
};

function transform(settings) {
    let result = {
        name: settings.name,
        resourceGroupName: settings.resourceGroupName,
        subscriptionId: settings.subscriptionId,
        properties: {
            addressSpace: {
                addressPrefixes: settings.addressPrefixes
            },
            subnets: _.map(settings.subnets, (value) => {
                return {
                    name: value.name,
                    properties: {
                        addressPrefix: value.addressPrefix
                    }
                };
            }),
            dhcpOptions: {
                dnsServers: settings.dnsServers
            }
        }
    };

    if (settings.tags) {
        result.tags = settings.tags;
    }

    return result;
}

function transformVirtualNetworkPeering({ settings, parentSettings }) {
    let peeringName = settings.name ? settings.name : `${settings.remoteVirtualNetwork.name}-peer`;
    return {
        name: `${parentSettings.name}/${peeringName}`,
        properties: {
            remoteVirtualNetwork: {
                id: r.resourceId(settings.remoteVirtualNetwork.subscriptionId, settings.remoteVirtualNetwork.resourceGroupName,
                    'Microsoft.Network/virtualNetworks', settings.remoteVirtualNetwork.name)
            },
            allowForwardedTraffic: settings.allowForwardedTraffic,
            allowGatewayTransit: settings.allowGatewayTransit,
            useRemoteGateways: settings.useRemoteGateways
        }
    };
}

let mergeCustomizer = function (objValue, srcValue, key) {
    if (key === 'subnets') {
        if ((!_.isNil(srcValue)) && (_.isArray(srcValue)) && (srcValue.length > 0)) {
            return srcValue;
        }
    }

    if (key === 'virtualNetworkPeerings') {
        if ((srcValue) && (_.isArray(srcValue)) && (srcValue.length > 0)) {
            return _.map(srcValue, (value) => v.merge(value, virtualNetworkPeeringsSettingsDefaults));
        }
    }
};

let merge = ({settings, buildingBlockSettings, defaultSettings = virtualNetworkSettingsDefaults}) => {
    let merged = r.setupResources(settings, buildingBlockSettings, (parentKey) => {
        return ((parentKey === null) || (parentKey === 'remoteVirtualNetwork'));
    });

    merged = v.merge(merged, defaultSettings, mergeCustomizer);
    return merged;
};

exports.transform = function ({ settings, buildingBlockSettings }) {
    if (_.isPlainObject(settings)) {
        settings = [settings];
    }

    let buildingBlockErrors = v.validate({
        settings: buildingBlockSettings,
        validations: {
            subscriptionId: v.validationUtilities.isGuid,
            resourceGroupName: v.validationUtilities.isNotNullOrWhitespace,
        }
    });

    if (buildingBlockErrors.length > 0) {
        throw new Error(JSON.stringify(buildingBlockErrors));
    }

    let results = merge({
        settings: settings,
        buildingBlockSettings: buildingBlockSettings
    });

    let errors = v.validate({
        settings: results,
        validations: virtualNetworkSettingsValidations
    });

    if (errors.length > 0) {
        throw new Error(JSON.stringify(errors));
    }

    results = _.transform(results, (result, setting) => {
        result.virtualNetworks.push(transform(setting));
        if ((setting.virtualNetworkPeerings) && (setting.virtualNetworkPeerings.length > 0)) {
            result.virtualNetworkPeerings = result.virtualNetworkPeerings.concat(_.transform(setting.virtualNetworkPeerings,
                (result, virtualNetworkPeeringSettings) => {
                    result.push(transformVirtualNetworkPeering({ settings: virtualNetworkPeeringSettings, parentSettings: setting }));
                }, []));
        }
    }, {
        virtualNetworks: [],
        virtualNetworkPeerings: []
    });

    return results;
};