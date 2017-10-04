declare interface GHCVerProps {
  pathExclusive: boolean
  pathTo: string[]
  sandbox: string
  buildDir: string
}

declare namespace AtomTypes {
  interface ConfigInterface {
    'ide-haskell-cabal.enableNixBuild': boolean
    'ide-haskell-cabal.cabal.activeGhcVersion': '7.2' | '7.4' | '7.6' | '7.8' | '7.10' | '8.0'
    'ide-haskell-cabal.cabal.ignoreNoSandbox': 'boolean'
    'ide-haskell-cabal.cabal.ghc702': GHCVerProps
    'ide-haskell-cabal.cabal.ghc704': GHCVerProps
    'ide-haskell-cabal.cabal.ghc706': GHCVerProps
    'ide-haskell-cabal.cabal.ghc708': GHCVerProps
    'ide-haskell-cabal.cabal.ghc710': GHCVerProps
    'ide-haskell-cabal.cabal.ghc800': GHCVerProps
    'ide-haskell-cabal.stack.globalArguments': string[]
    'ide-haskell-cabal.stack.buildArguments': string[]
    'ide-haskell-cabal.stack.testArguments': string[]
    'ide-haskell-cabal.stack.benchArguments': string[]
    'ide-haskell-cabal.stack.cleanArguments': string[]
    'ide-haskell-cabal.stack.depsArguments': string[]
  }
}
