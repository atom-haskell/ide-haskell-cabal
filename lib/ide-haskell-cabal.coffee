module.exports = IdeHaskellCabal =
  subscriptions: null

  activate: (@state) ->
    @disposables = null

  deactivate: ->
    @disposables?.dispose?()
    @disposables = null

  serialize: ->
    target: @target ? @state.target
    project: @project ? @state.project

  consumeUPI: (service) ->
    # Atom dependencies
    {CompositeDisposable} = require 'atom'

    # Internal dependencies
    IdeBackend = require './ide-backend'

    upi = service.registerPlugin @disposables = new CompositeDisposable

    backend = new IdeBackend(upi, @state)

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
      'ide-haskell-cabal:set-build-target': =>
        backend.setTarget onComplete: (@target) =>
      'ide-haskell-cabal:set-active-project': =>
        backend.setProject onComplete: (@project) =>

    upi.setMenu 'Cabal', [
        {label: 'Build Project', command: 'ide-haskell-cabal:build'}
        {label: 'Clean Project', command: 'ide-haskell-cabal:clean'}
        {label: 'Set Build Target', command: 'ide-haskell-cabal:set-build-target'}
        {label: 'Set Active Project', command: 'ide-haskell-cabal:set-active-project'}
        {label: 'Test', command: 'ide-haskell-cabal:test'}
      ]

    @disposables

  # Configuration settings
  #
  # Note: naming the variables so that alphabetical listing in the
  # config panel gives a sensible result.
  config:
    activeGhcVersion:
      type: 'string'
      title: 'Active GHC version'
      default: '7.8'
      enum: ['7.2', '7.4', '7.6', '7.8', '7.10']

    pathExclusive:
      title: 'Replace PATH (rather than append to it)'
      type: 'boolean'
      default: false

    # Path to GHC

    pathTo702:
      type: 'string'
      title: 'Path for GHC 7.2'
      default: ''

    pathTo704:
      type: 'string'
      title: 'Path for GHC 7.4'
      default: ''

    pathTo706:
      type: 'string'
      title: 'Path for GHC 7.6'
      default: ''

    pathTo708:
      type: 'string'
      title: 'Path for GHC 7.8'
      default: ''

    pathTo710:
      type: 'string'
      title: 'Path for GHC 7.10'
      default: ''

    # Sandbox config file

    sandbox702:
      type: 'string'
      title: 'Sandbox configuration file for GHC 7.2'
      default: ''

    sandbox704:
      type: 'string'
      title: 'Sandbox configuration file for GHC 7.4'
      default: ''

    sandbox706:
      type: 'string'
      title: 'Sandbox configuration file for GHC 7.6'
      default: ''

    sandbox708:
      type: 'string'
      title: 'Sandbox configuration file for GHC 7.8'
      default: ''

    sandbox710:
      type: 'string'
      title: 'Sandbox configuration file for GHC 7.10'
      default: ''

    # Build directory

    buildDir702:
      type: 'string'
      title: 'Build directory for GHC 7.2'
      default: 'dist'

    buildDir704:
      type: 'string'
      title: 'Build directory for GHC 7.4'
      default: 'dist'

    buildDir706:
      type: 'string'
      title: 'Build directory for GHC 7.6'
      default: 'dist'

    buildDir708:
      type: 'string'
      title: 'Build directory for GHC 7.8'
      default: 'dist'

    buildDir710:
      type: 'string'
      title: 'Build directory for GHC 7.10'
      default: 'dist'
