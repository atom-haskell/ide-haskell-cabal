import { CtorOpts, BuilderBase } from './index'
import { delimiter } from 'path'
import { ConfigValues } from 'atom'
import child_process = require('child_process')

type GHCVerProps = ConfigValues['ide-haskell-cabal']['cabal']['ghc800']

export abstract class CabalBase extends BuilderBase {
  protected versionPromise: Promise<string>

  constructor(opts: CtorOpts, globals: object = {}) {
    super('cabal', opts, globals)
    this.versionPromise = this.getVersion()
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
        return this.opts.target.targets.map((x) => x.target)
      case 'component':
        return [this.opts.target.component]
      case 'auto':
        return []
    }
  }

  private getVersion() {
    return new Promise<string>((resolve, reject) => {
      child_process.execFile(
        'cabal',
        ['--numeric-version'],
        this.spawnOpts,
        (error, stdout) => {
          if (error) reject(error)
          else {
            resolve(stdout)
          }
        },
      )
    })
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
