import * as Util from 'atom-haskell-utils'

export interface ProjectDesc {
  project: string
  dir: string | undefined
}
export type TargetParamType = (
  | {
      type: 'component'
      target: Util.ITarget
      component: string
    }
  | {
      type: 'all'
    }
  | {
      type: 'auto'
    }
) &
  ProjectDesc
export type TargetParamTypeForBuilder = (
  | {
      type: 'component'
      component: string
    }
  | {
      type: 'all'
      targets: Util.ITarget[]
    }
  | {
      type: 'auto'
    }
) &
  ProjectDesc
export type CabalCommand = 'build' | 'clean' | 'test' | 'bench' | 'deps'
