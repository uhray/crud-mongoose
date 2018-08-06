
var tools = require('./tools'),
    debug = require('debug')('crud-mongoose:findAggregation'),
    _ = require('lodash'),
    specials = [ 'limit', 'skip', 'page', 'perPage', 'sortBy', 'fields',
                 'export' ],
    mongoose = require('mongoose');

module.exports = exports = findAggregation;

function findAggregation(Model, projection) {
  var stream = false,
      additionalStages = {
        start: [],
        preSort: [],
        end: []
      },
      initialStages = [],
      sortPresets,
      computedDefaultProjection;

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

  findAggregation.additionalStages = function(spot, stages) {
    if (!stages) {
      stages = spot;
      spot = 'end';
    }

    additionalStages[spot] = stages;
    return findAggregation;
  }

  return findAggregation;

  function convertType(Model, key, value) {
    var schema = Model && Model.schema && Model.schema.obj || {},
        type = _.get(schema, key),
        k;

    if (key === '$or' || key === '$and') {
      value = _.each(value, (v) => {
        for (k in v) {
          v[k] = convertType(Model, k, v[k]);
        }
        return v;
      });

      return value;
    }

    if (!type) { return value; }
    if ('type' in type) { type = type.type; }


    if (value.hasOwnProperty('$regex')) {
      return value;
    }

    // handle operators
    if (value.hasOwnProperty('$lt') ||
        value.hasOwnProperty('$gt') ||
        value.hasOwnProperty('$lte') ||
        value.hasOwnProperty('$gte') ||
        value.hasOwnProperty('$nin') ||
        value.hasOwnProperty('$in')) {
       for (k in value) {
         value[k] = convertType(Model, key, value[k]);
       }
       return value;
    }

    // handle exists
    if (value.hasOwnProperty('$exists')) {
      value['$exists'] = value['$exists'] === 'true';
      console.log(value);
      return value;
    }

    // handle Arrays
    if (value instanceof Array) {
      for (k = 0; k < value.length; k ++) {
        value[k] = convertType(Model, key, value[k]);
      }
      return value;
    }

    // handle types
    if (type === Boolean) {
      return value === 'true';
    } else if (type === Number) {
      return parseFloat(value);
    } else if (type === Date) {
      return new Date(value);
    } else if (/^[a-f0-9]{24}$/i.test(String(value))) {
      return mongoose.Types.ObjectId(value);
    } else {
      return value;
    }
  }

  function defaultProjection(Model, fields) {
    // No need to recompute
    if (computedDefaultProjection) {
      return _.clone(computedDefaultProjection);
    }

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

    computedDefaultProjection = _.clone(p);
    return p;
  }

  function findAggregation(data, query, callback) {
    var keys = {},
        self = this,
        pipeline = [],
        cursor, sort, sort_split, i, k,
        proj,
        streamError;

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

    appendStages(pipeline, additionalStages.start, self);

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

    appendStages(pipeline, additionalStages.preSort, self);

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

    if (keys.fields || _.size(projection)) {
      proj = proj || defaultProjection(Model, keys.fields);
    }

    appendStages(pipeline, additionalStages.end, self);

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
              if (streamError) { return; }
              self.response.write(d + JSON.stringify(doc));
            })
            .on('error', function(e) {
              streamError = e || 'error in stream';
              callback(streamError);
            })
            .on('end', function() {
              if (streamError) { return; }
              if (!i) self.response.write('{ "error": null, "data": [');
              self.response.write(']}');
              self.response.end();
              self.close();
            });
    } else {
      cursor.exec(callback);
    }

    function appendStages(pipeline, stages, context) {
      var i, v;
      if (stages) {
        for (i = 0; i < stages.length; i++) {
          if (typeof(stages[i]) === 'function') {
            v = stages[i].call(
              context,
              function() { return defaultProjection(Model, keys.fields); }
            );

            if (v) { pipeline.push(v); }
          } else {
            pipeline.push(stages[i]);
          }
        }
      }
    }
  }
}
