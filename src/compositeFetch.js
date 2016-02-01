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
}