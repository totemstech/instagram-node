var fwk = require('fwk');
var cfg = fwk.populateConfig(require('../../config.js').config);
var instagram = require('../../lib/instagram.js').instagram();

instagram.use({
  access_token: cfg['INSTAGRAM_ACCESS_TOKEN']
});

/**
 * Some test about tag feature
 */
var tags = (function(spec, my) {
  var _super = {};
  my = my || {};

  // public
  var todo;

  // private

  var that = require('../test_base.js').test_base({ name: 'tags' });

  todo = function() {
    var tests = {
      'tag info': function(cb_) {
        var retry = 0;
        instagram.tag('test', function(err, result, remaining, limit) {
          var res = {
            ok: true,
            description: 'Retrieves informations about a tag'
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
      'tag search': function(cb_) {
        var retry = 0;
        instagram.tag_search('test', function(err, result, remaining, limit) {
          var res = {
            ok: true,
            description: 'Search a tag'
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
      'tag media recent': function(cb_) {
        var retry = 0;
        instagram.tag_media_recent('test', function(err, result, remaining, limit) {
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

      'tag info (cyrillic symbols)': function(cb_) {
        var retry = 0;
        instagram.tag('тест', function(err, result, remaining, limit) {
          var res = {
            ok: true,
            description: 'Retrieves informations about a tag (with cyrillic symbols)'
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
      'tag search (cyrillic symbols)': function(cb_) {
        var retry = 0;
        instagram.tag_search('тест', function(err, result, remaining, limit) {
          var res = {
            ok: true,
            description: 'Search a tag (with cyrillic symbols)'
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
      'tag media recent (cyrillic symbols)': function(cb_) {
        var retry = 0;
        instagram.tag_media_recent('тест', function(err, result, remaining, limit) {
          var res = {
            ok: true,
            description: 'Retrieves recent medias (with cyrillic symbols)'
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

tags.launch();
