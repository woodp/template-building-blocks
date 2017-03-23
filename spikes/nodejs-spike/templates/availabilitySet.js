var _ = require('../lodashMixins.js');

function process(settings, parent){
    let template = {
      "name": "",
      "properties": {
        "platformFaultDomainCount": "",
        "platformUpdateDomainCount": ""
      }
    };

    template.name = settings.name;
    template.properties.platformFaultDomainCount = settings.platformFaultDomainCount;
    template.properties.platformUpdateDomainCount = settings.platformUpdateDomainCount;

    return template;
}


exports.processAvailabilitySetSettings = function (settings, parent) {
    return process(settings, parent);
}