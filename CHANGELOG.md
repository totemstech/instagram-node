## v0.3.0
 - The `access_token` received after an `authorize_user` call is not
   automatically set anymore. ([#23](https://github.com/teleportd/instagram-node/issues/23))
 - Add `user_self_media_recent(options, cb)` to retrieve the medias posted by the
   user related to the `access_token` being used. This is just an alias of
   `user_media_recent(user_id, options, cb_)`.
