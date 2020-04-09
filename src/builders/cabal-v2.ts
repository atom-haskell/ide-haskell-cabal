import { CtorOpts, ResultType, IParams } from './base'
import { CabalBase, getCabalOpts } from './base/cabal'
import { runProcess } from './base/process'

export class Builder extends CabalBase {
  constructor(opts: CtorOpts) {
    super(opts)
  }

  public async build() {
    return this.commonBuild('build', this.component())
  }
  public async test() {
    const severityChangeRx = {}
    severityChangeRx[
      this.opts.params.severity
    ] = /Running \d+ test suites\.\.\./
    return this.commonBuild('test', [], { severityChangeRx, severity: 'build' })
  }
  public async bench(): Promise<ResultType> {
    const severityChangeRx = {}
    severityChangeRx[this.opts.params.severity] = /Running \d+ benchmarks\.\.\./
    return this.commonBuild('bench', [], {
      severityChangeRx,
      severity: 'build',
    })
  }
  public async clean(): Promise<ResultType> {
    return this.commonBuild('clean', [])
  }
  public async deps(): Promise<ResultType> {
    atom.notifications.addWarning(
      "Command 'deps' is not implemented for cabal-v2",
    )
    throw new Error("Command 'deps' is not implemented for cabal-v2")
  }
  // overrides CabalBase.component()
  protected component() {
    return super.component().map((x) => `${this.opts.target.project}:${x}`)
  }
  protected async withPrefix(cmd: string) {
    return super.withPrefix(cmd, { oldprefix: 'new-', newprefix: 'v2-' })
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
