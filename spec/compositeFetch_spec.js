import Conductor from '../src'
import Debug from 'debug'

const debug = Debug('forte-conductor')

describe('Conductor.fetch', () => {
	let api = {
		composite: {
			query: query => 
			{
				return {}
			}
		}
	}

	beforeEach(() => {
		Conductor.setApi(api)
	})

	it('validates arguments', (done) => {
		let options = {
			cachePrefx: '',
			cacheEnabled: true
		}

		let query = { locations: Conductor.query('locations').params({ status: ':status'}).one() }
		let params = { status: 'active'}

		Conductor.fetch(query, params, options).then(response => {
			expect(response).toEqual({locations: {id:1}})
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