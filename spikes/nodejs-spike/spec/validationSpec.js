describe('validation', () => {
    let validation = require('../core/validation.js');
    let validationMessages = require('../core/validationMessages.js');

    // let subscriptionId = '689B3D5F-F473-405A-B3EB-7F59D418C682';
    // let resourceGroupName = 'test-rg';
    // let virtualNetworksResourceType = 'Microsoft.Network/virtualNetworks';
    // let subnetsResourceType = `${virtualNetworksResourceType}/subnets`;
    // let resourceName = 'my-virtual-network';
    // let subresourceName = 'my-subnet';

    describe('networking', () => {
        describe('isValidPortRange', () => {
            let isValidPortRange = require('../core/validation.js').utilities.networking.isValidPortRange;
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
        });
        // it('null subscriptionId', () => {
        //     expect(() => {
        //         resources.resourceId(null, null, null, null, null);
        //     }).toThrow(`subscriptionId: ${validationMessages.StringCannotBeNullUndefinedEmptyOrOnlyWhitespace}`);
        // });

        // it('empty subscriptionId', () => {
        //     expect(() => {
        //         resources.resourceId('', null, null, null, null);
        //     }).toThrow(`subscriptionId: ${validationMessages.StringCannotBeNullUndefinedEmptyOrOnlyWhitespace}`);
        // });

        // it('whitespace subscriptionId', () => {
        //     expect(() => {
        //         resources.resourceId(' ', null, null, null, null);
        //     }).toThrow(`subscriptionId: ${validationMessages.StringCannotBeNullUndefinedEmptyOrOnlyWhitespace}`);
        // });

        // it('invalid subscriptionId', () => {
        //     expect(() => {
        //         resources.resourceId("not-a-valid-guid", null, null, null, null);
        //     }).toThrow(`subscriptionId: ${validationMessages.StringIsNotAValidGuid}`);
        // });
    });

    // describe('resourceGroupName validations', () => {
    //     it('null resourceGroupName', () => {
    //         expect(() => {
    //             resources.resourceId(subscriptionId, null, null, null, null);
    //         }).toThrow(`resourceGroupName: ${validationMessages.StringCannotBeNullUndefinedEmptyOrOnlyWhitespace}`);
    //     });

    //     it('empty resourceGroupName', () => {
    //         expect(() => {
    //             resources.resourceId(subscriptionId, '', null, null, null);
    //         }).toThrow(`resourceGroupName: ${validationMessages.StringCannotBeNullUndefinedEmptyOrOnlyWhitespace}`);
    //     });

    //     it('whitespace resourceGroupName', () => {
    //         expect(() => {
    //             resources.resourceId(subscriptionId, ' ', null, null, null);
    //         }).toThrow(`resourceGroupName: ${validationMessages.StringCannotBeNullUndefinedEmptyOrOnlyWhitespace}`);
    //     });
    // });

    // describe('resourceType validations', () => {
    //     it('null resourceType', () => {
    //         expect(() => {
    //             resources.resourceId(subscriptionId, resourceGroupName, null, null, null);
    //         }).toThrow(`resourceType: ${validationMessages.StringCannotBeNullUndefinedEmptyOrOnlyWhitespace}`);
    //     });

    //     it('empty resourceType', () => {
    //         expect(() => {
    //             resources.resourceId(subscriptionId, resourceGroupName, '', null, null);
    //         }).toThrow(`resourceType: ${validationMessages.StringCannotBeNullUndefinedEmptyOrOnlyWhitespace}`);
    //     });

    //     it('whitespace resourceType', () => {
    //         expect(() => {
    //             resources.resourceId(subscriptionId, resourceGroupName, ' ', null, null);
    //         }).toThrow(`resourceType: ${validationMessages.StringCannotBeNullUndefinedEmptyOrOnlyWhitespace}`);
    //     });

    //     it('resourceType parts less than 2', () => {
    //         expect(() => {
    //             resources.resourceId(subscriptionId, resourceGroupName, 'Microsoft.Network', null, null);
    //         }).toThrow(`resourceType: Invalid length 1`);
    //     });

    //     it('resourceType parts greater than 3', () => {
    //         expect(() => {
    //             resources.resourceId(subscriptionId, resourceGroupName, 'Microsoft.Network/virtualNetworks/subnets/extra', null, null);
    //         }).toThrow(`resourceType: Invalid length 4`);
    //     });
    // });

    // describe('resourceName validations', () => {
    //     it('null resourceName', () => {
    //         expect(() => {
    //             resources.resourceId(subscriptionId, resourceGroupName, virtualNetworksResourceType, null, null);
    //         }).toThrow(`resourceName: ${validationMessages.StringCannotBeNullUndefinedEmptyOrOnlyWhitespace}`);
    //     });

    //     it('empty resourceName', () => {
    //         expect(() => {
    //             resources.resourceId(subscriptionId, resourceGroupName, virtualNetworksResourceType, '', null);
    //         }).toThrow(`resourceName: ${validationMessages.StringCannotBeNullUndefinedEmptyOrOnlyWhitespace}`);
    //     });

    //     it('whitespace resourceName', () => {
    //         expect(() => {
    //             resources.resourceId(subscriptionId, resourceGroupName, virtualNetworksResourceType, ' ', null);
    //         }).toThrow(`resourceName: ${validationMessages.StringCannotBeNullUndefinedEmptyOrOnlyWhitespace}`);
    //     });
    // });

    // describe('subresourceName validations', () => {
    //     it('null subresourceName', () => {
    //         expect(() => {
    //             resources.resourceId(subscriptionId, resourceGroupName, subnetsResourceType, resourceName, null);
    //         }).toThrow(`subresourceName: ${validationMessages.StringCannotBeNullUndefinedEmptyOrOnlyWhitespace}`);
    //     });

    //     it('empty subresourceName', () => {
    //         expect(() => {
    //             resources.resourceId(subscriptionId, resourceGroupName, subnetsResourceType, resourceName, '');
    //         }).toThrow(`subresourceName: ${validationMessages.StringCannotBeNullUndefinedEmptyOrOnlyWhitespace}`);
    //     });

    //     it('whitespace subresourceName', () => {
    //         expect(() => {
    //             resources.resourceId(subscriptionId, resourceGroupName, subnetsResourceType, resourceName, ' ');
    //         }).toThrow(`subresourceName: ${validationMessages.StringCannotBeNullUndefinedEmptyOrOnlyWhitespace}`);
    //     });

    //     it('invalid resource type for subresourceName', () => {
    //         expect(() => {
    //             resources.resourceId(subscriptionId, resourceGroupName, virtualNetworksResourceType, resourceName, subresourceName);
    //         }).toThrow(`subresourceName: ${validationMessages.resources.SubresourceNameShouldNotBeSpecifiedForTopLevelResourceType}`);
    //     });
    // });

    // describe('valid resourceId parameters', () => {
    //     it('valid resource', () => {
    //         let returnValue = resources.resourceId(subscriptionId, resourceGroupName, virtualNetworksResourceType, resourceName);
    //         expect(returnValue).toBe(`/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.Network/virtualNetworks/${resourceName}`);
    //     });

    //     it('valid subresource', () => {
    //         let returnValue = resources.resourceId(subscriptionId, resourceGroupName, subnetsResourceType, resourceName,subresourceName);
    //         expect(returnValue).toBe(`/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.Network/virtualNetworks/${resourceName}/subnets/${subresourceName}`);
    //     });
    // });
});