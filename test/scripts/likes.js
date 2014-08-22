var fwk = require('fwk');
var cfg = fwk.populateConfig(require('../../config.js').config);
var instagram = require('../../lib/instagram.js').instagram();

instagram.use({
  access_token: cfg['INSTAGRAM_ACCESS_TOKEN']
});

/**
 * Some test about likes features
 */
var likes = (function(spec, my) {
  var _super = {};
  my = my || {};

  // public
  var todo;

  // private

  var that = require('../test_base.js').test_base({ name: 'likes' });

  todo = function() {
    var tests = {
      'likes': function(cb_) {
        var retry = 0;
        instagram.likes('318869204166248215_33082304', function(err, result, remaining, limit) {
          var res = {
            ok: true,
            description: 'Retrieves likes'
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
      'add like': function(cb_) {
        var retry = 0;
        instagram.add_like('318869204166248215_33082304', function(err, remaining, limit) {
          var res = {
            ok: true,
            description: 'Add a like'
          };

          if(!err && remaining) {
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
      'del like': function(cb_) {
        var retry = 0;
        instagram.del_like('318869204166248215_33082304', function(err, remaining, limit) {
          var res = {
            ok: true,
            description: 'Delete a like'
          };
          
          if(!err && remaining) {
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

likes.launch();
