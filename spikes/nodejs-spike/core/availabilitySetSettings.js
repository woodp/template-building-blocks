
var fs = require('fs');
var _ = require('../lodashMixins.js');
let v = require('./validation.js');

const defaultsPath = './defaults/availabilitySetSettings.json';

function merge(settings) {
  let defaults = JSON.parse(fs.readFileSync(defaultsPath, 'UTF-8'));

  return v.merge(settings, defaults)
}

let availabilitySetValidations = {
  useExistingAvailabilitySet: (result, parentKey, key, value, parent, baseObjectSettings) => {
    if (_.isNullOrWhitespace(value) || (_.toLower(value) !== 'yes' && _.toLower(value) !== 'no')) {
      result.push({
        name: _.join((parentKey ? [parentKey, key] : [key]), '.'),
        message: "Invalid value provided for 'useExistingAvailabilitySet'. Valid values are: 'yes', 'no'."
      })
    }
  },
  platformFaultDomainCount: v.validationUtilities.isNumber,
  platformUpdateDomainCount: v.validationUtilities.isNumber,
  name: v.validationUtilities.isNullOrWhitespace,
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
