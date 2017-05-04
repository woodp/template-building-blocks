var _ = require('../lodashMixins.js');
var fs = require('fs');
var storageSettings = require('./storageSettings.js');
var nicSettings = require('./networkInterfaceSettings.js');
var avSetSettings = require('./availabilitySetSettings.js');
var resources = require('./resources.js');
let v = require('./validation.js');

const defaultsPath = './defaults/virtualMachinesSettings.';

function merge(settings) {
    if (!settings.osDisk) {
        throw new Error(JSON.stringify({
            name: ".osDisk",
            message: `Invalid value: ${settings.osDisk}`
        }));
    } else if (!isValidOSType(settings.osDisk.osType)) {
        throw new Error(JSON.stringify({
            name: ".osDisk.osType",
            message: `Invalid value: ${settings.osDisk.osType}. Valid values for 'osType' are: ${validOSTypes.join(', ')}`
        }));
    }
    let defaultsFile = defaultsPath.concat(settings.osDisk.osType, '.json');
    let defaults = JSON.parse(fs.readFileSync(defaultsFile, 'UTF-8'));

    return v.merge(settings, defaults, defaultsCustomizer, childResourceToMerge);
}

let validOSAuthenticationTypes = ['ssh', 'password'];
let validOSTypes = ['linux', 'windows'];
let validCachingType = ['None', 'ReadOnly', 'ReadWrite'];
let validCreateOptions = ['fromImage', 'empty', 'attach'];

let isValidOSAuthenticationType = (osAuthenticationType) => {
    return v.utilities.isStringInArray(osAuthenticationType, validOSAuthenticationTypes);
};

let isValidOSType = (osType) => {
    return v.utilities.isStringInArray(osType, validOSTypes);
};

let isValidCachingType = (caching) => {
    return v.utilities.isStringInArray(caching, validCachingType);
};

let isValidCreateOptions = (option) => {
    return v.utilities.isStringInArray(option, validCreateOptions);
};

function validate(settings) {
    let errors = v.validate({
        settings: settings,
        validations: virtualMachineValidations
    });

    // Make sure only one network interface is primary
    let primaryNicCount = _.reduce(settings.nics, (accumulator, value, index, collection) => {
        if (value.isPrimary) {
            accumulator++;
        }

        return accumulator;
    }, 0);

    if (settings.nics && primaryNicCount !== 1) {
        errors.push({
            name: '.nics',
            message: "Virtual machine can have only 1 primary NetworkInterface."
        });
    }

    return errors;
}

// if nics and extensions are not specified in the parameters, use from defaults, else ignore defaults
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
                    // if user provided the diagnostic extension, then use that instead of the default one
                    // Through VM building block only the diagnostic extension can be specified. IGNORE the rest of the extensions. 
                    objValue.splice(0, 1);
                    objValue.push(extension);
                }
            });
            // we have processed all extensions from parameters file. 
            srcValue.splice(0, srcValue.length);
        }
    }
}

let encryptionSettingsValidations = {
    enabled: _.isBoolean,
    diskEncryptionKey: {
        secretUrl: v.utilities.isNotNullOrWhitespace,
        sourceVaultName: v.utilities.isNotNullOrWhitespace
    },
    keyEncryptionKey: {
        keyUrl: v.utilities.isNotNullOrWhitespace,
        sourceVaultName: v.utilities.isNotNullOrWhitespace
    }
};

let virtualMachineValidations = {
    virtualNetwork: v.utilities.isNotNullOrWhitespace,
    vmCount: (value, parent) => {
        return {
            result: _.isFinite(value) && (value > 0),
            message: 'Value must be greater than 0'
        };
    },
    namePrefix: v.utilities.isNotNullOrWhitespace,
    computerNamePrefix: (value, parent) => {
        return {
            result: v.utilities.isNotNullOrWhitespace(value) && (value.length < 7),
            message: 'Value cannot be longer than 6 characters'
        };
    },
    size: v.utilities.isNotNullOrWhitespace,
    osDisk: (value, parent) => {
        // We will need this, so we'll capture here.
        let isManagedStorageAccounts = parent.storageAccounts.managed;
        let osDiskValidations = {
            caching: (value, parent) => {
                return {
                    result: isValidCachingType(value),
                    message: `Valid values are ${validCachingType.join(', ')}`
                };
            },
            createOption: (value, parent) => {
                if (!isValidCreateOptions(value)) {
                    return {
                        result: false,
                        message: `Valid values are ${validCreateOptions.join(', ')}`
                    };
                };
                if (isManagedStorageAccounts && value === 'attach') {
                    return {
                        result: false,
                        message: `Value cannot be 'attach' with managed disks`
                    };
                }
                return { result: true };
            },
            image: (value, parent) => {
                if (parent.createOption === 'attach' && _.isNullOrWhitespace(value)) {
                    return {
                        result: false,
                        message: `Value of 'image' cannot be null or empty, if value of '.osDisk.createOption' is 'attach'}`
                    };
                };
                return { result: true };
            },
            osType: (value, parent) => {
                return {
                    result: isValidOSType(value),
                    message: `Valid values are ${validOSTypes.join(', ')}`
                };
            },
            diskSizeGB: (value, parent) => {
                return _.isNil(value) ? {
                    result: true
                } : {
                    result: ((_.isFinite(value)) && value > 0),
                    message: 'Value must be greater than 0'
                };
            },
            encryptionSettings: (value, parent) => {
                return _.isNil(value) ? {
                    result: true
                } : {
                        validations: encryptionSettingsValidations
                };
            }
        }

        return {
            validations: osDiskValidations
        };
    },
    dataDisks: (value, parent) => {
        // We will need this, so we'll capture here.
        let isManagedStorageAccounts = parent.storageAccounts.managed;
        let dataDiskValidations = {
            properties: {
                caching: (value, parent) => {
                    return {
                        result: isValidCachingType(value),
                        message: `Valid values are ${validCachingType.join(', ')}`
                    };
                },
                createOption: (value, parent) => {
                    if (!isValidCreateOptions(value)) {
                        return {
                            result: false,
                            message: `Valid values are ${validCreateOptions.join(', ')}`
                        };
                    };
                    if (isManagedStorageAccounts && value === 'attach') {
                        return {
                            result: false,
                            message: `Value cannot be 'attach' with managed disks`
                        };
                    }
                    return { result: true };
                },
                image: (value, parent) => {
                    if (parent.createOption === 'attach' && _.isNullOrWhitespace(value)) {
                        return {
                            result: false,
                            message: `Value of 'image' cannot be null or empty, if value of '.dataDisks.createOption' is 'attach'}`
                        };
                    };
                    return { result: true };
                },
                diskSizeGB: (value, parent) => {
                    return {
                        result: ((_.isFinite(value)) && value > 0),
                        message: 'Value must be greater than 0'
                    };
                }
            },
            count: (value, parent) => {
                return {
                    result: ((_.isFinite(value)) && value > 0),
                    message: 'Value must be greater than 0'
                };
            }
        };

        return {
            validations: dataDiskValidations
        };
    },
    existingWindowsServerlicense: (value, parent) => {
        if (!_.isBoolean(value)) {
            return {
                result: false,
                message: 'Value must be Boolean'
            };
        };
        if (parent.osDisk.osType !== "windows" && value) {
            return {
                result: false,
                message: 'Value cannot be true, if the osType is windows'
            };
        }
        return { result: true };
    },
    adminUsername: v.utilities.isNotNullOrWhitespace,
    osAuthenticationType: (value, parent) => {
        let result = {
            result: true
        };

        if (!isValidOSAuthenticationType(value)) {
            result = {
                result: false,
                message: "Valid values for 'osAuthenticationType' are: 'ssh', 'password'"
            };
        }
        return result;
    },
    adminPassword: (value, parent) => {
        let result = {
            result: true
        };
        if ((parent.osAuthenticationType === 'password') && (_.isNullOrWhitespace(value))) {
            result = {
                result: false,
                message: 'adminPassword cannot be null, empty, or only whitespace if osAuthenticationType is password'
            };
        }
        return result;
    },
    sshPublicKey: (value, parent) => {
        let result = {
            result: true
        };

        if (parent.osAuthenticationType === 'ssh' && (_.isNullOrWhitespace(value))) {
            result = {
                result: false,
                message: 'sshPublicKey cannot be null, empty, or only whitespace if osAuthenticationType is ssh'
            };
        }
        return result;
    },

    storageAccounts: storageSettings.storageValidations,
    diagnosticStorageAccounts: storageSettings.diagnosticValidations,
    nics: nicSettings.validations,
    availabilitySet: avSetSettings.validations
};

let childResourceToMerge = {
    storageAccounts: storageSettings.mergeWithDefaults,
    diagnosticStorageAccounts: storageSettings.mergeWithDefaults,
    nics: nicSettings.mergeWithDefaults,
    availabilitySet: avSetSettings.mergeWithDefaults
}

let processorProperties = {
    existingWindowsServerlicense: (value, key, index, parent) => {
        if (parent.osDisk.osType === "windows" && value) {
            return {
                licenseType: "Windows_Server"
            }
        } else {
            return {
                licenseType: null
            }
        }
    },
    availabilitySet: (value, key, index, parent) => {
        if (_.toLower(value.useExistingAvailabilitySet) === "no" && parent.vmCount < 2) {
            return {
                availabilitySet: null
            };
        }

        return {
            availabilitySet: {
                id: resources.resourceId(value.subscriptionId, value.resourceGroupName, 'Microsoft.Network/availabilitySets', value.name)
            }
        }
    },
    size: (value, key, index, parent) => {
        return {
            hardwareProfile: {
                vmSize: value
            }
        }
    },
    imageReference: (value, key, index, parent) => {
        return {
            storageProfile: {
                imageReference: value
            }
        }
    },
    osDisk: (value, key, index, parent, parentAccumulator) => {
        let instance = {
            name: parent.name.concat('-os.vhd'),
            createOption: value.createOption,
            caching: value.caching,
            diskSizeGB: value.diskSizeGB,
            osType: value.osType
        }

        if (value.encryptionSettings) {
            instance.encryptionSettings = {
                diskEncryptionKey: {
                    secretUrl: value.encryptionSettings.diskEncryptionKey.secretUrl,
                    sourceVault: {
                        id: resources.resourceId(value.encryptionSettings.subscriptionId, value.encryptionSettings.resourceGroupName, "Microsoft.KeyVault/vaults", value.encryptionSettings.diskEncryptionKey.sourceVaultName)
                    }
                },
                keyEncryptionKey: {
                    keyUrl: value.encryptionSettings.keyEncryptionKey.keyUrl,
                    sourceVault: {
                        id: resources.resourceId(value.encryptionSettings.subscriptionId, value.encryptionSettings.resourceGroupName, "Microsoft.KeyVault/vaults", value.encryptionSettings.keyEncryptionKey.sourceVaultName)
                    }
                },
                enabled: true
            }
        }

        if (value.createOption === 'attach') {
            instance.image = {
                uri: value.image
            }
        } else if (parent.storageAccounts.managed) {
            instance.managedDisk = {
                storageAccountType: parent.storageAccounts.skuType
            }
        } else {
            let storageAccounts = parent.storageAccounts.accounts;
            parentAccumulator.storageAccounts.forEach((account) => {
                storageAccounts.push(account.name);
            });
            let stroageAccountToUse = index % storageAccounts.length;
            instance.vhd = {
                uri: `http://${storageAccounts[stroageAccountToUse]}.blob.core.windows.net/vhds/${parent.name}-os.vhd`
            }
        }

        return {
            storageProfile: {
                osDisk: instance
            }
        }
    },
    dataDisks: (value, key, index, parent, parentAccumulator) => {
        let disks = [];
        for (let i = 0; i < value.count; i++) {
            let instance = {
                name: 'dataDisk'.concat(i + 1),
                diskSizeGB: value.properties.diskSizeGB,
                lun: i,
                caching: value.properties.caching,
                createOption: value.properties.createOption
            };
            if (value.properties.createOption === 'attach') {
                instance.image = {
                    uri: value.image
                }
            } else if (parent.storageAccounts.managed) {
                instance.managedDisk = {
                    storageAccountType: parent.storageAccounts.skuType
                }
            } else {
                let storageAccounts = parent.storageAccounts.accounts;
                parentAccumulator.storageAccounts.forEach((account) => {
                    storageAccounts.push(account.name);
                });
                let stroageAccountToUse = index % storageAccounts.length;
                instance.vhd = {
                    uri: `http://${storageAccounts[stroageAccountToUse]}.blob.core.windows.net/vhds/${parent.name}-dataDisk${i + 1}.vhd`
                }
            }

            disks.push(instance)
        }
        return {
            storageProfile: {
                dataDisks: disks
            }
        }
    },
    nics: (value, key, index, parent, parentAccumulator) => {
        let ntwkInterfaces = _.transform(parentAccumulator.nics, (result, n) => {
            if (_.includes(n.name, parent.name)) {
                let nicRef = {
                    id: resources.resourceId(parent.subscriptionId, parent.resourceGroupName, 'Microsoft.Network/networkInterfaces', n.name),
                    properties: {
                        primary: n.primary
                    }
                }
                result.push(nicRef);
            }
            return result;
        }, []);
        return {
            networkProfile: {
                networkInterfaces: ntwkInterfaces
            }
        }
    },
    diagnosticStorageAccounts: (value, key, index, parent, parentAccumulator) => {
        // get the diagonstic account name for the VM
        let diagnosticAccounts = parent.diagnosticStorageAccounts.accounts;
        parentAccumulator.diagnosticStorageAccounts.forEach((account) => {
            diagnosticAccounts.push(account.name);
        });
        let diagnosticAccountToUse = index % diagnosticAccounts.length;
        let diagnosticAccountName = diagnosticAccounts[diagnosticAccountToUse];

        return {
            diagnosticsProfile: {
                bootDiagnostics: {
                    enabled: true,
                    storageUri: `http://${diagnosticAccountName}.blob.core.windows.net`
                }
            }
        };
    },
    extensions: (value, key, index, parent, parentAccumulator) => {
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
                let vmId = resources.resourceId(parent.subscriptionId, parent.resourceGroupName, 'Microsoft.Compute/virtualMachines', parent.name);

                // get the diagonstic account name for the VM
                let diagnosticAccounts = parent.diagnosticStorageAccounts.accounts;
                parentAccumulator.diagnosticStorageAccounts.forEach((account) => {
                    diagnosticAccounts.push(account.name);
                });
                let diagnosticAccountToUse = index % diagnosticAccounts.length;
                let diagnosticAccountName = diagnosticAccounts[diagnosticAccountToUse];
                let accountResourceId = resources.resourceId(parent.diagnosticStorageAccounts.subscriptionId, parent.diagnosticStorageAccounts.resourceGroupName, 'Microsoft.Storage/storageAccounts', diagnosticAccountName);
                let xmlCfg = extension.settingsConfig.metricsstart.concat(extension.settingsConfig.metricscounters, extension.settingsConfig.metricsclosing1, vmId, extension.settingsConfig.metricsclosing2);
                let base64XmlCfg = new Buffer(xmlCfg).toString('base64');

                // build settings property for diagnostic extension
                temp.settings.StorageAccount = diagnosticAccountName;
                temp.settings.xmlCfg = base64XmlCfg.toString();

                // build protectedSettings property for diagnostic extension
                temp.protectedSettings.storageAccountName = diagnosticAccountName;
                temp.protectedSettings.storageAccountEndPoint = "https://core.windows.net/";
                temp.protectedSettings.storageAccountKey1 = `[listKeys('${accountResourceId}', '2015-06-15').key1]`;
            } else {
                temp.settings = extension.settingsConfig;
                temp.protectedSettings = extension.protectedSettingsConfig;
            }

            processedExtensions.extensions.push(temp);
        })
        return processedExtensions;
    },
    computerNamePrefix: (value, key, index, parent) => {
        return {
            computerName: value.concat("-vm", index + 1)
        }
    },
    adminPassword: (value, key, index, parent) => {
        if (_.toLower(parent.osAuthenticationType) === "password" && parent.osDisk.osType === "windows") {
            return {
                windowsConfiguration: {
                    "provisionVmAgent": "true"
                }
            }
        } else {
            return {
                linuxConfiguration: null
            }
        }

    },
    sshPublicKey: (value, key, index, parent) => {
        return;
    },
    passThrough: (value, key, index) => {
        let temp = {};
        temp[key] = value;
        return temp;
    }
}

let storageAccountsProcessed = false;
let availabilitySetProcessed = false;
let diagnosticStorageAccountsProcessed = false;
let processChildResources = {
    storageAccounts: (value, key, index, parent, accumulator) => {
        if (!storageAccountsProcessed) {
            let mergedCol = (accumulator["storageAccounts"] || (accumulator["storageAccounts"] = [])).concat(storageSettings.processStorageSettings(value, parent));
            accumulator.storageAccounts = mergedCol;
            storageAccountsProcessed = true;
        }
    },
    diagnosticStorageAccounts: (value, key, index, parent, accumulator) => {
        if (!diagnosticStorageAccountsProcessed) {
            let mergedCol = (accumulator["diagnosticStorageAccounts"] || (accumulator["diagnosticStorageAccounts"] = [])).concat(storageSettings.processStorageSettings(value, parent));
            accumulator.diagnosticStorageAccounts = mergedCol;
            diagnosticStorageAccountsProcessed = true;
        }
    },
    nics: (value, key, index, parent, accumulator) => {
        let col = nicSettings.processNetworkInterfaceSettings(value, parent, index);

        let mergedCol = (accumulator["nics"] || (accumulator["nics"] = [])).concat(col.nics);
        accumulator["nics"] = mergedCol;
        mergedCol = (accumulator["pips"] || (accumulator["pips"] = [])).concat(col.pips);
        accumulator["pips"] = mergedCol;
    },
    availabilitySet: (value, key, index, parent, accumulator) => {
        if (_.toLower(value.useExistingAvailabilitySet) === "no" && parent.vmCount === 1) {
            accumulator["availabilitySet"] = [];
        } else if (!availabilitySetProcessed) {
            accumulator["availabilitySet"] = avSetSettings.processAvSetSettings(value, parent);
        }
    },
    osDisk: (value, key, index, parent, accumulator) => {
        if (value.osType === "linux" && _.toLower(parent.osAuthenticationType) === "ssh") {
            accumulator["secret"] = parent.sshPublicKey;
        } else {
            accumulator["secret"] = parent.adminPassword;
        }
    },
}

function processVMStamps(param, buildingBlockSettings) {
    // resource template do not use the vmCount property. Remove from the template
    let vmCount = param.vmCount;
    param = resources.setupResources(param, buildingBlockSettings, (parentKey) => {
        return ((parentKey === null) || (parentKey === "virtualNetwork") || (parentKey === "availabilitySet") ||
            (parentKey === "nics") || (parentKey === "diagnosticStorageAccounts") || (parentKey === "storageAccounts") || (parentKey === "encryptionSettings"));
    });
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
    let processedParams = _.transform(processVMStamps(param, buildingBlockSettings), (result, n, index, parent) => {
        for (let prop in n) {
            if (typeof processChildResources[prop] === 'function') {
                processChildResources[prop](n[prop], prop, index, n, result);
            }
        }
        result.virtualMachines.push(_.transform(n, (inner, value, key, obj) => {
            _.merge(inner, (typeof processorProperties[key] === 'function') ? processorProperties[key](value, key, index, obj, _.cloneDeep(result)) : processorProperties["passThrough"](value, key, index, obj, _.cloneDeep(result)));
            return inner;
        }, {}));
        return result;
    }, { virtualMachines: [] })

    return createTemplateParameters(processedParams);
};

function createTemplateParameters(resources) {
    let templateParameters = {
        $schema: "http://schema.management.azure.com/schemas/2015-01-01/deploymentParameters.json#",
        contentVersion: "1.0.0.0",
        parameters: {

        }
    };
    templateParameters.parameters = _.transform(resources, (result, value, key, obj) => {
        if (key === "secret" && !_.isString(value)) {
            result[key] = value;
        } else {
            result[key] = {};
            result[key].value = value;
        }
        return result;
    }, {});
    return templateParameters;
};

exports.processVirtualMachineSettings = process;
exports.mergeWithDefaults = merge;
exports.validations = validate;
