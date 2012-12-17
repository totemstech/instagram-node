instagram-node
==============

NodeJS driver for the Instagram API.
In production at http://nitrogr.am aggregating more than 200 data points per seconds

## Installation

`npm install instagram-node`

## Features

Almost all instagram actions can be done with this tool. (Geographies are not available at this time, but they will be soon !)

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

When it's done, here is the full list of what you can do:

```javascript

/********************************/
/*            USERS             */
/********************************/
ig.user('user_id', function(err, result, limit) {});

/* OPTIONS: { [count], [min_id], [max_id] }; */
ig.user_self_feed([options,] function(err, medias, pagination, limit) {});

/* OPTIONS: { [count], [min_timestamp], [max_timestamp], [min_id], [max_id] }; */
ig.user_media_recent('user_id', [options,] function(err, medias, pagination, limit) {});

/* OPTIONS: { [count], [max_like_id] }; */
ig.user_self_liked([options,] function(err, medias, pagination, limit) {});

/* OPTIONS: { [count] }; */
ig.user_search('username', [options,] function(err, users, limit) {});

/********************************/
/*         RELATIONSHIP         */
/********************************/
/* OPTIONS: { [count], [cursor] }; */
ig.user_follows('user_id', function(err, users, pagination, limit) {});

/* OPTIONS: { [count], [cursor] }; */
ig.user_followers('user_id', function(err, users, pagination, limit) {});

ig.user_self_requested_by(function(err, users, limit) {});

ig.user_relationship('user_id', function(err, result, limit) {});

ig.set_user_relationship('user_id', 'follow', function(err, result, limit) {});

/********************************/
/*           MEDIAS             */
/********************************/
ig.media('media_id', function(err, media, limit) {});

/* OPTIONS: { [min_timestamp], [max_timestamp], [distance] }; */
ig.media_search(48.4335645654, 2.345645645, [options,] function(err, medias, limit) {});

ig.media_popular(function(err, medias, limit) {});

/********************************/
/*           COMMENTS           */
/********************************/
ig.comments('media_id', function(err, result, limit) {});

ig.add_comment('media_id', 'your comment', function(err, limit) {});

ig.del_comment('media_id', 'comment_id', function(err, limit) {});

/********************************/
/*            LIKES             */
/********************************/
ig.likes('media_id', function(err, result, limit) {});

ig.add_like('media_id', function(err, limit) {});

ig.del_like('media_id', function(err, limit) {});

/********************************/
/*             TAGS             */
/********************************/
ig.tag('tag', function(err, result, limit) {});

/* OPTIONS: { [min_tag_id], [max_tag_id] }; */
ig.tag_media_recent('tag', [options,] function(err, medias, pagination, limit) {});

ig.tag_search('query', function(err, result, limit) {});

/********************************/
/*           LOCATIONS          */
/********************************/
ig.location('location_id', function(err, result, limit) {});

/* OPTIONS: { [min_id], [max_id], [min_timestamp], [max_timestamp] }; */
ig.location_media_recent('location_id', [options,] function(err, result, pagination, limit) {});

/* SPECS: { lat, lng, [foursquare_v2_id], [foursquare_id] }; */
/* OPTIONS: { [distance] }; */
ig.location_search({ lat: 48.565464564, lng: 2.34656589 }, [options,] function(err, result, limit) {});
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

var hdl = function(err, result, pagination, limit) {
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

