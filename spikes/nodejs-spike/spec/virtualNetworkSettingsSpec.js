describe('virtualNetworkSettings', () => {
    let rewire = require('rewire');
    let resources = require('../core/resources.js');
    let virtualNetworkSettings = rewire('../core/virtualNetworkSettings.js');
    let _ = require('lodash');
    let validation = require('../core/validation.js');

    describe('validations', () => {
        let virtualNetworkSettingsValidations = virtualNetworkSettings.__get__('virtualNetworkSettingsValidations');

        describe('virtualNetworkSubnetsValidations', () => {
            let subnetValidations = virtualNetworkSettings.__get__('virtualNetworkSettingsSubnetsValidations');
            let subnetsSettings = [
                {
                    name: "web",
                    addressPrefix: "10.0.1.0/24"
                },
                {
                    name: "biz",
                    addressPrefix: "10.0.2.0/24"
                }
            ];

            it('name undefined', () => {
                let settings = _.cloneDeep(subnetsSettings);
                delete settings[0].name;
                let errors = validation.validate({
                    settings: settings,
                    validations: subnetValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('[0].name');
            });

            it('name empty', () => {
                let settings = _.cloneDeep(subnetsSettings);
                settings[0].name = '';
                let errors = validation.validate({
                    settings: settings,
                    validations: subnetValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('[0].name');
            });

            it('name whitespace', () => {
                let settings = _.cloneDeep(subnetsSettings);
                settings[0].name = '   ';
                let errors = validation.validate({
                    settings: settings,
                    validations: subnetValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('[0].name');
            });

            it('addressPrefix undefined', () => {
                let settings = _.cloneDeep(subnetsSettings);
                delete settings[0].addressPrefix;
                let errors = validation.validate({
                    settings: settings,
                    validations: subnetValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('[0].addressPrefix');
            });

            it('addressPrefix empty', () => {
                let settings = _.cloneDeep(subnetsSettings);
                settings[0].addressPrefix = '';
                let errors = validation.validate({
                    settings: settings,
                    validations: subnetValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('[0].addressPrefix');
            });

            it('addressPrefix whitespace', () => {
                let settings = _.cloneDeep(subnetsSettings);
                settings[0].addressPrefix = '   ';
                let errors = validation.validate({
                    settings: settings,
                    validations: subnetValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('[0].addressPrefix');
            });

            it('addressPrefix invalid cidr', () => {
                let settings = _.cloneDeep(subnetsSettings);
                settings[0].addressPrefix = '10.0.0.1';
                let errors = validation.validate({
                    settings: settings,
                    validations: subnetValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('[0].addressPrefix');
            });
        });

        describe('virtualNetworkSettingsPeeringValidations', () => {
            let peeringValidations = virtualNetworkSettings.__get__('virtualNetworkSettingsPeeringValidations');
            let peeringSettings = [
                {
                    name: "another-provided-peering-name",
                    remoteVirtualNetwork: {
                        name: "my-third-virtual-network"
                    },
                    allowForwardedTraffic: false,
                    allowGatewayTransit: false,
                    useRemoteGateways: true
                }
            ];

            it('name undefined', () => {
                let settings = _.cloneDeep(peeringSettings);
                delete settings[0].name;
                let errors = validation.validate({
                    settings: settings,
                    validations: peeringValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('[0].name');
            });

            it('name empty', () => {
                let settings = _.cloneDeep(peeringSettings);
                settings[0].name = '';
                let errors = validation.validate({
                    settings: settings,
                    validations: peeringValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('[0].name');
            });

            it('name whitespace', () => {
                let settings = _.cloneDeep(peeringSettings);
                settings[0].name = '   ';
                let errors = validation.validate({
                    settings: settings,
                    validations: peeringValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('[0].name');
            });

            it('allowForwardedTraffic undefined', () => {
                let settings = _.cloneDeep(peeringSettings);
                delete settings[0].allowForwardedTraffic;
                let errors = validation.validate({
                    settings: settings,
                    validations: peeringValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('[0].allowForwardedTraffic');
            });

            it('allowForwardedTraffic null', () => {
                let settings = _.cloneDeep(peeringSettings);
                settings[0].allowForwardedTraffic = null;
                let errors = validation.validate({
                    settings: settings,
                    validations: peeringValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('[0].allowForwardedTraffic');
            });

            it('allowGatewayTransit undefined', () => {
                let settings = _.cloneDeep(peeringSettings);
                delete settings[0].allowGatewayTransit;
                let errors = validation.validate({
                    settings: settings,
                    validations: peeringValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('[0].allowGatewayTransit');
            });

            it('allowGatewayTransit null', () => {
                let settings = _.cloneDeep(peeringSettings);
                settings[0].allowGatewayTransit = null;
                let errors = validation.validate({
                    settings: settings,
                    validations: peeringValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('[0].allowGatewayTransit');
            });

            it('useRemoteGateways undefined', () => {
                let settings = _.cloneDeep(peeringSettings);
                delete settings[0].useRemoteGateways;
                let errors = validation.validate({
                    settings: settings,
                    validations: peeringValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('[0].useRemoteGateways');
            });

            it('useRemoteGateways null', () => {
                let settings = _.cloneDeep(peeringSettings);
                settings[0].useRemoteGateways = null;
                let errors = validation.validate({
                    settings: settings,
                    validations: peeringValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('[0].useRemoteGateways');
            });

            describe('remoteVirtualNetworkValidations', () => {
                let remoteVirtualNetworkValidations = peeringValidations.remoteVirtualNetwork;
                let remoteVirtualNetworkSettings = peeringSettings[0].remoteVirtualNetwork;

                it('name undefined', () => {
                    let settings = _.cloneDeep(remoteVirtualNetworkSettings);
                    delete settings.name;
                    let errors = validation.validate({
                        settings: settings,
                        validations: remoteVirtualNetworkValidations
                    });

                    expect(errors.length).toEqual(1);
                    expect(errors[0].name).toEqual('.name');
                });

                it('name empty', () => {
                    let settings = _.cloneDeep(remoteVirtualNetworkSettings);
                    settings.name = '';
                    let errors = validation.validate({
                        settings: settings,
                        validations: remoteVirtualNetworkValidations
                    });

                    expect(errors.length).toEqual(1);
                    expect(errors[0].name).toEqual('.name');
                });

                it('name whitespace', () => {
                    let settings = _.cloneDeep(remoteVirtualNetworkSettings);
                    settings.name = '   ';
                    let errors = validation.validate({
                        settings: settings,
                        validations: remoteVirtualNetworkValidations
                    });

                    expect(errors.length).toEqual(1);
                    expect(errors[0].name).toEqual('.name');
                });
            });
        });

        describe('virtualNetworkValidations', () => {
            let virtualNetworkValidations = virtualNetworkSettingsValidations;
            let virtualNetworkSettings = {
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
                dnsServers: ['10.0.0.1'],
                virtualNetworkPeerings: [
                    {
                        name: "another-provided-peering-name",
                        remoteVirtualNetwork: {
                            name: "my-third-virtual-network"
                        },
                        allowForwardedTraffic: false,
                        allowGatewayTransit: false,
                        useRemoteGateways: true
                    }
                ]
            };

            it('name undefined', () => {
                let settings = _.cloneDeep(virtualNetworkSettings);
                delete settings.name;

                let errors = validation.validate({
                    settings: settings,
                    validations: virtualNetworkValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('.name');
            });

            it('addressPrefixes undefined', () => {
                let settings = _.cloneDeep(virtualNetworkSettings);
                delete settings.addressPrefixes;

                let errors = validation.validate({
                    settings: settings,
                    validations: virtualNetworkValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('.addressPrefixes');
            });

            it('addressPrefixes empty', () => {
                let settings = _.cloneDeep(virtualNetworkSettings);
                settings.addressPrefixes = [];

                let errors = validation.validate({
                    settings: settings,
                    validations: virtualNetworkValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('.addressPrefixes');
            });

            it('addressPrefixes invalid cidr', () => {
                let settings = _.cloneDeep(virtualNetworkSettings);
                settings.addressPrefixes = ['10.0.0.1'];

                let errors = validation.validate({
                    settings: settings,
                    validations: virtualNetworkValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('.addressPrefixes');
            });

            it('subnets undefined', () => {
                let settings = _.cloneDeep(virtualNetworkSettings);
                delete settings.subnets;

                let errors = validation.validate({
                    settings: settings,
                    validations: virtualNetworkValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('.subnets');
            });

            it('subnets empty', () => {
                let settings = _.cloneDeep(virtualNetworkSettings);
                settings.subnets = [];

                let errors = validation.validate({
                    settings: settings,
                    validations: virtualNetworkValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('.subnets');
            });

            it('dnsServers undefined', () => {
                let settings = _.cloneDeep(virtualNetworkSettings);
                delete settings.dnsServers;

                let errors = validation.validate({
                    settings: settings,
                    validations: virtualNetworkValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('.dnsServers');
            });

            it('dnsServers null', () => {
                let settings = _.cloneDeep(virtualNetworkSettings);
                settings.dnsServers = null;

                let errors = validation.validate({
                    settings: settings,
                    validations: virtualNetworkValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('.dnsServers');
            });

            it('dnsServers empty', () => {
                let settings = _.cloneDeep(virtualNetworkSettings);
                settings.dnsServers = [];

                let errors = validation.validate({
                    settings: settings,
                    validations: virtualNetworkValidations
                });

                expect(errors.length).toEqual(0);
            });

            it('dnsServers invalid ip address', () => {
                let settings = _.cloneDeep(virtualNetworkSettings);
                settings.dnsServers = ['10.0.0'];

                let errors = validation.validate({
                    settings: settings,
                    validations: virtualNetworkValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('.dnsServers[0]');
            });

            it('virtualNetworkPeerings undefined', () => {
                let settings = _.cloneDeep(virtualNetworkSettings);
                delete settings.virtualNetworkPeerings;

                let errors = validation.validate({
                    settings: settings,
                    validations: virtualNetworkValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('.virtualNetworkPeerings');
            });

            it('virtualNetworkPeerings null', () => {
                let settings = _.cloneDeep(virtualNetworkSettings);
                settings.virtualNetworkPeerings = null;

                let errors = validation.validate({
                    settings: settings,
                    validations: virtualNetworkValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('.virtualNetworkPeerings');
            });

            it('virtualNetworkPeerings empty', () => {
                let settings = _.cloneDeep(virtualNetworkSettings);
                settings.virtualNetworkPeerings = [];

                let errors = validation.validate({
                    settings: settings,
                    validations: virtualNetworkValidations
                });

                expect(errors.length).toEqual(0);
            });

            

            it('valid', () => {
                let settings = _.cloneDeep(virtualNetworkSettings);

                let errors = validation.validate({
                    settings: settings,
                    validations: virtualNetworkValidations
                });

                expect(errors.length).toEqual(0);
            });
        });
    });
});