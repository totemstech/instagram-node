/**
 * Some test about likes features
 */

var fwk = require('fwk');
var cfg = fwk.populateConfig(require('../config.js').config);
var instagram = require('../lib/instagram.js').instagram();

instagram.use({
  access_token: cfg['INSTAGRAM_ACCESS_TOKEN']
});

console.log(cfg['CRESET'] + 'LIKES: starting tests...');

var error = 0;
var done = 0;
var mplex = fwk.mplex({});

var lcb = mplex.callback();
var lretry = 0;
instagram.likes('318869204166248215_33082304', function(err, result, limit) {
  if(result && limit) {
    done++;
    console.log('LIKES: likes ' + cfg['CGREEN'] + 'OK' + cfg['CRESET']);
    lcb();
  } else {
    if(lretry < 2) {
      lretry++;
      console.log('LIKES: likes ' + cfg['CRED'] + 'FAIL '  + cfg['CRESET'] + ' - retry (' + lretry +')');
      err.retry();
    } else {
      error++;
      console.log('LIKES: likes ' + cfg['CRED'] + 'FAIL '  + cfg['CRESET'] + 'after 3 retry');
      lcb();
    }
  }
});


var scb = mplex.callback();
var sretry = 0;
instagram.add_like('318869204166248215_33082304', function(err, limit) {
  if(!err && limit) {
    done++;
    console.log('LIKES: add_like ' + cfg['CGREEN'] + 'OK' + cfg['CRESET']);
    scb();
  } else {
    if(sretry < 2) {
      sretry++;
      console.log('LIKES: add_like ' + cfg['CRED'] + 'FAIL '  + cfg['CRESET'] + ' - retry (' + sretry +')');
      err.retry();
    } else {
      error++;
      console.log('LIKES: add_like ' + cfg['CRED'] + 'FAIL '  + cfg['CRESET'] + 'after 3 retry');
      scb();
    }
  }
});

var pretry = 0;
var pcb = mplex.callback();
instagram.del_like('318869204166248215_33082304', function(err, limit) {
  if(!err && limit) {
    done++;
    console.log('LIKES: del_like ' + cfg['CGREEN'] + 'OK' + cfg['CRESET']);
    pcb();
  } else {
    if(pretry < 2) {
      pretry++;
      console.log('LIKES: del_like ' + cfg['CRED'] + 'FAIL '  + cfg['CRESET'] + ' - retry (' + pretry +')');
      err.retry();
    } else {
      error++;
      console.log('LIKES: del_like ' + cfg['CRED'] + 'FAIL '  + cfg['CRESET'] + 'after 3 retry');
      pcb();
    }
  }
});

mplex.go(function() {
  if(error === 0 && done === 3) {
    console.log('LIKES: ' + cfg['CGREEN'] + 'OK !' + cfg['CRESET']);
  } else {
    console.log('LIKES: ' + cfg['CRED'] + error + ' failed ' + cfg['CRESET'] + '& ' + cfg['CGREEN'] + done + ' passed' + cfg['CRESET']);
  }
});
