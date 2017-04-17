let _ = require('../lodashMixins.js');
let v = require('./validation.js');
let r = require('./resources.js');
let validationMessages = require('./validationMessages.js');

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

let virtualNetworkPeeringsSettingsDefaults = {
    allowForwardedTraffic: false,
    allowGatewayTransit: false,
    useRemoteGateways: false
}

let virtualNetworkSettingsValidations = {
    name: v.validationUtilities.isNullOrWhitespace,
    addressPrefixes: v.validationUtilities.networking.isValidCidr,
    subnets: (result, parentKey, key, value, parent) => {
        // let validations = {
        //     name: v.validationUtilities.isNullOrWhitespace,
        //     addressPrefix: v.validationUtilities.networking.isValidCidr
        // };

        // v.reduce(validations, value, parentKey, parent, result);
        v.reduce({
            name: v.validationUtilities.isNullOrWhitespace,
            addressPrefix: v.validationUtilities.networking.isValidCidr
        }, value, parentKey, parent, result);
    },
    dnsServers: v.validationUtilities.isNullOrWhitespace,
    virtualNetworkPeerings: (result, parentKey, key, value, parent) => {
        // let validations = {
        //     remoteVirtualNetwork: (result, parentKey, key, value, parent) => {
        //         v.reduce({name: v.validationUtilities.isNullOrWhitespace}, value, parentKey, parent, result);
        //     }
        // };

        // v.reduce(validations, value, parentKey, parent, result);
        v.reduce({
            remoteVirtualNetwork: (result, parentKey, key, value, parent) => {
                v.reduce({
                    name: v.validationUtilities.isNullOrWhitespace
                }, value, parentKey, parent, result);
            }
        }, value, parentKey, parent, result);
    }
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
                    properties: {
                        addressPrefix: value.addressPrefix
                    }
                }
            }),
            dhcpOptions: {
                dnsServers: settings.dnsServers
            }
        }
    };
}

function transformVirtualNetworkPeering({settings, parentSettings}) {
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

let mergeCustomizer = function (objValue, srcValue, key, object, source, stack) {
    if (key === "subnets") {
        if ((srcValue) && (_.isArray(srcValue)) && (srcValue.length > 0)) {
            return srcValue;
        }
    }
};

//const nameOf = varObj => Object.keys(varObj)[0];

exports.transform = function ({ settings, buildingBlockSettings }) {
    if (_.isPlainObject(settings)) {
        settings = [settings];
    }

    let results = _.transform(settings, (result, setting, index) => {
        //let merged = v.mergeAndValidate(setting, virtualNetworkSettingsDefaults, virtualNetworkSettingsValidations, mergeCustomizer);
        let merged = v.merge(setting, virtualNetworkSettingsDefaults, mergeCustomizer);
        let errors = v.validate(merged, virtualNetworkSettingsValidations, merged);
        if (errors.length > 0) {
          throw new Error(JSON.stringify(errors));
        }
        if (merged.validationErrors) {
            let name = v.utilities.nameOf({settings});
            _.each(merged.validationErrors, (error) => {
                error.name = `${name}[${index}]${error.name}`;
            });
        }

        result.push(merged);
    }, []);

    // buildingBlockSettings = v.mergeAndValidate(buildingBlockSettings, {}, {
    //     subscriptionId: v.validationUtilities.isNullOrWhitespace,
    //     resourceGroupName: v.validationUtilities.isNullOrWhitespace,
    // });

    // if (buildingBlockSettings.validationErrors) {
    //     let name = v.utilities.nameOf({buildingBlockSettings});
    //     _.each(buildingBlockSettings.validationErrors, (error) => {
    //         error.name = `${name}${error.name}`;
    //     });
    // }

    buildingBlockErrors = v.validate(buildingBlockSettings, {
        subscriptionId: v.validationUtilities.isNullOrWhitespace,
        resourceGroupName: v.validationUtilities.isNullOrWhitespace,
    }, buildingBlockSettings);

    // if (buildingBlockSettings.validationErrors) {
    //     let name = v.utilities.nameOf({buildingBlockSettings});
    //     _.each(buildingBlockSettings.validationErrors, (error) => {
    //         error.name = `${name}${error.name}`;
    //     });
    // }
    if (buildingBlockErrors.length > 0) {
        throw new Error(JSON.stringify(buildingBlockErrors));
    }

    if (_.some(results, 'validationErrors') || (buildingBlockSettings.validationErrors)) {
        results.push(buildingBlockSettings);
        return {
            validationErrors: _.transform(_.compact(results), (result, value) => {
                if (value.validationErrors) {
                    result.validationErrors.push(value.validationErrors);
                }
            }, { validationErrors: [] })
        };
    }

    // results = _.transform(results, (result, setting) => {
    //     setting = r.setupResources(setting, buildingBlockSettings, (parentKey) => {
    //         return ((parentKey === null) || (parentKey === "remoteVirtualNetwork"));
    //     });
    //     setting = transform(setting);
    //     result.push(setting);
    // }, []);

    // return { settings: results };
    results = _.transform(results, (result, setting) => {
        setting = r.setupResources(setting, buildingBlockSettings, (parentKey) => {
            return ((parentKey === null) || (parentKey === "remoteVirtualNetwork"));
        });
        //setting = transform(setting);
        //result.push(setting);
        result.virtualNetworks.push(transform(setting));
        if ((setting.virtualNetworkPeerings) && (setting.virtualNetworkPeerings.length > 0)) {
            result.virtualNetworkPeerings = result.virtualNetworkPeerings.concat(_.transform(setting.virtualNetworkPeerings,
                (result, virtualNetworkPeeringSettings) => {
                    result.push(transformVirtualNetworkPeering({settings: virtualNetworkPeeringSettings, parentSettings: setting}));
                }, []));
        }
    }, {
        virtualNetworks: [],
        virtualNetworkPeerings: []
    });

    return { settings: results };
};