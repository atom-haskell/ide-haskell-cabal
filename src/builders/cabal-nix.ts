import { CtorOpts, ResultType } from './base'
import { CabalBase } from './base/cabal'

export class Builder extends CabalBase {
  // TODO:
  //   * Commands other than 'build'
  //   * Support for buildDir
  constructor(opts: CtorOpts) {
    super(opts)
  }

  public async build() {
    this.cabalArgs = ['new-build']
    this.component()
    return this.runCabal()
  }
  public async test() {
    this.opts.opts.severityChangeRx = {}
    this.opts.opts.severityChangeRx[
      this.opts.opts.severity
    ] = /Running \d+ test suites\.\.\./
    this.opts.opts.severity = 'build'
    this.cabalArgs = ['new-test']
    return this.runCabal()
  }
  public async bench(): Promise<ResultType> {
    this.opts.opts.severityChangeRx = {}
    this.opts.opts.severityChangeRx[
      this.opts.opts.severity
    ] = /Running \d+ benchmarks\.\.\./
    this.opts.opts.severity = 'build'
    this.cabalArgs = ['new-bench']
    return this.runCabal()
  }
  public async clean(): Promise<ResultType> {
    atom.notifications.addWarning(
      "Command 'clean' is not implemented for cabal-nix",
    )
    throw new Error("Command 'clean' is not implemented for cabal-nix")
  }
  public async deps(): Promise<ResultType> {
    atom.notifications.addWarning(
      "Command 'deps' is not implemented for cabal-nix",
    )
    throw new Error("Command 'deps' is not implemented for cabal-nix")
  }
}
