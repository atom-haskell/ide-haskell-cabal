import { delimiter } from 'path'

import { CabalCommand, TargetParamType } from './../common'

import { runCabalProcess, IParams } from './cabal-process'
import { Directory } from 'atom'
export { IParams }

export interface CtorOpts {
  opts: IParams,
  target: TargetParamType,
  cabalRoot: Directory
}

export interface ResultType {
  exitCode: number | null
  hasError: boolean
}

export type TBuilderBase = {[K in CabalCommand]: () => Promise<ResultType>}

export abstract class BuilderBase implements TBuilderBase {
  protected cabalArgs: string[]
  protected spawnOpts: { cwd: string, detached: boolean, env: { [key: string]: string | undefined } }

  constructor(
    private processName: string,
    protected opts: CtorOpts,
  ) {
    this.spawnOpts = this.getSpawnOpts()
    this.cabalArgs = []
  }

  public async runCommand(cmd: CabalCommand): Promise<ResultType> {
    return this[cmd]()
  }

  public abstract build(): Promise<ResultType>
  public abstract test(): Promise<ResultType>
  public abstract bench(): Promise<ResultType>
  public abstract clean(): Promise<ResultType>
  public abstract deps(): Promise<ResultType>

  protected async runCabal(extraArgs: string[] = []): Promise<ResultType> {
    return runCabalProcess(this.processName, this.cabalArgs.concat(extraArgs), this.spawnOpts, this.opts.opts)
  }

  protected getConfigOpt<K extends keyof GHCVerProps>(opt: K): GHCVerProps[K] {
    const map = {
      '7.2': atom.config.get('ide-haskell-cabal.cabal.ghc702'),
      '7.4': atom.config.get('ide-haskell-cabal.cabal.ghc704'),
      '7.6': atom.config.get('ide-haskell-cabal.cabal.ghc706'),
      '7.8': atom.config.get('ide-haskell-cabal.cabal.ghc708'),
      '7.10': atom.config.get('ide-haskell-cabal.cabal.ghc710'),
      '8.0': atom.config.get('ide-haskell-cabal.cabal.ghc800'),
    }
    return map[atom.config.get('ide-haskell-cabal.cabal.activeGhcVersion')][opt]
  }

  /* tslint:disable: no-string-literal */
  private getSpawnOpts() {
    // Setup default opts
    const opts = {
      cwd: this.opts.cabalRoot.getPath(),
      detached: true,
      env: {},
    }

    const env = { ...process.env }

    // tslint:disable-next-line: totality-check
    if (process.platform === 'win32') {
      const path: string[] = []
      const capMask = (str: string, mask: number) => {
        const a = str.split('')
        for (let i = 0; i < a.length; i++) {
          // tslint:disable-next-line: no-bitwise
          if (mask & Math.pow(2, i)) {
            a[i] = a[i].toUpperCase()
          }
        }
        return a.join('')
      }
      for (let m = 0b1111; m >= 0; m--) {
        const vn = capMask('path', m)
        const evn = env[vn]
        if (evn !== undefined) {
          path.push(evn)
        }
      }
      env['PATH'] = path.join(delimiter)
    }

    // set PATH depending on config settings
    const ghcPath = this.getConfigOpt('pathTo')
    if (this.getConfigOpt('pathExclusive')) {
      env['PATH'] = ghcPath.join(delimiter)
    } else if (ghcPath) {
      env['PATH'] = ghcPath.concat((env['PATH'] || '').split(delimiter)).join(delimiter)
    }

    // Set sandbox file (if specified)
    const sandboxConfig = this.getConfigOpt('sandbox')
    if (sandboxConfig !== '') {
      env['CABAL_SANDBOX_CONFIG'] = sandboxConfig
    }

    opts.env = env
    return opts
  }
  /* tslint:enable: no-string-literal */
}
