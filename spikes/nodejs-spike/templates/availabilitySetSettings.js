
var fs = require('fs');
var _ = require('../lodashMixins.js');

function buildAvSetParameters(settings, parent) {
  if (_.toLower(settings.useExistingAvailabilitySet) === "yes") {
    return [];
  }
  // Use resourceGroup and subscription from parent if not not specified 
  let instance = {
    "resourceGroup": settings.resourceGroup || parent.resourceGroup,
    "subscription": settings.subscription || parent.subscription,
    "name": settings.name,
    "properties": {
      "platformFaultDomainCount": settings.platformFaultDomainCount,
      "platformUpdateDomainCount": settings.platformUpdateDomainCount
    }
  };

  return _.castArray(instance)
}

exports.processAvSetSettings = function (settings, parent) {
  return buildAvSetParameters(settings, parent);
  // console.log(JSON.stringify(finalResult));
}
