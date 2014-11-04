
var tools = require('./tools'),
    debug = require('debug')('crud-mongoose:parseData'),
    gets = require('gets');

module.exports = exports = parseData;

function parseData() {
  var removes = [],
      defaults = {},
      overrides = {};

  parseDataFn.removes = function(p) {
    var i, sp, last;
    for (i = 0; i < arguments.length; i++) {
      sp = arguments[i].split('.');
      last = sp.pop();
      removes.push({
        get: gets.apply(this, sp),
        last: last,
        path: arguments[i]
      })
    }
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
    var i, f, d;

    data = tools.flattenObject(original);

    debug('parsing data:\n    data-> %j ' +
          '\n    flattened-> %j' +
          '\n    remove-> %j' +
          '\n    default-> %j' +
          '\n    override-> %j',
          original, data, removes, defaults, overrides);

    // remove fields
    for (i = 0; i < removes.length; i++) {
      f = removes[i];
      d = f.get(data);
      if (d && d.hasOwnProperty(f.last)) {
        debug('removing %s', f.path);
        delete d[f.last];
      }
    }

    // set defaults
    tools.mergeDefaults(data, defaults);

    // override fields
    tools.mergeOverrides(data, overrides);

    // done
    debug('parsed data - %j', data);
    callback(null, data);
  }
}
