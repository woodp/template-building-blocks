//const StringCannotBeNullUndefinedEmptyOrOnlyWhitespace = 'Field cannot be null, undefined, empty, or only whitespace';

//export { StringCannotBeNullUndefinedEmptyOrOnlyWhitespace };
//exports.StringCannotBeNullUndefinedEmptyOrOnlyWhitespace = StringCannotBeNullUndefinedEmptyOrOnlyWhitespace;
exports.StringCannotBeNullUndefinedEmptyOrOnlyWhitespace = 'Field cannot be null, undefined, empty, or only whitespace';
exports.ValueCannotBeNull = 'Value cannot be null or undefined';
exports.InvalidCidr = 'CIDR is invalid';
exports.InvalidIpAddress = 'IP Address is invalid';
exports.routeTable = {
    routes: {
        NextHopIpAddressCannotBePresent: 'nextHopIpAddress cannot be present for specified nextHopType',
        NextHopIpAddressMustBePresent: 'nextHopIpAddress must be present for nextHopType=VirtualAppliance',
        InvalidNextHopType: 'nextHopType is not valid'
    }
};