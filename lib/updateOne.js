
var tools = require('./tools'),
    debug = require('debug')('crud-mongoose:updateOne');

module.exports = exports = updateOne;

function updateOne(Model, options) {
  options = tools.merge({ /* defaults */ }, options);
  return function(data, query, callback) {
    debug('going to update - \n    query -> %j \n    data -> %j', query, data);

    if ('__v' in data) delete data.__v;

    if (options.findOneAndUpdate) {
      Model.findOneAndUpdate(query, data, { 'new': true })
           .lean().exec(callback);
    } else {
      Model.findOne(query, function(e, d) {
        if (e || !(d && d.set)) return callback(e || 'no value found');
        d.set(data);
        d.save(function(e, d) {
          callback(e, d && d.toObject && d.toObject());
        });
      });
    }
  }
}

