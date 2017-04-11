var _ = require('../lodashMixins.js');
var fs = require('fs');
var storageSettings = require('./storageSettings.js');
var nicSettings = require('./networkInterfaceSettings.js');
var avSetSettings = require('./availabilitySetSettings.js');
var resources = require('./resources.js');
let v = require('./validation.js');

const defaultsPath = './nodejs-spike/defaults/virtualMachinesSettings.';

let output = {};

function merge(settings) {
    let defaultsFile = defaultsPath.concat(settings.osType, '.json');
    let defaults = JSON.parse(fs.readFileSync(defaultsFile, 'UTF-8'));

    return v.merge(settings, defaults, defaultsCustomizer, childResourceToMerge);
}

function validate(settings) {
    return v.validate(settings, virtualMachineValidations, settings)
}

// if nics and extensions are not specified in the parameters, use from defaults, else remove defaults
function defaultsCustomizer(objValue, srcValue, key) {
    if (objValue && key === "nics") {
        if (srcValue && _.isArray(srcValue) && srcValue.length > 0) {
            objValue.splice(0, 1);
        }
    }
    if (objValue && key === "extensions") {
        if (srcValue) {
            srcValue.forEach((extension) => {
                if (_.toLower(extension.type) === 'iaasdiagnostics' || _.toLower(extension.type) === 'linuxdiagnostic') {
                    objValue.splice(0, 1);
                }
                objValue.push(extension);
            });
            // we have processed all extensions from parameters file. 
            srcValue.splice(0, srcValue.length);
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
        let validationErrors = storageSettings.validateSettings(value, baseObjectSettings);
        validationErrors.forEach((error) => {
            error.name = 'storageAccounts' + error.name;
            result.push(error);
        });
    },
    diagonisticStorageAccounts: (result, parentKey, key, value, parent, baseObjectSettings) => {
        let validationErrors = storageSettings.validateSettings(value, baseObjectSettings);
        validationErrors.forEach((error) => {
            error.name = 'diagonisticStorageAccounts' + error.name;
            result.push(error);
        });
    },
    nics: (result, parentKey, key, value, parent, baseObjectSettings) => {
        let validationErrors = nicSettings.validateSettings(value, baseObjectSettings);
        validationErrors.forEach((error) => {
            error.name = 'nics' + error.name;
            result.push(error);
        });
    },
    availabilitySet: (result, parentKey, key, value, parent, baseObjectSettings) => {
        let validationErrors = avSetSettings.validateSettings(value, baseObjectSettings);
        validationErrors.forEach((error) => {
            error.name = 'availabilitySet' + error.name;
            result.push(error);
        });
    }
};

let childResourceToMerge = {
    storageAccounts: storageSettings.mergeWithDefaults,
    diagonisticStorageAccounts: storageSettings.mergeWithDefaults,
    nics: nicSettings.mergeWithDefaults,
    availabilitySet: avSetSettings.mergeWithDefaults
}

let processorProperties = {
    extensions: (value, key, index, parent) => {
        let processedExtensions = { "extensions": [] };
        value.forEach((extension) => {
            let temp = {};
            temp.name = parent.name.concat('/', extension.name);
            temp.publisher = extension.publisher;
            temp.type = extension.type;
            temp.typeHandlerVersion = extension.typeHandlerVersion;
            temp.autoUpgradeMinorVersion = extension.autoUpgradeMinorVersion;

            if ((_.toLower(extension.type) === 'iaasdiagnostics' || _.toLower(extension.type) === 'linuxdiagnostic') && extension.settingsConfig.hasOwnProperty('metricsclosing1')) {
                temp.settings = {};
                temp.protectedSettings = {};
                let vmId = resources.resourceId(parent.subscription, parent.resourceGroup, 'Microsoft.Compute/virtualMachines', parent.name);

                // get the diagonstic account name for the VM
                let diagonisticAccounts = parent.diagonisticStorageAccounts;
                output.diagonisticStorageAccounts.forEach((account) => {
                    diagonisticAccounts.push(account.name);
                });
                let diagonisticAccountToUse = index % diagonisticAccounts.length;
                let diagnosticAccountName = diagonisticAccounts[diagonisticAccountToUse];
                let accountResourceId = resources.resourceId(parent.subscription, parent.resourceGroup, 'Microsoft.Storage/storageAccounts', diagnosticAccountName);
                let xmlCfg = extension.settingsConfig.metricsstart.concat(extension.settingsConfig.metricscounters, extension.settingsConfig.metricsclosing1, vmId, extension.settingsConfig.metricsclosing2);
                let base64XmlCfg = new Buffer(xmlCfg).toString('base64');

                // build settings property for diagonistic extension
                temp.settings.StorageAccount = diagnosticAccountName;
                temp.settings.xmlCfg = base64XmlCfg.toString();

                // build protectedSettings property for diagonistic extension
                temp.protectedSettings.storageAccountName = diagnosticAccountName;
                temp.protectedSettings.storageAccountEndPoint = "https://core.windows.net/";
                temp.protectedSettings.storageAccountKey = "[listKeys('".concat(accountResourceId, "', '2015-06-15').key1]");
            } else {
                temp.settings = extension.settingsConfig;
                temp.protectedSettings = extension.protectedSettingsConfig;
            }

            processedExtensions.extensions.push(temp);
        })
        return processedExtensions;
    },
    computerNamePrefix: (value, key, index, parent) => {
        let temp = {};
        temp.computerName = value.concat("-vm", index + 1);
        return temp;
    },
    osType: (value, key, index, parent) => {
        let temp = {};
        temp.osType = value;
        let propName = value.concat("Configuration");
        if (value === "linux" && parent.osAuthenticationType === "ssh") {
            temp.adminPassword = null;
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
        } else {
            temp[propName] = {
                "adminPassword": parent.adminPassword,
                "configuration": null
            };
        }
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
    diagonisticStorageAccounts: (value, key, index, parent) => {
        let temp = { "diagnosticsProfile": { "bootDiagnostics": {} } };
        // get the diagonstic account name for the VM
        let diagonisticAccounts = parent.diagonisticStorageAccounts;
        output.diagonisticStorageAccounts.forEach((account) => {
            diagonisticAccounts.push(account.name);
        });
        let diagonisticAccountToUse = index % diagonisticAccounts.length;
        let diagnosticAccountName = diagonisticAccounts[diagonisticAccountToUse];

        temp.diagnosticsProfile.bootDiagnostics.enabled = true;
        temp.diagnosticsProfile.bootDiagnostics.storageUri = 'http://'.concat(diagnosticAccountName, '.blob.core.windows.net');
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
let diagonisticStorageAccountsProcessed = false;
let processChildResources = {
    storageAccounts: (value, key, index, parent) => {
        if (!storageAccountsProcessed) {
            let mergedCol = (output["storageAccounts"] || (output["storageAccounts"] = [])).concat(storageSettings.processStorageSettings(value, parent));
            output.storageAccounts = mergedCol;
            storageAccountsProcessed = true;
        }
        // return account. VMs will need to use existing accounts and the new accounts. Outputs only has the list of new accounts.
        return value.accounts;
    },
    diagonisticStorageAccounts: (value, key, index, parent) => {
        if (!diagonisticStorageAccountsProcessed) {
            let mergedCol = (output["diagonisticStorageAccounts"] || (output["diagonisticStorageAccounts"] = [])).concat(storageSettings.processStorageSettings(value, parent));
            output.diagonisticStorageAccounts = mergedCol;
            diagonisticStorageAccountsProcessed = true;
        }
        // return account. VMs will need to use existing accounts and the new accounts. Outputs only has the list of new accounts.
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

function process(param, buildingBlockSettings) {
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
            _.merge(inner, (typeof processorProperties[key] === 'function') ? processorProperties[key](value, key, index, obj) : processorProperties["passThrough"](value, key, index, obj));
            return inner;
        }, {}));
        return result;
    }, [])

    return createTemplateParameters(output);
};

function createTemplateParameters(resources) {
    let templateParameters = {
        "$schema": "http://schema.management.azure.com/schemas/2015-01-01/deploymentParameters.json#",
        "contentVersion": "1.0.0.0",
        "parameters": {

        }
    };
    templateParameters.parameters = _.transform(resources, (result, value, key, obj) => {
       result[key] = {"value": []};
       result[key].value = value;
       return result;
    }, {});
    return templateParameters;
};

exports.processVirtualMachineSettings = process;
exports.mergeWithDefaults = merge;
exports.validateSettings = validate;
