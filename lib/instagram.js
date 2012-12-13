// Copyright Teleportd Ltd. and other Contributors
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

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

  my.limit = null;

  // public
  var use;                              /* use(spec);                                       */
  
  var user;                             /* user(user_id, cb);                               */
  var user_self_feed;                   /* user_self_feed(options, cb);                     */
  var user_media_recent;                /* user_media_recent(user_id, options, cb);         */
  var user_self_liked;                  /* user_self_liked(options, cb);                    */
  var user_search;                      /* user_search(query, options, cb);                 */

  var user_follows;                     /* user_follows(user_id, cb);                       */
  var user_followers;                   /* user_followers(user_id, cb);                     */
  var user_self_requested_by;           /* user_self_requested_by(cb);                      */
  var user_relationship;                /* user_relationship(user_id, cb);                  */
  var set_user_relationship;            /* set_user_relationship(user_id, action, cb);      */

  var media;                            /* media(media_id, cb);                             */
  var media_search;                     /* media_search(lat, lng, options, cb);             */
  var media_popular;                    /* media_popular(cb);                               */

  var comments;                         /* comments(media_id, cb);                          */
  var add_comment;                      /* add_comment(media_id, text, cb);                 */
  var del_comment;                      /* del_comment(media_id, comment_id, cb);           */

  var likes;                            /* likes(media_id, cb);                             */
  var add_like;                         /* add_like(media_id, cb);                          */
  var del_like;                         /* del_like(media_id, cb);                          */

  var tag;                              /* tag(tag, cb);                                    */
  var tag_media_recent;                 /* tag_media_recent(tag, options, cb);              */
  var tag_search;                       /* tag_search(query, cb);                           */

  var location;                         /* location(location_id, cb);                       */
  var location_media_recent;            /* location_media_recent(location_id, options, cb); */
  var location_search;                  /* location_search(spec, options, cb);              */

  // private
  var call;                             /* call(method, path, params, cb, retry);           */
  var handle_error;                     /* handle_error(body, cb, retry);                   */

  var that = {};

  /*******************************/
  /*       Private helpers       */
  /*******************************/

  /**
   * Make a call on instagram API with the given params, path & method
   * @param method string the request method
   * @param path string the path
   * @param params object the params
   * @param cb function (err, result, limit);
   * @param retry function a retry function
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
            my.limit = limit;
            cb(null, result, limit);
          } catch(err) {
            handle_error(err, cb, retry, res.statusCode, body);
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
   * @param body object the response from instagram API
   * @param cb function (err);
   * @param retry function can be called to retry
   * @param status number the status code [opt]
   * @param bdy  string  the body received from instagram [opt]
   * Error objects can have
   *   - status_code status code [opt]
   *   - body body received      [opt]
   *   - error_type error type from instagram
   *   - error_message error message from instagram
   *   - code if error comes from instagram
   *   - retry a function that can be called to retry 
   *           with same params
   */
  handle_error = function(body, cb, retry, status, bdy) {
    if(body && body.meta && body.meta.error_type) {
      // if body is an instagram error
      var error = new Error(body.meta.error_type + ': ' + body.meta.error_message);
      error.code = body.meta.code;
      error.error_type = body.meta.error_type;
      error.error_message = body.meta.error_message;
      error.retry = retry;
      cb(error);
    } else if(body && body.message && body.stack) {
      // if body is an error
      body.retry = retry;
      if(status)
        body.status_code = status;
      if(bdy)
        body.body = bdy;
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
   * Use the specified options to sign requests: can be an access_key 
   * or a client_id/client_secret keys pair
   * @param options object { access_key } ||
   *                       { client_id, client_secret }
   * @throws Error if options is wrong
   */
  use = function(options) {
    if(typeof options === 'object') {
      if(options.access_token) {
        my.limit = null;
        my.auth = { 
          access_token: options.access_token 
        };
      } else if(options.client_id && options.client_secret) {
        my.limit = null;
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
   * @param id string the user id
   * @param cb function (err, user, limit);
   */
  user = function(id, cb) {
    var retry = function() {
      user(id, cb);
    };

    if(typeof id !== 'string' || id === '') {
      return handle_error(new Error('Wrong param "id"'), cb, retry);
    }

    call('GET', '/users/' + id, {}, function(err, result, limit) {
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
   * Retrieves the current user feed
   * @param options object { count,  [opt]
   *                         min_id, [opt] 
   *                         max_id  [opt] }
   * @param cb function (err, feed, pagination, limit);
   */
  user_self_feed = function(options, cb) {
    var retry = function() {
      user_self_feed(options, cb);
    };
    
    if(!cb && typeof options === 'function') {
      cb = options;
      options = {};
    }
    var params = {};

    if(options.count) {
      params.count = options.count;
    }
    if(options.min_id) {
      params.min_id = options.min_id;
    }
    if(options.max_id) {
      params.max_id = options.max_id;
    }

    call('GET', '/users/self/feed', params, function(err, result, limit) {
      if(err) {
        handle_error(err, cb, retry);
      } else if(result && result.meta && result.meta.code === 200) {
        if(result.pagination && result.pagination.next_max_id) {
          options = fwk.shallow(options);
          options.max_id = result.pagination.next_max_id;
          var next = function(cb) {
            user_self_feed(options, cb);
          };
          result.pagination.next = next;
        }

        cb(null, result.data, result.pagination, limit);
      } else {
        handle_error(result, cb, retry);
      }
    }, retry);
  };

  /**
   * Retrieves the current user likes
   * @param options object { count,        [opt] 
   *                         max_like_id   [opt] }
   * @param cb function (err, likes, pagination, limit);
   */
  user_self_liked = function(options, cb) {
    var retry = function() {
      user_self_liked(options, cb);
    };

    if(!cb && typeof options === 'function') {
      cb = options;
      options = {};
    }
    var params = {};

    if(options.count) {
      params.count = options.count;
    } 
    if(options.max_like_id) {
      params.max_like_id = options.max_like_id;
    }
    
    call('GET', '/users/self/media/liked', params, function(err, result, limit) {
      if(err) {
        handle_error(err, cb, retry);
      } else if(result && result.meta && result.meta.code === 200) {
        if(result.pagination && result.pagination.next_max_like_id) {
          options = fwk.shallow(options);
          options.max_like_id = result.pagination.next_max_like_id;
          var next = function(cb) {
            user_self_liked(options, cb);
          };
          result.pagination.next = next;
          delete result.pagination.next_url;
        }
        
        cb(null, result.data, result.pagination, limit);
      } else {
        handle_error(result, cb, retry);
      }
    }, retry);
  };


  /**
   * Get the mos recent media published by a user
   * @param user_id string the user id
   * @param options object { count,           [opt]
   *                         max_timestamp,   [opt] 
   *                         min_timestamp,   [opt]
   *                         max_id,          [opt] 
   *                         min_id           [opt] }
   * @param cb(err, results, pagination, limit);
   */
  user_media_recent = function(user_id, options, cb) {
    var retry = function() {
      user_media_recent(user_id, options, cb);
    };

    if(!cb && typeof options === 'function') {
      cb = options;
      options = {};
    }
    var params = {};
    
    if(typeof user_id !== 'string' || user_id === '') {
      return handle_error(new Error('Wrong param "user_id"'), cb, retry);
    }

    if(options.count) {
      params.count = options.count;
    }
    if(options.max_timestamp) {
      params.max_timestamp = options.max_timestamp;
    }
    if(options.min_timestamp) {
      params.min_timestamp = options.min_timestamp;
    }
    if(options.max_id) {
      params.max_id = options.max_id;
    }
    if(options.min_id) {
      params.min_id = options.min_id;
    }
      
    call('GET', '/users/' + user_id + '/media/recent', params, function(err, result, limit) {
      if(err) {
        handle_error(err, cb, retry);
      } else if(result && result.meta && result.meta.code === 200) {
        if(result.pagination && result.pagination.next_max_id) {
          options = fwk.shallow(options);
          options.max_id = result.pagination.next_max_id;
          var next = function(cb) {
            user_media_recent(user_id, options, cb);
          };
          result.pagination.next = next;
          delete result.pagination.next_url;
        }

        cb(null, result.data, result.pagination, limit);
      } else {
        handle_error(result, cb, retry);
      }
    }, retry);
  };

  /**
   * Search for a user according to the given query
   * @param query string the name to search for
   * @param options object { count [opt] }
   * @param cb function (err, users, limit);
   */
  user_search = function(query, options, cb) {
    var retry = function() {
      user_search(query, options, cb);
    };

    if(!cb && typeof options === 'function') {
      cb = options;
      options = {};
    }
    var params = {};

    if(typeof query !== 'string' || query === '') {
      return handle_error(new Error('Wrong param "query": ' + query), cb, retry);
    } 
    params.q = query;

    if(options.count) {
      params.count = options.count;
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
   * @param user_id string the user to check
   * @param options object { count, [opt] 
   *                         cursor [opt] }
   * @param cb function (err, users, pagination, limit);
   */
  user_follows = function(user_id, options, cb) {
    var retry = function() {
      user_follows(user_id, options, cb);
    };

    if(!cb && typeof options === 'function') {
      cb = options;
      options = {};
    }
    
    if(typeof user_id !== 'string' || user_id === '') {
      return handle_error(new Error('Wrong param "user_id"'), cb, retry);
    }
    
    var params = {};
    if(options.count) {
      params.count = options.count;
    }
    if(options.cursor) {
      params.cursor = options.cursor;
    }

    call('GET', '/users/' + user_id + '/follows', params, function(err, result, limit) {
      if(err) {
        handle_error(err, cb, retry);
      } else if(result && result.meta && result.meta.code === 200) {
        if(result.pagination && result.pagination.next_cursor) {
          options = fwk.shallow(options);
          options.cursor = result.pagination.next_cursor;
          var next = function(cb) {
            user_follows(user_id, options, cb);
          };
          result.pagination.next = next;
          delete result.pagination.next_url;
        }

        cb(null, result.data, result.pagination, limit);
      } else {
        handle_error(result, cb, retry);
      }
    }, retry);
  };

  /**
   * Retrieves the list of users the given user is followed by
   * @param user_id string the user to check
   * @param options object { count, [opt]
   *                         cursor [opt] }
   * @param cb function (err, users, pagination, limit);
   */
  user_followers = function(user_id, options, cb) {
    var retry = function() {
      user_followers(user_id, options, cb);
    };

    if(!cb && typeof options === 'function') {
      cb = options;
      options = {};
    }
    
    if(typeof user_id !== 'string' || user_id === '') {
      return handle_error(new Error('Wrong param "user_id"'), cb, retry);
    }

    var params = {};
    if(options.count) {
      params.count = options.count;
    }
    if(options.cursor) {
      params.cursor = options.cursor;
    }

    call('GET', '/users/' + user_id + '/followed-by', params, function(err, result, limit) {
      if(err) {
        handle_error(err, cb, retry);
      } else if(result && result.meta && result.meta.code === 200) {
        if(result.pagination && result.pagination.next_cursor) {
          options = fwk.shallow(options);
          options.cursor = result.pagination.next_cursor;
          var next = function(cb) {
            user_followers(user_id, options, cb);
          };
          result.pagination.next = next;
          delete result.pagination.next_url;
        }

        cb(null, result.data, result.pagination, limit);
      } else {
        handle_error(result, cb, retry);
      }
    }, retry);
  };

  /**
   * Retrieves the list of users who have requested the current users's
   * permission to follow
   * @param cb function (err, users, limit);
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
   * @param user_id string the user to check
   * @param cb function (err, result, limit);
   */
  user_relationship = function(user_id, cb) {
    var retry = function() {
      user_relationship(user_id, cb);
    };
    
    if(typeof user_id !== 'string' || user_id === '') {
      return handle_error(new Error('Wrong param "user_id"'), cb, retry);
    }

    call('GET', '/users/' + user_id + '/relationship', {}, function(err, result, limit) {
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
   * Modify the relationship between current user and the target user
   * @param user_id string the target user
   * @param action string 'follow' || 'unfollow' || 'block' || 'unblock' || 'approve' || 'ignore' 
   * @param cb function (err, result, limit);
   */
  set_user_relationship = function(user_id, action, cb) {
    var retry = function() {
      set_user_relationship(user_id, action, cb);
    };

    if(typeof user_id !== 'string' || user_id === '') {
      return handle_error(new Error('Wrong param "user_id"'), cb, retry);
    }

    if(['follow', 'unfollow', 'block', 'unblock', 'approve', 'ignore'].indexOf(action.toLowerCase()) === -1) {
      return handle_error(new Error('Wrong param "action"'), cb);
    }

    var params = {
      action: action.toLowerCase()
    };    
    
    call('POST', '/users/' + user_id + '/relationship', params, function(err, result, limit) {
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
   * Retrieves information about a given media
   * @param media_id string the id of the media
   * @param cb function (err, result, limit);
   */
  media = function(media_id, cb) {
    var retry = function() {
      media(media_id, cb);
    };

    if(typeof media_id !== 'string' || media_id === '') {
      return handle_error(new Error('Wrong param "media_id"'), cb, retry);
    }

    call('GET', '/media/' + media_id, {}, function(err, result, limit) {
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
   * Search for media in a given area
   * @param lat number the latitude
   * @param lng number the longitude
   * @param options object { min_timestamp,    [opt]
   *                         max_timestamp,    [opt]
   *                         distance          [opt] }
   * @param cb function (err, result, pagination, limit);
   */
  media_search = function(lat, lng, options, cb) {
    var retry = function() {
      media_search(lat, lng, options, cb);
    };

    if(!cb && typeof options === 'function') {
      cb = options;
      options = {};
    }
    var params = {};

    if(typeof lat !== 'number' || typeof lng !== 'number') {
      return handle_error(new Error('Wrong params "lat" & "lng"'), cb, retry);
    } 
    
    params.lat = lat;
    params.lng = lng;

    if(options.max_timestamp) {
      if(options.max_timestamp > parseInt(Date.now() / 1000, 10)) {
        options.max_timestamp = parseInt(options.max_timestamp / 1000, 10);
      }
      params.max_timestamp = options.max_timestamp;
    }
    if(options.min_timestamp) {
      if(options.min_timestamp > parseInt(Date.now() / 1000, 10)) {
        options.min_timestamp = parseInt(options.min_timestamp / 1000, 10);
      }
      params.min_timestamp = options.min_timestamp;
    }
    if(options.distance) {
      params.distance = options.distance;
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
   * @param cb function (err, result, limit);
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
   * @param media_id string the media id
   * @param cb function (err, result, limit);
   */
  comments = function(media_id, cb) {
    var retry = function() {
      comments(media_id, cb);
    };
    
    if(typeof media_id !== 'string' || media_id === '') {
      return handle_error(new Error('Wrong param "media_id"'), cb, retry);
    }

    call('GET', '/media/' + media_id + '/comments', {}, function(err, result, limit) {
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
   * Add a comment on the given media
   * @param media_id string the media id
   * @param text string the text to post
   * @param cb function (err, limit);
   */
  add_comment = function(media_id, text, cb) {
    var retry = function() {
      add_comment(media_id, text, cb);
    };

    if(typeof media_id !== 'string' || media_id === '' ||
       typeof text !== 'string' || text === '') {
      return handle_error(new Error('Wrong param "media_id" or "text"'), cb, retry);
    }

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
  };
  
  /**
   * Delete the given comment from the given media
   * @param media_id string the media id
   * @param comment_id string the comment id
   * @param cb function (err, limit);
   */
  del_comment = function(media_id, comment_id, cb) {
    var retry = function() {
      del_comment(media_id, comment_id, cb);
    };

    if(typeof media_id !== 'string' || media_id === '' ||
       typeof comment_id !== 'string' || comment_id === '') {
      return handle_error(new Error('Wrong param "media_id" or "comment_id"'), cb, retry);
    }

    call('DELETE', '/media/' + media_id + '/comments/' + comment_id, {}, function(err, result, limit) {
      if(err) {
        handle_error(err, cb, retry);
      } else if(result && result.meta && result.meta.code === 200) {
        cb(null, limit);
      } else {
        handle_error(result, cb, retry);
      }
    }, retry);
  };

  /**
   * Retrieves all the likes for the given media
   * @param media_id string the media id
   * @param cb function (err, result, limit);
   */
  likes = function(media_id, cb) {
    var retry = function() {
      likes(media_id, cb);
    };
    
    if(typeof media_id !== 'string' || media_id === '') {
      return handle_error(new Error('Wrong param "media_id"'), cb, retry);
    }

    call('GET', '/media/' + media_id + '/likes', {}, function(err, result, limit) {
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
   * Add a like on the given media
   * @param media_id string the media id
   * @param cb function (err, limit);
   */
  add_like = function(media_id, cb) {
    var retry = function() {
      add_like(media_id, cb);
    };

    if(typeof media_id !== 'string' || media_id === '') {
      return handle_error(new Error('Wrong param "media_id"'), cb, retry);
    }

    call('POST', '/media/' + media_id + '/likes', {}, function(err, result, limit) {
      if(err) {
        handle_error(err, cb, retry);
      } else if(result && result.meta && result.meta.code === 200) {
        cb(null, limit);
      } else {
        handle_error(result, cb, retry);
      }
    }, retry);
  };
  
  /**
   * Delete the like from the given media
   * @param media_id string the media id
   * @param cb function (err, limit);
   */
  del_like = function(media_id, cb) {
    var retry = function() {
      del_like(media_id, cb);
    };

    if(typeof media_id !== 'string' || media_id === '') {
      return handle_error(new Error('Wrong param "media_id"'), cb, retry);
    }

    call('DELETE', '/media/' + media_id + '/likes', {}, function(err, result, limit) {
      if(err) {
        handle_error(err, cb, retry);
      } else if(result && result.meta && result.meta.code === 200) {
        cb(null, limit);
      } else {
        handle_error(result, cb, retry);
      }
    }, retry);
  };
   
  /**
   * Retrieves information about a tag
   * @param _tag string the tag
   * @param cb function (err, result, limit);
   */
  tag = function(_tag, cb) {
    var retry = function() {
      tag(_tag, cb);
    };

    if(typeof _tag !== 'string' || _tag === '') {
      return handle_error(new Error('Wrong param "tag"'), cb, retry);
    }

    call('GET', '/tags/' + _tag, {}, function(err, result, limit) {
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
   * Get recent medias for the given tag
   * @param tag string the tag
   * @param options object { min_id,     [opt]
   *                         max_id      [opt] }
   * @param cb function (err, result, pagination, limit);
   */
  tag_media_recent = function(tag, options, cb) {
    var retry = function() {
      tag_media_recent(tag, options, cb);
    };

    if(!cb && typeof options === 'function') {
      cb = options;
      options = {};
    }
    var params = {};

    if(typeof tag !== 'string' || tag === '') {
      return handle_error(new Error('Wrong param "tag"'), cb, retry);
    }
    
    if(options.min_id || options.min_tag_id) {
      params.min_tag_id = options.min_id || options.min_tag_id;
    }
    if(options.max_id || options.max_tag_id) {
      params.max_tag_id = options.max_id || options.max_tag_id;
    }
    
    call('GET', '/tags/' + tag + '/media/recent', params, function(err, result, limit) {
      if(err) {
        handle_error(err, cb, retry);
      } else if(result && result.meta && result.meta.code === 200) {
        if(result.pagination && result.pagination.next_max_tag_id) {
          options = fwk.shallow(options);
          // Syntax weirdness coming from IG API (max_tag_id instead of max_id)
          // [see http://instagram.com/developer/endpoints/tags/]
          options.max_tag_id = result.pagination.next_max_tag_id;
          var next = function(cb) {
            tag_media_recent(tag, options, cb);
          };
          result.pagination.next = next;
          delete result.pagination.next_url;
        }

        cb(null, result.data, result.pagination, limit);
      } else {
        handle_error(result, cb, retry);
      }
    }, retry);
  };

  /**
   * Search for tags by name
   * @param query string the search to perform
   * @param cb function (err, result, limit);
   */
  tag_search = function(query, cb) {
    var retry = function() {
      tag_search(query, cb);
    };
    
    if(typeof query !== 'string' || query === '') {        
      return handle_error(new Error('Wrong param "query"'), cb, retry);
    }

    call('GET', '/tags/search', { q: query }, function(err, result, limit) {
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
   * Retrieves information about a location
   * @param location_id string the location id
   * @param cb function (err, result, limit);
   */
  location = function(location_id, cb) {
    var retry = function() {
      location(location_id, cb);
    };

    if(typeof location_id !== 'string' || location_id === '') {
      return handle_error(new Error('Wrong param "location_id"'), cb, retry);
    }

    call('GET', '/locations/' + location_id, {}, function(err, result, limit) {
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
   * Get recent medias for the given location
   * @param location_id string the location id
   * @param options object { min_id,          [opt]
   *                         max_id,          [opt]
   *                         min_timestamp,   [opt]
   *                         max_timestamp    [opt] }
   * @param cb function (err, result, pagination, limit);
   */
  location_media_recent = function(location_id, options, cb) {
    var retry = function() {
      location_media_recent(location_id, options, cb);
    };

    if(!cb && typeof options === 'function') {
      cb = options;
      options = {};
    }
    
    if(typeof location_id !== 'string' || location_id === '') {
      return handle_error(new Error('Wrong param "location_id"'), cb, retry);
    }

    var params = {};
    if(options.min_id) {
      params.min_id = options.min_id;
    }
    if(options.max_id) {
      params.max_id = options.max_id;
    }
    if(options.min_timestamp) {
      params.min_timestamp = options.min_timestamp;
    }
    if(options.max_timestamp) {
      params.max_timestamp = options.max_timestamp;
    }

    call('GET', '/locations/' + location_id + '/media/recent', params, function(err, result, limit) {
      if(err) {
        handle_error(err, cb, retry);
      } else if(result && result.meta && result.meta.code === 200) {
        if(result.pagination && result.pagination.next_max_id) {
          options = fwk.shallow(options);
          options.max_id = result.pagination.next_max_id;
          var next = function(cb) {
            location_media_recent(location_id, options, cb);
          };
          result.pagination.next = next;
          delete result.pagination.next_url;
        }

        cb(null, result.data, result.pagination, limit);
      } else {
        handle_error(result, cb, retry);
      }
    }, retry);
  };

  /**
   * Search for locations by lat/lng
   * @param spec object { lat, lng } ||
   *                    { foursquare_v2_id } ||
   *                    { foursquare_id }
   * @param options object { distance [opt] }
   * @param cb function (err, result, limit);
   */
  location_search = function(spec, options, cb) {
    var retry = function() {
      location_search(spec, options, cb);
    };

    if(!cb && typeof options === 'function') {
      cb = options;
      options = {};
    }
    var params = {};

    if(options.distance) {
      params.distance = options.distance;
    }

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
  fwk.getter(that, 'oauth', my, 'oauth');

  return that;
};

exports.instagram = instagram;
