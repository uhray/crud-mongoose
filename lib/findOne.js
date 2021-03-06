
var tools = require('./tools'),
    debug = require('debug')('crud-mongoose:findOne');

module.exports = exports = findOne;

function findOne(Model, projection) {

  findOne.Model = Model;
  findOne.projection = projection;

  return findOne;

  function findOne(data, query, callback) {
    var cursor, fields;

    if (query.hasOwnProperty('fields')) {
      fields = query.fields;
      delete query.fields;
    }

    debug('going to find %j', query);
    cursor = Model.findOne(query);

    cursor.select(tools.select(projection, fields));

    cursor.lean().exec(callback);
  }
}
