var fwk = require('fwk');
var cfg = fwk.populateConfig(require('../../config.js').config);
var instagram = require('../../lib/instagram.js').instagram();

instagram.use({
  access_token: cfg['INSTAGRAM_ACCESS_TOKEN']
});

/**
 * Some test about users features
 */
var users = (function(spec, my) {
  var _super = {};
  my = my || {};

  // public
  var todo;

  // private

  var that = require('../test_base.js').test_base({ name: 'users' });

  todo = function() {
    var tests = {
      'user': function(cb_) {
        var retry = 0;
        instagram.user('33082304', function(err, result, remaining, limit) {
          var res = {
            ok: true,
            description: 'Retrieves informations about a user'
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
      'user feed': function(cb_) {
        var retry = 0;
        instagram.user_self_feed({ count: 3 }, function(err, result, pagination, remaining, limit) {
          var res = {
            ok: true,
            description: 'Retrieves the feed'
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
      'user media recent': function(cb_) {
        var retry = 0;
        instagram.user_media_recent('33082304', { count: 3 }, function(err, result, pagination, remaining, limit) {
          var res = {
            ok: true,
            description: 'Retrieves recent medias'
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
      'user self liked': function(cb_) {
        var retry = 0;
        instagram.user_self_liked({ count: 3 }, function(err, result, remaining, limit) {
          var res = {
            ok: true,
            description: 'Retrieves liked medias'
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
      'user search': function(cb_) {
        var retry = 0;
        instagram.user_search('xn1t0x', function(err, result, remaining, limit) {
          var res = {
            ok: true,
            description: 'Search a user'
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

users.launch();
