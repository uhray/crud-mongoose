
var tools = require('./tools'),
    debug = require('debug')('crud-mongoose:filterQuery');

module.exports = exports = filterQuery;

function filterQuery() {
  var fields = tools.argArray(arguments);

  return function(data, query, callback) {
    var i;

    debug('filtering query - \n    query -> %j \n    fields -> %j',
          query, fields);

    for (i = 0; i < fields.length; i++) {
      if (query.hasOwnProperty(fields[i])) {
        debug('removing %s', fields[i]);
        delete query[fields[i]];
      }
    }

    // done
    callback(null, data, query);
  }
}

