/**
 * Authorization (Primitive) Unit Tests.
 */
var fwk = require('fwk');
var instagram = require('../lib/instagram').instagram();

var CLIENT_ID = '1234';
var CLIENT_SECRET = 'abcd';

instagram.use({
  client_id: CLIENT_ID,
  client_secret: CLIENT_SECRET,
  access_token: cfg['INSTAGRAM_ACCESS_TOKEN']
});

console.log(cfg['CRESET'] + 'AUTH: starting tests...');

var error = 0;
var done = 0;
var mplex = fwk.mplex({});



mplex.go(function() {
  if(error === 0 && done === 6) {
    console.log('AUTH: ' + cfg['CGREEN'] + 'OK !' + cfg['CRESET']);
  } else {
    console.log('AUTH: ' + cfg['CRED'] + error + ' failed ' + cfg['CRESET'] + '& ' + cfg['CGREEN'] + done + ' passed' + cfg['CRESET']);
  }
});
