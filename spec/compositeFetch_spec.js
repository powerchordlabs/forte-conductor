import Conductor from '../src'
import Debug from 'debug'
import cache from 'memory-cache'

const debug = Debug('forte-conductor')

const apiMockFactory = (result) => {
	return {
		composite: {
			query: query => 
			{
				return new Promise((resolve, reject) => {
					return resolve(result || {})
				})
			}
		}
	}
}

describe('Conductor.fetch', () => {

	it('validates arguments')

	it('fetches items from the api', (done) => {
		let options = {
			cachePrefx: '',
			cacheEnabled: true
		}

		let apiClient = apiMockFactory()
		let query = { 
			locationsA: Conductor.query('locations').params({ _status: ':status'}).one(),
			locationsB: Conductor.query('locations').params({ _status: ':status', alt: true}).one().cache(1)
		}
		let params = { status: 'active'}

		spyOn(apiClient.composite, 'query').and.callThrough()

		// temp futz with cache...
		cache.put('1716976019', {say:"hello"}, 5000)

		Conductor.fetch(apiClient, query, params, options).then(response => {
			let expectedApiRequest = {
				locations: [{
					params: { _status: 'active'},
					singular: true,
					cache: 0
				}]
			}

			//expect(apiClient.composite.query).toHaveBeenCalledWith(expectedApiRequest)
			done()
		}, err => {
			done.fail(err)
		})
	})

	it('fetches all items from api when cache is empty')
	it('fetches only uncached items from api')

	// check plan against cache...
	// if all items are cached, return them and get out fast
	// remove plan items that are currently cached
	// merge items in to cache...
	// TODO: what do we do when some items were cached, but the api call fails?
})