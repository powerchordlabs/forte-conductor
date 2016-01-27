var Conductor = require('../src/');
var util = require('util');
var time = require('../src/time')

describe('ConductorQuery', function() {

  it('can be constructed without a resource', function() {
    var q = Conductor.query();

    expect(q).toEqual(jasmine.any(Object));
    expect(q.hasOwnProperty('_resourceDefined')).toBe(true);
    expect(q._resourceDefined).toBe(false);
  });

  it('can be constructed with a resource', function() {
    var q = Conductor.query('cartoons');

    expect(q).toEqual(jasmine.any(Object));
    expect(q.hasOwnProperty('_resourceDefined')).toBe(true);
    expect(q._resourceDefined).toBe(true);
  });

  describe('one method', function() {
    it('does not assume it was called', function() {
      var q = Conductor.query('cartoons');
      expect(q.hasOwnProperty('_singular')).toBe(true);
      expect(q._singular).toBe(false);
    });

    it('remembers it was called via _singular', function() {
      var q = Conductor.query('cartoons').one();
      expect(q.hasOwnProperty('_singular')).toBe(true);
      expect(q._singular).toBe(true);
    });
  });

  describe('params method', function() {
    it('allows params to be set on a query', function() {
      var q = Conductor.query('cartoons').params({a: 1});
      expect(q.hasOwnProperty('_params')).toBe(true);

      expect(q._params).toEqual(jasmine.objectContaining({a: 1}));
    });
  });

  describe('cache method', function() {
    it('allows cache to be set on a query', function() {
      var q = Conductor.query('cartoons').cache(5, time.seconds);
      expect(q.hasOwnProperty('_cacheMilliseconds')).toBe(true);

      expect(q._cacheMilliseconds).toEqual(5000);
    });

    it('defaults interval to seconds', function() {
      var q = Conductor.query('cartoons').cache(5);
      expect(q.hasOwnProperty('_cacheMilliseconds')).toBe(true);

      expect(q._cacheMilliseconds).toEqual(5000);
    });

    var validCacheTests = [
      { settings: [5], expected: 5000 },
      { settings: [5, time.milliseconds], expected: 5 },
      { settings: [5, time.seconds], expected: 5000 },
      { settings: [5, time.minutes], expected: 300000 },
      { settings: [5, time.hours], expected: 18000000 },
    ]    

    validCacheTests.forEach(function(test){    
      it('sets cache in milliseconds according to specifed interval', function() {
        var q = Conductor.query('cartoons')
        
        // for chained methods we need to pass the instance to apply...
        q = q.cache.apply(q, test.settings);

        expect(q._cacheMilliseconds).toEqual(test.expected);
      });
    })

    var invalidCacheSettings = [
      ['5'],
      ['5', '5'],
      [5, '5'],
    ]

    invalidCacheSettings.forEach(function(settings){
      it('applies 0 cache setting when args are invalid', function() {
        var q = Conductor.query('cartoons')
        
        // for chained methods we need to pass the instance to apply...
        q = q.cache.apply(q, settings);
        
        expect(q.hasOwnProperty('_cacheMilliseconds')).toBe(true);

        expect(q._cacheMilliseconds).toEqual(0);
      });
    })
  });

  describe('getPlan method', function() {
    it('returns a plan with params, resource, cache, and singular populated', function() {

      var q = Conductor.query('cartoons')
        .params({filter: 'cowboy', name: ':cowname'})
        .one()
        .cache(5)
        .getPlan({cowname: 'MONSTER'});

      expect(q).toEqual({
        resource: 'cartoons',
        plan: {
          singular: true,
          params: {
            filter: 'cowboy',
            name: 'MONSTER'
          },
          cache: 5000
        }
      });

      var q2 = Conductor.query('cartoons').getPlan();
      expect(q2).toEqual({
        resource: 'cartoons',
        plan: {
          singular: false,
          params: {},
          cache: 0
        }
      });

      var q3 = Conductor.query().getPlan();
      expect(q3).toEqual({
        resource: null,
        plan: {
          singular: false,
          params: {},
          cache: 0
        }
      });
    });
  });
})
