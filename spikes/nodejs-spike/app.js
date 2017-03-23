//import _ from 'lodash';

//var restify = require('restify');
//var merge = require('lodash.merge');

//var _ = require('lodash');

var _ = require('./lodashMixins.js');
var vmSettings = require('./templates/virtualMachineSettings.js');
let vnetSettings = require('./templates/virtualNetworkSettings.js');
let routeSettings = require('./templates/routeTableSettings.js');
let storageSettings = require('./templates/storageSettings.js');

// Add some utility functions to lodash
// _.mixin({
//   'isNullOrWhitespace' : function(string) {
//     string = _.toString(string);
//     return !string || !string.trim();
//   },
//   'paths': function(obj, parentKey) {
//     var result;
//     if (_.isArray(obj)) {
//       var idx = 0;
//       result = _.flatMap(obj, function (obj) {
//         return _.paths(obj, (parentKey || '') + '[' + idx++ + ']');
//       });
//     }
//     else if (_.isPlainObject(obj)) {
//       result = _.flatMap(_.keys(obj), function (key) {
//         return _.map(_.paths(obj[key], key), function (subkey) {
//           return (parentKey ? parentKey + '.' : '') + subkey;
//         });
//       });
//     }
//     else {
//       result = [];
//     }
//     return _.concat(result, parentKey || []);
// }
// });

var testParameters = {
  "$schema": "http://schema.management.azure.com/schemas/2015-01-01/deploymentParameters.json#",
  "contentVersion": "1.0.0.0",
  "parameters": {
    "virtualNetworkSettings": {
      "value": {
        "name": "ra-single-vm-vnet",
        "addressPrefixes": [
          "10.0.0.0/16"
        ],
        "subnets": [
          {
            "name": "web",
            "addressPrefix": "10.0.1.0/24"
          },
          {
            "name": "biz",
            "addressPrefix": "10.0.2.0/24"
          },
            {
            "name": "data",
            "addressPrefix": "10.0.3.0/24"
          }
        ],
        "dnsServers": [ ]
      }
    }
  }
};

var testParameters2 = {
  "$schema": "http://schema.management.azure.com/schemas/2015-01-01/deploymentParameters.json#",
  "contentVersion": "1.0.0.0",
  "parameters": {
    "virtualNetworkSettings": {
      "value": {
        "name": "ra-single-vm-vnet",
        "addressPrefixes": [
          "10.0.0.0/16"
        ],
        "subnets": [
          {
            "name": "web",
            "addressPrefix": "10.0.1.0/24"
          },
          {
            "name": "biz",
            "addressPrefix": "10.0.2.0/24"
          },
            {
            "name": "data",
            "addressPrefix": "10.0.3.0/24"
          }
        ],
        "dnsServers": null
      }
    }
  }
};

var testParameters3 = {
  "$schema": "http://schema.management.azure.com/schemas/2015-01-01/deploymentParameters.json#",
  "contentVersion": "1.0.0.0",
  "parameters": {
    "virtualNetworkSettings": {
      "value": {
        "name": "ra-single-vm-vnet",
        "addressPrefixes": [
          "10.0.0.0/16"
        ],
        "subnets": [
          {
            "name": "web",
            "addressPrefix": "10.0.1.0/24"
          },
          {
            "name": "biz",
            "addressPrefix": "10.0.2.0/24"
          },
            {
            "name": "data",
            "addressPrefix": "10.0.3.0/24"
          }
        ]
      }
    }
  }
};

var testParameters4 = {
  "$schema": "http://schema.management.azure.com/schemas/2015-01-01/deploymentParameters.json#",
  "contentVersion": "1.0.0.0",
  "parameters": {
    "virtualNetworkSettings": {
      "value": {
        "name": "ra-single-vm-vnet",
        "addressPrefixes": [
          "10.0.0.0/16"
        ],
        "subnets": [
          {
            "name": "web",
            "addressPrefix": "10.0.1.0/24"
          },
          {
            "name": "biz",
            "addressPrefix": "10.0.2.0/24"
          },
            {
            "name": "data",
            "addressPrefix": "10.0.3.0/24"
          }
        ],
        "dnsServers": [ "www.microsoft.com" ]
      }
    }
  }
};

var virtualNetworkSettingsDefaults = {
  "addressPrefixes": [],
  "subnets": [],
  "dnsServers": []
};

var virtualMachinesSettingsDefaults = {
  "computerNamePrefix": "cn",
  "size": "Standard_DS2_v2",
  "osType": "windows",
  "imageReference": {
    "publisher": "MicrosoftWindowsServer",
    "offer": "WindowsServer",
    "sku": "2012-R2-Datacenter",
    "version": "latest"
  },
  "osDisk": {
    "caching": "ReadWrite"
  },
  "extensions": [ ],
};

var virtualMachinesSettings = {
        "vmCount": 3,
        "namePrefix": "ra-single",
        "size": "Standard_DS10_v2",
        "imageReference": {
          "version": "NOT LATEST"
        },
        "adminUsername": "testuser",
        "adminPassword": "AweS0me@PW",
        "osAuthenticationType": "ssh",
        "nics": [
          {
            "isPublic": "true",
            "subnetName": "web",
            "privateIPAllocationMethod": "dynamic",
            "publicIPAllocationMethod": "dynamic",
            "enableIPForwarding": false,
            "domainNameLabelPrefix": "",
            "dnsServers": [
            ],
            "isPrimary": "true"
          }
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

var routeTableSettings = {
    "$schema": "http://schema.management.azure.com/schemas/2015-01-01/deploymentParameters.json#",
    "contentVersion": "1.0.0.0",
  "parameters": {
    "virtualNetworkSettings": {
      "value": {
        "name": "bb-dev-vnet",
        "resourceGroup": "bb-dev-rg"
      }
    },
    "routeTableSettings": {
      "value": [
        {
          "name": "bb-dev-web-biz-rt",
          "subnets": [
            "web",
            "biz"
          ],
          "routes": [
            {
              "name": "toData",
              "addressPrefix": "10.0.3.0/24",
              "nextHopType": "VirtualAppliance",
              "nextHopIpAddress": "10.0.255.224"
            }
          ]
        },
        {
          "name": "bb-dev-data-rt",
          "subnets": [
            "data"
          ],
          "routes": [
            {
              "name": "toWeb",
              "addressPrefix": "10.0.1.0/24",
              "nextHopType": "VirtualAppliance",
              "nextHopIpAddress": "10.0.255.224"
            },
            {
              "name": "toBiz",
              "addressPrefix": "10.0.2.0/24",
              "nextHopType": "VirtualAppliance",
              "nextHopIpAddress": "10.0.255.224"
            }
          ]
        }
      ]
    }
  }
};

function isValidCIDR(cidr) {
    //var match = cidr.match('^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/([0-9]|[1-2][0-9]|3[0-2]))$');
    var match = cidr.match('^(?:([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.)(?:([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.)(?:([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.)([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(?:\/([0-9]|[1-2][0-9]|3[0-2]))$');
    return match !== null;
}

function routeTables(parameters) {
    var settings = parameters.parameters.routeTableSettings.value;
    return settings.map((rt, i) => {
        return routeTable(parameters, i);
    })
}

function routeTable(parameters, index) {

    var routeTableSetting = parameters.parameters.routeTableSettings.value[index];
    var routeTable = {
        "name": routeTableSetting.name,
        "properties": {
            "routes": routeTableSetting.routes.map((r, i) => {
                if (!isValidCIDR(r.addressPrefix)) {
                    throw "Invalid CIDR";
                }
                var route = {
                    "name": r.name,
                    "properties": {
                        "addressPrefix": r.addressPrefix,
                        "nextHopType": r.nextHopType
                    }
                };

                if (r.nextHopType == "VirtualAppliance") {
                    route.properties.nextHopIpAddress = r.nextHopIpAddress;
                }

                return route;
            })
        }
    };

    return routeTable;
}

function mapRouteTableSettings(req, res, next) {
    res.send(routeTables(routeTableSettings));
    next();
}
function respond(req, res, next) {
  res.send('hello ' + req.params.name);
  next();
}

function parameters(req, res, next) {
    var param = null;
    switch (req.params.number) {
        case "1":
            param = testParameters;
            break;
        case "2":
            param = testParameters2;
            break;
        case "3":
            param = testParameters3;
            break;
        case "4":
            param = testParameters4;
            break;
    }
  res.send(mapVirtualNetworkSettings(param));
  next();
}

function mapVirtualNetworkSettings(parameter) {
    var virtualNetworkSettings = {
        "name": parameter.parameters.virtualNetworkSettings.value.name,
        "properties": {
            "mode": "Incremental",
            "addressSpace": {
                "addressPrefixes": parameter.parameters.virtualNetworkSettings.value.addressPrefixes
            },
            "subnets": parameter.parameters.virtualNetworkSettings.value.subnets.map(function (arg) {
                return {
                    "name": arg.name,
                    "properties": {
                        "addressPrefix": arg.addressPrefix
                    }
                }
            }),
            // We should always put a dhcpOptions with an empty dnsServers array so we can change this in the future more easily
            "dhcpOptions": {
                "dnsServers": []
            }
        }
    };

    //if (parameter.parameters.virtualNetworkSettings.value.hasOwnProperty('dnsServers')) {
    if (Array.isArray(parameter.parameters.virtualNetworkSettings.value.dnsServers) && parameter.parameters.virtualNetworkSettings.value.dnsServers.length) {
        virtualNetworkSettings.properties.dhcpOptions.dnsServers = parameter.parameters.virtualNetworkSettings.value.dnsServers;
    }

    return virtualNetworkSettings;
}

// function paths(obj, parentKey) {
//   var result;
//   if (_.isArray(obj)) {
//     var idx = 0;
//     result = _.flatMap(obj, function (obj) {
//       return paths(obj, (parentKey || '') + '[' + idx++ + ']');
//     });
//   }
//   else if (_.isPlainObject(obj)) {
//     result = _.flatMap(_.keys(obj), function (key) {
//       return _.map(paths(obj[key], key), function (subkey) {
//         return (parentKey ? parentKey + '.' : '') + subkey;
//       });
//     });
//   }
//   else {
//     result = [];
//   }
//   return _.concat(result, parentKey || []);
// }

// function isNullOrWhitespace(input) {
//   return !input || !input.trim();
// }

function mergeWithDefaults(defaults, object) {
  // If defaults is nullish, there must not be defaults, so return the object.
  if (_.isNil(defaults)) {
    return object;
  }

  // Get the paths for all of the default values.
  var keyPaths = _.paths(defaults);
  // Pick only the values that have defaults, so we remove extra stuff
  var picked = _.pick(object, keyPaths);
  // Merge with an empty object so we don't mutate our parameters.
  return _.merge({}, defaults, picked);
}

function objectMerge(req, res, next) {
  //var defaults = merge({}, virtualMachinesSettingsDefaults, virtualMachinesSettings.parameters.virtualMachinesSettings.value);
  //virtualMachinesSettings.parameters.virtualMachinesSettings.value = defaults;
  //res.send(virtualMachinesSettings);
  //res.send(_.keysIn(virtualMachinesSettingsDefaults));
  //res.send(paths(virtualMachinesSettingsDefaults));
  var testString = "";
  var testResult = _.isNullOrWhitespace(testString);
  testString = null;
  testResult =_.isNullOrWhitespace(testString);
  testString = "     ";
  testResult = _.isNullOrWhitespace(testString);
  testString = "hello";
  testResult =_.isNullOrWhitespace(testString);
  // var keyPaths = _.paths(virtualMachinesSettingsDefaults);
  // // Remove all extra properties from the parameter
  // var picked = _.pick(virtualMachinesSettings.parameters.virtualMachinesSettings.value, keyPaths);
  // var defaults = _.merge({}, virtualMachinesSettingsDefaults, picked);
  // //res.send(picked);
  // //res.send(defaults);
  // We have our base settings, overridden by the parameters, so build out the variable bits.

  //var merged = mergeWithDefaults(virtualMachinesSettingsDefaults, virtualMachinesSettings.parameters.virtualMachinesSettings.value);
  let merged = vmSettings.mergeWithDefaults(virtualMachinesSettings.parameters.virtualMachinesSettings.value);
  // test errors
  delete merged.computerNamePrefix;
  //vmSettings.validateRequiredSettings(merged);
  //delete virtualMachinesSettings.parameters.virtualMachinesSettings.value.imageReference;
  vmSettings.validateRequiredSettings(virtualMachinesSettings.parameters.virtualMachinesSettings.value);

  res.send(merged);
  next();
}

function vnetTests(req, res, next) {
  let settings = vnetSettings.validateRequiredSettings({
    "name": "ra-single-vm-vnet",
        "addressPrefixes": [
          "10.0.0.0/16"
        ],
        "subnets": [
          {
            "name": "web",
            "addressPrefix": "10.0.1.0/24"
          },
          {
            "name": "biz"//,
            //"addressPrefix": "10.0.2.0/24"
          }
        ],
        "dnsServers": [ "www.microsoft.com" ]
  });

  settings = vnetSettings.transform(settings);
  res.send(settings);
  next();
}

function routeTableTests(req, res, next) {
  // Bad settings!
  // let settings = routeSettings.validateRequiredSettings({
  //   name: "route-rt",
  //   routes: [
  //     {
  //       name: "route1",
  //       addressPrefix: "10.0.1.0/24",
  //       nextHopType: "VnetLoca"
  //     },
  //     {
  //       name: "route2",
  //       addressPrefix: "10.0.2.0/24",
  //       nextHopType: "VirtualNetworkGateway"
  //     },
  //     {
  //       name: "route3",
  //       addressPrefix: "10.0.3.0/24",
  //       nextHopType: "VirtualAppliance",
  //       nextHopIpAddress: "192.168.1.1"
  //     },
  //     {
  //       name: "route4",
  //       addressPrefix: "10.0.4.0/24",
  //       nextHopType: "VirtualAppliance"
  //     },
  //     {
  //       name: "route5",
  //       addressPrefix: "10.0.4.0/24"
  //     },
  //     {
  //       name: "route6",
  //       addressPrefix: "10.0.5.0/24",
  //       nextHopType: "VnetLocal",
  //       nextHopIpAddress: "192.168.1.1"
  //     },
  //     {
  //       name: "route7",
  //       addressPrefix: "10.0.4.0/24",
  //       nextHopType: "VirtualAppliance",
  //       nextHopIpAddress: "192.168.1."
  //     }
  //   ]
  // });
}

/*let settings = routeSettings.validateRequiredSettings({
    name: "route-rt",
    routes: [
      {
        name: "route1",
        addressPrefix: "10.0.1.0/24",
        nextHopType: "VnetLocal"
      },
      {
        name: "route2",
        addressPrefix: "10.0.2.0/24",
        nextHopType: "VirtualNetworkGateway"
      },
      {
        name: "route3",
        addressPrefix: "10.0.3.0/24",
        nextHopType: "VirtualAppliance",
        nextHopIpAddress: "192.168.1.1"
      }
    ]
  });

  if (settings.settings) {
    res.send(routeSettings.transform(settings.settings));
  } else if (settings.missingFields) {
    res.send(400, settings.missingFields);
  }
  next();
}*/


//let storageParams = storageSettings.processStorageSettings("testname", "test", 3);


let vmParams = vmSettings.processVirtualMachineSettings(virtualMachinesSettings);


// var server = restify.createServer();
// server.get('/hello/:name', respond);
// server.head('/hello/:name', respond);
// server.get('/parameters/:number', parameters);
// server.get('/routeTables', mapRouteTableSettings);
// server.get('/merge', objectMerge);
// server.get('/vnet', vnetTests);
// server.get('/routeTable', routeTableTests);

// server.listen(8080, function() {
//   console.log('%s listening at %s', server.name, server.url);
// })
