var fwk = require('fwk');
var colors = require('colors');

/**
 * /!\ Abstract class /!\
 * Provides an interface used to implement all tests.
 *
 * @param spec { name }
 */
var test_base = function(spec, my) {
  var _super = {};
  my = my || {};

  my.name = spec.name || 'test_name';
  my.fail = 0;

  my.cfg = fwk.populateConfig(require('../config.js').config);

  // public
  var launch;
  var todo;

  var retry;
  var ok;
  var fail;

  // private

  var that = {};

  /**
   * Format message and print it in success context
   * @param name string the name of current test
   */
  ok = function(name) {
    console.log('['.cyan + my.name.toUpperCase().cyan + ']'.cyan + ': ' + name + ' ==> ' + 'OK !'.green);
  };

  /**
   * Format message and print it in failure context
   * @param name string the name of current test
   */
  fail = function(name) {
    my.fail++;
    console.log('['.cyan + my.name.toUpperCase().cyan + ']'.cyan + ': ' + name + ' ==> ' + 'FAILED !'.red);
  };
  
  /**
   * Format message and print it in retry context
   * @param name string the name of current test
   */
  retry = function(name, nr) {
    console.log('['.cyan + my.name.toUpperCase().cyan + ']'.cyan + ': ' + name + ' ==> ' + 'Retrying...'.yellow + ' [' + nr + ']');
  }

  /**
   * Launch the tests
   */
  launch = function() {
    console.log('['.cyan + my.name.toUpperCase().cyan + ']'.cyan + ': Starting...'); 
    fwk.async.parallel(that.todo(), function(err, results) {
      if(err) {
        return console.log('['.cyan + my.name.toUpperCase().cyan + ']'.cyan + ': ' + err.message);
      }
      else {
        for(var i in results) {
          if(results.hasOwnProperty(i)) {
            if(results[i].ok) {
              ok(results[i].description);
            }
            else {
              fail(results[i].description);
            }
          }
        }

        if(my.fail === 0) {
          console.log('['.cyan + my.name.toUpperCase().cyan + ']'.cyan + ': Done. ' + '(OK)'.green);
        }
        else {
          console.log('['.cyan + my.name.toUpperCase().cyan + ']'.cyan + ': Done. ' + '(FAIL)'.red);
        }
      }
    });
  };

  /**
   * Build and return tests according to the following pattern:
   * @return {
   *     'test1': function(cb_) {},
   *     'test2': function(cb_) {}
   *    }
   */
  todo = function() {
    throw new Error('`todo` must be implemented');

    return  {
      'test1': function(cb_) {
        var res = {
          ok: true,
          description: 'test a cool feature'
        };
        
        // testing stuffs ...
        if(bad_thing_happens) {
          res.ok = false;
        }

        return cb_(null, res);
      }
    };
  };

  fwk.method(that, 'launch', launch, _super);
  fwk.method(that, 'todo', todo, _super);

  fwk.method(that, 'ok', ok, _super);
  fwk.method(that, 'fail', fail, _super);
  fwk.method(that, 'retry', retry, _super);
  
  return that;
};

exports.test_base = test_base;