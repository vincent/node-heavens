var request = require('request');
var cheerio = require('cheerio');
var util = require('util');

/**
* H-A client class
* Use it with 
* var client = new Heavens({ })
*
* @param {Object} settings A settings object
* @return object An instanciated Heavens class
*/
var Heavens = function(settings) {
  this.debug = settings.debug;
  this.base_url = 'http://www.heavens-above.com';
  this.retry = settings.retry || false;
};

module.exports = Heavens;

Heavens.satellites = {
  'iss': '25544'
};

Heavens.prototype.passes = function(satname, params, callback) {
  params = params || {};

  params.satid = Heavens.satellites[satname];

  if (!params.satid) {
    throw 'You must provide a valid satellite name';
  }

  var self = this;
  var jar = request.jar();

  // acquire a first state (asp form shit and all)
  var r = request({
    url: self.base_url + '/PassSummary.aspx',
    method: 'GET',
    qs: params,
    jar: jar
  }, function(error, response, body){
    if (error) {
      return callback(error, null);
    }

    var $ = cheerio.load(body);

    var initial_form_data = {};
    $('form input').each(function(i, input){
      initial_form_data[input.attribs.name] = input.attribs.value;
    });

    var r = request({
      url: self.base_url + '/PassSummary.aspx',
      method: 'POST',
      form: initial_form_data,
      jar: jar
    }, function(error, response, body){
      if (error) {
        return callback(error, null);
      }

      var $ = cheerio.load(body);

      var passes = $('form .standardTable .clickableRow').map(function(i, row){
        row = $(this).find('td').map(function(j, cell){
          cell = $(cell);
          var link = cell.find('a');
          if (link.length === 1) {
            return [ cell.text(), link[0].attribs.href ];
          } else {
            return cell.text();
          }
        });
        return {
          date: row[0][0],
          track: self.base_url + '/' + row[0][1],
          brightness: row[1],
          start: {
            time: row[2],
            elevation: row[3],
            azimuth: row[4]
          },
          highest: {
            time: row[5],
            elevation: row[6],
            azimuth: row[7]
          },
          end: {
            time: row[8],
            elevation: row[9],
            azimuth: row[10]
          },
          type: row[11]
        };
      });

      callback(null, passes);
    });
  });
};