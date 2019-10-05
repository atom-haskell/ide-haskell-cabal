import { CtorOpts, ResultType, IParams } from './base'
import { CabalBase, getCabalOpts } from './base/cabal'

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
  private async commonBuild(
    command: 'build' | 'test' | 'bench' | 'install' | 'clean',
    args: string[],
    override: Partial<IParams> = {},
  ) {
    return this.runCabal(
      [
        await this.withPrefix(command),
        ...args,
        '--builddir=' + getCabalOpts().buildDir,
      ],
      override,
    )
  }
  protected async withPrefix(cmd: string) {
    return super.withPrefix(cmd, { oldprefix: 'new-', newprefix: 'v2-' })
  }
}
