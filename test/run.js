var Jasmine = require('jasmine');
var jasmineReporters = require('jasmine-reporters');
var noop = function() {};

var junitReporter = new jasmineReporters.JUnitXmlReporter({
  savePath: './test-reports',
  consolidateAll: false,
});

var jrunner = new Jasmine();
jasmine.getEnv().addReporter(junitReporter);
jrunner.loadConfigFile();                           // load jasmine.json configuration
jrunner.execute();
