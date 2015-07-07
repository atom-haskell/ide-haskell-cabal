# Node module dependencies
path = require 'path'
fs   = require 'fs'

# Atom dependencies
{CompositeDisposable, Emitter} = require 'atom'

# Internal dependencies
CabalProcess = require './cabal-process'

module.exports =
class IdeBackend

  constructor: ->
    @disposables = new CompositeDisposable
    @disposables.add @emitter = new Emitter

  # Get configuration option for active GHC
  getConfigOpt: (opt) ->
    value = switch atom.config.get 'ide-haskell-cabal.activeGhcVersion'
      when '7.2'  then atom.config.get 'ide-haskell-cabal.' + opt + '702'
      when '7.4'  then atom.config.get 'ide-haskell-cabal.' + opt + '704'
      when '7.6'  then atom.config.get 'ide-haskell-cabal.' + opt + '706'
      when '7.8'  then atom.config.get 'ide-haskell-cabal.' + opt + '708'
      when '7.10' then atom.config.get 'ide-haskell-cabal.' + opt + '710'
    return value.trim()

  cabalBuild: (onDone) ->
    # TODO: Might want to check _either_ the project path _or_ starting from
    # the actual file
    #editor    = atom.workspace.activePaneItem
    #editorCwd = path.dirname(editor.getPath())
    #cabalRoot = findCabalRoot editorCwd

    [cabalRoot, cabalFile] = findCabalFile atom.project.getPaths()[0]
    buildDir = @getConfigOpt 'buildDir'

    if cabalFile?
      cabalArgs    = ['build', '--only', '--builddir=' + buildDir]
      cabalProcess = new CabalProcess 'cabal', cabalArgs, @spawnOpts(cabalRoot), onDone
    else
      # TODO: Give proper error message
      console.log "No cabal file found"

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
  findCabalFile = (cwd) ->
    notRoot = (dir) -> dir != path.join dir, ".."

    while not containsCabalFile?(cwd) and notRoot(cwd)
      cwd = path.join cwd, ".."

    [cwd, containsCabalFile cwd]

  # Check if a directory contains a Cabal file
  # Returns the path to the cabal file if found or undefined otherwise
  containsCabalFile = (dir) ->
    isCabalFile = (file) ->
      if file.endsWith(".cabal")
       stat = fs.statSync (path.join dir, file)
       return stat.isFile()
      else
       return false

    contents = fs.readdirSync(dir)
    return file for file in contents when isCabalFile(file)

  ### Public interface below ###

  name: -> "ide-haskell-cabal"

  onBackendActive: (callback) =>
    @emitter.on 'backend-active', callback

  onBackendIdle: (callback) =>
    @emitter.on 'backend-idle', callback

  getType: (buffer, range, callback) =>
    # we don't get type information from Cabal
    undefined

  checkBuffer: (buffer, callback) =>
    # TODO: Should we pass an additional argument here?
    @emitter.emit 'backend-active'
    @cabalBuild (exitCode, msgs, rawErrors) =>
      @emitter.emit 'backend-idle'
      # cabal returns failure when there are type errors _or_ when it can't
      # compile the code at all (i.e., when there are missing dependencies).
      # Since it's hard to distinguish between these days, we look at the
      # parsed errors; if there are any, we assume that it at least managed to
      # start compiling (all dependencies available) and so we ignore the
      # exit code and just report the errors. Otherwise, we show an atom error
      # with the raw stderr output from cabal.
      callback msgs
      if exitCode != 0 && msgs.length == 0
        atom.notifications.addError "cabal failed with error code #{exitCode}",
          detail: rawErrors
          dismissable: true
