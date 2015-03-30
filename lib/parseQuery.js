
var tools = require('./tools'),
    debug = require('debug')('crud-mongoose:parseQuery');

module.exports = exports = parseQuery;

function parseQuery() {
  var removes = [],
      required = [],
      defaults = {},
      overrides = {},
      maxes = {};

  parseQueryFn.removes = function(p) {
    for (var i = 0; i < arguments.length; i++) removes.push(arguments[i]);
    return parseQueryFn;
  }

  parseQueryFn.required = function(p) {
    for (var i = 0; i < arguments.length; i++) required.push(arguments[i]);
    return parseQueryFn;
  }

  parseQueryFn.defaults = function(defs) {
    tools.merge(defaults, defs);
    return parseQueryFn;
  }

  parseQueryFn.overrides = function(os) {
    tools.merge(overrides, os);
    return parseQueryFn;
  }

  parseQueryFn.maxes = function(m) {
    tools.merge(maxes, m);
    return parseQueryFn;
  }

  return parseQueryFn;

  function parseQueryFn(data, query, callback) {
    var i;

    debug('parsing query:\n    query -> %j ' +
          '\n    remove-> %j' +
          '\n    require-> %j' +
          '\n    default-> %j' +
          '\n    override-> %j' +
          '\n    maxes-> %j',
          query, removes, required, defaults, overrides, maxes);

    // check required fields
    for (i = 0; i < required.length; i++) {
      if (!query.hasOwnProperty(required[i]) ||
          query[required[i]] == '') {
        return callback('required query field: ' + required[i]);
      }
    }

    // remove specified fields
    for (i = 0; i < removes.length; i++) {
      if (query.hasOwnProperty(removes[i])) {
        debug('removing %s', removes[i]);
        delete query[removes[i]];
      }
    }

    // set defaults
    tools.mergeDefaults(query, defaults);

    // ensure max
    for (i in maxes) {
      if (query.hasOwnProperty(i)) {
        query[i] = Math.min(parseFloat(query[i]), maxes[i]);
      }
    }

    // override fields
    tools.mergeOverrides(query, overrides);

    // done
    debug('parsed query - %j', query);
    callback(null, data, query);
  }
}
