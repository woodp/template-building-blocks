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
        describe('windows:', () => {
            it("validates that properties for windows are applied", () => {
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
            it("validate defaults do not override settings.", () => {
                let settings = {
                    vmCount: 2,
                    osDisk: { osType: "windows" }
                };

                let mergedValue = virtualMachineSettings.mergeWithDefaults(settings);
                expect(mergedValue.vmCount).toEqual(2);
            });
            it("validate additional properties in settings are not removed.", () => {
                let settings = {
                    adminPassword: "test",
                    osDisk: { osType: "windows" }
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
                    storageAccounts: {
                        count: 5,
                        managed: true
                    },
                    osDisk: { osType: "windows" }
                };
                let mergedValue = virtualMachineSettings.mergeWithDefaults(settings);
                expect(mergedValue.storageAccounts.nameSuffix).toEqual("st");
                expect(mergedValue.storageAccounts.count).toEqual(5);
                expect(mergedValue.storageAccounts.skuType).toEqual("Premium_LRS");
                expect(mergedValue.storageAccounts.managed).toEqual(true);
                expect(mergedValue.storageAccounts.accounts.length).toEqual(0);
            });
            it("validates that diagnostic storage is merged with defaults", () => {
                let settings = {
                    diagnosticStorageAccounts: {
                        count: 5,
                        managed: true
                    },
                    osDisk: { osType: "windows" }
                };
                let mergedValue = virtualMachineSettings.mergeWithDefaults(settings);
                expect(mergedValue.diagnosticStorageAccounts.nameSuffix).toEqual("diag");
                expect(mergedValue.diagnosticStorageAccounts.count).toEqual(5);
                expect(mergedValue.diagnosticStorageAccounts.skuType).toEqual("Standard_LRS");
                expect(mergedValue.diagnosticStorageAccounts.managed).toEqual(true);
                expect(mergedValue.diagnosticStorageAccounts.accounts.length).toEqual(0);
            });
            it("validates that avset is merged with defaults", () => {
                let settings = {
                    "availabilitySet": {
                        "useExistingAvailabilitySet": "no",
                        "name": "test-as"
                    },
                    osDisk: { osType: "windows" }
                };
                let mergedValue = virtualMachineSettings.mergeWithDefaults(settings);
                expect(mergedValue.availabilitySet.useExistingAvailabilitySet).toEqual("no");
                expect(mergedValue.availabilitySet.name).toEqual("test-as");
                expect(mergedValue.availabilitySet.platformFaultDomainCount).toEqual(3);
                expect(mergedValue.availabilitySet.platformUpdateDomainCount).toEqual(5);
            });
            it("validates that osDisk is merged with defaults", () => {
                let settings = {
                    osDisk: { osType: "windows" }
                };
                let mergedValue = virtualMachineSettings.mergeWithDefaults(settings);
                expect(mergedValue.osDisk.osType).toEqual("windows");
                expect(mergedValue.osDisk.caching).toEqual("ReadWrite");
                expect(mergedValue.osDisk.createOption).toEqual("fromImage");
            });
            it("validates that datadisk is merged with defaults", () => {
                let settings = {
                    dataDisks: {
                        count: 2,
                        properties: {
                            diskSizeGB: 127
                        }
                    },
                    osDisk: { osType: "windows" }
                };
                let mergedValue = virtualMachineSettings.mergeWithDefaults(settings);
                expect(mergedValue.dataDisks.count).toEqual(2);
                expect(mergedValue.dataDisks.properties.caching).toEqual("ReadWrite");
                expect(mergedValue.dataDisks.properties.createOption).toEqual("fromImage");
                expect(mergedValue.dataDisks.properties.diskSizeGB).toEqual(127);

            });
            it("validates that imageReference is merged with defaults", () => {
                let settings = {
                    imageReference: {},
                    osDisk: { osType: "windows" }
                };
                let mergedValue = virtualMachineSettings.mergeWithDefaults(settings);
                expect(mergedValue.imageReference.publisher).toEqual("MicrosoftWindowsServer");
                expect(mergedValue.imageReference.offer).toEqual("WindowsServer");
                expect(mergedValue.imageReference.sku).toEqual("2012-R2-Datacenter");
                expect(mergedValue.imageReference.version).toEqual("latest");

            });
        });
        describe('Linux:', () => {
            it("validates that properties for linux are applied", () => {
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
                    osDisk: { osType: "linux" }
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
                    osDisk: { osType: "linux" }
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
                    storageAccounts: {
                        count: 5,
                        managed: true
                    },
                    osDisk: { osType: "linux" }
                };
                let mergedValue = virtualMachineSettings.mergeWithDefaults(settings);
                expect(mergedValue.storageAccounts.nameSuffix).toEqual("st");
                expect(mergedValue.storageAccounts.count).toEqual(5);
                expect(mergedValue.storageAccounts.skuType).toEqual("Premium_LRS");
                expect(mergedValue.storageAccounts.managed).toEqual(true);
                expect(mergedValue.storageAccounts.accounts.length).toEqual(0);
            });
            it("validates that diagnostic storage is merged with defaults", () => {
                let settings = {
                    diagnosticStorageAccounts: {
                        count: 5,
                        managed: true
                    },
                    osDisk: { osType: "linux" }
                };
                let mergedValue = virtualMachineSettings.mergeWithDefaults(settings);
                expect(mergedValue.diagnosticStorageAccounts.nameSuffix).toEqual("diag");
                expect(mergedValue.diagnosticStorageAccounts.count).toEqual(5);
                expect(mergedValue.diagnosticStorageAccounts.skuType).toEqual("Standard_LRS");
                expect(mergedValue.diagnosticStorageAccounts.managed).toEqual(true);
                expect(mergedValue.diagnosticStorageAccounts.accounts.length).toEqual(0);
            });
            it("validates that avset is merged with defaults", () => {
                let settings = {
                    "availabilitySet": {
                        "useExistingAvailabilitySet": "no",
                        "name": "test-as"
                    },
                    osDisk: { osType: "linux" }
                };
                let mergedValue = virtualMachineSettings.mergeWithDefaults(settings);
                expect(mergedValue.availabilitySet.useExistingAvailabilitySet).toEqual("no");
                expect(mergedValue.availabilitySet.name).toEqual("test-as");
                expect(mergedValue.availabilitySet.platformFaultDomainCount).toEqual(3);
                expect(mergedValue.availabilitySet.platformUpdateDomainCount).toEqual(5);
            });
            it("validates that osDisk is merged with defaults", () => {
                let settings = {
                    osDisk: { osType: "linux" }
                };
                let mergedValue = virtualMachineSettings.mergeWithDefaults(settings);
                expect(mergedValue.osDisk.osType).toEqual("linux");
                expect(mergedValue.osDisk.caching).toEqual("ReadWrite");
                expect(mergedValue.osDisk.createOption).toEqual("fromImage");
            });
            it("validates that datadisk is merged with defaults", () => {
                let settings = {
                    dataDisks: {
                        count: 2,
                        properties: {
                            diskSizeGB: 127
                        }
                    },
                    osDisk: { osType: "linux" }
                };
                let mergedValue = virtualMachineSettings.mergeWithDefaults(settings);
                expect(mergedValue.dataDisks.count).toEqual(2);
                expect(mergedValue.dataDisks.properties.caching).toEqual("None");
                expect(mergedValue.dataDisks.properties.createOption).toEqual("Empty");
                expect(mergedValue.dataDisks.properties.diskSizeGB).toEqual(127);

            });
            it("validates that imageReference is merged with defaults", () => {
                let settings = {
                    imageReference: {},
                    osDisk: { osType: "linux" }
                };
                let mergedValue = virtualMachineSettings.mergeWithDefaults(settings);
                expect(mergedValue.imageReference.publisher).toEqual("Canonical");
                expect(mergedValue.imageReference.offer).toEqual("UbuntuServer");
                expect(mergedValue.imageReference.sku).toEqual("14.04.5-LTS");
                expect(mergedValue.imageReference.version).toEqual("latest");

            });
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
    describe('transform:', () => {
        describe('windows', () => {
            let settings = {
                virtualMachinesSettings: {
                    vmCount: 2,
                    namePrefix: "testName",
                    computerNamePrefix: "testName",
                    adminUsername: "testAdminUser",
                    adminPassword: "testPassword",
                    osAuthenticationType: "password",
                    existingWindowsServerlicense: false,
                    virtualNetwork: {
                        name: "test-vnet"
                    },
                    storageAccounts: {
                        count: 2
                    },
                    diagnosticStorageAccounts: {
                        count: 2
                    },
                    nics: [
                        {
                            isPublic: true,
                            subnetName: "web",
                            privateIPAllocationMethod: "Static",
                            startingIPAddress: "10.0.1.240",
                            isPrimary: true,
                            dnsServers: [
                                "10.0.1.240",
                                "10.0.1.242"
                            ]
                        },
                        {
                            isPrimary: false,
                            subnetName: "biz",
                            privateIPAllocationMethod: "Dynamic"
                        }
                    ],
                    osDisk: {
                        osType: "windows"
                    },
                    dataDisks: {
                        count: 2,
                        properties: {
                            diskSizeGB: 127
                        }
                    },
                    availabilitySet: {
                        useExistingAvailabilitySet: "no",
                        name: "test-as"
                    }
                },
                buildingBlockSettings: {
                    resourceGroupName: "test-rg",
                    subscriptionId: "00000000-0000-1000-A000-000000000000"
                }
            };
            it('validates that number of stamps created are based on vmcount property', () => {
                let processedParam = virtualMachineSettings.mergeWithDefaults(settings.virtualMachinesSettings, settings.buildingBlockSettings);
                
            });
        });
    });
})