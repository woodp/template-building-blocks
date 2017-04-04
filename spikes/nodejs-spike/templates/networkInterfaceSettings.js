
var fs = require('fs');
var _ = require('../lodashMixins.js');
var pipSettings = require('./pipSettings.js');
var resources = require('./resources.js');
let v = require('./validation.js');

function mergeAndValidate(settings, baseObjectSettings) {
    return v.mergeAndValidate(settings, {}, networkInterfaceValidations, baseObjectSettings)
}

let networkInterfaceValidations = {
    enableIPForwarding: v.validationUtilities.isBoolean,
    subnetName: v.validationUtilities.isNullOrWhitespace,
    privateIPAllocationMethod: (result, parentKey, key, value, parent, baseObjectSettings) => {
        if (_.isNullOrWhitespace(value) || (_.toLower(value) !== 'static' && _.toLower(value) !== 'dynamic')) {
            result.push({
                name: _.join((parentKey ? [parentKey, key] : [key]), '.'),
                message: "Valid values are: 'static', 'dymanic'."
            })
        };
        if (_.toLower(value) === 'static' && !parent.hasOwnProperty('startingIPAddress')) {
            result.push({
                name: _.join((parentKey ? [parentKey, key] : [key]), '.'),
                message: "If privateIPAllocationMethod is static, the startingIPAddress cannot be null/empty"
            })
        }
    },
    publicIPAllocationMethod: (result, parentKey, key, value, parent, baseObjectSettings) => {
        if (_.isNullOrWhitespace(value) || (_.toLower(value) !== 'static' && _.toLower(value) !== 'dynamic')) {
            result.push({
                name: _.join((parentKey ? [parentKey, key] : [key]), '.'),
                message: "Valid values are: 'static', 'dymanic'."
            })
        }
    },
    isPrimary: (result, parentKey, key, value, parent, baseObjectSettings) => {
        if (_.isNullOrWhitespace(value) || !_.isBoolean(value)) {
            result.push({
                name: _.join((parentKey ? [parentKey, key] : [key]), '.'),
                message: "Valid values are: true, false."
            })
        };
        let primaryNicCount = 0;
        baseObjectSettings.nics.forEach((nic) => {
            if (nic.isPrimary) primaryNicCount++;
        })
        if (primaryNicCount !== 1) {
            result.push({
                name: _.join((parentKey ? [parentKey, key] : [key]), '.'),
                message: "Virtual machine can have only 1 primary NetworkInterface."
            })
        }
    }

};

function intToIP(int) {
    var part1 = int & 255;
    var part2 = ((int >> 8) & 255);
    var part3 = ((int >> 16) & 255);
    var part4 = ((int >> 24) & 255);

    return part4 + "." + part3 + "." + part2 + "." + part1;
}

function ipToInt(ip) {
    var ipl = 0;
    ip.split('.').forEach(function (octet) {
        ipl <<= 8;
        ipl += parseInt(octet);
    });
    return (ipl >>> 0);
};

function createPipParameters(parent) {
    return pipSettings.processPipSettings(parent);
}

function buildNetworkInterfaceParameters(settings, parent, vmIndex) {
    return _.transform(settings, (result, n, index) => {
        // add the name, resourceGroup & subscription to the input nic parameter, since we might need that for creating pip
        n.name = parent.name.concat('-nic', (index + 1));
        n.resourceGroup = parent.resourceGroup;
        n.subscription = parent.subscription;

        let instance = {
            "resourceGroup": n.resourceGroup,
            "subscription": n.subscription,
            "name": n.name,
            "ipConfigurations": [
                {
                    "name": "ipconfig1",
                    "properties": {
                        "privateIPAllocationMethod": n.privateIPAllocationMethod
                    }
                }
            ],
            "primary": n.isPrimary,
            "enableIPForwarding": n.enableIPForwarding,
            "dnsSettings": {
                "dnsServers": n.dnsServers,
                "appliedDnsServers": n.dnsServers
            }
        };

        instance.ipConfigurations[0].properties.subnet = resources.resourceId(n.subscription, n.resourceGroup, 'Microsoft.Network/virtualNetworks/subnets', parent.vNetName, n.subnetName);

        if (n.hasOwnProperty("publicIPAllocationMethod")) {
            let pip = createPipParameters(n);
            result.pips = result.pips.concat(pip);

            instance.ipConfigurations[0].properties.publicIPAddress = { "id": resources.resourceId(n.subscription, n.resourceGroup, 'Microsoft.Network/publicIPAddresses', pip[0].name) };
        };
        if (_.toLower(n.privateIPAllocationMethod) === 'static') {
            let updatedIp = intToIP(ipToInt(n.startingIPAddress) + vmIndex);
            instance.ipConfigurations[0].properties.privateIPAddress = updatedIp;
        }
        result.nics.push(instance);
        return result;
    }, { "pips": [], "nics": [] })
}

function validate(namePrefix, skuType) { }

exports.processNetworkInterfaceSettings = buildNetworkInterfaceParameters;
exports.mergeAndValidate = mergeAndValidate;
