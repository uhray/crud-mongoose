
var tools = require('./tools'),
    debug = require('debug')('crud-mongoose:updateOne');

module.exports = exports = updateOne;

function updateOne(Model) {
  return function(data, query, callback) {
    debug('going to update - \n    query -> %j \n    data -> %j', query, data);
    Model.findOneAndUpdate(query, data).lean().exec(callback);
  }
}

