
var fs = require('fs');
var _ = require('../lodashMixins.js');

const defaultsFile = './nodejs-spike/defaults/storageSettings.json';

function mergeWithDefaults(skuType) {
    if (_.isNullOrWhitespace(skuType)) {
        let defaults = JSON.parse(fs.readFileSync(defaultsFile, 'UTF-8'));
        return defaults.sku;
    }
    return skuType;
};


function createStamps(skuType, count) {
    let stamp = {
        "kind": "Storage",
        "sku": {
            "name": skuType
        }
    };
    // deep clone settings for the number of VMs required (vmCount)  
    return _.transform(_.castArray(stamp), (result, n) => {
        for (let i = 0; i < count; i++) {
            result.push(_.cloneDeep(n));
        }
        return result;
    }, []);
}

function buildStorageParameters(namePrefix, skuType, count) {
    return _.transform(createStamps(skuType, count), (result, n, index) => {
        let storageName = 'vm'.concat(namePrefix, 'st', (index + 1));
        n.name = storageName;
        result.push(n);
        return result;
    }, [])
}

function validate(namePrefix, skuType) { }

exports.processStorageSettings = function (namePrefix, skuType, count) {
    // TODO
    validate(namePrefix, skuType);

    skuType = mergeWithDefaults(skuType);

    return buildStorageParameters(namePrefix, skuType, count);
    // let finalResult = buildStorageParameters(namePrefix, skuType, count);
    // console.log(JSON.stringify(finalResult));
}
