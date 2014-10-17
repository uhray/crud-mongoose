// =============================================================================
//                              USER RESOURCE                                 //
// =============================================================================

// Load Modules ----------------------------------------------------------------

var crud = require('node-crud'),
    cm = require('../../'),
    mongoose = require('mongoose'),
    model, schema;

// Create a Schema & Model -----------------------------------------------------

Schema = exports.Schema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName:  { type: String, required: true },
  info: {
    gender: String,
    age: Number
  }
});

Model = exports.Model = mongoose.model('users', Schema);

// All Users -------------------------------------------------------------------

crud.entity('/users').Read()
  .pipe(cm.filterQuery('info.age'))
  .pipe(function(data, query, cb) {
    Model.find(query).lean().exec(cb);
  })

crud.entity('/users').Create()
  .pipe(cm.filterData('info.age'))
  .pipe(function(data, query, cb) {
    cb();
  })

crud.entity('/users').on('error', function(method, e) {
  console.log('%s error: %j', method, e);
});

// One User --------------------------------------------------------------------

crud.entity('/users/:_id').Read()
    .pipe(function(data, query, cb) {
      cb(null, 'one user');
      //Model.findOne(query).lean().exec(cb);
    });

crud.entity('/users/:_id').on('error', function(method, e) {
  debug('one | %s error: %j', method, e);
});
