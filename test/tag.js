/**
 * Some test about tag feature
 */

var fwk = require('fwk');
var cfg = fwk.populateConfig(require('../config.js').config);
var instagram = require('../lib/instagram.js').instagram();

instagram.use({
  access_token: cfg['INSTAGRAM_ACCESS_TOKEN']
});

console.log(cfg['CRESET'] + 'TAGS: starting tests...');

var error = 0;
var done = 0;
var mplex = fwk.mplex({});

var tcb = mplex.callback();
var tretry = 0;
instagram.tag('test', function(err, result, limit) {
  if(result && limit) {
    done++;
    console.log('TAGS: tag ' + cfg['CGREEN'] + 'OK' + cfg['CRESET']);
    tcb();
  } else {
    if(tretry < 2) {
      tretry++;
      console.log('TAGS: tag ' + cfg['CRED'] + 'FAIL '  + cfg['CRESET'] + ' - retry (' + sretry +')');
      err.retry();
    } else {
      error++;
      console.log('TAGS: tag ' + cfg['CRED'] + 'FAIL '  + cfg['CRESET'] + 'after 3 retry');
      tcb();
    }
  }
});

var scb = mplex.callback();
var sretry = 0;
instagram.tag_search('test', function(err, result, limit) {
  if(result && limit) {
    done++;
    console.log('TAGS: search ' + cfg['CGREEN'] + 'OK' + cfg['CRESET']);
    scb();
  } else {
    if(sretry < 2) {
      sretry++;
      console.log('TAGS: search ' + cfg['CRED'] + 'FAIL '  + cfg['CRESET'] + ' - retry (' + sretry +')');
      err.retry();
    } else {
      error++;
      console.log('TAGS: search ' + cfg['CRED'] + 'FAIL '  + cfg['CRESET'] + 'after 3 retry');
      scb();
    }
  }
});

var mcb = mplex.callback();
var mretry = 0;
instagram.tag_media_recent({ tag: 'test' }, function(err, medias, limit) {
  if(medias && limit) {
    done++;
    console.log('TAGS: media_recent ' + cfg['CGREEN'] + 'OK' + cfg['CRESET']);
    mcb();
  } else {
    if(mretry < 2) {
      mretry++;
      console.log('TAGS: media_recent ' + cfg['CRED'] + 'FAIL '  + cfg['CRESET'] + ' - retry (' + mretry +')');
      err.retry();
    } else {
      error++;
      console.log('TAGS: media_recent ' + cfg['CRED'] + 'FAIL '  + cfg['CRESET'] + 'after 3 retry');
      mcb();
    }
  }
});

mplex.go(function() {
  if(error === 0 && done === 3) {
    console.log('TAGS: ' + cfg['CGREEN'] + 'OK !' + cfg['CRESET']);
  } else {
    console.log('TAGS: ' + cfg['CRED'] + error + ' failed ' + cfg['CRESET'] + '& ' + cfg['CGREEN'] + done + ' passed' + cfg['CRESET']);
  }
});
