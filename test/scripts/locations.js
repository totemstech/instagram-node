var fwk = require('fwk');
var cfg = fwk.populateConfig(require('../../config.js').config);
var instagram = require('../../lib/instagram.js').instagram();

instagram.use({
  access_token: cfg['INSTAGRAM_ACCESS_TOKEN']
});

/**
 * Some test about locations features
 */
var locations = (function(spec, my) {
  var _super = {};
  my = my || {};

  // public
  var todo;

  // private

  var that = require('../test_base.js').test_base({ name: 'locations' });

  todo = function() {
    var tests = {
      'location': function(cb_) {
        var retry = 0;
        instagram.location('7351364', function(err, result, remaining, limit) {
          var res = {
            ok: true,
            description: 'Retrieves a location'
          };

          if(result && remaining) {
            return cb_(null, res);
          } else {
            if(retry < 2) {
              that.retry(res.description, ++retry);
              err.retry();
            } else {
              res.ok = false;
              return cb_(null, res);
            }
          }
        });
      },
      'location search': function(cb_) {
        var retry = 0;
        instagram.location_search({ lat: 48.858831776042265, lng: 2.3470598999999766, distance: 5000 }, function(err, result, remaining, limit) {
          var res = {
            ok: true,
            description: 'Search a location'
          };
          
          if(result && remaining) {
            return cb_(null, res);
          } else {
            if(retry < 2) {
              that.retry(res.description, ++retry);
              err.retry();
            } else {
              res.ok = false;
              return cb_(null, res);
            }
          }
        });
      },
      'location media recent': function(cb_) {
        var retry = 0;
        instagram.location_media_recent('7351364', function(err, result, remaining, limit) {
          var res = {
            ok: true,
            description: 'Retrieves location recent medias'
          };
          
          if(result && remaining) {
            return cb_(null, res);
          } else {
            if(retry < 2) {
              that.retry(res.description, ++retry);
              err.retry();
            } else {
              res.ok = false;
              return cb_(null, res);
            }
          }
        });
      }
    };

    return tests;
  };

  fwk.method(that, 'todo', todo, _super);

  return that;
})({});

locations.launch();