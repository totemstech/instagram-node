instagram-node
=========

NodeJS driver for the instagram API

## Installation

`npm install instagram-node`

## Features

Almost all instagram actions can be done with this tool. (Geographies are not available at this time, but they will be soon !)

## How it works

First of all, you need to authentify. You can use `client_id/client_secret` from the app you are building, or an `access_token` from
a user that use your app.
** Some features need an access_token to work **

```javascript
use({ access_token: 'YOUR_ACCESS_TOKEN' });
use({ client_id: 'YOUR_CLIENT_ID',
      client_secret: 'YOUR_CLIENT_SECRET' });
```

When it's done, here is the full list of what you can do:

```javascript

  /********************************/
  /*            USERS             */
  /********************************/
  user('USER_ID', function(err, result, limit) {});

  /* OPTIONS: { [count], [min_id], [max_id] }; */
  user_self_feed({}, function(err, feed, pagination, limit) {});

  /* OPTIONS: { user_id, [count], [min_timestamp], [max_timestamp], [min_id], [max_id] }; */
  user_media_recent({ user_id: 'USER_ID' }, function(err, results, pagination, limit) {});

  /* OPTIONS: { [count], [max_like_id] }; */
  user_self_liked({}, function(err, likes, pagination, limit) {});

  user_search('username', [count], function(err, users, limit) {});

  /********************************/
  /*         RELATIONSHIP         */
  /********************************/
  user_follows('USER_ID', function(err, users, limit) {});

  user_followers('USER_ID', function(err, users, limit) {});

  user_self_requested_by(function(err, users, limit) {});

  user_relationship('USER_ID', function(err, result, limit) {});

  set_user_relationship('USER_ID', 'follow', function(err, result, limit) {});

  /********************************/
  /*           MEDIAS             */
  /********************************/
  media('media_id', function(err, result, limit) {});

  /* OPTIONS: { lat, lng, [min_timestamp], [max_timestamp], [distance] }; */
  media_search({ lat: 48.4335645654, lng: 2.345645645 }, function(err, result, pagination, limit) {});

  media_popular(function(err, result, limit) {});

  /********************************/
  /*           COMMENTS           */
  /********************************/
  comments('media_id', function(err, result, limit) {});

  add_comment('media_id', 'your comment', function(err, limit) {});

  del_comment('media_id', 'comment_id', function(err, limit) {});

  /********************************/
  /*            LIKES             */
  /********************************/
  likes('media_id', function(err, result, limit) {});

  add_like('media_id', function(err, limit) {});

  del_like('media_id', function(err, limit) {});

  /********************************/
  /*             TAGS             */
  /********************************/
  tag('tag', function(err, result, limit) {});

  /* OPTIONS: { tag, [min_id], [max_id] }; */
  tag_media_recent({ tag: 'tag' }, function(err, result, pagination, limit) {});

  tag_search('query', function(err, result, limit) {});

  /********************************/
  /*           LOCATIONS          */
  /********************************/
  location('location_id', function(err, result, limit) {});

  /* OPTIONS: { location_id, [min_id], [max_id], [min_timestamp], [max_timestamp] }; */
  location_media_recent({ location_id: 'location_id' }, function(err, result, pagination, limit) {});

  /* OPTIONS: { lat, lng, [distance], [foursquare_v2_id], [foursquare_id] }; */
  location_search({ lat: 48.565464564, lng: 2.34656589 }, function(err, result, limit) {});
```

## Tests

Put the following in your environment:

    export INSTAGRAM_ACCESS_TOKEN=YOUACCESSTOKEN

Then just use

    make test

## More infos

You can find more informations on the [Instagram developper](http://instagram.com/developer) website.
If you have any questions or remark, feel free to contact us at `firstcontact@teleportd.com`

## License

Distributed under the MIT License.

