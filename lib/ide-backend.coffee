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

  constructor: (@upi) ->
    @disposables = new CompositeDisposable

    @disposables.add @upi.addConfigParam
      builder:
        items: ->
          builders = [{name: 'cabal'}, {name: 'stack'}]
          if atom.config.get('ide-haskell-cabal.enableNixBuild')
            builders.push {name: 'cabal-nix'}
          builders.push {name: 'none'}
          builders
        itemTemplate: (item) ->
          "<li>
            <div class='name'>#{item.name}</div>
          </li>
          "
        displayTemplate: (item) ->
          item?.name ? "Not set"
        itemFilterKey: "name"
        description: 'Select builder to use with current project'
      target:
        default: {}
        items: ->
          projects =
            atom.project.getDirectories().map (d) ->
              dir = d.getPath()
              cabalRoot = Util.getRootDir dir
              [cabalFile] =
                cabalRoot.getEntriesSync().filter (file) ->
                  file.isFile() and file.getBaseName().endsWith '.cabal'
              {dir, cabalFile}
            .filter ({cabalFile}) -> cabalFile?
            .map ({dir, cabalFile}) ->
              cabalFile.read()
              .then (data) ->
                new Promise (resolve) ->
                  Util.parseDotCabal data, resolve
              .then (project) ->
                project.targets.unshift({})
                return project.targets.map (t) ->
                  t.project = project.name
                  t.dir = dir
                  t
          Promise.all(projects)
          .then (projects) ->
            [{}].concat projects...
        itemTemplate: (tgt) ->
          "<li>
            <div class='project'>#{tgt?.project ? 'Auto'}</div>
            <div class='dir'>#{(tgt?.dir unless tgt.type?) ? ''}</div>
            <div class='type'>#{tgt?.type ? ''}</div>
            <div class='name'>#{tgt?.name ? 'All'}</div>
            <div class='clearfix'></div>
          </li>
          "
        displayTemplate: (item) ->
          unless item?.project?
            "Auto"
          else
            "#{item.project}: #{item?.name ? 'All'}"
        itemFilterKey: "name"
        description: 'Select target to build'

  destroy: ->
    @disposables.dispose()
    @upi = null

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
    editor = atom.workspace.getActiveTextEditor()
    if editor?.getPath?()?
      path.dirname editor.getPath()
    else
      atom.project.getPaths()[0] ? process.cwd()

  cabalBuild: (cmd, opts) =>
    # It shouldn't be possible to call this function until cabalProcess
    # exits. Otherwise, problems will ensue.
    return opts.onDone?() if @cabalProcess?.running

    Promise.all [@upi.getConfigParam('builder'), @upi.getConfigParam('target')]
    .then ([builder, target]) =>
      @upi.setStatus
        status: 'progress'
        progress:
          if opts.onProgress?
            0.0
          else
            null

      cabalRoot = Util.getRootDir(target.dir ? @getActiveProjectPath())

      [cabalFile] =
        cabalRoot.getEntriesSync().filter (file) ->
          file.isFile() and file.getBaseName().endsWith '.cabal'

      if cabalFile?
        buildf = @builders[builder.name]
        if buildf?
          args = {
            cmd
            opts
            target
            cabalRoot
            spawnOpts: @spawnOpts(cabalRoot)
            buildDir: @getConfigOpt('buildDir')
          }
          @cabalProcess = buildf args
        else
          throw new Error("Unkown builder '#{builder?.name ? builder}'")
      else
        @cabalFileError()
    .catch (error) ->
      if error?
        atom.notifications.addFatalError error.toString(),
          detail: error
          dismissable: true
      opts.onDone?()

  builders:
    none: ({opts}) -> opts.onDone(0, false)
    cabal: ({cmd, opts, target, cabalRoot, spawnOpts, buildDir}) ->
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
              install.addEventListener 'click', ->
                notification.dismiss()
                CabalProcess ?= require './cabal-process'
                new CabalProcess 'cabal', ['sandbox', 'init'], spawnOpts, opts
              if notificationContent?
                notificationContent.appendChild install
            return opts.onDone()
          cabalArgs = ['install', '--only-dependencies']
      cabalArgs.push '--builddir=' + buildDir
      cabalArgs.push target.target if target.target? and cmd is 'build'
      CabalProcess ?= require './cabal-process'
      new CabalProcess 'cabal', cabalArgs, spawnOpts, opts

    'cabal-nix': ({cmd, opts, target, spawnOpts}) ->
      # TODOs:
      #   * Commands other than 'build'
      #   * Support for buildDir
      if cmd is 'build'
        cabalArgs = ['new-build']
      else
        atom.notifications.addWarning "Command '#{cmd}' is not implemented for cabal-nix"
        return opts.onDone()

      cabalArgs.push target.target if target.target? and cmd is 'build'
      CabalProcess ?= require './cabal-process'
      new CabalProcess 'cabal', cabalArgs, spawnOpts, opts

    stack: ({cmd, opts, target, spawnOpts}) ->
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
      CabalProcess ?= require './cabal-process'
      new CabalProcess 'stack', cabalArgs, spawnOpts, opts

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
    @upi.clearMessages ['error', 'warning', 'build']

    cancelActionDisp = null
    @cabalBuild 'build',
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
    @upi.clearMessages ['build']
    @cabalBuild 'clean',
      onMsg: (messages) =>
        @upi.addMessages messages
      onDone: (exitCode) =>
        @upi.setStatus status: 'ready'
        if exitCode != 0
          @upi.setStatus status: 'error'

  test: ->
    @upi.clearMessages ['test']
    cancelActionDisp = null
    @cabalBuild 'test',
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
    @upi.clearMessages ['build']
    cancelActionDisp = null
    @cabalBuild 'deps',
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

  cabalFileError: ->
    @upi.addMessages [
      message: 'No cabal file found'
      severity: 'error'
    ]
    @upi.setStatus status: 'error'
