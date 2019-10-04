import { CtorOpts, BuilderBase } from './base'

export class Builder extends BuilderBase {
  constructor(opts: CtorOpts) {
    super('stack', opts)
  }

  public async build() {
    return this.runCommon([
      'build',
      ...this.component(),
      ...(atom.config.get('ide-haskell-cabal.stack.buildArguments') || []),
      '--no-run-tests',
      '--no-run-benchmarks',
    ])
  }
  public async test() {
    return this.runBuild([
      'test',
      ...this.project(),
      ...(atom.config.get('ide-haskell-cabal.stack.testArguments') || []),
    ])
  }
  public async bench() {
    return this.runBuild([
      'bench',
      ...this.project(),
      ...(atom.config.get('ide-haskell-cabal.stack.benchArguments') || []),
    ])
  }
  public async clean() {
    return this.runCommon([
      'clean',
      ...this.project(),
      ...(atom.config.get('ide-haskell-cabal.stack.cleanArguments') || []),
    ])
  }
  public async deps() {
    return this.runCommon([
      'build',
      '--only-dependencies',
      ...this.component(),
      ...(atom.config.get('ide-haskell-cabal.stack.depsArguments') || []),
    ])
  }

  private async runCommon(args: string[], overrides: {} = {}) {
    const globalArgs =
      atom.config.get('ide-haskell-cabal.stack.globalArguments') || []
    return this.runCabal([...globalArgs, ...args], overrides)
  }

  private fixTarget(comp: string): string {
    if (comp.startsWith('lib:')) {
      comp = 'lib'
    }
    return `${this.opts.target.project}:${comp}`
  }

  private project(): string[] {
    switch (this.opts.target.type) {
      case 'all':
      case 'component':
        return [this.opts.target.project]
      case 'auto':
        return []
    }
  }

  private component(): string[] {
    switch (this.opts.target.type) {
      case 'all':
        return this.opts.target.targets.map((x) => this.fixTarget(x.target))
      case 'component':
        return [this.fixTarget(this.opts.target.component)]
      case 'auto':
        return []
    }
  }

  private async runBuild(args: string[]) {
    const res = await this.runCommon(
      [...args, '--no-run-tests', '--no-run-benchmarks'],
      {
        severity: 'build',
      },
    )
    if (res.exitCode !== 0) {
      console.error(res.exitCode)
      return res
    } else {
      return this.runCommon(args)
    }
  }
}
