import Conductor from './'
import { InvalidArgumentError } from './util'
import cache from 'memory-cache'
const debug = require('debug')('forte-conductor:CompositeRequestResolver')

export default CompositeRequestResolver

const defaultOptions = {
	cachePrefix: '',
	cacheEnabled: true
}

function CompositeRequestResolver(api, query, queryParams, options){
	debug('CompositeRequestResolver arguments %j', api, query, queryParams, options)

	verifyConfig(api, options)

	options = {...defaultOptions, ...options}

	this._api = api
	this._compositePlan = Conductor.parseQuery(query, queryParams)
	this._resolverPlan = createResolverPlan(this._compositePlan.request, options)

	return this
}

CompositeRequestResolver.prototype.resolve = function() {
	let resolverPlan = this._resolverPlan

	return new Promise((resolve, reject) => {
		if(!resolverPlan.hasExpiredItems){
			let composedResponse = this.composeResponse(this._compositePlan, resolverPlan.results)
			debug('composedResponse', composedResponse)

			return resolve(composedResponse)
		}

		let request = resolverPlan.uncachedQueryRequest

		this._api.composite.query(request).then(response => {

			debug('premerge: resolverPlan.results', resolverPlan.results)

			mergeAndCacheResponse(resolverPlan, response.body)
			
			debug('postmerge: resolverPlan.results', resolverPlan.results)

			let composedResponse = this.composeResponse(this._compositePlan, resolverPlan.results)
			debug('composedResponse', composedResponse)
			
			resolve(composedResponse)
		}).catch(err => {
			debug('query err', err)
			reject(err)
		})
	})
}

CompositeRequestResolver.prototype.composeResponse = function (plan, results) {
	return Conductor.composeResponse(this._compositePlan, results)
}

// merge the api response in to the cacheResults, and 
function mergeAndCacheResponse(resolverPlan, response) {
	let map = resolverPlan.uncachedQueryResultsMap
	let cacheResults = resolverPlan.results
	let request = resolverPlan.uncachedQueryRequest

	let responseKeys = Object.keys(response)
	responseKeys.forEach(resource => {
		response[resource].forEach((item, index) => {
			
			let mapIndex = map[resource][index].index
			cacheResults[resource][mapIndex] = item
			
			// TODO: add to cache if specifed
			let query = request[resource][mapIndex]
			if(query.cache > 0) {
				// set cache
				let key = map[resource][index].cacheKey
				cache.put(key, item, query.cache)
				debug(`cache.put(${key}, ${JSON.stringify(item)}, ${query.cache})`)
			}
		})
	})
}

// returns a clone of the request with the queries replaced
// with an object of their corresponding cache keys, values and durations
function createResolverPlan(request, options) {
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
        uncachedQueryResultsMap[resource].push({ cacheKey, index: i })
      }
    })
  })
  
  let plan =  { hasExpiredItems, cacheMap, results, uncachedQueryRequest, uncachedQueryResultsMap }
  debug('resolverPlan %j', plan)

  return plan
}

// generates a numeric hash code for the specified value
let getHashCode = function(value){
	var hash = 0;

	/* istanbul ignore next */
	if (value.length === 0) { 
		return hash;
	}

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


/* 
 * Verifcations
 */
function argumentError(name) {
	throw new InvalidArgumentError(name)
}

function verifyConfig(apiClient, options) {
	if(typeof apiClient !== 'object') {
		argumentError('apiClient')
	}

	if(typeof apiClient.composite !== 'object') {
		argumentError('apiClient.composite')
	}

	if(typeof apiClient.composite.query !== 'function') {
		argumentError('apiClient.composite.query')
	}
}
