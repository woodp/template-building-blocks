'use strict';

var fs = require('fs');
var _ = require('lodash');
let v = require('./validation.js');

const defaultsPath = './defaults/availabilitySetSettings.json';

function merge(settings) {
    let defaults = JSON.parse(fs.readFileSync(defaultsPath, 'UTF-8'));

    return v.merge(settings, defaults);
}

let availabilitySetValidations = {
    useExistingAvailabilitySet: v.validationUtilities.isBoolean,
    platformFaultDomainCount: (value) => {
        return {
            result: ((_.isFinite(value)) && value > 0 && value <= 3),
            message: 'Value must be greater than 0 and less than 3'
        };
    },
    platformUpdateDomainCount: (value) => {
        return {
            result: ((_.isFinite(value)) && value > 0 && value <= 20),
            message: 'Value must be greater than 0 and less tham 20'
        };
    },
    name: v.validationUtilities.isNotNullOrWhitespace
};

function process(settings, parent) {
    if (settings.useExistingAvailabilitySet) {
        return [];
    }

    let instance = {
        name: settings.name,
        properties: {
            platformFaultDomainCount: settings.platformFaultDomainCount,
            platformUpdateDomainCount: settings.platformUpdateDomainCount
        }
    };

    if (parent.storageAccounts.managed) {
        instance.properties.managed = true;
    }

    return _.castArray(instance);
}

exports.processAvSetSettings = process;
exports.mergeWithDefaults = merge;
exports.validations = availabilitySetValidations;
