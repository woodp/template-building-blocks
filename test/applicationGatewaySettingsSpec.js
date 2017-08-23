describe('applicationGatewaySettings:', () => {
    let rewire = require('rewire');
    let applicationGatewaySettings = rewire('../src/core/applicationGatewaySettings.js');
    let v = require('../src/core/validation.js');
    let _ = require('lodash');

    let buildingBlockSettings = {
        subscriptionId: '00000000-0000-1000-8000-000000000000',
        resourceGroupName: 'test-vnet-rg',
        location: 'westus'
    };

    let fixBlockSettingsAfterMerge = (merged) => {
        //TO DO: would be set by VM or scaleSet, must be fixed if appGateway makes it to a stand alone (root) object
        merged.frontendIPConfigurations[0].publicIpAddress.subscriptionId = '00000000-0000-1000-8000-000000000000';
        merged.frontendIPConfigurations[0].publicIpAddress.resourceGroupName = 'test-vnet-rg';
        merged.frontendIPConfigurations[0].publicIpAddress.location = 'westus';
    };

    describe('valid validations:', () => {
        it('validate valid defaults are applied.', () => {
            let merged = applicationGatewaySettings.merge({
                settings: {},
                buildingBlockSettings: buildingBlockSettings
            });

            fixBlockSettingsAfterMerge(merged);

            let result = v.validate({
                settings: merged,
                validations: applicationGatewaySettings.validations
            });
            expect(result.length).toEqual(0);
        });

        it('sku validations', () => {
            let skuValidations = applicationGatewaySettings.__get__('skuValidations');
            let testSettings = {
                sku: {
                    name: 'Standard_Small',
                    tier: 'Standard',
                    capacity: 2
                }
            };
            let result = v.validate({
                settings: testSettings.sku,
                validations: skuValidations
            });
            expect(result.length).toEqual(0);
        });
    });
    describe('validations', () => {
        let skuValidations = applicationGatewaySettings.__get__('skuValidations');

        let mergeAndValidate = (settings, buildingBlockSettings) => {
            let merged = applicationGatewaySettings.merge({
                settings: settings,
                buildingBlockSettings: buildingBlockSettings
            });
            //TO DO: would be set by VM or scaleSet, must be fixed if appGateway makes it to a stand alone (root) object
            fixBlockSettingsAfterMerge(merged);
            return v.validate({
                settings: merged,
                validations: applicationGatewaySettings.validations
            });
        };

        let testSettings = {
            sku: {
                name: 'Standard_Small',
                tier: 'Standard',
                capacity: 2
            },
            frontendIPConfigurations: [
                {
                    name: 'appGatewayFrontendIP',
                    applicationGatewayType: 'Public'
                }
            ],
            httpListeners: [
                {
                    name: 'appGatewayHttpListener',
                    frontendIPConfigurationName: 'appGatewayFrontendIP',
                    frontendPortName: 'appGatewayFrontendPort',
                    protocol: 'Http',
                    requireServerNameIndication: false
                }
            ],
            backendHttpSettingsCollection: [
                {
                    name: 'appGatewayBackendHttpSettings',
                    port: 80,
                    protocol: 'Https',
                    cookieBasedAffinity: 'Disabled',
                    pickHostNameFromBackendAddress: false,
                    probeEnabled: true,
                    requestTimeout: 30,
                    probeName: 'p1'
                }
            ],
            backendAddressPools: [
                {
                    name: 'appGatewayBackendPool',
                    backendAddresses: [
                        {
                            fqdn: 'www.contoso.com'
                        }
                    ]
                }
            ],
            urlPathMaps: [
                {
                    name: 'pb-rule1',
                    defaultBackendAddressPoolName: 'appGatewayBackendPool',
                    defaultBackendHttpSettingName: 'appGatewayBackendHttpSettings',
                    pathRules: [
                        {
                            name: 'p2',
                            paths: ['/path'],
                            backendAddressPoolName: 'appGatewayBackendPool',
                            backendHttpSettingName: 'appGatewayBackendHttpSettings'
                        }
                    ]
                }
            ],
            requestRoutingRules: [
                {
                    name: 'rule1',
                    ruleType: 'Basic',
                    httpListenerName: 'appGatewayHttpListener',
                    backendAddressPoolName: 'appGatewayBackendPool',
                    backendHttpSettingName: 'appGatewayBackendHttpSettings'
                }
            ],
            frontendPorts: [
                {
                    name: 'appGatewayFrontendPort',
                    port: 80
                }
            ]
        };
        let settings;
        beforeEach(() => {
            settings = _.cloneDeep(testSettings);
        });

        it('sku name validation', () => {
            settings.sku.name = 'invalid';
            let result = v.validate({
                settings: settings.sku,
                validations: skuValidations
            });
            expect(result.length).toEqual(1);
            expect(result[0].name).toEqual('.name');
        });
        it('sku tier validation', () => {
            settings.sku.tier = 'invalid';
            let result = v.validate({
                settings: settings.sku,
                validations: skuValidations
            });
            expect(result.length).toEqual(1);
            expect(result[0].name).toEqual('.tier');
        });

        it('gatewayIPConfigurations subnet must be provided', () => {
            settings.gatewayIPConfigurations = [ { name: 'appGatewayIpConfig' } ];
            let result = mergeAndValidate(settings, buildingBlockSettings);
            expect(result.length).toEqual(1);
            expect(result[0].name).toEqual('.gatewayIPConfigurations[0].subnetName');
        });
        it('frontendIPConfigurations cannot have 2 internal', () => {
            settings.frontendIPConfigurations = [
                {
                    name: 'appGatewayFrontendIP',
                    applicationGatewayType: 'Internal'
                },
                {
                    name: 'testfec',
                    applicationGatewayType: 'Internal',
                    internalApplicationGatewaySettings: {
                        subnetName: 'biz'
                    }
                }
            ];
            let merged = applicationGatewaySettings.merge({
                settings: settings,
                buildingBlockSettings: buildingBlockSettings
            });
            let result = v.validate({
                settings: merged,
                validations: applicationGatewaySettings.validations
            });
            expect(result.length).toEqual(1);
            expect(result[0].name).toEqual('.frontendIPConfigurations');
        });
        it('frontendIPConfigurations cannot have 2 public', () => {
            settings.frontendIPConfigurations = [
                {
                    name: 'appGatewayFrontendIP',
                    applicationGatewayType: 'Public'
                },
                {
                    name: 'testfec',
                    applicationGatewayType: 'Public'
                }
            ];
            let result = mergeAndValidate(settings, buildingBlockSettings);
            expect(result.length).toEqual(1);
            expect(result[0].name).toEqual('.frontendIPConfigurations');
        });
        it('frontendIPConfigurations cannot have more than 2', () => {
            settings.frontendIPConfigurations = [
                {
                    name: 'appGatewayFrontendIP',
                    applicationGatewayType: 'Public'
                },
                {
                    name: 'testfec',
                    applicationGatewayType: 'Internal',
                    internalApplicationGatewaySettings: {
                        subnetName: 'biz'
                    }
                },
                {
                    name: 'sdfdsf',
                    applicationGatewayType: 'Public'
                }
            ];
            let result = mergeAndValidate(settings, buildingBlockSettings);
            expect(result.length).toEqual(1);
            expect(result[0].name).toEqual('.frontendIPConfigurations');
        });
        it('valid frontendIPConfigurations', () => {
            settings.frontendIPConfigurations = [
                {
                    name: 'appGatewayFrontendIP',
                    applicationGatewayType: 'Public'
                },
                {
                    name: 'testfec',
                    applicationGatewayType: 'Internal',
                    internalApplicationGatewaySettings: {
                        subnetName: 'biz'
                    }
                }
            ];
            let result = mergeAndValidate(settings, buildingBlockSettings);
            expect(result.length).toEqual(0);
        });
        it('frontendIPConfigurations can have only one internal', () => {
            settings.frontendIPConfigurations = [
                {
                    name: 'appGatewayFrontendIP',
                    applicationGatewayType: 'Internal',
                    internalApplicationGatewaySettings: {
                        subnetName: 'biz'
                    }
                }
            ];
            let merged = applicationGatewaySettings.merge({
                settings: settings,
                buildingBlockSettings: buildingBlockSettings
            });
            let result = v.validate({
                settings: merged,
                validations: applicationGatewaySettings.validations
            });
            expect(result.length).toEqual(0);
        });
        it('frontendIPConfigurations can have only one public', () => {
            settings.frontendIPConfigurations = [
                {
                    name: 'appGatewayFrontendIP',
                    applicationGatewayType: 'Public'
                }
            ];
            let result = mergeAndValidate(settings, buildingBlockSettings);
            expect(result.length).toEqual(0);
        });
        it('frontendIPConfigurations internalApplicationGatewaySettings cannot be specified if type is not Internal', () => {
            settings.frontendIPConfigurations = [
                {
                    name: 'appGatewayFrontendIP',
                    applicationGatewayType: 'Public',
                    internalApplicationGatewaySettings: {
                        subnetName: 'biz'
                    }
                }
            ];
            let result = mergeAndValidate(settings, buildingBlockSettings);
            expect(result.length).toEqual(1);
            expect(result[0].name).toEqual('.frontendIPConfigurations[0].internalApplicationGatewaySettings');
        });
        it('frontendIPConfigurations internalApplicationGatewaySettings must be specified if type is Internal', () => {
            settings.frontendIPConfigurations = [
                {
                    name: 'appGatewayFrontendIP',
                    applicationGatewayType: 'Internal'
                }
            ];
            let merged = applicationGatewaySettings.merge({
                settings: settings,
                buildingBlockSettings: buildingBlockSettings
            });
            let result = v.validate({
                settings: merged,
                validations: applicationGatewaySettings.validations
            });
            expect(result.length).toEqual(1);
            expect(result[0].name).toEqual('.frontendIPConfigurations[0].internalApplicationGatewaySettings');
        });

        it('valid frontendPorts', () => {
            settings.frontendPorts = [
                {
                    name: 'appGatewayFrontendPort',
                    port: 80
                },
                {
                    name: 'list1-http1',
                    port: 81
                }
            ];
            let result = mergeAndValidate(settings, buildingBlockSettings);
            expect(result.length).toEqual(0);
        });
        it('frontendPorts port must be between 0 and 65535', () => {
            settings.frontendPorts = [
                {
                    name: 'appGatewayFrontendPort',
                    port: 187569
                }
            ];
            let result = mergeAndValidate(settings, buildingBlockSettings);
            expect(result.length).toEqual(1);
            expect(result[0].name).toEqual('.frontendPorts[0].port');
        });
        it('valid backendHttpSettingsCollection port must be between 0 and 65535', () => {
            settings.backendHttpSettingsCollection = [
                {
                    name: 'appGatewayBackendHttpSettings',
                    port: 80,
                    protocol: 'Http',
                    cookieBasedAffinity: 'Disabled',
                    pickHostNameFromBackendAddress: false,
                    probeEnabled: true,
                    requestTimeout: 30,
                    probeName: 'p1'
                },
                {
                    name: 'test-settings',
                    port: 80,
                    protocol: 'Http',
                    cookieBasedAffinity: 'Enabled',
                    pickHostNameFromBackendAddress: false,
                    probeEnabled: true,
                    requestTimeout: 20,
                    probeName: 'p2'
                }
            ];

            let result = mergeAndValidate(settings, buildingBlockSettings);
            expect(result.length).toEqual(0);
        });
        it('backendHttpSettingsCollection port must be between 0 and 65535', () => {
            settings.backendHttpSettingsCollection = [
                {
                    name: 'appGatewayBackendHttpSettings',
                    port: 800234,
                    protocol: 'Http',
                    cookieBasedAffinity: 'Disabled',
                    pickHostNameFromBackendAddress: false,
                    probeEnabled: true,
                    requestTimeout: 30,
                    probeName: 'p1'
                }
            ];

            let result = mergeAndValidate(settings, buildingBlockSettings);
            expect(result.length).toEqual(1);
            expect(result[0].name).toEqual('.backendHttpSettingsCollection[0].port');
        });
        it('backendHttpSettingsCollection protocol must be Http or Https', () => {
            settings.backendHttpSettingsCollection = [
                {
                    name: 'appGatewayBackendHttpSettings',
                    port: 80,
                    protocol: 'invalid',
                    cookieBasedAffinity: 'Disabled',
                    pickHostNameFromBackendAddress: false,
                    probeEnabled: true,
                    requestTimeout: 30,
                    probeName: 'p1'
                }
            ];

            let result = mergeAndValidate(settings, buildingBlockSettings);
            expect(result.length).toEqual(1);
            expect(result[0].name).toEqual('.backendHttpSettingsCollection[0].protocol');
        });
        it('backendHttpSettingsCollection probeEnabled must be boolean', () => {
            settings.backendHttpSettingsCollection = [
                {
                    name: 'appGatewayBackendHttpSettings',
                    port: 80,
                    protocol: 'Https',
                    cookieBasedAffinity: 'Disabled',
                    pickHostNameFromBackendAddress: false,
                    probeEnabled: 'invalid',
                    requestTimeout: 30,
                    probeName: 'p1'
                }
            ];

            let result = mergeAndValidate(settings, buildingBlockSettings);
            expect(result.length).toEqual(1);
            expect(result[0].name).toEqual('.backendHttpSettingsCollection[0].probeEnabled');
        });
        it('backendHttpSettingsCollection probeEnabled must be boolean', () => {
            settings.backendHttpSettingsCollection = [
                {
                    name: 'appGatewayBackendHttpSettings',
                    port: 80,
                    protocol: 'Https',
                    cookieBasedAffinity: 'Disabled',
                    pickHostNameFromBackendAddress: 'invalid',
                    probeEnabled: true,
                    requestTimeout: 30,
                    probeName: 'p1'
                }
            ];

            let result = mergeAndValidate(settings, buildingBlockSettings);
            expect(result.length).toEqual(1);
            expect(result[0].name).toEqual('.backendHttpSettingsCollection[0].pickHostNameFromBackendAddress');
        });
        it('backendHttpSettingsCollection cookieBasedAffinity must be enabled or disabled', () => {
            settings.backendHttpSettingsCollection = [
                {
                    name: 'appGatewayBackendHttpSettings',
                    port: 80,
                    protocol: 'Https',
                    cookieBasedAffinity: 'invalid',
                    pickHostNameFromBackendAddress: false,
                    probeEnabled: true,
                    requestTimeout: 30,
                    probeName: 'p1'
                }
            ];

            let result = mergeAndValidate(settings, buildingBlockSettings);
            expect(result.length).toEqual(1);
            expect(result[0].name).toEqual('.backendHttpSettingsCollection[0].cookieBasedAffinity');
        });

        it('valid httpListeners', () => {
            settings.httpListeners = [
                {
                    name: 'appGatewayHttpListener',
                    frontendIPConfigurationName: 'appGatewayFrontendIP',
                    frontendPortName: 'appGatewayFrontendPort',
                    protocol: 'Http',
                    requireServerNameIndication: false
                }
            ];

            let result = mergeAndValidate(settings, buildingBlockSettings);
            expect(result.length).toEqual(0);
        });
        it('httpListeners frontendIPConfigurationName must match one in frontendIPConfigurations', () => {
            settings.frontendIPConfigurations = [
                {
                    name: 'appGatewayFrontendIP',
                    applicationGatewayType: 'Public'
                }
            ];
            settings.httpListeners = [
                {
                    name: 'appGatewayHttpListener',
                    frontendIPConfigurationName: 'invalid',
                    frontendPortName: 'appGatewayFrontendPort',
                    protocol: 'Http',
                    requireServerNameIndication: false
                }
            ];

            let result = mergeAndValidate(settings, buildingBlockSettings);
            expect(result.length).toEqual(1);
            expect(result[0].name).toEqual('.httpListeners[0].frontendIPConfigurationName');
        });
        it('httpListeners frontendPortName must match one in frontendPorts', () => {
            settings.httpListeners = [
                {
                    name: 'appGatewayHttpListener',
                    frontendIPConfigurationName: 'appGatewayFrontendIP',
                    frontendPortName: 'invalid',
                    protocol: 'Http',
                    requireServerNameIndication: false
                }
            ];

            let result = mergeAndValidate(settings, buildingBlockSettings);
            expect(result.length).toEqual(1);
            expect(result[0].name).toEqual('.httpListeners[0].frontendPortName');
        });
        it('httpListeners requireServerNameIndication must be boolean', () => {
            settings.httpListeners = [
                {
                    name: 'appGatewayHttpListener',
                    frontendIPConfigurationName: 'appGatewayFrontendIP',
                    frontendPortName: 'appGatewayFrontendPort',
                    protocol: 'Http',
                    requireServerNameIndication: 'invalid'
                }
            ];

            let result = mergeAndValidate(settings, buildingBlockSettings);
            expect(result.length).toEqual(1);
            expect(result[0].name).toEqual('.httpListeners[0].requireServerNameIndication');
        });
        it('httpListeners protocol must be Http or Https', () => {
            settings.httpListeners = [
                {
                    name: 'appGatewayHttpListener',
                    frontendIPConfigurationName: 'appGatewayFrontendIP',
                    frontendPortName: 'appGatewayFrontendPort',
                    protocol: 'invalid',
                    requireServerNameIndication: false
                }
            ];

            let result = mergeAndValidate(settings, buildingBlockSettings);
            expect(result.length).toEqual(1);
            expect(result[0].name).toEqual('.httpListeners[0].protocol');
        });

        it('urlPathMaps valid settings', () => {
            settings.urlPathMaps = [
                {
                    name: 'pb-rule1',
                    defaultBackendAddressPoolName: 'appGatewayBackendPool',
                    defaultBackendHttpSettingName: 'appGatewayBackendHttpSettings',
                    pathRules: [
                        {
                            name: 'p2',
                            paths: [
                                '/bar'
                            ],
                            backendAddressPoolName: 'appGatewayBackendPool',
                            backendHttpSettingName: 'appGatewayBackendHttpSettings'
                        }
                    ]
                }
            ];

            let result = mergeAndValidate(settings, buildingBlockSettings);
            expect(result.length).toEqual(0);
        });
        it('urlPathMaps invalid defaultBackendAddressPoolName', () => {
            settings.urlPathMaps = [
                {
                    name: 'pb-rule1',
                    defaultBackendAddressPoolName: 'invalid',
                    defaultBackendHttpSettingName: 'appGatewayBackendHttpSettings',
                    pathRules: [
                        {
                            name: 'p2',
                            paths: [
                                '/bar'
                            ],
                            backendAddressPoolName: 'appGatewayBackendPool',
                            backendHttpSettingName: 'appGatewayBackendHttpSettings'
                        }
                    ]
                }
            ];

            let result = mergeAndValidate(settings, buildingBlockSettings);
            expect(result.length).toEqual(1);
            expect(result[0].name).toEqual('.urlPathMaps[0].defaultBackendAddressPoolName');
        });
        it('urlPathMaps invalid defaultBackendHttpSettingName', () => {
            settings.urlPathMaps = [
                {
                    name: 'pb-rule1',
                    defaultBackendAddressPoolName: 'appGatewayBackendPool',
                    defaultBackendHttpSettingName: 'invalid',
                    pathRules: [
                        {
                            name: 'p2',
                            paths: [
                                '/bar'
                            ],
                            backendAddressPoolName: 'appGatewayBackendPool',
                            backendHttpSettingName: 'appGatewayBackendHttpSettings'
                        }
                    ]
                }
            ];

            let result = mergeAndValidate(settings, buildingBlockSettings);
            expect(result.length).toEqual(1);
            expect(result[0].name).toEqual('.urlPathMaps[0].defaultBackendHttpSettingName');
        });
        it('urlPathMaps invalid backendAddressPoolName', () => {
            settings.urlPathMaps = [
                {
                    name: 'pb-rule1',
                    defaultBackendAddressPoolName: 'appGatewayBackendPool',
                    defaultBackendHttpSettingName: 'appGatewayBackendHttpSettings',
                    pathRules: [
                        {
                            name: 'p2',
                            paths: [
                                '/bar'
                            ],
                            backendAddressPoolName: 'invalid',
                            backendHttpSettingName: 'appGatewayBackendHttpSettings'
                        }
                    ]
                }
            ];

            let result = mergeAndValidate(settings, buildingBlockSettings);
            expect(result.length).toEqual(1);
            expect(result[0].name).toEqual('.urlPathMaps[0].pathRules[0].backendAddressPoolName');
        });
        it('urlPathMaps invalid backendHttpSettingName', () => {
            settings.urlPathMaps = [
                {
                    name: 'pb-rule1',
                    defaultBackendAddressPoolName: 'appGatewayBackendPool',
                    defaultBackendHttpSettingName: 'appGatewayBackendHttpSettings',
                    pathRules: [
                        {
                            name: 'p2',
                            paths: [
                                '/bar'
                            ],
                            backendAddressPoolName: 'appGatewayBackendPool',
                            backendHttpSettingName: 'invalid'
                        }
                    ]
                }
            ];

            let result = mergeAndValidate(settings, buildingBlockSettings);
            expect(result.length).toEqual(1);
            expect(result[0].name).toEqual('.urlPathMaps[0].pathRules[0].backendHttpSettingName');
        });
        it('urlPathMaps pathRules cannot be undefined', () => {
            settings.urlPathMaps = [
                {
                    name: 'pb-rule1',
                    defaultBackendAddressPoolName: 'appGatewayBackendPool',
                    defaultBackendHttpSettingName: 'appGatewayBackendHttpSettings'
                }
            ];

            let result = mergeAndValidate(settings, buildingBlockSettings);
            expect(result.length).toEqual(1);
            expect(result[0].name).toEqual('.urlPathMaps[0].pathRules');
        });
        it('urlPathMaps pathRules cannot be empty', () => {
            settings.urlPathMaps = [
                {
                    name: 'pb-rule1',
                    defaultBackendAddressPoolName: 'appGatewayBackendPool',
                    defaultBackendHttpSettingName: 'appGatewayBackendHttpSettings',
                    pathRules: []
                }
            ];

            let result = mergeAndValidate(settings, buildingBlockSettings);
            expect(result.length).toEqual(1);
            expect(result[0].name).toEqual('.urlPathMaps[0].pathRules');
        });
        it('urlPathMaps paths cannot be undefined', () => {
            settings.urlPathMaps = [
                {
                    name: 'pb-rule1',
                    defaultBackendAddressPoolName: 'appGatewayBackendPool',
                    defaultBackendHttpSettingName: 'appGatewayBackendHttpSettings',
                    pathRules: [
                        {
                            name: 'p2',
                            backendAddressPoolName: 'appGatewayBackendPool',
                            backendHttpSettingName: 'appGatewayBackendHttpSettings'
                        }
                    ]
                }
            ];

            let result = mergeAndValidate(settings, buildingBlockSettings);
            expect(result.length).toEqual(1);
            expect(result[0].name).toEqual('.urlPathMaps[0].pathRules');
        });
        it('urlPathMaps at leas one path must be specified', () => {
            settings.urlPathMaps = [
                {
                    name: 'pb-rule1',
                    defaultBackendAddressPoolName: 'appGatewayBackendPool',
                    defaultBackendHttpSettingName: 'appGatewayBackendHttpSettings',
                    pathRules: [
                        {
                            name: 'p2',
                            paths: [],
                            backendAddressPoolName: 'appGatewayBackendPool',
                            backendHttpSettingName: 'appGatewayBackendHttpSettings'
                        }
                    ]
                }
            ];

            let result = mergeAndValidate(settings, buildingBlockSettings);
            expect(result.length).toEqual(1);
            expect(result[0].name).toEqual('.urlPathMaps[0].pathRules');
        });
        it('valid requestRoutingRules', () => {
            settings.requestRoutingRules = [
                {
                    name: 'rule1',
                    ruleType: 'Basic',
                    httpListenerName: 'appGatewayHttpListener',
                    backendAddressPoolName: 'appGatewayBackendPool',
                    backendHttpSettingName: 'appGatewayBackendHttpSettings'
                }
            ];
            let result = mergeAndValidate(settings, buildingBlockSettings);
            expect(result.length).toEqual(0);
        });
        it('requestRoutingRules name must be specified', () => {
            settings.requestRoutingRules = [
                {
                    ruleType: 'Basic',
                    httpListenerName: 'appGatewayHttpListener',
                    backendAddressPoolName: 'appGatewayBackendPool',
                    backendHttpSettingName: 'appGatewayBackendHttpSettings'
                }
            ];
            let result = mergeAndValidate(settings, buildingBlockSettings);
            expect(result.length).toEqual(1);
            expect(result[0].name).toEqual('.requestRoutingRules[0].name');
        });
        it('requestRoutingRules a valid httpListenerName must be specified', () => {
            settings.requestRoutingRules = [
                {
                    name: 'rule1',
                    ruleType: 'Basic',
                    httpListenerName: 'invalid',
                    backendAddressPoolName: 'appGatewayBackendPool',
                    backendHttpSettingName: 'appGatewayBackendHttpSettings'
                }
            ];
            let result = mergeAndValidate(settings, buildingBlockSettings);
            expect(result.length).toEqual(1);
            expect(result[0].name).toEqual('.requestRoutingRules[0].httpListenerName');
        });
        it('requestRoutingRules a valid backendAddressPoolName must be specified', () => {
            settings.requestRoutingRules = [
                {
                    name: 'rule1',
                    ruleType: 'Basic',
                    httpListenerName: 'appGatewayHttpListener',
                    backendAddressPoolName: 'invalid',
                    backendHttpSettingName: 'appGatewayBackendHttpSettings'
                }
            ];
            let result = mergeAndValidate(settings, buildingBlockSettings);
            expect(result.length).toEqual(1);
            expect(result[0].name).toEqual('.requestRoutingRules[0].backendAddressPoolName');
        });
        it('requestRoutingRules a valid backendHttpSettingName must be specified', () => {
            settings.requestRoutingRules = [
                {
                    name: 'rule1',
                    ruleType: 'Basic',
                    httpListenerName: 'appGatewayHttpListener',
                    backendAddressPoolName: 'appGatewayBackendPool',
                    backendHttpSettingName: 'invalid'
                }
            ];
            let result = mergeAndValidate(settings, buildingBlockSettings);
            expect(result.length).toEqual(1);
            expect(result[0].name).toEqual('.requestRoutingRules[0].backendHttpSettingName');
        });
        it('requestRoutingRules ruleType must be Basic or PathBasedRouting', () => {
            settings.requestRoutingRules = [
                {
                    name: 'rule1',
                    ruleType: 'invalid',
                    httpListenerName: 'appGatewayHttpListener',
                    backendAddressPoolName: 'appGatewayBackendPool',
                    backendHttpSettingName: 'appGatewayBackendHttpSettings'
                }
            ];
            let result = mergeAndValidate(settings, buildingBlockSettings);
            expect(result.length).toEqual(1);
            expect(result[0].name).toEqual('.requestRoutingRules[0].ruleType');
        });
        it('requestRoutingRules when ruleType is PathBasedRouting urlPathMapName must be specified', () => {
            settings.requestRoutingRules = [
                {
                    name: 'rule1',
                    ruleType: 'PathBasedRouting',
                    httpListenerName: 'appGatewayHttpListener',
                    backendAddressPoolName: 'appGatewayBackendPool',
                    backendHttpSettingName: 'appGatewayBackendHttpSettings'
                }
            ];
            let result = mergeAndValidate(settings, buildingBlockSettings);
            expect(result.length).toEqual(1);
            expect(result[0].name).toEqual('.requestRoutingRules[0].urlPathMapName');
        });

        it('requestRoutingRules when ruleType is PathBasedRouting urlPathMaps must be specified', () => {
            settings.requestRoutingRules = [
                {
                    name: 'rule1',
                    ruleType: 'PathBasedRouting',
                    httpListenerName: 'appGatewayHttpListener',
                    backendAddressPoolName: 'appGatewayBackendPool',
                    backendHttpSettingName: 'appGatewayBackendHttpSettings',
                    urlPathMapName: 'foo'
                }
            ];
            delete settings.urlPathMaps;
            let result = mergeAndValidate(settings, buildingBlockSettings);
            expect(result.length).toEqual(2);
            expect(result[0].name).toEqual('.requestRoutingRules[0].ruleType');
        });
        it('requestRoutingRules when ruleType is PathBasedRouting urlPathMaps must be at least one', () => {
            settings.requestRoutingRules = [
                {
                    name: 'rule1',
                    ruleType: 'PathBasedRouting',
                    httpListenerName: 'appGatewayHttpListener',
                    backendAddressPoolName: 'appGatewayBackendPool',
                    backendHttpSettingName: 'appGatewayBackendHttpSettings',
                    urlPathMapName: 'foo'
                }
            ];
            settings.urlPathMaps = [];
            let result = mergeAndValidate(settings, buildingBlockSettings);
            expect(result.length).toEqual(2);
            expect(result[0].name).toEqual('.requestRoutingRules[0].ruleType');
        });

        it('valid probes', () => {
            settings.probes = [
                {
                    name: 'p1',
                    protocol: 'Http',
                    host: 'contoso.com',
                    path: '/',
                    interval: 30,
                    timeout: 30,
                    unhealthyThreshold: 3,
                    pickHostNameFromBackendHttpSettings: false,
                }
            ];
            let result = mergeAndValidate(settings, buildingBlockSettings);
            expect(result.length).toEqual(0);
        });
        it('valid probes', () => {
            settings.probes = [
                {
                    name: 'p1',
                    protocol: 'Http',
                    host: 'contoso.com',
                    path: '/',
                    interval: 30,
                    timeout: 30,
                    unhealthyThreshold: 3,
                    pickHostNameFromBackendHttpSettings: false
                }
            ];
            let result = mergeAndValidate(settings, buildingBlockSettings);
            expect(result.length).toEqual(0);
        });
        it('probes must have a name', () => {
            settings.probes = [
                {
                    protocol: 'Http',
                    host: 'contoso.com',
                    path: '/',
                    interval: 30,
                    timeout: 30,
                    unhealthyThreshold: 3,
                    pickHostNameFromBackendHttpSettings: false
                }
            ];
            let result = mergeAndValidate(settings, buildingBlockSettings);
            expect(result.length).toEqual(1);
            expect(result[0].name).toEqual('.probes[0].name');
        });
        it('probes protocol must be Http or Https', () => {
            settings.probes = [
                {
                    name: 'p1',
                    protocol: 'invalid',
                    host: 'contoso.com',
                    path: '/',
                    interval: 30,
                    timeout: 30,
                    unhealthyThreshold: 3
                }
            ];
            let result = mergeAndValidate(settings, buildingBlockSettings);
            expect(result.length).toEqual(1);
            expect(result[0].name).toEqual('.probes[0].protocol');
        });
        it('probes path must start with /', () => {
            settings.probes = [
                {
                    name: 'p1',
                    protocol: 'Http',
                    host: 'contoso.com',
                    path: 'foo/',
                    interval: 30,
                    timeout: 30,
                    unhealthyThreshold: 3
                }
            ];
            let result = mergeAndValidate(settings, buildingBlockSettings);
            expect(result.length).toEqual(1);
            expect(result[0].name).toEqual('.probes[0].path');
        });
        it('probes interval must be between 1 and 86400', () => {
            settings.probes = [
                {
                    name: 'p1',
                    protocol: 'Http',
                    host: 'contoso.com',
                    path: '/',
                    interval: 864999,
                    timeout: 30,
                    unhealthyThreshold: 3
                }
            ];
            let result = mergeAndValidate(settings, buildingBlockSettings);
            expect(result.length).toEqual(1);
            expect(result[0].name).toEqual('.probes[0].interval');
        });
        it('probes timeout must be between 1 and 86400', () => {
            settings.probes = [
                {
                    name: 'p1',
                    protocol: 'Http',
                    host: 'contoso.com',
                    path: '/',
                    interval: 1,
                    timeout: 0,
                    unhealthyThreshold: 3
                }
            ];
            let result = mergeAndValidate(settings, buildingBlockSettings);
            expect(result.length).toEqual(1);
            expect(result[0].name).toEqual('.probes[0].timeout');
        });
        it('probes unhealthyThreshold must be between 1 and 20', () => {
            settings.probes = [
                {
                    name: 'p1',
                    protocol: 'Http',
                    host: 'contoso.com',
                    path: '/',
                    interval: 5,
                    timeout: 30,
                    unhealthyThreshold: 21
                }
            ];
            let result = mergeAndValidate(settings, buildingBlockSettings);
            expect(result.length).toEqual(1);
            expect(result[0].name).toEqual('.probes[0].unhealthyThreshold');
        });

        it('valid webApplicationFirewallConfiguration', () => {
            settings.webApplicationFirewallConfiguration = [
                {
                    enabled: false,
                    firewallMode: 'Prevention',
                    ruleSetType: 'OWASP',
                    ruleSetVersion: '3.0',
                    disabledRuleGroups: []
                }
            ];
            let result = mergeAndValidate(settings, buildingBlockSettings);
            expect(result.length).toEqual(0);
        });
        it('webApplicationFirewallConfiguration enabled must be boolean', () => {
            settings.webApplicationFirewallConfiguration = [
                {
                    enabled: 'invalid',
                    firewallMode: 'Prevention',
                    ruleSetType: 'OWASP',
                    ruleSetVersion: '3.0',
                    disabledRuleGroups: []
                }
            ];
            let result = mergeAndValidate(settings, buildingBlockSettings);
            expect(result.length).toEqual(1);
            expect(result[0].name).toEqual('.webApplicationFirewallConfiguration[0].enabled');
        });
        it('webApplicationFirewallConfiguration firewallMode must be Detection or Prevention', () => {
            settings.webApplicationFirewallConfiguration = [
                {
                    enabled: true,
                    firewallMode: 'invalid',
                    ruleSetType: 'OWASP',
                    ruleSetVersion: '3.0',
                    disabledRuleGroups: []
                }
            ];
            let result = mergeAndValidate(settings, buildingBlockSettings);
            expect(result.length).toEqual(1);
            expect(result[0].name).toEqual('.webApplicationFirewallConfiguration[0].firewallMode');
        });
        it('webApplicationFirewallConfiguration ruleSetType must be OWASP', () => {
            settings.webApplicationFirewallConfiguration = [
                {
                    enabled: true,
                    firewallMode: 'Detection',
                    ruleSetType: 'invalid',
                    ruleSetVersion: '3.0'
                }
            ];
            let result = mergeAndValidate(settings, buildingBlockSettings);
            expect(result.length).toEqual(1);
            expect(result[0].name).toEqual('.webApplicationFirewallConfiguration[0].ruleSetType');
        });
        it('webApplicationFirewallConfiguration ruleSetVersion takes default when not specified', () => {
            settings.webApplicationFirewallConfiguration = [
                {
                    enabled: true,
                    firewallMode: 'Detection',
                    ruleSetType: 'OWASP',
                    disabledRuleGroups: []
                }
            ];
            let result = mergeAndValidate(settings, buildingBlockSettings);
            expect(result.length).toEqual(0);
        });
        it('valid webApplicationFirewallConfiguration disabledRuleGroups', () => {
            settings.webApplicationFirewallConfiguration = [
                {
                    enabled: true,
                    firewallMode: 'Detection',
                    ruleSetType: 'OWASP',
                    disabledRuleGroups: [
                        {
                            ruleGroupName: 'rule1',
                            rules: [1,3]
                        }
                    ]
                }
            ];
            let result = mergeAndValidate(settings, buildingBlockSettings);
            expect(result.length).toEqual(0);
        });
        it('webApplicationFirewallConfiguration disabledRuleGroups rules can be undefined', () => {
            settings.webApplicationFirewallConfiguration = [
                {
                    enabled: true,
                    firewallMode: 'Detection',
                    ruleSetType: 'OWASP',
                    disabledRuleGroups: [
                        {
                            ruleGroupName: 'rule1'
                        }
                    ]
                }
            ];
            let result = mergeAndValidate(settings, buildingBlockSettings);
            expect(result.length).toEqual(0);
        });
        it('webApplicationFirewallConfiguration disabledRuleGroups rules can be empty', () => {
            settings.webApplicationFirewallConfiguration = [
                {
                    enabled: true,
                    firewallMode: 'Detection',
                    ruleSetType: 'OWASP',
                    disabledRuleGroups: [
                        {
                            ruleGroupName: 'rule1',
                            rules: []
                        }
                    ]
                }
            ];
            let result = mergeAndValidate(settings, buildingBlockSettings);
            expect(result.length).toEqual(0);
        });
        it('webApplicationFirewallConfiguration disabledRuleGroups ruleGroupName must be specified', () => {
            settings.webApplicationFirewallConfiguration = [
                {
                    enabled: true,
                    firewallMode: 'Detection',
                    ruleSetType: 'OWASP',
                    disabledRuleGroups: [
                        {
                            rules: [1,2,3]
                        }
                    ]
                }
            ];
            let result = mergeAndValidate(settings, buildingBlockSettings);
            expect(result.length).toEqual(1);
            expect(result[0].name).toEqual('.webApplicationFirewallConfiguration[0].disabledRuleGroups');
        });

        it('valid sslPolicy', () => {
            settings.sslPolicy = {
                disabledSslProtocols: [ 'TLSv1_0', 'TLSv1_1' ]
            };
            let result = mergeAndValidate(settings, buildingBlockSettings);
            expect(result.length).toEqual(0);
        });
        it('sslPolicy disabledSslProtocols can be undefined', () => {
            settings.sslPolicy = {};
            let result = mergeAndValidate(settings, buildingBlockSettings);
            expect(result.length).toEqual(0);
        });
        it('sslPolicy disabledSslProtocols can be empty', () => {
            settings.sslPolicy = {
                disabledSslProtocols: []
            };
            let result = mergeAndValidate(settings, buildingBlockSettings);
            expect(result.length).toEqual(0);
        });
        it('sslPolicy disabledSslProtocols must be one of TLSv1_0, TLSv1_1 or TLSv1_2', () => {
            settings.sslPolicy = {
                disabledSslProtocols: [ 'invalid', 'TLSv1_1' ]
            };
            let result = mergeAndValidate(settings, buildingBlockSettings);
            expect(result.length).toEqual(1);
            expect(result[0].name).toEqual('.sslPolicy.disabledSslProtocols');
        });

        it('backendAddressPools valid backendAddresses', () => {
            let result = mergeAndValidate(settings, buildingBlockSettings);
            expect(result.length).toEqual(0);
        });
        it('backendAddressPools backendAddresses cannot specify both fqdn and ipAddress', () => {
            settings.backendAddressPools[0].backendAddresses = [
                {
                    fqdn: 'www.contoso.com',
                    ipAddress: '200.10.1.1'
                }
            ];
            let result = mergeAndValidate(settings, buildingBlockSettings);
            expect(result.length).toEqual(1);
            expect(result[0].name).toEqual('.backendAddressPools[0].backendAddresses[0].fqdn');
        });
        it('backendAddressPools backendAddresses must specify fqdn or ipAddress', () => {
            settings.backendAddressPools[0].backendAddresses = [
                {
                }
            ];
            let result = mergeAndValidate(settings, buildingBlockSettings);
            expect(result.length).toEqual(2);
            expect(result[0].name).toEqual('.backendAddressPools[0].backendAddresses[0].fqdn');
            expect(result[1].name).toEqual('.backendAddressPools[0].backendAddresses[0].ipAddress');
        });

        describe('backendAddressPools backendIPConfigurations', () => {

            beforeEach(() => {
                settings.backendAddressPools = [
                    {
                        name: 'appGatewayBackendPool',
                        backendAddresses: [
                            {
                                fqdn: 'www.contoso.com'
                            }
                        ],
                        backendIPConfigurations: [
                            {
                                privateIPAllocationMethod: 'Dynamic',
                                privateIPAddressVersion: 'IPv4',
                                primary: true,
                                publicIPAddress: {
                                    name: 'my-pip',
                                    subscriptionId: '00000000-0000-1000-8000-000000000000',
                                    resourceGroupName: 'test-rg',
                                    publicIPAllocationMethod: 'Static',
                                    publicIPAddressVersion: 'IPv4',
                                    idleTimeoutInMinutes: 1,
                                    domainNameLabel: 'mydomain',
                                    reverseFqdn: 'niamodym'
                                },
                                loadBalancerInboundNatRules: [
                                    {
                                        name: 'lb1',
                                        frontendIPConfigurationName: 'appGatewayFrontendIP',
                                        backendPoolName: 'appGatewayBackendPool',
                                        frontendPort: 55,
                                        backendPort: 1,
                                        protocol: 'Tcp',
                                        enableFloatingIP: false,
                                        idleTimeoutInMinutes: 5
                                    }
                                ],
                                subnet: {
                                    name: 'subnet1',
                                    addressPrefix: 'asdf',
                                    networkSecurityGroup: {
                                        securityRules: {
                                            description: 'sadasd',
                                            protocol: 'Tcp',
                                            sourcePortRange: 30,
                                            destinationPortRange: '*',
                                            sourceAddressPrefix: ['10.0.1.0/24'],
                                            destinationAddressPrefix: '*',
                                            access:	'Allow',
                                            priority: 200,
                                            direction:	'Outbound'
                                        },
                                        defaultSecurityRules: {
                                            description: 'sadasd',
                                            protocol: 'Tcp',
                                            sourcePortRange: 30,
                                            destinationPortRange: '*',
                                            sourceAddressPrefix: ['10.0.1.0/24'],
                                            destinationAddressPrefix: '*',
                                            access:	'Allow',
                                            priority: 200,
                                            direction:	'Outbound'
                                        }
                                    },
                                    routeTable: {
                                        routes: [
                                            {
                                                name: 'sadasdasd',
                                                addressPrefix: ['10.0.1.0/24'],
                                                nextHopType: 'VirtualAppliance',
                                                nextHopIpAddress: '11.10.2.3'
                                            }
                                        ]
                                    },
                                    resourceNavigationLinks: []
                                }
                            }
                        ]
                    }
                ];
            });

            it('valid configuration', () => {
                let result = mergeAndValidate(settings, buildingBlockSettings);
                expect(result.length).toEqual(0);
            });
            it('invalid privateIPAllocationMethod', () => {
                settings.backendAddressPools[0].backendIPConfigurations[0].privateIPAllocationMethod = 'invalid';
                let result = mergeAndValidate(settings, buildingBlockSettings);
                expect(result.length).toEqual(1);
                expect(result[0].name).toEqual('.backendAddressPools[0].backendIPConfigurations[0].privateIPAllocationMethod');
            });
            it('invalid privateIPAddressVersion', () => {
                settings.backendAddressPools[0].backendIPConfigurations[0].privateIPAddressVersion = 'invalid';
                let result = mergeAndValidate(settings, buildingBlockSettings);
                expect(result.length).toEqual(1);
                expect(result[0].name).toEqual('.backendAddressPools[0].backendIPConfigurations[0].privateIPAddressVersion');
            });
            it('invalid primary', () => {
                settings.backendAddressPools[0].backendIPConfigurations[0].primary = 'invalid';
                let result = mergeAndValidate(settings, buildingBlockSettings);
                expect(result.length).toEqual(1);
                expect(result[0].name).toEqual('.backendAddressPools[0].backendIPConfigurations[0].primary');
            });
            it('invalid publicIPAddress', () => {
                settings.backendAddressPools[0].backendIPConfigurations[0].publicIPAddress = 'invalid';
                let result = mergeAndValidate(settings, buildingBlockSettings);
                expect(result.length > 0).toEqual(true);
                expect(result[0].name.indexOf('.publicIPAddress') > -1).toEqual(true);
            });
            it('invalid loadBalancerInboundNatRules frontendIPConfigurationName', () => {
                settings.backendAddressPools[0].backendIPConfigurations[0].loadBalancerInboundNatRules[0].frontendIPConfigurationName = 'invalid';
                let result = mergeAndValidate(settings, buildingBlockSettings);
                expect(result.length).toEqual(1);
                expect(result[0].name).toEqual('.backendAddressPools[0].backendIPConfigurations[0].loadBalancerInboundNatRules[0].frontendIPConfigurationName');
            });
            it('invalid loadBalancerInboundNatRules backendPoolName', () => {
                settings.backendAddressPools[0].backendIPConfigurations[0].loadBalancerInboundNatRules[0].backendPoolName = 'invalid';
                let result = mergeAndValidate(settings, buildingBlockSettings);
                expect(result.length).toEqual(1);
                expect(result[0].name).toEqual('.backendAddressPools[0].backendIPConfigurations[0].loadBalancerInboundNatRules[0].backendPoolName');
            });
            it('invalid loadBalancerInboundNatRules frontendPort', () => {
                settings.backendAddressPools[0].backendIPConfigurations[0].loadBalancerInboundNatRules[0].frontendPort = 99999;
                let result = mergeAndValidate(settings, buildingBlockSettings);
                expect(result.length).toEqual(1);
                expect(result[0].name).toEqual('.backendAddressPools[0].backendIPConfigurations[0].loadBalancerInboundNatRules[0].frontendPort');
            });
            it('invalid loadBalancerInboundNatRules backendPort', () => {
                settings.backendAddressPools[0].backendIPConfigurations[0].loadBalancerInboundNatRules[0].backendPort = 'invalid';
                let result = mergeAndValidate(settings, buildingBlockSettings);
                expect(result.length).toEqual(1);
                expect(result[0].name).toEqual('.backendAddressPools[0].backendIPConfigurations[0].loadBalancerInboundNatRules[0].backendPort');
            });
            it('invalid loadBalancerInboundNatRules protocol', () => {
                settings.backendAddressPools[0].backendIPConfigurations[0].loadBalancerInboundNatRules[0].protocol = 'invalid';
                let result = mergeAndValidate(settings, buildingBlockSettings);
                expect(result.length).toEqual(1);
                expect(result[0].name).toEqual('.backendAddressPools[0].backendIPConfigurations[0].loadBalancerInboundNatRules[0].protocol');
            });
            it('invalid loadBalancerInboundNatRules enableFloatingIP', () => {
                settings.backendAddressPools[0].backendIPConfigurations[0].loadBalancerInboundNatRules[0].enableFloatingIP = 'invalid';
                let result = mergeAndValidate(settings, buildingBlockSettings);
                expect(result.length).toEqual(1);
                expect(result[0].name).toEqual('.backendAddressPools[0].backendIPConfigurations[0].loadBalancerInboundNatRules[0].enableFloatingIP');
            });
            it('invalid loadBalancerInboundNatRules idleTimeoutInMinutes', () => {
                settings.backendAddressPools[0].backendIPConfigurations[0].loadBalancerInboundNatRules[0].idleTimeoutInMinutes = 99999;
                let result = mergeAndValidate(settings, buildingBlockSettings);
                expect(result.length).toEqual(1);
                expect(result[0].name).toEqual('.backendAddressPools[0].backendIPConfigurations[0].loadBalancerInboundNatRules[0].idleTimeoutInMinutes');
            });

            it('subnet networkSecurityGroup securityRules description cannot have more than 140 chars', () => {
                settings.backendAddressPools[0].backendIPConfigurations[0].subnet.networkSecurityGroup.securityRules.description = 'more than 140 chars asdsdasdsadsaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaakamdkasmdkasdmaskmdas dkasmdaskdmkasmdas dkasmdkasmdkasmd asdkasmkdmaskdmas daskmdksadmkasmdas dkasmdkamdkmaskdmasd askdmaskdmaskdmask daskdmsakdmsa';
                let result = mergeAndValidate(settings, buildingBlockSettings);
                expect(result.length).toEqual(1);
                expect(result[0].name).toEqual('.backendAddressPools[0].backendIPConfigurations[0].subnet.networkSecurityGroup.securityRules.description');
            });
            it('subnet networkSecurityGroup securityRules invalid protocol', () => {
                settings.backendAddressPools[0].backendIPConfigurations[0].subnet.networkSecurityGroup.securityRules.protocol = 'invalid';
                let result = mergeAndValidate(settings, buildingBlockSettings);
                expect(result.length).toEqual(1);
                expect(result[0].name).toEqual('.backendAddressPools[0].backendIPConfigurations[0].subnet.networkSecurityGroup.securityRules.protocol');
            });
            it('subnet networkSecurityGroup securityRules invalid sourcePortRange', () => {
                settings.backendAddressPools[0].backendIPConfigurations[0].subnet.networkSecurityGroup.securityRules.sourcePortRange = 99999;
                let result = mergeAndValidate(settings, buildingBlockSettings);
                expect(result.length).toEqual(1);
                expect(result[0].name).toEqual('.backendAddressPools[0].backendIPConfigurations[0].subnet.networkSecurityGroup.securityRules.sourcePortRange');
            });
            it('subnet networkSecurityGroup securityRules sourcePortRange can be *', () => {
                settings.backendAddressPools[0].backendIPConfigurations[0].subnet.networkSecurityGroup.securityRules.sourcePortRange = '*';
                let result = mergeAndValidate(settings, buildingBlockSettings);
                expect(result.length).toEqual(0);
            });
            it('subnet networkSecurityGroup securityRules invalid destinationPortRange', () => {
                settings.backendAddressPools[0].backendIPConfigurations[0].subnet.networkSecurityGroup.securityRules.destinationPortRange = 99999;
                let result = mergeAndValidate(settings, buildingBlockSettings);
                expect(result.length).toEqual(1);
                expect(result[0].name).toEqual('.backendAddressPools[0].backendIPConfigurations[0].subnet.networkSecurityGroup.securityRules.destinationPortRange');
            });
            it('subnet networkSecurityGroup securityRules destinationPortRange can be *', () => {
                settings.backendAddressPools[0].backendIPConfigurations[0].subnet.networkSecurityGroup.securityRules.destinationPortRange = '*';
                let result = mergeAndValidate(settings, buildingBlockSettings);
                expect(result.length).toEqual(0);
            });
            it('subnet networkSecurityGroup securityRules invalid sourceAddressPrefix', () => {
                settings.backendAddressPools[0].backendIPConfigurations[0].subnet.networkSecurityGroup.securityRules.sourceAddressPrefix = 'invalid';
                let result = mergeAndValidate(settings, buildingBlockSettings);
                expect(result.length).toEqual(1);
                expect(result[0].name).toEqual('.backendAddressPools[0].backendIPConfigurations[0].subnet.networkSecurityGroup.securityRules.sourceAddressPrefix');
            });
            it('subnet networkSecurityGroup securityRules sourceAddressPrefix can be *', () => {
                settings.backendAddressPools[0].backendIPConfigurations[0].subnet.networkSecurityGroup.securityRules.sourceAddressPrefix = '*';
                let result = mergeAndValidate(settings, buildingBlockSettings);
                expect(result.length).toEqual(0);
            });
            it('subnet networkSecurityGroup securityRules invalid destinationAddressPrefix', () => {
                settings.backendAddressPools[0].backendIPConfigurations[0].subnet.networkSecurityGroup.securityRules.destinationAddressPrefix = 'invalid';
                let result = mergeAndValidate(settings, buildingBlockSettings);
                expect(result.length).toEqual(1);
                expect(result[0].name).toEqual('.backendAddressPools[0].backendIPConfigurations[0].subnet.networkSecurityGroup.securityRules.destinationAddressPrefix');
            });
            it('subnet networkSecurityGroup securityRules destinationAddressPrefix can be *', () => {
                settings.backendAddressPools[0].backendIPConfigurations[0].subnet.networkSecurityGroup.securityRules.destinationAddressPrefix = '*';
                let result = mergeAndValidate(settings, buildingBlockSettings);
                expect(result.length).toEqual(0);
            });
            it('subnet networkSecurityGroup securityRules invalid access', () => {
                settings.backendAddressPools[0].backendIPConfigurations[0].subnet.networkSecurityGroup.securityRules.access = 'invalid';
                let result = mergeAndValidate(settings, buildingBlockSettings);
                expect(result.length).toEqual(1);
                expect(result[0].name).toEqual('.backendAddressPools[0].backendIPConfigurations[0].subnet.networkSecurityGroup.securityRules.access');
            });
            it('subnet networkSecurityGroup securityRules invalid priority', () => {
                settings.backendAddressPools[0].backendIPConfigurations[0].subnet.networkSecurityGroup.securityRules.priority = 1;
                let result = mergeAndValidate(settings, buildingBlockSettings);
                expect(result.length).toEqual(1);
                expect(result[0].name).toEqual('.backendAddressPools[0].backendIPConfigurations[0].subnet.networkSecurityGroup.securityRules.priority');
            });
            it('subnet networkSecurityGroup securityRules invalid direction', () => {
                settings.backendAddressPools[0].backendIPConfigurations[0].subnet.networkSecurityGroup.securityRules.direction = 'invalid';
                let result = mergeAndValidate(settings, buildingBlockSettings);
                expect(result.length).toEqual(1);
                expect(result[0].name).toEqual('.backendAddressPools[0].backendIPConfigurations[0].subnet.networkSecurityGroup.securityRules.direction');
            });

            it('subnet networkSecurityGroup defaultSecurityRules description cannot have more than 140 chars', () => {
                settings.backendAddressPools[0].backendIPConfigurations[0].subnet.networkSecurityGroup.defaultSecurityRules.description = 'more than 140 chars asdsdasdsadsaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaakamdkasmdkasdmaskmdas dkasmdaskdmkasmdas dkasmdkasmdkasmd asdkasmkdmaskdmas daskmdksadmkasmdas dkasmdkamdkmaskdmasd askdmaskdmaskdmask daskdmsakdmsa';
                let result = mergeAndValidate(settings, buildingBlockSettings);
                expect(result.length).toEqual(1);
                expect(result[0].name).toEqual('.backendAddressPools[0].backendIPConfigurations[0].subnet.networkSecurityGroup.defaultSecurityRules.description');
            });
            it('subnet networkSecurityGroup defaultSecurityRules invalid protocol', () => {
                settings.backendAddressPools[0].backendIPConfigurations[0].subnet.networkSecurityGroup.defaultSecurityRules.protocol = 'invalid';
                let result = mergeAndValidate(settings, buildingBlockSettings);
                expect(result.length).toEqual(1);
                expect(result[0].name).toEqual('.backendAddressPools[0].backendIPConfigurations[0].subnet.networkSecurityGroup.defaultSecurityRules.protocol');
            });
            it('subnet networkSecurityGroup defaultSecurityRules invalid sourcePortRange', () => {
                settings.backendAddressPools[0].backendIPConfigurations[0].subnet.networkSecurityGroup.defaultSecurityRules.sourcePortRange = 99999;
                let result = mergeAndValidate(settings, buildingBlockSettings);
                expect(result.length).toEqual(1);
                expect(result[0].name).toEqual('.backendAddressPools[0].backendIPConfigurations[0].subnet.networkSecurityGroup.defaultSecurityRules.sourcePortRange');
            });
            it('subnet networkSecurityGroup defaultSecurityRules sourcePortRange can be *', () => {
                settings.backendAddressPools[0].backendIPConfigurations[0].subnet.networkSecurityGroup.defaultSecurityRules.sourcePortRange = '*';
                let result = mergeAndValidate(settings, buildingBlockSettings);
                expect(result.length).toEqual(0);
            });
            it('subnet networkSecurityGroup defaultSecurityRules invalid destinationPortRange', () => {
                settings.backendAddressPools[0].backendIPConfigurations[0].subnet.networkSecurityGroup.defaultSecurityRules.destinationPortRange = 99999;
                let result = mergeAndValidate(settings, buildingBlockSettings);
                expect(result.length).toEqual(1);
                expect(result[0].name).toEqual('.backendAddressPools[0].backendIPConfigurations[0].subnet.networkSecurityGroup.defaultSecurityRules.destinationPortRange');
            });
            it('subnet networkSecurityGroup defaultSecurityRules destinationPortRange can be *', () => {
                settings.backendAddressPools[0].backendIPConfigurations[0].subnet.networkSecurityGroup.defaultSecurityRules.destinationPortRange = '*';
                let result = mergeAndValidate(settings, buildingBlockSettings);
                expect(result.length).toEqual(0);
            });
            it('subnet networkSecurityGroup defaultSecurityRules invalid sourceAddressPrefix', () => {
                settings.backendAddressPools[0].backendIPConfigurations[0].subnet.networkSecurityGroup.defaultSecurityRules.sourceAddressPrefix = 'invalid';
                let result = mergeAndValidate(settings, buildingBlockSettings);
                expect(result.length).toEqual(1);
                expect(result[0].name).toEqual('.backendAddressPools[0].backendIPConfigurations[0].subnet.networkSecurityGroup.defaultSecurityRules.sourceAddressPrefix');
            });
            it('subnet networkSecurityGroup defaultSecurityRules sourceAddressPrefix can be *', () => {
                settings.backendAddressPools[0].backendIPConfigurations[0].subnet.networkSecurityGroup.defaultSecurityRules.sourceAddressPrefix = '*';
                let result = mergeAndValidate(settings, buildingBlockSettings);
                expect(result.length).toEqual(0);
            });
            it('subnet networkSecurityGroup defaultSecurityRules invalid destinationAddressPrefix', () => {
                settings.backendAddressPools[0].backendIPConfigurations[0].subnet.networkSecurityGroup.defaultSecurityRules.destinationAddressPrefix = 'invalid';
                let result = mergeAndValidate(settings, buildingBlockSettings);
                expect(result.length).toEqual(1);
                expect(result[0].name).toEqual('.backendAddressPools[0].backendIPConfigurations[0].subnet.networkSecurityGroup.defaultSecurityRules.destinationAddressPrefix');
            });
            it('subnet networkSecurityGroup defaultSecurityRules destinationAddressPrefix can be *', () => {
                settings.backendAddressPools[0].backendIPConfigurations[0].subnet.networkSecurityGroup.defaultSecurityRules.destinationAddressPrefix = '*';
                let result = mergeAndValidate(settings, buildingBlockSettings);
                expect(result.length).toEqual(0);
            });
            it('subnet networkSecurityGroup defaultSecurityRules invalid access', () => {
                settings.backendAddressPools[0].backendIPConfigurations[0].subnet.networkSecurityGroup.defaultSecurityRules.access = 'invalid';
                let result = mergeAndValidate(settings, buildingBlockSettings);
                expect(result.length).toEqual(1);
                expect(result[0].name).toEqual('.backendAddressPools[0].backendIPConfigurations[0].subnet.networkSecurityGroup.defaultSecurityRules.access');
            });
            it('subnet networkSecurityGroup defaultSecurityRules invalid priority', () => {
                settings.backendAddressPools[0].backendIPConfigurations[0].subnet.networkSecurityGroup.defaultSecurityRules.priority = 1;
                let result = mergeAndValidate(settings, buildingBlockSettings);
                expect(result.length).toEqual(1);
                expect(result[0].name).toEqual('.backendAddressPools[0].backendIPConfigurations[0].subnet.networkSecurityGroup.defaultSecurityRules.priority');
            });
            it('subnet networkSecurityGroup defaultSecurityRules invalid direction', () => {
                settings.backendAddressPools[0].backendIPConfigurations[0].subnet.networkSecurityGroup.defaultSecurityRules.direction = 'invalid';
                let result = mergeAndValidate(settings, buildingBlockSettings);
                expect(result.length).toEqual(1);
                expect(result[0].name).toEqual('.backendAddressPools[0].backendIPConfigurations[0].subnet.networkSecurityGroup.defaultSecurityRules.direction');
            });

            it('subnet routeTable routes must have a name', () => {
                delete settings.backendAddressPools[0].backendIPConfigurations[0].subnet.routeTable.routes[0].name;
                let result = mergeAndValidate(settings, buildingBlockSettings);
                expect(result.length).toEqual(1);
                expect(result[0].name).toEqual('.backendAddressPools[0].backendIPConfigurations[0].subnet.routeTable.routes[0].name');
            });
            it('subnet routeTable routes invalid addressPrefix', () => {
                settings.backendAddressPools[0].backendIPConfigurations[0].subnet.routeTable.routes[0].addressPrefix = 'invalid';
                let result = mergeAndValidate(settings, buildingBlockSettings);
                expect(result.length).toEqual(1);
                expect(result[0].name).toEqual('.backendAddressPools[0].backendIPConfigurations[0].subnet.routeTable.routes[0].addressPrefix');
            });
            it('subnet routeTable routes invalid nextHopType', () => {
                settings.backendAddressPools[0].backendIPConfigurations[0].subnet.routeTable.routes[0].nextHopType = 'invalid';
                delete settings.backendAddressPools[0].backendIPConfigurations[0].subnet.routeTable.routes[0].nextHopIpAddress;
                let result = mergeAndValidate(settings, buildingBlockSettings);
                expect(result.length).toEqual(1);
                expect(result[0].name).toEqual('.backendAddressPools[0].backendIPConfigurations[0].subnet.routeTable.routes[0].nextHopType');
            });
            it('subnet routeTable routes nextHopIpAddress cannot only have a value when nextHopType is VirtualAppliance', () => {
                settings.backendAddressPools[0].backendIPConfigurations[0].subnet.routeTable.routes[0].nextHopType = 'VnetLocal';
                let result = mergeAndValidate(settings, buildingBlockSettings);
                expect(result.length).toEqual(1);
                expect(result[0].name).toEqual('.backendAddressPools[0].backendIPConfigurations[0].subnet.routeTable.routes[0].nextHopIpAddress');
            });
            it('subnet routeTable routes invalid nextHopIpAddress', () => {
                settings.backendAddressPools[0].backendIPConfigurations[0].subnet.routeTable.routes[0].nextHopIpAddress = 'invalid';
                let result = mergeAndValidate(settings, buildingBlockSettings);
                expect(result.length).toEqual(1);
                expect(result[0].name).toEqual('.backendAddressPools[0].backendIPConfigurations[0].subnet.routeTable.routes[0].nextHopIpAddress');
            });

        });

    });

    if (global.testConfiguration.runTransform) {
        describe('process:', () => {

        });
    }
});