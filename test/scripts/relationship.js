var fwk = require('fwk');
var cfg = fwk.populateConfig(require('../../config.js').config);
var instagram = require('../../lib/instagram.js').instagram();

instagram.use({
  access_token: cfg['INSTAGRAM_ACCESS_TOKEN']
});

/**
 * Some test about relationship features
 */
var relationships = (function(spec, my) {
  var _super = {};
  my = my || {};

  // public
  var todo;

  // private

  var that = require('../test_base.js').test_base({ name: 'relationships' });

  todo = function() {
    var tests = {
      'follows': function(cb_) {
        var retry = 0;
        instagram.user_follows('33082304', function(err, result, remaining, limit) {
          var res = {
            ok: true,
            description: 'Retrieves follows'
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
      'followers': function(cb_) {
        var retry = 0;
        instagram.user_followers('33082304', function(err, result, remaining, limit) {
          var res = {
            ok: true,
            description: 'Retrieves followers'
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
      'request': function(cb_) {
        var retry = 0;
        instagram.user_self_requested_by(function(err, result, remaining, limit) {
          var res = {
            ok: true,
            description: 'Retrieves requested-by'
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
      'relationship': function(cb_) {
        var retry = 0;
        instagram.user_relationship('33082302', function(err, result, remaining, limit) {
          var res = {
            ok: true,
            description: 'Retrieves relationship'
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

relationships.launch();
