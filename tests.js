var util = require('util'),
  Heavens = require('./index.js'),
  assert = require('assert');


// get an API client
var heavens = new Heavens({ });

heavens.passes('iss', { lat: 48.68915, lng: 6.13312, tz: 'CET', alt: 0 }, function(error, passes){

  console.log(util.inspect(passes));

});

