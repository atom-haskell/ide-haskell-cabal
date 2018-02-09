import { CtorOpts, BuilderBase } from './base'

export class Builder extends BuilderBase {
  constructor(opts: CtorOpts) {
    super('stack', opts)
    this.cabalArgs =
      atom.config.get('ide-haskell-cabal.stack.globalArguments') || []
  }

  public async build() {
    this.cabalArgs.push('build')
    this.component()
    this.cabalArgs.push(
      ...(atom.config.get('ide-haskell-cabal.stack.buildArguments') || []),
    )
    return this.runCabal(['--no-run-tests', '--no-run-benchmarks'])
  }
  public async test() {
    this.cabalArgs.push('test')
    this.project()
    this.cabalArgs.push(
      ...(atom.config.get('ide-haskell-cabal.stack.testArguments') || []),
    )
    return this.runBuild()
  }
  public async bench() {
    this.cabalArgs.push('bench')
    this.project()
    this.cabalArgs.push(
      ...(atom.config.get('ide-haskell-cabal.stack.benchArguments') || []),
    )
    return this.runBuild()
  }
  public async clean() {
    this.cabalArgs.push('clean')
    this.project()
    this.cabalArgs.push(
      ...(atom.config.get('ide-haskell-cabal.stack.cleanArguments') || []),
    )
    return this.runCabal()
  }
  public async deps() {
    this.cabalArgs.push('build', '--only-dependencies')
    this.component()
    this.cabalArgs.push(
      ...(atom.config.get('ide-haskell-cabal.stack.depsArguments') || []),
    )
    return this.runCabal()
  }

  private fixTarget(comp: string): string {
    if (comp.startsWith('lib:')) {
      comp = 'lib'
    }
    return `${this.opts.target.project}:${comp}`
  }

  private project() {
    switch (this.opts.target.type) {
      case 'all':
      case 'component':
        this.cabalArgs.push(this.opts.target.project)
        break
      case 'auto':
        break
    }
  }

  private component() {
    switch (this.opts.target.type) {
      case 'all':
        this.cabalArgs.push(
          ...this.opts.target.targets.map((x) => this.fixTarget(x.target)),
        )
        break
      case 'component':
        this.cabalArgs.push(this.fixTarget(this.opts.target.component))
        break
      case 'auto':
        break
    }
  }

  private async runBuild() {
    const oldSeverity = this.opts.opts.severity
    this.opts.opts.severity = 'build'
    const res = await this.runCabal(['--no-run-tests', '--no-run-benchmarks'])
    this.opts.opts.severity = oldSeverity
    console.error(res.exitCode)
    if (res.exitCode !== 0) {
      return res
    } else {
      return this.runCabal()
    }
  }
}
