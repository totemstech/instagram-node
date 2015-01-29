## v0.5.6
 - Add the optional parameters to `oembed` method

## v0.5.5
 - Add a `port` option

## v0.5.4
 - Fix a bug that prevented the use of non-latin characters for tags methods ([#40](https://github.com/teleportd/instagram-node/issues/29)).

## v0.5.2
 - Fix the retry of `add_<tag|geography|user|location>_subscription` methods

## v0.5.1
 - Add `verify_token` parameter support in `add_<tag|geography|user|location>_subscription` ([#29](https://github.com/teleportd/instagram-node/issues/29)).

## v0.5.0
 - Renamed the `limit` variable/property to `remaining` since it was using the `x-ratelimit-remaining` value.
 - Assigned the `limit` variable/property to the `x-ratelimit-limit` API call response header value ([#30](https://github.com/teleportd/instagram-node/issues/30)).
 - Adjusted the necessary functions to account for the new/renamed variables.

## v0.4.0
 - Add support for new Instagram API security with `sign_request`.

## v0.3.0
 - The `access_token` received after an `authorize_user` call is not
   automatically set anymore. ([#23](https://github.com/teleportd/instagram-node/issues/23))
 - Add `user_self_media_recent(options, cb)` to retrieve the medias posted by the
   user related to the `access_token` being used. This is just an alias of
   `user_media_recent(user_id, options, cb_)`.
