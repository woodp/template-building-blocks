let restify = require('restify');
let validation = require('./templates/validation.js');
let vmSettings = require('./templates/virtualMachineSettings.js');
let virtualNetworkSettings = require('./templates/virtualNetworkSettings.js');
let routeTableSettings = require('./templates/routeTableSettings.js');

// var virtualMachinesSettingsDefaults = {
//   "computerNamePrefix": "cn",
//   "size": "Standard_DS2_v2",
//   "osType": "windows",
//   "imageReference": {
//     "publisher": "MicrosoftWindowsServer",
//     "offer": "WindowsServer",
//     "sku": "2012-R2-Datacenter",
//     "version": "latest"
//   },
//   "osDisk": {
//     "caching": "ReadWrite"
//   },
//   "extensions": [ ],
// };

// var virtualMachinesSettings = {
//   "$schema": "http://schema.management.azure.com/schemas/2015-01-01/deploymentParameters.json#",
//   "contentVersion": "1.0.0.0",
//   "parameters": {
//     "virtualMachinesSettings": {
//       "value": {
//         "namePrefix": "ra-single",
//         "size": "Standard_DS10_v2",
//         "imageReference": {
//           "version": "NOT LATEST"
//         },
//         "adminUsername": "testuser",
//         "adminPassword": "AweS0me@PW",
//         "osAuthenticationType": "password",
//         "nics": [
//           {
//             "isPublic": "true",
//             "subnetName": "web",
//             "privateIPAllocationMethod": "dynamic",
//             "publicIPAllocationMethod": "dynamic",
//             "enableIPForwarding": false,
//             "domainNameLabelPrefix": "",
//             "dnsServers": [
//             ],
//             "isPrimary": "true"
//           }
//         ],
//         "dataDisks": {
//           "count": 2,
//           "properties": {
//             "diskSizeGB": 128,
//             "caching": "None",
//             "createOption": "Empty"
//           }
//         },
//         "availabilitySet": {
//           "useExistingAvailabilitySet": "No",
//           "name": ""
//         }
//       }
//     },
//     "virtualNetworkSettings": {
//       "value": {
//         "name": "ra-single-vm-vnet",
//         "resourceGroup": "ra-single-vm-rg"
//       }
//     },
//     "buildingBlockSettings": {
//       "value": {
//         "storageAccountsCount": 1,
//         "vmCount": 1,
//         "vmStartIndex": 0
//       }
//     }
//   }
// }

// var routeTableSettings = {
//     "$schema": "http://schema.management.azure.com/schemas/2015-01-01/deploymentParameters.json#",
//     "contentVersion": "1.0.0.0",
//   "parameters": {
//     "virtualNetworkSettings": {
//       "value": {
//         "name": "bb-dev-vnet",
//         "resourceGroup": "bb-dev-rg"
//       }
//     },
//     "routeTableSettings": {
//       "value": [
//         {
//           "name": "bb-dev-web-biz-rt",
//           "subnets": [
//             "web",
//             "biz"
//           ],
//           "routes": [
//             {
//               "name": "toData",
//               "addressPrefix": "10.0.3.0/24",
//               "nextHopType": "VirtualAppliance",
//               "nextHopIpAddress": "10.0.255.224"
//             }
//           ]
//         },
//         {
//           "name": "bb-dev-data-rt",
//           "subnets": [
//             "data"
//           ],
//           "routes": [
//             {
//               "name": "toWeb",
//               "addressPrefix": "10.0.1.0/24",
//               "nextHopType": "VirtualAppliance",
//               "nextHopIpAddress": "10.0.255.224"
//             },
//             {
//               "name": "toBiz",
//               "addressPrefix": "10.0.2.0/24",
//               "nextHopType": "VirtualAppliance",
//               "nextHopIpAddress": "10.0.255.224"
//             }
//           ]
//         }
//       ]
//     }
//   }
// };

function vnetTests(req, res, next) {
  let settings = virtualNetworkSettings.transform({
    name: "ra-single-vm-vnet",
        addressPrefixes: [
          "11.0.0.0/16"
        ],
        // subnets: [
        //   {
        //     //name: "web",
        //     addressPrefix: "10.0.1.0/24"
        //   },
        //   {
        //     name: "biz"//,
        //     //addressPrefix: "10.0.2.0/24"
        //   },
        //   {
        //     name: "data",
        //     addressPrefix: "10.0.2./24"
        //   }
        // ],
        dnsServers: [ "www.microsoft.com" ]
  });

  if (settings.validationErrors) {
    res.send(400, settings.validationErrors);
  } else {
    res.send(settings);
  }
  next();
}

function routeTableTests(req, res, next) {
    let settings = routeTableSettings.transform({
      name: "route-rt",
      routes: [
        {
          name: "route1",
          addressPrefix: "10.0.1.0/24",
          nextHopType: "VnetLoca"
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
        },
        {
          name: "route4",
          addressPrefix: "10.0.4.0/24",
          nextHopType: "VirtualAppliance"
        },
        {
          name: "route5",
          addressPrefix: "10.0.4.0/24"
        },
        {
          name: "route6",
          addressPrefix: "10.0.5.0/24",
          nextHopType: "VnetLocal",
          nextHopIpAddress: "192.168.1.1"
        },
        {
          name: "route7",
          addressPrefix: "10.0.4.0/24",
          nextHopType: "VirtualAppliance",
          nextHopIpAddress: "192.168.1."
        }
      ]
    });

  if (settings.validationErrors) {
    res.send(400, settings.validationErrors);
  } else {
    res.send(settings);
  }
  next();
}

let blah = validation.utilities.resourceId("big-long-guid-here", "resource-group-name-here", "Microsoft.Network/virtualNetworks", "my-virtual-network", "my-subnet-name");
let blah2 = validation.utilities.resourceId("big-long-guid-here", "resource-group-name-here", "Microsoft.Network/virtualNetworks/subnets", "my-virtual-network", "my-subnet-name");
var server = restify.createServer();
server.get('/virtualNetwork', vnetTests);
server.get('/routeTable', routeTableTests);

server.listen(8080, function() {
  console.log('%s listening at %s', server.name, server.url);
});
