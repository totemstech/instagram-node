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
var http = require('http');
var https = require('https');
var query = require('querystring');
var url = require('url');
var crypto = require('crypto');

/**
 * Instagram API driver for NodeJS
 * Proceeds the call to the API and give
 * back the response
 *
 * @param spec { agent, host, port }
 */
var instagram = function(spec, my) {
  var _super = {};
  my = my || {};
  spec = spec || {};

  my.limit = null;
  my.remaining = null;
  my.agent = spec.agent;
  my.host = spec.host || 'https://api.instagram.com';
  my.port = spec.port || 443;
  my.enforce_signed_requests = spec.enforce_signed_requests || false;

  // public
  var use;                              /* use(spec);                                       */

  var user;                             /* user(user_id, cb);                               */
  var user_self_feed;                   /* user_self_feed(options, cb);                     */
  var user_media_recent;                /* user_media_recent(user_id, options, cb);         */
  var user_self_media_recent;           /* user_self_media_recent(options, cb);             */
  var user_self_liked;                  /* user_self_liked(options, cb);                    */
  var user_search;                      /* user_search(query, options, cb);                 */

  var user_follows;                     /* user_follows(user_id, cb);                       */
  var user_followers;                   /* user_followers(user_id, cb);                     */
  var user_self_requested_by;           /* user_self_requested_by(cb);                      */
  var user_relationship;                /* user_relationship(user_id, cb);                  */
  var set_user_relationship;            /* set_user_relationship(user_id, action, cb);      */

  var media;                            /* media(media_id, cb);                             */
  var media_shortcode;                  /* media_shortcode(media_shortcode, cb);            */
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

  var geography_media_recent;           /* geography_media_recent(id, options, cb);         */

  var subscriptions;                    /* subscriptions(cb);                               */
  var del_subscription;                 /* del_subscription(options, cb);                   */
  var add_tag_subscription;             /* add_tag_subscription(tag, cb_url, cb);           */
  var add_geography_subscription;       /* add_geography_subscription(lat, lng, radius, cb_url, cb); */
  var add_user_subscription;            /* add_user_subscription(cb_url, cb);               */
  var add_location_subscription;        /* add_location_subscription(id, cb_url, cb);       */

  var get_authorization_url;            /* get_authorization_url(redirect_uri, permissions);*/
  var authorize_user;                   /* authorize_user(code, redirect_uri, cb);          */

  var oembed;                           /* oembed(url, cb);                             */

  // private
  var call;                             /* call(method, path, params, cb, retry);           */
  var handle_error;                     /* handle_error(body, cb, retry);                   */
  var sign_request;                     /* sign_request(endpoint, params, client_secret);   */
  var sort_object;                      /* sort_object(params);                             */

  var that = {};

  /*******************************/
  /*       Private helpers       */
  /*******************************/

  /**
   * Make a call on instagram API with the given params, path & method
   * @param method string the request method
   * @param path string the path
   * @param params object the params
   * @param cb function (err, result, remaining, limit);
   * @param retry function a retry function
   */
  call = function(method, path, params, cb, retry) {
    if(my.auth) {

      // we don't need auth parameters if we're hitting the oembed endpoint
      if (path.search('oembed') < 0) {
        for(var opt in my.auth) {
          if(my.auth.hasOwnProperty(opt)) {
            params[opt] = my.auth[opt];
          }
        }
      }

      // Signature parameter
      if(params.sign_request || my.enforce_signed_requests) {
        try {
          var client_secret;

          if (params.sign_request) {
            client_secret = params.sign_request.client_secret;
            delete params.sign_request;
          } else {
            client_secret = my.auth.client_secret;
          }

          params['sig'] = sign_request(
            path,
            params,
            client_secret
          );
        }
        catch(err) {
          return handle_error(err, cb, retry);
        }
      }

      var options = {
        host: url.parse(my.host).hostname,
        port: my.port,
        method: method,
        path: '/v1' + path + (method === 'GET' || method === 'DELETE' ? '?' + query.stringify(params) : ''),
        agent: my.agent,
        headers: {}
      };

      // oauth and oembed calls don't use /v1
      if (path.search('oauth') >= 0 || path.search('oembed') >= 0) {
        options.path = options.path.substring(3); // chop off '/v1'
      }

      var data = null;

      if (method !== 'GET' && method !== 'DELETE') {
        data = query.stringify(params);
        options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
        options.headers['Content-Length'] = data.length;
      }

      var req = https.request(options, function(res) {
        var body = '';
        res.setEncoding('utf8');

        res.on('data', function(chunk) {
          body += chunk;
        });

        res.on('end', function() {
          var result;
          var limit = parseInt(res.headers['x-ratelimit-limit'], 10) || 0;
          var remaining = parseInt(res.headers['x-ratelimit-remaining'], 10) || 0;
          my.limit = limit;
          my.remaining = remaining;

          try {
            result = JSON.parse(body);
          } catch(err) {
            return handle_error(err, cb, retry, res.statusCode, body);
          }

          return cb(null, result, remaining, limit);
        });
      });

      req.on('error', function(err) {
        return handle_error(err, cb, retry);
      });

      if (data !== null) {
        req.write(data);
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
    if(body && ((body.meta && body.meta.error_type) || body.error_type)) {
      // if body is an instagram error
      if(!body.meta) {
        body.meta = {
          code: body.code,
          error_type: body.error_type,
          error_message: body.error_message
        };
      }
      var error = new Error(body.meta.error_type + ': ' + body.meta.error_message);
      error.code = body.meta.code;
      error.error_type = body.meta.error_type;
      error.error_message = body.meta.error_message;
      error.retry = retry;
      return cb(error);
    } else if(body && body.message && body.stack) {
      // if body is an error
      body.retry = retry;
      if(status)
        body.status_code = status;
      if(bdy)
        body.body = bdy;
      return cb(body);
    } else {
      var error = new Error('Unknown error');
      error.retry = retry;
      return cb(error);
    }
  };

  /**
   * Sign the request using new instagram sign rules.
   * We are merging endpoint, params and client_secret and hashing all together
   * @param endpoint string api endpoint to call
   * @param params object api call params to be hashed
   * @param client_secret string the client secret to sign the request
   * @throws Error if arguments are not correct
   */
  sign_request = function(endpoint, params, client_secret) {
    if(typeof client_secret !== 'string') {
      throw new Error('Wrong param "client_secret"');
    }

    var sig = endpoint;

    params = sort_object(params);
    for (var key in params){
      if (params.hasOwnProperty(key)) {
        sig += "|"+key+"="+params[key];
      }
    }

    var hmac = crypto.createHmac('sha256', client_secret);
    hmac.update(sig);
    return hmac.digest('hex');
  };

  /**
   * Sort onject function.
   * We need to sort params that being added to api call.
   * @param object
   * @returns {Object}
   */
  sort_object = function(object) {
    var keys = Object.keys(object),
      i, len = keys.length;

    keys.sort();
    var newobj = new Object;
    for (i = 0; i < len; i++)
    {
      k = keys[i];
      newobj[k] = object[keys[i]];
    }
    return newobj;
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
      if (typeof options.enforce_signed_requests != 'undefined') {
        my.enforce_signed_requests = options.enforce_signed_requests;
      }
      if(options.access_token) {
        my.limit = null;
        my.remaining = null;
        my.auth = {
          access_token: options.access_token
        };
        if (options.client_secret) {
          my.auth.client_secret = options.client_secret;
        }
      } else if(options.client_id && options.client_secret) {
        my.limit = null;
        my.remaining = null;
        my.auth = {
          client_id: options.client_id,
          client_secret: options.client_secret
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
   * @param cb function (err, user, remaining, limit);
   */
  user = function(id, cb) {
    var retry = function() {
      user(id, cb);
    };

    if(typeof id !== 'string' || id === '') {
      return handle_error(new Error('Wrong param "id"'), cb, retry);
    }

    call('GET', '/users/' + id, {}, function(err, result, remaining, limit) {
      if(err) {
        return handle_error(err, cb, retry);
      } else if(result && result.meta && result.meta.code === 200) {
        return cb(null, result.data, remaining, limit);
      } else {
        return handle_error(result, cb, retry);
      }
    }, retry);
  };

  /**
   * Retrieves the current user feed
   * @param options object { count,  [opt]
   *                         min_id, [opt]
   *                         max_id  [opt] }
   * @param cb function (err, feed, pagination, remaining, limit);
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

    call('GET', '/users/self/feed', params, function(err, result, remaining, limit) {
      if(err) {
        return handle_error(err, cb, retry);
      } else if(result && result.meta && result.meta.code === 200) {
        if(result.pagination && result.pagination.next_max_id) {
          options = fwk.shallow(options);
          options.max_id = result.pagination.next_max_id;
          var next = function(cb) {
            user_self_feed(options, cb);
          };
          result.pagination.next = next;
        }

        return cb(null, result.data, result.pagination || {}, remaining, limit);
      } else {
        return handle_error(result, cb, retry);
      }
    }, retry);
  };

  /**
   * Retrieves the current user likes
   * @param options object { count,        [opt]
   *                         max_like_id   [opt] }
   * @param cb function (err, likes, pagination, remaining, limit);
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

    call('GET', '/users/self/media/liked', params, function(err, result, remaining, limit) {
      if(err) {
        return handle_error(err, cb, retry);
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

        return cb(null, result.data, result.pagination || {}, remaining, limit);
      } else {
        return handle_error(result, cb, retry);
      }
    }, retry);
  };


  /**
   * Get the most recent media published by a user
   * @param user_id string the user id
   * @param options object { count,           [opt]
   *                         max_timestamp,   [opt]
   *                         min_timestamp,   [opt]
   *                         max_id,          [opt]
   *                         min_id           [opt] }
   * @param cb(err, results, pagination, remaining, limit);
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

    call('GET', '/users/' + user_id + '/media/recent', params, function(err, result, remaining, limit) {
      if(err) {
        return handle_error(err, cb, retry);
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

        return cb(null, result.data, result.pagination || {}, remaining, limit);
      } else {
        return handle_error(result, cb, retry);
      }
    }, retry);
  };

  /**
   * Get the most recent media published by the user being authenticated
   * @param options object { count,           [opt]
   *                         max_timestamp,   [opt]
   *                         min_timestamp,   [opt]
   *                         max_id,          [opt]
   *                         min_id           [opt] }
   * @param cb(err, results, pagination, remaining, limit);
   */
  user_self_media_recent = function(options, cb) {
    var retry = function() {
      user_self_media_recent(options, cb);
    };

    if(!cb && typeof options === 'function') {
      cb = options;
      options = {};
    }

    if(typeof my.auth.access_token !== 'string') {
      return handle_error(new Error('You must first set an `access_token` with `use()`'), cb, retry);
    }

    var user_id = my.auth.access_token.split('.')[0];
    return user_media_recent(user_id, options, cb);
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

    call('GET', '/users/search', params, function(err, result, remaining, limit) {
      if(err) {
        return handle_error(err, cb, retry);
      } else if(result && result.meta && result.meta.code === 200) {
        return cb(null, result.data, remaining, limit);
      } else {
        return handle_error(result, cb, retry);
      }
    }, retry);
  };

  /**
   * Retrieves the list of users the given user follows
   * @param user_id string the user to check
   * @param options object { count, [opt]
   *                         cursor [opt] }
   * @param cb function (err, users, pagination, remaining, limit);
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

    call('GET', '/users/' + user_id + '/follows', params, function(err, result, remaining, limit) {
      if(err) {
        return handle_error(err, cb, retry);
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

        return cb(null, result.data, result.pagination || {}, remaining, limit);
      } else {
        return handle_error(result, cb, retry);
      }
    }, retry);
  };

  /**
   * Retrieves the list of users the given user is followed by
   * @param user_id string the user to check
   * @param options object { count, [opt]
   *                         cursor [opt] }
   * @param cb function (err, users, pagination, remaining, limit);
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

    call('GET', '/users/' + user_id + '/followed-by', params, function(err, result, remaining, limit) {
      if(err) {
        return handle_error(err, cb, retry);
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

        return cb(null, result.data, result.pagination || {}, remaining, limit);
      } else {
        return handle_error(result, cb, retry);
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

    call('GET', '/users/self/requested-by', {}, function(err, result, remaining, limit) {
      if(err) {
        return handle_error(err, cb, retry);
      } else if(result && result.meta && result.meta.code === 200) {
        return cb(null, result.data, remaining, limit);
      } else {
        return handle_error(result, cb, retry);
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

    call('GET', '/users/' + user_id + '/relationship', {}, function(err, result, remaining, limit) {
      if(err) {
        return handle_error(err, cb, retry);
      } else if(result && result.meta && result.meta.code === 200) {
        return cb(null, result.data, remaining, limit);
      } else {
        return handle_error(result, cb, retry);
      }
    }, retry);
  };

  /**
   * Modify the relationship between current user and the target user
   * @param user_id string the target user
   * @param action string 'follow' || 'unfollow' || 'block' || 'unblock' || 'approve' || 'ignore'
   * @param options object { sign_request: {
   *                           client_secret: 'xxx'
   *                       }}
   * @param cb function (err, result, limit);
   */
  set_user_relationship = function(user_id, action, options, cb) {
    var retry = function() {
      set_user_relationship(user_id, action, options, cb);
    };

    if(!cb && typeof options === 'function') {
      cb = options;
      options = {};
    }
    var params = {};

    if(typeof user_id !== 'string' || user_id === '') {
      return handle_error(new Error('Wrong param "user_id"'), cb, retry);
    }

    if(['follow', 'unfollow', 'block', 'unblock', 'approve', 'ignore'].indexOf(action.toLowerCase()) === -1) {
      return handle_error(new Error('Wrong param "action"'), cb);
    }
    params.action = action.toLowerCase();

    if(options.sign_request) {
      params.sign_request = options.sign_request;
    }

    call('POST', '/users/' + user_id + '/relationship', params, function(err, result, remaining, limit) {
      if(err) {
        return handle_error(err, cb, retry);
      } else if(result && result.meta && result.meta.code === 200) {
        return cb(null, result.data, remaining, limit);
      } else {
        return handle_error(result, cb, retry);
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

    call('GET', '/media/' + media_id, {}, function(err, result, remaining, limit) {
      if(err) {
        return handle_error(err, cb, retry);
      } else if(result && result.meta && result.meta.code === 200) {
        return cb(null, result.data, remaining, limit);
      } else {
        return handle_error(result, cb, retry);
      }
    }, retry);
  };

  /**
   * Retrieves information about a media with given shortcode
   * @param media_shortcode string the shortcode of the media
   * For media http://instagram.com/p/ABC/ shortcode is ABC
   * @param cb function (err, result, limit);
   */
  media_shortcode = function(media_shortcode, cb) {
      var retry = function() {
          media_shortcode(media_shortcode, cb);
      };

      if(typeof media_shortcode !== 'string' || media_shortcode === '') {
          return handle_error(new Error('Wrong param "media_shortcode"'), cb, retry);
      }

      call('GET', '/media/shortcode/' + media_shortcode, {}, function(err, result, remaining, limit) {
          if(err) {
              return handle_error(err, cb, retry);
          } else if(result && result.meta && result.meta.code === 200) {
              return cb(null, result.data, remaining, limit);
          } else {
              return handle_error(result, cb, retry);
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
   * @param cb function (err, result, limit);
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
        options.max_timestamp = parseInt(Date.now() / 1000, 10);
      }
      params.max_timestamp = options.max_timestamp;
    }
    if(options.min_timestamp) {
      if(options.min_timestamp > parseInt(Date.now() / 1000, 10)) {
        options.min_timestamp = parseInt(Date.now() / 1000, 10);
      }
      params.min_timestamp = options.min_timestamp;
    }
    if(options.distance) {
      params.distance = options.distance;
    }
    if(options.count) {
      params.count = options.count;
    }

    call('GET', '/media/search', params, function(err, result, remaining, limit) {
      if(err) {
        return handle_error(err, cb, retry);
      } else if(result && result.meta && result.meta.code === 200) {
        return cb(null, result.data, remaining, limit);
      } else {
        return handle_error(result, cb, retry);
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

    call('GET', '/media/popular', {}, function(err, result, remaining, limit) {
      if(err) {
        return handle_error(err, cb, retry);
      } else if(result && result.meta && result.meta.code === 200) {
        return cb(null, result.data, remaining, limit);
      } else {
        return handle_error(result, cb, retry);
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

    call('GET', '/media/' + media_id + '/comments', {}, function(err, result, remaining, limit) {
      if(err) {
        return handle_error(err, cb, retry);
      } else if(result && result.meta && result.meta.code === 200) {
        return cb(null, result.data, remaining, limit);
      } else {
        return handle_error(result, cb, retry);
      }
    }, retry);
  };

  /**
   * Add a comment on the given media
   * @param media_id string the media id
   * @param text string the text to post
   * @param options object { sign_request: {
   *                           client_secret: 'xxx'
   *                       }}
   * @param cb function (err, limit);
   */
  add_comment = function(media_id, text, options, cb) {
    var retry = function() {
      add_comment(media_id, text, options, cb);
    };

    if(!cb && typeof options === 'function') {
      cb = options;
      options = {};
    }
    var params = {};

    if(typeof media_id !== 'string' || media_id === '' ||
       typeof text !== 'string' || text === '') {
      return handle_error(new Error('Wrong param "media_id" or "text"'), cb, retry);
    }
    params.text = text;

    if(options.sign_request) {
      params.sign_request = options.sign_request;
    }

    call('POST', '/media/' + media_id + '/comments', params, function(err, result, remaining, limit) {
      if(err) {
        return handle_error(err, cb, retry);
      } else if(result && result.meta && result.meta.code === 200) {
        return cb(null, result.data, remaining, limit);
      } else {
        return handle_error(result, cb, retry);
      }
    }, retry);
  };

  /**
   * Delete the given comment from the given media
   * @param media_id string the media id
   * @param comment_id string the comment id
   * @param options object { sign_request: {
   *                           client_secret: 'xxx'
   *                       }}
   * @param cb function (err, limit);
   */
  del_comment = function(media_id, comment_id, options, cb) {
    var retry = function() {
      del_comment(media_id, comment_id, options, cb);
    };

    if(!cb && typeof options === 'function') {
      cb = options;
      options = {};
    }
    var params = {};

    if(typeof media_id !== 'string' || media_id === '' ||
       typeof comment_id !== 'string' || comment_id === '') {
      return handle_error(new Error('Wrong param "media_id" or "comment_id"'), cb, retry);
    }

    if(options.sign_request) {
      params.sign_request = options.sign_request;
    }

    call('DELETE', '/media/' + media_id + '/comments/' + comment_id, params, function(err, result, remaining, limit) {
      if(err) {
        return handle_error(err, cb, retry);
      } else if(result && result.meta && result.meta.code === 200) {
        return cb(null, remaining, limit);
      } else {
        return handle_error(result, cb, retry);
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

    call('GET', '/media/' + media_id + '/likes', {}, function(err, result, remaining, limit) {
      if(err) {
        return handle_error(err, cb, retry);
      } else if(result && result.meta && result.meta.code === 200) {
        return cb(null, result.data, remaining, limit);
      } else {
        return handle_error(result, cb, retry);
      }
    }, retry);
  };

  /**
   * Add a like on the given media
   * @param media_id string the media id
   * @param options object { sign_request: {
   *                           client_secret: 'xxx'
   *                       }}
   * @param cb function (err, limit);
   */
  add_like = function(media_id, options, cb) {
    var retry = function() {
      add_like(media_id, options, cb);
    };

    if(!cb && typeof options === 'function') {
      cb = options;
      options = {};
    }
    var params = {};

    if(typeof media_id !== 'string' || media_id === '') {
      return handle_error(new Error('Wrong param "media_id"'), cb, retry);
    }

    if(options.sign_request) {
      params.sign_request = options.sign_request;
    }

    call('POST', '/media/' + media_id + '/likes', params, function(err, result, remaining, limit) {
      if(err) {
        return handle_error(err, cb, retry);
      } else if(result && result.meta && result.meta.code === 200) {
        return cb(null, remaining, limit);
      } else {
        return handle_error(result, cb, retry);
      }
    }, retry);
  };

  /**
   * Delete the like from the given media
   * @param media_id string the media id
   * @param options object { sign_request: {
   *                           client_secret: 'xxx'
   *                       }}
   * @param cb function (err, limit);
   */
  del_like = function(media_id, options, cb) {
    var retry = function() {
      del_like(media_id, options, cb);
    };

    if(!cb && typeof options === 'function') {
      cb = options;
      options = {};
    }
    var params = {};

    if(typeof media_id !== 'string' || media_id === '') {
      return handle_error(new Error('Wrong param "media_id"'), cb, retry);
    }

    if(options.sign_request) {
      params.sign_request = options.sign_request
    }

    call('DELETE', '/media/' + media_id + '/likes', params, function(err, result, remaining, limit) {
      if(err) {
        return handle_error(err, cb, retry);
      } else if(result && result.meta && result.meta.code === 200) {
        return cb(null, remaining, limit);
      } else {
        return handle_error(result, cb, retry);
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

    call('GET', '/tags/' + encodeURIComponent(_tag), {}, function(err, result, remaining, limit) {
      if(err) {
        return handle_error(err, cb, retry);
      } else if(result && result.meta && result.meta.code === 200) {
        return cb(null, result.data, remaining, limit);
      } else {
        return handle_error(result, cb, retry);
      }
    }, retry);
  };

  /**
   * Get recent medias for the given tag
   * @param tag string the tag
   * @param options object { min_id,     [opt]
   *                         max_id      [opt] }
   * @param cb function (err, result, pagination, remaining, limit);
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
    if(options.count) {
      params.count = options.count;
    }

    call('GET', '/tags/' + encodeURIComponent(tag) + '/media/recent', params, function(err, result, remaining, limit) {
      if(err) {
        return handle_error(err, cb, retry);
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

        return cb(null, result.data, result.pagination || {}, remaining, limit);
      } else {
        return handle_error(result, cb, retry);
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

    call('GET', '/tags/search', { q: query }, function(err, result, remaining, limit) {
      if(err) {
        return handle_error(err, cb, retry);
      } else if(result && result.meta && result.meta.code === 200) {
        return cb(null, result.data, remaining, limit);
      } else {
        return handle_error(result, cb, retry);
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

    call('GET', '/locations/' + location_id, {}, function(err, result, remaining, limit) {
      if(err) {
        return handle_error(err, cb, retry);
      } else if(result && result.meta && result.meta.code === 200) {
        return cb(null, result.data, remaining, limit);
      } else {
        return handle_error(result, cb, retry);
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
   * @param cb function (err, result, pagination, remaining, limit);
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

    call('GET', '/locations/' + location_id + '/media/recent', params, function(err, result, remaining, limit) {
      if(err) {
        return handle_error(err, cb, retry);
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

        return cb(null, result.data, result.pagination || {}, remaining, limit);
      } else {
        return handle_error(result, cb, retry);
      }
    }, retry);
  };

  /**
   * Search for locations by lat/lng
   * @param spec object { lat, lng } ||
   *                    { foursquare_v2_id } ||
   *                    { foursquare_id } ||
   *                    { facebook_places_id }
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
    } else if(spec.facebook_places_id) {
      params.facebook_places_id = spec.facebook_places_id;
    } else {
      return handle_error(new Error('Wrong param "lat/lng" or "foursquare(_v2)_id" or "facebook_places_id"'), cb, retry);
    }

    call('GET', '/locations/search', params, function(err, result, remaining, limit) {
      if(err) {
        return handle_error(err, cb, retry);
      } else if(result && result.meta && result.meta.code === 200) {
        return cb(null, result.data, remaining, limit);
      } else {
        return handle_error(result, cb, retry);
      }
    }, retry);
  };

  /**
   * Get recent medias for the given geography
   * @param geo_id string the instagram geography id
   * @param options object { min_id,          [opt]
   *                         count            [opt] }
   * @param cb function (err, result, pagination, remaining, limit);
   */
  geography_media_recent = function(geography_id, options, cb) {
    var retry = function() {
      geography_media_recent(geography_id, options, cb);
    };

    if(!cb && typeof options === 'function') {
      cb = options;
      options = {};
    }

    if(typeof geography_id !== 'string' || geography_id === '') {
      return handle_error(new Error('Wrong param "geography_id"'), cb, retry);
    }

    var params = {};
    if(options.min_id) {
      params.min_id = options.min_id;
    }
    if(options.count) {
      params.count = options.count;
    }

    call('GET', '/geographies/' + geography_id + '/media/recent', params, function(err, result, remaining, limit) {
      if(err) {
        return handle_error(err, cb, retry);
      } else if(result && result.meta && result.meta.code === 200) {
        if(result.pagination && result.pagination.next_min_id) {
          options = fwk.shallow(options);
          options.min_id = result.pagination.next_min_id;
          var next = function(cb) {
            geography_media_recent(geography_id, options, cb);
          };
          result.pagination.next = next;
          delete result.pagination.next_url;
        }

        return cb(null, result.data, result.pagination || {}, remaining, limit);
      } else {
        return handle_error(result, cb, retry);
      }
    }, retry);
  };

  /**
   * Retrieve authentication URL for user.
   * @param redirect_uri string the url to redirect to
   * @param options object { scope, [opt] array ['likes', 'comments', 'relationships']
   *                         state  [opt] string}
   * @return url string the formated url
   * @throw err if client_id/client_secret are not set.
   */
  get_authorization_url = function(redirect_uri, options) {
    var options = options || {};
    var url_obj = url.parse(my.host);
    url_obj.pathname = '/oauth/authorize';

    if(!my.auth.client_id || !my.auth.client_secret) {
      throw new Error('Please supply client_id and client_secret via use()');
    }

    var params = {
      client_id: my.auth.client_id,
      redirect_uri: redirect_uri,
      response_type: 'code'
    };

    if(options.state) {
      params.state = options.state;
    }

    url_obj.query = params;

    var auth_url = url.format(url_obj);

    if(Array.isArray(options.scope)) {
      auth_url += '&scope=' + options.scope.join('+');
    }

    return auth_url;
  };

  /**
   * Authorizes a user and returns the response from the server.
   * This is the final leg in instagram's authentication process.
   * Note this function also sets and uses the access token that
   * was retrieved via authentication.
   * @param code string the code received from instagram
   *    Passed as a get parameter to a redirect uri once a user has
   *    authenticated via Instagram. See Instagram's Authorization
   *    API documentation for more information
   * @param redirect_uri string the url to redirect to
   * @param cb function (err, result);
   */
  authorize_user = function(code, redirect_uri, cb) {
    var retry = function() {
      authorize_user(code, redirect_uri, cb);
    };

    var params = {
      client_id: my.auth.client_id,
      client_secret: my.auth.client_secret,
      grant_type: 'authorization_code',
      redirect_uri: redirect_uri,
      code: code
    };

    call('POST', '/oauth/access_token', params, function(err, result, remaining, limit) {
      if(err) {
        return handle_error(err, cb, retry);
      }
      else if(result && result.access_token) {
        return cb(null, result);
      }
      else {
        return handle_error(result, cb, retry);
      }
    }, retry);
  };

  /**
   * Retrieves information about a given media based on its url (see http://instagram.com/developer/embedding/)
   * @param url string the url of the instagram media item to get the oEmbed data for
   * @param options object { callback,     [opt]
   *                         omitscript,   [opt]
   *                         hidecaption,  [opt]
   *                         maxwidth      [opt] }
   * @param cb function (err, result, limit);
   */
  oembed = function(url, options, cb) {
    var retry = function() {
      oembed(url, options, cb);
    }

    if(!cb && typeof options === 'function') {
      cb = options;
      options = {};
    }
    var params = {};

    if(typeof url !== 'string' || url === '') {
      return handle_error(new Error('Wrong param "url"'), cb, retry);
    }
    else {
      params.url = url;
    }

    if(options.callback) {
      params.callback = options.callback;
    }
    if(options.omitscript) {
      params.omitscript = options.omitscript;
    }
    if(options.hidecaption) {
      params.hidecaption = options.hidecaption;
    }
    if(options.maxwidth) {
      params.maxwidth = options.maxwidth;
    }

    call('GET', '/oembed/', params, function(err, result, remaining, limit) {
      if(err) {
        return handle_error(err, cb, retry);
      } else if(result) {
        return cb(null, result, remaining, limit);
      } else {
        return handle_error(result, cb, retry);
      }
    }, retry);
  };

  /**
   * Get a list of realtime subscriptions (see http://instagram.com/developer/realtime/#list-your-subscriptions)
   * @param  function cb      function (err, result, limit);
   */
  subscriptions = function(cb){
    var retry = function(){
      subscriptions(cb);
    };

    call('GET', '/subscriptions/', {}, function(err, result, remaining, limit) {
      if(err) {
        return handle_error(err, cb, retry);
      } else if(result && result.meta && result.meta.code === 200) {
        return cb(null, result.data, remaining, limit);
      } else {
        return handle_error(result, cb, retry);
      }
    }, retry);
  };

  /**
   * Add a subscription on a tag
   * @param tag string the tag on which to subscribe
   * @param callback_url string the url on which to be called back
   * @param options object { verify_token }
   * @param cb function(err, result)
   */
  add_tag_subscription = function(tag, callback_url, options, cb){
    var retry = function(){
      add_tag_subscription(tag, callback_url, options, cb);
    };

    if(!cb && typeof options === 'function') {
      cb = options;
      options = {};
    }

    var params = {
      callback_url: callback_url,
      object: 'tag',
      aspect: 'media',
      object_id: tag
    };

    if(options.verify_token) {
      params.verify_token = options.verify_token;
    }

    call('POST', '/subscriptions/', params, function(err, result, remaining, limit) {
      if(err) {
        return handle_error(err, cb, retry);
      } else if(result && result.meta && result.meta.code === 200) {
        return cb(null, result.data, remaining, limit);
      } else {
        return handle_error(result, cb, retry);
      }
    }, retry);
  };

  /**
   * Subscribe to posts in a geographical circle (see http://instagram.com/developer/realtime/#geography-subscriptions)
   * @param  {Number}   lat          Latitude of center of circle
   * @param  {Number}   lng         Longitude of center of circle
   * @param  {Number}   radius       Radius of circle, in meters
   * @param  {String}   callback_url URL to be called back when a new post is from this geographical circle
   * @param  {Object}   options { verify_token }
   * @param  {Function} cb           function (err, result, limit);
   */
  add_geography_subscription = function(lat, lng, radius, callback_url, options, cb){
    var retry = function(){
      add_geography_subscription(lat, lng, radius, callback_url, options, cb);
    };

    if(!cb && typeof options === 'function') {
      cb = options;
      options = {};
    }

    var params = {
      callback_url: callback_url,
      object:'geography',
      lat: lat,
      lng: lng,
      radius: radius,
      aspect: 'media'
    };

    if(options.verify_token) {
      params.verify_token = options.verify_token;
    }

    call('POST', '/subscriptions/', params, function(err, result, remaining, limit) {
      if(err) {
        return handle_error(err, cb, retry);
      } else if(result && result.meta && result.meta.code === 200) {
        return cb(null, result.data, remaining, limit);
      } else {
        return handle_error(result, cb, retry);
      }
    }, retry);
  };

  /**
   * Subscribe to posts from your subscribed users (see http://instagram.com/developer/realtime/#user-subscriptions)
   * @param  {String}   callback_url URL to be called back when a new post is from this user
   * @param  {Object}   options { verify_token }
   * @param  {Function} cb           function (err, result, limit);
   */
  add_user_subscription = function(callback_url, options, cb){
    var retry = function(){
      add_user_subscription(callback_url, options, cb);
    };

    if(!cb && typeof options === 'function') {
      cb = options;
      options = {};
    }

    var params = {
      callback_url: callback_url,
      object:'user',
      aspect: 'media'
    };

    if(options.verify_token) {
      params.verify_token = options.verify_token;
    }

    call('POST', '/subscriptions/', params, function(err, result, remaining, limit) {
      if(err) {
        return handle_error(err, cb, retry);
      } else if(result && result.meta && result.meta.code === 200) {
        return cb(null, result.data, remaining, limit);
      } else {
        return handle_error(result, cb, retry);
      }
    }, retry);
  };


  /**
   * Subscribe to posts from a specific location (see http://instagram.com/developer/realtime/#location-subscriptions)
   * @param  {Number}   location_id  a specific Instagram location
   * @param  {String}   callback_url URL to be called back when a new post is in this location
   * @param  {Function} cb           function (err, result, limit);
   */
  add_location_subscription = function(location_id, callback_url, options, cb){
    var retry = function(){
      add_location_subscription(location_id, callback_url, options, cb);
    };

    if(!cb && typeof options === 'function') {
      cb = options;
      options = {};
    }

    var params = {
      callback_url: callback_url,
      object:'location',
      object_id: location_id,
      aspect: 'media'
    };

    if(options.verify_token) {
      params.verify_token = options.verify_token;
    }

    call('POST', '/subscriptions/', params, function(err, result, remaining, limit) {
      if(err) {
        return handle_error(err, cb, retry);
      } else if(result && result.meta && result.meta.code === 200) {
        return cb(null, result.data, remaining, limit);
      } else {
        return handle_error(result, cb, retry);
      }
    }, retry);
  };

  /**
   * Delete a realtime subscription
   * @param  {Object}   options search (see http://instagram.com/developer/realtime/#delete-subscriptions)
   * @param  {Function} cb      function (err, result, limit);
   */
  del_subscription = function(options, cb){
    var retry = function(){
      del_subscription(options, cb);
    };

    var params = {};
    if(options.id) {
      params.id = options.id;
    }
    if(options.all) {
      params.object = 'all';
    }

    call('DELETE', '/subscriptions/', params, function(err, result, remaining, limit) {
      if(err) {
        return handle_error(err, cb, retry);
      } else if(result && result.meta && result.meta.code === 200) {
        return cb(null, result.data, remaining, limit);
      } else {
        return handle_error(result, cb, retry);
      }
    }, retry);
  };

  fwk.method(that, 'use', use, _super);

  fwk.method(that, 'user', user, _super);
  fwk.method(that, 'user_self_feed', user_self_feed, _super);
  fwk.method(that, 'user_media_recent', user_media_recent, _super);
  fwk.method(that, 'user_self_media_recent', user_self_media_recent, _super);
  fwk.method(that, 'user_self_liked', user_self_liked, _super);
  fwk.method(that, 'user_search', user_search, _super);

  fwk.method(that, 'user_follows', user_follows, _super);
  fwk.method(that, 'user_followers', user_followers, _super);
  fwk.method(that, 'user_self_requested_by', user_self_requested_by, _super);
  fwk.method(that, 'user_relationship', user_relationship, _super);
  fwk.method(that, 'set_user_relationship', set_user_relationship, _super);

  fwk.method(that, 'media', media, _super);
  fwk.method(that, 'media_shortcode', media_shortcode, _super);
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

  fwk.method(that, 'geography_media_recent', geography_media_recent, _super);

  fwk.method(that, 'get_authorization_url', get_authorization_url, _super);
  fwk.method(that, 'authorize_user', authorize_user, _super);

  fwk.method(that, 'oembed', oembed, _super);

  fwk.method(that, 'subscriptions', subscriptions, _super);
  fwk.method(that, 'del_subscription', del_subscription, _super);
  fwk.method(that, 'add_tag_subscription', add_tag_subscription, _super);
  fwk.method(that, 'add_geography_subscription', add_geography_subscription, _super);
  fwk.method(that, 'add_user_subscription', add_user_subscription, _super);
  fwk.method(that, 'add_location_subscription', add_location_subscription, _super);

  fwk.getter(that, 'limit', my, 'limit');
  fwk.getter(that, 'remaining', my, 'remaining');

  return that;
};

exports.instagram = instagram;
