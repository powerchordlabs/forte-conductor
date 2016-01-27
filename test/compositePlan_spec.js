import Conductor from '../src/index'
import CompositePlan from '../src/compositePlan'

describe('CompositePlan', function() {
  describe('parseQuery method', function() {
    it('given nothing returns null.', function() {
      var plan = CompositePlan();
      expect(plan).toBe(null);
    });

    it('returns null given an empty object.', function() {
      var plan = CompositePlan({});
      expect(plan).toBe(null);
    });

    it('returns null given an an unpopulated object',
    function() {
      var plan = CompositePlan({});
      expect(plan).toBe(null);
    });

    it('returns null given an populated object void of any queries',
    function() {
      var plan = CompositePlan({a: {}, b: {}});
      expect(plan).toBe(null);
    });

    it(
      'returns a plan organized by the requested resource, without params ' +
      'defined, and with a conduit populated using the query key name ' +
      'whem given a object composed of a single query.', function() {
      var query = Conductor.query('cartoons');
      var plan = CompositePlan({foobar: query}).composition;

      expect(plan.cartoons).toEqual(jasmine.any(Array));
      expect(plan.cartoons.length).toBe(1);
      expect(plan.cartoons[0]).toEqual(jasmine.objectContaining({
        plan: {params: {}, singular: false, cache: 0},
        conduit: [ ['foobar'] ],
      }));
    });

    it(
      'deduplicates the query in the returned plan without loosing track of ' +
      'the two different composition paths when given two queries that are ' +
      'exactly the same except for their desired composition.', function() {
        var qA = Conductor.query('cartoons');
        var qB = Conductor.query('cartoons').params({});
        var plan = CompositePlan({
          a: qA,
          b: qB,
        }).composition;

        var expected = {
          plan: {params: {}, singular: false, cache: 0},
          conduit: [ ['a'], ['b'] ],
        };

        expect(plan.cartoons).toEqual(jasmine.any(Array));
        expect(plan.cartoons.length).toBe(1);
        expect(plan.cartoons[0]).toEqual(jasmine.objectContaining(expected));
      }
    );

    it(
      'records composition needs in the conduit array when given a complex ' +
      'composition of queries that requires recording multiple queries and ' +
      'with some deduplication.', function() {
        // Duplicate queries
        var CartoonQuery1Version1 = Conductor.query('cartoons').params({top: 10});
        var CartoonQuery1Version2 = Conductor.query('cartoons').params({top: 10});

        var CartoonQuery2 = Conductor.query('cartoons').params({top: 10, old: true});
        var CartoonQuery3 = Conductor.query('cartoons').params({top: 5, color: false});

        var ThrillerQuery = Conductor.query('thriller').params({top: 10});

        var p = CompositePlan({
          layout: {
            nested: {
              deeplyNested: {
                cartoons: CartoonQuery1Version1,
                blackAndWhite: CartoonQuery3
              }
            }
          },
          screen: {
            cartoons: CartoonQuery1Version2,
            oldCartoons: CartoonQuery2,
            thrillers: ThrillerQuery,
          },
        });

        let plan = p.composition;

        // How many resources?
        expect(Object.keys(plan).length).toEqual(2);
        // Resource should be an array of queries
        expect(plan.cartoons).toEqual(jasmine.any(Array));
        expect(plan.thriller).toEqual(jasmine.any(Array));

        // How many queries did we make for cartoons?
        expect(plan.cartoons.length).toBe(3);
        expect(plan.thriller.length).toBe(1);

        expect(plan.thriller).toEqual(jasmine.objectContaining([{
          plan: {params: {top: 10}, singular: false, cache: 0},
          conduit: [ ['screen', 'thrillers'] ],
        }]));

        expect(plan.cartoons).toEqual(jasmine.objectContaining([{
          // Deduplicate the queries
          //
          // Above, we asked for this same exact thing twice
          // The request exists only once but the conduit records the
          // two seperate requests.
          plan: {params: {top: 10}, singular: false, cache: 0},
          conduit: [
            ['layout', 'nested', 'deeplyNested', 'cartoons'],
            ['screen', 'cartoons']
          ]
        }, {
          plan: {params: {top: 5, color: false}, singular: false, cache: 0},
          conduit: [['layout', 'nested', 'deeplyNested', 'blackAndWhite']]
        }, {
          plan: {params: {top: 10, old: true}, singular: false, cache: 0},
          conduit: [ [ 'screen', 'oldCartoons' ] ]
        }]));
      }
    );

    it(
      'returns a plan that has populated dynnamic params when given a ' +
      'query that requires dynamic params to be hydrated and values ' +
      'are passed to the CompositePlan constructor.', function() {
        var q = Conductor.query('cartoons').params({name: ':dynamic'});
        var plan = CompositePlan(
          {query: q}, // query
          {dynamic: 'x-men'} // values
        ).composition;

        expect(plan.cartoons).toEqual(jasmine.any(Array));
        expect(plan.cartoons.length).toBe(1);
        expect(plan.cartoons[0]).toEqual(jasmine.objectContaining({
          plan: {params: {name: 'x-men'}, singular: false, cache: 0},
          conduit: [['query']],
        }));
      }
    );

    describe('returns a plan built using deeply nested queries', function() {
      //
      // The following composition of queries...
      //
      var q = {
        screen: {
          productCategoryList: Conductor.query('product-categories').params({isRoot: true}).cache(5)
        },
        layout: {
          footer: {
            news: Conductor.query('content').params({key: 'news'}).one(),
            newsletter: Conductor.query('content').params({key: 'newsletter'}).one(),
            primaryLocation: Conductor.query('locations').params({isPimary: true}).one(),
          },
          header: {
            primaryNavigation: {
              locations:  Conductor.query('locations'),
              productCateogyList: Conductor.query('product-categories').params({isRoot: true}),
            }
          }
        }
      };
      //
      // Should result in plan composition such as...
      //
      var expectedComposition = {
        'product-categories': [
          {
            plan: {params: {isRoot: true}, singular: false, cache: 5000},
            conduit: [
              ['screen', 'productCategoryList'],
            ]
          },
          {
            plan: {params: {isRoot: true}, singular: false, cache: 0},
            conduit: [
              ['layout', 'header', 'primaryNavigation', 'productCateogyList']
            ]
          }
        ],
        content: [{
          plan: {params: {key: 'news'}, singular: true, cache: 0},
          conduit: [['layout', 'footer', 'news']]
        }, {
          plan: {params: {key: 'newsletter'}, singular: true, cache: 0},
          conduit: [['layout', 'footer', 'newsletter']]
        }],
        locations: [{
          plan: {params: {isPimary: true}, singular: true, cache: 0},
          conduit: [['layout', 'footer', 'primaryLocation']]
        }, {
          plan: {params: {}, singular: false, cache: 0},
          conduit: [['layout', 'header', 'primaryNavigation', 'locations']]
        }]
      };

      var plan = CompositePlan(q);

      it('and has a plan with two properties', function(){
        expect(Object.keys(plan).length).toBe(2);
      })

      it('and has a plan with a composition property', function(){
        expect(typeof plan.composition).toBe('object');
      })

      it('and has a plan with a request property', function(){
        expect(typeof plan.request).toBe('object');
      })

      it('and has the expected composition structure', function(){
        var composition = plan.composition;
        //console.log('composition:', JSON.stringify(composition))
        //console.log('expectedComposition:', JSON.stringify(expectedComposition))
        expect(composition).toEqual(jasmine.objectContaining(expectedComposition));
      })

    });

    it('returns a plan with hydrated using the dynamic values passed in ' +
      'rather than caching previous values or reusing the same query ' +
      'object over and over.', function() {

        // Perform one query
        var q1 = {screen: {a: Conductor.query('dogs').params({dogName: ':dogname'})}};

        var paramRefA = q1.screen.a.getParams();
        var plan1 = CompositePlan(q1, {dogname: 'sansa'});

        // We should have a reference to the same param object after hydrating.
        expect(paramRefA === q1.screen.a.getParams()).toBe(true);

        // The params should no change when hydrated. This is import since
        // the params are stored in a query that is essentially a singleton
        // and cached for the life of the component.
        expect(q1.screen.a._params).toEqual(jasmine.objectContaining({dogName: ':dogname'}));
        expect(plan1.request).toEqual(jasmine.objectContaining({
          dogs: [{
            params: {dogName: 'sansa'},
            singular: false,
            cache: 0
          }]
        }));

        // Perform the same exact query but with new object references and
        // we'll pass in unique values when we hydrate the query.
        var q2 = {screen: {a: Conductor.query('dogs').params({dogName: ':dogname'})}};

        // Verify we do not have a reference to the same query object
        expect(q1.screen.a === q2.screen.a).toBe(false);

        // Is the second query dehydrated?
        expect(q2.screen.a._params).toEqual(jasmine.objectContaining({dogName: ':dogname'}));

        // Hydrate the second query with a different value
        var plan2 = CompositePlan(q2, {dogname: 'misu'});
        expect(q2.screen.a._params).toEqual(jasmine.objectContaining({dogName: ':dogname'}));

        // Assert our second query was hydrated with the second value
        expect(plan2.request).toEqual(jasmine.objectContaining({
          dogs: [{
            params: {dogName: 'misu'},
            singular: false,
            cache: 0
          }]
        }));
      }
    );
  });
});
