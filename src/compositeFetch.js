import Conductor from './'
import RequestResolver from './requestResolver'
const debug = require('debug')('forte-conductor:compositeFetch')

export default fetch;

const defaultOptions = {
	cachePrefix: '',
	cacheEnabled: true
}

function fetch(api, query, queryParams, options){
	debug('fetch.arguments %j', api, query, queryParams, options)
	// validate args

	options = {...defaultOptions, ...options}

	let resolver = new RequestResolver(api, query, queryParams, options)

	return resolver.resolve()



	

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