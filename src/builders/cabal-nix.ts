import { CtorOpts, BuilderBase } from './base'

export class Builder extends BuilderBase {
  // TODO:
  //   * Commands other than 'build'
  //   * Support for buildDir
  constructor(opts: CtorOpts) {
    super('cabal', opts)
  }

  public async build() {
    this.cabalArgs = ['new-build']
    if (this.opts.target.target) {
      this.cabalArgs.push(this.opts.target.target.target)
    }
    return this.runCabal()
  }
  public async test(): Promise<{ exitCode: number, hasError: boolean }> {
    atom.notifications.addWarning("Command 'test' is not implemented for cabal-nix")
    throw new Error("Command 'test' is not implemented for cabal-nix")
  }
  public async bench(): Promise<{ exitCode: number, hasError: boolean }> {
    atom.notifications.addWarning("Command 'bench' is not implemented for cabal-nix")
    throw new Error("Command 'bench' is not implemented for cabal-nix")
  }
  public async clean(): Promise<{ exitCode: number, hasError: boolean }> {
    atom.notifications.addWarning("Command 'clean' is not implemented for cabal-nix")
    throw new Error("Command 'clean' is not implemented for cabal-nix")
  }
  public async deps(): Promise<{ exitCode: number, hasError: boolean }> {
    atom.notifications.addWarning("Command 'deps' is not implemented for cabal-nix")
    throw new Error("Command 'deps' is not implemented for cabal-nix")
  }
}
