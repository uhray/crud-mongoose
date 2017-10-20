
var tools = require('./tools'),
    debug = require('debug')('crud-mongoose:findAggregation'),
    _ = require('lodash'),
    specials = [ 'limit', 'skip', 'page', 'perPage', 'sortBy', 'fields',
                 'export' ];

module.exports = exports = findAggregation;

function findAggregation(Model, projection) {
  var stream = false,
      additionalStages = [],
      sortPresets

  projection = projection || [];
  findAggregation.Model = Model;

  findAggregation.sortPresets = function(sp) {
    sortPresets = sp;
    return findAggregation;
  }

  findAggregation.stream = function() {
    stream = true;
    return findAggregation;
  }

  findAggregation.additionalStages = function(stages) {
    additionalStages = stages;
    return findAggregation;
  }

  return findAggregation;

  function convertType(Model, key, value) {
    var schema = Model && Model.schema && Model.schema.obj || {},
        type = _.get(schema, key),
        k;

    if (!type) { return value; }
    if ('type' in type) { type = type.type; }

    if (value.hasOwnProperty('$lt') ||
        value.hasOwnProperty('$gt') ||
        value.hasOwnProperty('$lte') ||
        value.hasOwnProperty('$gte')) {
       for (k in value) {
         value[k] = convertType(Model, key, value[k]);
       }
       return value;
    }

    if (type === Boolean) {
      return value === 'true';
    } else if (type === Number) {
      return parseFloat(value);
    } else if (type === Date) {
      return new Date(value);
    } else {
      return value;
    }
  }

  function defaultProjection(Model, fields) {
    var p = {},
        schema = Model && Model.schema && Model.schema.obj || {},
        outs = {},
        ins = {},
        k, i, hasIns;

    // split between included and excluded fields
    for (i = 0; i < projection.length; i++) {
      if (projection[i][0] == '-') {
        outs[projection[i].replace(/^-/, '')] = true;
      } else {
        ins[projection[i]] = true;
      }
    }

    if (fields) {
      fields = fields.split(',');
      ins = {};

      for (i = 0; i < fields.length; i++) {
        if (!outs[fields[i]]) { ins[fields[i]] = true; }
      }
    }

    hasIns = Object.keys(ins).length > 0;

    for (k in schema) {
      if (outs[k]) { continue; }
      if (hasIns && !ins[k]) { continue; }
      p[k] = '$' + k;
    }

    return p;
  }

  function findAggregation(data, query, callback) {
    var keys = {},
        self = this,
        pipeline = [],
        cursor, sort, sort_split, i, k,
        proj;

    debug('original query - %j', query);

    // gather special keys
    for (i = 0; i < specials.length; i++) {
      if (query.hasOwnProperty(specials[i])) {
        if (specials[i] !== 'sortBy' && specials[i] !== 'fields' &&
            specials[i] !== 'export')
          keys[specials[i]] = parseInt(query[specials[i]]);
        else keys[specials[i]] = query[specials[i]];
        delete query[specials[i]];
      }
    }

    debug('special query params %j', keys);
    debug('going to find %j', query);

    for (k in query) {
      query[k] = convertType(Model, k, query[k]);
    }

    pipeline.push({
      $match: query
    });

    if (keys.hasOwnProperty('page')) {
      keys.skip = keys.skip || 0;
      keys.perPage = keys.perPage;
      keys.skip += keys.page * keys.perPage;
      keys.limit = Math.min(keys.limit || Infinity, keys.perPage);
      debug('page - %s\tperPage - %s', keys.page, keys.perPage);
    }

    if (keys.hasOwnProperty('sortBy')) {
      sort = {};
      sort_split = keys.sortBy.split(',');
      for (i = 0; i < sort_split.length; i++) {
        k = sort_split[i].split(':')[0] ;
        sort[k] = sort_split[i].split(':')[1] || 'asc';
        if (sort[k] === 'desc') {
          sort[k] = -1
        } else {
          sort[k] = 1
        };
        if (sortPresets && sortPresets[k]) {
          proj = proj || defaultProjection(Model, keys.fields);
          proj[k] = sortPresets[k];
        }
      }
      debug('sorting: %j', sort);
      pipeline.push({ $sort: sort });
    }

    if (keys.fields) {
      proj = proj || defaultProjection(Model, keys.fields);
    }

    if (additionalStages) {
      for (i = 0; i < additionalStages.length; i++) {
        pipeline.push(additionalStages[i]);
      }
    }

    if (proj) {
      // Needs to be right after the $match query
      pipeline.splice(1, 0, { $project: proj });
    }

    if (keys.hasOwnProperty('skip')) {
      debug('skipping %d records', keys.skip);
      pipeline.push({ $skip: keys.skip });
    }

    if (keys.hasOwnProperty('limit')) {
      debug('limiting to %d records', keys.limit);
      pipeline.push({ $limit: keys.limit });
    }

    debug(pipeline);
    cursor = Model.aggregate(pipeline);

    if (stream) {
      i = 0;
      self.response.set('Content-Type', 'application/json');
      cursor.cursor().exec().stream()
            .on('data', function(doc) {
              var d = (i++) ? ',' : '{ "error" : null, "data": [';
              self.response.write(d + JSON.stringify(doc));
            })
            .on('error', function(e) {
              callback(e || 'error in stream');
            })
            .on('end', function() {
              if (!i) self.response.write('{ "error": null, "data": [');
              self.response.write(']}');
              self.response.end();
              self.close();
            });
    } else {
      cursor.exec(callback);
    }
  }
}
