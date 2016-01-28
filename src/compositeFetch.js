import Conductor from './'
import Debug from 'debug'

const debug = Debug('forte-conductor')

export default fetch;

var defaultOptions = {
	cachePrefix: '',
	cacheEnabled: true
}

function getCacheState(plan, cachePrefix) {
	let cachedResults = {locations: [{id:1}]}
	let staleQueries = []
	return { cachedResults, staleQueries }
}

function fetch(api, query, queryParams, options){
	debug('fetch arguments:', api, query, queryParams, options)
	// validate args

	options = {...defaultOptions, ...options}

	return new Promise((resolve, reject) => {
		let compositePlan = Conductor.parseQuery(query, queryParams)
		debug('compositePlan', compositePlan)

		// check plan against cache...
		let { cachedResults, staleQueries } = getCacheState(compositePlan, options.cachePrefix)
		debug('getCacheState', cachedResults, staleQueries)

		// if all items are cached, return them and get out fast
		if(staleQueries.length === 0){
			debug('all cached')
			let composedResponse = Conductor.composeResponse(compositePlan, cachedResults)
			debug('all composedResponse', composedResponse)
			return resolve(composedResponse)
		}

		// remove plan items that are currently cached
		let fetchPlan = Conductor.parseQuery(staleQueries, queryParams)

		return resolve('TODO')

		api.composite.query(fetchPlan.request)
			.then(response => {
				// merge items in to cache...
				let mergedData = {...cachedResults, ...response}
				let composedResponse = Conductor.composeResponse(compositePlan, cachedResults)

				resolve(composedResponse)
			}).catch(err => {
				// TODO: what do we do when some items were cached, but the api call fails?
				reject(err)
			})
	})
}