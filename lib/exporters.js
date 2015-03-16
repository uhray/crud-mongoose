var tools = require('./tools'),
    debug = require('debug')('crud-mongoose:exporters');

module.exports = exports = {};

exports.csv = function(k) {
  return function(res, cursor, cb) {
    var keys = k,
        init = false;

    res.set('Content-Type', 'text/csv');

    cursor.stream()
          .on('data', function(doc) {
            var arr = [], i, d;

            if (!keys || !init) {
              keys = keys || Object.keys(JSON.parse(JSON.stringify(doc)));
              res.write(keys.map(function(d) {
                return JSON.stringify(String(d));
              }).join(',') + '\n');
            }

            init = true;

            doc = tools.flattenObject(doc);

            for (i = 0; i < keys.length; i++) {
              d = doc[keys[i]];
              d = d === undefined ? "" : String(d);
              arr.push(JSON.stringify(d));
            }

            res.write(arr.join(','));
          })
          .on('error', function(e) {
            cb(e || 'error in stream');
          })
          .on('close', function() {
            res.end();
            cb();
          });
  }
}
