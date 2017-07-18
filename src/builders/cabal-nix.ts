import {CtorOpts, BuilderBase} from './base'

export class Builder extends BuilderBase {
  // TODO:
  //   * Commands other than 'build'
  //   * Support for buildDir
  constructor (opts: CtorOpts) {
    super('cabal', opts)
  }

  protected async build () {
    this.cabalArgs = ['new-build']
    if (this.opts.target.target) {
      this.cabalArgs.push(this.opts.target.target.target)
    }
    return this.runCabal()
  }
  protected async test (): Promise<{exitCode: number, hasError: boolean}> {
    atom.notifications.addWarning("Command 'test' is not implemented for cabal-nix")
    throw new Error("Command 'test' is not implemented for cabal-nix")
  }
  protected async bench (): Promise<{exitCode: number, hasError: boolean}> {
    atom.notifications.addWarning("Command 'bench' is not implemented for cabal-nix")
    throw new Error("Command 'bench' is not implemented for cabal-nix")
  }
  protected async clean (): Promise<{exitCode: number, hasError: boolean}> {
    atom.notifications.addWarning("Command 'clean' is not implemented for cabal-nix")
    throw new Error("Command 'clean' is not implemented for cabal-nix")
  }
  protected async deps (): Promise<{exitCode: number, hasError: boolean}> {
    atom.notifications.addWarning("Command 'deps' is not implemented for cabal-nix")
    throw new Error("Command 'deps' is not implemented for cabal-nix")
  }
}
