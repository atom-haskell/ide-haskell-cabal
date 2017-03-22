## 1.9.2
* Fix extra newline in errors

## 1.9.1
* Fix parsing of one-line messages

## 1.9.0
* Update README
* Add bench command

## 1.8.1
* Do not try to auto-detect target for test\/clean commands

## 1.8.0
* Determine target from currently open file

## 1.7.5
* Fix #16

## 1.7.4
* s rx class matches t as well...
* Updates to cabal output processing

## 1.7.3
* Ide-haskell param icons

## 1.7.2
* Rewrite `unindentMessage`, use os-specific EOL

## 1.7.1
* Fix cabal-nix builder (Edsko de Vries)

## 1.7.0
* Fix ghc8 warnings
* Fix LICENSE date
* Update LICENSE
* [Cabal] install cabal test dependencies
* Refactor and some fixes
* [Cabal] Honor CABAL_SANDBOX_CONFIG when checking
* [Cabal] clean test split code, progress code
* [Cabal] Detect build/test by regexp
* [Stack] build before test
* Minor fixes
* Run builder in promise
* Refactor command code

## 1.6.4
* Fix ideBackend disposal, use UPI 0.2.0

## 1.6.3
* Fix #14
* Remove dependency on aspv

## 1.6.2
* Add 'none' builder for ghci in repl

## 1.6.1
* Bump ahu version

## 1.6.0
* Guard against re-entrance of cabalBuild
* Fix progressbar with stack
* Relax UPI service constraints
* Reduce complexity of cabalBuild()
* Defer upi.setStatus until actually starting build
* Build config changes

## 1.5.2
* Show heading in builder selection if auto-opened

## 1.5.1
* Don't fallback to cabal builder

## 1.5.0
* Add dependency install, fix cancel

## 1.4.1
* Add ghc-8 to version list
* Activate on grammar-used

## 1.4.0
* Option for enabling cabal-nix
* Merge remote-tracking branch 'origin/pr/add-cabal-nix-builder'
* Rudimentary first support for `cabal new-build`

## 1.3.4
* AHS bump
* Atom-haskell-utils bump

## 1.3.3
* Fix path
* Fix value.trim() error

## 1.3.2
* Fix non-specified builder

## 1.3.1
* Cleanup config; Add stack config

## 1.3.0
* Merge in ide-haskell-stack

## 1.2.2
* Remove debug output

## 1.2.1
* Better path handling on Windows

## 1.2.0
* Add project select
* Add styles

## 1.1.0
* Add message highlighting
* Use atom-haskell-utils
* Defer `require`s until needed
* Remove unneeded line

## 1.0.0
* Migration to ide-haskell UPI interface

## 0.1.1
* A quick patch to work with multiple projects

## 0.1.0 - First Release
* Every feature added
* Every bug fixed
