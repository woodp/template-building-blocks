describe('routeTableSettings', () => {
    let rewire = require('rewire');
    let resources = require('../templates/resources.js');
    let routeTableSettings = rewire('../templates/routeTableSettings.js');
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

    it('test valid specs', () => {
        let returnValue = transform(validSettings);
        expect(returnValue.subscriptionId).toBe(validSettings.subscriptionId);
        expect(returnValue.resourceGroupName).toBe(validSettings.resourceGroupName);
        expect(returnValue.name).toBe(validSettings.name);
        expect(returnValue.id).toBe(resources.resourceId(validSettings.subscriptionId, validSettings.resourceGroupName, 'Microsoft.Network/routeTables', validSettings.name));
    });
});