# ide-haskell-cabal package

The `ide-haskell-cabal` package provides a build backend for `ide-haskell`
package based on `cabal` or `stack`.

It supports easy switching between multiple versions of GHC by having a set of configuration settings for each version of GHC, plus a drop-down box to pick a GHC version. For each GHC version you can specify:

* The path (either adding to your system path or replacing it completely)
* The sandbox file (cabal `CABAL_SANDBOX_CONFIG` environment variable)
* The build directory (cabal `--builddir` parameter). This defaults to `dist/`.

It also provides support for `ide-haskell`'s build target selection by reading and parsing the `.cabal` file and extracting the available targets (it uses a thin `ghcjs`-compiled wrapper around the `Cabal` library to read the `.cabal` file).

## Installation and configuration

Please refer to documentation site https://atom-haskell.github.io
