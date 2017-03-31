
var fs = require('fs');
var _ = require('../lodashMixins.js');
var murmurHash = require('murmurhash-native').murmurHash64

const defaultsFile = './nodejs-spike/defaults/storageSettings.json';


function convertToBase32(carryOverValue, carryOverBits, buffer) {
  if (buffer.length === 0) return "";

  let charSet = "abcdefghijklmnopqrstuvwxyz234567";
  let base32String = "";
  let valueToProcess = carryOverValue * 256 + buffer[0];
  let bitsCount = carryOverBits + 8;

  do {
    let value = valueToProcess;
    if (bitsCount >= 5) {
      bitsCount -= 5;
      value = valueToProcess >> bitsCount;
    }
    base32String += charSet[value];
    value <<= bitsCount;
    valueToProcess -= value;
  } while (valueToProcess > 32 || (buffer.length === 1 && valueToProcess > 0));

  base32String += convertToBase32(valueToProcess, bitsCount, buffer.slice(1));
  return base32String;
}

function getUniqueString(input){
    let buffer = murmurHash(JSON.stringify(input), 'buffer');

    return convertToBase32(0, 0, buffer);
}

function mergeWithDefaults(settings) {
    if (!settings.hasOwnProperty("skuType") || _.isNullOrWhitespace(settings.skuType)) {
        let defaults = JSON.parse(fs.readFileSync(defaultsFile, 'UTF-8'));
        settings.skuType = defaults.sku;
    }
    return settings;
};


function createStamps(settings, parent) {
    // Use resourceGroup and subscription from parent if not not specified
    let stamp = {
        "resourceGroup": settings.resourceGroup || parent.resourceGroup,
        "subscription": settings.subscription || parent.subscription,
        "kind": "Storage",
        "sku": {
            "name": settings.skuType
        }
    };

    // deep clone settings for the number of VMs required (vmCount)  
    return _.transform(_.castArray(stamp), (result, n) => {
        for (let i = 0; i < settings.count - settings.accounts.length; i++) {
            result.push(_.cloneDeep(n));
        }
        return result;
    }, []);
}

function buildStorageParameters(settings, parent) {
    return _.transform(createStamps(settings, parent), (result, n, index) => {
        let storageName = 'vm'.concat(getUniqueString(parent), 'st', (index + 1));
        n.name = storageName;
        result.push(n);
        return result;
    }, [])
}

function validate(settings) { }

exports.processStorageSettings = function (settings, parent) {
    // TODO
    validate(settings);

    skuType = mergeWithDefaults(settings);

    return buildStorageParameters(settings, parent);
}
