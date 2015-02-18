
var tools = require('./tools'),
    debug = require('debug')('crud-mongoose:findAll'),
    specials = [ 'limit', 'skip', 'page', 'perPage', 'sortBy', 'fields' ];

module.exports = exports = findAll;

function findAll(Model, projection) {
  var stream = false;

  findAll.stream = function() {
    stream = true;
    return findAll;
  }

  return findAll;

  function findAll(data, query, callback) {
    var keys = {},
        self = this,
        cursor, sort, sort_split, i;

    debug('original query - %j', query);

    // gather special keys
    for (i = 0; i < specials.length; i++) {
      if (query.hasOwnProperty(specials[i])) {
        if (specials[i] !== 'sortBy' && specials[i] !== 'fields')
          keys[specials[i]] = parseInt(query[specials[i]]);
        else keys[specials[i]] = query[specials[i]];
        delete query[specials[i]];
      }
    }

    debug('special query params %j', keys);
    debug('going to find %j', query);

    cursor = Model.find(query);

    // modifying cursor for provided keys
    if (keys.hasOwnProperty('page')) {
      keys.skip = keys.skip || 0;
      keys.perPage = keys.perPage;
      keys.skip += keys.page * keys.perPage;
      keys.limit = Math.min(keys.limit || Infinity, keys.perPage);
      debug('page - %s\tperPage - %s', keys.page, keys.perPage);
    }

    if (keys.hasOwnProperty('limit')) {
      debug('limiting to %d records', keys.limit);
      cursor.limit(keys.limit);
    }

    if (keys.hasOwnProperty('skip')) {
      debug('skipping %d records', keys.skip);
      cursor.skip(keys.skip);
    }

    if (keys.hasOwnProperty('sortBy')) {
      sort = {};
      sort_split = keys.sortBy.split(',');
      for (i = 0; i < sort_split.length; i++) {
        sort[sort_split[i].split(':')[0]] =
          sort_split[i].split(':')[1] || 'asc';
      }
      debug('sorting: %j', sort);
      cursor.sort(sort);
    }

    cursor.select(tools.select(projection, keys.fields));

    if (stream) {
      i = 0;
      self.response.set('Content-Type', 'application/json');
      cursor.lean().stream()
            .on('data', function(doc) {
              var d = (i++) ? ',' : '{ "error" : null, "data": [';
              self.response.write(d + JSON.stringify(doc));
            })
            .on('error', function(e) {
              callback(e || 'error in stream');
            })
            .on('close', function() {
              if (!i) self.response.write('{ "error": null, "data": [');
              self.response.write(']}');
              self.response.end();
              self.close();
            });
    } else cursor.lean().exec(callback);
  }
}

