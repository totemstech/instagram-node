/**
 * Some test about relationship features
 */

var fwk = require('fwk');
var cfg = fwk.populateConfig(require('../config.js').config);
var instagram = require('../lib/instagram.js').instagram();

instagram.use({
  access_token: cfg['INSTAGRAM_ACCESS_TOKEN']
});

console.log(cfg['CRESET'] + 'RELATIONSHIP: starting tests...');

var error = 0;
var done = 0;
var mplex = fwk.mplex({});

var ucb = mplex.callback();
var uretry = 0;
instagram.user_follows('33082304', function(err, users, limit) {
  if(users && limit) {
    done++;
    console.log('RELATIONSHIP: follows ' + cfg['CGREEN'] + 'OK' + cfg['CRESET']);
    ucb();
  } else {
    if(uretry < 2) {
      uretry++;
      console.log('RELATIONSHIP: follows ' + cfg['CRED'] + 'FAIL '  + cfg['CRESET'] + ' - retry (' + uretry +')');
      err.retry();
    } else {
      error++;
      console.log('RELATIONSHIP: follows ' + cfg['CRED'] + 'FAIL '  + cfg['CRESET'] + 'after 3 retry');
      ucb();
    }
  }
});

var fcb = mplex.callback();
var fretry = 0;
instagram.user_followers('33082304', function(err, users, limit) {
  if(users && limit) {
    done++;
    console.log('RELATIONSHIP: followers ' + cfg['CGREEN'] + 'OK' + cfg['CRESET']);
    fcb();
  } else {
    if(fretry < 2) {
      fretry++;
      console.log('RELATIONSHIP: followers ' + cfg['CRED'] + 'FAIL '  + cfg['CRESET'] + ' - retry (' + fretry +')');
      err.retry();
    } else {
      error++;
      console.log('RELATIONSHIP: followers ' + cfg['CRED'] + 'FAIL '  + cfg['CRESET'] + 'after 3 retry');
      fcb();
    }
  }
});

var scb = mplex.callback();
var sretry = 0;
instagram.user_self_requested_by(function(err, users, limit) {
  if(users && limit) {
    done++;
    console.log('RELATIONSHIP: requested_by ' + cfg['CGREEN'] + 'OK' + cfg['CRESET']);
    scb();
  } else {
    if(sretry < 2) {
      sretry++;
      console.log('RELATIONSHIP: requested_by ' + cfg['CRED'] + 'FAIL '  + cfg['CRESET'] + ' - retry (' + sretry +')');
      err.retry();
    } else {
      error++;
      console.log('RELATIONSHIP: requested_by ' + cfg['CRED'] + 'FAIL '  + cfg['CRESET'] + 'after 3 retry');
      scb();
    }
  }
});

var rcb = mplex.callback();
var rretry = 0;
instagram.user_relationship('33082302', function(err, result, limit) {
  if(result && limit) {
    done++;
    console.log('RELATIONSHIP: relationship ' + cfg['CGREEN'] + 'OK' + cfg['CRESET']);
    rcb();
  } else {
    if(rretry < 2) {
      rretry++;
      console.log('RELATIONSHIP: relationship ' + cfg['CRED'] + 'FAIL '  + cfg['CRESET'] + ' - retry (' + rretry +')');
      err.retry();
    } else {
      error++;
      console.log('RELATIONSHIP: relationship ' + cfg['CRED'] + 'FAIL '  + cfg['CRESET'] + 'after 3 retry');
      rcb();
    }
  }
});

mplex.go(function() {
  if(error === 0 && done === 4) {
    console.log('RELATIONSHIP: ' + cfg['CGREEN'] + 'OK !' + cfg['CRESET']);
  } else {
    console.log('RELATIONSHIP: ' + cfg['CRED'] + error + ' failed ' + cfg['CRESET'] + '& ' + cfg['CGREEN'] + done + ' passed' + cfg['CRESET']);
  }
});