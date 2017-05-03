describe('connectionSettings', () => {
    let _ = require('lodash');
    let rewire = require('rewire');
    let connectionSettings = rewire('../core/connectionSettings.js');
    let validation = require('../core/validation.js');

    describe('isValidConnectionType', () => {
        let isValidConnectionType = connectionSettings.__get__('isValidConnectionType');
        it('undefined', () => {
            expect(isValidConnectionType()).toEqual(false);
        });

        it('null', () => {
            expect(isValidConnectionType(null)).toEqual(false);
        });

        it('empty', () => {
            expect(isValidConnectionType('')).toEqual(false);
        });

        it('whitespace', () => {
            expect(isValidConnectionType(' ')).toEqual(false);
        });

        it('invalid spacing', () => {
            expect(isValidConnectionType(' IPsec ')).toEqual(false);
        });

        it('invalid casing', () => {
            expect(isValidConnectionType('ipsec')).toEqual(false);
        });

        it('invalid value', () => {
            expect(isValidConnectionType('NOT_A_VALID_CONNECTION_TYPE')).toEqual(false);
        });

        it('IPsec', () => {
            expect(isValidConnectionType('IPsec')).toEqual(true);
        });

        it('Vnet2Vnet', () => {
            expect(isValidConnectionType('Vnet2Vnet')).toEqual(true);
        });

        it('ExpressRoute', () => {
            expect(isValidConnectionType('ExpressRoute')).toEqual(true);
        });

        it('VPNClient', () => {
            expect(isValidConnectionType('VPNClient')).toEqual(true);
        });
    });

    describe('merge', () => {
        let merge = connectionSettings.__get__('merge');
        it('valid', () => {
            let result = merge({settings: {}});
            expect(result).toEqual({});
        });
    });

    describe('validations', () => {
        describe('virtualNetworkGatewayValidations', () => {
            let virtualNetworkGatewayValidations = connectionSettings.__get__('virtualNetworkGatewayValidations');
            it('name undefined', () => {
                let invalid = {};
                let errors = validation.validate({
                    settings: invalid,
                    validations: virtualNetworkGatewayValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('.name');
            });
        });

        describe('expressRouteCircuitValidations', () => {
            let expressRouteCircuitValidations = connectionSettings.__get__('expressRouteCircuitValidations');
            it('name undefined', () => {
                let invalid = {};
                let errors = validation.validate({
                    settings: invalid,
                    validations: expressRouteCircuitValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('.name');
            });
        });

        describe('localNetworkGatewayValidations', () => {
            let localNetworkGatewayValidations = connectionSettings.__get__('localNetworkGatewayValidations');
            let valid = {
                name: 'name',
                ipAddress: '10.0.0.1',
                addressPrefixes: ['10.0.0.1/24']
            };

            it('name undefined', () => {
                let invalid = _.cloneDeep(valid);
                delete invalid.name;
                let errors = validation.validate({
                    settings: invalid,
                    validations: localNetworkGatewayValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('.name');
            });

            it('ipAddress undefined', () => {
                let invalid = _.cloneDeep(valid);
                delete invalid.ipAddress;
                let errors = validation.validate({
                    settings: invalid,
                    validations: localNetworkGatewayValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('.ipAddress');
            });

            it('addressPrefixes undefined', () => {
                let invalid = _.cloneDeep(valid);
                delete invalid.addressPrefixes;
                let errors = validation.validate({
                    settings: invalid,
                    validations: localNetworkGatewayValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('.addressPrefixes');
            });
        });

        describe('connectionSettingsValidations', () => {
            let connectionSettingsValidations = connectionSettings.__get__('connectionSettingsValidations');
            let fullConnectionSettings = {
                name: 'my-connection',
                routingWeight: 10,
                sharedKey: 'mysecret',
                virtualNetworkGateway: {
                    name: 'vgw'
                },
                virtualNetworkGateway1: {
                    name: 'vgw1'
                },
                virtualNetworkGateway2: {
                    name: 'vgw2'
                },
                expressRouteCircuit: {
                    name: 'my-er-circuit'
                },
                localNetworkGateway: {
                    name: 'my-lgw',
                    ipAddress: '40.50.60.70',
                    addressPrefixes: ['10.0.1.0/24']
                }
            };

            let ipsecConnectionSettings = {
                name: fullConnectionSettings.name,
                routingWeight: fullConnectionSettings.routingWeight,
                connectionType: 'IPsec',
                sharedKey: fullConnectionSettings.sharedKey,
                virtualNetworkGateway: fullConnectionSettings.virtualNetworkGateway,
                localNetworkGateway: fullConnectionSettings.localNetworkGateway
            };

            let expressRouteConnectionSettings = {
                name: fullConnectionSettings.name,
                routingWeight: fullConnectionSettings.routingWeight,
                connectionType: 'ExpressRoute',
                virtualNetworkGateway: fullConnectionSettings.virtualNetworkGateway,
                expressRouteCircuit: fullConnectionSettings.expressRouteCircuit
            };

            let vnet2VnetConnectionSettings = {
                name: fullConnectionSettings.name,
                routingWeight: fullConnectionSettings.routingWeight,
                connectionType: 'Vnet2Vnet',
                sharedKey: fullConnectionSettings.sharedKey,
                virtualNetworkGateway1: fullConnectionSettings.virtualNetworkGateway1,
                virtualNetworkGateway2: fullConnectionSettings.virtualNetworkGateway2
            };

            let v = (settings, field) => {
                let clone = _.cloneDeep(settings);
                delete clone[field];
                return validation.validate({
                    settings: clone,
                    validations: connectionSettingsValidations
                });
            };

            describe('IPsec', () => {
                let connectionSettings = ipsecConnectionSettings;
                it('name undefined', () => {
                    let errors = v(connectionSettings, 'name');
                    expect(errors.length).toEqual(1);
                    expect(errors[0].name).toEqual('.name');
                });

                it('routingWeight undefined', () => {
                    let errors = v(connectionSettings, 'routingWeight');
                    expect(errors.length).toEqual(1);
                    expect(errors[0].name).toEqual('.routingWeight');
                });

                it('connectionType undefined', () => {
                    let errors = v(connectionSettings, 'connectionType');
                    expect(errors.length).toEqual(1);
                    expect(errors[0].name).toEqual('.connectionType');
                });

                it('sharedKey undefined', () => {
                    let errors = v(connectionSettings, 'sharedKey');
                    expect(errors.length).toEqual(1);
                    expect(errors[0].name).toEqual('.sharedKey');
                });

                it('sharedKey null', () => {
                    let settings = _.cloneDeep(connectionSettings);
                    settings.sharedKey = null;
                    let errors = validation.validate({
                        settings: settings,
                        validations: connectionSettingsValidations
                    });
                    
                    expect(errors.length).toEqual(1);
                    expect(errors[0].name).toEqual('.sharedKey');
                });

                it('sharedKey empty', () => {
                    let settings = _.cloneDeep(connectionSettings);
                    settings.sharedKey = '';
                    let errors = validation.validate({
                        settings: settings,
                        validations: connectionSettingsValidations
                    });
                    
                    expect(errors.length).toEqual(1);
                    expect(errors[0].name).toEqual('.sharedKey');
                });

                it('sharedKey whitespace', () => {
                    let settings = _.cloneDeep(connectionSettings);
                    settings.sharedKey = '   ';
                    let errors = validation.validate({
                        settings: settings,
                        validations: connectionSettingsValidations
                    });
                    
                    expect(errors.length).toEqual(1);
                    expect(errors[0].name).toEqual('.sharedKey');
                });

                it('virtualNetworkGateway undefined', () => {
                    let errors = v(connectionSettings, 'virtualNetworkGateway');
                    expect(errors.length).toEqual(1);
                    expect(errors[0].name).toEqual('.virtualNetworkGateway');
                });

                it('localNetworkGateway undefined', () => {
                    let errors = v(connectionSettings, 'localNetworkGateway');
                    expect(errors.length).toEqual(1);
                    expect(errors[0].name).toEqual('.localNetworkGateway');
                });

                it('expressRouteCircuit defined', () => {
                    let settings = _.cloneDeep(connectionSettings);
                    settings.expressRouteCircuit = fullConnectionSettings.expressRouteCircuit;
                    let errors = validation.validate({
                        settings: settings,
                        validations: connectionSettingsValidations
                    });
                    
                    expect(errors.length).toEqual(1);
                    expect(errors[0].name).toEqual('.expressRouteCircuit');
                });

                it('virtualNetworkGateway1 defined', () => {
                    let settings = _.cloneDeep(connectionSettings);
                    settings.virtualNetworkGateway1 = fullConnectionSettings.virtualNetworkGateway1;
                    let errors = validation.validate({
                        settings: settings,
                        validations: connectionSettingsValidations
                    });
                    
                    expect(errors.length).toEqual(1);
                    expect(errors[0].name).toEqual('.virtualNetworkGateway1');
                });

                it('virtualNetworkGateway2 defined', () => {
                    let settings = _.cloneDeep(connectionSettings);
                    settings.virtualNetworkGateway2 = fullConnectionSettings.virtualNetworkGateway2;
                    let errors = validation.validate({
                        settings: settings,
                        validations: connectionSettingsValidations
                    });
                    
                    expect(errors.length).toEqual(1);
                    expect(errors[0].name).toEqual('.virtualNetworkGateway2');
                });

                it('valid', () => {
                    let errors = validation.validate({
                        settings: connectionSettings,
                        validations: connectionSettingsValidations
                    });

                    expect(errors.length).toEqual(0);
                });
            });

            describe('ExpressRoute', () => {
                let connectionSettings = expressRouteConnectionSettings;
                it('name undefined', () => {
                    let errors = v(connectionSettings, 'name');
                    expect(errors.length).toEqual(1);
                    expect(errors[0].name).toEqual('.name');
                });

                it('routingWeight undefined', () => {
                    let errors = v(connectionSettings, 'routingWeight');
                    expect(errors.length).toEqual(1);
                    expect(errors[0].name).toEqual('.routingWeight');
                });

                it('connectionType undefined', () => {
                    let errors = v(connectionSettings, 'connectionType');
                    expect(errors.length).toEqual(1);
                    expect(errors[0].name).toEqual('.connectionType');
                });

                it('sharedKey defined', () => {
                    let settings = _.cloneDeep(connectionSettings);
                    settings.sharedKey = fullConnectionSettings.sharedKey;
                    let errors = validation.validate({
                        settings: settings,
                        validations: connectionSettingsValidations
                    });
                    expect(errors.length).toEqual(1);
                    expect(errors[0].name).toEqual('.sharedKey');
                });

                it('virtualNetworkGateway undefined', () => {
                    let errors = v(connectionSettings, 'virtualNetworkGateway');
                    expect(errors.length).toEqual(1);
                    expect(errors[0].name).toEqual('.virtualNetworkGateway');
                });

                it('expressRouteCircuit undefined', () => {
                    let errors = v(connectionSettings, 'expressRouteCircuit');
                    expect(errors.length).toEqual(1);
                    expect(errors[0].name).toEqual('.expressRouteCircuit');
                });

                it('localNetworkGateway defined', () => {
                    let settings = _.cloneDeep(connectionSettings);
                    settings.localNetworkGateway = fullConnectionSettings.localNetworkGateway;
                    let errors = validation.validate({
                        settings: settings,
                        validations: connectionSettingsValidations
                    });
                    
                    expect(errors.length).toEqual(1);
                    expect(errors[0].name).toEqual('.localNetworkGateway');
                });

                it('virtualNetworkGateway1 defined', () => {
                    let settings = _.cloneDeep(connectionSettings);
                    settings.virtualNetworkGateway1 = fullConnectionSettings.virtualNetworkGateway1;
                    let errors = validation.validate({
                        settings: settings,
                        validations: connectionSettingsValidations
                    });
                    
                    expect(errors.length).toEqual(1);
                    expect(errors[0].name).toEqual('.virtualNetworkGateway1');
                });

                it('virtualNetworkGateway2 defined', () => {
                    let settings = _.cloneDeep(connectionSettings);
                    settings.virtualNetworkGateway2 = fullConnectionSettings.virtualNetworkGateway2;
                    let errors = validation.validate({
                        settings: settings,
                        validations: connectionSettingsValidations
                    });
                    
                    expect(errors.length).toEqual(1);
                    expect(errors[0].name).toEqual('.virtualNetworkGateway2');
                });

                it('valid', () => {
                    let errors = validation.validate({
                        settings: connectionSettings,
                        validations: connectionSettingsValidations
                    });

                    expect(errors.length).toEqual(0);
                });
            });

            describe('Vnet2Vnet', () => {
                let connectionSettings = vnet2VnetConnectionSettings;
                it('name undefined', () => {
                    let errors = v(connectionSettings, 'name');
                    expect(errors.length).toEqual(1);
                    expect(errors[0].name).toEqual('.name');
                });

                it('routingWeight undefined', () => {
                    let errors = v(connectionSettings, 'routingWeight');
                    expect(errors.length).toEqual(1);
                    expect(errors[0].name).toEqual('.routingWeight');
                });

                it('connectionType undefined', () => {
                    let errors = v(connectionSettings, 'connectionType');
                    expect(errors.length).toEqual(1);
                    expect(errors[0].name).toEqual('.connectionType');
                });

                it('sharedKey undefined', () => {
                    let errors = v(connectionSettings, 'sharedKey');
                    expect(errors.length).toEqual(1);
                    expect(errors[0].name).toEqual('.sharedKey');
                });

                it('sharedKey null', () => {
                    let settings = _.cloneDeep(connectionSettings);
                    settings.sharedKey = null;
                    let errors = validation.validate({
                        settings: settings,
                        validations: connectionSettingsValidations
                    });
                    
                    expect(errors.length).toEqual(1);
                    expect(errors[0].name).toEqual('.sharedKey');
                });

                it('sharedKey empty', () => {
                    let settings = _.cloneDeep(connectionSettings);
                    settings.sharedKey = '';
                    let errors = validation.validate({
                        settings: settings,
                        validations: connectionSettingsValidations
                    });
                    
                    expect(errors.length).toEqual(1);
                    expect(errors[0].name).toEqual('.sharedKey');
                });

                it('sharedKey whitespace', () => {
                    let settings = _.cloneDeep(connectionSettings);
                    settings.sharedKey = '   ';
                    let errors = validation.validate({
                        settings: settings,
                        validations: connectionSettingsValidations
                    });
                    
                    expect(errors.length).toEqual(1);
                    expect(errors[0].name).toEqual('.sharedKey');
                });

                it('virtualNetworkGateway1 undefined', () => {
                    let errors = v(connectionSettings, 'virtualNetworkGateway1');
                    expect(errors.length).toEqual(1);
                    expect(errors[0].name).toEqual('.virtualNetworkGateway1');
                });

                it('virtualNetworkGateway2 undefined', () => {
                    let errors = v(connectionSettings, 'virtualNetworkGateway2');
                    expect(errors.length).toEqual(1);
                    expect(errors[0].name).toEqual('.virtualNetworkGateway2');
                });

                it('localNetworkGateway defined', () => {
                    let settings = _.cloneDeep(connectionSettings);
                    settings.localNetworkGateway = fullConnectionSettings.localNetworkGateway;
                    let errors = validation.validate({
                        settings: settings,
                        validations: connectionSettingsValidations
                    });
                    
                    expect(errors.length).toEqual(1);
                    expect(errors[0].name).toEqual('.localNetworkGateway');
                });

                it('virtualNetworkGateway defined', () => {
                    let settings = _.cloneDeep(connectionSettings);
                    settings.virtualNetworkGateway = fullConnectionSettings.virtualNetworkGateway;
                    let errors = validation.validate({
                        settings: settings,
                        validations: connectionSettingsValidations
                    });
                    
                    expect(errors.length).toEqual(1);
                    expect(errors[0].name).toEqual('.virtualNetworkGateway');
                });

                it('expressRouteCircuit defined', () => {
                    let settings = _.cloneDeep(connectionSettings);
                    settings.expressRouteCircuit = fullConnectionSettings.expressRouteCircuit;
                    let errors = validation.validate({
                        settings: settings,
                        validations: connectionSettingsValidations
                    });
                    
                    expect(errors.length).toEqual(1);
                    expect(errors[0].name).toEqual('.expressRouteCircuit');
                });

                it('valid', () => {
                    let errors = validation.validate({
                        settings: connectionSettings,
                        validations: connectionSettingsValidations
                    });

                    expect(errors.length).toEqual(0);
                });
            });
        });
    });
});