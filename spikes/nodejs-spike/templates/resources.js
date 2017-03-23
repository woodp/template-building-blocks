let _ = require('../lodashMixins.js');
let validationMessages = require('./ValidationMessages.js');

function getObject(collection, parentKey, stack, callback) {
  if (_.isPlainObject(collection)) {
    // if ((parentKey === null) || (parentKey === "virtualNetworks") || (parentKey === "subnets")) {
    //   collection.subscriptionId = stack[stack.length - 1].subscriptionId;
    //   collection.resourceGroup = stack[stack.length - 1].resourceGroup;
    // }
    // See if we need to add the information
    if (callback(parentKey)) {
      collection.subscriptionId = stack[stack.length - 1].subscriptionId;
      collection.resourceGroupName = stack[stack.length - 1].resourceGroupName;
    }
  }
  return _.each(collection, (item, keyOrIndex) => {
    let hasPushed = false;
    if (_.isPlainObject(item)) {
      if ((item.hasOwnProperty('resourceGroupName')) || (item.hasOwnProperty('subscriptionId'))) {
        stack.push(_.merge({}, stack[stack.length - 1], {subscriptionId: item.subscriptionId, resourceGroup: item.resourceGroup}));
        hasPushed = true;
      }

      item = getObject(item, _.isNumber(keyOrIndex) ? parentKey : keyOrIndex, stack, callback);

      if (hasPushed) {
        stack.pop();
      }
    } else if (_.isArray(item)) {
      item = getObject(item, keyOrIndex, stack, callback);
    }
  });
}

exports.resourceId = function(subscriptionId, resourceGroupName, resourceType, resourceName, subresourceName) {
    if (_.isNullOrWhitespace(subscriptionId)) {
        throw `subscriptionId: ${validationMessages.StringCannotBeNullUndefinedEmptyOrOnlyWhitespace}`;
    }

    if (_.isNullOrWhitespace(resourceGroupName)) {
        throw `resourceGroupName: ${validationMessages.StringCannotBeNullUndefinedEmptyOrOnlyWhitespace}`;
    }

    if (_.isNullOrWhitespace(resourceType)) {
        throw `resourceType: ${validationMessages.StringCannotBeNullUndefinedEmptyOrOnlyWhitespace}`;
    }

    let resourceTypeParts = _.split(_.trimEnd(resourceType, '/'), '/');
    if ((resourceTypeParts.length < 2) || (resourceTypeParts.length > 3)) {
        throw `resourceType: Invalid length ${resourceTypeParts.length}`;
    }

    if ((resourceTypeParts.length === 2) && (_.isNullOrWhitespace(resourceName))) {
        throw `resourceName: ${validationMessages.StringCannotBeNullUndefinedEmptyOrOnlyWhitespace}`;
    }

    if ((resourceTypeParts.length === 3) && (_.isNullOrWhitespace(subresourceName))) {
        throw `subresourceName: ${validationMessages.StringCannotBeNullUndefinedEmptyOrOnlyWhitespace}`;
    }

    let resourceId = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/${resourceTypeParts[0]}/${resourceTypeParts[1]}/${resourceName}`;
    if (resourceTypeParts.length === 3) {
        resourceId = `${resourceId}/${resourceTypeParts[2]}/${subresourceName}`;
    }

    return resourceId;
};

exports.setupResources = function(settings, buildingBlockSettings, keyCallback) {
    let clone = _.cloneDeep(settings);
    return getObject(clone, null, [buildingBlockSettings], keyCallback);
};