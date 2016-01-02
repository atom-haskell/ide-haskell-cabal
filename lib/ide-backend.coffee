# Node module dependencies
path = require 'path'
fs   = require 'fs'

# Atom dependencies
{CompositeDisposable, Emitter} = require 'atom'

# Internal dependencies
CabalProcess = null
HaskellCabal = null
TargetListView = null

module.exports =
class IdeBackend

  constructor: (@upi, state) ->
    @disposables = new CompositeDisposable

    @buildTarget = state?.target ? {name: 'All'}

    @disposables.add @upi.addPanelControl @targetElem = (document.createElement 'ide-haskell-target'),
      events:
        click: ->
          atom.commands.dispatch atom.views.getView(atom.workspace),
            'ide-haskell-cabal:set-build-target'
      before: '#progressBar'
    @showTarget()

  # Get configuration option for active GHC
  getConfigOpt: (opt) ->
    value = switch atom.config.get 'ide-haskell-cabal.activeGhcVersion'
      when '7.2'  then atom.config.get 'ide-haskell-cabal.' + opt + '702'
      when '7.4'  then atom.config.get 'ide-haskell-cabal.' + opt + '704'
      when '7.6'  then atom.config.get 'ide-haskell-cabal.' + opt + '706'
      when '7.8'  then atom.config.get 'ide-haskell-cabal.' + opt + '708'
      when '7.10' then atom.config.get 'ide-haskell-cabal.' + opt + '710'
    return value.trim()

  getActiveProjectPath: ->
    # TODO: This is far from optimal, and it would be better to allow specifying
    # active project here, but I don't have too much time on my hands right now
    # - Nick
    editor = atom.workspace.getActiveTextEditor()
    if editor?.getPath?()?
      path.dirname editor.getPath()
    else
      atom.project.getPaths()[0] ? process.cwd()

  cabalBuild: (cmd, opts) =>
    # TODO: It shouldn't be possible to call this function until cabalProcess
    # exits. Otherwise, problems will ensue.
    target = opts.target

    [cabalRoot, cabalFile] = @findCabalFile @getActiveProjectPath()
    buildDir = @getConfigOpt 'buildDir'

    if cabalFile?
      cabalArgs = [cmd]
      switch cmd
        when 'build', 'test'
          cabalArgs.push '--only'
        when 'clean'
          cabalArgs.push '--save-configure'
      cabalArgs.push '--builddir=' + buildDir
      cabalArgs.push target if target? and cmd is 'build'
      CabalProcess ?= require './cabal-process'
      cabalProcess = new CabalProcess 'cabal', cabalArgs, @spawnOpts(cabalRoot), opts
    else
      @cabalFileError()

  spawnOpts: (cabalRoot) ->
    # Setup default opts
    opts =
      cwd: cabalRoot
      detached: true
      env: {}
    opts.env[variable] = value for variable, value of process.env

    # set PATH depending on config settings
    ghcPath = @getConfigOpt 'pathTo'
    if atom.config.get 'cabal.pathExclusive'
      opts.env.PATH = ghcPath
    else
      opts.env.PATH = ghcPath + ":" + process.env.PATH

    # Set sandbox file (if specified)
    sandboxConfig = @getConfigOpt 'sandbox'
    if sandboxConfig != ''
      opts.env.CABAL_SANDBOX_CONFIG = sandboxConfig

    return opts

  # Traverse the directory structure from the cwd to the root, looking for the
  # directory that contains the .cabal file
  #
  # Returns an array containing the directory of the cabal file and the name of
  # the cabal file. The latter will be `null` if not found.
  findCabalFile: (cwd) =>
    notRoot = (dir) -> dir != path.join dir, ".."

    while not @containsCabalFile?(cwd) and notRoot(cwd)
      cwd = path.join cwd, ".."

    [cwd, @containsCabalFile cwd]

  # Check if a directory contains a Cabal file
  # Returns the path to the cabal file if found or undefined otherwise
  containsCabalFile: (dir) ->
    isCabalFile = (file) ->
      if file.endsWith(".cabal")
        stat = fs.statSync (path.join dir, file)
        return stat.isFile()
      else
        return false

    contents = fs.readdirSync(dir)
    return file for file in contents when isCabalFile(file)

  # Call into Cabal to parse the .cabal file
  parseCabalFile: (path, callback) ->
    HaskellCabal ?= require '../hs/HaskellCabal.min.js'
    fs.readFile path, {encoding: 'utf8'}, (err, data) ->
      HaskellCabal.parseDotCabal data, callback

  ### Public interface below ###

  build: ->
    @upi.setStatus status: 'progress', progress: 0.0
    @upi.clearMessages ['error', 'warning', 'build']

    cancelActionDisp = null
    @cabalBuild 'build',
      target: @buildTarget.target
      setCancelAction: (action) =>
        cancelActionDisp = @upi.addPanelControl 'ide-haskell-button',
          classes: ['cancel']
          events:
            click: ->
              action
          before: '#progressBar'
      onMsg: (messages) =>
        @upi.addMessages messages
      onProgress: (progress) =>
        @upi.setStatus {status: 'progress', progress}
      onDone: (exitCode, hasError) =>
        cancelActionDisp?.dispose?()
        @upi.setStatus status: 'ready'
        # cabal returns failure when there are type errors _or_ when it can't
        # compile the code at all (i.e., when there are missing dependencies).
        # Since it's hard to distinguish between these days, we look at the
        # parsed errors; if there are any, we assume that it at least managed to
        # start compiling (all dependencies available) and so we ignore the
        # exit code and just report the errors. Otherwise, we show an atom error
        # with the raw stderr output from cabal.
        if exitCode != 0
          if hasError
            @upi.setStatus status: 'warning'
          else
            @upi.setStatus status: 'error'

  clean: ->
    @upi.setStatus status: 'progress'
    @upi.clearMessages ['build']
    @cabalBuild 'clean',
      target: @buildTarget.target
      onMsg: (messages) =>
        @upi.addMessages messages
      onDone: (exitCode) =>
        @upi.setStatus status: 'ready'
        if exitCode != 0
          @upi.setStatus status: 'error'

  test: ->
    @upi.setStatus status: 'progress'
    @upi.clearMessages ['test']
    cancelActionDisp = null
    @cabalBuild 'test',
      target: @buildTarget.target
      setCancelAction: (action) =>
        cancelActionDisp = @upi.addPanelControl 'ide-haskell-button',
          classes: ['cancel']
          events:
            click: ->
              action
          before: '#progressBar'
      onMsg: (messages) =>
        @upi.addMessages (messages
          .filter ({severity}) -> severity is 'build'
          .map (msg) ->
            msg.severity = 'test'
            msg)
      onDone: (exitCode) =>
        cancelActionDisp?.dispose?()
        @upi.setStatus status: 'ready'
        if exitCode != 0
          @upi.setStatus status: 'error'

  showTarget: ->
    {type, name} = @buildTarget ? {name: "All"}
    if type
      @targetElem.innerText = "#{name} (#{type})"
    else
      @targetElem.innerText = "#{name}"

  setTarget: ({onComplete}) ->
    TargetListView ?= require './views/target-list-view'
    [cabalRoot, cabalFile] = @findCabalFile @getActiveProjectPath()
    unless cabalRoot? and cabalFile?
      @cabalFileError()
      return
    @parseCabalFile (path.join cabalRoot, cabalFile), (targets) =>
      new TargetListView
        items: targets.targets
        onConfirmed: (@buildTarget) =>
          @showTarget()
          onComplete? @buildTarget

  cabalFileError: ->
    @upi.addMessages [
      message: 'No cabal file found'
      severity: 'error'
    ]
    @upi.setStatus status: 'error'
