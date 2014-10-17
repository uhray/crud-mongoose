
var tools = module.exports = {};

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
