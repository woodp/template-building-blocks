
var fs = require('fs');
var _ = require('../lodashMixins.js');
let v = require('./validation.js');

const defaultsPath = './defaults/availabilitySetSettings.json';

function merge(settings) {
  let defaults = JSON.parse(fs.readFileSync(defaultsPath, 'UTF-8'));

  return v.merge(settings, defaults)
}

let validUseExistingAvailabilitySetValues = ['yes', 'no'];

let isValidUseExistingAvailabilitySet = (useExistingAvailabilitySet) => {
    return v.utilities.isStringInArray(useExistingAvailabilitySet, validUseExistingAvailabilitySetValues);
};

let availabilitySetValidations = {
  useExistingAvailabilitySet: (value, parent) => {
    return {
        result: isValidUseExistingAvailabilitySet(value),
        message: `Valid values are ${validUseExistingAvailabilitySetValues.join(',')}`
    };
  },
  platformFaultDomainCount: _.isFinite,
  platformUpdateDomainCount: _.isFinite,
  name: v.utilities.isNotNullOrWhitespace,
};

function process(settings, parent) {
  if (_.toLower(settings.useExistingAvailabilitySet) === "yes") {
    return [];
  }

  let instance = {
    name: settings.name,
    properties: {
      platformFaultDomainCount: settings.platformFaultDomainCount,
      platformUpdateDomainCount: settings.platformUpdateDomainCount
    }
  };

  if(parent.storageAccounts.managed){
    instance.properties.managed = true;
  }

  return _.castArray(instance)
}

exports.processAvSetSettings = process;
exports.mergeWithDefaults = merge;
exports.validations = availabilitySetValidations;
