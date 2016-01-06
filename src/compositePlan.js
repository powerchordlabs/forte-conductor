module.exports = CompositePlan;
/**
 * CompositeDataPlan computes a plan that can be sent to the server to obtain
 * multiple resources via a composite API. The generated plan deduplicates
 * queries requested multiple times without loosing track of which components
 * requested that data.
 *
 * @param {ConductorQuery|object} A single ConductorQuery, or an object that
 * contains conductor queries.
 * @param {?object} An object containing values which will be used to hydrate
 * any dynamic params in a ConductorQuery.
 * @returns {object|null} An object containing a request which can be executed by a
 * composite API and instructions on how to compose the response into the format
 * requeted by the composition of components. Returns null if a compositionPlan
 * could not be generated.
 **/
function CompositePlan(conductorQuery, values) {
  if (!conductorQuery
    || typeof conductorQuery != 'object'
    || Object.keys(conductorQuery).length == 0) {
    return null;
  }

  var compositionPlan = parseQuery(conductorQuery, values, {}, []);
  if (!compositionPlan || compositionPlan == null || Object.keys(compositionPlan).length == 0) {
    return null;
  }
  var compositeRequest = parseCompositeRequest(compositionPlan);

  return {
    composition: compositionPlan,
    request: compositeRequest,
  };
};

/**
 * ParseCompositeRequest builds a request that can be sent to a server which
 * can build a composite response.
 * @param  {object} compositionPlan The results of the parseQuery method.
 * @return {object} compositeRequest Instructions for a server's
 * composite API handler.
 */
function parseCompositeRequest(compositionPlan) {
  var compositeRequest = {};

  for (var resource in compositionPlan) {
    var resourceQueries = compositionPlan[resource];
    if (resourceQueries.length == 0) {
      continue;
    }

    compositeRequest[resource] = [];
    for (var i in resourceQueries) {
      var q = resourceQueries[i];
      compositeRequest[resource].push(q.plan);
    }
  }

  return compositeRequest;
}

/**
 * ParseQuery builds a plan from a query or an object containing queries.
 * The computed plan is an object where the keys are names of resources and
 * the values are an array representing unique queries. Each query maintains
 * a list of what component requested the data--called a conduit. A conduit
 * allows the data to be composed as it is needed without duplicating a query
 * on the server or duplicating data transmitted over the wire.
 *
 * For example, if two components request the same resource with the same params
 * they actually both need the same set of data. The plan will dedup these
 * queries, save both components by composition path, and return the plan.
 *
 * @param {ConductorQuery|object} A single ConductorQuery, or an object that
 * contains conductor queries.
 * @param {?object} An object containing values which will be used to hydrate
 * any dynamic params in a ConductorQuery.
 * @param {?CompositeDataPlan} An existing CompositeDataPlan which will be used
 * if provided allowing recusive generation of plans. Generally, this param
 * should not be provided by a external caller.
 */
function parseQuery(conductorQuery, values, CompositePlan, conduit) {

  if (!conductorQuery || typeof conductorQuery != "object") {
    return null;
  }

  var values = values || {};
  var plan = CompositePlan || {};
  var conduit = (conduit) ? conduit.slice() : [];
  var entryConduit = conduit.slice();

  for (var k in conductorQuery) {
    var query = conductorQuery[k];
    if (!query || query == null) {
      continue;
    }

    // If we're not iterating over a query we've been given
    // an object that composes queries and we'll recursivly
    // iterate over them.
    var isQuery = query.hasOwnProperty('_resource');

    if (!isQuery) {
      // Breakoff a new array and push our key into it
      // so each iteration of the loop has the same starting point
      var conduitArg = conduit.slice();
      conduitArg.push(k);

      parseQuery(query, values, plan, conduitArg);
      continue;
    }

    // Now that we're confident we're evaluating a query we can
    // evaluate to avoid duplicate queries and ultimitly register any
    // new queries we come across and update the conduit for any duplicates.
    var queryPlan = query.getPlan(values);
    var resource = queryPlan.resource;

    // If this resource has not yet been observed we can quit early.
    if (!plan[resource]) {
      plan[resource] = [];
      conduit.push(k);
      addNewResourcePlan(plan, queryPlan, conduit);
      var conduit = entryConduit.slice();
      continue;
    }

    // We already have processed at least one query for this resource. Lets'
    // determine if the current query is unique. If we find the query is
    // unique for this resource we'll add it. If a duplicate we'll
    // simply add the current conduit.
    var existingResourcePlans = plan[resource];

    var duplicate = false;
    for (var i in existingResourcePlans) {
      var existingPlan = existingResourcePlans[i];
      if (shallowEqual(existingPlan.plan, queryPlan.plan)) {
        duplicate = true;
        conduit.push(k);
        existingPlan.conduit.push(conduit.slice());
        var conduit = entryConduit.slice();
        break;
      }
    }

    if (!duplicate) {
      conduit.push(k);
      addNewResourcePlan(plan, queryPlan, conduit);
      conduit = entryConduit.slice();
    }
  }

  if (Object.keys(plan).length == 0) {
    return null;
  }

  return plan;
}

/**
* AddNewResourcePlan adds a new processed query to an existing resource in
* the plan.
* @param {object} the plan to add the query's resource to
* @param {object} a queryPlan returned by ConductorQuery.getPlan()
* @param {array} the composition path the data was requested from.
* @returns {void}
**/
function addNewResourcePlan(plan, queryPlan, conduit) {
  plan[queryPlan.resource].push({
    plan: queryPlan.plan,
    conduit: [conduit.slice()]
  });
}

/**
 * ShallowEqual performs a comparison of two objects and returns true if they
 * have the same structure and values. The evaluation is shallow in that we
 * don't care if the objects are the same in memory, just that they look
 * like they are the same objects.
 * @param  {object} objA
 * @param  {object} objB
 * @return {boolean} True if the objects are the same.
 */
function shallowEqual(objA, objB) {
  if (objA === objB) {
    return true;
  }

  var keysA = Object.keys(objA);
  var keysB = Object.keys(objB);

  if (keysA.length !== keysB.length) {
    return false;
  }

  // Test for A's keys different from B.
  var bHasOwnProperty = Object.prototype.hasOwnProperty.bind(objB);
  for (var i = 0; i < keysA.length; i++) {
    // We can quit if A's key is not in B
    if (!bHasOwnProperty(keysA[i])) {
      return false;
    }
    // If A's key is an object, recursivly check it
    if (typeof objA[keysA[i]] == 'object') {
      if (!shallowEqual(objA[keysA[i]], objB[keysA[i]])) {
        return false;
      }
      continue;
    }
    // A's key is not an object, so let's make sure the values are the same.
    if (objA[keysA[i]] !== objB[keysA[i]]) {
      return false;
    }
  }

  return true;
}
