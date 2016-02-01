# forte-conductor

A package for composing and resolving forte-api composite quueries.

## Install

`$ npm i -S forte-conductor`

## API

### Methods

#### Conductor.fetch(apiClient, query, params, [, options]) : {promise (composedResponse) => {}}

* `apiClient: {Object}`  
A `forte-api` client instance or an object that conforms to the following interface can also be supplied:
    * `composite.query(query)`  
    Returns a promise that returns teh results of a composite api call.
* `query: {ConductorQuery}`  
The query to parse, fetch and compose a response for.  
* `params: {object}`  
The params to merge in to the query(s)
* `options: {object}`  
  * `cacheEnabled: {bool}`  
  Controls whether queries with a `.Cache()` setting are actually cached. This is useful for turning off caching globally on the server/client.  
  `default: true`  
  * `cachePrefix: {string}`  
  Adds a cache prefix to all cache entries.  
  `default: ''`  

#### Conductor.query(resource)

Returns a new ConductorQuery.

* `resource: {string}`  
The name of the api resource to fetch with this query. See the API GO Docs fro supported resources.

The query instance supports filtering, singularity and caching using the following chainable methods:

##### query.params(object)

Specifies the parameters that are used to filter the resource by.

``` js
let query = Conductor.query('locations').params({type: ':typeParam'})
let params = { typeParam: 'atype'}
Conductor.fetch(api, query, params)
```

##### query.one()

Restricts the API response to a single item.

``` js
Conductor.query('locations').params({active: true}).one()
```

##### query.cache(duration[, interval])

``` js
import time from 'forte-conductor/time'

Conductor.query('locations').params({active: true}).one().cache(300) // seconds

Conductor.query('locations').params({active: true}).one().cache(1, time.hour) // hours
```

#### Conductor.getQuery(component)

Retrieves the `query` property from the specified Component. Typically used when retrieving a query on behalf of a child component:

``` js

var React = require('react');

// Platform Imports
var Conductor = require('powerchord-conductor');

// Children Imports
var Header = require('./Header');
var Footer = require('./Footer');

var layout = React.createClass({
  statics: {
    query: {
      footer: Conductor.getQuery(Footer), // get query from Footer
      header: Conductor.getQuery(Header)  // get query from Header
    }
  }
  ...
})
```
