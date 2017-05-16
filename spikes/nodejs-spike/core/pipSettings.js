let _ = require('../lodashMixins.js');

function merge(settings) {
    return settings;
}

function process(publicIPSettings) {
    let instance = {};
    return _.transform(_.castArray(instance), (result) => {
        instance = {
            name: `${publicIPSettings.namePrefix}-pip`,
            properties: {
                publicIPAllocationMethod: publicIPSettings.publicIPAllocationMethod
            }
        };

        if (!_.isNullOrWhitespace(publicIPSettings.domainNameLabel)) {
            instance.properties.dnsSettings = {};
            instance.properties.dnsSettings.domainNameLabel = publicIPSettings.domainNameLabel;
        }
        result.push(instance);
        return result;
    }, []);
}

exports.processPipSettings = process;
exports.mergeWithDefaults = merge;
