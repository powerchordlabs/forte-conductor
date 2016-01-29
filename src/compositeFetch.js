import Conductor from './'
import cache from 'memory-cache'
const debug = require('debug')('forte-conductor:compositeFetch')

export default fetch;

cache.put('test', 'hello')

const defaultOptions = {
	cachePrefix: '',
	cacheEnabled: true
}

function fetch(api, query, queryParams, options){
	debug('fetch.arguments %j', api, query, queryParams, options)
	// validate args

	options = {...defaultOptions, ...options}

	return new Promise((resolve, reject) => {
		let compositePlan = Conductor.parseQuery(query, queryParams)
		debug('compositePlan\n%j\n', compositePlan)

		// 1. get existing cachedResults, with nulls for new or expired queries
		let cacheMap = buildCacheMap(compositePlan.request, options.cachePrefix)
		debug('cacheMap\n%j\n', cacheMap)

		// 2. if all items are cached, return them and get out fast
		if(!cacheMap.hasExpiredItems){
			debug('all items resolved from cache')
			let composedResponse = Conductor.composeResponse(compositePlan, cachedResults)
			return resolve(composedResponse)
		}

		// 3. build new request for non-cached items
		
		// 4. fetch non-cached items
		api.composite.query(staleQueries)
			.then(response => {

				// 5. determine which pieces need to be cached

				// 6. update cache

				// 7. merge fetched items in to cacheResults to realign with original plan
				let mergedData = {...cachedResults, ...response}

				// 8. compose the response as usual
				let composedResponse = Conductor.composeResponse(compositePlan, cachedResults)

				resolve(composedResponse)
			}).catch(err => {
				// TODO: what do we do when some items were cached, but the api call fails?
				reject(err)
			})
	})
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

// returns a clone of the request with the queries replaced
// with an object of their corresponding cache keys, values and durations
function buildCacheMap(request, cachePrefix) {
  let hasExpiredItems = false
  let map = {}
  let results = {}
  let resourceKeys = Object.keys(request)
  
  resourceKeys.forEach(resource => {
    map[resource] = []
    results[resource] = []
    
    request[resource].forEach(query => {
      let cacheKey = getCacheKey(resource, query, cachePrefix).toString()
      let cacheValue = cache.get(cacheKey)
      
      // clone mutable objects
      cacheValue = isPrimitive(cacheValue) ? cacheValue : {...cacheValue}
      if(cacheValue === null) {
        hasExpiredItems = true
      }
      
      map[resource].push({ 
        key: cacheKey, 
        //value: cacheValue, 
        duration: query.cache,
        wasCached: cacheValue != null,
        cacheable: query.cache > 0
      })
      
      results[resource].push(cacheValue)
    })
  })
  
  return { hasExpiredItems, map, results }
}

/*
 * Builds a map of api result indexes to cacheMap indexes.
 * Given a cacheMap of: { locations: [{value:null}, {value:1}, {value:null}]}
 * 
 * this method would return: { locations: [0,2] }
 * 
 * indicating where actual api fetch reults indices should merge in to the cacheMap
 */
function buildApiResultMap(cacheMap) {
	let resourceKeys = Object.keys(cacheMap)
	let apiResultMap = {}

	// build result map
	resourceKeys.map(key => {
	  apiResultMap[key] = cacheMap[key].map((item, index) => {
	    return !item && index
	  }).filter(i => { 
	    return typeof i === 'number'
	   })
	})
	return apiResultMap
}

// merges api results in to the cacheMap
// merges api results in to the cacheMap
function mergeApiResults(cacheResults, apiResults) {
	let resourceKeys = Object.keys(cacheResults)

	resourceKeys.forEach(key => {
	  apiResults[key].forEach((item, index) => {
	    let mapIndex = apiResultMap[key][index]
	    cacheResults[key][mapIndex] = item
	  })
	})
}


function isPrimitive(arg) {
	if(arg == null) { return true } // note == includes undefined
  	
  	let type = typeof arg;
  	return type !== 'object' && type !== 'function';
}