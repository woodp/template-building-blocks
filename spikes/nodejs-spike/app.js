let _ = require('./lodashMixins.js');
let vnetSettings = require('./templates/virtualNetworkSettings.js');
let vmSettings = require('./templates/virtualMachineSettings.js');

let routeSettings = require('./templates/routeTableSettings.js');
var virtualMachinesSettings = {
  "vmCount": 4,
  "namePrefix": "ra-single",
  "size": "Standard_DS10_v2",
  "imageReference": {
    "version": "NOT LATEST"
  },
  "adminUsername": "testuser",
  "adminPassword": "AweS0me@PW",
  "osAuthenticationType": "ssh",
  "nics": [

  ],
  "dataDisks": {
    "subscriptionId": "13321",
    "resourceGroup": "abc",
    "count": 3,
    "properties": {
      "diskSizeGB": 512,
      "caching": "None",
      "createOption": "Empty"
    }
  },
  "availabilitySet": {
    "subscriptionId": "13321",
    "resourceGroup": "abc",
    "useExistingAvailabilitySet": "No",
    "name": "test-as"
  }
}

let buildingBlockSettings = {
  "resourceGroup": "rg1",
  "subscription": "testsub"
}

let vmParams = vmSettings.processVirtualMachineSettings(virtualMachinesSettings, buildingBlockSettings);
