import {CtorOpts, BuilderBase} from './base'

export class Builder extends BuilderBase {
  constructor (opts: CtorOpts) {
    super('cabal', opts)
  }
  protected async build () {
    return {exitCode: 0, hasError: false}
  }
  protected async test () {
    return {exitCode: 0, hasError: false}
  }
  protected async bench () {
    return {exitCode: 0, hasError: false}
  }
  protected async clean () {
    return {exitCode: 0, hasError: false}
  }
  protected async deps () {
    return {exitCode: 0, hasError: false}
  }
}
