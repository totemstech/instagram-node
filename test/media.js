/**
 * Some test about relationship feature
 */

var fwk = require('fwk');
var cfg = fwk.populateConfig(require('../config.js').config);
var instagram = require('../lib/instagram.js').instagram();

instagram.use({
  access_token: cfg['INSTAGRAM_ACCESS_TOKEN']
});

console.log('MEDIA: ongoing tests...');

var error = 0;
var done = 0;
var mplex = fwk.mplex({});

var mcb = mplex.callback();
instagram.media('314584059748370098_2104944', function(err, result, limit) {
  if(result && limit) {
    done++;
    mcb();
  } else {
    error++;
    mcb();
  }
});

var scb = mplex.callback();
instagram.media_search({ lat: 48.858831776042265, lng: 2.3470598999999766, distance: 5000 }, function(err, medias, limit) {
  if(medias && limit) {
    done++;
    scb();
  } else {
    error++;
    scb();
  }
});

var pcb = mplex.callback();
instagram.media_popular(function(err, medias, limit) {
  if(medias && limit) {
    done++;
    pcb();
  } else {
    error++;
    pcb();
  }
});

mplex.go(function() {
  if(error === 0 && done === 3) {
    console.log('MEDIA: test passed.');
  } else {
    console.log('MEDIA: ' + error + ' failed & ' + done + ' passed');
  }
});