VERSION=0.4.0
DATE=`date -uR`
UGLIFY=./node_modules/.bin/uglifyjs
SED=sed

ALL: .$(VERSION) favloader.min.js

favloader.js: favloader-src.js .$(VERSION)
	$(SED) -e "s/{{VER}}/$(VERSION)/g" -e "s/{{DATE}}/$(DATE)/g" favloader-src.js > favloader.js

favloader.min.js: favloader.js
	$(UGLIFY) -o favloader.min.js --comments --mangle -- favloader.js

.$(VERSION): Makefile
	touch .$(VERSION)

publish:
	$(NPM) publish --access=public
