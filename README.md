```
           _     _     
          | |   | |    
  __ _ ___| |__ | |__  
 / _` |_  / '_ \| '_ \ 
| (_| |/ /| |_) | |_) |
 \__,_/___|_.__/|_.__/ 
```
# Azure Building Blocks: Simplifying Resource Deployment

The Azure Building Blocks project is a command line tool and set of Azure Resource Manager templates designed to simplify deployment of Infrastructure as a Service (IaaS) resources. Users author a set of simplified parameters to specify settings for Azure resources, and the command line tool merges these parameters with best practice defaults to produce a set of final parameter files that can be deployed with the Azure Resource Manager templates.

# Getting Started

Install the Azure Building Blocks using npm:

```
npm install @mspnp/azbb
```

Then, [author an Azure Building Blocks parameter file](https://github.com/mspnp/template-building-blocks/wiki/create-a-template-building-blocks-parameter-file) and run the `azbb` command line tool.

# Documentation

Full documentation for the command line tool and parameter file schema is available on the [Wiki](https://github.com/mspnp/template-building-blocks/wiki).

# Examples

Azure Building Blocks parameters to deploy three identical VMs:

```json
"type": "VirtualMachine",
"settings": {
    "vmCount": 3,
    "osType": "windows",
    "namePrefix": "test",
    "adminPassword": "testPassw0rd!23",
    "nics": [{"subnetName": "web"}],
    "virtualNetwork": {"name": "ra-vnet"}
}
```

The command line tool merges best practice defaults to the parameters as follows:

-	Enables diagnostics on all VMs
-	Deploys the VMs in an availability set 
-	All VM disks are managed
-	OS is latest Windows Server 2016 image
-	Public IP created for each VM

To add a load balancer in front of the three identical VMs:

```json
"type": "VirtualMachine",
"settings": {
    "vmCount": 3,
    "osType": "windows",
    "namePrefix": "test",
    "adminPassword": "testPassw0rd!23",
    "nics": [{
        "subnetName": "web",
        "isPublic": false,
        "backendPoolsNames": ["bp1"]
        }],
    "virtualNetwork": {"name": "ra-vnet"},
    "loadBalancerSettings": {
        "backendPools": [{"name": "bp1"}]
    }
}
```

# License 

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/). For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.
