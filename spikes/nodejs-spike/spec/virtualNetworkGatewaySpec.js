describe('virtualNetworkGatewaySettings', () => {
    let rewire = require('rewire');
    let virtualNetworkGatewaySettings = rewire('../core/virtualNetworkGatewaySettings.js');
    let _ = require('lodash');
    let validation = require('../core/validation.js');

    describe('isValidGatewayType', () => {
        let isValidGatewayType = virtualNetworkGatewaySettings.__get__('isValidGatewayType');
        
        it('undefined', () => {
            expect(isValidGatewayType()).toEqual(false);
        });

        it('null', () => {
            expect(isValidGatewayType(null)).toEqual(false);
        });

        it('empty', () => {
            expect(isValidGatewayType('')).toEqual(false);
        });

        it('whitespace', () => {
            expect(isValidGatewayType(' ')).toEqual(false);
        });

        it('invalid spacing', () => {
            expect(isValidGatewayType(' Vpn ')).toEqual(false);
        });

        it('invalid casing', () => {
            expect(isValidGatewayType('vpn')).toEqual(false);
        });

        it('invalid value', () => {
            expect(isValidGatewayType('NOT_A_VALID_GATEWAY_TYPE')).toEqual(false);
        });

        it('Vpn', () => {
            expect(isValidGatewayType('Vpn')).toEqual(true);
        });

        it('ExpressRoute', () => {
            expect(isValidGatewayType('ExpressRoute')).toEqual(true);
        });
    });

    describe('isValidVpnType', () => {
        let isValidVpnType = virtualNetworkGatewaySettings.__get__('isValidVpnType');
        
        it('undefined', () => {
            expect(isValidVpnType()).toEqual(false);
        });

        it('null', () => {
            expect(isValidVpnType(null)).toEqual(false);
        });

        it('empty', () => {
            expect(isValidVpnType('')).toEqual(false);
        });

        it('whitespace', () => {
            expect(isValidVpnType(' ')).toEqual(false);
        });

        it('invalid spacing', () => {
            expect(isValidVpnType(' PolicyBased ')).toEqual(false);
        });

        it('invalid casing', () => {
            expect(isValidVpnType('policybased')).toEqual(false);
        });

        it('invalid value', () => {
            expect(isValidVpnType('NOT_A_VALID_VPN_TYPE')).toEqual(false);
        });

        it('PolicyBased', () => {
            expect(isValidVpnType('PolicyBased')).toEqual(true);
        });

        it('RouteBased', () => {
            expect(isValidVpnType('RouteBased')).toEqual(true);
        });
    });

    describe('isValidSku', () => {
        let isValidSku = virtualNetworkGatewaySettings.__get__('isValidSku');
        
        it('undefined', () => {
            expect(isValidSku()).toEqual(false);
        });

        it('null', () => {
            expect(isValidSku(null)).toEqual(false);
        });

        it('empty', () => {
            expect(isValidSku('')).toEqual(false);
        });

        it('whitespace', () => {
            expect(isValidSku(' ')).toEqual(false);
        });

        it('invalid spacing', () => {
            expect(isValidSku(' Basic ')).toEqual(false);
        });

        it('invalid casing', () => {
            expect(isValidSku('basic')).toEqual(false);
        });

        it('invalid value', () => {
            expect(isValidSku('NOT_A_VALID_SKU')).toEqual(false);
        });

        it('Basic', () => {
            expect(isValidSku('Basic')).toEqual(true);
        });

        it('HighPerformance', () => {
            expect(isValidSku('HighPerformance')).toEqual(true);
        });

        it('Standard', () => {
            expect(isValidSku('Standard')).toEqual(true);
        });

        it('UltraPerformance', () => {
            expect(isValidSku('UltraPerformance')).toEqual(true);
        });
    });

    describe('validations', () => {
        let vngValidations = virtualNetworkGatewaySettings.__get__('virtualNetworkGatewaySettingsValidations');

        describe('bgpSettings', () => {
            let bgpValidations = vngValidations.bgpSettings;
            let bgpSettings = {
                asn: 1,
                bgpPeeringAddress: 'bgp-peering-address',
                peerWeight: 10
            };

            it('asn undefined', () => {
                let settings = _.cloneDeep(bgpSettings);
                delete settings.asn;

                let errors = validation.validate({
                    settings: settings,
                    validations: bgpValidations
                });

                expect(errors.length).toEqual(0);
            });

            it('asn null', () => {
                let settings = _.cloneDeep(bgpSettings);
                settings.asn = null;

                let errors = validation.validate({
                    settings: settings,
                    validations: bgpValidations
                });

                expect(errors.length).toEqual(0);
            });

            it('asn invalid', () => {
                let settings = _.cloneDeep(bgpSettings);
                settings.asn = 'asn';

                let errors = validation.validate({
                    settings: settings,
                    validations: bgpValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toBe('.asn');
            });

            it('bgpPeeringAddress undefined', () => {
                let settings = _.cloneDeep(bgpSettings);
                delete settings.bgpPeeringAddress;

                let errors = validation.validate({
                    settings: settings,
                    validations: bgpValidations
                });

                expect(errors.length).toEqual(0);
            });

            it('bgpPeeringAddress null', () => {
                let settings = _.cloneDeep(bgpSettings);
                settings.bgpPeeringAddress = null;

                let errors = validation.validate({
                    settings: settings,
                    validations: bgpValidations
                });

                expect(errors.length).toEqual(0);
            });

            it('bgpPeeringAddress empty', () => {
                let settings = _.cloneDeep(bgpSettings);
                settings.bgpPeeringAddress = '';

                let errors = validation.validate({
                    settings: settings,
                    validations: bgpValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toBe('.bgpPeeringAddress');
            });

            it('bgpPeeringAddress whitespace', () => {
                let settings = _.cloneDeep(bgpSettings);
                settings.bgpPeeringAddress = '   ';

                let errors = validation.validate({
                    settings: settings,
                    validations: bgpValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toBe('.bgpPeeringAddress');
            });

            it('peerWeight undefined', () => {
                let settings = _.cloneDeep(bgpSettings);
                delete settings.peerWeight;

                let errors = validation.validate({
                    settings: settings,
                    validations: bgpValidations
                });

                expect(errors.length).toEqual(0);
            });

            it('peerWeight null', () => {
                let settings = _.cloneDeep(bgpSettings);
                settings.peerWeight = null;

                let errors = validation.validate({
                    settings: settings,
                    validations: bgpValidations
                });

                expect(errors.length).toEqual(0);
            });

            it('peerWeight invalid', () => {
                let settings = _.cloneDeep(bgpSettings);
                settings.peerWeight = 'peerWeight';

                let errors = validation.validate({
                    settings: settings,
                    validations: bgpValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toBe('.peerWeight');
            });
        });

        describe('virtualNetworkGatewaySettings', () => {
            let vngSettings = {
                name: 'bb-hybrid-vpn-vgw',
                gatewayType: 'Vpn',
                vpnType: 'RouteBased',
                sku: 'Standard',
                publicIpAddress: {
                    name: 'my-pip'
                },
                virtualNetwork: {
                    name: 'my-virtual-network'
                },
                enableBgp: false
            };

            it('name undefined', () => {
                let settings = _.cloneDeep(vngSettings);
                delete settings.name;

                let errors = validation.validate({
                    settings: settings,
                    validations: vngValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('.name');
            });

            it('gatewayType undefined', () => {
                let settings = _.cloneDeep(vngSettings);
                delete settings.gatewayType;

                let errors = validation.validate({
                    settings: settings,
                    validations: vngValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('.gatewayType');
            });

            it('gatewayType null', () => {
                let settings = _.cloneDeep(vngSettings);
                settings.gatewayType = null;

                let errors = validation.validate({
                    settings: settings,
                    validations: vngValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('.gatewayType');
            });

            it('gatewayType undefined', () => {
                let settings = _.cloneDeep(vngSettings);
                delete settings.gatewayType;

                let errors = validation.validate({
                    settings: settings,
                    validations: vngValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('.gatewayType');
            });

            it('vpnType undefined', () => {
                let settings = _.cloneDeep(vngSettings);
                delete settings.vpnType;

                let errors = validation.validate({
                    settings: settings,
                    validations: vngValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('.vpnType');
            });

            it('vpnType null', () => {
                let settings = _.cloneDeep(vngSettings);
                settings.vpnType = null;

                let errors = validation.validate({
                    settings: settings,
                    validations: vngValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('.vpnType');
            });

            it('sku undefined', () => {
                let settings = _.cloneDeep(vngSettings);
                delete settings.sku;

                let errors = validation.validate({
                    settings: settings,
                    validations: vngValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('.sku');
            });

            it('sku null', () => {
                let settings = _.cloneDeep(vngSettings);
                settings.sku = null;

                let errors = validation.validate({
                    settings: settings,
                    validations: vngValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('.sku');
            });

            it('publicIpAddress undefined', () => {
                let settings = _.cloneDeep(vngSettings);
                delete settings.publicIpAddress;

                let errors = validation.validate({
                    settings: settings,
                    validations: vngValidations
                });

                expect(errors.length).toEqual(0);
            });

            it('publicIpAddress null', () => {
                let settings = _.cloneDeep(vngSettings);
                settings.publicIpAddress = null;

                let errors = validation.validate({
                    settings: settings,
                    validations: vngValidations
                });

                expect(errors.length).toEqual(0);
            });

            it('virtualNetwork undefined', () => {
                let settings = _.cloneDeep(vngSettings);
                delete settings.virtualNetwork;

                let errors = validation.validate({
                    settings: settings,
                    validations: vngValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('.virtualNetwork');
            });

            it('virtualNetwork null', () => {
                let settings = _.cloneDeep(vngSettings);
                settings.virtualNetwork = null;

                let errors = validation.validate({
                    settings: settings,
                    validations: vngValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('.virtualNetwork');
            });

            it('enableBgp undefined', () => {
                let settings = _.cloneDeep(vngSettings);
                delete settings.enableBgp;

                let errors = validation.validate({
                    settings: settings,
                    validations: vngValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('.enableBgp');
            });

            it('enableBgp null', () => {
                let settings = _.cloneDeep(vngSettings);
                settings.enableBgp = null;

                let errors = validation.validate({
                    settings: settings,
                    validations: vngValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('.enableBgp');
            });
        });
    });

    describe('merge', () => {
        let virtualNetworkGatewaySettingsDefaults = virtualNetworkGatewaySettings.__get__('virtualNetworkGatewaySettingsDefaults');

        it('valid', () => {
            let merged = validation.merge({}, virtualNetworkGatewaySettingsDefaults);
            expect(merged.gatewayType).toBe('Vpn');
            expect(merged.vpnType).toBe('RouteBased');
            expect(merged.sku).toBe('Standard');
            expect(merged.enableBgp).toBe(false);
        });
    });

    describe('transform', () => {
        let virtualNetworkGateway = {
            name: 'my-gw',
            gatewayType: 'Vpn',
            vpnType: 'RouteBased',
            sku: 'Standard',
            publicIpAddress: {
                name: 'my-pip'
            },
            virtualNetwork: {
                name: 'my-virtual-network'
            },
            enableBgp: false,
            bgpSettings: {
                asn: 1,
                bgpPeeringAddress: 'bgp-peering-address',
                peerWeight: 10
            }
        };

        let buildingBlockSettings = {
            subscriptionId: '00000000-0000-1000-8000-000000000000',
            resourceGroupName: 'test-rg'
        };

        it('single virtualNetworkGateway', () => {
            let settings = _.cloneDeep(virtualNetworkGateway);
            let result = virtualNetworkGatewaySettings.transform({
                settings: settings,
                buildingBlockSettings: buildingBlockSettings
            });

            expect(result.settings.length).toBe(1);
            let settingsResult = result.settings[0];
            expect(settingsResult.hasOwnProperty('id')).toBe(true);
            expect(settingsResult.hasOwnProperty('name')).toBe(true);
            expect(settingsResult.hasOwnProperty('resourceGroupName')).toBe(true);
            expect(settingsResult.hasOwnProperty('subscriptionId')).toBe(true);

            expect(settingsResult.hasOwnProperty('properties')).toBe(true);
            let propertiesResult = settingsResult.properties;
            expect(propertiesResult.hasOwnProperty('vpnType')).toBe(true);
            expect(propertiesResult.hasOwnProperty('enableBgp')).toBe(true);
            expect(propertiesResult.hasOwnProperty('gatewayType')).toBe(true);

            expect(propertiesResult.hasOwnProperty('bgpSettings')).toBe(true);
            let bgpSettingsResult = propertiesResult.bgpSettings;
            expect(bgpSettingsResult.asn).toBe(1);
            expect(bgpSettingsResult.bgpPeeringAddress).toBe('bgp-peering-address');
            expect(bgpSettingsResult.peerWeight).toBe(10);

            expect(propertiesResult.hasOwnProperty('sku')).toBe(true);
            let skuResult = propertiesResult.sku;
            expect(skuResult.hasOwnProperty('name')).toBe(true);
            expect(skuResult.hasOwnProperty('tier')).toBe(true);
            expect(skuResult.name).toEqual(skuResult.tier);

            expect(propertiesResult.hasOwnProperty('ipConfigurations')).toBe(true);
            let ipConfigurationsResult = propertiesResult.ipConfigurations;
            expect(ipConfigurationsResult.length).toEqual(1);
            expect(ipConfigurationsResult[0].hasOwnProperty('name')).toBe(true);
            expect(ipConfigurationsResult[0].name).toBe('my-gw-ipconfig');
            expect(ipConfigurationsResult[0].hasOwnProperty('properties')).toBe(true);
            expect(ipConfigurationsResult[0].properties.hasOwnProperty('privateIPAllocationMethod')).toBe(true);
            expect(ipConfigurationsResult[0].properties.hasOwnProperty('subnet')).toBe(true);
            expect(ipConfigurationsResult[0].properties.subnet.hasOwnProperty('id')).toBe(true);
        });

        it('array virtualNetworkGateways', () => {
            let settings = _.cloneDeep(virtualNetworkGateway);
            let result = virtualNetworkGatewaySettings.transform({
                settings: [settings],
                buildingBlockSettings: buildingBlockSettings
            });

            expect(result.settings.length).toBe(1);
            let settingsResult = result.settings[0];
            expect(settingsResult.hasOwnProperty('id')).toBe(true);
            expect(settingsResult.hasOwnProperty('name')).toBe(true);
            expect(settingsResult.hasOwnProperty('resourceGroupName')).toBe(true);
            expect(settingsResult.hasOwnProperty('subscriptionId')).toBe(true);

            expect(settingsResult.hasOwnProperty('properties')).toBe(true);
            let propertiesResult = settingsResult.properties;
            expect(propertiesResult.hasOwnProperty('vpnType')).toBe(true);
            expect(propertiesResult.hasOwnProperty('enableBgp')).toBe(true);
            expect(propertiesResult.hasOwnProperty('gatewayType')).toBe(true);

            expect(propertiesResult.hasOwnProperty('bgpSettings')).toBe(true);
            let bgpSettingsResult = propertiesResult.bgpSettings;
            expect(bgpSettingsResult.asn).toBe(1);
            expect(bgpSettingsResult.bgpPeeringAddress).toBe('bgp-peering-address');
            expect(bgpSettingsResult.peerWeight).toBe(10);

            expect(propertiesResult.hasOwnProperty('sku')).toBe(true);
            let skuResult = propertiesResult.sku;
            expect(skuResult.hasOwnProperty('name')).toBe(true);
            expect(skuResult.hasOwnProperty('tier')).toBe(true);
            expect(skuResult.name).toEqual(skuResult.tier);

            expect(propertiesResult.hasOwnProperty('ipConfigurations')).toBe(true);
            let ipConfigurationsResult = propertiesResult.ipConfigurations;
            expect(ipConfigurationsResult.length).toEqual(1);
            expect(ipConfigurationsResult[0].hasOwnProperty('name')).toBe(true);
            expect(ipConfigurationsResult[0].name).toBe('my-gw-ipconfig');
            expect(ipConfigurationsResult[0].hasOwnProperty('properties')).toBe(true);
            expect(ipConfigurationsResult[0].properties.hasOwnProperty('privateIPAllocationMethod')).toBe(true);
            expect(ipConfigurationsResult[0].properties.hasOwnProperty('subnet')).toBe(true);
            expect(ipConfigurationsResult[0].properties.subnet.hasOwnProperty('id')).toBe(true);
        });

        it('single virtualNetworkGateway with no public ip address', () => {
            let settings = _.cloneDeep(virtualNetworkGateway);
            delete settings.publicIpAddress;
            let result = virtualNetworkGatewaySettings.transform({
                settings: settings,
                buildingBlockSettings: buildingBlockSettings
            });

            expect(result.settings.length).toBe(1);
            let settingsResult = result.settings[0];
            expect(settingsResult.hasOwnProperty('id')).toBe(true);
            expect(settingsResult.hasOwnProperty('name')).toBe(true);
            expect(settingsResult.hasOwnProperty('resourceGroupName')).toBe(true);
            expect(settingsResult.hasOwnProperty('subscriptionId')).toBe(true);

            expect(settingsResult.hasOwnProperty('properties')).toBe(true);
            let propertiesResult = settingsResult.properties;
            expect(propertiesResult.hasOwnProperty('vpnType')).toBe(true);
            expect(propertiesResult.hasOwnProperty('enableBgp')).toBe(true);
            expect(propertiesResult.hasOwnProperty('gatewayType')).toBe(true);

            expect(propertiesResult.hasOwnProperty('bgpSettings')).toBe(true);
            let bgpSettingsResult = propertiesResult.bgpSettings;
            expect(bgpSettingsResult.asn).toBe(1);
            expect(bgpSettingsResult.bgpPeeringAddress).toBe('bgp-peering-address');
            expect(bgpSettingsResult.peerWeight).toBe(10);

            expect(propertiesResult.hasOwnProperty('sku')).toBe(true);
            let skuResult = propertiesResult.sku;
            expect(skuResult.hasOwnProperty('name')).toBe(true);
            expect(skuResult.hasOwnProperty('tier')).toBe(true);
            expect(skuResult.name).toEqual(skuResult.tier);
        });

        it('single virtualNetworkGateway with no bgp settings', () => {
            let settings = _.cloneDeep(virtualNetworkGateway);
            delete settings.bgpSettings;
            let result = virtualNetworkGatewaySettings.transform({
                settings: settings,
                buildingBlockSettings: buildingBlockSettings
            });

            expect(result.settings.length).toBe(1);
            let settingsResult = result.settings[0];
            expect(settingsResult.hasOwnProperty('id')).toBe(true);
            expect(settingsResult.hasOwnProperty('name')).toBe(true);
            expect(settingsResult.hasOwnProperty('resourceGroupName')).toBe(true);
            expect(settingsResult.hasOwnProperty('subscriptionId')).toBe(true);

            expect(settingsResult.hasOwnProperty('properties')).toBe(true);
            let propertiesResult = settingsResult.properties;
            expect(propertiesResult.hasOwnProperty('vpnType')).toBe(true);
            expect(propertiesResult.hasOwnProperty('enableBgp')).toBe(true);
            expect(propertiesResult.hasOwnProperty('gatewayType')).toBe(true);

            expect(propertiesResult.hasOwnProperty('sku')).toBe(true);
            let skuResult = propertiesResult.sku;
            expect(skuResult.hasOwnProperty('name')).toBe(true);
            expect(skuResult.hasOwnProperty('tier')).toBe(true);
            expect(skuResult.name).toEqual(skuResult.tier);

            expect(propertiesResult.hasOwnProperty('ipConfigurations')).toBe(true);
            let ipConfigurationsResult = propertiesResult.ipConfigurations;
            expect(ipConfigurationsResult.length).toEqual(1);
            expect(ipConfigurationsResult[0].hasOwnProperty('name')).toBe(true);
            expect(ipConfigurationsResult[0].name).toBe('my-gw-ipconfig');
            expect(ipConfigurationsResult[0].hasOwnProperty('properties')).toBe(true);
            expect(ipConfigurationsResult[0].properties.hasOwnProperty('privateIPAllocationMethod')).toBe(true);
            expect(ipConfigurationsResult[0].properties.hasOwnProperty('subnet')).toBe(true);
            expect(ipConfigurationsResult[0].properties.subnet.hasOwnProperty('id')).toBe(true);
        });

        it('test settings validation errors', () => {
            let settings = _.cloneDeep(virtualNetworkGateway);
            delete settings.name;
            expect(() => {
                virtualNetworkGatewaySettings.transform({
                    settings: settings,
                    buildingBlockSettings: buildingBlockSettings
                });
            }).toThrow();
        });

        it('test building blocks validation errors', () => {
            let settings = _.cloneDeep(virtualNetworkGateway);
            let bbSettings = _.cloneDeep(buildingBlockSettings);
            delete bbSettings.subscriptionId;
            expect(() => {
                virtualNetworkGatewaySettings.transform({
                    settings: settings,
                    buildingBlockSettings: bbSettings
                });
            }).toThrow();
        });
    });
});