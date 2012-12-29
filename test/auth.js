/**
 * Authorization (Primitive) Unit Tests.
 */
var fwk = require('fwk');
var instagram = require('../lib/instagram').instagram();
var cfg = fwk.populateConfig(require('../config.js').config);

var CLIENT_ID = '1234';
var CLIENT_SECRET = 'abcd';

instagram.use({
  client_id: CLIENT_ID,
  client_secret: CLIENT_SECRET
});

console.log(cfg['CRESET'] + 'AUTH: starting tests...');

var error = 0;
var done = 0;
var mplex = fwk.mplex({});

// Test Helpers
var ok = function(test_description) {
  done++;
  console.log('AUTH: ' + test_description + ': ' +
              cfg['CGREEN'] + 'OK' + cfg['CRESET']);
}

var fail = function(test_description) {
  error++;
  console.log('AUTH: ' + test_description + ': ' +
              cfg['CRED'] + 'FAIL' + cfg['CRESET']);
}

/**
 * Test get_authorization_url
 */
var redirect_uri = 'https://www.foo.com/handleauth';
var expected_url = 'https://api.instagram.com/oauth/authorize?' +
                   'client_id=1234&redirect_uri=https%3A%2F%2Fwww.foo.' +
                   'com%2Fhandleauth&response_type=code';
if (expected_url === instagram.get_authorization_url(redirect_uri)) {
  done++;
  ok('basic authorization url');
} else {
  error++;
  fail('basic authorization url');
}

/**
 * Test get_authorization_url with valid permissions
 */
var exp_permissions_url = expected_url + '&permissions=likes%20comments';
var permissions = ['likes', 'comments'];

if (exp_permissions_url === instagram.get_authorization_url(redirect_uri,
                                                            permissions)) {
  ok('authorization url (with valid permissions)');
} else {
  fail('authorization url (with valid permissions');
}

/**
 * Test get_authorization_url with valid/invalid permissions
 */
permissions.push('badpermission');
if (exp_permissions_url === instagram.get_authorization_url(redirect_uri,
                                                            permissions)) {
  ok('authorization url (with valid/invalid permissions)');
} else {
  console.error(instagram.get_authorization_url(redirect_uri, permissions));
  fail('authorization url (with valid/invalid permissions');
}

mplex.go(function() {
  if(error === 0 && done === 6) {
    console.log('AUTH: ' + cfg['CGREEN'] + 'OK !' + cfg['CRESET']);
  } else {
    console.log('AUTH: ' + cfg['CRED'] + error + ' failed ' + cfg['CRESET'] + '& ' + cfg['CGREEN'] + done + ' passed' + cfg['CRESET']);
  }
});
