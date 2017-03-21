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
let bbs = {
  subscriptionId: "49741165-F4AF-456E-B47C-637AEAB82D50",
  resourceGroup: "my-resource-group"
};

let stuff = {
  name: "blah",
  randomStuff: {
    random: "hello",
    moreRandom: "world"
  },
  substuff: {
    virtualNetworks: [
      {
        name: "my-first-vnet",
        subnets: [
          {
            name: "my-first-subnet",
            addressPrefix: "10.0.1.0/24"
          },
          {
            name: "my-second-subnet",
            addressPrefix: "10.0.2.0/24"
          }
        ]
      },
      {
        name: "my-second-vnet",
        resourceGroup: "my-other-resource-group",
        subnets: [
          {
            name: "my-first-subnet",
            addressPrefix: "10.0.1.0/24"
          },
          {
            name: "my-second-subnet",
            addressPrefix: "10.0.2.0/24"
          }
        ]
      }
    ]
  }
};

let innerStuffReference = stuff.substuff.virtualNetworks[1];
console.log(stuff);
console.log();
console.log(innerStuffReference);

let _ = require('./lodashMixins.js');

function getObject(container, object, parentKey, stack, callback) {
  if (_.isPlainObject(container)) {
    if ((parentKey === null) || (parentKey === "virtualNetworks") || (parentKey === "subnets")) {
      container.subscriptionId = stack[stack.length - 1].subscriptionId;
      container.resourceGroup = stack[stack.length - 1].resourceGroup;
    }
  }
  _.each(container, (item, keyOrIndex) => {
    //stack.push(keyOrIndex);
    // if (item === object) {
    //   callback(stack);
    // } else if (_.isPlainObject(item) || _.isArray(item)) {
    //   getObject(item, object, stack, callback);
    // }
    //stack.pop(keyOrIndex);
    let hasPushed = false;
    if (_.isPlainObject(item)) {
      if ((item.hasOwnProperty('resourceGroup')) || (item.hasOwnProperty('subscriptionId'))) {
        stack.push(_.merge({}, stack[stack.length - 1], {subscriptionId: item.subscriptionId, resourceGroup: item.resourceGroup}));
        hasPushed = true;
      }

      // Now we should update, if needed
      // if ((parentKey === "virtualNetworks") || (parentKey === null)) {
      //   item.subscriptionId = stack[stack.length - 1].subscriptionId;
      //   item.resourceGroup = stack[stack.length - 1].resourceGroup;
      // }

      getObject(item, object, _.isNumber(keyOrIndex) ? parentKey : keyOrIndex, stack, callback);

      if (hasPushed) {
        stack.pop();
      }
      // if (item === object) {
      //   callback(stack);
      // } else {
      //   getObject(item, object, stack, callback);
      // }
    } else if (_.isArray(item)) {
      getObject(item, object, keyOrIndex, stack, callback);
    }
  });
}

let stack = [bbs];
getObject(stuff, innerStuffReference, null, stack, (item) => {
  console.log(item);
});

function customizer(objValue, srcValue, key, object, source, stack) {
  // //console.log(JSON.stringify(stack));
  // console.log(key);
  // console.log(source);
  // //console.log(key);
  // console.log();
  // if (_.isPlainObject(srcValue)) {
  //   //return _.mergeWith({}, bbs, srcValue, customizer);
  // }


}

let moreStuff = _.mergeWith({}, bbs, stuff, customizer);

var server = restify.createServer();
server.get('/virtualNetwork', vnetTests);
server.get('/routeTable', routeTableTests);

server.listen(8080, function() {
  console.log('%s listening at %s', server.name, server.url);
});
