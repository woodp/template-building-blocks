let _ = require('../lodashMixins.js');
let v = require('./validation.js');
let r = require('./resources.js');

let validationMessages = require('./validationMessages.js');

let virtualNetworkGatewaySettingsDefaults = {
    gatewayType: 'Vpn',
    vpnType: 'RouteBased',
    sku: 'Standard',
    enableBgp: false
};

let validGatewayTypes = ['Vpn', 'ExpressRoute'];
let validVpnTypes = ['PolicyBased', 'RouteBased'];
let validSkus = ['Basic', 'HighPerformance', 'Standard', 'UltraPerformance'];
let validIPAllocationMethods = ['Static', 'Dynamic'];

let isValidGatewayType = (gatewayType) => {
    return v.utilities.isStringInArray(gatewayType, validGatewayTypes);
};

let isValidVpnType = (vpnType) => {
    return v.utilities.isStringInArray(vpnType, validVpnTypes);
};

let isValidSku = (sku) => {
    return v.utilities.isStringInArray(sku, validSkus);
};

let isValidIPAllocationMethod = (ipAllocationMethod) => {
    return v.utilities.isStringInArray(ipAllocationMethod, validIPAllocationMethods);
};

let bgpSettingsValidations = {
    asn: (value, parent) => {
        return _.isNil(value) ? {
            result: true
        } : {
                result: _.isFinite(value),
                message: 'Value must be an integer'
            };
    },
    bgpPeeringAddress: (value, parent) => {
        return _.isNil(value) ? {
            result: true
        } : {
                result: !_.isNullOrWhitespace(value),
                message: 'Value cannot be null, empty, or only whitespace'
            };
    },
    peerWeight: (value, parent) => {
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
    gatewayType: (value, parent) => {
        return {
            result: isValidGatewayType(value),
            message: `Valid values are ${validGatewayTypes.join(',')}`
        };
    },
    vpnType: (value, parent) => {
        return {
            result: isValidVpnType(value),
            message: `Valid values are ${validVpnTypes.join(',')}`
        };
    },
    enableBgp: _.isBoolean,
    sku: (value, parent) => {
        return {
            result: isValidSku(value),
            message: `Valid values are ${validSkus.join(',')}`
        };
    },
    bgpSettings: (value, parent) => {
        return _.isNil(value) ? {
            result: true
        } : v.validate({
            settings: value,
            validations: bgpSettingsValidations,
            parentKey: '.bgpSettings',
            parentValue: parent
        });
    },
    virtualNetwork: {
        name: v.utilities.isNotNullOrWhitespace
    },
    publicIpAddress: (value, parent) => {
        return _.isNil(value) ? {
            result: true
        } : v.validate({
            settings: value,
            validations: {
                name: v.utilities.isNotNullOrWhitespace
            },
            parentKey: '.publicIpAddress',
            parentValue: parent
        });
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

    let results = _.transform(settings, (result, setting, index) => {
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
            return ((parentKey === null) || (parentKey === "virtualNetwork") || (parentKey === 'publicIpAddress'));
        });
        setting = transform(setting);
        result.push(setting);
    }, []);

    return { settings: results };
};