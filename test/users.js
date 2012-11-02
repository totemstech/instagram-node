/**
 * Some test about users feature
 */

var fwk = require('fwk');
var cfg = fwk.populateConfig(require('../config.js').config);
var instagram = require('../lib/instagram.js').instagram();

instagram.use({
  access_token: cfg['INSTAGRAM_ACCESS_TOKEN']
});

console.log('USERS: ongoing tests...');

var error = 0;
var done = 0;
var mplex = fwk.mplex({});

var ucb = mplex.callback();
instagram.user('33082304', function(err, result, limit) {
  if(result && limit) {
    done++;
    ucb();
  } else {
    error++;
    ucb();
  }
});

var fcb = mplex.callback();
instagram.user_self_feed({ count: 3 }, function(err, feed, pagination, limit) {
  if(feed && pagination && limit) {
    done++;
    fcb();
  } else {
    error++;
    fcb();
  }
});

var mcb = mplex.callback();
instagram.user_media_recent({ user_id: '33082304', count: 3 }, function(err, results, pagination, limit) {
  if(results && pagination && limit) {
    done++;
    mcb();
  } else {
    error++;
    mcb();
  }
});

var lcb = mplex.callback();
instagram.user_self_liked({ count: 3 }, function(err, likes, limit) {
  if(likes && limit) {
    done++;
    lcb();
  } else {
    error++;
    lcb();
  }
});

var scb = mplex.callback();
instagram.user_search('xn1t0x', function(err, users, limit) {
  if(users && limit) {
    done++;
    scb();
  } else {
    error++;
    scb();
  }
});

mplex.go(function() {
  if(error === 0 && done === 5) {
    console.log('USERS: test passed.');
  } else {
    console.log('USERS: ' + error + ' failed & ' + done + ' passed');
  }
});