describe('availabilitySetSettings:', () => {
    let rewire = require('rewire');
    let availabilitySetSettings = require('../core/availabilitySetSettings.js');
    let _ = require('../lodashMixins.js');

    describe('merge:', () => {

        it("validate valid defaults are applied.", () => {
            let settings = {};

            let mergedValue = availabilitySetSettings.mergeWithDefaults(settings);
            expect(_.toLower(mergedValue.useExistingAvailabilitySet)).toBe("no");
            expect(mergedValue.platformFaultDomainCount).toBe(3);
            expect(mergedValue.platformUpdateDomainCount).toBe(5);
            expect(mergedValue.name).toBe("default-as");
        });
        it("validate defaults do not override settings.", () => {
            let settings = {
                "useExistingAvailabilitySet": "yes",
                "platformFaultDomainCount": 10,
                "platformUpdateDomainCount": 11,
                "name": "test-as"
            };

            let mergedValue = availabilitySetSettings.mergeWithDefaults(settings);
            expect(_.toLower(mergedValue.useExistingAvailabilitySet)).toBe("yes");
            expect(mergedValue.platformFaultDomainCount).toBe(10);
            expect(mergedValue.platformUpdateDomainCount).toBe(11);
            expect(mergedValue.name).toBe("test-as");
        });
        it("validate additional properties in settings are not removed.", () => {
            let settings = {
                "name1": "test-as"
            };

            let mergedValue = availabilitySetSettings.mergeWithDefaults(settings);
            expect(mergedValue.hasOwnProperty("name1")).toBeTruthy();
            expect(mergedValue.name1).toBe("test-as");
        });
        it("validate missing properties in settings are picked up from defaults.", () => {
            let settings = {
                "useExistingAvailabilitySet": "yes",
                "platformFaultDomainCount": 10,
                "platformUpdateDomainCount": 11
            };

            let mergedValue = availabilitySetSettings.mergeWithDefaults(settings);
            expect(mergedValue.hasOwnProperty("name")).toBeTruthy();
            expect(mergedValue.name).toBe("default-as");
        });
    });
    describe('validations:', () => {
        describe('useExistingAvailabilitySet:', () => {
            it("validate mixed case.", () => {
                let validations = availabilitySetSettings.__get__("availabilitySetValidations");
                let settings = {
                    "useExistingAvailabilitySet": "yes",
                    "platformFaultDomainCount": 10,
                    "platformUpdateDomainCount": 11,
                    "name": "test-as"
                };
                let value = "yEs";
                let result = [];
                let mergedValue = validations.useExistingAvailabilitySet([], "", value, )
                
                expect(_.toLower(mergedValue.useExistingAvailabilitySet)).toBe("no");
                expect(mergedValue.platformFaultDomainCount).toBe(3);
                expect(mergedValue.platformUpdateDomainCount).toBe(5);
                expect(mergedValue.name).toBe("default-as");
            });
        });
    });
});