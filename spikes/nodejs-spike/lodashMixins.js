var _ = require('lodash').runInContext();

// Add some utility functions to lodash
_.mixin({
  isNullOrWhitespace: function(string) {
    string = _.toString(string);
    return !string || !string.trim();
  },
  paths: function(obj, parentKey) {
    var result;
    if (_.isArray(obj)) {
      var idx = 0;
      result = _.flatMap(obj, function (obj) {
        return _.paths(obj, (parentKey || '') + '[' + idx++ + ']');
      });
    }
    else if (_.isPlainObject(obj)) {
      result = _.flatMap(_.keys(obj), function (key) {
        return _.map(_.paths(obj[key], key), function (subkey) {
          return (parentKey ? parentKey + '.' : '') + subkey;
        });
      });
    }
    else {
      result = [];
    }
    return _.concat(result, parentKey || []);
}
});

module.exports = _;