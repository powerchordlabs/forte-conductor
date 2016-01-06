module.exports = Composition;

/**
 * Composition transforms a composite server response into the structure
 * needed by the components.
 * @param {Conductor.CompositePlan} conductorPlan   The CompositePlan
 * as it was sent to the server.
 * @param {object} compositeData A composite of resources returned by the
 * server when given the CompositePlan.
 * @returns {object} The composite data reformed into the composition as
 * desired by the CompositePlan.
 */
function Composition(CompositePlan, compositeData) {
  if (!CompositePlan.composition) {
    throw new Error('CompositePlan is missing composition key.');
  }

  // TODO: There is no validation to ensure the serverResponse actually
  // has the values requested right now.

  var results = {};

  for (var resource in CompositePlan.composition) {
    var resourceQueries = CompositePlan.composition[resource];

    for (var i in resourceQueries) {
      var query = resourceQueries[i];
      for (var ii in query.conduit) {
        var conduit = query.conduit[ii];
        nestResults(results, conduit, compositeData[resource][i]);
      }
    }
  }

  return results;
};

/**
 * NestResults iterates over the provided keys, nesting each key, and finally
 * setting the provided value into the last key in the array.
 * @param  {object} map   The map the value should be nested into.
 * @param  {array} keys   An array of keys to nest the value with.
 * @param  {} value       The value to set into the deepest key.
 * @return {object}       Returns the map param.
 */
function nestResults(map, keys, value) {
  var key = keys[0];

  if (keys.length == 1) {
    map[key] = value;
    return map;
  }

  if (!map[key]) {
    map[key] = {};
  }
  return nestResults(map[key], keys.slice(1), value);
}
