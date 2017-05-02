describe('routeTableSettings', () => {
    let rewire = require('rewire');
    let resources = require('../core/resources.js');
    let routeTableSettings = rewire('../core/routeTableSettings.js');
    let transform = routeTableSettings.__get__("transform");
    let validSettings = {
        subscriptionId: '689B3D5F-F473-405A-B3EB-7F59D418C682',
        resourceGroupName: 'test-rg',
        name: 'my-route-table',
        virtualNetworks: [
            {
                name: 'my-virtual-network',
                subscriptionId: '689B3D5F-F473-405A-B3EB-7F59D418C682',
                resourceGroupName: 'test-rg',
                subnets: [
                    {
                        name: 'web'
                    }
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

    describe('isValidNextHopType', () => {
        let isValidNextHopType = routeTableSettings.__get__("isValidNextHopType");
        
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

    it('test valid specs', () => {
        let returnValue = transform(validSettings);
        expect(returnValue.subscriptionId).toBe(validSettings.subscriptionId);
        expect(returnValue.resourceGroupName).toBe(validSettings.resourceGroupName);
        expect(returnValue.name).toBe(validSettings.name);
        expect(returnValue.id).toBe(resources.resourceId(validSettings.subscriptionId, validSettings.resourceGroupName, 'Microsoft.Network/routeTables', validSettings.name));
    });
});