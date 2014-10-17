
var tools = require('./tools'),
    debug = require('debug')('crud-mongoose:removeOne');

module.exports = exports = removeOne;

function removeOne(Model) {
  return function(data, query, callback) {
    debug('going to remove - %j', query);
    Model.findOneAndRemove(query).lean().exec(callback);
  }
}


