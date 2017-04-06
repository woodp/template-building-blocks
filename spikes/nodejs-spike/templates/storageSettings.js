
var fs = require('fs');
var _ = require('../lodashMixins.js');
let v = require('./validation.js');
var murmurHash = require('murmurhash-native').murmurHash64

const storageDefaultsFile = './nodejs-spike/defaults/storageSettings.json';
const diagDefaultsFile = './nodejs-spike/defaults/diagonisticStorageSettings.json';

function merge(settings, key) {
    let defaults;
    if (key === 'storageAccounts') {
        defaults = JSON.parse(fs.readFileSync(storageDefaultsFile, 'UTF-8'));
    } else {
        defaults = JSON.parse(fs.readFileSync(diagDefaultsFile, 'UTF-8'));
    }

    return v.merge(settings, defaults)
}

function validate(settings, baseObjectSettings) {
    return v.validate(settings, storageValidations, baseObjectSettings)
}

let storageValidations = {
    count: (result, parentKey, key, value, parent, baseObjectSettings) => {
        if (!_.isNumber(value) || value < 1) {
            result.push({
                name: _.join((parentKey ? [parentKey, key] : [key]), '.'),
                message: "Value should be greater than 1."
            })
        }
    }
};

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

function getUniqueString(input) {
    let buffer = murmurHash(JSON.stringify(input), 'buffer');

    return convertToBase32(0, 0, buffer);
}

function createStamps(settings, parent) {
    if (!settings.hasOwnProperty('resourceGroup')) {
        settings.resourceGroup = parent.resourceGroup;
    }
    if (!settings.hasOwnProperty('subscription')) {
        settings.subscription = parent.subscription;
    }

    // deep clone settings for the number of VMs required (vmCount)  
    return _.transform(_.castArray(settings), (result, n) => {
        for (let i = 0; i < settings.count - settings.accounts.length; i++) {
            result.push(_.cloneDeep(n));
        }
        return result;
    }, []);
}

function process(settings, parent) {
    return _.transform(createStamps(settings, parent), (result, n, index) => {
        let temp = { "sku": {} };
        let storageName = 'vm'.concat(getUniqueString(parent), n.nameSuffix, (index + 1));

        temp.resourceGroup = n.resourceGroup;
        temp.subscription = n.subscription;
        temp.kind = 'Storage';
        temp.sku.name = n.skuType;
        temp.name = storageName;
        result.push(temp);

        return result;
    }, [])
}

exports.processStorageSettings = process;
exports.mergeWithDefaults = merge;
exports.validateSettings = validate;
