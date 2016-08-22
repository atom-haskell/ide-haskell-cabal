# Node module dependencies
path = require 'path'
fs   = require 'fs'

# Atom dependencies
{CompositeDisposable, Emitter} = require 'atom'

# Internal dependencies
Util = require 'atom-haskell-utils'
CabalProcess = null
TargetListView = null
ProjectListView = null
BuilderListView = null

module.exports =
class IdeBackend

  constructor: (@upi, state) ->
    @disposables = new CompositeDisposable

    @buildTarget = state?.target ? {name: 'All'}
    @buildProject = state?.project ? {name: 'Auto'}
    @buildBuilder = state?.builder ? 'cabal'

    @disposables.add @upi.addPanelControl @builderElem = (document.createElement 'ide-haskell-builder'),
      events:
        click: ->
          atom.commands.dispatch atom.views.getView(atom.workspace),
            'ide-haskell-cabal:set-active-builder'
      before: '#progressBar'
    @showBuilder()
    @disposables.add @upi.addPanelControl @projectElem = (document.createElement 'ide-haskell-project'),
      events:
        click: ->
          atom.commands.dispatch atom.views.getView(atom.workspace),
            'ide-haskell-cabal:set-active-project'
      before: '#progressBar'
    @showProject()
    @disposables.add @upi.addPanelControl @targetElem = (document.createElement 'ide-haskell-target'),
      events:
        click: ->
          atom.commands.dispatch atom.views.getView(atom.workspace),
            'ide-haskell-cabal:set-build-target'
      before: '#progressBar'
    @showTarget()

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

  getActiveProjectPath: ->
    if @buildProject.dir?
      return @buildProject.dir
    editor = atom.workspace.getActiveTextEditor()
    if editor?.getPath?()?
      path.dirname editor.getPath()
    else
      atom.project.getPaths()[0] ? process.cwd()

  cabalBuild: (cmd, opts) =>
    # TODO: It shouldn't be possible to call this function until cabalProcess
    # exits. Otherwise, problems will ensue.

    cabalRoot = Util.getRootDir @getActiveProjectPath()

    [cabalFile] =
      cabalRoot.getEntriesSync().filter (file) ->
        file.isFile() and file.getBaseName().endsWith '.cabal'

    if cabalFile?
      switch @buildBuilder
        when 'cabal'
          buildDir = @getConfigOpt 'buildDir'
          target = opts.target.target
          cabalArgs = [cmd]
          switch cmd
            when 'build', 'test'
              cabalArgs.push '--only'
            when 'clean'
              cabalArgs.push '--save-configure'
            when 'deps'
              igns = atom.config.get('ide-haskell-cabal.cabal.ignoreNoSandbox')
              se = cabalRoot.getFile('cabal.sandbox.config').existsSync()
              unless se or igns
                notification = atom.notifications.addWarning 'No sandbox found, stopping',
                  dismissable: true
                  detail: 'ide-haskell-cabal did not find sandbox configuration
                         \nfile. Installing dependencies without sandbox is
                         \ndangerous and is not recommended. It is suggested to
                         \ncreate a sandbox right now.'
                try
                  notificationView = atom.views.getView(notification)
                  notificationContent = notificationView.querySelector('.detail-content')
                  install = document.createElement('button')
                  install.style['margin-top'] = '1em'
                  install.innerText = 'Click here to create sandbox'
                  install.classList.add 'btn', 'btn-warning', 'icon', 'icon-rocket'
                  install.addEventListener 'click', =>
                    CabalProcess ?= require './cabal-process'
                    new CabalProcess 'cabal', ['sandbox', 'init'], @spawnOpts(cabalRoot), opts
                  if notificationContent?
                    notificationContent.appendChild install
                return opts.onDone()
              cabalArgs = ['install', '--only-dependencies']
          cabalArgs.push '--builddir=' + buildDir
          cabalArgs.push target if target? and cmd is 'build'
          CabalProcess ?= require './cabal-process'
          cabalProcess = new CabalProcess 'cabal', cabalArgs, @spawnOpts(cabalRoot), opts
        when 'cabal-nix'
          # TODOs:
          #   * Commands other than 'build'
          #   * Support for buildDir
          if cmd is 'build'
            cabalArgs = ['new-build']
          else
            atom.notifications.addWarning "Command '#{cmd}' is not implemented for cabal-nix"
            return opts.onDone()

          target = opts.target.target
          cabalArgs.push target if target? and cmd is 'build'
          CabalProcess ?= require './cabal-process'
          cabalProcess = new CabalProcess 'cabal', cabalArgs, @spawnOpts(cabalRoot), opts
        when 'stack'
          cabalArgs = atom.config.get('ide-haskell-cabal.stack.globalArguments') ? []
          switch cmd
            when 'deps'
              cabalArgs.push 'build', '--only-dependencies'
            else
              cabalArgs.push cmd
          target = opts.target
          comp = target.target
          if comp?
            if comp.startsWith 'lib:'
              comp = 'lib'
            comp = "#{target.project}:#{comp}"
            cabalArgs.push comp
          cabalArgs.push (atom.config.get("ide-haskell-cabal.stack.#{cmd}Arguments") ? [])...
          CabalProcess ?= require './cabal-process'
          cabalProcess = new CabalProcess 'stack', cabalArgs, @spawnOpts(cabalRoot), opts
        else
          throw new Error("Unkown builder '#{@buildBuilder}'")
    else
      @cabalFileError()

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

  ### Public interface below ###

  build: ->
    @upi.setStatus status: 'progress', progress: 0.0
    @upi.clearMessages ['error', 'warning', 'build']

    cancelActionDisp = null
    @cabalBuild 'build',
      target: @buildTarget
      setCancelAction: (action) =>
        cancelActionDisp = @upi.addPanelControl 'ide-haskell-button',
          classes: ['cancel']
          events:
            click: ->
              action()
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
      target: @buildTarget
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
      target: @buildTarget
      setCancelAction: (action) =>
        cancelActionDisp = @upi.addPanelControl 'ide-haskell-button',
          classes: ['cancel']
          events:
            click: ->
              action()
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

  dependencies: ->
    @upi.setStatus status: 'progress'
    @upi.clearMessages ['build']
    cancelActionDisp = null
    @cabalBuild 'deps',
      target: @buildTarget
      setCancelAction: (action) =>
        cancelActionDisp = @upi.addPanelControl 'ide-haskell-button',
          classes: ['cancel']
          events:
            click: ->
              action()
          before: '#progressBar'
      onMsg: (messages) =>
        @upi.addMessages messages
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

  showProject: ->
    {name} = @buildProject ? {name: "Auto"}
    @projectElem.innerText = "#{name}"

  showBuilder: ->
    name = @buildBuilder ? "cabal"
    @builderElem.innerText = "#{name}"

  setProject: ({onComplete}) ->
    ProjectListView ?= require './views/project-list-view'

    projects = atom.project.getDirectories().map (d) ->
      name: d.getBaseName()
      dir: d.getPath()

    new ProjectListView
      items: projects
      onConfirmed: (@buildProject) =>
        @showProject()
        onComplete? @buildProject

  setBuilder: ({onComplete}) ->
    BuilderListView ?= require './views/builder-list-view'

    builders = [{name: 'cabal'}, {name: 'stack'}]
    if atom.config.get('ide-haskell-cabal.enableNixBuild')
      builders.push {name: 'cabal-nix'}

    new BuilderListView
      items: builders
      onConfirmed: (@buildBuilder) =>
        @showBuilder()
        onComplete? @buildBuilder

  setTarget: ({onComplete}) ->
    TargetListView ?= require './views/target-list-view'
    cabalRoot = Util.getRootDir @getActiveProjectPath()

    [cabalFile] =
      cabalRoot.getEntriesSync().filter (file) ->
        file.isFile() and file.getBaseName().endsWith '.cabal'

    unless cabalFile?
      @cabalFileError()
      return

    cabalFile.read()
    .then (data) ->
      new Promise (resolve) ->
        Util.parseDotCabal data, resolve
    .then (targets) =>
      new TargetListView
        items:
          targets.targets.map (t) ->
            t.project = targets.name
            return t
        onConfirmed: (@buildTarget) =>
          @showTarget()
          onComplete? @buildTarget

  cabalFileError: ->
    @upi.addMessages [
      message: 'No cabal file found'
      severity: 'error'
    ]
    @upi.setStatus status: 'error'
