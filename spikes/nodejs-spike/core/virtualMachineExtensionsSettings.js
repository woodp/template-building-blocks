let _ = require('lodash');
var fs = require('fs');
let v = require('./validation.js');
var resources = require('./resources.js');
let rewire = require('rewire');

function merge(settings) {
    return settings;
}

let vmExtensionValidations = {
    vms: (value, parent) => {
        if (_.isNil(value) || !_.isArray(value) || value.length === 0) {
            return {
                result: false,
                message: 'Value (Array) cannot be null, undefined or empty'
            };
        } else {
            return {
                result: true
            }
        }
    },
    extensions: (value, parent) => {
        if (_.isNil(value) || !_.isArray(value) || value.length === 0) {
            return {
                result: false,
                message: 'Value (Array) cannot be null, undefined or empty'
            };
        }
        let extensionValidations = {
            name: v.validationUtilities.isNotNullOrWhitespace,
            publisher: v.validationUtilities.isNotNullOrWhitespace,
            type: v.validationUtilities.isNotNullOrWhitespace,
            typeHandlerVersion: v.validationUtilities.isNotNullOrWhitespace,
            autoUpgradeMinorVersion: v.validationUtilities.isBoolean,
            settings: v.validationUtilities.isValidJsonObject,
            protectedSettings: v.validationUtilities.isValidJsonObject
        }
         return {
            validations: extensionValidations
        };
    },
};

function validate(settings) {
    return v.validate({
        settings: settings,
        validations: vmExtensionValidations
    });
}

function process(param, buildingBlockSettings) {
    let accumulator = { extensions: [] };
    param.forEach((value) => {
        value.extensions.forEach((ext) => {
            let setting = {
                name: ext.name,
                vms: value.vms
            };

            if (ext.protectedSettings.hasOwnProperty('reference') && ext.protectedSettings.reference.hasOwnProperty('keyVault')) {
                setting.extensionProtectedSettings = ext.protectedSettings;
            } else {
                setting.extensionProtectedSettings = { value: JSON.stringify(ext.protectedSettings) };
            }
            let extension = _.cloneDeep(ext);
            delete extension.protectedSettings;
            delete extension.name;
            setting.extensionSettings = extension;
            accumulator.extensions.push(setting);
        });
    });
    return accumulator;
}

function createTemplateParameters(resources) {
    let templateParameters = {
        $schema: 'http://schema.management.azure.com/schemas/2015-01-01/deploymentParameters.json#',
        contentVersion: '1.0.0.0',
        parameters: {

        }
    };
    templateParameters.parameters = _.transform(resources, (result, value, key) => {
        result[key] = {};
        result[key].value = value;
        return result;
    }, {});
    return templateParameters;
}

function getTemplateParameters(param, buildingBlockSettings) {
    let processedParams = mergeAndProcess(param, buildingBlockSettings);
    return createTemplateParameters(processedParams);
}

function mergeAndProcess(param, buildingBlockSettings) {
    return process(merge(param), buildingBlockSettings);
}

exports.processvirtualMachineExtensionsSettings = mergeAndProcess;
exports.mergeWithDefaults = merge;
exports.validations = validate;
exports.getTemplateParameters = getTemplateParameters;