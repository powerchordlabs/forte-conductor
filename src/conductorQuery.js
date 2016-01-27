var assign = Object.assign || require('object.assign');
var time = require('./time')

module.exports = ConductorQuery;

/**
 * ConductorQuery constructs a new ConductorQuery for the resource specified.
 * @class Conductor.ConductorQuery.
 * @param {string} Name of data resource.
 */
function ConductorQuery(resource) {
  this._resourceDefined = typeof resource == 'string';
  this._resource = resource || null;
  this._paramsRequested = false;
  this._params = {};
  this._singular = false;
  this._cacheMilliseconds = 0;

  return this;
}

/**
 * Params applies the params passed to the query. The params provided should be
 * understood by the API server. The params have no meaning to the
 * ConductorQuery with the exception of identifying one unique query for
 * a resource from another.
 *
 * @param {object} params An object which contains params that can be understood
 * by the API server. Params can be static such as
 * <code>{key: 'value'}</code>. Params can also be dynamic such as
 * <code>{key: ':value'}</code>. Dynamic params can be hydrated when a
 * ConductorPlan is generated.
 * @returns {Conductor.ConductorQuery} <code>this</code>
 */
ConductorQuery.prototype.params = function(params) {
  // Queries can be created each time we evaulate a component.
  // It's important to determine if we need to do much work at all.
  if (params && typeof params == "object" && Object.keys(params).length > 0) {
    this._paramsRequested = true;
    this._params = assign({}, params);
  }

  return this;
}

/**
 * One requests a single object instead of an array.
 * @returns {Conductor.ConductorQuery} <code>this</code>
 */
ConductorQuery.prototype.one = function() {
  this._singular = true;

  return this;
}

/**
 * GetParams is an accessor for params set into the ConductorQuery.
 * @return {object} Params set into the query. If no params have been set the
 * object returned is simply empty.
 */
ConductorQuery.prototype.getParams = function() {
  return this._params;
}

/**
 * GetPlan returns information used to build a composite resource request.
 * @param {object} values A map of values used to hydrate params.
 * @return {object} plan A summary of the query.
 * @return {string} plan.resource The name of the resource.
 * @return {object} plan.params An object containing instructions for the API.
 * @return {boolean} plan.singular True if only one resource should be returned
 * instead of an array of resources.
 */
ConductorQuery.prototype.getPlan = function(values) {
  var params = assign({}, this.getParams());

  if (values && typeof values == 'object' && Object.keys(values).length > 0) {
    // Duplicate our params so that we can manipulate them without impacting
    // the original set of params.
    // var params = assign({}, this._params);
    for (var paramKey in params) {
      var paramValue = params[paramKey];

      // If we don't have a dynamic param we don't need to attempt processing
      if (typeof paramValue != 'string' || paramValue.charAt(0) != ':') {
        continue;
      }

      var dynamicKey = paramValue.substr(1);

      if (!values[dynamicKey]) {
        continue;
      }

      params[paramKey] = values[dynamicKey];
    }
  }

  return {
    resource: this._resource,
    plan: {
      params: params,
      singular: this._singular
    }
  };
}

/**
 * Sets the cache duration for this query.
 * @param {object} duration The duration to cache this query
 * @param {object} interval The interval, in milliseconds, to calculate the cache duration. 
 * You can use Conductor.time properties for ease of use: e.g. <code>query.cache(5, time.seconds)</code>
 * Default: time.seconds
 */
ConductorQuery.prototype.cache = function(duration, interval) {
  // require duration, and undefined or valid interval...
  if(typeof duration === 'number' && (!interval || typeof interval === 'number')){
    // set interval default if undefined
    if(!interval) { interval = time.seconds }

    this._cacheMilliseconds = Math.floor(duration*interval)
  }
  
  return this;
}
