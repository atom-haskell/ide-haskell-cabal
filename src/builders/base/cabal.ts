import { CtorOpts, BuilderBase } from './index'
import { delimiter } from 'path'
import { ConfigValues } from 'atom'

type GHCVerProps = ConfigValues['ide-haskell-cabal']['cabal']['ghc800']

export abstract class CabalBase extends BuilderBase {
  constructor(opts: CtorOpts) {
    super('cabal', opts)
  }

  protected additionalEnvSetup(env: typeof process.env) {
    const opts = getCabalOpts()
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

export function getCabalOpts(): GHCVerProps {
  const vers = atom.config.get('ide-haskell-cabal.cabal.activeGhcVersion')
  const [maj, min] = vers.split('.')
  const key = `ide-haskell-cabal.cabal.ghc${maj}${
    min.length === 1 ? `0${min}` : min
  }`
  return atom.config.get(key)
}
