var Composer = require('../src/composer');

describe('Composer', function() {
  it('exists within the spec suite', function() {
    expect(typeof Composer).toEqual('function');
  });

  it(
    'transforms a server response into a composed response ready to be' +
    'passed as props to a root level component', function() {

      // Simulate a plan where two cartoon queries were requested. Both
      // queries have been requested by two components.
      var compositePlan = {
        composition: {
          cartoons: [
            {
              params: {},
              conduit: [
                ['screen', 'navigation', 'cartoonListMenuItems'],
                ['screen', 'main', 'cartoonList']
              ]
            }, {
              params: {coolest: true},
              conduit: [
                ['screen', 'navigation', 'coolestCartoon'],
                ['layout', 'coolestCartoon']
              ]
            },
          ]
        }
      };

      // Simulate the above query results returned by the server. In this case,
      // we return all the cartoons for the first query and only the coolest
      // of them for the second query which is definitly batman.
      var serverResponse = {
        cartoons: [
          [{cartoon: 'batman'}, {cartoon: 'superman'}, {cartoon: 'spiderman'}],
          {cartoon: 'batman'}
        ]
      };

      // The expected response for the above plan and response should be:
      var expectedComposition = {
        screen: {
          navigation: {
            cartoonListMenuItems: [
              {cartoon: 'batman'},
              {cartoon: 'superman'},
              {cartoon: 'spiderman'}
            ],
            coolestCartoon: {cartoon: 'batman'}
          },
          main: {
            cartoonList: [
              {cartoon: 'batman'},
              {cartoon: 'superman'},
              {cartoon: 'spiderman'}
            ]
          }
        },
        layout: {
          coolestCartoon: {cartoon: 'batman'}
        }
      };

      var compisition = Composer(compositePlan, serverResponse);
      expect(compisition).toEqual(jasmine.any(Object));
      expect(compisition).toEqual(expectedComposition);
    });
})
