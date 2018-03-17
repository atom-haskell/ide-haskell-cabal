import { CtorOpts, BuilderBase, ResultType } from './base'

export class Builder extends BuilderBase {
  // TODO:
  //   * Commands other than 'build'
  //   * Support for buildDir
  constructor(opts: CtorOpts) {
    super('cabal', opts)
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

  private component() {
    switch (this.opts.target.type) {
      case 'all':
        this.cabalArgs.push(...this.opts.target.targets.map((x) => x.target))
        break
      case 'component':
        this.cabalArgs.push(this.opts.target.component)
        break
      case 'auto':
        break
    }
  }
}
