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
  },
  active: { type: Boolean, default: true },
  created: { type: Date, default: Date.now },
  updated: { type: Date, default: Date.now },
  turnkey: { type: String }
});

Model = exports.Model = mongoose.model('users', Schema);

// All Users -------------------------------------------------------------------

crud.entity('/users').Read()
  .pipe(cm.parseQuery()
          .removes('info.age', 'auth')        // can't query by age or auth
          //.overrides({ active: true })        // can only query active people
          .defaults({ 'info.gender': 'M' })   // default only males
          .maxes({ limit: 8 }))               // max limit is 100
  .pipe(cm.findAll(Model, ['-turnkey']).stream()
          .exports({ csv: cm.exporters.csv() }))

crud.entity('/users').Create()
  .pipe(cm.createNew(Model));

crud.entity('/users').Delete()
    .pipe(cm.removeAll(Model));

crud.entity('/users').on('error', function(method, e) {
  console.log('%s error: %j', method, e);
});

// One User --------------------------------------------------------------------

crud.entity('/users/:_id').Read()
  .pipe(cm.findOne(Model, [ 'firstName', 'lastName', 'info', '-turnkey' ]))

crud.entity('/users/:_id').Update()
  .pipe(cm.parseData()
          .removes('auth')                   // can't set auth data
          .overrides({ updated: Date.now })  // override updated date
          .defaults({ 'info.gender': 'M' }))  // default only males
  .pipe(cm.updateOne(Model));

crud.entity('/users/:_id').Delete()
  .pipe(cm.removeOne(Model));

crud.entity('/users/:_id').on('error', function(method, e) {
  debug('one | %s error: %j', method, e);
});
