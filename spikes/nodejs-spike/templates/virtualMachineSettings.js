var _ = require('../lodashMixins.js');
var fs = require('fs');
var storageSettings = require('./storageSettings.js');
var nicSettings = require('./networkInterfaceSettings.js');
var avSetSettings = require('./availabilitySetSettings.js');

const defaultsPath = './nodejs-spike/defaults/virtualMachinesSettings.';

let output = {};

// merge with the defaults
function mergeWithDefaults(settings) {
    let defaultsFile = defaultsPath.concat(settings.osType, '.json');
    let defaults = JSON.parse(fs.readFileSync(defaultsFile, 'UTF-8'));

    // Merge with an empty object so we don't mutate our parameters.
    return _.mergeWith(defaults, settings, defaultsCustomizer);
};

// if nics and extensions are not specified in the parameters, use from defaults, else remove defaults
function defaultsCustomizer(objValue, srcValue, key) {
    if (key === "nics" || key === "extensions") {
        if (_.isArray(srcValue) && srcValue.length > 0) {
            objValue.splice(0, 1);
        }
    }
};

// TODO
function validateParameters() {

}

let processor = {
    computerNamePrefix: (value, key, index, parent) => {
        let temp = {};
        temp.computerName = value.concat("-vm", index + 1);
        return temp;
    },
    osType: (value, key, index, parent) => {
        let temp = {};
        let propName = value.concat("Configuration");
        if (value === "linux" && parent.osAuthenticationType === "ssh") {
            temp[propName] = {
                "adminPassword": null,
                "configuration": {
                    "disablePasswordAuthentication": "true",
                    "ssh": {
                        "publicKeys": [
                            {
                                "path": '/home/'.concat(parent.adminUsername, '/.ssh/authorized_keys'),
                                "keyData": parent.sshPublicKey
                            }
                        ]
                    }
                }
            };

            delete parent.sshPublicKey;
        } else {
            temp[propName] = {
                "adminPassword": parent.adminPassword,
                "configuration": null
            };
            delete parent.adminPassword;
        }

        delete parent.adminPassword;
        delete parent.osAuthenticationType;
        return temp;
    },
    osDisk: (value, key, index, parent) => {
        let temp = { "osDisk": {} };
        let storageAccounts = parent.storageAccounts;
        output.storageAccounts.forEach((account) => {
            storageAccounts.push(account.name);
        });
        let stroageAccountToUse = index % storageAccounts.length;

        temp.osDisk.name = parent.name.concat('-os.vhd');
        temp.osDisk.vhd = 'http://'.concat(storageAccounts[stroageAccountToUse], '.blob.core.windows.net/vhds/', parent.name, '-os.vhd');
        temp.osDisk.createOption = value.createOption;
        temp.osDisk.caching = value.caching;
        return temp;
    },
    dataDisks: (value, key, index, parent) => {
        let temp = { "dataDisks": [] };
        let storageAccounts = parent.storageAccounts;
        output.storageAccounts.forEach((account) => {
            storageAccounts.push(account.name);
        });
        let stroageAccountToUse = index % storageAccounts.length;

        for (let i = 0; i < value.count; i++) {
            let instance = {};
            instance.name = 'dataDisk'.concat(i + 1);
            instance.diskSizeGB = value.properties.diskSizeGB;
            instance.lun = i;
            instance.vhd = 'http://'.concat(storageAccounts[stroageAccountToUse], '.blob.core.windows.net/vhds/', parent.name, '-dataDisk', (i + 1), '.vhd');
            instance.caching = value.properties.caching;
            instance.createOption = value.properties.createOption;

            temp.dataDisks.push(instance);
        }
        return temp;
    },

    passThrough: (value, key, index) => {
        let temp = {};
        temp[key] = value;
        return temp;
    }
}

let storageAccountsProcessed = false;
let availabilitySetProcessed = false;
let processChildResources = {
    storageAccounts: (value, key, index, parent) => {
        if (!storageAccountsProcessed) {
            let mergedCol = (output["storageAccounts"] || (output["storageAccounts"] = [])).concat(storageSettings.processStorageSettings(value, parent));
            output.storageAccounts = mergedCol;
            storageAccountsProcessed = true;
        }
        return value.accounts;
    },
    nics: (value, key, index, parent) => {
        let col = nicSettings.processNetworkInterfaceSettings(value, parent, index);

        let mergedCol = (output["nics"] || (output["nics"] = [])).concat(col.nics);
        output["nics"] = mergedCol;
        mergedCol = (output["pips"] || (output["pips"] = [])).concat(col.pips);
        output["pips"] = mergedCol;

        return _.transform(col.nics, (result, n) => {
            let ref = { "properties": {} }
            ref.id = "[resourceId('Microsoft.Network/networkInterfaces/".concat(n.name, "']");
            ref.properties.primary = n.primary;
            result.push(ref);
            return result;
        }, []);
    },
    availabilitySet: (value, key, index, parent) => {
        if (!availabilitySetProcessed) {
            let col = avSetSettings.processAvSetSettings(value, parent);

            if (col.length > 0) {
                output["availabilitySet"] = col;
            }
        }
        let result = { "id": "" }
        result.id = "[resourceId('Microsoft.Compute/availabilitySets/".concat(value.name, "']");
        return result;
    }
}

function processVMStamps(param) {
    // resource template do not use the vmCount property. Remove from the template
    let vmCount = param.vmCount;
    delete param.vmCount;

    // deep clone settings for the number of VMs required (vmCount)  
    return _.transform(_.castArray(param), (result, n) => {
        for (let i = 0; i < vmCount; i++) {
            let stamp = _.cloneDeep(n);
            stamp.name = n.namePrefix.concat("-vm", i + 1)

            // delete namePrefix property since we wont need it anymore
            delete stamp.namePrefix;
            result.push(stamp);
        }
        return result;
    }, []);
}

function processParameter(param, buildingBlockSettings) {
    // Use resourceGroup and subscription from buildingblockSettings if not not provided in VM settings
    param.resourceGroup = param.resourceGroup || buildingBlockSettings.resourceGroup;
    param.subscription = param.subscription || buildingBlockSettings.subscription;

    output.virtualMachines = _.transform(processVMStamps(param), (result, n, index, parent) => {
        for (let prop in n) {
            if (typeof processChildResources[prop] === 'function') {
                n[prop] = processChildResources[prop](n[prop], prop, index, n);
            }
        }
        result.push(_.transform(n, (inner, value, key, obj) => {
            _.merge(inner, (typeof processor[key] === 'function') ? processor[key](value, key, index, obj) : processor["passThrough"](value, key, index, obj));
            return inner;
        }, {}));
        return result;
    }, [])
};

exports.processVirtualMachineSettings = function (vmSettings, buildingBlockSettings) {
    let result = mergeWithDefaults(vmSettings);

    validateParameters();

    processParameter(result, buildingBlockSettings);
    console.log(JSON.stringify(output));
}
