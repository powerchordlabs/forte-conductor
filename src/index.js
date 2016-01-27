var ConductorQuery = require('./conductorQuery');
var CompositePlan = require('./compositePlan');
var Composer = require('./composer');

module.exports = new Conductor();

function Conductor() {};

/**
 * Query returns a new ConductorQuery.
 * @class Conductor.ConductorQuery.
 * @param {string} Name of data resource.
 */
Conductor.prototype.query = function(resource) {
  return new ConductorQuery(resource);
}

/**
 * Query returns a new ConductorQuery.
 * @param {ReactComponent|object} component A ReactComponent that may have had
 * a query registered in statics, or an object with a query property.
 * @return {Conductor.ConductorQuery|object|null} The value of the query
 * property in the provided component, or null.
 */
Conductor.prototype.getQuery = function(component) {
  if (!component || !component.query) {
    return null;
  }
  return component.query;
}

/**
 * Parse a query into a plan the composite API can process.
 * @param {ConductorQuery|object} conductorQuery A Conductor.ConductorQuery or
 * an object containing several ConductorQueries.
 * @param {?object} An object containing values which will be used to hydrate
 * any dynamic params in a ConductorQuery.
 * @return {Conductor.CompositePlan} A Conductor.CompositePlan that can be
 * processed by the server.
 */
Conductor.prototype.parseQuery = function(conductorQuery, values) {
  return CompositePlan(conductorQuery, values);
}

/**
* ComposeResponse duplicates by reference the data returned by the server into
* a structure that represents the composition needs of the components that
* requested the data. The computed result is based on the conduit paths
* in the provided CompositePlan. The resulting data structure is inflated
* compared to the CompositePlan that was executed on the server.
*
* @param {object} Conductor.CompositePlan that was sent to the server.
* @param {object} compositeData data provided by server for the CompositePlan.
* @returns {object} Conductor.Composition composed data ready for the requesting components.
**/
Conductor.prototype.composeResponse = function(CompositePlan, compositeData) {
  return Composer(CompositePlan, compositeData);
}
