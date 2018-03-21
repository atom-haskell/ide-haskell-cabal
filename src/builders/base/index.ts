import { delimiter } from 'path'

import { CabalCommand, TargetParamTypeForBuilder } from '../../common'

import { runProcess, IParams } from './process'
import { Directory } from 'atom'
export { IParams }

export interface CtorOpts {
  opts: IParams
  target: TargetParamTypeForBuilder
  cabalRoot: Directory
}

export interface ResultType {
  exitCode: number | null
  hasError: boolean
}

export type Builder = Record<CabalCommand, () => Promise<ResultType>> & {
  runCommand(cmd: CabalCommand): Promise<ResultType>
}

const defaultGlobals = {
  process,
  runProcess,
}

export abstract class BuilderBase implements Builder {
  protected cabalArgs: string[]
  protected spawnOpts: {
    cwd: string
    detached: boolean
    env: { [key: string]: string | undefined }
  }
  private globals: typeof defaultGlobals

  constructor(
    private processName: string,
    protected opts: CtorOpts,
    globals: object = {},
  ) {
    this.globals = { ...defaultGlobals, ...globals }
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
    return this.globals.runProcess(
      this.processName,
      this.cabalArgs.concat(extraArgs),
      this.spawnOpts,
      this.opts.opts,
    )
  }

  protected additionalEnvSetup(env: typeof process.env): typeof process.env {
    return env
  }

  private getSpawnOpts() {
    // Setup default opts
    const opts = {
      cwd: this.opts.cabalRoot.getPath(),
      detached: true,
      env: {},
    }

    const env = { ...this.globals.process.env }

    // tslint:disable-next-line: totality-check
    if (this.globals.process.platform === 'win32') {
      const path = collectPathCapitalizations(env)
      env.PATH = path.join(delimiter)
    }

    opts.env = this.additionalEnvSetup(env)
    return opts
  }
}

export function collectPathCapitalizations(env: typeof process.env) {
  const path: string[] = []
  const capMask = (str: string, mask: number) => {
    const a = str.split('')
    for (let i = 0; i < a.length; i++) {
      // tslint:disable-next-line: no-bitwise
      if (mask & Math.pow(2, i)) {
        const j = a.length - i - 1
        a[j] = a[j].toUpperCase()
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
  return path
}
