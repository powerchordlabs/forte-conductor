export default fetch;

var defaultOptions = {
	cachePrefix: '',
	cacheEnabled: true
}

function getCacheState(plan, cachePrefix) {
	let cachedResults = {}
	let staleQueries = {}
	return { cachedResults, staleQueries }
}

function fetch(api, query, queryParams, options){
	// validate args

	options = {...defaultOptions, ...options}

	return new Promise((resolve, reject) => {
		let mergedQuery = Conductor.getQuery(query, queryParams)
		let compositePlan = Conductor.parseQuery(mergedQuery, queryParams)

		// check plan against cache...
		let { cachedResults, staleQueries } = getCacheState(compositePlan, cachePrefix)

		// if all items are cached, return them and get out fast
		if(staleQueries.length === 0){
			let composedResponse = Conductor.composeResponse(compositePlan, cachedResults)
			return resolve(composeResponse)
		}

		// remove plan items that are currently cached
		let fetchPlan = Conductor.parseQuery(staleQueries, queryParams)

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