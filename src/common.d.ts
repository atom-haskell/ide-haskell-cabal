import * as Util from 'atom-haskell-utils'

export interface TargetParamType {
  project: string
  target: Util.ITarget | undefined
  dir: string | undefined
  component: string | undefined
}
export type CabalCommand = 'build' | 'clean' | 'test' | 'bench' | 'deps'
