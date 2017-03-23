var _ = require('../lodashMixins.js');
var fs = require('fs');
var storageSettings = require('./storageSettings.js');

const defaultsFile = './nodejs-spike/defaults/virtualMachinesSettings.json';

let output = {};
output.storageAccounts = [];

// merge with the defaults
function mergeWithDefaults (settings) {
  let defaults = JSON.parse(fs.readFileSync(defaultsFile, 'UTF-8'));

  // Merge with an empty object so we don't mutate our parameters.
  return _.mergeWith(defaults, settings, defaultsCustomizer);
};

// if nics and extensions are not specified in the parameters use from defaults, else ignore defaults
function defaultsCustomizer(objValue, srcValue, key){
    if(key === "nics" || key === "extensions"){
        if(_.isArray(srcValue) && srcValue.length > 0) {
            objValue.splice(0, 1);
        }
    }
};

// TODO
function validateParameters(){

}

let processor = {
    computerNamePrefix: (value, key, index, parent) => {
        let temp = {};
        temp.computerName = value.concat("-vm", index + 1);
        return temp;
    },    
    osType: (value, key, index, parent) => {
        let temp = {};
        let propName = value.concat("Configuration");
        if(value === "linux" && parent.osAuthenticationType === "ssh") {
            temp[propName] = {
                "adminPassword": null,
                "configuration": {
                    "disablePasswordAuthentication": "true",
                    "ssh": {
                        "publicKeys": [
                            {
                                "path": '/home/'.concat(parent.adminUsername, '/.ssh/authorized_keys'),
                                "keyData": parent.sshPublicKey
                            }
                        ]
                    }
                }
            };

            delete parent.sshPublicKey;
        } else {
             temp[propName] = {
                "adminPassword": parent.adminPassword,
                "configuration": null
            };
            delete parent.adminPassword;
        }

        delete parent.adminPassword;
        delete parent.osAuthenticationType;
        return temp;
    }, 
    osDisk: (value, key, index, parent) => {
        let temp = {"osDisk": {}};
        let stroageAccountToUse = index % output.storageAccounts.length;

        temp.osDisk.name = parent.name.concat('-os.vhd');
        temp.osDisk.vhd = 'http://'.concat(output.storageAccounts[stroageAccountToUse].name, '.blob.core.windows.net/vhds/', parent.name, '-os.vhd' );
        temp.osDisk.createOption = value.createOption;
        temp.osDisk.caching = value.caching;
        return temp;
    },      
    dataDisks: (value, key, index, parent) => {
        let temp = {"dataDisks": []};
        let stroageAccountToUse = index % output.storageAccounts.length;

        for(let i=0; i < value.count; i++){
            let instance = {};
            instance.name = 'dataDisk'.concat(i + 1);
            instance.diskSizeGB = value.properties.diskSizeGB;
            instance.lun = i;
            instance.vhd = 'http://'.concat(output.storageAccounts[stroageAccountToUse].name, '.blob.core.windows.net/vhds/', parent.name, '-dataDisk', (i + 1), '.vhd');
            instance.caching = value.properties.caching;
            instance.createOption = value.properties.createOption;

            temp.dataDisks.push(instance);
        }
        return temp;
    },

    passThrough: (value, key, index) => {
        let temp = {};
        temp[key] = value;
        return temp;
    }
}

let storageAccountsProcessed = false;
let processChildResources = {
    storageAccounts: (value, key, index, parent) => {
        if(!storageAccountsProcessed){
            output.storageAccounts =  output.storageAccounts.concat(storageSettings.processStorageSettings("testNamePrefix", value.skuType, value.count));
            storageAccountsProcessed = true;
        }
        // wont be needing the storageAccounts proerty in the VM settings anymore
        delete parent.storageAccounts;
    }
}

function processVMStamps(param){
    // resource template do not use the vmCount property. Remove from the template
    let vmCount = param.vmCount;
    delete param.vmCount;

    // deep clone settings for the number of VMs required (vmCount)  
    return _.transform(_.castArray(param), (result, n) => {
        for(let i=0; i< vmCount; i++){
            let stamp = _.cloneDeep(n);
            stamp.name = n.namePrefix.concat("-vm", i + 1)

            // delete namePrefix property since we wont need it anymore
            delete stamp.namePrefix;
            result.push(stamp);
        }
        return result;
    }, []);
}

function processParameter(param){
    output.virtualMachines = _.transform(processVMStamps(param), (result, n, index, parent) => {
        for(let prop in n) {
            if(typeof processChildResources[prop] === 'function'){
                processChildResources[prop](n[prop], prop, index, parent[index]);
            }
        }
        result.push(_.transform(n, (inner, value, key, obj) => {
            _.merge(inner, (typeof processor[key] === 'function')? processor[key](value, key, index, obj): processor["passThrough"](value, key, index, obj));
            return inner;
        }, {}));
        return result;
    }, [] )
};

exports.processVirtualMachineSettings = function (settings) {
    let result = mergeWithDefaults(settings);

    validateParameters();

    processParameter(result);
    console.log(JSON.stringify(output));
}
