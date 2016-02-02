import time from '../src/time'

describe('time', function() {
  it('exports interval props', function() {
    expect(time).toEqual(jasmine.any(Object));
    expect(time.milliseconds).toEqual(1)
    expect(time.seconds).toEqual(1000)
    expect(time.minutes).toEqual(60000)
    expect(time.hours).toEqual(3600000)
  });
})
