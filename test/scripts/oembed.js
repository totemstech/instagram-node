var fwk = require('fwk');
var cfg = fwk.populateConfig(require('../../config.js').config);
var instagram = require('../../lib/instagram.js').instagram();

instagram.use({
  access_token: cfg['INSTAGRAM_ACCESS_TOKEN']
});

/**
 * Some test about media features
 */
var oembed = (function(spec, my) {
  var _super = {};
  my = my || {};

  // public
  var todo;

  // private

  var that = require('../test_base.js').test_base({ name: 'oembed' });

  todo = function() {
    var tests = {
      'oembed retrieve': function(cb_) {
        var retry = 0;
        instagram.oembed('http://instagram.com/p/RdoIkdTUay/', {omitscript: true, hidecaption: true, maxwidth: 640}, function(err, result, remaining, limit) {
          var res = {
            ok: true,
            description: 'Retrieve oEmbed data'
          };
          if(result) {
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

oembed.launch();
