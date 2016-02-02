import Conductor from '../src'
import time from '../src/time'
import Debug from 'debug'
import cache from 'memory-cache'

const debug = Debug('forte-conductor:test')

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

	it('validates arguments', () => {
		let invalidArguments = [
			[undefined, null, null, null],
			[null, null, null, null],
			[{}, null, null, null],
			[{composite: null}, null, null, null],
			[{composite: {}}, null, null, null]
		]
		invalidArguments.forEach(args => {
			expect(() => Conductor.fetch.apply(null, args)).toThrow()
		})
	})

	describe('when cache is empty', () => {
		cache.clear()

		let options = {
			cachePrefx: ''
		}

		let query = { 
			locationsA: Conductor.query('locations').params({ _status: ':status'}).one(),
			locationsB: Conductor.query('locations').params({ _status: ':status', alt: true}).one().cache(5)
		}

		let params = { status: 'active'}

		it('requests all queries from the api', (done) => {		
			let apiClient = apiMockFactory({locations: [{id:1}, {id:2}]})
			spyOn(apiClient.composite, 'query').and.callThrough()

			Conductor.fetch(apiClient, query, params, options).then(response => {
				let expectedApiRequest = {
					locations: [{
						params: { _status: 'active'},
						singular: true,
						cache: 0
					},
					{
						params: { _status: 'active', alt: true },
						singular: true,
						cache: 5000
					}
				]}

				expect(apiClient.composite.query).toHaveBeenCalledWith(expectedApiRequest)
				expect(response).toEqual({locationsA: {id:1}, locationsB: {id:2}})

				done()
			}, err => {
				done.fail(err)
			})
		})

		it('requests only uncached queries from the api', (done) => {	
			let apiClient = apiMockFactory({locations: [{id:1}]})
			spyOn(apiClient.composite, 'query').and.callThrough()
			
			Conductor.fetch(apiClient, query, params, options).then(response => {
				let expectedApiRequest = {
					locations: [{
						params: { _status: 'active'},
						singular: true,
						cache: 0
					}]
				}

				expect(apiClient.composite.query).toHaveBeenCalledWith(expectedApiRequest)
				expect(response).toEqual({locationsA: {id:1}, locationsB: {id:2}})

				done()
			}, err => {
				done.fail(err)
			})
		})

		it('does not call the api when all queries are cached', (done) => {	
			let apiClient = apiMockFactory()
			spyOn(apiClient.composite, 'query').and.callThrough()

			let query = { 
				locationsC: Conductor.query('locations').params({ _status: ':status', alt: true}).one()
			}

			let params = { status: 'active'}
			
			Conductor.fetch(apiClient, query, params, options).then(response => {
				expect(apiClient.composite.query.calls.count()).toEqual(0);
				expect(response).toEqual({locationsC: {id:2}})

				done()
			}, err => {
				done.fail(err)
			})
		})

		// NOTE: the following can test cache expiration, but adds delay to the test run time...
		/*
		it('calls the api when a cached query has expired', (done) => {	
			let apiClient = apiMockFactory({locations: [{id:2}]})
			spyOn(apiClient.composite, 'query').and.callThrough()

			let query = { 
				locationsC: Conductor.query('locations').params({ _status: ':status', alt: true}).one().cache(5)
			}

			let params = { status: 'active'}

			setTimeout(() => {			
				Conductor.fetch(apiClient, query, params, options).then(response => {
					let expectedApiRequest = {
						locations: [{
							params: { _status: 'active', alt: true },
							singular: true,
							cache: 5000
						}]
					}

					expect(apiClient.composite.query).toHaveBeenCalledWith(expectedApiRequest)
					expect(response).toEqual({locationsC: {id:2}})

					done()
				}, err => {
					done.fail(err)
				})
			}, 6000)
			
		}, 10000)
		*/
	})

	it('executes a complex request in under 5ms', (done) => {

		let apiClient = apiMockFactory()
		let options = {
			cachePrefx: ''
		}

		let resources = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j']
		let query = {}

		for(var i = 0; i < 10; i++) {
			let r = 'resource' + i
			query[r] = [
				Conductor.query(r), 
				Conductor.query(r).params({a: true}),
				Conductor.query(r).params({a: false}),
				Conductor.query(r).params({a: true}).one(),
				Conductor.query(r).params({a: false}).one()
			]
		}

		let params = { status: 'active'}
		
		let start = +new Date();

		Conductor.fetch(apiClient, query, params, options).then(response => {
			let end = +new Date();
			let diff = end - start;

			expect(diff).toBeLessThan(5)

			debug('complex query duration', diff)
			
			done()
		}, err => {
			done.fail(err)
		})
	})
})