.PHONY: test-publish publish

VERSION=0.4.4
DATE=`date -uR`
UGLIFY=./node_modules/.bin/uglifyjs
SED=sed
NPM=npm

ALL: favloader.min.js parseGIF.min.js README.md package.json

favloader.js: favloader-src.js .$(VERSION)
	$(SED) -e "s/{{VER}}/$(VERSION)/g" -e "s/{{DATE}}/$(DATE)/g" favloader-src.js > favloader.js

README.md: templates/README.md .$(VERSION)
	$(SED) -e "s/{{VER}}/$(VERSION)/g" templates/README.md > README.md

package.json: templates/package.json .$(VERSION)
	$(SED) -e "s/{{VER}}/"$(VERSION)"/" templates/package.json > package.json || true

favloader.min.js: favloader.js
	$(UGLIFY) -o favloader.min.js --comments --mangle -- favloader.js

parseGIF.min.js: parseGIF.js
	$(UGLIFY) -o parseGIF.min.js --comments --mangle -- parseGIF.js

.$(VERSION): Makefile
	touch .$(VERSION)

publish:
	$(NPM) publish --access=public

test-publish:
	$(NPM) publish --dry-run
