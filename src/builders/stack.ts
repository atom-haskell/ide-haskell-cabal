import {CtorOpts, BuilderBase} from './base'

export class Builder extends BuilderBase {
  constructor (opts: CtorOpts) {
    super('stack', opts)
    this.cabalArgs = atom.config.get('ide-haskell-cabal.stack.globalArguments') || []
  }

  protected async build () {
    this.cabalArgs.push('build')
    this.component()
    this.cabalArgs.push(...(atom.config.get('ide-haskell-cabal.stack.buildArguments') || []))
    return this.common()
  }
  protected async test () {
    this.cabalArgs.push('test')
    this.component()
    this.cabalArgs.push(...(atom.config.get('ide-haskell-cabal.stack.testArguments') || []))
    return this.runBuild()
  }
  protected async bench () {
    this.cabalArgs.push('bench')
    this.component()
    this.cabalArgs.push(...(atom.config.get('ide-haskell-cabal.stack.benchArguments') || []))
    return this.runBuild()
  }
  protected async clean () {
    this.cabalArgs.push('clean')
    this.component()
    this.cabalArgs.push(...(atom.config.get('ide-haskell-cabal.stack.cleanArguments') || []))
    return this.common()
  }
  protected async deps () {
    this.cabalArgs.push('build', '--only-dependencies')
    this.component()
    this.cabalArgs.push(...(atom.config.get('ide-haskell-cabal.stack.depsArguments') || []))
    return this.common()
  }

  private component () {
    let comp = this.opts.target.target && this.opts.target.target.target
    if (comp) {
      if (comp.startsWith('lib:')) { comp = 'lib'}
      comp = `${this.opts.target.project}:${comp}`
      this.cabalArgs.push(comp)
    }
  }

  private async runBuild () {
    const oldSeverity = this.opts.opts.severity
    this.opts.opts.severity = 'build'
    const res = await this.runCabal(['--no-run-tests', '--no-run-benchmarks'])
    this.opts.opts.severity = oldSeverity
    if (res.exitCode !== 0) {
      return res
    } else {
      return this.common()
    }
  }

  private async common () {
    return this.runCabal()
  }
}
