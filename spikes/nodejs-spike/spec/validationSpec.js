describe('validation', () => {
    let validation = require('../core/validation.js');
    let validationMessages = require('../core/validationMessages.js');

    // let subscriptionId = '689B3D5F-F473-405A-B3EB-7F59D418C682';
    // let resourceGroupName = 'test-rg';
    // let virtualNetworksResourceType = 'Microsoft.Network/virtualNetworks';
    // let subnetsResourceType = `${virtualNetworksResourceType}/subnets`;
    // let resourceName = 'my-virtual-network';
    // let subresourceName = 'my-subnet';
    describe('utilities', () => {
        describe('isGuid', () => {
            let isGuid = validation.utilities.isGuid;
            it('undefined', () => {
                expect(isGuid()).toEqual(false);
            });

            it('null', () => {
                expect(isGuid(null)).toEqual(false);
            });

            it('empty', () => {
                expect(isGuid('')).toEqual(false);
            });

            it('whitespace', () => {
                expect(isGuid(' ')).toEqual(false);
            });

            it('invalid spacing', () => {
                expect(isGuid(' 00000000-0000-1000-8000-000000000000 ')).toEqual(false);
            });

            it('invalid value', () => {
                expect(isGuid('NOT_A_VALID_GUID')).toEqual(false);
            });

            it('too many parts', () => {
                expect(isGuid('00000000-0000-1000-8000-000000000000-0000')).toEqual(false);
            });

            it('not enough parts', () => {
                expect(isGuid('00000000-0000-1000-8000')).toEqual(false);
            });

            it('valid', () => {
                expect(isGuid('00000000-0000-1000-8000-000000000000')).toEqual(true);
            });
        });

        describe('isStringInArray', () => {
            let isStringInArray = validation.utilities.isStringInArray;
            let validValues = ['value1', 'value2', 'value3'];
            it('undefined', () => {
                expect(isStringInArray(undefined, validValues)).toEqual(false);
            });

            it('null', () => {
                expect(isStringInArray(null, validValues)).toEqual(false);
            });

            it('empty', () => {
                expect(isStringInArray('', validValues)).toEqual(false);
            });

            it('whitespace', () => {
                expect(isStringInArray(' ', validValues)).toEqual(false);
            });

            it('invalid spacing', () => {
                expect(isStringInArray(' value1 ', validValues)).toEqual(false);
            });

            it('invalid value', () => {
                expect(isStringInArray('NOT_A_VALID_VALUE', validValues)).toEqual(false);
            });

            it('valid', () => {
                expect(isStringInArray('value1', validValues)).toEqual(true);
            });
        });

        describe('isNotNullOrWhitespace', () => {
            let isNotNullOrWhitespace = validation.utilities.isNotNullOrWhitespace;
            it('undefined', () => {
                expect(isNotNullOrWhitespace()).toEqual(false);
            });

            it('null', () => {
                expect(isNotNullOrWhitespace(null)).toEqual(false);
            });

            it('empty', () => {
                expect(isNotNullOrWhitespace('')).toEqual(false);
            });

            it('whitespace', () => {
                expect(isNotNullOrWhitespace(' ')).toEqual(false);
            });

            it('valid', () => {
                expect(isNotNullOrWhitespace('valid')).toEqual(true);
            });
        });

        describe('networking', () => {
            describe('isValidIpAddress', () => {
                let isValidIpAddress = validation.utilities.networking.isValidIpAddress;
                it('undefined', () => {
                    expect(isValidIpAddress()).toEqual(false);
                });

                it('null', () => {
                    expect(isValidIpAddress(null)).toEqual(false);
                });

                it('empty', () => {
                    expect(isValidIpAddress('')).toEqual(false);
                });

                it('whitespace', () => {
                    expect(isValidIpAddress(' ')).toEqual(false);
                });

                it('invalid spacing', () => {
                    expect(isValidIpAddress(' 10.0.0.1 ')).toEqual(false);
                });

                it('invalid value', () => {
                    expect(isValidIpAddress('NOT_A_VALID_IP_ADDRESS')).toEqual(false);
                });

                it('too many parts', () => {
                    expect(isValidIpAddress('10.0.0.0.1')).toEqual(false);
                });

                it('not enough parts', () => {
                    expect(isValidIpAddress('10.0.0')).toEqual(false);
                });

                it('valid', () => {
                    expect(isValidIpAddress('10.0.0.1')).toEqual(true);
                });
            });

            describe('isValidCidr', () => {
                let isValidCidr = validation.utilities.networking.isValidCidr;
                it('undefined', () => {
                    expect(isValidCidr()).toEqual(false);
                });

                it('null', () => {
                    expect(isValidCidr(null)).toEqual(false);
                });

                it('empty', () => {
                    expect(isValidCidr('')).toEqual(false);
                });

                it('whitespace', () => {
                    expect(isValidCidr(' ')).toEqual(false);
                });

                it('invalid spacing', () => {
                    expect(isValidCidr(' 10.0.0.1/24 ')).toEqual(false);
                });

                it('invalid value', () => {
                    expect(isValidCidr('NOT_A_VALID_IP_ADDRESS')).toEqual(false);
                });

                it('no mask', () => {
                    expect(isValidCidr('10.0.0.1/')).toEqual(false);
                });

                it('mask too big', () => {
                    expect(isValidCidr('10.0.0.1/33')).toEqual(false);
                });

                it('mask too small', () => {
                    expect(isValidCidr('10.0.0.1/-1')).toEqual(false);
                });

                it('valid', () => {
                    expect(isValidCidr('10.0.0.1/24')).toEqual(true);
                });
            });

            describe('isValidPortRange', () => {
                let isValidPortRange = validation.utilities.networking.isValidPortRange;
                it('undefined', () => {
                    expect(isValidPortRange()).toEqual(false);
                });

                it('null', () => {
                    expect(isValidPortRange(null)).toEqual(false);
                });

                it('empty', () => {
                    expect(isValidPortRange('')).toEqual(false);
                });

                it('whitespace', () => {
                    expect(isValidPortRange(' ')).toEqual(false);
                });

                it('Port 0', () => {
                    expect(isValidPortRange(0)).toEqual(false);
                });

                it('Port 65536', () => {
                    expect(isValidPortRange(65536)).toEqual(false);
                });

                it('Port 1', () => {
                    expect(isValidPortRange(1)).toEqual(true);
                });

                it('Port 65535', () => {
                    expect(isValidPortRange(65535)).toEqual(true);
                });

                it('Port *', () => {
                    expect(isValidPortRange('*')).toEqual(true);
                });

                it('Port 0-65535', () => {
                    expect(isValidPortRange('0-65535')).toEqual(false);
                });

                it('Port 1-65536', () => {
                    expect(isValidPortRange('1-65536')).toEqual(false);
                });

                it('Port 1-65535', () => {
                    expect(isValidPortRange('1-65535')).toEqual(true);
                });

                it('Port 1-10-20', () => {
                    expect(isValidPortRange('1-10-20')).toEqual(false);
                });

                it('Port -', () => {
                    expect(isValidPortRange(' - ')).toEqual(false);
                });

                it('100-50', () => {
                    expect(isValidPortRange('100-50')).toEqual(false);
                });
            });
        });
    });

    describe('validationUtilities', () => {
        describe('isBoolean', () => {
            let isBoolean = validation.validationUtilities.isBoolean;
            it('undefined', () => {
                let validationResult = isBoolean();
                expect(validationResult.result).toEqual(false);
            });

            it('null', () => {
                let validationResult = isBoolean(null);
                expect(validationResult.result).toEqual(false);
            });

            it('empty', () => {
                let validationResult = isBoolean('');
                expect(validationResult.result).toEqual(false);
            });

            it('whitespace', () => {
                let validationResult = isBoolean(' ');
                expect(validationResult.result).toEqual(false);
            });

            it('string', () => {
                let validationResult = isBoolean('true');
                expect(validationResult.result).toEqual(false);
            });

            it('valid', () => {
                let validationResult = isBoolean(true);
                expect(validationResult.result).toEqual(true);
            });
        });
    });

    describe('validationUtilities', () => {
        describe('isBoolean', () => {
            let isBoolean = validation.validationUtilities.isBoolean;
            it('undefined', () => {
                let validationResult = isBoolean();
                expect(validationResult.result).toEqual(false);
            });

            it('null', () => {
                let validationResult = isBoolean(null);
                expect(validationResult.result).toEqual(false);
            });

            it('empty', () => {
                let validationResult = isBoolean('');
                expect(validationResult.result).toEqual(false);
            });

            it('whitespace', () => {
                let validationResult = isBoolean(' ');
                expect(validationResult.result).toEqual(false);
            });

            it('string', () => {
                let validationResult = isBoolean('true');
                expect(validationResult.result).toEqual(false);
            });

            it('valid', () => {
                let validationResult = isBoolean(true);
                expect(validationResult.result).toEqual(true);
            });
        });
    });
});