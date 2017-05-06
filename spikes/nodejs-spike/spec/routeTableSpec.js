describe('routeTableSettings', () => {
    let rewire = require('rewire');
    let resources = require('../core/resources.js');
    let routeTableSettings = rewire('../core/routeTableSettings.js');
    let _ = require('lodash');
    let validation = require('../core/validation.js');

    describe('isValidNextHopType', () => {
        let isValidNextHopType = routeTableSettings.__get__('isValidNextHopType');
        
            it('undefined', () => {
                expect(isValidNextHopType()).toEqual(false);
            });

            it('null', () => {
                expect(isValidNextHopType(null)).toEqual(false);
            });

            it('empty', () => {
                expect(isValidNextHopType('')).toEqual(false);
            });

            it('whitespace', () => {
                expect(isValidNextHopType(' ')).toEqual(false);
            });

            it('invalid spacing', () => {
                expect(isValidNextHopType(' VirtualNetworkGateway ')).toEqual(false);
            });

            it('invalid casing', () => {
                expect(isValidNextHopType('virtualnetworkgateway')).toEqual(false);
            });

            it('invalid value', () => {
                expect(isValidNextHopType('NOT_A_VALID_NEXT_HOP_TYPE')).toEqual(false);
            });

            it('VirtualNetworkGateway', () => {
                expect(isValidNextHopType('VirtualNetworkGateway')).toEqual(true);
            });

            it('VnetLocal', () => {
                expect(isValidNextHopType('VnetLocal')).toEqual(true);
            });

            it('Internet', () => {
                expect(isValidNextHopType('Internet')).toEqual(true);
            });

            it('HyperNetGateway', () => {
                expect(isValidNextHopType('HyperNetGateway')).toEqual(true);
            });

            it('None', () => {
                expect(isValidNextHopType('None')).toEqual(true);
            });

            it('VirtualAppliance', () => {
                expect(isValidNextHopType('VirtualAppliance')).toEqual(true);
            });
    });

    describe('validations', () => {
        let routeTableSettingsValidations = routeTableSettings.__get__('routeTableSettingsValidations');

        describe('virtualNetworkValidations', () => {
            let virtualNetworkValidations = routeTableSettingsValidations.virtualNetworks;
            let virtualNetworkSettings = [
                {
                    name: 'my-virtual-network',
                    subnets: ['web', 'biz']
                }
            ];

            it('empty array', () => {
                let errors = validation.validate({
                    settings: [],
                    validations: virtualNetworkValidations
                });

                expect(errors.length).toEqual(0);
            });

            it('name undefined', () => {
                let settings = _.cloneDeep(virtualNetworkSettings);
                delete settings[0].name;

                let errors = validation.validate({
                    settings: settings,
                    validations: virtualNetworkValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('[0].name');
            });

            it('subnets undefined', () => {
                let settings = _.cloneDeep(virtualNetworkSettings);
                delete settings[0].subnets;

                let errors = validation.validate({
                    settings: settings,
                    validations: virtualNetworkValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('[0].subnets');
            });

            it('subnets empty', () => {
                let settings = _.cloneDeep(virtualNetworkSettings);
                settings[0].subnets = [];

                let errors = validation.validate({
                    settings: settings,
                    validations: virtualNetworkValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('[0].subnets');
            });

            it('subnets empty string', () => {
                let settings = _.cloneDeep(virtualNetworkSettings);
                settings[0].subnets = [''];

                let errors = validation.validate({
                    settings: settings,
                    validations: virtualNetworkValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('[0].subnets[0]');
            });
        });

        describe('routeValidations', () => {
            let routeValidations = routeTableSettingsValidations.routes;

            let valid = {
                name: 'name',
                addressPrefix: '10.0.0.1/24',
                nextHopType: 'VirtualNetworkGateway'
            };

            it('name undefined', () => {
                let invalid = _.cloneDeep(valid);
                delete invalid.name;
                let errors = validation.validate({
                    settings: [invalid],
                    validations: routeValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('[0].name');
            });

            it('addressPrefix undefined', () => {
                let invalid = _.cloneDeep(valid);
                delete invalid.addressPrefix;
                let errors = validation.validate({
                    settings: [invalid],
                    validations: routeValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('[0].addressPrefix');
            });

            it('nextHopType undefined', () => {
                let invalid = _.cloneDeep(valid);
                delete invalid.nextHopType;
                let errors = validation.validate({
                    settings: [invalid],
                    validations: routeValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('[0].nextHopType');
            });

            it('nextHopIpAddress undefined', () => {
                let invalid = _.cloneDeep(valid);
                invalid.nextHopType = 'VirtualAppliance';
                let errors = validation.validate({
                    settings: [invalid],
                    validations: routeValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('[0].nextHopIpAddress');
            });
        });

        describe('routeTableSettingsValidations', () => {
            let routeTableSettings = {
                name: 'my-route-table',
                virtualNetworks: [
                    {
                        name: 'my-virtual-network',
                        subnets: [
                            'biz',
                            'web'
                        ]
                    }
                ],
                routes: [
                    {
                        name: 'route1',
                        addressPrefix: '10.0.1.0/24',
                        nextHopType: 'VnetLocal'
                    },
                    {
                        name: 'route2',
                        addressPrefix: '10.0.2.0/24',
                        nextHopType: 'VirtualAppliance',
                        nextHopIpAddress: '192.168.1.1'
                    }
                ]
            };

            it('name undefined', () => {
                let settings = _.cloneDeep(routeTableSettings);
                delete settings.name;
                let errors = validation.validate({
                    settings: settings,
                    validations: routeTableSettingsValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('.name');
            });

            it('virtualNetwork empty', () => {
                let settings = _.cloneDeep(routeTableSettings);
                settings.virtualNetworks = [];
                let errors = validation.validate({
                    settings: settings,
                    validations: routeTableSettingsValidations
                });

                expect(errors.length).toEqual(0);
            });

            it('duplicate route name', () => {
                let settings = _.cloneDeep(routeTableSettings);
                settings.routes[1].name = 'route1';
                let errors = validation.validate({
                    settings: settings,
                    validations: routeTableSettingsValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('.routes');
            });
        });
    });
});