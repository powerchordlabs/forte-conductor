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
		let cachedResults = getCacheState(compositePlan, options.cachePrefix)
		debug('getCacheState\n%j\n', cachedResults, staleQueries)

		// 2. if all items are cached, return them and get out fast
		if(!requiresFetch(cachedResults)){
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


/*
 * Builds a map of api result indexes to cacheResults indexes.
 * Given a cacheResults of: { locations: [null, 1, null], content: [1,null,1] }
 * 
 * this method would return: { locations: [0,2], content: [1] }
 * 
 * indicating where actual api fetch reults indices should merge in to the cacheResults
 */
function buildApiResultMap(cacheResults) {
	let resourceKeys = Object.keys(cacheResults)
	let apiResultMap = {}

	// build result map
	resourceKeys.map(key => {
	  apiResultMap[key] = cacheResults[key].map((item, index) => {
	    return !item && index
	  }).filter(i => typeof i === 'number')
	})

	debug('apiResultMap', apiResultMap)
	return apiResultMap
}

function mergeApiResults(cachedResults, apiResults) {
	let resourceKeys = Object.keys(cacheResults)

	debug('mergeApiResults:cacheResults:premerge', cacheResults)

	resourceKeys.map(key => {
	  apiResults[key].map(function(item, index){
	    let mapIndex = apiResultMap[key][index]
	    cacheResults[key][mapIndex] = item
	    return !item && index
	  })
	})

	debug('mergeApiResults:cacheResults:postmerge', cacheResults)
}

function getCacheState(plan, cachePrefix) {
	debug('getCacheState.arguments\n%j\n', plan, cachePrefix)
	
	let { request } = plan

	let cacheQueries = Object.keys(request).map(key => {
		let resource = request[key]
		resource.map(q => {
			return q.cache > 0;
		})
	})

	debug('cacheQueries:', cacheQueries)

	let cachedResults = {locations: [{id:1}]}

	return cachedResults
}

function requiresFetch(cache) {
  let resources = Object.keys(cache).map(key => cache[key])
  
  for (var resource of resources) {
    // get out the moment we find null or undefined
    if(!resource.every(r => r != null)) {
      return true
    }
  }

  return false
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
function buildCacheMap(request, salt) {
  let map = {}
  let resourceKeys = Object.keys(request)
  
  resourceKeys.forEach(resource => {
    map[resource] = []
    request[resource].forEach(query => {
      let cacheKey = getCacheKey(resource, query, salt).toString()
      map[resource].push({ 
        key: cacheKey, 
        value: cache.get(cacheKey), 
        duration: query.cache
      })
    })
  })
  
  return map
}