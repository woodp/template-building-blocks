describe('networkSecurityGroupSettings', () => {
    let rewire = require('rewire');
    let nsgSettings = rewire('../core/networkSecurityGroupSettings.js');
    let validationMessages = require('../core/validationMessages.js');

    describe('isValidProtocol', () => {
        let isValidProtocol = nsgSettings.__get__("isValidProtocol");
        
            it('undefined', () => {
                expect(isValidProtocol()).toEqual(false);
            });

            it('null', () => {
                expect(isValidProtocol(null)).toEqual(false);
            });

            it('empty', () => {
                expect(isValidProtocol('')).toEqual(false);
            });

            it('whitespace', () => {
                expect(isValidProtocol(' ')).toEqual(false);
            });

            it('invalid spacing', () => {
                expect(isValidProtocol(' TCP ')).toEqual(false);
            });

            it('invalid casing', () => {
                expect(isValidProtocol('tcp')).toEqual(false);
            });

            it('invalid value', () => {
                expect(isValidProtocol('NOT_A_VALID_PROTOCOL')).toEqual(false);
            });

            it('TCP', () => {
                expect(isValidProtocol('TCP')).toEqual(true);
            });

            it('UDP', () => {
                expect(isValidProtocol('UDP')).toEqual(true);
            });

            it('*', () => {
                expect(isValidProtocol('*')).toEqual(true);
            });
    });

    describe('isValidAddressPrefix', () => {
        let isValidAddressPrefix = nsgSettings.__get__('isValidAddressPrefix');
        
        it('undefined', () => {
            expect(isValidAddressPrefix()).toEqual(false);
        });

        it('null', () => {
            expect(isValidAddressPrefix(null)).toEqual(false);
        });

        it('empty', () => {
            expect(isValidAddressPrefix('')).toEqual(false);
        });

        it('whitespace', () => {
            expect(isValidAddressPrefix(' ')).toEqual(false);
        });

        it('invalid spacing', () => {
            expect(isValidAddressPrefix(' 127.0.0.1 ')).toEqual(false);
        });

        it('invalid casing', () => {
            expect(isValidAddressPrefix('virtualnetwork')).toEqual(false);
        });

        it('invalid value', () => {
            expect(isValidAddressPrefix('NOT_A_VALID_ADDRESS_PREFIX')).toEqual(false);
        });
        
        it('invalid IP Address', () => {
            expect(isValidAddressPrefix('127.0.0')).toEqual(false);
        });

        it('invalid CIDR', () => {
            expect(isValidAddressPrefix('127.0.0.1/33')).toEqual(false);
        });

        it('IP Address', () => {
            expect(isValidAddressPrefix('127.0.0.1')).toEqual(true);
        });

        it('CIDR', () => {
            expect(isValidAddressPrefix('127.0.0.1/29')).toEqual(true);
        });

        it('VirtualNetwork', () => {
            expect(isValidAddressPrefix('VirtualNetwork')).toEqual(true);
        });

        it('AzureLoadBalancer', () => {
            expect(isValidAddressPrefix('AzureLoadBalancer')).toEqual(true);
        });

        it('Internet', () => {
            expect(isValidAddressPrefix('Internet')).toEqual(true);
        });

        it('*', () => {
            expect(isValidAddressPrefix('*')).toEqual(true);
        });
    });

    describe('isValidDirection', () => {
        let isValidDirection = nsgSettings.__get__('isValidDirection');
        
        it('undefined', () => {
            expect(isValidDirection()).toEqual(false);
        });

        it('null', () => {
            expect(isValidDirection(null)).toEqual(false);
        });

        it('empty', () => {
            expect(isValidDirection('')).toEqual(false);
        });

        it('whitespace', () => {
            expect(isValidDirection(' ')).toEqual(false);
        });

        it('invalid spacing', () => {
            expect(isValidDirection(' Inbound ')).toEqual(false);
        });

        it('invalid casing', () => {
            expect(isValidDirection('inbound')).toEqual(false);
        });

        it('invalid value', () => {
            expect(isValidDirection('NOT_A_VALID_DIRECTION')).toEqual(false);
        });
        
        it('Inbound', () => {
            expect(isValidDirection('Inbound')).toEqual(true);
        });

        it('Outbound', () => {
            expect(isValidDirection('Outbound')).toEqual(true);
        });
    });

    describe('isValidPriority', () => {
        let isValidPriority = nsgSettings.__get__("isValidPriority");
        
            it('undefined', () => {
                expect(isValidPriority()).toEqual(false);
            });

            it('null', () => {
                expect(isValidPriority(null)).toEqual(false);
            });

            it('empty', () => {
                expect(isValidPriority('')).toEqual(false);
            });

            it('whitespace', () => {
                expect(isValidPriority(' ')).toEqual(false);
            });

            it('too low', () => {
                expect(isValidPriority(99)).toEqual(false);
            });

            it('too high', () => {
                expect(isValidPriority(4097)).toEqual(false);
            });

            it('low', () => {
                expect(isValidPriority(100)).toEqual(true);
            });

            it('high', () => {
                expect(isValidPriority(4096)).toEqual(true);
            });

            it('string', () => {
                expect(isValidPriority('100')).toEqual(true);
            });

            it('string with spacing', () => {
                expect(isValidPriority(' 100 ')).toEqual(true);
            });
    });

    describe('isValidAccess', () => {
        let isValidAccess = nsgSettings.__get__('isValidAccess');
        
        it('undefined', () => {
            expect(isValidAccess()).toEqual(false);
        });

        it('null', () => {
            expect(isValidAccess(null)).toEqual(false);
        });

        it('empty', () => {
            expect(isValidAccess('')).toEqual(false);
        });

        it('whitespace', () => {
            expect(isValidAccess(' ')).toEqual(false);
        });

        it('invalid spacing', () => {
            expect(isValidAccess(' Allow ')).toEqual(false);
        });

        it('invalid casing', () => {
            expect(isValidAccess('allow')).toEqual(false);
        });

        it('invalid value', () => {
            expect(isValidAccess('NOT_A_VALID_ACCESS')).toEqual(false);
        });
        
        it('Allow', () => {
            expect(isValidAccess('Allow')).toEqual(true);
        });

        it('Deny', () => {
            expect(isValidAccess('Deny')).toEqual(true);
        });
    });

    describe('securityRulesValidations', () => {
        describe('protocol', () => {
            let validation = nsgSettings.__get__('networkSecurityGroupSettingsSecurityRulesValidations').protocol;
            it('invalid', () => {
                let result = validation('NOT_A_VALID_PROTOCOL', null);
                expect(result.result).toEqual(false);
                //let results = [];
                // validation(results, 'securityRules[0]', 'protocol', 'NOT_A_VALID_PROTOCOL', null);
                // expect(results.length).toEqual(1);
                // expect(results[0].name).toEqual('securityRules[0].protocol');
                // expect(results[0].message).toEqual(validationMessages.networkSecurityGroup.securityRules.InvalidProtocol);
            });

            it('valid', () => {
                let result = validation('*', null);
                expect(result.result).toEqual(true);
                // let results = [];
                // validation(results, 'securityRules[0]', 'protocol', '*', null);
                // expect(results.length).toEqual(0);
            });
        });

        describe('sourcePortRange', () => {
            let validation = nsgSettings.__get__('networkSecurityGroupSettingsSecurityRulesValidations').sourcePortRange;
            it('invalid', () => {
                let result = validation('NOT_A_VALID_PORT_RANGE', null);
                expect(result).toEqual(false);
                // let results = [];
                // validation(results, 'securityRules[0]', 'sourcePortRange', 'NOT_A_VALID_PORT_RANGE', null);
                // expect(results.length).toEqual(1);
                // expect(results[0].name).toEqual('securityRules[0].sourcePortRange');
                // expect(results[0].message).toEqual(validationMessages.networkSecurityGroup.securityRules.InvalidPortRange);
            });

            it('valid', () => {
                let result = validation('*', null);
                expect(result).toEqual(true);
                // let results = [];
                // validation(results, 'securityRules[0]', 'sourcePortRange', '*', null);
                // expect(results.length).toEqual(0);
            });
        });

        describe('destinationPortRange', () => {
            let validation = nsgSettings.__get__('networkSecurityGroupSettingsSecurityRulesValidations').destinationPortRange;
            it('invalid', () => {
                let result = validation('NOT_A_VALID_PORT_RANGE', null);
                expect(result).toEqual(false);
                // let results = [];
                // validation(results, 'securityRules[0]', 'destinationPortRange', 'NOT_A_VALID_PORT_RANGE', null);
                // expect(results.length).toEqual(1);
                // expect(results[0].name).toEqual('securityRules[0].destinationPortRange');
                // expect(results[0].message).toEqual(validationMessages.networkSecurityGroup.securityRules.InvalidPortRange);
            });

            it('valid', () => {
                let result = validation('*', null);
                expect(result).toEqual(true);
                // let results = [];
                // validation(results, 'securityRules[0]', 'destinationPortRange', '*', null);
                // expect(results.length).toEqual(0);
            });
        });

        describe('sourceAddressPrefix', () => {
            let validation = nsgSettings.__get__('networkSecurityGroupSettingsSecurityRulesValidations').sourceAddressPrefix;
            it('invalid', () => {
                let result = validation('NOT_A_VALID_ADDRESS_PREFIX', null);
                expect(result.result).toEqual(false);
                // let results = [];
                // validation(results, 'securityRules[0]', 'sourceAddressPrefix', 'NOT_A_VALID_ADDRESS_PREFIX', null);
                // expect(results.length).toEqual(1);
                // expect(results[0].name).toEqual('securityRules[0].sourceAddressPrefix');
                // expect(results[0].message).toEqual(validationMessages.networkSecurityGroup.securityRules.InvalidAddressPrefix);
            });

            it('valid', () => {
                let result = validation('*', null);
                expect(result.result).toEqual(true);
                // let results = [];
                // validation(results, 'securityRules[0]', 'sourceAddressPrefix', '*', null);
                // expect(results.length).toEqual(0);
            });
        });

        describe('destinationAddressPrefix', () => {
            let validation = nsgSettings.__get__('networkSecurityGroupSettingsSecurityRulesValidations').destinationAddressPrefix;
            it('invalid', () => {
                let result = validation('NOT_A_VALID_ADDRESS_PREFIX', null);
                expect(result.result).toEqual(false);
                // let results = [];
                // validation(results, 'securityRules[0]', 'destinationAddressPrefix', 'NOT_A_VALID_ADDRESS_PREFIX', null);
                // expect(results.length).toEqual(1);
                // expect(results[0].name).toEqual('securityRules[0].destinationAddressPrefix');
                // expect(results[0].message).toEqual(validationMessages.networkSecurityGroup.securityRules.InvalidAddressPrefix);
            });

            it('valid', () => {
                let result = validation('*', null);
                expect(result.result).toEqual(true);
                // let results = [];
                // validation(results, 'securityRules[0]', 'destinationAddressPrefix', '*', null);
                // expect(results.length).toEqual(0);
            });
        });

        describe('direction', () => {
            let validation = nsgSettings.__get__('networkSecurityGroupSettingsSecurityRulesValidations').direction;
            it('invalid', () => {
                let result = validation('NOT_A_VALID_DIRECTION', null);
                expect(result.result).toEqual(false);
                // let results = [];
                // validation(results, 'securityRules[0]', 'direction', 'NOT_A_VALID_DIRECTION', null);
                // expect(results.length).toEqual(1);
                // expect(results[0].name).toEqual('securityRules[0].direction');
                // expect(results[0].message).toEqual(validationMessages.networkSecurityGroup.securityRules.InvalidDirection);
            });

            it('valid', () => {
                let result = validation('Inbound', null);
                expect(result.result).toEqual(true);
                // let results = [];
                // validation(results, 'securityRules[0]', 'direction', 'Inbound', null);
                // expect(results.length).toEqual(0);
            });
        });

        describe('priority', () => {
            let validation = nsgSettings.__get__('networkSecurityGroupSettingsSecurityRulesValidations').priority;
            it('invalid', () => {
                let result = validation('NOT_A_VALID_PRIORITY', null);
                expect(result).toEqual(false);
                // let results = [];
                // validation(results, 'securityRules[0]', 'priority', 'NOT_A_VALID_PRIORITY', null);
                // expect(results.length).toEqual(1);
                // expect(results[0].name).toEqual('securityRules[0].priority');
                // expect(results[0].message).toEqual(validationMessages.networkSecurityGroup.securityRules.InvalidPriority);
            });

            it('valid', () => {
                let result = validation('100', null);
                expect(result).toEqual(true);
                // let results = [];
                // validation(results, 'securityRules[0]', 'priority', '100', null);
                // expect(results.length).toEqual(0);
            });
        });

        describe('access', () => {
            let validation = nsgSettings.__get__('networkSecurityGroupSettingsSecurityRulesValidations').access;
            it('invalid', () => {
                let result = validation('NOT_A_VALID_ACCESS', null);
                expect(result.result).toEqual(false);
                // let results = [];
                // validation(results, 'securityRules[0]', 'access', 'NOT_A_VALID_ACCESS', null);
                // expect(results.length).toEqual(1);
                // expect(results[0].name).toEqual('securityRules[0].access');
                // expect(results[0].message).toEqual(validationMessages.networkSecurityGroup.securityRules.InvalidAccess);
            });

            it('valid', () => {
                let result = validation('Allow', null);
                expect(result.result).toEqual(true);
                // let results = [];
                // validation(results, 'securityRules[0]', 'access', 'Allow', null);
                // expect(results.length).toEqual(0);
            });
        });
    });
});