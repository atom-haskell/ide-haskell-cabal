BuilderBase = require './base'

module.exports =
class BuilderCabal extends BuilderBase
  constructor: ->
  build: ({cmd, opts, target, cabalRoot}) ->
    spawnOpts = @spawnOpts(cabalRoot)
    cabalArgs = atom.config.get('ide-haskell-cabal.stack.globalArguments') ? []
    switch cmd
      when 'deps'
        cabalArgs.push 'build', '--only-dependencies'
      else
        cabalArgs.push cmd
    comp = target.target
    if comp?
      if comp.startsWith 'lib:'
        comp = 'lib'
      comp = "#{target.project}:#{comp}"
      cabalArgs.push comp
    cabalArgs.push (atom.config.get("ide-haskell-cabal.stack.#{cmd}Arguments") ? [])...
    if cmd is 'test'
      opts.severity = 'build'
      require('./cabal-process') 'stack', cabalArgs.concat(['--no-run-tests']), spawnOpts, opts
      .then (res) ->
        if res.exitCode isnt 0
          res
        else
          opts.severity = 'test'
          require('./cabal-process') 'stack', cabalArgs, spawnOpts, opts
    else
      require('./cabal-process') 'stack', cabalArgs, spawnOpts, opts
