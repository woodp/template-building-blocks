describe('virtualMachineSettings:', () => {
    let rewire = require('rewire');
    let virtualMachineSettings = rewire('../core/virtualMachineSettings.js');
    let _ = require('../lodashMixins.js');

    describe('merge:', () => {

        it("throws error if osDisk.osType is not provided.", () => {
            let settings = {};
            expect(() => virtualMachineSettings.mergeWithDefaults(settings)).toThrowError(Error);
            settings = { osDisk: { osType: "windows" } }
            expect(() => virtualMachineSettings.mergeWithDefaults(settings)).not.toThrowError(Error);
        });
        it("validates that defaut properties for windows are applied", () => {
            let settings = { osDisk: { osType: "windows" } };

            let mergedValue = virtualMachineSettings.mergeWithDefaults(settings);
            expect(mergedValue.hasOwnProperty("vmCount")).toEqual(true);
            expect(mergedValue.hasOwnProperty("namePrefix")).toEqual(true);
            expect(mergedValue.hasOwnProperty("computerNamePrefix")).toEqual(true);
            expect(mergedValue.hasOwnProperty("size")).toEqual(true);
            expect(mergedValue.hasOwnProperty("osDisk")).toEqual(true);
            expect(mergedValue.osDisk.hasOwnProperty("osType")).toEqual(true);
            expect(mergedValue.osDisk.hasOwnProperty("caching")).toEqual(true);
            expect(mergedValue.osDisk.hasOwnProperty("createOption")).toEqual(true);
            expect(mergedValue.hasOwnProperty("adminUsername")).toEqual(true);
            expect(mergedValue.hasOwnProperty("osAuthenticationType")).toEqual(true);
            expect(mergedValue.hasOwnProperty("storageAccounts")).toEqual(true);
            expect(mergedValue.storageAccounts.hasOwnProperty("nameSuffix")).toEqual(true);
            expect(mergedValue.storageAccounts.hasOwnProperty("count")).toEqual(true);
            expect(mergedValue.storageAccounts.hasOwnProperty("skuType")).toEqual(true);
            expect(mergedValue.storageAccounts.hasOwnProperty("accounts")).toEqual(true);
            expect(mergedValue.storageAccounts.hasOwnProperty("managed")).toEqual(true);
            expect(mergedValue.hasOwnProperty("diagnosticStorageAccounts")).toEqual(true);
            expect(mergedValue.diagnosticStorageAccounts.hasOwnProperty("nameSuffix")).toEqual(true);
            expect(mergedValue.diagnosticStorageAccounts.hasOwnProperty("count")).toEqual(true);
            expect(mergedValue.diagnosticStorageAccounts.hasOwnProperty("skuType")).toEqual(true);
            expect(mergedValue.diagnosticStorageAccounts.hasOwnProperty("accounts")).toEqual(true);
            expect(mergedValue.diagnosticStorageAccounts.hasOwnProperty("managed")).toEqual(true);
            expect(mergedValue.hasOwnProperty("nics")).toEqual(true);
            expect(mergedValue.hasOwnProperty("imageReference")).toEqual(true);
            expect(mergedValue.imageReference.hasOwnProperty("publisher")).toEqual(true);
            expect(mergedValue.imageReference.hasOwnProperty("offer")).toEqual(true);
            expect(mergedValue.imageReference.hasOwnProperty("sku")).toEqual(true);
            expect(mergedValue.imageReference.hasOwnProperty("version")).toEqual(true);
            expect(mergedValue.hasOwnProperty("dataDisks")).toEqual(true);
            expect(mergedValue.dataDisks.hasOwnProperty("count")).toEqual(true);
            expect(mergedValue.dataDisks.hasOwnProperty("properties")).toEqual(true);
            expect(mergedValue.dataDisks.properties.hasOwnProperty("diskSizeGB")).toEqual(true);
            expect(mergedValue.dataDisks.properties.hasOwnProperty("caching")).toEqual(true);
            expect(mergedValue.dataDisks.properties.hasOwnProperty("createOption")).toEqual(true);
            expect(mergedValue.hasOwnProperty("existingWindowsServerlicense")).toEqual(true);
            expect(mergedValue.hasOwnProperty("extensions")).toEqual(true);
            expect(mergedValue.hasOwnProperty("availabilitySet")).toEqual(true);
            expect(mergedValue.availabilitySet.hasOwnProperty("useExistingAvailabilitySet")).toEqual(true);
            expect(mergedValue.availabilitySet.hasOwnProperty("platformFaultDomainCount")).toEqual(true);
            expect(mergedValue.availabilitySet.hasOwnProperty("platformUpdateDomainCount")).toEqual(true);
            expect(mergedValue.availabilitySet.hasOwnProperty("name")).toEqual(true);

        });
        it("validates that defaut properties for linux are applied", () => {
            let settings = { osDisk: { osType: "linux" } };

            let mergedValue = virtualMachineSettings.mergeWithDefaults(settings);
            expect(mergedValue.hasOwnProperty("vmCount")).toEqual(true);
            expect(mergedValue.hasOwnProperty("namePrefix")).toEqual(true);
            expect(mergedValue.hasOwnProperty("computerNamePrefix")).toEqual(true);
            expect(mergedValue.hasOwnProperty("size")).toEqual(true);
            expect(mergedValue.hasOwnProperty("osDisk")).toEqual(true);
            expect(mergedValue.osDisk.hasOwnProperty("osType")).toEqual(true);
            expect(mergedValue.osDisk.hasOwnProperty("caching")).toEqual(true);
            expect(mergedValue.osDisk.hasOwnProperty("createOption")).toEqual(true);
            expect(mergedValue.hasOwnProperty("adminUsername")).toEqual(true);
            expect(mergedValue.hasOwnProperty("osAuthenticationType")).toEqual(true);
            expect(mergedValue.hasOwnProperty("storageAccounts")).toEqual(true);
            expect(mergedValue.storageAccounts.hasOwnProperty("nameSuffix")).toEqual(true);
            expect(mergedValue.storageAccounts.hasOwnProperty("count")).toEqual(true);
            expect(mergedValue.storageAccounts.hasOwnProperty("skuType")).toEqual(true);
            expect(mergedValue.storageAccounts.hasOwnProperty("accounts")).toEqual(true);
            expect(mergedValue.storageAccounts.hasOwnProperty("managed")).toEqual(true);
            expect(mergedValue.hasOwnProperty("diagnosticStorageAccounts")).toEqual(true);
            expect(mergedValue.diagnosticStorageAccounts.hasOwnProperty("nameSuffix")).toEqual(true);
            expect(mergedValue.diagnosticStorageAccounts.hasOwnProperty("count")).toEqual(true);
            expect(mergedValue.diagnosticStorageAccounts.hasOwnProperty("skuType")).toEqual(true);
            expect(mergedValue.diagnosticStorageAccounts.hasOwnProperty("accounts")).toEqual(true);
            expect(mergedValue.diagnosticStorageAccounts.hasOwnProperty("managed")).toEqual(true);
            expect(mergedValue.hasOwnProperty("nics")).toEqual(true);
            expect(mergedValue.hasOwnProperty("imageReference")).toEqual(true);
            expect(mergedValue.imageReference.hasOwnProperty("publisher")).toEqual(true);
            expect(mergedValue.imageReference.hasOwnProperty("offer")).toEqual(true);
            expect(mergedValue.imageReference.hasOwnProperty("sku")).toEqual(true);
            expect(mergedValue.imageReference.hasOwnProperty("version")).toEqual(true);
            expect(mergedValue.hasOwnProperty("dataDisks")).toEqual(true);
            expect(mergedValue.dataDisks.hasOwnProperty("count")).toEqual(true);
            expect(mergedValue.dataDisks.hasOwnProperty("properties")).toEqual(true);
            expect(mergedValue.dataDisks.properties.hasOwnProperty("diskSizeGB")).toEqual(true);
            expect(mergedValue.dataDisks.properties.hasOwnProperty("caching")).toEqual(true);
            expect(mergedValue.dataDisks.properties.hasOwnProperty("createOption")).toEqual(true);
            expect(mergedValue.hasOwnProperty("extensions")).toEqual(true);
            expect(mergedValue.hasOwnProperty("availabilitySet")).toEqual(true);
            expect(mergedValue.availabilitySet.hasOwnProperty("useExistingAvailabilitySet")).toEqual(true);
            expect(mergedValue.availabilitySet.hasOwnProperty("platformFaultDomainCount")).toEqual(true);
            expect(mergedValue.availabilitySet.hasOwnProperty("platformUpdateDomainCount")).toEqual(true);
            expect(mergedValue.availabilitySet.hasOwnProperty("name")).toEqual(true);

        });
        it("validate defaults do not override settings.", () => {
            let settings = {
                vmCount: 2,
                osDisk: { osType: "linux" }
            };

            let mergedValue = virtualMachineSettings.mergeWithDefaults(settings);
            expect(mergedValue.vmCount).toEqual(2);
        });
        it("validate additional properties in settings are not removed.", () => {
            let settings = {
                adminPassword: "test",
                osDisk: { osType: "linux" }
            };

            let mergedValue = virtualMachineSettings.mergeWithDefaults(settings);
            expect(mergedValue.hasOwnProperty("adminPassword")).toEqual(true);
            expect(mergedValue.adminPassword).toEqual("test");
        });
        it("validate default nics are not added if provided.", () => {
            let settings = {
                nics: [
                    {
                        "isPublic": true,
                        "subnetName": "web",
                        "privateIPAllocationMethod": "Static",
                        "publicIPAllocationMethod": "Static",
                        "startingIPAddress": "10.0.1.240",
                        "isPrimary": true,
                        "dnsServers": [
                            "10.0.1.240",
                            "10.0.1.242"
                        ]
                    },
                    {
                        "isPrimary": false,
                        "subnetName": "biz",
                        "privateIPAllocationMethod": "Dynamic",
                        "enableIPForwarding": false,
                        "domainNameLabelPrefix": "",
                        "dnsServers": []
                    }
                ],
                osDisk: { osType: "windows" }
            };

            let mergedValue = virtualMachineSettings.mergeWithDefaults(settings);
            expect(mergedValue.nics.length).toEqual(2);
            expect(mergedValue.nics[0].subnetName).toEqual("web");
            expect(mergedValue.nics[1].subnetName).toEqual("biz");
        });
        it("validates that individual nics are merged with defaults", () => {
            let settings = {
                nics: [
                    {
                        "isPublic": true,
                        "subnetName": "web",
                        "privateIPAllocationMethod": "Static",
                        "publicIPAllocationMethod": "Static",
                        "startingIPAddress": "10.0.1.240",
                        "isPrimary": true,
                        "dnsServers": [
                            "10.0.1.240",
                            "10.0.1.242"
                        ]
                    },
                    {
                        "isPrimary": false,
                        "subnetName": "biz",
                        "privateIPAllocationMethod": "Dynamic",
                        "enableIPForwarding": false,
                        "domainNameLabelPrefix": ""
                    }
                ],
                osDisk: { osType: "windows" }
            };

            let mergedValue = virtualMachineSettings.mergeWithDefaults(settings);
            expect(mergedValue.nics.length).toEqual(2);
            expect(mergedValue.nics[0].isPublic).toEqual(true);
            expect(mergedValue.nics[0].subnetName).toEqual("web");
            expect(mergedValue.nics[0].privateIPAllocationMethod).toEqual("Static");
            expect(mergedValue.nics[0].publicIPAllocationMethod).toEqual("Static");
            expect(mergedValue.nics[0].startingIPAddress).toEqual("10.0.1.240");
            expect(mergedValue.nics[0].enableIPForwarding).toEqual(false);
            expect(mergedValue.nics[0].domainNameLabelPrefix).toEqual("");
            expect(mergedValue.nics[0].dnsServers.length).toEqual(2);
            expect(mergedValue.nics[0].isPrimary).toEqual(true);

            expect(mergedValue.nics[1].isPublic).toEqual(false);
            expect(mergedValue.nics[1].subnetName).toEqual("biz");
            expect(mergedValue.nics[1].privateIPAllocationMethod).toEqual("Dynamic");
            expect(mergedValue.nics[1].publicIPAllocationMethod).toEqual("Dynamic");
            expect(mergedValue.nics[1].startingIPAddress).toEqual("");
            expect(mergedValue.nics[1].enableIPForwarding).toEqual(false);
            expect(mergedValue.nics[1].domainNameLabelPrefix).toEqual("");
            expect(mergedValue.nics[1].dnsServers.length).toEqual(0);
            expect(mergedValue.nics[1].isPrimary).toEqual(false);
        });
        it("validates that storage is merged with defaults", () => {
            let settings = {
                nics: [
                    {
                        "isPublic": true,
                        "subnetName": "web",
                        "privateIPAllocationMethod": "Static",
                        "publicIPAllocationMethod": "Static",
                        "startingIPAddress": "10.0.1.240",
                        "isPrimary": true,
                        "dnsServers": [
                            "10.0.1.240",
                            "10.0.1.242"
                        ]
                    },
                    {
                        "isPrimary": false,
                        "subnetName": "biz",
                        "privateIPAllocationMethod": "Dynamic",
                        "enableIPForwarding": false,
                        "domainNameLabelPrefix": ""
                    }
                ],
                osDisk: { osType: "windows" }
            };

        });
        it("validates that diagnostic storage is merged with defaults", () => {
            let settings = {
                nics: [
                    {
                        "isPublic": true,
                        "subnetName": "web",
                        "privateIPAllocationMethod": "Static",
                        "publicIPAllocationMethod": "Static",
                        "startingIPAddress": "10.0.1.240",
                        "isPrimary": true,
                        "dnsServers": [
                            "10.0.1.240",
                            "10.0.1.242"
                        ]
                    },
                    {
                        "isPrimary": false,
                        "subnetName": "biz",
                        "privateIPAllocationMethod": "Dynamic",
                        "enableIPForwarding": false,
                        "domainNameLabelPrefix": ""
                    }
                ],
                osDisk: { osType: "windows" }
            };

        });
        it("validates that avset is merged with defaults", () => {
            let settings = {
                nics: [
                    {
                        "isPublic": true,
                        "subnetName": "web",
                        "privateIPAllocationMethod": "Static",
                        "publicIPAllocationMethod": "Static",
                        "startingIPAddress": "10.0.1.240",
                        "isPrimary": true,
                        "dnsServers": [
                            "10.0.1.240",
                            "10.0.1.242"
                        ]
                    },
                    {
                        "isPrimary": false,
                        "subnetName": "biz",
                        "privateIPAllocationMethod": "Dynamic",
                        "enableIPForwarding": false,
                        "domainNameLabelPrefix": ""
                    }
                ],
                osDisk: { osType: "windows" }
            };

        });
        it("validates that osDisk is merged with defaults", () => {
            let settings = {
                nics: [
                    {
                        "isPublic": true,
                        "subnetName": "web",
                        "privateIPAllocationMethod": "Static",
                        "publicIPAllocationMethod": "Static",
                        "startingIPAddress": "10.0.1.240",
                        "isPrimary": true,
                        "dnsServers": [
                            "10.0.1.240",
                            "10.0.1.242"
                        ]
                    },
                    {
                        "isPrimary": false,
                        "subnetName": "biz",
                        "privateIPAllocationMethod": "Dynamic",
                        "enableIPForwarding": false,
                        "domainNameLabelPrefix": ""
                    }
                ],
                osDisk: { osType: "windows" }
            };

        });
        it("validates that datadisk is merged with defaults", () => {
            let settings = {
                nics: [
                    {
                        "isPublic": true,
                        "subnetName": "web",
                        "privateIPAllocationMethod": "Static",
                        "publicIPAllocationMethod": "Static",
                        "startingIPAddress": "10.0.1.240",
                        "isPrimary": true,
                        "dnsServers": [
                            "10.0.1.240",
                            "10.0.1.242"
                        ]
                    },
                    {
                        "isPrimary": false,
                        "subnetName": "biz",
                        "privateIPAllocationMethod": "Dynamic",
                        "enableIPForwarding": false,
                        "domainNameLabelPrefix": ""
                    }
                ],
                osDisk: { osType: "windows" }
            };

        });
    });
    // describe('validations:', () => {
    //     let nicParam = {
    //         "isPublic": false,
    //         "subnetName": "default",
    //         "privateIPAllocationMethod": "Dynamic",
    //         "publicIPAllocationMethod": "Dynamic",
    //         "enableIPForwarding": false,
    //         "domainNameLabelPrefix": "",
    //         "dnsServers": [],
    //         "isPrimary": false
    //     };
    //     describe('isPublic:', () => {
    //         let validation = virtualMachineSettings.__get__("networkInterfaceValidations").isPublic;
    //         it("validates only boolean values are valid.", () => {
    //             let result = validation("yes", nicParam)
    //             expect(result.result).toEqual(false);

    //             result = validation(false, nicParam)
    //             expect(result.result).toEqual(true);
    //         });
    //     });
    //     describe('enableIPForwarding:', () => {
    //         let validation = virtualMachineSettings.__get__("networkInterfaceValidations").enableIPForwarding;
    //         it("validates only boolean values are valid.", () => {
    //             let result = validation("yes", nicParam)
    //             expect(result.result).toEqual(false);

    //             result = validation(false, nicParam)
    //             expect(result.result).toEqual(true);
    //         });
    //     });
    //     describe('isPrimary:', () => {
    //         let validation = virtualMachineSettings.__get__("networkInterfaceValidations").isPrimary;
    //         it("validates only boolean values are valid.", () => {
    //             let result = validation("yes", nicParam)
    //             expect(result.result).toEqual(false);

    //             result = validation(false, nicParam)
    //             expect(result.result).toEqual(true);
    //         });
    //     });
    //     describe('privateIPAllocationMethod:', () => {
    //         let validation = virtualMachineSettings.__get__("networkInterfaceValidations").privateIPAllocationMethod;
    //         it("validates valid values are 'Static' and 'Dynamic'.", () => {
    //             let result = validation("static", nicParam)
    //             expect(result.result).toEqual(false);

    //             result = validation(null, nicParam)
    //             expect(result.result).toEqual(false);

    //             result = validation("", nicParam)
    //             expect(result.result).toEqual(false);

    //             result = validation("Dynamic", nicParam)
    //             expect(result.result).toEqual(true);
    //         });
    //         it("validates if privateIPAllocationMethod is Static, startingIPAddress must be a valid IP address", () => {
    //             let result = validation("Static", nicParam)
    //             expect(result.result).toEqual(false);

    //             let param = _.cloneDeep(nicParam);
    //             param.startingIPAddress = "10.10.10.10";
    //             result = validation("Static", param)
    //             expect(result.result).toEqual(true);
    //         });
    //     });
    //     describe('publicIPAllocationMethod:', () => {
    //         let validation = virtualMachineSettings.__get__("networkInterfaceValidations").publicIPAllocationMethod;
    //         it("validates valid values are 'Static' and 'Dynamic'.", () => {
    //             let result = validation("static", nicParam)
    //             expect(result.result).toEqual(false);

    //             result = validation(null, nicParam)
    //             expect(result.result).toEqual(false);

    //             result = validation("", nicParam)
    //             expect(result.result).toEqual(false);

    //             result = validation("Static", nicParam)
    //             expect(result.result).toEqual(true);

    //             result = validation("Dynamic", nicParam)
    //             expect(result.result).toEqual(true);
    //         });
    //     });
    //     describe('subnetName:', () => {
    //         let validation = virtualMachineSettings.__get__("networkInterfaceValidations").subnetName;
    //         it("validate name canot be an empty string.", () => {
    //             let result = validation("", nicParam)
    //             expect(result).toEqual(false);

    //             result = validation("test", nicParam)
    //             expect(result).toEqual(true);

    //             result = validation(null, nicParam)
    //             expect(result).toEqual(false);
    //         });
    //     });
    //     describe('dnsServers:', () => {
    //         let validation = virtualMachineSettings.__get__("networkInterfaceValidations").dnsServers;
    //         it("validates that values are valid ip addresses.", () => {
    //             result = validation("10.0.0.0")
    //             expect(result).toEqual(true);

    //             result = validation("test")
    //             expect(result).toEqual(false);
    //         });
    //     });
    // });
    // describe('transform:', () => {
    //     let vmIndex = 0;
    //     let settings = {
    //         name: "testVM1",
    //         virtualNetwork: {
    //             "name": "test-vnet",
    //             "subscriptionId": "00000000-0000-1000-A000-000000000000",
    //             "resourceGroupName": "test-rg"
    //         },
    //         nics: [
    //             {
    //                 "isPublic": false,
    //                 "subnetName": "web",
    //                 "privateIPAllocationMethod": "Static",
    //                 "publicIPAllocationMethod": "Dynamic",
    //                 "startingIPAddress": "10.0.1.240",
    //                 "enableIPForwarding": false,
    //                 "domainNameLabelPrefix": "",
    //                 "isPrimary": true,
    //                 "dnsServers": [
    //                     "10.0.1.240",
    //                     "10.0.1.242"
    //                 ],
    //                 "subscriptionId": "00000000-0000-1100-AA00-000000000000",
    //                 "resourceGroupName": "test-rg"
    //             },
    //             {
    //                 "isPublic": false,
    //                 "subnetName": "biz",
    //                 "privateIPAllocationMethod": "Dynamic",
    //                 "publicIPAllocationMethod": "Static",
    //                 "enableIPForwarding": true,
    //                 "domainNameLabelPrefix": "testDomainName",
    //                 "isPrimary": false,
    //                 "dnsServers": [],
    //                 "subscriptionId": "00000000-0000-1100-AA00-000000000000",
    //                 "resourceGroupName": "test-rg"
    //             }
    //         ]
    //     };

    //     it('validates that total number of nics returned equals vmCount multiplied by number of nics in stamp', () => {
    //         let result = virtualMachineSettings.processvirtualMachineSettings(settings.nics, settings, vmIndex);

    //         expect(result.nics.length).toEqual(2);
    //     });
    //     it('validates that nics are named appropriately for each VM', () => {
    //         let result = virtualMachineSettings.processvirtualMachineSettings(settings.nics, settings, vmIndex);

    //         expect(result.nics.length).toEqual(2);
    //         expect(result.nics[0].name).toEqual("testVM1-nic1");
    //         expect(result.nics[1].name).toEqual("testVM1-nic2");
    //     });
    //     it('validates that primary nics are correctly assigned for each VM', () => {
    //         let result = virtualMachineSettings.processvirtualMachineSettings(settings.nics, settings, vmIndex);

    //         expect(result.nics[0].primary).toEqual(true);
    //         expect(result.nics[1].primary).toEqual(false);
    //     });
    //     it('validates that enableIPForwarding is correctly assigned for each VM', () => {
    //         let result = virtualMachineSettings.processvirtualMachineSettings(settings.nics, settings, vmIndex);

    //         expect(result.nics[0].enableIPForwarding).toEqual(false);
    //         expect(result.nics[1].enableIPForwarding).toEqual(true);
    //     });
    //     it('validates that dnsServers are correctly assigned for each VM', () => {
    //         let result = virtualMachineSettings.processvirtualMachineSettings(settings.nics, settings, vmIndex);

    //         expect(result.nics[0].dnsSettings.dnsServers.length).toEqual(2);
    //         expect(result.nics[0].dnsSettings.appliedDnsServers.length).toEqual(2);
    //         expect(result.nics[0].dnsSettings.dnsServers[0]).toEqual("10.0.1.240");
    //         expect(result.nics[0].dnsSettings.dnsServers[1]).toEqual("10.0.1.242");
    //         expect(result.nics[0].dnsSettings.appliedDnsServers[0]).toEqual("10.0.1.240");
    //         expect(result.nics[0].dnsSettings.appliedDnsServers[1]).toEqual("10.0.1.242");

    //         expect(result.nics[1].dnsSettings.dnsServers.length).toEqual(0);
    //         expect(result.nics[1].dnsSettings.appliedDnsServers.length).toEqual(0);
    //     });
    //     it('validates that privateIPAllocationMethod is correctly assigned in the Ip configuration', () => {
    //         let result = virtualMachineSettings.processvirtualMachineSettings(settings.nics, settings, vmIndex);

    //         expect(result.nics[0].ipConfigurations[0].properties.privateIPAllocationMethod).toEqual("Static");
    //         expect(result.nics[0].ipConfigurations[0].properties.privateIPAddress).toEqual("10.0.1.240");
    //         expect(result.nics[1].ipConfigurations[0].properties.privateIPAllocationMethod).toEqual("Dynamic");
    //         expect(result.nics[1].ipConfigurations[0].properties.hasOwnProperty("privateIPAddress")).toEqual(false);
    //     });
    //     it('validates that startingIPAddress is correctly computed', () => {
    //         let result = virtualMachineSettings.processvirtualMachineSettings(settings.nics, settings, 5);

    //         expect(result.nics[0].ipConfigurations[0].properties.privateIPAllocationMethod).toEqual("Static");
    //         expect(result.nics[0].ipConfigurations[0].properties.privateIPAddress).toEqual("10.0.1.245");
    //     });
    //     it('validates that startingIPAddress is correctly computed and rolls over to next octet', () => {
    //         let result = virtualMachineSettings.processvirtualMachineSettings(settings.nics, settings, 18);

    //         expect(result.nics[0].ipConfigurations[0].properties.privateIPAllocationMethod).toEqual("Static");
    //         expect(result.nics[0].ipConfigurations[0].properties.privateIPAddress).toEqual("10.0.2.2");
    //     });
    //     it('validates that subnets are correctly referenced in the Ip configuration', () => {
    //         let result = virtualMachineSettings.processvirtualMachineSettings(settings.nics, settings, vmIndex);

    //         expect(result.nics[0].ipConfigurations[0].properties.subnet.id).toEqual("/subscriptions/00000000-0000-1000-A000-000000000000/resourceGroups/test-rg/providers/Microsoft.Network/virtualNetworks/test-vnet/subnets/web");
    //         expect(result.nics[1].ipConfigurations[0].properties.subnet.id).toEqual("/subscriptions/00000000-0000-1000-A000-000000000000/resourceGroups/test-rg/providers/Microsoft.Network/virtualNetworks/test-vnet/subnets/biz");
    //     });
    //     it('validates that piblic nics have the publicIPAddress correctly referenced in the Ip configuration', () => {
    //         let param = _.cloneDeep(settings);
    //         param.nics[0].isPublic = true;
    //         let result = virtualMachineSettings.processvirtualMachineSettings(param.nics, param, vmIndex);

    //         expect(result.nics[0].ipConfigurations[0].properties.publicIPAddress.id).toEqual("/subscriptions/00000000-0000-1100-AA00-000000000000/resourceGroups/test-rg/providers/Microsoft.Network/publicIPAddresses/testVM1-nic1-pip");
    //         expect(result.nics[1].ipConfigurations[0].properties.hasOwnProperty("publicIPAddress")).toEqual(false);
    //     });
    //     it('validates that only one Ip configuration is created for each nic', () => {
    //         let param = _.cloneDeep(settings);
    //         param.nics[0].isPublic = true;
    //         let result = virtualMachineSettings.processvirtualMachineSettings(param.nics, param, vmIndex);

    //         expect(result.nics[0].ipConfigurations.length).toEqual(1);
    //         expect(result.nics[0].ipConfigurations[0].name).toEqual("ipconfig1");
    //         expect(result.nics[1].ipConfigurations.length).toEqual(1);
    //         expect(result.nics[1].ipConfigurations[0].name).toEqual("ipconfig1");
    //     });
    //     it('validates that for private nics, pips array is empty', () => {
    //         let result = virtualMachineSettings.processvirtualMachineSettings(settings.nics, settings, vmIndex);

    //         expect(result.pips.length).toEqual(0);
    //     });
    //     it('validates that pips are named correctly', () => {
    //         let param = _.cloneDeep(settings);
    //         param.nics[0].isPublic = true;
    //         let result = virtualMachineSettings.processvirtualMachineSettings(param.nics, param, vmIndex);

    //         expect(result.pips[0].name).toEqual("testVM1-nic1-pip");
    //     });
    //     it('validates that publicIPAllocationMethod is correctly assigned in the pips', () => {
    //         let param = _.cloneDeep(settings);
    //         param.nics[0].isPublic = true;
    //         let result = virtualMachineSettings.processvirtualMachineSettings(param.nics, param, vmIndex);

    //         expect(result.pips[0].properties.publicIPAllocationMethod).toEqual("Dynamic");
    //     });
    // });
})