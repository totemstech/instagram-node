var fwk = require('fwk');
var https = require('https');
var query = require('querystring');

 /**
  * Instagram API driver for NodeJS
  * Proceeds the call to the API and give
  * back the response
  */
var instagram = function(spec, my) {
  var _super = {};
  my = my || {};

  // public
  var use;
  
  var user;
  var user_self_feed;
  var user_media_recent;
  var user_self_liked;
  var user_user;

  var user_follows;
  var user_followers;
  var user_self_requested_by;
  var user_relationship;
  var set_user_relationship;

  var media;
  var media_search;
  var media_popular;

  // private
  var call;
  var handle_error;

  var that = {};

  /*******************************/
  /*       Private helpers       */
  /*******************************/

  /**
   * Make a call on instagram API 
   * with the given params, path & method
   * @param method the request method
   * @param path the path
   * @param params the params
   * @param cb(err, result, limit);
   */
  call = function(method, path, params, cb) {
    if(my.auth) {
      for(var opt in my.auth) {
        if(my.auth.hasOwnProperty(opt)) {
          params[opt] = my.auth[opt];
        }
      }
      var options = {
        host: 'api.instagram.com',
        method: method,
        path: '/v1' + path + (method === 'GET' ? '?' + query.stringify(params) : ''),
      };
      
      var req = https.request(options, function(res) {
        var body = '';
        res.setEncoding('utf8');

        res.on('data', function(chunk) {
          body += chunk;
        });

        res.on('end', function() {
          try {
            //console.log(params);
            var result = JSON.parse(body);
            //console.log(result);
            cb(null, result, res.headers['x-ratelimit-remaining']);
          } catch(err) {
            cb(err);
          }
        });
      });

      req.on('error', function(err) {
        cb(err);
      });

      if(method !== 'GET') {
        req.write(query.stringify(params));
      }

      req.end();
    } else {
      cb(new Error('Must be authentified'));
    }
  };

  /**
   * Handle API errors
   * @param body the response from instagram API
   * @param cb(err);
   */
  handle_error = function(body, cb) {
    // More ToDo
    if(body && body.meta && body.meta.error_type) {
      var title = body.meta.error_type.replace(/[A-Z]{1}[a-z]{1,}/g, ' $&');
      cb(new Error('[' + body.meta.code + '] ' + title + ': ' + body.meta.error_message));
    } else {
      cb(new Error('An error occured'));
    }
  };
  
  /*****************************/
  /*      Public functions     */
  /*****************************/

  /**
   * Use following options to
   * signe requests
   * Can be an access_key or
   * a client_id/client_secret keys pair
   * @param options { access_key ||
   *                  client_id, client_secret }
   * @throw error if options is wrong
   */
  use = function(options) {
    if(typeof options === 'object') {
      if(options.access_token) {
        my.auth = { 
          access_token: options.access_token 
        };
      } else if(options.client_id && options.client_secret) {
        my.auth = {
          client_id: options.client_id,
          client_secret: options.client_secret,
        };
      } else {
        throw new Error('Wrong param "options"');
      }
    } else {
      throw new Error('Wrong param "options"');
    }
  };

  /**
   * Retrieves information about the given user
   * @param id the user id
   * @param cb(err, user, limit);
   */
  user = function(id, cb) {
    if(typeof id === 'string' && id !== '') {
      call('GET', '/users/' + id, {}, function(err, result, limit) {
        if(err) {
          cb(err);
        } else if(result && result.meta && result.meta.code === 200) {
          cb(null, result.data, limit);
        } else {
          handle_error(result, cb);
        }
      });
    } else {
      cb(new Error('Wrong param "id"'));
    }
  }; 

  /**
   * Retrieves current user feed
   * @param spec { count, min_id, max_id }
   * @param cb(err, feed, pagination, limit);
   */
  user_self_feed = function(spec, cb) {
    var params = {};
    if(spec.count) {
      params.count = spec.count;
    }
    if(spec.min_id) {
      params.min_id = spec.min_id;
    }
    if(spec.max_id) {
      params.max_id = spec.max_id;
    }

    call('GET', '/users/self/feed', params, function(err, result, limit) {
      if(err) {
        cb(err);
      } else if(result && result.meta && result.meta.code === 200) {
        cb(null, result.data, result.pagination, limit);
      } else {
        handle_error(result, cb);
      }
    });
  };

  /**
   * Get the mos recent media published by a user
   * @param spec { user_id, 
   *               count,           [opt]
   *               max_timestamp,   [opt] 
   *               min_timestamp,   [opt]
   *               max_id,          [opt] 
   *               min_id           [opt] 
   *             }
   * @param cb(err, results, pagination, limit);
   */
  user_media_recent = function(spec, cb) {
    var params = {};
    if(spec.count) {
      params.count = spec.count;
    }
    if(spec.max_timestamp) {
      params.max_timestamp = spec.max_timestamp;
    }
    if(spec.min_timestamp) {
      params.min_timestamp = spec.min_timestamp;
    }
    if(spec.max_id) {
      params.max_id = spec.max_id;
    }
    if(spec.min_id) {
      params.min_id = spec.min_id;
    }

    if(typeof spec.user_id === 'string' && spec.user_id !== '') {
      call('GET', '/users/' + spec.user_id + '/media/recent', params, function(err, result, limit) {
        if(err) {
          cb(err);
        } else if(result && result.meta && result.meta.code === 200) {
          cb(null, result.data, result.pagination, limit);
        } else {
          handle_error(result, cb);
        }
      });
    } else {
      cb(new Error('Wrong param "user_id"'));
    }
  };

  /**
   * Retrieves current user likes
   * @param spec { count, max_like_id }
   * @param cb(err, likes, pagination, limit);
   */
  user_self_liked = function(spec, cb) {
    var params = {};
    if(spec.count) {
      params.count = spec.count;
    } 
    if(spec.max_like_id) {
      params.max_like_id = spec.max_like_id;
    }

    call('GET', '/users/self/media/liked', params, function(err, result, limit) {
      if(err) {
        cb(err);
      } else if(result && result.meta && result.meta.code === 200) {
        cb(null, result.data, result.pagination, limit);
      } else {
        handle_error(result, cb);
      }
    });
  };

  /**
   * Search for a user according to the
   * given query
   * @param query the name to search for
   * @param count the number of users to return  [opt]
   * @param cb(err, users, limit);
   */
  user_search = function(query, count, cb) {
    var params = {};

    if(typeof query !== 'string' && query !== '') {
      return cb(new Error('Wrong param "query"'));
    } else {
      params.q = query;
    }

    if(!cb && typeof count === 'function') {
      cb = count;
    } else if(typeof count === 'number') {
      params.count = count;
    }

    call('GET', '/users/search', params, function(err, result, limit) {
      if(err) {
        cb(err);
      } else if(result && result.meta && result.meta.code === 200) {
        cb(null, result.data, limit);
      } else {
        handle_error(result, cb);
      }
    });
  };

  /**
   * Retrieves the list of users the given user follows
   * @param user_id the user to check
   * @param cb(err, users, limit);
   */
  user_follows = function(user_id, cb) {
    if(typeof user_id === 'string' && user_id !== '') {
      call('GET', '/users/' + user_id + '/follows', {}, function(err, result, limit) {
        if(err) {
          cb(err);
        } else if(result && result.meta && result.meta.code === 200) {
          cb(null, result.data, limit);
        } else {
          handle_error(result, cb);
        }
      });
    } else {
      cb(new Error('Wrong param "user_id"'));
    }
  };

  /**
   * Retrieves the list of users the given user is followed by
   * @param user_id the user to check
   * @param cb(err, users, limit);
   */
  user_followers = function(user_id, cb) {
    if(typeof user_id === 'string' && user_id !== '') {
      call('GET', '/users/' + user_id + '/followed-by', {}, function(err, result, limit) {
        if(err) {
          cb(err);
        } else if(result && result.meta && result.meta.code === 200) {
          cb(null, result.data, limit);
        } else {
          handle_error(result, cb);
        }
      });
    } else {
      cb(new Error('Wrong param "user_id"'));
    }
  };

  /**
   * Retrieves the list of users who have requested the current users's
   * permission to follow
   * @param cb(err, users, limit);
   */
  user_self_requested_by = function(cb) {
    call('GET', '/users/self/requested-by', {}, function(err, result, limit) {
      if(err) {
        cb(err);
      } else if(result && result.meta && result.meta.code === 200) {
        cb(null, result.data, limit);
      } else {
        handle_error(result, cb);
      }
    });
  };

  /**
   * Get information about a relationship to another user
   * @param user_id the user to check
   * @param cb(err, result, limit);
   */
  user_relationship = function(user_id, cb) {
    if(typeof user_id === 'string' && user_id !== '') {
      call('GET', '/users/' + user_id + '/relationship', {}, function(err, result, limit) {
        if(err) {
          cb(err);
        } else if(result && result.meta && result.meta.code === 200) {
          cb(null, result.data, limit);
        } else {
          handle_error(result, cb);
        }
      });
    } else {
      cb(new Error('Wrong param "user_id"'));
    }
  };

  /**
   * Modify the relationship between current user and the target user
   * @param user_id the target user
   * @param action 'follow' || 'unfollow' || 'block' || 'unblock' || 'approve' || 'ignore' 
   * @param cb(err, result, limit);
   */
  set_user_relationship = function(user_id, action, cb) {
    if(['follow', 'unfollow', 'block', 'unblock', 'approve', 'ignore'].indexOf(action.toLowerCase()) !== -1) {
      var params = {
        action: action.toLowerCase()
      };
    } else {
      return cb(new Error('Wrong param "action"'));
    }

    if(typeof user_id === 'string' && user_id !== '') {
      call('POST', '/users/' + user_id + '/relationship', params, function(err, result, limit) {
        if(err) {
          cb(err);
        } else if(result && result.meta && result.meta.code === 200) {
          cb(null, result.data, limit);
        } else {
          handle_error(result, cb);
        }
      });
    } else {
      cb(new Error('Wrong param "user_id"'));
    }
  };

  /**
   * Retrieves information about a given media
   * @param media_id the id of the media
   * @param cb(err, result, limit);
   */
  media = function(media_id, cb) {
    if(typeof media_id === 'string' && media_id !== '') {
      call('GET', '/media/' + media_id, {}, function(err, result, limit) {
        if(err) {
          cb(err);
        } else if(result && result.meta && result.meta.code === 200) {
          cb(null, result.data, limit);
        } else {
          handle_error(result, cb);
        }
      });
    } else {
      cb(new Error('Wrong param "media_id"'));
    }
  };

  /**
   * Search for media in a given area
   * @param spec { lat,
   *               lng,
   *               min_timestamp,    [opt]
   *               max_timestamp,    [opt]
   *               distance          [opt]
   *             }
   * @param cb(err, result, pagination, limit);
   */
  media_search = function(spec, cb) {
    var params = {};
    if(spec.lat && spec.lng) {
      params.lat = spec.lat;
      params.lng = spec.lng;
    } else {
      return cb(new Error('Wrong params "lat" & "lng"'));
    }
    if(spec.max_timestamp) {
      params.max_timestamp = spec.max_timestamp;
    }
    if(spec.min_timestamp) {
      params.min_timestamp = spec.min_timestamp;
    }
    if(spec.distance) {
      params.distance = spec.distance;
    }
    
    call('GET', '/media/search', params, function(err, result, limit) {
      if(err) {
        cb(err);
      } else if(result && result.meta && result.meta.code === 200) {
        cb(null, result.data, limit);
      } else {
        handle_error(result, cb);
      }
    });
  };

  /**
   * Retrieves a list of most popular media at the moment
   * @param cb(err, result, limit);
   */
  media_popular = function(cb) {
    call('GET', '/media/popular', {}, function(err, result, limit) {
      if(err) {
        cb(err);
      } else if(result && result.meta && result.meta.code === 200) {
        cb(null, result.data, limit);
      } else {
        handle_error(result, cb);
      }
    });
  };

  fwk.method(that, 'use', use, _super);

  fwk.method(that, 'user', user, _super);
  fwk.method(that, 'user_self_feed', user_self_feed, _super);
  fwk.method(that, 'user_media_recent', user_media_recent, _super);
  fwk.method(that, 'user_self_liked', user_self_liked, _super);
  fwk.method(that, 'user_search', user_search, _super);

  fwk.method(that, 'user_follows', user_follows, _super);
  fwk.method(that, 'user_followers', user_followers, _super);
  fwk.method(that, 'user_self_requested_by', user_self_requested_by, _super);
  fwk.method(that, 'user_relationship', user_relationship, _super);
  fwk.method(that, 'set_user_relationship', set_user_relationship, _super);

  fwk.method(that, 'media', media, _super);
  fwk.method(that, 'media_search', media_search, _super);
  fwk.method(that, 'media_popular', media_popular, _super);

  return that;
};

exports.instagram = instagram;