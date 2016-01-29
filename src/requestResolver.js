import Conductor from './'
import cache from 'memory-cache'
const debug = require('debug')('forte-conductor:RequestResolver')

export default RequestResolver

function RequestResolver(api, query, queryParams, options){
	this._api = api
	this._compositePlan = Conductor.parseQuery(query, queryParams)
	this._executionPlan = createExecutionPlan(this._compositePlan.request, options)
	debug('_executionPlan %j', this._executionPlan)

	return this
}

RequestResolver.prototype.resolve = function() {
	return new Promise((resolve, reject) => {
		if(!this._executionPlan.hasExpiredItems){
			let composedResponse = Conductor.composeResponse(this._compositePlan, this._executionPlan.results)
			resolve(composeResponse)
		}

		// todo make api call for uncached items
		resolve('todo')
	})
}

// returns a clone of the request with the queries replaced
// with an object of their corresponding cache keys, values and durations
function createExecutionPlan(request, options) {
  let hasExpiredItems = false
  let cacheMap = {}
  let results = {}
  let uncachedQueryRequest = {}
  let uncachedQueryResultsMap = {}
  
  let resourceKeys = Object.keys(request)
  
  resourceKeys.forEach(resource => {
    cacheMap[resource] = []
    results[resource] = []
    
    request[resource].forEach((query, i) => {
      let cacheKey = getCacheKey(resource, query, options.cachePrefix).toString()
      let cacheValue = cache.get(cacheKey)
      
      // clone mutable objects
      cacheValue = isPrimitive(cacheValue) ? cacheValue : {...cacheValue}
      if(cacheValue === null) {
        hasExpiredItems = true
        uncachedQueryRequest[resource] = uncachedQueryRequest[resource] || []
        uncachedQueryResultsMap[resource] = uncachedQueryResultsMap[resource] || []
      }
      
      let mapEntry = { 
        query: query,
        key: cacheKey, 
        duration: query.cache,
        wasCached: cacheValue != null,
        cacheable: query.cache > 0
      }
      cacheMap[resource].push(mapEntry)
      
      results[resource].push(cacheValue)
      
      if(!mapEntry.wasCached){
        uncachedQueryRequest[resource].push(mapEntry.query)
        uncachedQueryResultsMap[resource].push(i)
      }
    })
  })
  
  return { hasExpiredItems, cacheMap, results, uncachedQueryRequest, uncachedQueryResultsMap }
}

// generates a numeric hash code for the specified value
let getHashCode = function(value){
	var hash = 0;
	if (value.length === 0) return hash;
	for (var i = 0; i < value.length; i++) {
		let char = value.charCodeAt(i);
		var hash = ((hash<<5)-hash)+char;
		hash = hash & hash; // Convert to 32bit integer
	}
	return hash;
}

// creates a cache key based on the specified arguments
function getCacheKey(resource, query, prefix) {
  // ignore cache prop
  let { cache, ...rest } = query 
  return getHashCode(prefix+resource+JSON.stringify(rest))
}

function isPrimitive(arg) {
	if(arg == null) { return true } // note: == includes undefined
  	
  	let type = typeof arg;
  	return type !== 'object' && type !== 'function';
}