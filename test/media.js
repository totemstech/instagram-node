/**
 * Some test about media features
 */

var fwk = require('fwk');
var cfg = fwk.populateConfig(require('../config.js').config);
var instagram = require('../lib/instagram.js').instagram();

instagram.use({
  access_token: cfg['INSTAGRAM_ACCESS_TOKEN']
});

console.log(cfg['CRESET'] + 'MEDIA: starting tests...');

var error = 0;
var done = 0;
var mplex = fwk.mplex({});

var mcb = mplex.callback();
var mretry = 0;
instagram.media('314584059748370098_2104944', function(err, result, limit) {
  if(result && limit) {
    done++;
    console.log('MEDIA: media ' + cfg['CGREEN'] + 'OK' + cfg['CRESET']);
    mcb();
  } else {
    if(mretry < 2) {
      mretry++;
      console.log('MEDIA: media ' + cfg['CRED'] + 'FAIL '  + cfg['CRESET'] + ' - retry (' + mretry +')');
      err.retry();
    } else {
      error++;
      console.log('MEDIA: media ' + cfg['CRED'] + 'FAIL '  + cfg['CRESET'] + 'after 3 retry');
      mcb();
    }
  }
});

var scb = mplex.callback();
var sretry = 0;
instagram.media_search({ lat: 48.858831776042265, lng: 2.3470598999999766, distance: 5000 }, function(err, medias, limit) {
  if(medias && limit) {
    done++;
    console.log('MEDIA: search ' + cfg['CGREEN'] + 'OK' + cfg['CRESET']);
    scb();
  } else {
    if(sretry < 2) {
      sretry++;
      console.log('MEDIA: search ' + cfg['CRED'] + 'FAIL '  + cfg['CRESET'] + ' - retry (' + sretry +')');
      err.retry();
    } else {
      error++;
      console.log('MEDIA: search ' + cfg['CRED'] + 'FAIL '  + cfg['CRESET'] + 'after 3 retry');
      scb();
    }
  }
});

var pcb = mplex.callback();
var pretry = 0;
instagram.media_popular(function(err, medias, limit) {
  if(medias && limit) {
    done++;
    console.log('MEDIA: popular ' + cfg['CGREEN'] + 'OK' + cfg['CRESET']);
    pcb();
  } else {
    if(pretry < 2) {
      pretry++;
      console.log('MEDIA: popular ' + cfg['CRED'] + 'FAIL '  + cfg['CRESET'] + ' - retry (' + pretry +')');
      err.retry();
    } else {
      error++;
      console.log('MEDIA: popular ' + cfg['CRED'] + 'FAIL '  + cfg['CRESET'] + 'after 3 retry');
      pcb();
    }
  }
});

mplex.go(function() {
  if(error === 0 && done === 3) {
    console.log('MEDIA: ' + cfg['CGREEN'] + 'OK !' + cfg['CRESET']);
  } else {
    console.log('MEDIA: ' + cfg['CRED'] + error + ' failed ' + cfg['CRESET'] + '& ' + cfg['CGREEN'] + done + ' passed' + cfg['CRESET']);
  }
});
