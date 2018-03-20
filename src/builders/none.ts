import { CtorOpts, BuilderBase } from './base'

export class Builder extends BuilderBase {
  private dummyResult = { exitCode: 0, hasError: false }
  constructor(opts: CtorOpts) {
    super('cabal', opts)
  }
  public async build() {
    return this.dummyResult
  }
  public async test() {
    return this.dummyResult
  }
  public async bench() {
    return this.dummyResult
  }
  public async clean() {
    return this.dummyResult
  }
  public async deps() {
    return this.dummyResult
  }
}
