import { CtorOpts, BuilderBase } from './base'
import { delimiter } from 'path'

export abstract class CabalBase extends BuilderBase {
  protected cabalOpts: GHCVerProps
  constructor(opts: CtorOpts) {
    super('cabal', opts)
    const map = {
      '7.2': atom.config.get('ide-haskell-cabal.cabal.ghc702'),
      '7.4': atom.config.get('ide-haskell-cabal.cabal.ghc704'),
      '7.6': atom.config.get('ide-haskell-cabal.cabal.ghc706'),
      '7.8': atom.config.get('ide-haskell-cabal.cabal.ghc708'),
      '7.10': atom.config.get('ide-haskell-cabal.cabal.ghc710'),
      '8.0': atom.config.get('ide-haskell-cabal.cabal.ghc800'),
      '8.2': atom.config.get('ide-haskell-cabal.cabal.ghc802'),
    }
    this.cabalOpts =
      map[atom.config.get('ide-haskell-cabal.cabal.activeGhcVersion')]
  }

  protected additionalEnvSetup(env: typeof process.env) {
    const opts = this.cabalOpts
    const ghcPath = opts.pathTo
    if (opts.pathExclusive) {
      env.PATH = ghcPath.join(delimiter)
    } else if (ghcPath.length > 0) {
      env.PATH = ghcPath
        .concat((env.PATH || '').split(delimiter))
        .join(delimiter)
    }

    return env
  }

  protected component() {
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
