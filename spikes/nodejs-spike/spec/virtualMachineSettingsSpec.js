describe('virtualMachineSettings:', () => {
    let rewire = require('rewire');
    let virtualMachineSettings = rewire('../core/virtualMachineSettings.js');
    let _ = require('../lodashMixins.js');
    let testSettings = {
        vmCount: 2,
        namePrefix: "test",
        computerNamePrefix: "test",
        size: "Standard_DS2",
        osDisk: {
            osType: "windows",
            caching: "ReadWrite",
            createOption: "fromImage"
        },
        adminUsername: "testadminuser",
        osAuthenticationType: "password",
        storageAccounts: {
            nameSuffix: "st",
            count: 1,
            skuType: "Premium_LRS",
            managed: false,
            accounts: []
        },
        diagnosticStorageAccounts: {
            nameSuffix: "diag",
            count: 1,
            skuType: "Standard_LRS",
            managed: false,
            accounts: []
        },
        nics: [
            {
                isPublic: true,
                isPrimary: true,
                subnetName: "web",
                privateIPAllocationMethod: "Static",
                publicIPAllocationMethod: "Dynamic",
                startingIPAddress: "10.0.1.240",
                enableIPForwarding: false,
                domainNameLabelPrefix: "",
                dnsServers: [
                    "10.0.1.240",
                    "10.0.1.242"
                ]
            },
            {
                isPublic: false,
                isPrimary: false,
                subnetName: "biz",
                privateIPAllocationMethod: "Dynamic",
                publicIPAllocationMethod: "Dynamic",
                startingIPAddress: "",
                enableIPForwarding: false,
                domainNameLabelPrefix: "",
                dnsServers: []
            }
        ],
        imageReference: {
            publisher: "MicrosoftWindowsServer",
            offer: "WindowsServer",
            sku: "2012-R2-Datacenter",
            version: "latest"
        },
        dataDisks: {
            count: 1,
            properties: {
                diskSizeGB: 127,
                caching: "None",
                createOption: "empty"
            }
        },
        existingWindowsServerlicense: false,
        availabilitySet: {
            useExistingAvailabilitySet: false,
            platformFaultDomainCount: 3,
            platformUpdateDomainCount: 5,
            name: "test-as"
        },
        adminPassword: "testPassw0rd111",
        virtualNetwork: {
            name: "ra-vnet"
        }
    };
    let buildingBlockSettings = {
        resourceGroupName: "rs-test1-rg",
        subscriptionId: "3b518fac-e5c8-4f59-8ed5-d70b626f8e10"
    }
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
                expect(mergedValue.dataDisks.properties.caching).toEqual("None");
                expect(mergedValue.dataDisks.properties.createOption).toEqual("empty");
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
    describe('validate:', () => {
        it('validates that vmcount should be greater than 0', () => {
            let settings = _.cloneDeep(testSettings);
            settings.vmCount = 0;
            let result = virtualMachineSettings.validations(settings);
            expect(result.length).toEqual(1);
            expect(result[0].name).toEqual('.vmCount');

            settings.vmCount = 5;
            result = virtualMachineSettings.validations(settings);
            expect(result.length).toEqual(0);
        });
        it('validates that namePrefix cannot be null or empty', () => {
            let settings = _.cloneDeep(testSettings);

            let result = virtualMachineSettings.validations(settings);
            expect(result.length).toEqual(0);

            settings.namePrefix = "";
            result = virtualMachineSettings.validations(settings);
            expect(result.length).toEqual(1);
            expect(result[0].name).toEqual('.namePrefix');

            settings.namePrefix = null;
            result = virtualMachineSettings.validations(settings);
            expect(result.length).toEqual(1);
            expect(result[0].name).toEqual('.namePrefix');
        });
        it('validates that computerNamePrefix cannot be null or empty', () => {
            let settings = _.cloneDeep(testSettings);

            let result = virtualMachineSettings.validations(settings);
            expect(result.length).toEqual(0);

            settings.computerNamePrefix = "";
            result = virtualMachineSettings.validations(settings);
            expect(result.length).toEqual(1);
            expect(result[0].name).toEqual('.computerNamePrefix');

            settings.computerNamePrefix = null;
            result = virtualMachineSettings.validations(settings);
            expect(result.length).toEqual(1);
            expect(result[0].name).toEqual('.computerNamePrefix');
        });
        it('validates that vm size cannot be null or empty', () => {
            let settings = _.cloneDeep(testSettings);

            let result = virtualMachineSettings.validations(settings);
            expect(result.length).toEqual(0);

            settings.size = "";
            result = virtualMachineSettings.validations(settings);
            expect(result.length).toEqual(1);
            expect(result[0].name).toEqual('.size');

            settings.size = null;
            result = virtualMachineSettings.validations(settings);
            expect(result.length).toEqual(1);
            expect(result[0].name).toEqual('.size');
        });
        it('validates that vm adminUsername cannot be null or empty', () => {
            let settings = _.cloneDeep(testSettings);

            let result = virtualMachineSettings.validations(settings);
            expect(result.length).toEqual(0);

            settings.adminUsername = "";
            result = virtualMachineSettings.validations(settings);
            expect(result.length).toEqual(1);
            expect(result[0].name).toEqual('.adminUsername');

            settings.adminUsername = null;
            result = virtualMachineSettings.validations(settings);
            expect(result.length).toEqual(1);
            expect(result[0].name).toEqual('.adminUsername');
        });
        it('validates that valid values for osAuthenticationType are password & ssh', () => {
            let settings = _.cloneDeep(testSettings);

            let result = virtualMachineSettings.validations(settings);
            expect(result.length).toEqual(0);

            settings.osAuthenticationType = "ssh";
            settings.osDisk.osType = "linux";
            settings.sshPublicKey = "testKey"
            result = virtualMachineSettings.validations(settings);
            expect(result.length).toEqual(0);

            settings.osAuthenticationType = null;
            result = virtualMachineSettings.validations(settings);
            expect(result.length).toEqual(1);
            expect(result[0].name).toEqual('.osAuthenticationType');

            settings.osAuthenticationType = "SSH1";
            result = virtualMachineSettings.validations(settings);
            expect(result.length).toEqual(1);
            expect(result[0].name).toEqual('.osAuthenticationType');
        });
        describe('storageAccounts:', () => {
            it('validates that nameSuffix is not null or empty', () => {
                let settings = _.cloneDeep(testSettings);

                let result = virtualMachineSettings.validations(settings);
                expect(result.length).toEqual(0);

                settings.storageAccounts.nameSuffix = "";
                result = virtualMachineSettings.validations(settings);
                expect(result.length).toEqual(1);
                expect(result[0].name).toEqual('.storageAccounts.nameSuffix');

                settings.storageAccounts.nameSuffix = null;
                result = virtualMachineSettings.validations(settings);
                expect(result.length).toEqual(1);
                expect(result[0].name).toEqual('.storageAccounts.nameSuffix');
            });
            it('validates that count is greater than 0', () => {
                let settings = _.cloneDeep(testSettings);

                let result = virtualMachineSettings.validations(settings);
                expect(result.length).toEqual(0);

                settings.storageAccounts.count = 0;
                result = virtualMachineSettings.validations(settings);
                expect(result.length).toEqual(1);
                expect(result[0].name).toEqual('.storageAccounts.count');
            });
            it('validates that skuType is not null or empty', () => {
                let settings = _.cloneDeep(testSettings);

                let result = virtualMachineSettings.validations(settings);
                expect(result.length).toEqual(0);

                settings.storageAccounts.skuType = "";
                result = virtualMachineSettings.validations(settings);
                expect(result.length).toEqual(1);
                expect(result[0].name).toEqual('.storageAccounts.skuType');

                settings.storageAccounts.skuType = null;
                result = virtualMachineSettings.validations(settings);
                expect(result.length).toEqual(1);
                expect(result[0].name).toEqual('.storageAccounts.skuType');
            });
            it('validates that managed is provided and a boolean value', () => {
                let settings = _.cloneDeep(testSettings);

                let result = virtualMachineSettings.validations(settings);
                expect(result.length).toEqual(0);

                settings.storageAccounts.managed = "true";
                result = virtualMachineSettings.validations(settings);
                expect(result.length).toEqual(1);
                expect(result[0].name).toEqual('.storageAccounts.managed');

                settings.storageAccounts.managed = null;
                result = virtualMachineSettings.validations(settings);
                expect(result.length).toEqual(1);
                expect(result[0].name).toEqual('.storageAccounts.managed');
            });
            it('validates that account is provided', () => {
                let settings = _.cloneDeep(testSettings);

                let result = virtualMachineSettings.validations(settings);
                expect(result.length).toEqual(0);

                settings.storageAccounts.accounts = null;
                result = virtualMachineSettings.validations(settings);
                expect(result.length).toEqual(1);
                expect(result[0].name).toEqual('.storageAccounts.accounts');
            });
        });
        describe('diagnosticStorageAccounts:', () => {
            it('validates that nameSuffix is not null or empty', () => {
                let settings = _.cloneDeep(testSettings);

                let result = virtualMachineSettings.validations(settings);
                expect(result.length).toEqual(0);

                settings.diagnosticStorageAccounts.nameSuffix = "";
                result = virtualMachineSettings.validations(settings);
                expect(result.length).toEqual(1);
                expect(result[0].name).toEqual('.diagnosticStorageAccounts.nameSuffix');

                settings.diagnosticStorageAccounts.nameSuffix = null;
                result = virtualMachineSettings.validations(settings);
                expect(result.length).toEqual(1);
                expect(result[0].name).toEqual('.diagnosticStorageAccounts.nameSuffix');
            });
            it('validates that count is greater than 0', () => {
                let settings = _.cloneDeep(testSettings);

                let result = virtualMachineSettings.validations(settings);
                expect(result.length).toEqual(0);

                settings.diagnosticStorageAccounts.count = 0;
                result = virtualMachineSettings.validations(settings);
                expect(result.length).toEqual(1);
                expect(result[0].name).toEqual('.diagnosticStorageAccounts.count');
            });
            it('validates that skuType is not null or empty', () => {
                let settings = _.cloneDeep(testSettings);

                let result = virtualMachineSettings.validations(settings);
                expect(result.length).toEqual(0);

                settings.diagnosticStorageAccounts.skuType = "";
                result = virtualMachineSettings.validations(settings);
                expect(result.length).toEqual(1);
                expect(result[0].name).toEqual('.diagnosticStorageAccounts.skuType');

                settings.diagnosticStorageAccounts.skuType = null;
                result = virtualMachineSettings.validations(settings);
                expect(result.length).toEqual(1);
                expect(result[0].name).toEqual('.diagnosticStorageAccounts.skuType');
            });
            it('validates that skuType is not premiun', () => {
                let settings = _.cloneDeep(testSettings);

                let result = virtualMachineSettings.validations(settings);
                expect(result.length).toEqual(0);

                settings.diagnosticStorageAccounts.skuType = "Premium_LRS";
                result = virtualMachineSettings.validations(settings);
                expect(result.length).toEqual(1);
                expect(result[0].name).toEqual('.diagnosticStorageAccounts.skuType');
            });
            it('validates that managed is provided and a boolean value', () => {
                let settings = _.cloneDeep(testSettings);

                let result = virtualMachineSettings.validations(settings);
                expect(result.length).toEqual(0);

                settings.diagnosticStorageAccounts.managed = "true";
                result = virtualMachineSettings.validations(settings);
                expect(result.length).toEqual(1);
                expect(result[0].name).toEqual('.diagnosticStorageAccounts.managed');

                settings.diagnosticStorageAccounts.managed = null;
                result = virtualMachineSettings.validations(settings);
                expect(result.length).toEqual(1);
                expect(result[0].name).toEqual('.diagnosticStorageAccounts.managed');
            });
            it('validates that managed cannot be true', () => {
                let settings = _.cloneDeep(testSettings);

                let result = virtualMachineSettings.validations(settings);
                expect(result.length).toEqual(0);

                settings.diagnosticStorageAccounts.managed = true;
                result = virtualMachineSettings.validations(settings);
                expect(result.length).toEqual(1);
                expect(result[0].name).toEqual('.diagnosticStorageAccounts.managed');
            });
            it('validates that account is provided', () => {
                let settings = _.cloneDeep(testSettings);

                let result = virtualMachineSettings.validations(settings);
                expect(result.length).toEqual(0);

                settings.diagnosticStorageAccounts.accounts = null;
                result = virtualMachineSettings.validations(settings);
                expect(result.length).toEqual(1);
                expect(result[0].name).toEqual('.diagnosticStorageAccounts.accounts');
            });
        });
        describe('windows:', () => {
            it('validates that osAuthenticationType cannot be ssh if osType is windows', () => {
                let windowsSettings = _.cloneDeep(testSettings);
                windowsSettings.osDisk.osType = "windows";
                windowsSettings.osAuthenticationType = "ssh";
                windowsSettings.sshPublicKey = "testKey";
                let result = virtualMachineSettings.validations(windowsSettings);
                expect(result.length).toEqual(1);
                expect(result[0].name).toEqual('.osAuthenticationType');
            });
        });
        describe('linux:', () => {
            it('validates that osAuthenticationType ssh can be used with linux', () => {
                let linuxSettings = _.cloneDeep(testSettings);
                linuxSettings.osDisk.osType = "linux";
                linuxSettings.osAuthenticationType = "ssh";
                linuxSettings.sshPublicKey = "testKey";
                let result = virtualMachineSettings.validations(linuxSettings);
                expect(result.length).toEqual(0);
            });
        });
    });
    describe('transform:', () => {
        it('validates that number of stamps created are based on vmcount property', () => {
            let process = virtualMachineSettings.__get__("process");
            let processedParam = process(testSettings, buildingBlockSettings);
            expect(processedParam.virtualMachines.length).toEqual(2);
        });
        it('validates that vm names are correctly computed', () => {
            let process = virtualMachineSettings.__get__("process");
            let processedParam = process(testSettings, buildingBlockSettings);
            expect(processedParam.virtualMachines[0].name).toEqual("test-vm1");
            expect(processedParam.virtualMachines[1].name).toEqual("test-vm2");
        });
        it('validates that computerNames are correctly computed', () => {
            let process = virtualMachineSettings.__get__("process");
            let processedParam = process(testSettings, buildingBlockSettings);
            expect(processedParam.virtualMachines[0].properties.osProfile.computerName).toEqual("test-vm1");
            expect(processedParam.virtualMachines[1].properties.osProfile.computerName).toEqual("test-vm2");
        });
        it('validates that vm size is added to the hardwareProfile in the output', () => {
            let process = virtualMachineSettings.__get__("process");
            let processedParam = process(testSettings, buildingBlockSettings);
            expect(processedParam.virtualMachines[0].properties.hardwareProfile.vmSize).toEqual("Standard_DS2");
            expect(processedParam.virtualMachines[1].properties.hardwareProfile.vmSize).toEqual("Standard_DS2");
        });
        it('validates that vm adminUsername is added to the osProfile in the output', () => {
            let process = virtualMachineSettings.__get__("process");
            let processedParam = process(testSettings, buildingBlockSettings);
            expect(processedParam.virtualMachines[0].properties.osProfile.adminUsername).toEqual("testadminuser");
            expect(processedParam.virtualMachines[1].properties.osProfile.adminUsername).toEqual("testadminuser");
        });
        describe('storageAccounts:', () => {
            it('validates that correct number of storage stamps are created based on the storageAccount.count property', () => {
                let settings = _.cloneDeep(testSettings);
                settings.storageAccounts.count = 5;
                let process = virtualMachineSettings.__get__("process");
                let processedParam = process(settings, buildingBlockSettings);

                expect(processedParam.storageAccounts.length).toEqual(5);
            });
            it('validates that number of storage stamps created are based on the storageAccount.count & existing accounts provided', () => {
                let settings = _.cloneDeep(testSettings);
                settings.storageAccounts.count = 5;
                settings.storageAccounts.accounts = ['a', 'b'];
                let process = virtualMachineSettings.__get__("process");
                let processedParam = process(settings, buildingBlockSettings);

                expect(processedParam.storageAccounts.length).toEqual(3);
            });
            it('validates that sku is correctly assigned in the storage stamps', () => {
                let settings = _.cloneDeep(testSettings);
                settings.storageAccounts.count = 2;
                let process = virtualMachineSettings.__get__("process");
                let processedParam = process(settings, buildingBlockSettings);

                expect(processedParam.storageAccounts[0].sku.name).toEqual("Premium_LRS");
                expect(processedParam.storageAccounts[1].sku.name).toEqual("Premium_LRS");
            });
            it('validates that kind property is correctly assigned in the storage stamps', () => {
                let settings = _.cloneDeep(testSettings);
                settings.storageAccounts.count = 2;
                let process = virtualMachineSettings.__get__("process");
                let processedParam = process(settings, buildingBlockSettings);

                expect(processedParam.storageAccounts[0].kind).toEqual("Storage");
                expect(processedParam.storageAccounts[1].kind).toEqual("Storage");
            });
            it('validates that vhd property is correctly updated in the storageprofile.osDisk', () => {
                let settings = _.cloneDeep(testSettings);
                settings.storageAccounts.count = 2;
                settings.vmCount = 5;
                let process = virtualMachineSettings.__get__("process");
                let processedParam = process(settings, buildingBlockSettings);

                expect(processedParam.virtualMachines[0].properties.storageProfile.osDisk.vhd.uri).toEqual(`http://${processedParam.storageAccounts[0].name}.blob.core.windows.net/vhds/test-vm1-os.vhd`);
                expect(processedParam.virtualMachines[1].properties.storageProfile.osDisk.vhd.uri).toEqual(`http://${processedParam.storageAccounts[1].name}.blob.core.windows.net/vhds/test-vm2-os.vhd`);
                expect(processedParam.virtualMachines[2].properties.storageProfile.osDisk.vhd.uri).toEqual(`http://${processedParam.storageAccounts[0].name}.blob.core.windows.net/vhds/test-vm3-os.vhd`);
                expect(processedParam.virtualMachines[3].properties.storageProfile.osDisk.vhd.uri).toEqual(`http://${processedParam.storageAccounts[1].name}.blob.core.windows.net/vhds/test-vm4-os.vhd`);
                expect(processedParam.virtualMachines[4].properties.storageProfile.osDisk.vhd.uri).toEqual(`http://${processedParam.storageAccounts[0].name}.blob.core.windows.net/vhds/test-vm5-os.vhd`);
            });
            it('validates that vhd property is correctly updated in the storageprofile.osDisk when existing accounts are provided', () => {
                let settings = _.cloneDeep(testSettings);
                settings.storageAccounts.count = 4;
                settings.storageAccounts.accounts = ['A', 'B'];
                settings.vmCount = 8;
                let process = virtualMachineSettings.__get__("process");
                let processedParam = process(settings, buildingBlockSettings);

                expect(processedParam.virtualMachines[0].properties.storageProfile.osDisk.vhd.uri).toEqual(`http://${settings.storageAccounts.accounts[0]}.blob.core.windows.net/vhds/test-vm1-os.vhd`);
                expect(processedParam.virtualMachines[1].properties.storageProfile.osDisk.vhd.uri).toEqual(`http://${settings.storageAccounts.accounts[1]}.blob.core.windows.net/vhds/test-vm2-os.vhd`);
                expect(processedParam.virtualMachines[2].properties.storageProfile.osDisk.vhd.uri).toEqual(`http://${processedParam.storageAccounts[0].name}.blob.core.windows.net/vhds/test-vm3-os.vhd`);
                expect(processedParam.virtualMachines[3].properties.storageProfile.osDisk.vhd.uri).toEqual(`http://${processedParam.storageAccounts[1].name}.blob.core.windows.net/vhds/test-vm4-os.vhd`);
                expect(processedParam.virtualMachines[4].properties.storageProfile.osDisk.vhd.uri).toEqual(`http://${settings.storageAccounts.accounts[0]}.blob.core.windows.net/vhds/test-vm5-os.vhd`);
                expect(processedParam.virtualMachines[5].properties.storageProfile.osDisk.vhd.uri).toEqual(`http://${settings.storageAccounts.accounts[1]}.blob.core.windows.net/vhds/test-vm6-os.vhd`);
                expect(processedParam.virtualMachines[6].properties.storageProfile.osDisk.vhd.uri).toEqual(`http://${processedParam.storageAccounts[0].name}.blob.core.windows.net/vhds/test-vm7-os.vhd`);
                expect(processedParam.virtualMachines[7].properties.storageProfile.osDisk.vhd.uri).toEqual(`http://${processedParam.storageAccounts[1].name}.blob.core.windows.net/vhds/test-vm8-os.vhd`);
            });
            it('validates that vhd property is correctly updated in the storageprofile.dataDisk', () => {
                let settings = _.cloneDeep(testSettings);
                settings.storageAccounts.count = 2;
                settings.vmCount = 5;
                settings.dataDisks.count = 2;
                let process = virtualMachineSettings.__get__("process");
                let processedParam = process(settings, buildingBlockSettings);

                expect(processedParam.virtualMachines[0].properties.storageProfile.dataDisks[0].vhd.uri).toEqual(`http://${processedParam.storageAccounts[0].name}.blob.core.windows.net/vhds/test-vm1-dataDisk1.vhd`);
                expect(processedParam.virtualMachines[1].properties.storageProfile.dataDisks[0].vhd.uri).toEqual(`http://${processedParam.storageAccounts[1].name}.blob.core.windows.net/vhds/test-vm2-dataDisk1.vhd`);
                expect(processedParam.virtualMachines[2].properties.storageProfile.dataDisks[0].vhd.uri).toEqual(`http://${processedParam.storageAccounts[0].name}.blob.core.windows.net/vhds/test-vm3-dataDisk1.vhd`);
                expect(processedParam.virtualMachines[3].properties.storageProfile.dataDisks[0].vhd.uri).toEqual(`http://${processedParam.storageAccounts[1].name}.blob.core.windows.net/vhds/test-vm4-dataDisk1.vhd`);
                expect(processedParam.virtualMachines[4].properties.storageProfile.dataDisks[0].vhd.uri).toEqual(`http://${processedParam.storageAccounts[0].name}.blob.core.windows.net/vhds/test-vm5-dataDisk1.vhd`);

                expect(processedParam.virtualMachines[0].properties.storageProfile.dataDisks[1].vhd.uri).toEqual(`http://${processedParam.storageAccounts[0].name}.blob.core.windows.net/vhds/test-vm1-dataDisk2.vhd`);
                expect(processedParam.virtualMachines[1].properties.storageProfile.dataDisks[1].vhd.uri).toEqual(`http://${processedParam.storageAccounts[1].name}.blob.core.windows.net/vhds/test-vm2-dataDisk2.vhd`);
                expect(processedParam.virtualMachines[2].properties.storageProfile.dataDisks[1].vhd.uri).toEqual(`http://${processedParam.storageAccounts[0].name}.blob.core.windows.net/vhds/test-vm3-dataDisk2.vhd`);
                expect(processedParam.virtualMachines[3].properties.storageProfile.dataDisks[1].vhd.uri).toEqual(`http://${processedParam.storageAccounts[1].name}.blob.core.windows.net/vhds/test-vm4-dataDisk2.vhd`);
                expect(processedParam.virtualMachines[4].properties.storageProfile.dataDisks[1].vhd.uri).toEqual(`http://${processedParam.storageAccounts[0].name}.blob.core.windows.net/vhds/test-vm5-dataDisk2.vhd`);
            });
            it('validates that vhd property is correctly updated in the storageprofile.osDisk when existing accounts are provided', () => {
                let settings = _.cloneDeep(testSettings);
                settings.storageAccounts.count = 4;
                settings.storageAccounts.accounts = ['A', 'B'];
                settings.vmCount = 8;
                settings.dataDisks.count = 1;
                let process = virtualMachineSettings.__get__("process");
                let processedParam = process(settings, buildingBlockSettings);

                expect(processedParam.virtualMachines[0].properties.storageProfile.dataDisks[0].vhd.uri).toEqual(`http://${settings.storageAccounts.accounts[0]}.blob.core.windows.net/vhds/test-vm1-dataDisk1.vhd`);
                expect(processedParam.virtualMachines[1].properties.storageProfile.dataDisks[0].vhd.uri).toEqual(`http://${settings.storageAccounts.accounts[1]}.blob.core.windows.net/vhds/test-vm2-dataDisk1.vhd`);
                expect(processedParam.virtualMachines[2].properties.storageProfile.dataDisks[0].vhd.uri).toEqual(`http://${processedParam.storageAccounts[0].name}.blob.core.windows.net/vhds/test-vm3-dataDisk1.vhd`);
                expect(processedParam.virtualMachines[3].properties.storageProfile.dataDisks[0].vhd.uri).toEqual(`http://${processedParam.storageAccounts[1].name}.blob.core.windows.net/vhds/test-vm4-dataDisk1.vhd`);
                expect(processedParam.virtualMachines[4].properties.storageProfile.dataDisks[0].vhd.uri).toEqual(`http://${settings.storageAccounts.accounts[0]}.blob.core.windows.net/vhds/test-vm5-dataDisk1.vhd`);
                expect(processedParam.virtualMachines[5].properties.storageProfile.dataDisks[0].vhd.uri).toEqual(`http://${settings.storageAccounts.accounts[1]}.blob.core.windows.net/vhds/test-vm6-dataDisk1.vhd`);
                expect(processedParam.virtualMachines[6].properties.storageProfile.dataDisks[0].vhd.uri).toEqual(`http://${processedParam.storageAccounts[0].name}.blob.core.windows.net/vhds/test-vm7-dataDisk1.vhd`);
                expect(processedParam.virtualMachines[7].properties.storageProfile.dataDisks[0].vhd.uri).toEqual(`http://${processedParam.storageAccounts[1].name}.blob.core.windows.net/vhds/test-vm8-dataDisk1.vhd`);
            });
        });
        describe('diagnosticStorageAccounts:', () => {
            it('validates that correct number of diag storage stamps are created based on the diagnosticStorageAccounts.count property', () => {
                let settings = _.cloneDeep(testSettings);
                settings.diagnosticStorageAccounts.count = 5;
                let process = virtualMachineSettings.__get__("process");
                let processedParam = process(settings, buildingBlockSettings);

                expect(processedParam.diagnosticStorageAccounts.length).toEqual(5);
            });
            it('validates that number of diag storage stamps created are based on the diagnosticStorageAccounts.count & existing accounts provided', () => {
                let settings = _.cloneDeep(testSettings);
                settings.diagnosticStorageAccounts.count = 5;
                settings.diagnosticStorageAccounts.accounts = ['a', 'b'];
                let process = virtualMachineSettings.__get__("process");
                let processedParam = process(settings, buildingBlockSettings);

                expect(processedParam.diagnosticStorageAccounts.length).toEqual(3);
            });
            it('validates that sku is correctly assigned in the storage stamps', () => {
                let settings = _.cloneDeep(testSettings);
                settings.diagnosticStorageAccounts.count = 2;
                let process = virtualMachineSettings.__get__("process");
                let processedParam = process(settings, buildingBlockSettings);

                expect(processedParam.diagnosticStorageAccounts[0].sku.name).toEqual("Standard_LRS");
                expect(processedParam.diagnosticStorageAccounts[1].sku.name).toEqual("Standard_LRS");
            });
            it('validates that kind property is correctly assigned in the storage stamps', () => {
                let settings = _.cloneDeep(testSettings);
                settings.diagnosticStorageAccounts.count = 2;
                let process = virtualMachineSettings.__get__("process");
                let processedParam = process(settings, buildingBlockSettings);

                expect(processedParam.diagnosticStorageAccounts[0].kind).toEqual("Storage");
                expect(processedParam.diagnosticStorageAccounts[1].kind).toEqual("Storage");
            });
            it('validates that storageUri property is correctly updated in the diagnosticsProfile', () => {
                let settings = _.cloneDeep(testSettings);
                settings.diagnosticStorageAccounts.count = 2;
                settings.vmCount = 5;
                let process = virtualMachineSettings.__get__("process");
                let processedParam = process(settings, buildingBlockSettings);

                expect(processedParam.virtualMachines[0].properties.diagnosticsProfile.bootDiagnostics.storageUri).toEqual(`http://${processedParam.diagnosticStorageAccounts[0].name}.blob.core.windows.net`);
                expect(processedParam.virtualMachines[1].properties.diagnosticsProfile.bootDiagnostics.storageUri).toEqual(`http://${processedParam.diagnosticStorageAccounts[1].name}.blob.core.windows.net`);
                expect(processedParam.virtualMachines[2].properties.diagnosticsProfile.bootDiagnostics.storageUri).toEqual(`http://${processedParam.diagnosticStorageAccounts[0].name}.blob.core.windows.net`);
                expect(processedParam.virtualMachines[3].properties.diagnosticsProfile.bootDiagnostics.storageUri).toEqual(`http://${processedParam.diagnosticStorageAccounts[1].name}.blob.core.windows.net`);
                expect(processedParam.virtualMachines[4].properties.diagnosticsProfile.bootDiagnostics.storageUri).toEqual(`http://${processedParam.diagnosticStorageAccounts[0].name}.blob.core.windows.net`);
            });
            it('validates that storageUri property is correctly updated in the diagnosticsProfile when existing accounts are provided', () => {
                let settings = _.cloneDeep(testSettings);
                settings.diagnosticStorageAccounts.count = 4;
                settings.diagnosticStorageAccounts.accounts = ['A', 'B'];
                settings.vmCount = 8;
                let process = virtualMachineSettings.__get__("process");
                let processedParam = process(settings, buildingBlockSettings);

                expect(processedParam.virtualMachines[0].properties.diagnosticsProfile.bootDiagnostics.storageUri).toEqual(`http://${settings.diagnosticStorageAccounts.accounts[0]}.blob.core.windows.net`);
                expect(processedParam.virtualMachines[1].properties.diagnosticsProfile.bootDiagnostics.storageUri).toEqual(`http://${settings.diagnosticStorageAccounts.accounts[1]}.blob.core.windows.net`);
                expect(processedParam.virtualMachines[2].properties.diagnosticsProfile.bootDiagnostics.storageUri).toEqual(`http://${processedParam.diagnosticStorageAccounts[0].name}.blob.core.windows.net`);
                expect(processedParam.virtualMachines[3].properties.diagnosticsProfile.bootDiagnostics.storageUri).toEqual(`http://${processedParam.diagnosticStorageAccounts[1].name}.blob.core.windows.net`);
                expect(processedParam.virtualMachines[4].properties.diagnosticsProfile.bootDiagnostics.storageUri).toEqual(`http://${settings.diagnosticStorageAccounts.accounts[0]}.blob.core.windows.net`);
                expect(processedParam.virtualMachines[5].properties.diagnosticsProfile.bootDiagnostics.storageUri).toEqual(`http://${settings.diagnosticStorageAccounts.accounts[1]}.blob.core.windows.net`);
                expect(processedParam.virtualMachines[6].properties.diagnosticsProfile.bootDiagnostics.storageUri).toEqual(`http://${processedParam.diagnosticStorageAccounts[0].name}.blob.core.windows.net`);
                expect(processedParam.virtualMachines[7].properties.diagnosticsProfile.bootDiagnostics.storageUri).toEqual(`http://${processedParam.diagnosticStorageAccounts[1].name}.blob.core.windows.net`);
            });
        });
        describe('windows:', () => {
            let windowsSettings = _.cloneDeep(testSettings);
            windowsSettings.osDisk.osType = "windows";
            it('validates that for password osAuthenticationType, windowsConfiguration is added to the osProfile', () => {
                let process = virtualMachineSettings.__get__("process");
                let processedParam = process(windowsSettings, buildingBlockSettings);
                expect(processedParam.virtualMachines[0].properties.osProfile.hasOwnProperty('windowsConfiguration')).toEqual(true);
                expect(processedParam.virtualMachines[1].properties.osProfile.hasOwnProperty('windowsConfiguration')).toEqual(true);
            });
            it('validates that for password osAuthenticationType, vmAgent is configured in windowsConfiguration', () => {
                let process = virtualMachineSettings.__get__("process");
                let processedParam = process(windowsSettings, buildingBlockSettings);
                expect(processedParam.virtualMachines[0].properties.osProfile.windowsConfiguration.provisionVmAgent).toEqual(true);
                expect(processedParam.virtualMachines[1].properties.osProfile.windowsConfiguration.provisionVmAgent).toEqual(true);
            });
            it('validates that for password osAuthenticationType, adminPassword is set in the osProfile', () => {
                let process = virtualMachineSettings.__get__("process");
                let processedParam = process(windowsSettings, buildingBlockSettings);
                expect(processedParam.virtualMachines[0].properties.osProfile.adminPassword).toEqual("$SECRET$");
                expect(processedParam.virtualMachines[1].properties.osProfile.adminPassword).toEqual("$SECRET$");
                expect(processedParam.secret).toEqual(windowsSettings.adminPassword);
            });
        });
        describe('linux:', () => {
            it('validates that for password osAuthenticationType, linuxConfiguration in osProfile is set to null', () => {
                let linuxSettings = _.cloneDeep(testSettings);
                linuxSettings.osDisk.osType = "linux";
                let process = virtualMachineSettings.__get__("process");
                let processedParam = process(linuxSettings, buildingBlockSettings);
                expect(processedParam.virtualMachines[0].properties.osProfile.hasOwnProperty('linuxConfiguration')).toEqual(true);
                expect(processedParam.virtualMachines[0].properties.osProfile.linuxConfiguration).toEqual(null);
                expect(processedParam.virtualMachines[1].properties.osProfile.hasOwnProperty('linuxConfiguration')).toEqual(true);
                expect(processedParam.virtualMachines[1].properties.osProfile.linuxConfiguration).toEqual(null);
            });
            it('validates that for password osAuthenticationType, adminPassword is set in the osProfile', () => {
                let linuxSettings = _.cloneDeep(testSettings);
                linuxSettings.osDisk.osType = "linux";
                let process = virtualMachineSettings.__get__("process");
                let processedParam = process(linuxSettings, buildingBlockSettings);
                expect(processedParam.virtualMachines[0].properties.osProfile.adminPassword).toEqual("$SECRET$");
                expect(processedParam.virtualMachines[1].properties.osProfile.adminPassword).toEqual("$SECRET$");
                expect(processedParam.secret).toEqual(linuxSettings.adminPassword);
            });
            it('validates that for ssh osAuthenticationType, linuxConfiguration is correctly added to the osProfile', () => {
                let linuxSettings = _.cloneDeep(testSettings);
                linuxSettings.osDisk.osType = "linux";
                linuxSettings.osAuthenticationType = "ssh";
                linuxSettings.sshPublicKey = "testKey";
                let process = virtualMachineSettings.__get__("process");
                let processedParam = process(linuxSettings, buildingBlockSettings);
                expect(processedParam.virtualMachines[0].properties.osProfile.hasOwnProperty('linuxConfiguration')).toEqual(true);
                expect(processedParam.virtualMachines[0].properties.osProfile.linuxConfiguration.disablePasswordAuthentication).toEqual(true);
                expect(processedParam.virtualMachines[0].properties.osProfile.linuxConfiguration.ssh.publicKeys[0].path).toEqual(`/home/${linuxSettings.adminUsername}/.ssh/authorized_keys`);
                expect(processedParam.virtualMachines[0].properties.osProfile.linuxConfiguration.ssh.publicKeys[0].keyData).toEqual('$SECRET$');

                expect(processedParam.virtualMachines[1].properties.osProfile.hasOwnProperty('linuxConfiguration')).toEqual(true);
                expect(processedParam.virtualMachines[1].properties.osProfile.linuxConfiguration.disablePasswordAuthentication).toEqual(true);
                expect(processedParam.virtualMachines[1].properties.osProfile.linuxConfiguration.ssh.publicKeys[0].path).toEqual(`/home/${linuxSettings.adminUsername}/.ssh/authorized_keys`);
                expect(processedParam.virtualMachines[1].properties.osProfile.linuxConfiguration.ssh.publicKeys[0].keyData).toEqual('$SECRET$');
            });
            it('validates that for ssh osAuthenticationType, adminPassword is set to null', () => {
                let linuxSettings = _.cloneDeep(testSettings);
                linuxSettings.osDisk.osType = "linux";
                linuxSettings.osAuthenticationType = "ssh";
                linuxSettings.sshPublicKey = "testKey";
                let process = virtualMachineSettings.__get__("process");
                let processedParam = process(linuxSettings, buildingBlockSettings);
                expect(processedParam.virtualMachines[0].properties.osProfile.adminPassword).toEqual(null);
                expect(processedParam.virtualMachines[1].properties.osProfile.adminPassword).toEqual(null);
            });
        });
    });
});

