BuilderBase = require './base'

module.exports =
class BuilderCabal extends BuilderBase
  constructor: ->
  build: ({cmd, opts, target, cabalRoot}) ->
    # TODOs:
    #   * Commands other than 'build'
    #   * Support for buildDir
    spawnOpts = @spawnOpts(cabalRoot)
    if cmd is 'build'
      cabalArgs = ['new-build']
    else
      atom.notifications.addWarning "Command '#{cmd}' is not implemented for cabal-nix"
      return {}

    cabalArgs.push target.target if target.target? and cmd is 'build'
    require('./cabal-process') 'cabal', cabalArgs, spawnOpts, opts
