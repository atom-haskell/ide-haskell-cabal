module.exports=
class BuilderBase
  constructor: ->
  # Get configuration option for active GHC
  getConfigOpt: (opt) ->
    value = switch atom.config.get 'ide-haskell-cabal.cabal.activeGhcVersion'
      when '7.2'  then atom.config.get "ide-haskell-cabal.cabal.ghc702.#{opt}"
      when '7.4'  then atom.config.get "ide-haskell-cabal.cabal.ghc704.#{opt}"
      when '7.6'  then atom.config.get "ide-haskell-cabal.cabal.ghc706.#{opt}"
      when '7.8'  then atom.config.get "ide-haskell-cabal.cabal.ghc708.#{opt}"
      when '7.10' then atom.config.get "ide-haskell-cabal.cabal.ghc710.#{opt}"
      when '8.0'  then atom.config.get "ide-haskell-cabal.cabal.ghc800.#{opt}"
    return value

  spawnOpts: (cabalRoot) ->
    # Setup default opts
    opts =
      cwd: cabalRoot.getPath()
      detached: true
      env: {}

    {delimiter} = require 'path'

    env = {}
    for k, v of process.env
      env[k] = v

    if process.platform is 'win32'
      PATH = []
      capMask = (str, mask) ->
        a = str.split ''
        for c, i in a
          if mask & Math.pow(2, i)
            a[i] = a[i].toUpperCase()
        return a.join ''
      for m in [0b1111..0]
        vn = capMask("path", m)
        if env[vn]?
          PATH.push env[vn]
      env.PATH = PATH.join delimiter

    env.PATH ?= ""

    # set PATH depending on config settings
    ghcPath = @getConfigOpt 'pathTo'
    if @getConfigOpt 'pathExclusive'
      env.PATH = ghcPath.join(delimiter)
    else if ghcPath
      env.PATH = ghcPath.concat(env.PATH.split(delimiter)).join(delimiter)

    # Set sandbox file (if specified)
    sandboxConfig = @getConfigOpt 'sandbox'
    if sandboxConfig != ''
      env.CABAL_SANDBOX_CONFIG = sandboxConfig

    opts.env = env
    return opts
