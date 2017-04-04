var _ = require('../lodashMixins.js');
var fs = require('fs');
var storageSettings = require('./storageSettings.js');
var nicSettings = require('./networkInterfaceSettings.js');
var avSetSettings = require('./availabilitySetSettings.js');
var resources = require('./resources.js');
let v = require('./validation.js');

const defaultsPath = './nodejs-spike/defaults/virtualMachinesSettings.';

let output = {};

function mergeAndValidate(settings) {
    let defaultsFile = defaultsPath.concat(settings.osType, '.json');
    let defaults = JSON.parse(fs.readFileSync(defaultsFile, 'UTF-8'));

    return v.mergeAndValidate(settings, defaults, virtualMachineValidations, "", defaultsCustomizer)
}

// if nics and extensions are not specified in the parameters, use from defaults, else remove defaults
function defaultsCustomizer(objValue, srcValue, key) {
    if (objValue && (key === "nics" || key === "extensions")) {
        if (_.isArray(srcValue) && srcValue.length > 0) {
            objValue.splice(0, 1);
        }
    }
}

let virtualMachineValidations = {
    vNetName: v.validationUtilities.isNullOrWhitespace,
    vmCount: (result, parentKey, key, value, parent, baseObjectSettings) => {
        if (!_.isNumber(value) || value < 1) {
            result.push({
                name: _.join((parentKey ? [parentKey, key] : [key]), '.'),
                message: "Value should be greater than 1."
            })
        }
    },
    namePrefix: v.validationUtilities.isNullOrWhitespace,
    computerNamePrefix: (result, parentKey, key, value, parent, baseObjectSettings) => {
        if (_.isNullOrWhitespace(value) || value.length >= 6) {
            result.push({
                name: _.join((parentKey ? [parentKey, key] : [key]), '.'),
                message: "Valid should not be more than 6 char long."
            })
        }
    },
    size: v.validationUtilities.isNullOrWhitespace,
    osType: (result, parentKey, key, value, parent, baseObjectSettings) => {
        if (_.isNullOrWhitespace(value) || (_.toLower(value) !== 'linux' && _.toLower(value) !== 'windows')) {
            result.push({
                name: _.join((parentKey ? [parentKey, key] : [key]), '.'),
                message: "Valid values are: 'linux', 'windows'."
            })
        }
    },
    adminUsername: v.validationUtilities.isNullOrWhitespace,
    osAuthenticationType: (result, parentKey, key, value, parent, baseObjectSettings) => {
        if (_.isNullOrWhitespace(value) || (_.toLower(value) !== 'ssh' && _.toLower(value) !== 'password')) {
            result.push({
                name: _.join((parentKey ? [parentKey, key] : [key]), '.'),
                message: "Valid values are: 'ssh', 'password'."
            })
        }
        if (_.toLower(value) === 'ssh' && (!parent.hasOwnProperty('sshPublicKey') || _.isNullOrWhitespace(parent.sshPublicKey))) {
            result.push({
                name: _.join((parentKey ? [parentKey, key] : [key]), '.'),
                message: "'sshPublicKey' cannot be null, if osAuthenticationType is 'ssh'"
            })
        }
        if (_.toLower(value) === 'password' && (!parent.hasOwnProperty('adminPassword') || _.isNullOrWhitespace(parent.adminPassword))) {
            result.push({
                name: _.join((parentKey ? [parentKey, key] : [key]), '.'),
                message: "'adminPassword' cannot be null, if osAuthenticationType is 'password'"
            })
        }
    },
    storageAccounts: (result, parentKey, key, value, parent, baseObjectSettings) => {
        let { settings, validationErrors } = storageSettings.mergeAndValidate(value, baseObjectSettings);
        if (validationErrors) {
            validationErrors.forEach((error) => {
                result.push(error);
            });
        } else {
            baseObjectSettings.storageAccounts = settings;
        }
    },
    nics: (result, parentKey, key, value, parent, baseObjectSettings) => {
        let { settings, validationErrors } = nicSettings.mergeAndValidate(value, baseObjectSettings);
        if (validationErrors) {
            validationErrors.forEach((error) => {
                result.push(error);
            });
        } else {
            baseObjectSettings.nics[key] = settings;
        }
    },
    availabilitySet: (result, parentKey, key, value, parent, baseObjectSettings) => {
        let { settings, validationErrors } = avSetSettings.mergeAndValidate(value, baseObjectSettings);
        if (validationErrors) {
            validationErrors.forEach((error) => {
                result.push(error);
            });
        } else {
            baseObjectSettings.avSetSettings = settings;
        }
    }
};

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

            ref.id = resources.resourceId(n.subscription, n.resourceGroup, 'Microsoft.Network/networkInterfaces', n.name);
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

        result.id = resources.resourceId(value.subscription || parent.subscription, value.resourceGroup || parent.resourceGroup, 'Microsoft.Network/availabilitySets', value.name);
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

exports.processVirtualMachineSettings = processParameter;
exports.mergeAndValidate = mergeAndValidate;
