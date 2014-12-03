
var tools = require('./tools'),
    debug = require('debug')('crud-mongoose:parseData'),
    gets = require('gets');

module.exports = exports = parseData;

function parseData() {
  var removes = [],
      defaults = {},
      overrides = {};

  parseDataFn.removes = function() {
    removes.push.apply(removes, arguments);
    return parseDataFn;
  }

  parseDataFn.defaults = function(defs) {
    tools.merge(defaults, defs);
    return parseDataFn;
  }

  parseDataFn.overrides = function(os) {
    tools.merge(overrides, os);
    return parseDataFn;
  }

  return parseDataFn.removes('_id');

  function parseDataFn(original, query, callback) {
    var i, f, d, data;

    data = tools.flattenObject(original, removes);

    debug('parsing data:\n    data-> %j ' +
          '\n    remove-> %j' +
          '\n    flattened/removed-> %j' +
          '\n    default-> %j' +
          '\n    override-> %j',
          original, removes, data, defaults, overrides);

    // set defaults
    tools.mergeDefaults(data, defaults);

    // override fields
    tools.mergeOverrides(data, overrides);

    // done
    debug('parsed data - %j', data);
    callback(null, data);
  }
}
