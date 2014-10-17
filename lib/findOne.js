
var tools = require('./tools'),
    debug = require('debug')('crud-mongoose:findOne');

module.exports = exports = findOne;

function findOne(Model, projection) {
  return function(data, query, callback) {
    var cursor, qfields, fields;

    if (query.hasOwnProperty('fields')) {
      qfields = query.fields.split(',');
      delete query.fields;
    }

    debug('going to find %j', query);
    cursor = Model.findOne(query);

    if (qfields) {
      fields = [];
      for (i = 0; i < qfields.length; i++) {
        if (!projection || ~projection.indexOf(qfields[i]))
          fields.push(qfields[i]);
      }
      if (fields.length == 0) fields = projection;
      debug('selecting fields %s', fields);
      cursor.select(fields.join(' '));
    } else if (projection) {
      debug('selecting fields %s', projection);
      cursor.select(projection.join(' '));
    }

    cursor.lean().exec(callback);
  }
}
