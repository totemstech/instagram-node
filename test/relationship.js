/**
 * Some test about relationship feature
 */

var fwk = require('fwk');
var cfg = fwk.populateConfig(require('../config.js').config);
var instagram = require('../lib/instagram.js').instagram();

instagram.use({
  access_token: cfg['INSTAGRAM_ACCESS_TOKEN']
});

console.log('RELATIONSHIP: ongoing tests...');

var error = 0;
var done = 0;
var mplex = fwk.mplex({});

var ucb = mplex.callback();
instagram.user_follows('33082304', function(err, users, limit) {
  if(users && limit) {
    done++;
    ucb();
  } else {
    error++;
    ucb();
  }
});

var fcb = mplex.callback();
instagram.user_followers('33082304', function(err, users, limit) {
  if(users && limit) {
    done++;
    fcb();
  } else {
    error++;
    fcb();
  }
});

var scb = mplex.callback();
instagram.user_self_requested_by(function(err, users, limit) {
  if(users && limit) {
    done++;
    scb();
  } else {
    error++;
    scb();
  }
});

var rcb = mplex.callback();
instagram.user_relationship('33082302', function(err, result, limit) {
  if(result && limit) {
    done++;
    rcb();
  } else {
    error++;
    rcb();
  }
});

mplex.go(function() {
  if(error === 0 && done === 4) {
    console.log('RELATIONSHIP: test passed.');
  } else {
    console.log('RELATIONSHIP: ' + error + ' failed & ' + done + ' passed');
  }
});