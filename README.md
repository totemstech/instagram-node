instagram-node
=========

NodeJS driver for the instagram API

## Installation

`npm install instagram-node`

## Features

Almost all instagram actions can be done with this tool. (Geographies are not available at this time, but they will be soon !)

## How it works

* First of all, you need to authentify. You can use `client_id/client_secret` from the app you are building, or an `access_token` from
a user that use your app.
* **Some features need an access_token to work**

```javascript
var instagram = require('instagram-node');

instagram.use({ access_token: 'YOUR_ACCESS_TOKEN' });
instagram.use({ client_id: 'YOUR_CLIENT_ID',
                client_secret: 'YOUR_CLIENT_SECRET' });
```

When it's done, here is the full list of what you can do:

```javascript

/********************************/
/*            USERS             */
/********************************/
instagram.user('USER_ID', function(err, result, limit) {});

/* OPTIONS: { [count], [min_id], [max_id] }; */
instagram.user_self_feed({}, function(err, feed, pagination, limit) {});

/* OPTIONS: { user_id, [count], [min_timestamp], [max_timestamp], [min_id], [max_id] }; */
instagram.user_media_recent({ user_id: 'USER_ID' }, function(err, results, pagination, limit) {});

/* OPTIONS: { [count], [max_like_id] }; */
instagram.user_self_liked({}, function(err, likes, pagination, limit) {});

instagram.user_search('username', [count], function(err, users, limit) {});

/********************************/
/*         RELATIONSHIP         */
/********************************/
instagram.user_follows('USER_ID', function(err, users, limit) {});

instagram.user_followers('USER_ID', function(err, users, limit) {});

instagram.user_self_requested_by(function(err, users, limit) {});

instagram.user_relationship('USER_ID', function(err, result, limit) {});

instagram.set_user_relationship('USER_ID', 'follow', function(err, result, limit) {});

/********************************/
/*           MEDIAS             */
/********************************/
instagram.media('media_id', function(err, result, limit) {});

/* OPTIONS: { lat, lng, [min_timestamp], [max_timestamp], [distance] }; */
instagram.media_search({ lat: 48.4335645654, lng: 2.345645645 }, function(err, result, pagination, limit) {});

instagram.media_popular(function(err, result, limit) {});

/********************************/
/*           COMMENTS           */
/********************************/
instagram.comments('media_id', function(err, result, limit) {});

instagram.add_comment('media_id', 'your comment', function(err, limit) {});

instagram.del_comment('media_id', 'comment_id', function(err, limit) {});

/********************************/
/*            LIKES             */
/********************************/
instagram.likes('media_id', function(err, result, limit) {});

instagram.add_like('media_id', function(err, limit) {});

instagram.del_like('media_id', function(err, limit) {});

/********************************/
/*             TAGS             */
/********************************/
instagram.tag('tag', function(err, result, limit) {});

/* OPTIONS: { tag, [min_id], [max_id] }; */
instagram.tag_media_recent({ tag: 'tag' }, function(err, result, pagination, limit) {});

instagram.tag_search('query', function(err, result, limit) {});

/********************************/
/*           LOCATIONS          */
/********************************/
instagram.location('location_id', function(err, result, limit) {});

/* OPTIONS: { location_id, [min_id], [max_id], [min_timestamp], [max_timestamp] }; */
instagram.location_media_recent({ location_id: 'location_id' }, function(err, result, pagination, limit) {});

/* OPTIONS: { lat, lng, [distance], [foursquare_v2_id], [foursquare_id] }; */
instagram.location_search({ lat: 48.565464564, lng: 2.34656589 }, function(err, result, limit) {});
```

## Tests

Put the following in your environment:

    export INSTAGRAM_ACCESS_TOKEN=YOUACCESSTOKEN

Then just use

    make test

## More infos

* You can find more informations on the [Instagram developper](http://instagram.com/developer) website.
* If you have any questions or remark, feel free to contact us at `firstcontact@teleportd.com`

## License

Distributed under the MIT License.

