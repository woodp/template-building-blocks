let restify = require('restify');
let validation = require('./templates/validation.js');
let vmSettings = require('./templates/virtualMachineSettings.js');
let virtualNetwork = require('./templates/virtualNetworkSettings.js');
let routeTables = require('./templates/routeTableSettings.js');
let r = require('./templates/resources.js');

let virtualNetworkSettings = [
  {
    name: "my-virtual-network",
    addressPrefixes: [
      "10.0.0.0/16"
    ],
    subnets: [
      {
        name: "web",
        addressPrefix: "10.0.1.0/24"
      },
      {
        name: "biz",
        addressPrefix: "10.0.2.0/24"
      }
    ],
    dnsServers: []
  },
  {
    name: "my-other-virtual-network",
    addressPrefixes: [
      "10.0.0.0/16"
    ],
    subnets: [
      {
        name: "web",
        addressPrefix: "10.0.1.0/24"
      },
      {
        name: "biz",
        addressPrefix: "10.0.2.0/24"
      }
    ],
    dnsServers: []
  }
];

function vnetTests(req, res, next) {
  let settings = virtualNetwork.transform(virtualNetworkSettings, {
      subscriptionId: "49741165-F4AF-456E-B47C-637AEAB82D50",
      resourceGroupName: "my-resource-group"
    });

  if (settings.validationErrors) {
    res.send(400, settings.validationErrors);
  } else {
    res.send(settings);
  }
  next();
}

let routeTableSettings = [
  {
      name: "route-rt",
      virtualNetworks: [
        {
          name: "my-virtual-network",
          subnets: [
            {
              name: "web"
            },
            {
              name: "biz"
            }
          ]
        },
        {
          name: "my-other-virtual-network",
          //resourceGroupName: "my-other-resource-group",
          subnets: [
            {
              name: "web"
            }//,
            // {
            //   name: "biz"
            // }
          ]
        }
      ],
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
        }//,
        // {
        //   name: "route4",
        //   addressPrefix: "10.0.4.0/24",
        //   nextHopType: "VirtualAppliance"
        // },
        // {
        //   name: "route5",
        //   addressPrefix: "10.0.4.0/24"
        // },
        // {
        //   name: "route6",
        //   addressPrefix: "10.0.5.0/24",
        //   nextHopType: "VnetLocal",
        //   nextHopIpAddress: "192.168.1.1"
        // },
        // {
        //   name: "route7",
        //   addressPrefix: "10.0.4.0/24",
        //   nextHopType: "VirtualAppliance",
        //   nextHopIpAddress: "192.168.1."
        // }
      ]
    }//,
    // {
    //   name: "route2-rt",
    //   virtualNetworks: [
    //     {
    //       name: "my-virtual-network",
    //       subnets: [
    //         {
    //           name: "web"
    //         },
    //         {
    //           name: "biz"
    //         }
    //       ]
    //     },
    //     {
    //       name: "my-other-virtual-network",
    //       resourceGroupName: "my-other-resource-group",
    //       subnets: [
    //         {
    //           name: "web"
    //         },
    //         {
    //           name: "biz"
    //         }
    //       ]
    //     }
    //   ],
    //   routes: [
    //     {
    //       name: "route1",
    //       addressPrefix: "10.0.1.0/24",
    //       nextHopType: "VnetLocal"
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
    //     }//,
    //     // {
    //     //   name: "route4",
    //     //   addressPrefix: "10.0.4.0/24",
    //     //   nextHopType: "VirtualAppliance"
    //     // },
    //     // {
    //     //   name: "route5",
    //     //   addressPrefix: "10.0.4.0/24"
    //     // },
    //     // {
    //     //   name: "route6",
    //     //   addressPrefix: "10.0.5.0/24",
    //     //   nextHopType: "VnetLocal",
    //     //   nextHopIpAddress: "192.168.1.1"
    //     // },
    //     // {
    //     //   name: "route7",
    //     //   addressPrefix: "10.0.4.0/24",
    //     //   nextHopType: "VirtualAppliance",
    //     //   nextHopIpAddress: "192.168.1."
    //     // }
    //   ]
    // }
];

function routeTableTests(req, res, next) {
    let settings = routeTables.transform(routeTableSettings, {
      //subscriptionId: "49741165-F4AF-456E-B47C-637AEAB82D50",
      //resourceGroupName: "my-resource-group"
      subscriptionId: "3b518fac-e5c8-4f59-8ed5-d70b626f8e10",
      resourceGroupName: "template-v2-rg"
    });

  if (settings.validationErrors) {
    res.send(400, settings.validationErrors);
  } else {
    res.send(settings);
  }
  next();
}

var server = restify.createServer();
server.get('/virtualNetwork', vnetTests);
server.get('/routeTable', routeTableTests);

server.listen(8080, function() {
  console.log('%s listening at %s', server.name, server.url);
});
