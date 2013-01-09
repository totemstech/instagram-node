FILES = $(wildcard test/scripts/*.js)

test: 
	@for s in $(FILES) ; do \
		node $$s ; \
	done

.PHONY: test
