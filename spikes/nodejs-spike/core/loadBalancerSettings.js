let _ = require('../lodashMixins.js');
let v = require('./validation.js');

let validLoadBalancerTypes = ['Public', 'Internal'];
let validProtocols = ['Tcp', 'Udp'];
let validLoadDistributions = ['Default', 'SourceIP', 'SourceIPProtocol'];
let validIPAllocationMethods = ['Dynamic', 'Static'];
let validProbeProtocols = ['Http', 'Tcp'];

let isValidLoadBalancerType = (loadBalancerType) => {
    return v.utilities.isStringInArray(loadBalancerType, validLoadBalancerTypes);
};

let isValidProtocol = (protocol) => {
    return v.utilities.isStringInArray(protocol, validProtocols);
};

let isValidLoadDistribution = (loadDistribution) => {
    return v.utilities.isStringInArray(loadDistribution, validLoadDistributions);
};

let isValidIPAllocationMethod = (ipAllocationMethod) => {
    return v.utilities.isStringInArray(ipAllocationMethod, validIPAllocationMethods);
};

let isValidProbeProtocol = (probeProtocol) => {
    return v.utilities.isStringInArray(probeProtocol, validProbeProtocols);
};

let frontendIPConfigurationValidations = {
    name: v.utilities.isNotNullOrWhitespace,
    privateIPAddress: (value, parent) => {
        let result = {
            result: true
        };

        if (parent.privateIPAllocationMethod === 'Static') {
            result = {
                result: v.utilities.networking.isValidIpAddress(value),
                message: 'Value must be a valid IP address'
            };
        } else if ((parent.privateIPAllocationMethod === 'Dynamic') && (!_.isNil(value))) {
            result = {
                result: false,
                message: 'If privateIPAllocationMethod is Dynamic, privateIPAddress cannot be specified'
            };
        }

        return result;
    },
    privateIPAllocationMethod: (value) => {
        return {
            result: isValidIPAllocationMethod(value),
            message: `Valid values are ${validIPAllocationMethods.join(',')}`
        };
    }
};

let loadBalancingRuleValidations = {
    name: v.utilities.isNotNullOrWhitespace,
    protocol: (value) => {
        return {
            result: isValidProtocol(value),
            message: `Valid values are ${validProtocols.join(',')}`
        };
    },
    loadDistribution: (value) => {
        return {
            result: isValidLoadDistribution(value),
            message: `Valid values are ${validLoadDistributions.join(',')}`
        };
    },
    frontendPort: (value) => {
        return {
            result: _.inRange(_.toSafeInteger(value), 1, 65535),
            message: 'Valid values are from 1 to 65534'
        };
    },
    backendPort: (value) => {
        return {
            result: _.inRange(_.toSafeInteger(value), 1, 65536),
            message: 'Valid values are from 1 to 65535'
        };
    },
    idleTimeoutInMinutes: (value, parent) => {
        let result = {
            result: true
        };

        if ((parent.protocol === 'Tcp') && (!_.inRange(4, 31))) {
            result = {
                result: false,
                message: 'Valid values are from 4 to 30'
            };
        } else if ((parent.protocol === 'Udp') && (!_.isNil(value))) {
            result = {
                result: false,
                message: 'If protocol is Udp, idleTimeoutInMinutes cannot be specified'
            };
        }

        return result;
    },
    enableFloatingIP: v.validationUtilities.isBoolean
};

let inboundNatRuleValidations = {
    name: v.utilities.isNotNullOrWhitespace,
    protocol: (value) => {
        return {
            result: isValidProtocol(value),
            message: `Valid values are ${validProtocols.join(',')}`
        };
    },
    frontendPort: (value) => {
        return {
            result: _.inRange(_.toSafeInteger(value), 1, 65535),
            message: 'Valid values are from 1 to 65534'
        };
    },
    backendPort: (value) => {
        return {
            result: _.inRange(_.toSafeInteger(value), 1, 65536),
            message: 'Valid values are from 1 to 65535'
        };
    },
    idleTimeoutInMinutes: (value, parent) => {
        let result = {
            result: true
        };

        if ((parent.protocol === 'Tcp') && (!_.inRange(4, 31))) {
            result = {
                result: false,
                message: 'Valid values are from 4 to 30'
            };
        } else if ((parent.protocol === 'Udp') && (!_.isNil(value))) {
            result = {
                result: false,
                message: 'If protocol is Udp, idleTimeoutInMinutes cannot be specified'
            };
        }

        return result;
    },
    enableFloatingIP: v.validationUtilities.isBoolean
};

let inboundNatPoolValidations = {
    name: v.utilities.isNotNullOrWhitespace,
    protocol: (value) => {
        return {
            result: isValidProtocol(value),
            message: `Valid values are ${validProtocols.join(',')}`
        };
    },
    frontendPortRangeStart: (value) => {
        return {
            result: _.inRange(_.toSafeInteger(value), 1, 65535),
            message: 'Valid values are from 1 to 65534'
        };
    },
    frontendPortRangeEnd: (value) => {
        return {
            result: _.inRange(_.toSafeInteger(value), 1, 65536),
            message: 'Valid values are from 1 to 65535'
        };
    },
    backendPort: (value) => {
        return {
            result: _.inRange(_.toSafeInteger(value), 1, 65536),
            message: 'Valid values are from 1 to 65535'
        };
    }
};

let outboundNatRuleValidations = {
    name: v.utilities.isNotNullOrWhitespace,
    allocatedOutboundPorts: _.isFinite
};

let probeValidations = {
    name: v.utilities.isNotNullOrWhitespace,
    protocol: (value) => {
        return {
            result: isValidProbeProtocol(value),
            message: `Valid values are ${validProbeProtocols.join(',')}`
        };
    },
    port: (value) => {
        return {
            result: _.inRange(_.toSafeInteger(value), 1, 65536),
            message: 'Valid values are from 1 to 65535'
        };
    },
    intervalInSeconds: (value) => {
        return {
            // TODO - Not sure what the upper limit is, so I chose five minutes at random.
            result: _.inRange(_.toSafeInteger(value), 5, 300),
            message: 'Valid values are from 5 to 300'
        };
    },
    numberOfProbes: (value) => {
        return {
            result: _.isFinite(value),
            message: 'Valid value must be a finite number'
        };
    },
    requestPath: (value, parent) => {
        let result = {
            result: true
        };

        if ((parent.protocol === 'Http') && (_.isNullOrWhitespace(value))) {
            result = {
                result: false,
                message: 'If protocol is Http, requestPath cannot be null, undefined, or only whitespace'
            };
        } else if ((parent.protocol === 'Tcp') && (!_.isNil(value))) {
            result = {
                result: false,
                message: 'If protocol is Tcp, requestPath cannot be provided'
            };
        }

        return result;
    }
};