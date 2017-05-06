exports.StringCannotBeNullUndefinedEmptyOrOnlyWhitespace = 'Field cannot be null, undefined, empty, or only whitespace';
exports.StringIsNotAValidGuid = 'Value is not a valid GUID';
exports.ValueCannotBeNull = 'Value cannot be null or undefined';
exports.ArrayCannotBeEmpty = 'Array cannot be empty';
exports.InvalidCidr = 'CIDR is invalid';
exports.InvalidIpAddress = 'IP Address is invalid';
exports.resources = {
    SubresourceNameShouldNotBeSpecifiedForTopLevelResourceType: 'SubresourceName should not be specified for top-level resource type'
}
exports.routeTable = {
    routes: {
        NextHopIpAddressCannotBePresent: 'nextHopIpAddress cannot be present for specified nextHopType',
        NextHopIpAddressMustBePresent: 'nextHopIpAddress must be present for nextHopType=VirtualAppliance',
        InvalidNextHopType: 'nextHopType is not valid'
    }
};

exports.networkSecurityGroup = {
    securityRules: {
        InvalidProtocol: 'Specified protocol is not valid',
        InvalidPortRange: 'Specified port range is invalid',
        InvalidAddressPrefix: 'Specified address prefix is invalid',
        InvalidDirection: 'Specified direction is invalid',
        InvalidPriority: 'Specified priority is invalid',
        InvalidAccess: 'Specified access is invalid'
    }
}