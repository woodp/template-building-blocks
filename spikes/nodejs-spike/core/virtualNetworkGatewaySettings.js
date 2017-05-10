'use strict';

let _ = require('../lodashMixins.js');
let v = require('./validation.js');
let r = require('./resources.js');

let virtualNetworkGatewaySettingsDefaults = {
    gatewayType: 'Vpn',
    vpnType: 'RouteBased',
    sku: 'Standard',
    enableBgp: false
};

let validGatewayTypes = ['Vpn', 'ExpressRoute'];
let validVpnTypes = ['PolicyBased', 'RouteBased'];
let validSkus = ['Basic', 'HighPerformance', 'Standard', 'UltraPerformance'];

let isValidGatewayType = (gatewayType) => {
    return v.utilities.isStringInArray(gatewayType, validGatewayTypes);
};

let isValidVpnType = (vpnType) => {
    return v.utilities.isStringInArray(vpnType, validVpnTypes);
};

let isValidSku = (sku) => {
    return v.utilities.isStringInArray(sku, validSkus);
};

let publicIpAddressValidations = {
    name: v.utilities.isNotNullOrWhitespace
};

let bgpSettingsValidations = {
    asn: (value) => {
        return _.isNil(value) ? {
            result: true
        } : {
            result: _.isFinite(value),
            message: 'Value must be an integer'
        };
    },
    bgpPeeringAddress: (value) => {
        return _.isNil(value) ? {
            result: true
        } : {
            result: !_.isNullOrWhitespace(value),
            message: 'Value cannot be null, empty, or only whitespace'
        };
    },
    peerWeight: (value) => {
        return _.isNil(value) ? {
            result: true
        } : {
            result: _.isFinite(value),
            message: 'Value must be an integer'
        };
    }
};

let virtualNetworkGatewaySettingsValidations = {
    name: v.utilities.isNotNullOrWhitespace,
    gatewayType: (value) => {
        return {
            result: isValidGatewayType(value),
            message: `Valid values are ${validGatewayTypes.join(',')}`
        };
    },
    vpnType: (value) => {
        return {
            result: isValidVpnType(value),
            message: `Valid values are ${validVpnTypes.join(',')}`
        };
    },
    enableBgp: _.isBoolean,
    sku: (value) => {
        return {
            result: isValidSku(value),
            message: `Valid values are ${validSkus.join(',')}`
        };
    },
    bgpSettings: (value) => {
        return _.isNil(value) ? {
            result: true
        } : {
            validations: bgpSettingsValidations
        };
    },
    virtualNetwork: {
        name: v.utilities.isNotNullOrWhitespace
    },
    publicIpAddress: (value) => {
        return _.isNil(value) ? {
            result: true
        } : {
            validations: publicIpAddressValidations
        };
    }
};

function transform(settings) {
    let result = {
        name: settings.name,
        id: r.resourceId(settings.subscriptionId, settings.resourceGroupName, 'Microsoft.Network/virtualNetworkGateway', settings.name),
        resourceGroupName: settings.resourceGroupName,
        subscriptionId: settings.subscriptionId,
        properties: {
            ipConfigurations: [
                {
                    name: `${settings.name}-ipconfig`,
                    properties: {
                        privateIPAllocationMethod: 'Dynamic',
                        subnet: {
                            id: r.resourceId(settings.virtualNetwork.subscriptionId, settings.virtualNetwork.resourceGroupName,
                                'Microsoft.Network/virtualNetworks/subnets', settings.virtualNetwork.name, 'GatewaySubnet')
                        }
                    }
                }
            ],
            gatewayType: settings.gatewayType,
            vpnType: settings.vpnType,
            enableBgp: settings.enableBgp,
            sku: {
                name: settings.sku,
                tier: settings.sku
            }
        }
    };

    if (settings.publicIpAddress) {
        result.properties.ipConfigurations[0].properties.publicIPAddress = {
            id: r.resourceId(settings.publicIpAddress.subscriptionId, settings.publicIpAddress.resourceGroupName,
                'Microsoft.Network/publicIPAddresses', settings.publicIpAddress.name)
        };
    }

    if (settings.bgpSettings) {
        result.properties.bgpSettings = settings.bgpSettings;
    }

    return result;
}

exports.transform = function ({ settings, buildingBlockSettings }) {
    if (_.isPlainObject(settings)) {
        settings = [settings];
    }

    let results = _.transform(settings, (result, setting) => {
        let merged = v.merge(setting, virtualNetworkGatewaySettingsDefaults);
        let errors = v.validate({
            settings: merged,
            validations: virtualNetworkGatewaySettingsValidations
        });
        if (errors.length > 0) {
            throw new Error(JSON.stringify(errors));
        }

        result.push(merged);
    }, []);

    let buildingBlockErrors = v.validate({
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
            return ((parentKey === null) || (parentKey === 'virtualNetwork') || (parentKey === 'publicIpAddress'));
        });
        setting = transform(setting);
        result.push(setting);
    }, []);

    return { settings: results };
};