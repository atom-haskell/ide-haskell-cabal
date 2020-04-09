import { CtorOpts } from './base'
import { runProcess, IParams } from './base/process'
import { CabalBase, getCabalOpts } from './base/cabal'

export class Builder extends CabalBase {
  constructor(opts: CtorOpts) {
    super(opts)
  }

  public async build() {
    return this.commonBuild('build', ['--only', ...this.component()])
  }
  public async test() {
    const severityChangeRx = {}
    severityChangeRx[
      this.opts.params.severity
    ] = /Running \d+ test suites\.\.\./
    return this.commonBuild('test', ['--only', '--show-details=always'], {
      severityChangeRx,
      severity: 'build',
    })
  }
  public async bench() {
    const severityChangeRx = {}
    severityChangeRx[this.opts.params.severity] = /Running \d+ benchmarks\.\.\./
    return this.commonBuild('bench', ['--only', '--show-details=always'], {
      severityChangeRx,
      severity: 'build',
    })
  }
  public async clean() {
    return this.commonBuild('clean', ['--save-configure'])
  }
  public async deps() {
    const igns = atom.config.get('ide-haskell-cabal.cabal.ignoreNoSandbox')
    const sandboxConfig =
      this.getSpawnOpts().env.CABAL_SANDBOX_CONFIG || 'cabal.sandbox.config'
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
    return this.commonBuild('install', [
      '--only-dependencies',
      '--enable-tests',
      '--enable-benchmarks',
    ])
  }

  protected additionalEnvSetup(env: typeof process.env) {
    env = super.additionalEnvSetup(env)

    // Set sandbox file (if specified)
    const sandboxConfig = getCabalOpts().sandbox
    if (sandboxConfig !== '') {
      env.CABAL_SANDBOX_CONFIG = sandboxConfig
    }
    return env
  }

  protected async withPrefix(cmd: string) {
    return super.withPrefix(cmd, { oldprefix: '', newprefix: 'v1-' })
  }

  private async createSandbox() {
    return runProcess(
      'cabal',
      [await this.withPrefix('sandbox'), 'init'],
      this.getSpawnOpts(),
      this.opts.params,
    )
  }

  private async commonBuild(
    command: 'build' | 'test' | 'bench' | 'install' | 'clean',
    args: string[],
    override: Partial<IParams> = {},
  ) {
    if (atom.config.get('ide-haskell-cabal.cabal.runHpack')) {
      if (await this.opts.cabalRoot.getFile('package.yaml').exists()) {
        await runProcess('hpack', [], this.getSpawnOpts(), this.opts.params)
      }
    }
    return this.runCabal(
      [
        await this.withPrefix(command),
        ...args,
        '--builddir=' + getCabalOpts().buildDir,
      ],
      override,
    )
  }
}
