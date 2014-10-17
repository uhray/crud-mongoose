
var crud = require('node-crud'),
    express = require('express'),
    cm = require('../'),
    mongoose = require('mongoose'),
    resources = require('require-dir')('./resources'),
    app = express();


// Connect to db ---------------------------------------------------------------
mongoose.connect('mongodb://127.0.0.1/test');
mongoose.connection.on('error',function (e) {
  console.error('Mongoose default connection error: ' + e);
});
mongoose.connection.once('connected', function() {
  console.log('connected to db.');
});

// set up express middleware ---------------------------------------------------
app.use(require('body-parser').urlencoded({ extended: true }));
app.use(require('body-parser').json());

// launch app ------------------------------------------------------------------
crud.launch(app);
app.listen(3000);
console.log('app listening on 3000');
