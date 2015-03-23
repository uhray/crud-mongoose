Crud-Mongoose
=============

Crud mongoose is a library of middleware for connecting [crud](https://github.com/uhray/crud) to [mongoose](mongoosejs.com). It make it pretty easy to create simple APIs, with plenty of default and configurable capabilities.

Simple Example:

```js
var crud = require('crud'),
  cm = require('crud-mongoose'),
  mongoose = require('mongoose'),
  Model = mongoose.model('users', new mongoose.Schema({
      firstName: { type: String, required: true },
      lastName:  { type: String, required: true },
      gender:    { type: String, required: true, enum: ['M', 'F'] },
      created:   { type: Date, default: Date.now }
  }));

// All Users -------------------------------------------------------------------

crud.entity('/users').Create()
  .pipe(cm.createNew(Model));

crud.entity('/users').Read()
  .pipe(cm.findAll(Model))

crud.entity('/users').Delete()
    .pipe(cm.removeAll(Model));

// One User --------------------------------------------------------------------

crud.entity('/users/:_id').Read()
  .pipe(cm.findOne(Model))

crud.entity('/users/:_id').Update()
  .pipe(cm.updateOne(Model));

crud.entity('/users/:_id').Delete()
  .pipe(cm.removeOne(Model));
```

With this example, you can do simple GET, POST, PUT, and DELETE routes to:

  * Create a user - `POST` on `/api/users`
  * Read many users - `GET` on `/api/users`
  * Delete many users - `DELETE` on `/api/users`
  * Read one user - `GET` on `/api/users/<id>`
  * Update one user - `PUT` on `/api/users/<id>`
  * Delete one user - `DELETE` on `/api/users/<id>`

There are also a number of default query-able parameters. For example, the following GET requests could be used to get different subsets of data:

  * `/api/users?gender=F` - get all female users
  * `/api/users?lastName=Thompson` - get all users with lastName "Thompson"
  * `/api/users?limit=10` - only get 10 users
  * `/api/users?skip=50&limit=100&sortBy=created:asc` - Sorts users by created date ascending, skips 50,  and then returns max 100
  * `/api/users?page=2&perPage=100&sortBy=created` - Sorts users by created date ascending (note it's ascending by default), and then skips the first 200 because it's page 2 (starts at 0) and there are only 100 per page.
  * `/api/users?fields=firstName,lastName` - get all users but only return firstName and lastName fields.

There are other queries you can make, but this gives a pretty good example of why this library makes API creation so easy. BUT, it's not only easy, it's also really configurable so you are not boxed in. And, if you need to configure things this library doesn't allow, you can always drop in your own middleware function into Crud, which is pretty easy anyway.


## API

The API has two types of middleware functions: 

  * Middleware that interacts directly with the MongoDB through mongoose - [here](#mongoose-middleware).
  * Middleware that modifies the crud *data* and *query* objects - [here](#modify-middleware).
 

All middleware can be placed into a [Crud Pipe](https://github.com/uhray/crud#method-pipe), like this:

```js
crud('/users').Read()
  .pipe(cm.findAll())
```


#### Mongoose Middleware

The following middleware functions all interact with a Mongoose Model, using the crud *data* and *query* objects. (See [here](https://github.com/uhray/crud#method-pipe) for info on the meaning of those objects). 

<a href="#createNew" name="createNew">#</a> cm.**createNew**(*Model*)

This method creates a new record in the *Model* based on the crud *data* object. The middleware is basically this:

```js
function(data, query, callback) {
  new Model(data).save(callback);
}
```

Example, allowing you to `POST` on `/api/users` to create a new user:

```js
crud.entity('/users').Create()
  .pipe(cm.createNew(Model));
```

<a href="#findAll" name="findAll">#</a> cm.**findAll**(*Model*, [*fields*])

This method does a `find` on the *Model* using the *query* object. The *fields* parameter is an optional array of fields you want to allow in the response. So, if you only want to show certain fields you can provide an array like `['firstName', 'lastName']`. Or, if you wish to restrict a field ALWAYS, you can put a `-` before it (e.g. `['firstname', 'lastname', '-password']` will by default only show first and last names, but will not allow you to ever query for the password fields).

For starters, you can think of it as something like this:

```js
function (data, query, callback) {
  Model.find(query).select(fields.join(' ')).lean().exec(callback);
  // see here: http://mongoosejs.com/docs/api.html#query_Query-select for mongoose select
}
```

That's where it started, but then we added a lot more functionality. There are special *query* parameters that are parsed here:

  * *limit* - limits the number of records responded with
  * *skip* - skips this many records on the response
  * *page* - used for pagination. Indexed starting at zero.
  * *perPage* - number of records per page. Pagination doesn't work well without a value here.
  * *sortBy* - sortable values. This is formatted like this: `firstvalue:asc,secondvalue:desc`, where the comma denotes different fields and the colon is used to show `asc` for ascending or `desc` for descending. Default is ascending.
  * *fields* - a comma separated listed of fields to select.

An example, allowing you to query all users with a `GET` on `/api/users`:

```js
crud.entity('/users').Read()
  .pipe(cm.findAll(Model, [ 'firstName', 'lastName' ]))

```

The following are the chainable properties:

  * findAll(Model).**stream**() - sets the mode to streaming. This will not pass things through the crud chain anymore and instead stream responses. This is useful for queries that expect huge responses.
  * findAll(Model).**exports**(*object*) - turns on exporting capabilities. This allows you to set export functionality so, for example, query `?export=csv` will export the data as a csv file. The *object* parameter specifies keys as the export keys like `'csv'` and the values are functions that handle the exporting. An example would be `findAll(Model).exports({ csv: cm.exporters.csv() })`. See [exporter functions](#exporter-functions) for information on how they are defined and the pre-packaged functions in crud-mongoose.

<a href="#findOne" name="findOne">#</a> cm.**findOne**(*Model*, [*fields*])

This method does a `findOne` on the *Model* using the query object. The *fields* parameter is an optional array of fields you want to allow in the response. So, if you only want to show certain fields you can provide an array like `['firstName', 'lastName']`. Or, if you wish to restrict a field ALWAYS, you can put a `-` before it (e.g. `['firstname', 'lastname', '-password']` will by default only show first and last names, but will not allow you to ever query for the password fields).

For starters, you can think of it as something like this:

```js
function (data, query, callback) {
  Model.findOne(query).select(fields.join(' '))
       .lean().exec(callback);
  // see here: http://mongoosejs.com/docs/api.html#query_Query-select for mongoose select
}
```

That's where it started, but then we added more functionality. There are special *query* parameters that are parsed here: (well, there is only one right now).

  * *fields* - a comma separated listed of fields to select.

An example, allowing you to query one user with `GET` on `/api/users/<id>`:

```js
crud.entity('/users/:_id').Read()
  .pipe(cm.findOne(Model, [ 'firstName', 'lastName' ]))

```

Note: It's important for the URL to be formatted like `/users/:_id`, because then the query will have `{ _id: <id_in_url> }`, which is needed to find the individual user.

<a href="#removeAll" name="removeAll">#</a> cm.**removeAll**(*Model*)

This method does a `remove` on the *Model* using the query object. The middleware is basically this:

```js
function(data, query, callback) {
  Model.remove(query).lean().callback();
}
```

An example so you can remove all users with a `DELETE` on `/api/users`:

```js
crud.entity('/users').Delete()
    .pipe(cm.removeAll(Model));
```

<a href="#removeOne" name="removeOne">#</a> cm.**removeOne**(*Model*)

This method does a `findOneAndRemove` on the *Model* using the query object. The middleware is basically this:

```js
function(data, query, callback) {
  Model.findOneAndRemove(query).lean().callback();
}
```

An example so you can remove one user with a `DELETE` on `/api/users/<id>`:

```js
crud.entity('/users/:_id').Delete()
    .pipe(cm.removeOne(Model));
```

Note: It's important for the URL to be formatted like `/users/:_id`, because then the query will have `{ _id: <id_in_url> }`, which is needed to find the individual user.

<a href="#updateOne" name="updateOne">#</a> cm.**updateOne**(*Model*, *Options*)

This method does a `findOne` and then and `update` on the *Model* using the *query* object for querying and the *data* object for the update. The middleware is basically this:

```js
function(data, query, callback) {
  Model.findOne(query, function(e, d) {
    d.set(data);
    d.save(callback);
  });
}
```

*Options*

  - `findOneAndUpdate` (Default=`false`) - We used to use `findOneAndUpdate`, but decided to do a `find` then update because updates do not use mongoose validators. Unfortunately, this does not allow you to apply MongoDB updates like $push, $pull, etc. So, if you need to use other update methods, you can set this to true. Just remember this will not obey the Mongoose validation. Additionally, you may need this if you're trying to update a Mixed mongoose object because Mixed objects cannot be updated with the `object.set` function.

*Example* - An example so you can update a user with a `PUT` on `/api/users/<id>`:

```js
crud.entity('/users/:_id').Update()
    .pipe(cm.updateOne(Model));
```

Note: It's important for the URL to be formatted like `/users/:_id`, because then the query will have `{ _id: <id_in_url> }`, which is needed to find the individual user.

#### Modify Middleware

These middleware functions modify crud *data* and *query* objects. (See [here](https://github.com/uhray/crud#method-pipe) for info on the meaning of those objects). The purpose of these middleware functions are for the instances where you want to set default parameters (e.g. default limit on a read of 100 records), prevent the use of certain parameters (e.g. don't allow querying of users by age), establishing max query limits (e.g. cannot query for more than 100 records), or overriding certain values (e.g. the data on an update always updating the `"updated"` date field).

<a href="#parseQuery" name="parseQuery">#</a> cm.**parseQuery**()

This method allows you to parse the *query* object with special options. Calling this function returns a middleware function that has chainable properties so you can configure the function. For example, you could chain configurations like this:

```js
crud('/users').Read()
  .pipe(cm.parseQuery()
          .defaults({ limit: 10 }))
  .pipe(cm.findAll())
```

The following are the chainable properties:

  * parseQuery().**defaults**(*defaults*) - *defaults* is a key-value object that will set any key-value parameters on the *query* object if they are not set. For example, if you have `{ limit: 10 }` as the *defaults*, then if you were to query `/api/users` it would be equivalent to `/api/users?limit=10`. Also, if any values in the key-values are functions, then they will be called when set on the query.

  * parseQuery().**removes**(*key1*, [*key2*, *key3* ... ]) - the *keys*, passed as individual arguments, are keys that will be removed from the query so API users cannot query by this field. For example, if you have `.removes('age')`, then you cannot query like this: `/api/users?age=23`, because age will be removed from the query.

  * parseQuery().**overrides**(*overrides*) - *overrides* is a key-value object that will force its key-value parameters on the *query* object. For example, if you have `{ active: true }` as the *overrides*, then if you were to query `/api/users?active=false` it would be equivalent to `/api/users?active=true`. You could use this to prevent API users from querying inactive records. Also, if any values in the key-values are functions, then they will be called when set on the query.

  * parseQuery().**maxes**(*maxes*) - *maxes*  is a key-value object that will force any key-value parameters on the *query* object that are in the *maxes* object to be no-more-than the max. For example, if you have `{ limit: 100 }` as the *maxes*, then if you were to query `/api/users?limit=1000`, it would override the `limit` parameter to be `100`, since that is the max.

<a href="#parseData" name="parseData">#</a> cm.**parseData**()

This method allows you to parse the *data* object with special options. Calling this function returns a middleware function that has chainable properties so you can configure the function. For example, you could chain configurations like this:

```js
crud('/users/:_id').Update()
  .pipe(cm.parseData()
          .overrides({ updated: Date.now }))
  .pipe(cm.findAll())
```

The chainable properties are the SAME as those from [parseQuery](#parseQuery), except two important things:

  * They modify the *data* object (not the *query* object)
  * There is no *maxes* method, because that is made specifically to handle the query limits, pages, etc.

> Note, if you remove the ability to send certain data, like `parseData().removes('info')`, this does not mean the user cannot updated pass something like `{ 'info.age' : 7 }`, which does update mongoose documents because everything is treated as flat in mongoose. Likewise, if you have an array such as `{ favcolors: ['red', 'blue', 'green'] }`, you could pass `{ 'favcolors.0' : 'black' }`. Because of this, if key in the data object has a period (meaning it's already been flattened somewhat), parseData will remove this key-value from the resultant data object. This is solely for security reasons.

## Exporter Functions

Exporter functions are used to export the api data into something other than JSON, say CSV for example.

The are passed three arguments:

  * response - express response object.
  * cursor - The mongoose cursor with the rest of the query parameters set
  * callback - callback to be called when done. The first argument should be the error message if there is one or null.

Prepackaged in crud-mongoose are the folloowing exporters, which can be accessed by `cm.exporters`. If you're using the csv exporter you could do the following:

```js
crud.entity('/users').Read()
  .pipe(cm.findAll(Model)
          .exports({ csv: cm.exporters.csv() })

```

<a href="#exporters-csv" name="exporters-csv">#</a> cm.exporters.**csv**([*headers*])

Exports the resulting query as a csv file. The optional *headers* argument allows you to specify an array of csv headers, which will be the first line and will be used as the accessors for the data values for each row. If not provided, the key's on the first row will be used.

<a href="#exporters-xlsx" name="exporters-xlsx">#</a> cm.exporters.**xlsx**([*headers*])

Exports the resulting query as a xlsx file. The optional *headers* argument allows you to specify an array of xlsx headers, which will be the first line and will be used as the accessors for the data values for each row. If not provided, the key's on the first row will be used.

## Debug

The Crud module has sprinkled some [debug](https://github.com/visionmedia/debug) messages throughout the module. If you wish to turn these on, run your sever with the environment variable `DEBUG=crud-mongoose*` set. Or, you can turn them on for only one method, like `DEBUG=crud-mongoose:findOne`.
