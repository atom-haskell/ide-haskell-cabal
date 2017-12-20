import * as Util from 'atom-haskell-utils'

export type TargetDesc = {
  type: 'component'
  target: Util.ITarget
  component: string
} | {
  type: 'all'
  targets: Util.ITarget[]
} | {
  type: 'auto'
}
export type TargetParamType = {
  project: string
  dir: string | undefined
} & TargetDesc
export type TargetParamTypePartial = {
  project: string
  dir: string | undefined
} & (TargetDesc | {
  type: 'component'
  component: string
})
export type CabalCommand = 'build' | 'clean' | 'test' | 'bench' | 'deps'
