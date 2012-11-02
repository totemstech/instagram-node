users:
	node test/users.js

relationship:
	node test/relationship.js

media:
	node test/media.js

test: users relationship media

.PHONY: test