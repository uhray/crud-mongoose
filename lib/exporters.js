var tools = require('./tools'),
    debug = require('debug')('crud-mongoose:exporters'),
    xlsx = require('xlsx-stream');

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

            res.write(arr.join(',') + '\n');
          })
          .on('error', function(e) {
            cb(e || 'error in stream');
          })
          .on('close', function() {
            res.end();
            cb();
          });
  }
};

exports.xlsx = function(k) {
  return function(res, cursor, cb) {
    var keys = k,
        init = false,
        x = xlsx(),
        type = 'application/vnd.openxmlformats-officedocument' +
               '.spreadsheetml.sheet';

    res.set('Content-Type', type);
    x.pipe(res);

    cursor.stream()
          .on('data', function(doc) {
            var arr = [], i, d;

            if (!keys || !init) {
              keys = keys || Object.keys(JSON.parse(JSON.stringify(doc)));
              x.write(keys);
            }

            init = true;
            doc = tools.flattenObject(doc);

            for (i = 0; i < keys.length; i++) {
              d = doc[keys[i]];
              d = d === undefined ? "" : String(d);
              arr.push(d);
            }

            x.write(arr);
          })
          .on('error', function(e) {
            cb(e || 'error in stream');
            x.end()
          })
          .on('close', function() {
            x.end()
            cb();
          });
  }
};
