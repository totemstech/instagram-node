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

  my.limit = 5000;

  // public
  var use;                              /* use(spec);                                     */
  
  var user;                             /* user(user_id, cb);                             */
  var user_self_feed;                   /* user_self_feed(spec, cb);                      */
  var user_media_recent;                /* user_media_recent(spec, cb);                   */
  var user_self_liked;                  /* user_self_liked(spec, cb);                     */
  var user_search;                      /* user_search(query, [count], cb);               */

  var user_follows;                     /* user_follows(user_id, cb);                     */
  var user_followers;                   /* user_followers(user_id, cb);                   */
  var user_self_requested_by;           /* user_self_requested_by(cb);                    */
  var user_relationship;                /* user_relationship(user_id, cb);                */
  var set_user_relationship;            /* set_user_relationship(user_id, action, cb);    */

  var media;                            /* media(media_id, cb);                           */
  var media_search;                     /* media_search(spec, cb);                        */
  var media_popular;                    /* media_popular(cb);                             */

  var comments;                         /* comments(media_id, cb);                        */
  var add_comment;                      /* add_comment(media_id, text, cb);               */
  var del_comment;                      /* del_comment(media_id, comment_id, cb);         */

  var likes;                            /* likes(media_id, cb);                           */
  var add_like;                         /* add_like(media_id, cb);                        */
  var del_like;                         /* del_like(media_id, cb);                        */

  var tag;                              /* tag(tag, cb);                                  */
  var tag_media_recent;                 /* tag_media_recent(spec, cb);                    */
  var tag_search;                       /* tag_search(query, cb);                         */

  var location;                         /* location(location_id, cb);                     */
  var location_media_recent;            /* location_media_recent(spec, cb);               */
  var location_search;                  /* location_search(spec, cb);                     */

  // private
  var call;                             /* call(method, path, params, cb, retry);         */
  var handle_error;                     /* handle_error(body, cb, retry);                 */

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
   * @param from identify who called this function
   */
  call = function(method, path, params, cb, retry) {
    if(my.auth) {
      for(var opt in my.auth) {
        if(my.auth.hasOwnProperty(opt)) {
          params[opt] = my.auth[opt];
        }
      }
      var options = {
        host: 'api.instagram.com',
        method: method,
        path: '/v1' + path + (method === 'GET' || method === 'DELETE' ? '?' + query.stringify(params) : ''),
      };
      
      var req = https.request(options, function(res) {
        var body = '';
        res.setEncoding('utf8');

        res.on('data', function(chunk) {
          body += chunk;
        });

        res.on('end', function() {
          try {
            var result = JSON.parse(body);
            var limit = res.headers['x-ratelimit-remaining'];
            if(my.limit > limit) {
              my.limit = limit;
            }
            cb(null, result, limit);
          } catch(err) {
            handle_error(err, cb, retry);
          }
        });
      });

      req.on('error', function(err) {
        handle_error(err, cb, retry);
      });

      if(method !== 'GET' && method !== 'DELETE') {
        req.write(query.stringify(params));
      }

      req.end();
    } else {
      return handle_error(new Error('Must be authentified'), cb, retry);
    }
  };

  /**
   * Handle API errors
   * @param body the response from instagram API
   * @param cb(err);
   * @param retry a function that can be called to retry
   * Error objects can have
   *   - statusCode if error comes from instagram
   *   - retry a function that can be called to retry 
   *     with same params
   */
  handle_error = function(body, cb, retry) {
    if(body && body.meta && body.meta.error_type) {
      // if body is an instagram error
      var title = body.meta.error_type.replace(/[A-Z]{1}[a-z]{1,}/g, ' $&');
      var error = new Error(title + ': ' + body.meta.error_message);
      error.statusCode = body.meta.code;
      error.retry = retry;
      cb(error);
    } else if(body && body.message && body.stack) {
      // if body is an error
      body.retry = retry;
      cb(body);
    } else {
      var error = new Error('Unknown error');
      error.retry = retry;
      cb(error);
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
    var retry = function() {
      user(id, cb);
    };

    if(typeof id === 'string' && id !== '') {
      call('GET', '/users/' + id, {}, function(err, result, limit) {
        if(err) {
          handle_error(err, cb, retry);
        } else if(result && result.meta && result.meta.code === 200) {
          cb(null, result.data, limit);
        } else {
          handle_error(result, cb, retry);
        }
      }, retry);
    } else {
      return handle_error(new Error('Wrong param "id"'), cb, retry);
    }
  }; 

  /**
   * Retrieves current user feed
   * @param spec { count, min_id, max_id }
   * @param cb(err, feed, pagination, limit);
   */
  user_self_feed = function(spec, cb) {
    var retry = function() {
      user_self_feed(spec, cb);
    };
    
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
        handle_error(err, cb, retry);
      } else if(result && result.meta && result.meta.code === 200) {
        cb(null, result.data, result.pagination, limit);
      } else {
        handle_error(result, cb, retry);
      }
    }, retry);
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
    var retry = function() {
      user_media_recent(spec, cb);
    };
    
    if(typeof spec.user_id === 'string' && spec.user_id !== '') {
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
      
      call('GET', '/users/' + spec.user_id + '/media/recent', params, function(err, result, limit) {
        if(err) {
          handle_error(err, cb, retry);
        } else if(result && result.meta && result.meta.code === 200) {
          cb(null, result.data, result.pagination, limit);
        } else {
          handle_error(result, cb, retry);
        }
      }, retry);
    } else {
      return handle_error(new Error('Wrong param "user_id"'), cb, retry);
    }
  };

  /**
   * Retrieves current user likes
   * @param spec { count,        [opt] 
   *               max_like_id   [opt]
   *             }
   * @param cb(err, likes, pagination, limit);
   */
  user_self_liked = function(spec, cb) {
    var retry = function() {
      user_self_liked(spec, cb);
    };

    var params = {};
    if(spec.count) {
      params.count = spec.count;
    } 
    if(spec.max_like_id) {
      params.max_like_id = spec.max_like_id;
    }
    
    call('GET', '/users/self/media/liked', params, function(err, result, limit) {
      if(err) {
        handle_error(err, cb, retry);
      } else if(result && result.meta && result.meta.code === 200) {
        cb(null, result.data, result.pagination, limit);
      } else {
        handle_error(result, cb, retry);
      }
    }, retry);
  };

  /**
   * Search for a user according to the
   * given query
   * @param query the name to search for
   * @param count the number of users to return  [opt]
   * @param cb(err, users, limit);
   */
  user_search = function(query, count, cb) {
    var retry = function() {
      user_search(query, count, cb);
    };

    var params = {};

    if(typeof query !== 'string' || query === '') {
      return handle_error(new Error('Wrong param "query"'), cb, retry);
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
        handle_error(err, cb, retry);
      } else if(result && result.meta && result.meta.code === 200) {
        cb(null, result.data, limit);
      } else {
        handle_error(result, cb, retry);
      }
    }, retry);
  };

  /**
   * Retrieves the list of users the given user follows
   * @param user_id the user to check
   * @param cb(err, users, limit);
   */
  user_follows = function(user_id, cb) {
    var retry = function() {
      user_follows(user_id, cb);
    };
    
    if(typeof user_id === 'string' && user_id !== '') {
      call('GET', '/users/' + user_id + '/follows', {}, function(err, result, limit) {
        if(err) {
          handle_error(err, cb, retry);
        } else if(result && result.meta && result.meta.code === 200) {
          cb(null, result.data, limit);
        } else {
          handle_error(result, cb, retry);
        }
      }, retry);
    } else {
      return handle_error(new Error('Wrong param "user_id"'), cb, retry);
    }
  };

  /**
   * Retrieves the list of users the given user is followed by
   * @param user_id the user to check
   * @param cb(err, users, limit);
   */
  user_followers = function(user_id, cb) {
    var retry = function() {
      user_followers(user_id, cb);
    };
    
    if(typeof user_id === 'string' && user_id !== '') {
      call('GET', '/users/' + user_id + '/followed-by', {}, function(err, result, limit) {
        if(err) {
          handle_error(err, cb, retry);
        } else if(result && result.meta && result.meta.code === 200) {
          cb(null, result.data, limit);
        } else {
          handle_error(result, cb, retry);
        }
      }, retry);
    } else {
      return handle_error(new Error('Wrong param "user_id"'), cb, retry);
    }
  };

  /**
   * Retrieves the list of users who have requested the current users's
   * permission to follow
   * @param cb(err, users, limit);
   */
  user_self_requested_by = function(cb) {
    var retry = function() {
      user_self_requested_by(cb);
    };

    call('GET', '/users/self/requested-by', {}, function(err, result, limit) {
      if(err) {
        handle_error(err, cb, retry);
      } else if(result && result.meta && result.meta.code === 200) {
        cb(null, result.data, limit);
      } else {
        handle_error(result, cb, retry);
      }
    }, retry);
  };

  /**
   * Get information about a relationship to another user
   * @param user_id the user to check
   * @param cb(err, result, limit);
   */
  user_relationship = function(user_id, cb) {
    var retry = function() {
      user_relationship(user_id, cb);
    };
    
    if(typeof user_id === 'string' && user_id !== '') {
      call('GET', '/users/' + user_id + '/relationship', {}, function(err, result, limit) {
        if(err) {
          handle_error(err, cb, retry);
        } else if(result && result.meta && result.meta.code === 200) {
          cb(null, result.data, limit);
        } else {
          handle_error(result, cb, retry);
        }
      }, retry);
    } else {
      return handle_error(new Error('Wrong param "user_id"'), cb, retry);
    }
  };

  /**
   * Modify the relationship between current user and the target user
   * @param user_id the target user
   * @param action 'follow' || 'unfollow' || 'block' || 'unblock' || 'approve' || 'ignore' 
   * @param cb(err, result, limit);
   */
  set_user_relationship = function(user_id, action, cb) {
    var retry = function() {
      set_user_relationship(user_id, action, cb);
    };

    if(typeof user_id === 'string' && user_id !== '') {
      if(['follow', 'unfollow', 'block', 'unblock', 'approve', 'ignore'].indexOf(action.toLowerCase()) !== -1) {
        var params = {
          action: action.toLowerCase()
        };
      } else {
        return handle_error(new Error('Wrong param "action"'), cb);
      }
      
      call('POST', '/users/' + user_id + '/relationship', params, function(err, result, limit) {
        if(err) {
          handle_error(err, cb, retry);
        } else if(result && result.meta && result.meta.code === 200) {
          cb(null, result.data, limit);
        } else {
          handle_error(result, cb, retry);
        }
      }, retry);
    } else {
      return handle_error(new Error('Wrong param "user_id"'), cb, retry);
    }
  };

  /**
   * Retrieves information about a given media
   * @param media_id the id of the media
   * @param cb(err, result, limit);
   */
  media = function(media_id, cb) {
    var retry = function() {
      media(media_id, cb);
    };

    if(typeof media_id === 'string' && media_id !== '') {
      call('GET', '/media/' + media_id, {}, function(err, result, limit) {
        if(err) {
          handle_error(err, cb, retry);
        } else if(result && result.meta && result.meta.code === 200) {
          cb(null, result.data, limit);
        } else {
          handle_error(result, cb, retry);
        }
      }, retry);
    } else {
      return handle_error(new Error('Wrong param "media_id"'), cb, retry);
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
    var retry = function() {
      media_search(spec, cb);
    };

    var params = {};
    if(spec.lat && spec.lng) {
      params.lat = spec.lat;
      params.lng = spec.lng;
    } else {
      return handle_error(new Error('Wrong params "lat" & "lng"'), cb, retry);
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
        handle_error(err, cb, retry);
      } else if(result && result.meta && result.meta.code === 200) {
        cb(null, result.data, limit);
      } else {
        handle_error(result, cb, retry);
      }
    }, retry);
  };

  /**
   * Retrieves a list of most popular media at the moment
   * @param cb(err, result, limit);
   */
  media_popular = function(cb) {
    var retry = function() {
      media_popular(cb);
    };
      
    call('GET', '/media/popular', {}, function(err, result, limit) {
      if(err) {
        handle_error(err, cb, retry);
      } else if(result && result.meta && result.meta.code === 200) {
        cb(null, result.data, limit);
      } else {
        handle_error(result, cb, retry);
      }
    }, retry);
  };

  /**
   * Retrieves all the comments for the given media
   * @param media_id
   * @param cb(err, result, limit);
   */
  comments = function(media_id, cb) {
    var retry = function() {
      comments(media_id, cb);
    };
    
    if(typeof media_id === 'string' && media_id !== '') {
      call('GET', '/media/' + media_id + '/comments', {}, function(err, result, limit) {
        if(err) {
          handle_error(err, cb, retry);
        } else if(result && result.meta && result.meta.code === 200) {
          cb(null, result.data, limit);
        } else {
          handle_error(result, cb, retry);
        }
      }, retry);
    } else {
      return handle_error(new Error('Wrong param "media_id"'), cb, retry);
    }
  };

  /**
   * Add a comment on the given media
   * @param media_id the media id
   * @param text the text to post
   * @param cb(err, limit);
   */
  add_comment = function(media_id, text, cb) {
    var retry = function() {
      add_comment(media_id, text, cb);
    };

    if(typeof media_id === 'string' && media_id !== '' &&
       typeof text === 'string' && text !== '') {
      var params = { 
        text: text
      };
      call('POST', '/media/' + media_id + '/comments', params, function(err, result, limit) {
        if(err) {
          handle_error(err, cb, retry);
        } else if(result && result.meta && result.meta.code === 200) {
          cb(null, limit);
        } else {
          handle_error(result, cb, retry);
        }
      }, retry);
    } else {
      return handle_error(new Error('Wrong param "media_id" or "text"'), cb, retry);
    }
  };
  
  /**
   * Delete the given comment from the given media
   * @param media_id the media id
   * @param comment_id the comment id
   * @param cb(err, limit);
   */
  del_comment = function(media_id, comment_id, cb) {
    var retry = function() {
      del_comment(media_id, comment_id, cb);
    };

    if(typeof media_id === 'string' && media_id !== '' &&
       typeof comment_id === 'string' && comment_id !== '') {
      call('DELETE', '/media/' + media_id + '/comments/' + comment_id, {}, function(err, result, limit) {
        if(err) {
          handle_error(err, cb, retry);
        } else if(result && result.meta && result.meta.code === 200) {
          cb(null, limit);
        } else {
          handle_error(result, cb, retry);
        }
      }, retry);
    } else {
      return handle_error(new Error('Wrong param "media_id" or "comment_id"'), cb, retry);
    }
  };

  /**
   * Retrieves all the likes for the given media
   * @param media_id
   * @param cb(err, result, limit);
   */
  likes = function(media_id, cb) {
    var retry = function() {
      likes(media_id, cb);
    };
    
    if(typeof media_id === 'string' && media_id !== '') {
      call('GET', '/media/' + media_id + '/likes', {}, function(err, result, limit) {
        if(err) {
          handle_error(err, cb, retry);
        } else if(result && result.meta && result.meta.code === 200) {
          cb(null, result.data, limit);
        } else {
          handle_error(result, cb, retry);
        }
      }, retry);
    } else {
      return handle_error(new Error('Wrong param "media_id"'), cb, retry);
    }
  };

  /**
   * Add a like on the given media
   * @param media_id the media id
   * @param cb(err, limit);
   */
  add_like = function(media_id, cb) {
    var retry = function() {
      add_like(media_id, cb);
    };

    if(typeof media_id === 'string' && media_id !== '') {
      call('POST', '/media/' + media_id + '/likes', {}, function(err, result, limit) {
        if(err) {
          handle_error(err, cb, retry);
        } else if(result && result.meta && result.meta.code === 200) {
          cb(null, limit);
        } else {
          handle_error(result, cb, retry);
        }
      }, retry);
    } else {
      return handle_error(new Error('Wrong param "media_id"'), cb, retry);
    }
  };
  
  /**
   * Delete the like from the given media
   * @param media_id the media id
   * @param cb(err, limit);
   */
  del_like = function(media_id, cb) {
    var retry = function() {
      del_like(media_id, cb);
    };

    if(typeof media_id === 'string' && media_id !== '') {
      call('DELETE', '/media/' + media_id + '/likes', {}, function(err, result, limit) {
        if(err) {
          handle_error(err, cb, retry);
        } else if(result && result.meta && result.meta.code === 200) {
          cb(null, limit);
        } else {
          handle_error(result, cb, retry);
        }
      }, retry);
    } else {
      return handle_error(new Error('Wrong param "media_id"'), cb, retry);
    }
  };
   
  /**
   * Retrieves information about a tag
   * @param tag the tag
   * @param cb(err, result, limit);
   */
  tag = function(tag, cb) {
    var retry = function() {
      tag(tag, cb);
    };

    if(typeof tag === 'string' && tag !== '') {
      call('GET', '/tags/' + tag, {}, function(err, result, limit) {
        if(err) {
          handle_error(err, cb, retry);
        } else if(result && result.meta && result.meta.code === 200) {
          cb(null, result.data, limit);
        } else {
          handle_error(result, cb, retry);
        }
      }, retry);
    } else {
      return handle_error(new Error('Wrong param "tag"'), cb, retry);
    }
  };

  /**
   * Get recent medias for the given tag
   * @param spec { tag, 
   *               min_id,     [opt]
   *               max_id      [opt]
   *             }
   * @param cb(err, result, pagination, limit);
   */
  tag_media_recent = function(spec, cb) {
    var retry = function() {
      tag_media_recent(spec, cb);
    };

    if(typeof spec.tag === 'string' && spec.tag !== '') {
      var params = {};
      if(spec.min_id) {
        params.min_id = spec.min_id;
      }
      if(spec.max_id) {
        params.max_id = spec.max_id;
      }

      call('GET', '/tags/' + spec.tag + '/media/recent', params, function(err, result, limit) {
        if(err) {
          handle_error(err, cb, retry);
        } else if(result && result.meta && result.meta.code === 200) {
          cb(null, result.data, result.pagination, limit);
        } else {
          handle_error(result, cb, retry);
        }
      }, retry);
    } else {
      return handle_error(new Error('Wrong param "tag"'), cb, retry);
    }
  };

  /**
   * Search for tags by name
   * @param query the search to perform
   * @param cb(err, result, limit);
   */
  tag_search = function(query, cb) {
    var retry = function() {
      tag_search(query, cb);
    };
    
    if(typeof query === 'string' && query !== '') {        
      call('GET', '/tags/search', { q: query }, function(err, result, limit) {
        if(err) {
          handle_error(err, cb, retry);
        } else if(result && result.meta && result.meta.code === 200) {
          cb(null, result.data, limit);
        } else {
          handle_error(result, cb, retry);
        }
      }, retry);
    } else {
      return handle_error(new Error('Wrong param "query"'), cb, retry);
    }
  };


  /**
   * Retrieves information about a location
   * @param location_id the location id
   * @param cb(err, result, limit);
   */
  location = function(location_id, cb) {
    var retry = function() {
      location(location_id, cb);
    };

    if(typeof location_id === 'string' && location_id !== '') {
      call('GET', '/locations/' + location_id, {}, function(err, result, limit) {
        if(err) {
          handle_error(err, cb, retry);
        } else if(result && result.meta && result.meta.code === 200) {
          cb(null, result.data, limit);
        } else {
          handle_error(result, cb, retry);
        }
      }, retry);
    } else {
      return handle_error(new Error('Wrong param "location_id"'), cb, retry);
    }
  };

  /**
   * Get recent medias for the given location
   * @param spec { location_id, 
   *               min_id,          [opt]
   *               max_id,          [opt]
   *               min_timestamp,   [opt]
   *               max_timestamp    [opt]
   *             }
   * @param cb(err, result, pagination, limit);
   */
  location_media_recent = function(spec, cb) {
    var retry = function() {
      location_media_recent(spec, cb);
    };

    if(typeof spec.location_id === 'string' && spec.location_id !== '') {
      var params = {};
      if(spec.min_id) {
        params.min_id = spec.min_id;
      }
      if(spec.max_id) {
        params.max_id = spec.max_id;
      }
      if(spec.min_timestamp) {
        params.min_timestamp = spec.min_timestamp;
      }
      if(spec.max_timestamp) {
        params.max_timestamp = spec.max_timestamp;
      }

      call('GET', '/locations/' + spec.location_id + '/media/recent', params, function(err, result, limit) {
        if(err) {
          handle_error(err, cb, retry);
        } else if(result && result.meta && result.meta.code === 200) {
          cb(null, result.data, result.pagination, limit);
        } else {
          handle_error(result, cb, retry);
        }
      }, retry);
    } else {
      return handle_error(new Error('Wrong param "location_id"'), cb, retry);
    }
  };

  /**
   * Search for locations by lat/lng
   * @param spec { lat, 
   *               lng,
   *               distance,          [opt]
   *               foursquare_v2_id,  [opt]
   *               foursquare_id      [opt]
   *             }
   * @param cb(err, result, limit);
   */
  location_search = function(spec, cb) {
    var retry = function() {
      location_search(spec, cb);
    };

    var params = {};
    if(typeof spec.lat === 'number' && typeof spec.lng === 'number') {
      params.lat = spec.lat;
      params.lng = spec.lng;
    } else if(spec.foursquare_v2_id) {
      params.foursquare_v2_id = spec.foursquare_v2_id;
    } else if(spec.foursquare_id) {
      params.foursquare_id = spec.foursquare_id;
    } else {
      return handle_error(new Error('Wrong param "lat/lng" or "foursquare(_v2)_id"'), cb, retry);
    }
    
    call('GET', '/locations/search', params, function(err, result, limit) {
      if(err) {
        handle_error(err, cb, retry);
      } else if(result && result.meta && result.meta.code === 200) {
        cb(null, result.data, limit);
      } else {
        handle_error(result, cb, retry);
      }
    }, retry);
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

  fwk.method(that, 'comments', comments, _super);
  fwk.method(that, 'add_comment', add_comment, _super);
  fwk.method(that, 'del_comment', del_comment, _super);

  fwk.method(that, 'likes', likes, _super);
  fwk.method(that, 'add_like', add_like, _super);
  fwk.method(that, 'del_like', del_like, _super);

  fwk.method(that, 'tag', tag, _super);
  fwk.method(that, 'tag_media_recent', tag_media_recent, _super);
  fwk.method(that, 'tag_search', tag_search, _super);

  fwk.method(that, 'location', location, _super);
  fwk.method(that, 'location_media_recent', location_media_recent, _super);
  fwk.method(that, 'location_search', location_search, _super);

  fwk.getter(that, 'limit', my, 'limit');

  return that;
};

exports.instagram = instagram;