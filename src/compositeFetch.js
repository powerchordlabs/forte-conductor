import Conductor from './'
const debug = require('debug')('forte-conductor:compositeFetch')

export default fetch;

const defaultOptions = {
	cachePrefix: '',
	cacheEnabled: true
}

function getCacheState(plan, cachePrefix) {
	debug('getCacheState.arguments\n%j\n', plan, cachePrefix)
	let cachedResults = {locations: [{id:1}]}
	let staleQueries = plan.request
	return { cachedResults, staleQueries }
}

function fetch(api, query, queryParams, options){
	debug('fetch.arguments %j', api, query, queryParams, options)
	// validate args

	options = {...defaultOptions, ...options}

	return new Promise((resolve, reject) => {
		let compositePlan = Conductor.parseQuery(query, queryParams)
		debug('compositePlan\n%j\n', compositePlan)

		// check plan against cache...
		let { cachedResults, staleQueries } = getCacheState(compositePlan, options.cachePrefix)
		debug('getCacheState\n%j\n', cachedResults, staleQueries)

		// if all items are cached, return them and get out fast
		if(staleQueries == {}){
			let composedResponse = Conductor.composeResponse(compositePlan, cachedResults)
			debug('composedResponse\n%j\n', composedResponse)
			return resolve(composedResponse)
		}

		// remove plan items that are currently cached
		// let fetchPlan = Conductor.parseQuery(staleQueries, queryParams)

		api.composite.query(staleQueries)
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