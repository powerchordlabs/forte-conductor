var Conductor = require('../src/');
var util = require('util');

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

  describe('getPlan method', function() {
    it('returns a plan with params, resource, and singular populated', function() {

      var q = Conductor.query('cartoons')
        .params({filter: 'cowboy', name: ':cowname'})
        .one()
        .getPlan({cowname: 'MONSTER'});

      expect(q).toEqual({
        resource: 'cartoons',
        plan: {
          singular: true,
          params: {
            filter: 'cowboy',
            name: 'MONSTER'
          }
        }
      });

      var q2 = Conductor.query('cartoons').getPlan();
      expect(q2).toEqual({
        resource: 'cartoons',
        plan: {
          singular: false,
          params: {}
        }
      });

      var q3 = Conductor.query().getPlan();
      expect(q3).toEqual({
        resource: null,
        plan: {
          singular: false,
          params: {}
        }
      });
    });
  });
})
