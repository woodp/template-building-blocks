describe('extensionSettings:', () => {
    let rewire = require('rewire');
    let extensionSettings = rewire('../core/virtualMachineExtensionsSettings.js');
    let _ = require('lodash');
    let v = require('../core/validation.js');

    describe('merge:', () => {
        it('validate merge is nop.', () => {
            let settings = [
                {
                    vms: [
                        'test-vm1'
                    ],
                    extensions: [
                        {
                            publisher: 'Microsoft.Compute',
                            type: 'CustomScriptExtension',
                            typeHandlerVersion: '1.8',
                            autoUpgradeMinorVersion: true,
                            settings: {
                                fileUris: [
                                    'https://[TEST-SA].blob.core.windows.net/extensions/test.ps1'
                                ],
                                commandToExecute: 'powershell -ExecutionPolicy Unrestricted -File ./test.ps1'
                            },
                            protectedSettings: {}
                        }
                    ]
                }
            ];

            let mergedValue = extensionSettings.mergeWithDefaults(settings);
            expect(mergedValue[0].vms[0]).toEqual('test-vm1');
            expect(mergedValue[0].extensions[0].hasOwnProperty('name')).toEqual(false);
            expect(mergedValue[0].extensions[0].autoUpgradeMinorVersion).toEqual(true);
        });
    });
    describe('validations:', () => {
        let settings = [
            {
                vms: [
                    'test-vm1'
                ],
                extensions: [
                    {
                        name: 'testextension',
                        publisher: 'Microsoft.Compute',
                        type: 'CustomScriptExtension',
                        typeHandlerVersion: '1.8',
                        autoUpgradeMinorVersion: true,
                        settings: {
                            fileUris: [
                                'https://[TEST-SA].blob.core.windows.net/extensions/test.ps1'
                            ],
                            commandToExecute: 'powershell -ExecutionPolicy Unrestricted -File ./test.ps1'
                        },
                        protectedSettings: {}
                    }
                ]
            }
        ];
        describe('vms:', () => {
            let validation = extensionSettings.__get__('vmExtensionValidations').vms;
            it('validates value has to an array.', () => {
                let result = validation({}, settings);
                expect(result.result).toEqual(false);

                result = validation('test', settings);
                expect(result.result).toEqual(false);

                result = validation(['test-vm1'], settings);
                expect(result.result).toEqual(true);
            });
            it('validates value cannt be empty array.', () => {
                let result = validation([], settings);
                expect(result.result).toEqual(false);
            });
            it('validates vms is a mandatory property.', () => {
                let result = validation(null, settings);
                expect(result.result).toEqual(false);
            });
        });
        describe('extensions:', () => {
            let validation = extensionSettings.__get__('vmExtensionValidations').extensions;
            it('validates value has to an array.', () => {
                let result = validation({}, settings);
                expect(result.result).toEqual(false);

                result = validation('test', settings);
                expect(result.result).toEqual(false);

                let errors = v.validate({
                    settings: settings[0].extensions,
                    validations: validation
                });
                expect(errors.length).toEqual(0);
            });
            it('validates value cannt be empty array.', () => {
                let result = validation([], settings);
                expect(result.result).toEqual(false);
            });
            it('validates extensions is a mandatory property.', () => {
                let result = validation(null, settings);
                expect(result.result).toEqual(false);
            });
            it('validates extension.name cannot be null or empty.', () => {
                let updatedSettings = _.cloneDeep(settings[0].extensions);
                updatedSettings[0].name = '';
                let errors = v.validate({
                    settings: updatedSettings,
                    validations: validation
                });
                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('[0].name');
            });
            it('validates extension.publisher cannot be null or empty.', () => {
                let updatedSettings = _.cloneDeep(settings[0].extensions);
                updatedSettings[0].publisher = null;
                let errors = v.validate({
                    settings: updatedSettings,
                    validations: validation
                });
                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('[0].publisher');
            });
            it('validates extension.type cannot be null or empty.', () => {
                let updatedSettings = _.cloneDeep(settings[0].extensions);
                updatedSettings[0].type = '';
                let errors = v.validate({
                    settings: updatedSettings,
                    validations: validation
                });
                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('[0].type');
            });
            it('validates extension.typeHandlerVersion cannot be null or empty.', () => {
                let updatedSettings = _.cloneDeep(settings[0].extensions);
                updatedSettings[0].typeHandlerVersion = '';
                let errors = v.validate({
                    settings: updatedSettings,
                    validations: validation
                });
                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('[0].typeHandlerVersion');
            });
            it('validates extension.autoUpgradeMinorVersion cannot be null or empty.', () => {
                let updatedSettings = _.cloneDeep(settings[0].extensions);
                updatedSettings[0].autoUpgradeMinorVersion = null;
                let errors = v.validate({
                    settings: updatedSettings,
                    validations: validation
                });
                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('[0].autoUpgradeMinorVersion');
            });
            it('validates extension.settings must be a valid json object (typeof "object").', () => {
                let updatedSettings = _.cloneDeep(settings[0].extensions);
                updatedSettings[0].settings = null;
                let errors = v.validate({
                    settings: updatedSettings,
                    validations: validation
                });
                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('[0].settings');

                updatedSettings[0].settings = 'test';
                errors = v.validate({
                    settings: updatedSettings,
                    validations: validation
                });
                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('[0].settings');

                updatedSettings[0].settings = [];
                errors = v.validate({
                    settings: updatedSettings,
                    validations: validation
                });
                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('[0].settings');

                updatedSettings[0].settings = {};
                errors = v.validate({
                    settings: updatedSettings,
                    validations: validation
                });
                expect(errors.length).toEqual(0);
            });
            it('validates extension.protectedSettings must be a valid json object (typeof "object").', () => {
                let updatedSettings = _.cloneDeep(settings[0].extensions);
                updatedSettings[0].protectedSettings = null;
                let errors = v.validate({
                    settings: updatedSettings,
                    validations: validation
                });
                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('[0].protectedSettings');

                updatedSettings[0].protectedSettings = 'test';
                errors = v.validate({
                    settings: updatedSettings,
                    validations: validation
                });
                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('[0].protectedSettings');

                updatedSettings[0].protectedSettings = [];
                errors = v.validate({
                    settings: updatedSettings,
                    validations: validation
                });
                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('[0].protectedSettings');

                updatedSettings[0].protectedSettings = {};
                errors = v.validate({
                    settings: updatedSettings,
                    validations: validation
                });
                expect(errors.length).toEqual(0);
            });
        });
    });
});