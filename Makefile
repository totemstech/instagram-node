users:
	node test/users.js

relationship:
	node test/relationship.js

media:
	node test/media.js

tag:
	node test/tag.js

comments:
	node test/comments.js

likes:
	node test/likes.js

locations:
	node test/locations.js

auth:
	node test/auth.js

test: users relationship media tag comments likes locations auth

.PHONY: test users relationship media tag comments likes locations
