HaskellCabal.js: Cabal.hs Exports.js
	ghcjs -DGHCJS_BROWSER Cabal.hs
	echo "(function(global) {" >HaskellCabal.js
	cat Cabal.jsexe/{rts,lib,out}.js Exports.js >>HaskellCabal.js
	echo "})(exports);" >>HaskellCabal.js

HaskellCabal.min.js: Cabal.hs Exports.js
	ghcjs -DGHCJS_BROWSER Cabal.hs
	echo "(function(global) {" >HaskellCabal.min.js
	ccjs Cabal.jsexe/{rts,lib,out}.js Exports.js \
	  --compilation_level=ADVANCED_OPTIMIZATIONS \
	  >>HaskellCabal.min.js
	echo "})(exports);" >>HaskellCabal.min.js

.PHONY: clean
clean:
	rm -rf Cabal.jsexe
	rm -f HaskellCabal.{js,min.js}
	rm -f *.js_{hi,o}
