import Conductor from '../src/'

describe('Conductor', () => {
  it('exists within the spec suite', () => {
    expect(Conductor).toEqual(jasmine.any(Object));
  });

  it('can create a query without defining a resource', () => {
    var q = Conductor.query();

    expect(q).toEqual(jasmine.any(Object));
    expect(q.hasOwnProperty('_resourceDefined')).toBe(true);
    expect(q._resourceDefined).toBe(false);
  });

  it('can create a query with a defined resource', () => {
    var q = Conductor.query('cartoons');

    expect(typeof q).toBe('object');
    expect(q.hasOwnProperty('_resourceDefined')).toBe(true);
    expect(q._resourceDefined).toBe(true);
    expect(q._resource).toBe('cartoons');
  });
})
