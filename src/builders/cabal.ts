import { CtorOpts } from './base'
import { runProcess } from './base/process'
import { CabalBase } from './base/cabal'

export class Builder extends CabalBase {
  constructor(opts: CtorOpts) {
    super(opts)
  }

  public async build() {
    this.cabalArgs = ['build', '--only']
    this.component()
    return this.commonBuild()
  }
  public async test() {
    this.opts.opts.severityChangeRx = {}
    this.opts.opts.severityChangeRx[
      this.opts.opts.severity
    ] = /Running \d+ test suites\.\.\./
    this.opts.opts.severity = 'build'
    this.cabalArgs = ['test', '--only', '--show-details=always']
    return this.commonBuild()
  }
  public async bench() {
    this.opts.opts.severityChangeRx = {}
    this.opts.opts.severityChangeRx[
      this.opts.opts.severity
    ] = /Running \d+ benchmarks\.\.\./
    this.opts.opts.severity = 'build'
    this.cabalArgs = ['bench', '--only', '--show-details=always']
    return this.commonBuild()
  }
  public async clean() {
    this.cabalArgs = ['clean', '--save-configure']
    return this.commonBuild()
  }
  public async deps() {
    const igns = atom.config.get('ide-haskell-cabal.cabal.ignoreNoSandbox')
    const sandboxConfig =
      this.spawnOpts.env.CABAL_SANDBOX_CONFIG || 'cabal.sandbox.config'
    const se = this.opts.cabalRoot.getFile(sandboxConfig).existsSync()
    if (!(se || igns)) {
      const res = await new Promise<{ exitCode: number; hasError: boolean }>(
        (resolve, reject) => {
          const notification = atom.notifications.addWarning(
            'No sandbox found, stopping',
            {
              dismissable: true,
              detail:
                'ide-haskell-cabal did not find sandbox configuration ' +
                'file. Installing dependencies without sandbox is ' +
                'dangerous and is not recommended. It is suggested to ' +
                'create a sandbox right now.',
              buttons: [
                {
                  className: 'icon icon-rocket',
                  text: 'Click here to create the sandbox',
                  onDidClick: () => {
                    resolve(this.createSandbox())
                    notification.dismiss()
                  },
                },
              ],
            },
          )
          const disp = notification.onDidDismiss(() => {
            disp.dispose()
            reject()
          })
        },
      )
      if (res.exitCode !== 0) {
        return res
      }
    }
    this.cabalArgs = [
      'install',
      '--only-dependencies',
      '--enable-tests',
      '--enable-benchmarks',
    ]
    return this.commonBuild()
  }

  protected additionalEnvSetup(env: typeof process.env) {
    env = super.additionalEnvSetup(env)

    // Set sandbox file (if specified)
    const sandboxConfig = this.cabalOpts.sandbox
    if (sandboxConfig !== '') {
      env.CABAL_SANDBOX_CONFIG = sandboxConfig
    }
    return env
  }

  private async createSandbox() {
    return runProcess(
      'cabal',
      ['sandbox', 'init'],
      this.spawnOpts,
      this.opts.opts,
    )
  }

  private async commonBuild() {
    this.cabalArgs.push('--builddir=' + this.cabalOpts.buildDir)
    return this.runCabal()
  }
}
