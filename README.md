instagram-node
==============

NodeJS driver for the Instagram API.
In production at http://nitrogr.am aggregating more than 200 data points per seconds

## Installation

`npm install instagram-node`

## How it works

* First of all, you need to authentify. You can use `client_id/client_secret` from the app you are building, or an `access_token` from
a user that use your app.
* **Some features need an access_token to work**

```javascript
var ig = require('instagram-node').instagram();

ig.use({ access_token: 'YOUR_ACCESS_TOKEN' });
ig.use({ client_id: 'YOUR_CLIENT_ID',
         client_secret: 'YOUR_CLIENT_SECRET' });
```

* If you activated "Signed Requests", you need to sign requests that need the
write access (relationship, likes, comments, ...) with:
```javascript
app.post('/like/:media_id', function(req, res, next) {
  var ig = require('instagram-node').instagram({});
  ig.use({ access_token: 'YOUR_ACCESS_TOKEN' });

  ig.add_like(req.param('media_id'), {
    sign_request: {
      client_secret: 'YOUR_CLIENT_SECRET',
      // Then you can specify the request:
      client_req: req
      // or the IP on your own:
      ip: 'XXX.XXX.XXX.XXX'
    }
  }, function(err) {
    // handle err here
    return res.send('OK');
  });
});
```

### Server-Side Authentication using OAuth and the Instagram API

Instagram uses the standard oauth authentication flow in order to allow apps to act on
a user's behalf. Therefore, the API provides two convenience methods to help
you authenticate your users. The first, ```get_authorization_url```, can be used
to redirect an unauthenticated user to the instagram login screen based on a
```redirect_uri``` string and an optional ```options``` object containing
an optional ```scope``` array and an optional ```state``` string. The
second method, ```authorize_user```, can be used to retrieve and set an access token
for a user, allowing your app to act fully on his/her behalf. This method takes
three parameters: a ```response_code``` which is sent as a GET parameter once a
user has authorized your app and instagram has redirected them back to your
authorization redirect URI, a ```redirect_uri``` which is the same one 
supplied to ```get_authorization_url```, and a callback that takes
two parameters ```err``` and ```result```. ```err``` will be populated if and
only if the request to authenticate the user has failed for some reason.
Otherwise, it will be ```null``` and ```response``` will be populated with a
JSON object representing Instagram's confirmation reponse that the user is
indeed authorized. See [instagram's authentication
documentation](http://instagram.com/developer/authentication/) for more information.

Below is an example of how one might authenticate a user within an ExpressJS app.
```javascript
var express = require('express');
var api = require('instagram-node').instagram();
var app = express();

app.configure(function() {
  // The usual...
});

api.use({
  client_id: YOUR_CLIENT_ID,
  client_secret: YOUR_CLIENT_SECRET
});

var redirect_uri = 'http://yoursite.com/handleauth';

exports.authorize_user = function(req, res) {
  res.redirect(api.get_authorization_url(redirect_uri, { scope: ['likes'], state: 'a state' }));
};

exports.handleauth = function(req, res) {
  api.authorize_user(req.query.code, redirect_uri, function(err, result) {
    if (err) {
      console.log(err.body);
      res.send("Didn't work");
    } else {
      console.log('Yay! Access token is ' + result.access_token);
      res.send('You made it!!');
    }
  });
};

// This is where you would initially send users to authorize
app.get('/authorize_user', exports.authorize_user);
// This is your redirect URI
app.get('/handleauth', exports.handleauth);

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

```

###Using the API

Once you've setup the API and/or authenticated, here is the full list of what you can do:

```javascript
/********************************/
/*            USERS             */
/********************************/
ig.user('user_id', function(err, result, remaining, limit) {});

/* OPTIONS: { [count], [min_id], [max_id] }; */
ig.user_self_feed([options,] function(err, medias, pagination, remaining, limit) {});

/* OPTIONS: { [count], [min_timestamp], [max_timestamp], [min_id], [max_id] }; */
ig.user_media_recent('user_id', [options,] function(err, medias, pagination, remaining, limit) {});

/* OPTIONS: { [count], [min_timestamp], [max_timestamp], [min_id], [max_id] }; */
ig.user_self_media_recent([options,] function(err, medias, pagination, remaining, limit) {});

/* OPTIONS: { [count], [max_like_id] }; */
ig.user_self_liked([options,] function(err, medias, pagination, remaining, limit) {});

/* OPTIONS: { [count] }; */
ig.user_search('username', [options,] function(err, users, remaining, limit) {});

/********************************/
/*         RELATIONSHIP         */
/********************************/
/* OPTIONS: { [count], [cursor] }; */
ig.user_follows('user_id', function(err, users, pagination, remaining, limit) {});

/* OPTIONS: { [count], [cursor] }; */
ig.user_followers('user_id', function(err, users, pagination, remaining, limit) {});

ig.user_self_requested_by(function(err, users, remaining, limit) {});

ig.user_relationship('user_id', function(err, result, remaining, limit) {});

ig.set_user_relationship('user_id', 'follow', function(err, result, remaining, limit) {});

/********************************/
/*           MEDIAS             */
/********************************/
ig.media('media_id', function(err, media, remaining, limit) {});

/* OPTIONS: { [min_timestamp], [max_timestamp], [distance] }; */
ig.media_search(48.4335645654, 2.345645645, [options,] function(err, medias, remaining, limit) {});

ig.media_popular(function(err, medias, remaining, limit) {});

/********************************/
/*           COMMENTS           */
/********************************/
ig.comments('media_id', function(err, result, remaining, limit) {});

ig.add_comment('media_id', 'your comment', function(err, result, remaining, limit) {});

ig.del_comment('media_id', 'comment_id', function(err, remaining, limit) {});

/********************************/
/*            LIKES             */
/********************************/
ig.likes('media_id', function(err, result, remaining, limit) {});

ig.add_like('media_id', function(err, remaining, limit) {});

ig.del_like('media_id', function(err, remaining, limit) {});

/********************************/
/*             TAGS             */
/********************************/
ig.tag('tag', function(err, result, remaining, limit) {});

/* OPTIONS: { [min_tag_id], [max_tag_id] }; */
ig.tag_media_recent('tag', [options,] function(err, medias, pagination, remaining, limit) {});

ig.tag_search('query', function(err, result, remaining, limit) {});

/********************************/
/*           LOCATIONS          */
/********************************/
ig.location('location_id', function(err, result, remaining, limit) {});

/* OPTIONS: { [min_id], [max_id], [min_timestamp], [max_timestamp] }; */
ig.location_media_recent('location_id', [options,] function(err, result, pagination, remaining, limit) {});

/* SPECS: { lat, lng, [foursquare_v2_id], [foursquare_id] }; */
/* OPTIONS: { [distance] }; */
ig.location_search({ lat: 48.565464564, lng: 2.34656589 }, [options,] function(err, result, remaining, limit) {});

/********************************/
/*          GEOGRAPHIES         */
/********************************/
/* OPTIONS: { [min_id], [count] } */
ig.geography_media_recent(geography_id, [options,] function(err, result, pagination, remaining, limit) {});

/********************************/
/*         SUBSCRIPTIONS        */
/********************************/
ig.subscriptions(function(err, result, remaining, limit){});

ig.del_subscription({id:1}, function(err,subscriptions,limit){})

/* OPTIONS: { [verify_token] }
ig.add_tag_subscription('funny', 'http://MYHOST/tag/funny', [options,] function(err, result, remaining, limit){});

/* OPTIONS: { [verify_token] }
ig.add_geography_subscription(48.565464564, 2.34656589, 100, 'http://MYHOST/geography', [options,] function(err, result, remaining, limit){});

/* OPTIONS: { [verify_token] }
ig.add_user_subscription('http://MYHOST/user', [options,] function(err, result, remaining, limit){});

/* OPTIONS: { [verify_token] }
ig.add_location_subscription(1257285, 'http://MYHOST/location/1257285', [options,] function(err, result, remaining, limit){});
```

## Subscriptions

Subscriptions are callbacks from Instagram to your app when new things happen. They should be web-accessable, and return `req.query['hub.challenge']` on GET. Read more [here](http://instagram.com/developer/realtime/). After you subscribe, Instagram will calllback your web URL whenever a new post, user action, etc happens.

You can get your subscriptions with this:

```javascript
ig.subscriptions(function(err, subscriptions, remaining, limit){
  console.log(subscriptions);
});
```

You can delete all your subscriptions with this:

```javascript
ig.del_subscription({ all: true }, function(err, subscriptions, remaining, limit){});
```

or just one with this:

```javascript
ig.del_subscription({ id: 1 }, function(err, subscriptions, remaining, limit){});
```



## Errors

When errors occur, you receive an error object with default properties, but we also add some other things:

    // Available when the error comes from Instagram API
    err.code;                // code from Instagram
    err.error_type;          // error type from Instagram
    err.error_message;       // error message from Instagram

    // If the error occurs while requesting the API
    err.status_code;         // the response status code
    err.body;                // the received body

and

    err.retry(); // Lets you retry in the same conditions that before

## Pagination

When you use functions like `user_media_recent` or `tag_media_recent`, you will get a `pagination` object in your callback. This object
is basically the same that Instagram would give you but there will be a `next()` function that let you retrieve next results without caring about anything.

```javascript
var ig = require('instagram-node').instagram();

var hdl = function(err, result, pagination, remaining, limit) {
  // Your implementation here
  if(pagination.next) {
    pagination.next(hdl); // Will get second page results
  }
};

ig.tag_media_recent('test', hdl);
```

## Tests

Put the following in your environment:

    export INSTAGRAM_ACCESS_TOKEN=YOUACCESSTOKEN

Then just use

    make test

## More infos

* You can find more informations on the [Instagram developper](http://instagram.com/developer) website.
* If you have any questions or remark, feel free to contact us at `boom@nitrogr.am`

## License

Distributed under the MIT License.

