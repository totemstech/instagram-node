/**
 * Some test about locations features
 */

var fwk = require('fwk');
var cfg = fwk.populateConfig(require('../config.js').config);
var instagram = require('../lib/instagram.js').instagram();

instagram.use({
  access_token: cfg['INSTAGRAM_ACCESS_TOKEN']
});

console.log(cfg['CRESET'] + 'LOCATIONS: starting tests...');

var error = 0;
var done = 0;
var mplex = fwk.mplex({});

var lcb = mplex.callback();
var lretry = 0;
instagram.location('7351364', function(err, result, limit) {
  if(result && limit) {
    done++;
    console.log('LOCATION: location ' + cfg['CGREEN'] + 'OK' + cfg['CRESET']);
    lcb();
  } else {
    if(lretry < 2) {
      lretry++;
      console.log('LOCATION: location ' + cfg['CRED'] + 'FAIL '  + cfg['CRESET'] + ' - retry (' + lretry +')');
      err.retry();
    } else {
      error++;
      console.log('LOCATION: location ' + cfg['CRED'] + 'FAIL '  + cfg['CRESET'] + 'after 3 retry');
      lcb();
    }
  }
});

var scb = mplex.callback();
var sretry = 0;
instagram.location_search({ lat: 48.858831776042265, lng: 2.3470598999999766, distance: 5000 }, function(err, result, limit) {
  if(result && limit) {
    done++;
    console.log('LOCATION: search ' + cfg['CGREEN'] + 'OK' + cfg['CRESET']);
    scb();
  } else {
    if(sretry < 2) {
      sretry++;
      console.log('LOCATION: search ' + cfg['CRED'] + 'FAIL '  + cfg['CRESET'] + ' - retry (' + sretry +')');
      err.retry();
    } else {
      error++;
      console.log('LOCATION: search ' + cfg['CRED'] + 'FAIL '  + cfg['CRESET'] + 'after 3 retry');
      scb();
    }
  }
});

var pcb = mplex.callback();
var pretry = 0;
instagram.location_media_recent('7351364', function(err, medias, limit) {
  if(medias && limit) {
    done++;
    console.log('LOCATION: media_recent ' + cfg['CGREEN'] + 'OK' + cfg['CRESET']);
    pcb();
  } else {
    if(pretry < 2) {
      pretry++;
      console.log('LOCATION: media_recent ' + cfg['CRED'] + 'FAIL '  + cfg['CRESET'] + ' - retry (' + pretry +')');
      err.retry();
    } else {
      error++;
      console.log('LOCATION: media_recent ' + cfg['CRED'] + 'FAIL '  + cfg['CRESET'] + 'after 3 retry');
      pcb();
    }
  }
});

mplex.go(function() {
  if(error === 0 && done === 3) {
    console.log('LOCATION: ' + cfg['CGREEN'] + 'OK !' + cfg['CRESET']);
  } else {
    console.log('LOCATION: ' + cfg['CRED'] + error + ' failed ' + cfg['CRESET'] + '& ' + cfg['CGREEN'] + done + ' passed' + cfg['CRESET']);
  }
});
