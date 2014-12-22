
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
      pass, split, i, j;

  projection = projection || [];

  // split between included and excluded fields
  for (i = 0; i < projection.length; i++) {
    if (projection[i][0] == '-') {
      outs.push(projection[i].replace(/^-/, ''));
    } else r += projection[i] + ' ';
  }

  // no extra fields
  if (!fields) {
    debug('selecting %s', r || projection);
    return r || projection.join(' ');
  }

  debug('outs: ', outs);
  debug('fields: ', fields);
  fields = fields.split(',');
  r = '';

  // include only allowed fields
  for (i = 0; i < fields.length; i++) {
    split = fields[i].split('.');
    pass = true;
    for (j = 0; j < split.length; j++) {
      if (~outs.indexOf(split.slice(0, j + 1).join('.'))) {
        debug('disallowing querying: %s', fields[i]);
        pass = false;
        break;
      }
    }
    if (pass) r += fields[i] + ' ';
  }

  // prevent something where you disallow 'user.name' and they try to select
  // 'user'. This would give them access to the 'name'. The only want to
  // prevent this is to disallow the projection here.
  if (r.length) {
    for (i = 0; i < outs.length; i++) {
      split = outs[i].split('.');
      pass = true;
      for (j = 0; j < split.length; j++) {
        if (~r.indexOf(split.slice(0, j + 1).join('.'))) {
          debug('disallowing projection because disallowed split: %s', split);
          pass = false;
          break;
        }
      }
      if (!pass) {
        r = [];
        break;
      }
    }
  }

  // remove disallowed fields if none were allowed
  if (!r.length) r = '-' + outs.join(' -');

  debug('selecting', r);

  return r;
}

tools.flattenObject = function(ob, removes, prev) {
  var toReturn = {},
      removes = removes || [],
      prev = prev || '',
      i, flatObject, x;

  debug('Flattening:\n  Object-> %j\n  Removing-> %j\n Prev-> %j',
        ob, removes, prev);

  for (i in ob) {
    if (!ob.hasOwnProperty(i)) continue;
    if (removes.length && ~removes.indexOf(prev + i)) {
      debug('  Removing %s', prev + i);
      continue;
    }
    if (/\./.test(i)) {
      debug('  "%s": the should not be flat already.', i);
      continue;
    }
    if ((typeof ob[i]) == 'object' && !(ob[i] instanceof Array)) {
      flatObject = tools.flattenObject(ob[i], removes, prev + i + '.');
      for (x in flatObject) {
        if (!flatObject.hasOwnProperty(x)) continue;
        toReturn[i + '.' + x] = flatObject[x];
      }
    } else {
      toReturn[i] = ob[i];
    }
  }

  return toReturn;
}
