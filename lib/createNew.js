
var tools = require('./tools'),
    debug = require('debug')('crud-mongoose:createNew');

module.exports = exports = createNew;

function createNew(Model) {
  return function(data, query, callback) {
    debug('creating new %j', data);
    new Model(data).save(function(e, d) {
      if (e || !d) return callback(e || 'failed to save');
      d = d.toObject ? d.toObject() : d;
      debug('created new %j', d);
      callback(null, d);
    });
  }
}


