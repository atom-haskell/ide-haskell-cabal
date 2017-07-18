import {CtorOpts, BuilderBase} from './base'

import {runCabalProcess} from './cabal-process'

export class Builder extends BuilderBase {
  constructor (opts: CtorOpts) {
    super('cabal', opts)
  }

  protected async build () {
    this.cabalArgs = ['build', '--only']
    if (this.opts.target.target) {
      this.cabalArgs.push(this.opts.target.target.target)
    }
    return this.commonBuild()
  }
  protected async test () {
    this.opts.opts.severityChangeRx = {}
    this.opts.opts.severityChangeRx[this.opts.opts.severity] = /Running \d+ test suites\.\.\./
    this.opts.opts.severity = 'build'
    this.cabalArgs = ['test', '--only', '--show-details=always']
    return this.commonBuild()
  }
  protected async bench () {
    this.opts.opts.severityChangeRx = {}
    this.opts.opts.severityChangeRx[this.opts.opts.severity] =  /Running \d+ benchmarks\.\.\./
    this.opts.opts.severity = 'build'
    this.cabalArgs = ['bench', '--only', '--show-details=always']
    return this.commonBuild()
  }
  protected async clean () {
    this.cabalArgs = ['clean', '--save-configure']
    return this.commonBuild()
  }
  protected async deps () {
    const igns = atom.config.get('ide-haskell-cabal.cabal.ignoreNoSandbox')
    // tslint:disable-next-line: no-string-literal
    const sandboxConfig = this.spawnOpts.env['CABAL_SANDBOX_CONFIG'] || 'cabal.sandbox.config'
    const se = this.opts.cabalRoot.getFile(sandboxConfig).existsSync()
    if (!(se || igns)) {
      const res = await new Promise<{exitCode: number, hasError: boolean}>((resolve, reject) => {
        const notification = atom.notifications.addWarning('No sandbox found, stopping', {
          dismissable: true,
          detail: 'ide-haskell-cabal did not find sandbox configuration ' +
                  'file. Installing dependencies without sandbox is ' +
                  'dangerous and is not recommended. It is suggested to ' +
                  'create a sandbox right now.',
          buttons: [
            {
              className: 'icon icon-rocket',
              text: 'Click here to create the sandbox',
              onDidClick: () => {
                resolve(this.createSandbox())
              }
            }
          ]
        })
        const disp = notification.onDidDismiss(() => {
          disp.dispose()
          reject()
        })
      })
      if (res.exitCode !== 0) {
        return res
      }
    }
    this.cabalArgs = ['install', '--only-dependencies', '--enable-tests', '--enable-benchmarks']
    return this.commonBuild()
  }

  private async createSandbox () {
    return runCabalProcess('cabal', ['sandbox', 'init'], this.spawnOpts, this.opts.opts)
  }

  private async commonBuild (): Promise<{exitCode: number, hasError: boolean}> {
    this.cabalArgs.push('--builddir=' + this.getConfigOpt('buildDir'))
    return this.runCabal()
  }
}
