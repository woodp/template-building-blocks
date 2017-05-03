let _ = require('../lodashMixins.js');
let v = require('./validation.js');
let r = require('./resources.js');

let validationMessages = require('./validationMessages.js');

let connectionSettingsDefaults = {
};

let validConnectionTypes = ['IPsec', 'Vnet2Vnet', 'ExpressRoute', 'VPNClient'];

let isValidConnectionType = (connectionType) => {
    return v.utilities.isStringInArray(connectionType, validConnectionTypes);
};

let localNetworkGatewayValidations = {
    name: v.utilities.isNotNullOrWhitespace,
    ipAddress: v.utilities.networking.isValidIpAddress,
    addressPrefixes: v.utilities.networking.isValidCidr
};

let expressRouteCircuitValidations = {
    name: v.utilities.isNotNullOrWhitespace
};

let virtualNetworkGatewayValidations = {
    name: v.utilities.isNotNullOrWhitespace
};

let connectionSettingsValidations = {
    name: v.utilities.isNotNullOrWhitespace,
    connectionType: (value, parent) => {
        return {
            result: isValidConnectionType(value),
            message: `Valid values are ${validConnectionTypes.join(',')}`
        };
    },
    routingWeight: _.isFinite,
    sharedKey: (value, parent) => {
        let result = {
            result: true
        };

        if (parent.connectionType) {
            // If connectionType is not specified, this may be confusing for the user, so we will simply return true as
            // there will be a validation failure for the connectionType
            if (parent.connectionType === 'ExpressRoute') {
                if (!_.isUndefined(value)) {
                    result = {
                        result: false,
                        message: 'sharedKey cannot be specified for an ExpressRoute connection'
                    };
                }
            } else {
                result = {
                    result: v.utilities.isNotNullOrWhitespace(value),
                    message: 'sharedKey cannot be null, empty, or only whitespace'
                };
            }
        }

        return result;
    },
    virtualNetworkGateway: (value, parent) => {
        let result = {
            result: true
        };

        if (parent.connectionType) {
            // If connectionType is not specified, this may be confusing for the user, so we will simply return true as
            // there will be a validation failure for the connectionType
            if (v.utilities.isStringInArray(parent.connectionType, ['IPsec', 'ExpressRoute'])) {
                if (_.isNil(value)) {
                    result = {
                        result: false,
                        message: 'Value cannot be null or undefined if connectionType is IPsec or ExpressRoute'
                    };
                } else {
                    result = {
                        validations: virtualNetworkGatewayValidations
                    };
                }
            } else if (!_.isNil(value)) {
                result = {
                    result: false,
                    message: 'virtualNetworkGateway cannot be specified if connectionType is not IPsec or ExpressRoute'
                };
            }
        }

        return result;
    },
    localNetworkGateway: (value, parent) => {
        let result = {
            result: true
        };

        if (parent.connectionType) {
            // If connectionType is not specified, this may be confusing for the user, so we will simply return true as
            // there will be a validation failure for the connectionType
            if (parent.connectionType === 'IPsec') {
                if (_.isNil(value)) {
                    result = {
                        result: false,
                        message: 'Value cannot be null or undefined if connectionType is IPsec'
                    };
                } else {
                    result = {
                        validations: localNetworkGatewayValidations
                    };
                }
            } else if (!_.isNil(value)) {
                result = {
                    result: false,
                    message: 'localNetworkGateway cannot be specified if connectionType is not IPsec'
                };
            }
        }

        return result;
    },
    expressRouteCircuit: (value, parent) => {
        let result = {
            result: true
        };

        if (parent.connectionType) {
            // If connectionType is not specified, this may be confusing for the user, so we will simply return true as
            // there will be a validation failure for the connectionType
            if (parent.connectionType !== 'ExpressRoute') {
                if (!_.isUndefined(value)) {
                    result = {
                        result: false,
                        message: 'expressRouteCircuit cannot be specified if connectionType is not ExpressRoute'
                    };
                }
            } else {
                result = {
                    validations: expressRouteCircuitValidations
                };
            }
        }

        return result;
    },
    virtualNetworkGateway1: (value, parent) => {
        let result = {
            result: true
        };

        if (parent.connectionType) {
            // If connectionType is not specified, this may be confusing for the user, so we will simply return true as
            // there will be a validation failure for the connectionType
            if ((parent.connectionType === 'Vnet2Vnet')) {
                if ((_.isNil(value))) {
                    result = {
                        result: false,
                        message: 'Value cannot be null or undefined if connectionType is Vnet2Vnet'
                    };
                } else {
                    result = {
                        validations: virtualNetworkGatewayValidations
                    };
                }
            } else {
                if ((!_.isNil(value))) {
                    result = {
                        result: false,
                        message: 'Value cannot be specified if connectionType is not Vnet2Vnet'
                    };
                }
            }
        }

        return result;
    },
    virtualNetworkGateway2: (value, parent) => {
        let result = {
            result: true
        };

        if (parent.connectionType) {
            // If connectionType is not specified, this may be confusing for the user, so we will simply return true as
            // there will be a validation failure for the connectionType
            if ((parent.connectionType === 'Vnet2Vnet')) {
                if ((_.isNil(value))) {
                    result = {
                        result: false,
                        message: 'Value cannot be null or undefined if connectionType is Vnet2Vnet'
                    };
                } else {
                    result = {
                        validations: virtualNetworkGatewayValidations
                    };
                }
            } else {
                if ((!_.isNil(value))) {
                    result = {
                        result: false,
                        message: 'Value cannot be specified if connectionType is not Vnet2Vnet'
                    };
                }
            }
        }

        return result;
    }
};

function transform(settings) {
    let result = {
        name: settings.name,
        id: r.resourceId(settings.subscriptionId, settings.resourceGroupName, 'Microsoft.Network/connections', settings.name),
        resourceGroupName: settings.resourceGroupName,
        subscriptionId: settings.subscriptionId,
        properties: {
            connectionType: settings.connectionType,
            routingWeight: settings.routingWeight
        }
    };

    if (settings.connectionType === 'IPsec') {
        result.properties.sharedKey = settings.sharedKey;
        result.properties.virtualNetworkGateway1 = {
            id: r.resourceId(settings.virtualNetworkGateway.subscriptionId, settings.virtualNetworkGateway.resourceGroupName,
                'Microsoft.Network/virtualNetworkGateways', settings.virtualNetworkGateway.name)
        };
        result.properties.localNetworkGateway2 = {
            id: r.resourceId(settings.localNetworkGateway.subscriptionId, settings.localNetworkGateway.resourceGroupName,
                'Microsoft.Network/localNetworkGateways', settings.localNetworkGateway.name)
        };
    } else if (settings.connectionType === 'Vnet2Vnet') {
        result.properties.sharedKey = settings.sharedKey;
        result.properties.virtualNetworkGateway1 = {
            id: r.resourceId(settings.virtualNetworkGateway1.subscriptionId, settings.virtualNetworkGateway1.resourceGroupName,
                'Microsoft.Network/virtualNetworkGateways', settings.virtualNetworkGateway1.name)
        };
        result.properties.virtualNetworkGateway2 = {
            id: r.resourceId(settings.virtualNetworkGateway2.subscriptionId, settings.virtualNetworkGateway2.resourceGroupName,
                'Microsoft.Network/virtualNetworkGateways', settings.virtualNetworkGateway2.name)
        };
    } else if (settings.connectionType === 'ExpressRoute') {
        result.properties.virtualNetworkGateway1 = {
            id: r.resourceId(settings.virtualNetworkGateway.subscriptionId, settings.virtualNetworkGateway.resourceGroupName,
                'Microsoft.Network/virtualNetworkGateways', settings.virtualNetworkGateway.name)
        };
        result.properties.peer = {
            id: r.resourceId(settings.expressRouteCircuit.subscriptionId, settings.expressRouteCircuit.resourceGroupName,
                'Microsoft.Network/expressRouteCircuits', settings.expressRouteCircuit.name)
        };
    }

    return result;
}

function merge({settings}) {
    return v.merge(settings, connectionSettingsDefaults);
}

function validate({settings}) {
    return v.validate({
        settings: settings,
        validations: connectionSettingsValidations
    });
}

exports.transform = function ({ settings, buildingBlockSettings }) {
    if (_.isPlainObject(settings)) {
        settings = [settings];
    }

    let results = _.transform(settings, (result, setting, index) => {
        let merged = merge({setting: setting});
        let errors = validate({settings: merged});
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
            return ((parentKey === null) ||
                (v.utilities.isStringInArray(parentKey,
                ['virtualNetworkGateway', 'localNetworkGateway', 'expressRouteCircuit', 'virtualNetworkGateway1', 'virtualNetworkGateway2'])));
        });
        setting = transform(setting);
        result.push(setting);
    }, []);

    return { settings: results };
};