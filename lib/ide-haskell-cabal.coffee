ghcVerProps =
  pathExclusive:
    title: 'Replace PATH (rather than append to it)'
    type: 'boolean'
    default: false
    order: 10

  pathTo:
    type: 'array'
    title: 'PATH; comma-separated'
    default: []
    order: 20

  sandbox:
    type: 'string'
    title: 'Sandbox configuration file'
    default: ''
    order: 30

  buildDir:
    type: 'string'
    title: 'Build directory'
    default: 'dist'
    order: 40

module.exports = IdeHaskellCabal =
  activate: ->
    @disposables = null

  deactivate: ->
    @disposables?.dispose?()
    @disposables = null

  consumeUPI: (service) ->
    # Atom dependencies
    {Disposable, CompositeDisposable} = require 'atom'

    # Internal dependencies
    IdeBackend = require './ide-backend'

    upi = service.registerPlugin @disposables = new CompositeDisposable, 'ide-haskell-cabal'

    backend = new IdeBackend(upi)

    @disposables.add new Disposable -> backend.destroy()

    upi.setMessageTypes
      error: {}
      warning: {}
      build:
        uriFilter: false
        autoScroll: true
      test:
        uriFilter: false
        autoScroll: true

    @disposables.add atom.commands.add 'atom-workspace',
      'ide-haskell-cabal:build': ->
        backend.build()
      'ide-haskell-cabal:clean': ->
        backend.clean()
      'ide-haskell-cabal:test': ->
        backend.test()
      'ide-haskell-cabal:bench': ->
        backend.bench()
      'ide-haskell-cabal:build-dependencies': ->
        backend.dependencies()
      'ide-haskell-cabal:set-build-target': ->
        upi.setConfigParam('target')
      'ide-haskell-cabal:set-active-builder': ->
        upi.setConfigParam('builder')

    upi.setMenu 'Builder', [
        {label: 'Build Project', command: 'ide-haskell-cabal:build'}
        {label: 'Clean Project', command: 'ide-haskell-cabal:clean'}
        {label: 'Test', command: 'ide-haskell-cabal:test'}
        {label: 'Bench', command: 'ide-haskell-cabal:bench'}
        {label: 'Build Dependencies', command: 'ide-haskell-cabal:build-dependencies'}
        {label: 'Set Build Target', command: 'ide-haskell-cabal:set-build-target'}
      ]

    @disposables

  # Configuration settings
  #
  # Note: naming the variables so that alphabetical listing in the
  # config panel gives a sensible result.
  config:
    enableNixBuild:
      description: 'Enable technical preview for cabal new-build introduced
                    with cabal-1.24. WARNING: this will break ghc-mod! Do not
                    enable unless you know what you are doing!'
      type: 'boolean'
      default: false
      order: 0
    stack:
      type: 'object'
      properties:
        globalArguments:
          type: 'array'
          description: 'Global stack arguments (comma-separated)'
          default: []
          order: 10
        buildArguments:
          type: 'array'
          description: 'Stack build command arguments (comma-separated)'
          default: []
          order: 20
        testArguments:
          type: 'array'
          description: 'Stack test command arguments (comma-separated)'
          default: []
          order: 30
        benchArguments:
          type: 'array'
          description: 'Stack bench command arguments (comma-separated)'
          default: []
          order: 30
    cabal:
      type: 'object'
      properties:
        ignoreNoSandbox:
          type: 'boolean'
          title: 'Install dependencies with no sandbox'
          description: 'Installing dependencies with no project sandbox is not
                        recommended, but you can do it if you enable this option'
          default: false
        activeGhcVersion:
          type: 'string'
          title: 'Active GHC version'
          default: '7.10'
          enum: ['7.2', '7.4', '7.6', '7.8', '7.10', '8.0']
        'ghc702':
          type: 'object'
          title: 'GHC 7.2'
          properties: ghcVerProps
        'ghc704':
          type: 'object'
          title: 'GHC 7.4'
          properties: ghcVerProps
        'ghc706':
          type: 'object'
          title: 'GHC 7.6'
          properties: ghcVerProps
        'ghc708':
          type: 'object'
          title: 'GHC 7.8'
          properties: ghcVerProps
        'ghc710':
          type: 'object'
          title: 'GHC 7.10'
          properties: ghcVerProps
        'ghc800':
          type: 'object'
          title: 'GHC 8.0'
          properties: ghcVerProps
