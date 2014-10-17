
var tools = require('./tools'),
    debug = require('debug')('crud-mongoose:removeAll');

module.exports = exports = removeAll;

function removeAll(Model) {
  return function(data, query, callback) {
    debug('going to remove - %j', query);
    Model.remove(query).lean().exec(callback);
  }
}

