
var tools = require('./tools'),
    debug = require('debug')('crud-mongoose:updateOne');

module.exports = exports = updateOne;

function updateOne(Model, options) {
  options = tools.merge({ /* defaults */ }, options);
  return function(data, query, callback) {
    debug('going to update - \n    query -> %j \n    data -> %j', query, data);

    if (options.findOneAndUpdate) {
      Model.findOneAndUpdate(query, data).lean().exec(callback);
    } else {
      Model.findOne(query, function(e, d) {
        if (e) return callback(e);
        tools.merge(d, data);
        d.save(function(e, d) {
          callback(e, d && d.toObject && d.toObject());
        });
      });
    }
  }
}

