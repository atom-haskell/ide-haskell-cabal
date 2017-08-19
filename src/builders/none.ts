import { CtorOpts, BuilderBase } from './base'

export class Builder extends BuilderBase {
  constructor(opts: CtorOpts) {
    super('cabal', opts)
  }
  public async build() {
    return { exitCode: 0, hasError: false }
  }
  public async test() {
    return { exitCode: 0, hasError: false }
  }
  public async bench() {
    return { exitCode: 0, hasError: false }
  }
  public async clean() {
    return { exitCode: 0, hasError: false }
  }
  public async deps() {
    return { exitCode: 0, hasError: false }
  }
}
