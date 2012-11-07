/**
 * Some test about comments features
 */

var fwk = require('fwk');
var cfg = fwk.populateConfig(require('../config.js').config);
var instagram = require('../lib/instagram.js').instagram();

instagram.use({
  access_token: cfg['INSTAGRAM_ACCESS_TOKEN']
});

console.log(cfg['CRESET'] + 'COMMENTS: starting tests...');

var error = 0;
var done = 0;
var mplex = fwk.mplex({});

var lcb = mplex.callback();
var lretry = 0;
instagram.comments('318869204166248215_33082304', function(err, result, limit) {
  if(result && limit) {
    done++;
    console.log('COMMENTS: comments ' + cfg['CGREEN'] + 'OK' + cfg['CRESET']);
    lcb();
  } else {
    if(lretry < 2) {
      lretry++;
      console.log('COMMENTS: comments ' + cfg['CRED'] + 'FAIL '  + cfg['CRESET'] + ' - retry (' + lretry +')');
      err.retry();
    } else {
      error++;
      console.log('COMMENTS: comments ' + cfg['CRED'] + 'FAIL '  + cfg['CRESET'] + 'after 3 retry');
      lcb();
    }
  }
});
/*
var scb = mplex.callback();
var sretry = 0;
instagram.add_comment('318869204166248215_33082304', 'Testing instagram driver !', function(err, limit) {
  if(!err && limit) {
    done++;
    console.log('COMMENTS: add_comment ' + cfg['CGREEN'] + 'OK' + cfg['CRESET']);
    scb();
  } else {
    if(sretry < 2) {
      sretry++;
      console.log('COMMENTS: add_comment ' + cfg['CRED'] + 'FAIL '  + cfg['CRESET'] + ' - retry (' + sretry +')');
      err.retry();
    } else {
      error++;
      console.log('COMMENTS: add_comment ' + cfg['CRED'] + 'FAIL '  + cfg['CRESET'] + 'after 3 retry');
      scb();
    }
  }
});

var pcb = mplex.callback();
var pretry = 0;
instagram.del_comment('', '', function(err, limit) {
  if(!err && limit) {
    done++;
    console.log('COMMENTS: del_comment ' + cfg['CGREEN'] + 'OK' + cfg['CRESET']);
    pcb();
  } else {
    if(pretry < 2) {
      pretry++;
      console.log('COMMENTS: del_comment ' + cfg['CRED'] + 'FAIL '  + cfg['CRESET'] + ' - retry (' + pretry +')');
      err.retry();
    } else {
      error++;
      console.log('COMMENTS: del_comment ' + cfg['CRED'] + 'FAIL '  + cfg['CRESET'] + 'after 3 retry');
      pcb();
    }
  }
});
*/
mplex.go(function() {
  if(error === 0 && done === 1) {
    console.log('COMMENTS: ' + cfg['CGREEN'] + 'OK !' + cfg['CRESET']);
  } else {
    console.log('COMMENTS: ' + cfg['CRED'] + error + ' failed ' + cfg['CRESET'] + '& ' + cfg['CGREEN'] + done + ' passed' + cfg['CRESET']);
  }
});
