exports.StringCannotBeNullUndefinedEmptyOrOnlyWhitespace = 'Field cannot be null, undefined, empty, or only whitespace';
exports.StringIsNotAValidGuid = 'Value is not a valid GUID';
exports.ValueCannotBeNull = 'Value cannot be null or undefined';
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