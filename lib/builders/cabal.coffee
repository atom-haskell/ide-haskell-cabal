BuilderBase = require './base'

module.exports =
class BuilderCabal extends BuilderBase
  constructor: ->
  build: ({cmd, opts, target, cabalRoot}) ->
    spawnOpts = @spawnOpts(cabalRoot)
    cabalArgs = [cmd]
    switch cmd
      when 'build'
        cabalArgs.push '--only'
      when 'test'
        opts.severityChangeRx = {}
        opts.severityChangeRx[opts.severity] = /Running \d+ test suites\.\.\./
        opts.severity = 'build'
        cabalArgs.push '--only', '--show-details=always'
      when 'bench'
        opts.severityChangeRx = {}
        opts.severityChangeRx[opts.severity] =  /Running \d+ benchmarks\.\.\./
        opts.severity = 'build'
        cabalArgs.push '--only', '--show-details=always'
      when 'clean'
        cabalArgs.push '--save-configure'
      when 'deps'
        igns = atom.config.get('ide-haskell-cabal.cabal.ignoreNoSandbox')
        sandboxConfig = spawnOpts.env.CABAL_SANDBOX_CONFIG
        unless sandboxConfig
          sandboxConfig = 'cabal.sandbox.config'
        se = cabalRoot.getFile(sandboxConfig).existsSync()
        unless se or igns
          notification = atom.notifications.addWarning 'No sandbox found, stopping',
            dismissable: true
            detail: 'ide-haskell-cabal did not find sandbox configuration
                   \nfile. Installing dependencies without sandbox is
                   \ndangerous and is not recommended. It is suggested to
                   \ncreate a sandbox right now.'
          return (
            try
              notificationView = atom.views.getView(notification)
              notificationContent = notificationView.querySelector('.detail-content')
              install = document.createElement('button')
              install.style['margin-top'] = '1em'
              install.innerText = 'Click here to create sandbox'
              install.classList.add 'btn', 'btn-warning', 'icon', 'icon-rocket'
              if notificationContent?
                notificationContent.appendChild install
              new Promise (resolve) ->
                install.addEventListener 'click', ->
                  notification.dismiss()
                  resolve require('./cabal-process') 'cabal', ['sandbox', 'init'], spawnOpts, opts
              .then (res) =>
                if res.exitCode isnt 0
                  res
                else
                  @build {cmd, opts, target, cabalRoot}
            catch e
              {}
          )
        cabalArgs = ['install', '--only-dependencies', '--enable-tests', '--enable-benchmarks']
    cabalArgs.push '--builddir=' + @getConfigOpt('buildDir')
    cabalArgs.push target.target if target.target? and cmd is 'build'
    require('./cabal-process') 'cabal', cabalArgs, spawnOpts, opts
