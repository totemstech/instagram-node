/**
 * Some test about users features
 */

var fwk = require('fwk');
var cfg = fwk.populateConfig(require('../config.js').config);
var instagram = require('../lib/instagram.js').instagram();

instagram.use({
  access_token: cfg['INSTAGRAM_ACCESS_TOKEN']
});

console.log(cfg['CRESET'] + 'USERS: starting tests...');

var error = 0;
var done = 0;
var mplex = fwk.mplex({});

var ucb = mplex.callback();
var uretry = 0;
instagram.user('33082304', function(err, result, limit) {
  if(result && limit) {
    done++;
    console.log('USERS: user ' + cfg['CGREEN'] + 'OK' + cfg['CRESET']);
    ucb();
  } else {
    if(uretry < 2) {
      uretry++;
      console.log('USERS: user ' + cfg['CRED'] + 'FAIL '  + cfg['CRESET'] + ' - retry (' + uretry +')');
      err.retry();
    } else {
      error++;
      console.log('USERS: user ' + cfg['CRED'] + 'FAIL '  + cfg['CRESET'] + 'after 3 retry');
      ucb();
    }
  }
});

var fcb = mplex.callback();
var fretry = 0;
instagram.user_self_feed({ count: 3 }, function(err, feed, pagination, limit) {
  if(feed && pagination && limit) {
    done++;
    console.log('USERS: self_feed ' + cfg['CGREEN'] + 'OK' + cfg['CRESET']);
    if(pagination.next) {
      pagination.next(function(err, feed, pagination, limit) {
        if(feed && pagination && limit) {
          done++;
          console.log('USERS: self_feed (next) ' + cfg['CGREEN'] + 'OK' + cfg['CRESET']);
          fcb();
        } else {
          error++;
          console.log('USERS: self_feed (next) ' + cfg['CRED'] + 'FAIL '  + cfg['CRESET']);
          fcb();
        }
      });
    } else {
      done++;
      fcb();
    }
  } else {
    if(fretry < 2) {
      fretry++;
      console.log('USERS: self_feed ' + cfg['CRED'] + 'FAIL '  + cfg['CRESET'] + ' - retry (' + fretry +')');
      err.retry();
    } else {
      error++;
      console.log('USERS: self_feed ' + cfg['CRED'] + 'FAIL '  + cfg['CRESET'] + 'after 3 retry');
      fcb();
    }
  }
});

var mcb = mplex.callback();
var mretry = 0;
instagram.user_media_recent('33082304', { count: 3 }, function(err, results, pagination, limit) {
  if(results && pagination && limit) {
    done++;
    console.log('USERS: media_recent ' + cfg['CGREEN'] + 'OK' + cfg['CRESET']);
    mcb();
  } else {
    if(mretry < 2) {
      mretry++;
      console.log('USERS: media_recent ' + cfg['CRED'] + 'FAIL '  + cfg['CRESET'] + ' - retry (' + mretry +')');
      err.retry();
    } else {
      error++;
      console.log('USERS: media_recent ' + cfg['CRED'] + 'FAIL '  + cfg['CRESET'] + 'after 3 retry');
      mcb();
    }
  }
});

var lcb = mplex.callback();
var lretry = 0;
instagram.user_self_liked({ count: 3 }, function(err, likes, limit) {
  if(likes && limit) {
    done++;
    console.log('USERS: self_liked ' + cfg['CGREEN'] + 'OK' + cfg['CRESET']);
    lcb();
  } else {
    if(lretry < 2) {
      lretry++;
      console.log('USERS: self_liked ' + cfg['CRED'] + 'FAIL '  + cfg['CRESET'] + ' - retry (' + lretry +')');
      err.retry();
    } else {
      error++;
      console.log('USERS: self_liked ' + cfg['CRED'] + 'FAIL '  + cfg['CRESET'] + 'after 3 retry');
      lcb();
    }
  }
});

var scb = mplex.callback();
var sretry = 0;
instagram.user_search('xn1t0x', function(err, users, limit) {
  if(users && limit) {
    done++;
    console.log('USERS: search ' + cfg['CGREEN'] + 'OK' + cfg['CRESET']);
    scb();
  } else {
    if(sretry < 2) {
      sretry++;
      console.log('USERS: search ' + cfg['CRED'] + 'FAIL '  + cfg['CRESET'] + ' - retry (' + sretry +')');
      err.retry();
    } else {
      error++;
      console.log('USERS: search ' + cfg['CRED'] + 'FAIL '  + cfg['CRESET'] + 'after 3 retry');
      scb();
    }
  }
});

mplex.go(function() {
  if(error === 0 && done === 6) {
    console.log('USERS: ' + cfg['CGREEN'] + 'OK !' + cfg['CRESET']);
  } else {
    console.log('USERS: ' + cfg['CRED'] + error + ' failed ' + cfg['CRESET'] + '& ' + cfg['CGREEN'] + done + ' passed' + cfg['CRESET']);
  }
});
