var fwk = require('fwk');
var instagram = require('../../lib/instagram').instagram();
var cfg = fwk.populateConfig(require('../../config.js').config);

instagram.use({
  client_id: '1234',
  client_secret: 'abcd'
});

/**
 * Authorization (Primitive) Unit Tests.
 */
var auth = (function(spec, my) {
  var _super = {};
  my = my || {};

  // public
  var todo;

  // private

  var that = require('../test_base.js').test_base({ name: 'auth' });

  todo = function() {
    var tests = {
      'get authorization url': function(cb_) {
        var res = {
          ok: true,
          description: 'Get authorization url'
        };
        
        var redirect_uri = 'https://www.foo.com/handleauth';
        var expected_url = 'https://api.instagram.com/oauth/authorize?' +
          'client_id=1234&redirect_uri=https%3A%2F%2Fwww.foo.' +
          'com%2Fhandleauth&response_type=code';

        if(expected_url !== instagram.get_authorization_url(redirect_uri)) {
          res.ok = false;
        }
        return cb_(null, res);
      },
      'with scope': function(cb_) {
        var res = {
          ok: true,
          description: 'Get authorization url with valid scope'
        };

        var redirect_uri = 'https://www.foo.com/handleauth';
        var exp_permissions_url = 'https://api.instagram.com/oauth/authorize?' +
          'client_id=1234&redirect_uri=https%3A%2F%2Fwww.foo.' +
          'com%2Fhandleauth&response_type=code' +
          '&scope=likes+comments';
        var options = { scope: [ 'likes', 'comments' ] };
        
        if(exp_permissions_url !== instagram.get_authorization_url(redirect_uri, options)) {
          res.ok = false;
        }
        return cb_(null, res);
      },
      'with state': function(cb_) {
        var res = {
          ok: true,
          description: 'Get authorization url with state'
        };

        var redirect_uri = 'https://www.foo.com/handleauth';
        var exp_permissions_url = 'https://api.instagram.com/oauth/authorize?' +
          'client_id=1234&redirect_uri=https%3A%2F%2Fwww.foo.' +
          'com%2Fhandleauth&response_type=code' +
          '&state=mystate';
        var options = { state: 'mystate' };

        if(exp_permissions_url !== instagram.get_authorization_url(redirect_uri, options)) {
          res.ok = false;
        }
        return cb_(null, res);
      }
    };

    return tests;
  };

  fwk.method(that, 'todo', todo, _super);

  return that;
})({});

auth.launch();
