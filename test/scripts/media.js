var fwk = require('fwk');
var cfg = fwk.populateConfig(require('../../config.js').config);
var instagram = require('../../lib/instagram.js').instagram();

instagram.use({
  access_token: cfg['INSTAGRAM_ACCESS_TOKEN']
});

/**
 * Some test about media features
 */
var medias = (function(spec, my) {
  var _super = {};
  my = my || {};

  // public
  var todo;

  // private

  var that = require('../test_base.js').test_base({ name: 'medias' });

  todo = function() {
    var tests = {
      'media': function(cb_) {
        var retry = 0;
        instagram.media('314584059748370098_2104944', function(err, result, remaining, limit) {
          var res = {
            ok: true,
            description: 'Retrieves a media'
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
      'media search': function(cb_) {
        var retry = 0;
        instagram.media_search(48.858831776042265, 2.3470598999999766, { distance: 5000 }, function(err, result, remaining, limit) {
          var res = {
            ok: true,
            description: 'Search medias'
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
      'media popular': function(cb_) {
        var retry = 0;
        instagram.media_popular(function(err, result, remaining, limit) {
          var res = {
            ok: true,
            description: 'Retrieves popular medias'
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

medias.launch();
