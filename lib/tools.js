
var debug = require('debug')('crud-mongoose:tools'),
    tools = module.exports = {};

tools.argArray = function(args) {
  return Array.prototype.slice.call(args, 0);
}

tools.merge = function(a, b) {
  a = a || {};
  b = b || {};
  for (var k in b) a[k] = b[k];
  return a;
}

tools.mergeOverrides = function(obj, overrides) {
  var i;

  obj = obj || {};
  overrides = overrides || {};

  for (i in overrides) {
    obj[i] = overrides[i];
    if ('function' == typeof obj[i]) obj[i] = obj[i]();
  }
}

tools.mergeDefaults = function(obj, defaults) {
  var i;

  obj = obj || {};
  defaults = defaults || {};

  for (i in defaults) {
    if (!obj.hasOwnProperty(i)) {
      obj[i] = defaults[i];
      if ('function' == typeof obj[i]) obj[i] = obj[i]();
    }
  }
}

tools.select = function(projection, fields) {
  var outs = [],
      ins = [],
      r = '',
      i;

  // split between included and excluded fields
  for (i = 0; i < projection.length; i++) {
    if (projection[i][0] == '-') {
      outs.push(projection[i].replace(/^-/, ''));
    } else r += projection[i] + ' ';
  }

  // no extra fields
  if (!fields) {
    debug('selecting %s', r);
    return r;
  }

  debug('outs: ', outs);
  debug('fields: ', fields);
  fields = fields.split(',');
  r = '';

  // include only allowed fields
  for (i = 0; i < fields.length; i++) {
    if (!~outs.indexOf(fields[i])) r += fields[i] + ' ';
  }

  // remove disallowed fields if none were allowed
  if (!r.length) r = '-' + outs.join(' -');

  debug('selecting', r);

  return r;
}
