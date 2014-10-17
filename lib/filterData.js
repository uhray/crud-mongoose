
var tools = require('./tools'),
    debug = require('debug')('crud-mongoose:filterData'),
    gets = require('gets');

module.exports = exports = filterData;

function filterData() {
  var fields = tools.argArray(arguments).map(function(d) {
        var sp = d.split('.'),
            last = sp.pop();
        return {
          get: gets.apply(this, sp),
          last: last,
          path: d
        }
      });

  return function(data, query, callback) {
    var i, f, d;

    debug('filtering data - \n    data -> %j \n    fields -> %j', data, fields);

    for (i = 0; i < fields.length; i++) {
      f = fields[i];
      d = f.get(data);
      if (d && d.hasOwnProperty(f.last)) {
        debug('removing %s', f.path);
        delete d[f.last];
      }
    }

    // done
    callback(null, data);
  }
}


