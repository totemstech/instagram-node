var fwk = require('fwk');
var config = fwk.baseConfig();

config['SILENT_CONFIG'] = true;

config['INSTAGRAM_ACCESS_TOKEN'] = 'dummy-env';

config['CRED'] = '\033[31m';
config['CGREEN'] = '\033[32m';
config['CRESET'] = '\033[0m';

exports.config = config;