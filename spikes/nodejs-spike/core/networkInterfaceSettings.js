
var fs = require('fs');
var _ = require('../lodashMixins.js');
var pipSettings = require('./pipSettings.js');
var resources = require('./resources.js');
let v = require('./validation.js');

const defaultsPath = './nodejs-spike/defaults/networkInterfaceSettings.json';

function merge(settings) {
    let defaultsStamp = JSON.parse(fs.readFileSync(defaultsPath, 'UTF-8'));
    let defaults = [];
    for (let i = 0; i < settings.length; i++) {
        defaults.push(v.merge(settings[i], defaultsStamp));
    }
    return defaults;
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
    },
    isPublic: (result, parentKey, key, value, parent, baseObjectSettings) => {
        if (_.isNullOrWhitespace(value) || !_.isBoolean(value)) {
            result.push({
                name: _.join((parentKey ? [parentKey, key] : [key]), '.'),
                message: "Valid values are: true, false."
            })
        };
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

function process(settings, parent, vmIndex) {
    return _.transform(settings, (result, n, index) => {
        n.name = parent.name.concat('-nic', (index + 1));

        let instance = {
            name: n.name,
            ipConfigurations: [
                {
                    name: "ipconfig1",
                    properties: {
                        privateIPAllocationMethod: n.privateIPAllocationMethod,
                        subnet: { "id": resources.resourceId(parent.virtualNetwork.subscriptionId, parent.virtualNetwork.resourceGroupName, 'Microsoft.Network/virtualNetworks/subnets', parent.virtualNetwork.name, n.subnetName) }
                    }
                }
            ],
            primary: n.isPrimary,
            enableIPForwarding: n.enableIPForwarding,
            dnsSettings: {
                dnsServers: n.dnsServers,
                appliedDnsServers: n.dnsServers
            }
        };

        if (n.isPublic) {
            let pip = createPipParameters(n);
            result.pips = result.pips.concat(pip);

            instance.ipConfigurations[0].properties.publicIPAddress = { "id": resources.resourceId(n.subscriptionId, n.resourceGroupName, 'Microsoft.Network/publicIPAddresses', pip[0].name) };
        };
        if (_.toLower(n.privateIPAllocationMethod) === 'static') {
            let updatedIp = intToIP(ipToInt(n.startingIPAddress) + vmIndex);
            instance.ipConfigurations[0].properties.privateIPAddress = updatedIp;
        }
        result.nics.push(instance);
        return result;
    }, { "pips": [], "nics": [] })
}

exports.processNetworkInterfaceSettings = process;
exports.mergeWithDefaults = merge;
exports.validations = networkInterfaceValidations;
