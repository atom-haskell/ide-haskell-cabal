const ghcVerProps = {
  pathExclusive: {
    title: 'Replace PATH (rather than append to it)',
    type: 'boolean',
    default: false,
    order: 10,
  },

  pathTo: {
    type: 'array',
    title: 'PATH; comma-separated',
    default: [],
    order: 20,
  },

  sandbox: {
    type: 'string',
    title: 'Sandbox configuration file',
    default: '',
    order: 30,
  },

  buildDir: {
    type: 'string',
    title: 'Build directory',
    default: 'dist',
    order: 40,
  },
}

const ghcVersList = [
  '7.2',
  '7.4',
  '7.6',
  '7.8',
  '7.10',
  '8.0',
  '8.2',
  '8.4',
  '8.6',
]
const ghcVersProps = {}
for (const vers of ghcVersList) {
  const [maj, min] = vers.split('.')
  const key = `ghc${maj}${min.length === 1 ? `0${min}` : min}`
  ghcVersProps[key] = {
    type: 'object',
    title: `GHC ${vers}`,
    properties: ghcVerProps,
  }
}

export const config = {
  enableNixBuild: {
    description:
      'Enable technical preview for cabal new-build introduced ' +
      'with cabal-1.24. WARNING: this will break ghc-mod! Do not ' +
      'enable unless you know what you are doing!',
    type: 'boolean',
    default: false,
    order: 0,
  },
  stack: {
    type: 'object',
    properties: {
      globalArguments: {
        type: 'array',
        description: 'Global stack arguments (comma-separated)',
        default: [],
        order: 10,
      },
      buildArguments: {
        type: 'array',
        description: 'Stack build command arguments (comma-separated)',
        default: [],
        order: 20,
      },
      testArguments: {
        type: 'array',
        description: 'Stack test command arguments (comma-separated)',
        default: [],
        order: 30,
      },
      benchArguments: {
        type: 'array',
        description: 'Stack bench command arguments (comma-separated)',
        default: [],
        order: 30,
      },
      cleanArguments: {
        type: 'array',
        description: 'Stack clean command arguments (comma-separated)',
        default: [],
        order: 40,
      },
      depsArguments: {
        type: 'array',
        description:
          'Stack install --only-dependencies command arguments (comma-separated)',
        default: [],
        order: 50,
      },
    },
  },
  cabal: {
    type: 'object',
    properties: {
      ignoreNoSandbox: {
        type: 'boolean',
        title: 'Install dependencies with no sandbox',
        description:
          'Installing dependencies with no project sandbox is not ' +
          'recommended, but you can do it if you enable this option',
        default: false,
      },
      activeGhcVersion: {
        type: 'string',
        title: 'Active GHC version',
        default: '7.10',
        enum: ghcVersList,
      },
      ...ghcVersProps,
    },
  },
}

// generated by typed-config.js
declare module 'atom' {
  interface ConfigValues {
    'ide-haskell-cabal.enableNixBuild': boolean
    'ide-haskell-cabal.stack.globalArguments': any[]
    'ide-haskell-cabal.stack.buildArguments': any[]
    'ide-haskell-cabal.stack.testArguments': any[]
    'ide-haskell-cabal.stack.benchArguments': any[]
    'ide-haskell-cabal.stack.cleanArguments': any[]
    'ide-haskell-cabal.stack.depsArguments': any[]
    'ide-haskell-cabal.stack': {
      globalArguments: any[]
      buildArguments: any[]
      testArguments: any[]
      benchArguments: any[]
      cleanArguments: any[]
      depsArguments: any[]
    }
    'ide-haskell-cabal.cabal.ignoreNoSandbox': boolean
    'ide-haskell-cabal.cabal.activeGhcVersion':
      | '7.2'
      | '7.4'
      | '7.6'
      | '7.8'
      | '7.10'
      | '8.0'
      | '8.2'
      | '8.4'
      | '8.6'
    'ide-haskell-cabal.cabal.ghc702.pathExclusive': boolean
    'ide-haskell-cabal.cabal.ghc702.pathTo': any[]
    'ide-haskell-cabal.cabal.ghc702.sandbox': string
    'ide-haskell-cabal.cabal.ghc702.buildDir': string
    'ide-haskell-cabal.cabal.ghc702': {
      pathExclusive: boolean
      pathTo: any[]
      sandbox: string
      buildDir: string
    }
    'ide-haskell-cabal.cabal.ghc704.pathExclusive': boolean
    'ide-haskell-cabal.cabal.ghc704.pathTo': any[]
    'ide-haskell-cabal.cabal.ghc704.sandbox': string
    'ide-haskell-cabal.cabal.ghc704.buildDir': string
    'ide-haskell-cabal.cabal.ghc704': {
      pathExclusive: boolean
      pathTo: any[]
      sandbox: string
      buildDir: string
    }
    'ide-haskell-cabal.cabal.ghc706.pathExclusive': boolean
    'ide-haskell-cabal.cabal.ghc706.pathTo': any[]
    'ide-haskell-cabal.cabal.ghc706.sandbox': string
    'ide-haskell-cabal.cabal.ghc706.buildDir': string
    'ide-haskell-cabal.cabal.ghc706': {
      pathExclusive: boolean
      pathTo: any[]
      sandbox: string
      buildDir: string
    }
    'ide-haskell-cabal.cabal.ghc708.pathExclusive': boolean
    'ide-haskell-cabal.cabal.ghc708.pathTo': any[]
    'ide-haskell-cabal.cabal.ghc708.sandbox': string
    'ide-haskell-cabal.cabal.ghc708.buildDir': string
    'ide-haskell-cabal.cabal.ghc708': {
      pathExclusive: boolean
      pathTo: any[]
      sandbox: string
      buildDir: string
    }
    'ide-haskell-cabal.cabal.ghc710.pathExclusive': boolean
    'ide-haskell-cabal.cabal.ghc710.pathTo': any[]
    'ide-haskell-cabal.cabal.ghc710.sandbox': string
    'ide-haskell-cabal.cabal.ghc710.buildDir': string
    'ide-haskell-cabal.cabal.ghc710': {
      pathExclusive: boolean
      pathTo: any[]
      sandbox: string
      buildDir: string
    }
    'ide-haskell-cabal.cabal.ghc800.pathExclusive': boolean
    'ide-haskell-cabal.cabal.ghc800.pathTo': any[]
    'ide-haskell-cabal.cabal.ghc800.sandbox': string
    'ide-haskell-cabal.cabal.ghc800.buildDir': string
    'ide-haskell-cabal.cabal.ghc800': {
      pathExclusive: boolean
      pathTo: any[]
      sandbox: string
      buildDir: string
    }
    'ide-haskell-cabal.cabal.ghc802.pathExclusive': boolean
    'ide-haskell-cabal.cabal.ghc802.pathTo': any[]
    'ide-haskell-cabal.cabal.ghc802.sandbox': string
    'ide-haskell-cabal.cabal.ghc802.buildDir': string
    'ide-haskell-cabal.cabal.ghc802': {
      pathExclusive: boolean
      pathTo: any[]
      sandbox: string
      buildDir: string
    }
    'ide-haskell-cabal.cabal.ghc804.pathExclusive': boolean
    'ide-haskell-cabal.cabal.ghc804.pathTo': any[]
    'ide-haskell-cabal.cabal.ghc804.sandbox': string
    'ide-haskell-cabal.cabal.ghc804.buildDir': string
    'ide-haskell-cabal.cabal.ghc804': {
      pathExclusive: boolean
      pathTo: any[]
      sandbox: string
      buildDir: string
    }
    'ide-haskell-cabal.cabal.ghc806.pathExclusive': boolean
    'ide-haskell-cabal.cabal.ghc806.pathTo': any[]
    'ide-haskell-cabal.cabal.ghc806.sandbox': string
    'ide-haskell-cabal.cabal.ghc806.buildDir': string
    'ide-haskell-cabal.cabal.ghc806': {
      pathExclusive: boolean
      pathTo: any[]
      sandbox: string
      buildDir: string
    }
    'ide-haskell-cabal.cabal': {
      ignoreNoSandbox: boolean
      activeGhcVersion:
        | '7.2'
        | '7.4'
        | '7.6'
        | '7.8'
        | '7.10'
        | '8.0'
        | '8.2'
        | '8.4'
        | '8.6'
      'ghc702.pathExclusive': boolean
      'ghc702.pathTo': any[]
      'ghc702.sandbox': string
      'ghc702.buildDir': string
      ghc702: {
        pathExclusive: boolean
        pathTo: any[]
        sandbox: string
        buildDir: string
      }
      'ghc704.pathExclusive': boolean
      'ghc704.pathTo': any[]
      'ghc704.sandbox': string
      'ghc704.buildDir': string
      ghc704: {
        pathExclusive: boolean
        pathTo: any[]
        sandbox: string
        buildDir: string
      }
      'ghc706.pathExclusive': boolean
      'ghc706.pathTo': any[]
      'ghc706.sandbox': string
      'ghc706.buildDir': string
      ghc706: {
        pathExclusive: boolean
        pathTo: any[]
        sandbox: string
        buildDir: string
      }
      'ghc708.pathExclusive': boolean
      'ghc708.pathTo': any[]
      'ghc708.sandbox': string
      'ghc708.buildDir': string
      ghc708: {
        pathExclusive: boolean
        pathTo: any[]
        sandbox: string
        buildDir: string
      }
      'ghc710.pathExclusive': boolean
      'ghc710.pathTo': any[]
      'ghc710.sandbox': string
      'ghc710.buildDir': string
      ghc710: {
        pathExclusive: boolean
        pathTo: any[]
        sandbox: string
        buildDir: string
      }
      'ghc800.pathExclusive': boolean
      'ghc800.pathTo': any[]
      'ghc800.sandbox': string
      'ghc800.buildDir': string
      ghc800: {
        pathExclusive: boolean
        pathTo: any[]
        sandbox: string
        buildDir: string
      }
      'ghc802.pathExclusive': boolean
      'ghc802.pathTo': any[]
      'ghc802.sandbox': string
      'ghc802.buildDir': string
      ghc802: {
        pathExclusive: boolean
        pathTo: any[]
        sandbox: string
        buildDir: string
      }
      'ghc804.pathExclusive': boolean
      'ghc804.pathTo': any[]
      'ghc804.sandbox': string
      'ghc804.buildDir': string
      ghc804: {
        pathExclusive: boolean
        pathTo: any[]
        sandbox: string
        buildDir: string
      }
      'ghc806.pathExclusive': boolean
      'ghc806.pathTo': any[]
      'ghc806.sandbox': string
      'ghc806.buildDir': string
      ghc806: {
        pathExclusive: boolean
        pathTo: any[]
        sandbox: string
        buildDir: string
      }
    }
    'ide-haskell-cabal': {
      enableNixBuild: boolean
      'stack.globalArguments': any[]
      'stack.buildArguments': any[]
      'stack.testArguments': any[]
      'stack.benchArguments': any[]
      'stack.cleanArguments': any[]
      'stack.depsArguments': any[]
      stack: {
        globalArguments: any[]
        buildArguments: any[]
        testArguments: any[]
        benchArguments: any[]
        cleanArguments: any[]
        depsArguments: any[]
      }
      'cabal.ignoreNoSandbox': boolean
      'cabal.activeGhcVersion':
        | '7.2'
        | '7.4'
        | '7.6'
        | '7.8'
        | '7.10'
        | '8.0'
        | '8.2'
        | '8.4'
        | '8.6'
      'cabal.ghc702.pathExclusive': boolean
      'cabal.ghc702.pathTo': any[]
      'cabal.ghc702.sandbox': string
      'cabal.ghc702.buildDir': string
      'cabal.ghc702': {
        pathExclusive: boolean
        pathTo: any[]
        sandbox: string
        buildDir: string
      }
      'cabal.ghc704.pathExclusive': boolean
      'cabal.ghc704.pathTo': any[]
      'cabal.ghc704.sandbox': string
      'cabal.ghc704.buildDir': string
      'cabal.ghc704': {
        pathExclusive: boolean
        pathTo: any[]
        sandbox: string
        buildDir: string
      }
      'cabal.ghc706.pathExclusive': boolean
      'cabal.ghc706.pathTo': any[]
      'cabal.ghc706.sandbox': string
      'cabal.ghc706.buildDir': string
      'cabal.ghc706': {
        pathExclusive: boolean
        pathTo: any[]
        sandbox: string
        buildDir: string
      }
      'cabal.ghc708.pathExclusive': boolean
      'cabal.ghc708.pathTo': any[]
      'cabal.ghc708.sandbox': string
      'cabal.ghc708.buildDir': string
      'cabal.ghc708': {
        pathExclusive: boolean
        pathTo: any[]
        sandbox: string
        buildDir: string
      }
      'cabal.ghc710.pathExclusive': boolean
      'cabal.ghc710.pathTo': any[]
      'cabal.ghc710.sandbox': string
      'cabal.ghc710.buildDir': string
      'cabal.ghc710': {
        pathExclusive: boolean
        pathTo: any[]
        sandbox: string
        buildDir: string
      }
      'cabal.ghc800.pathExclusive': boolean
      'cabal.ghc800.pathTo': any[]
      'cabal.ghc800.sandbox': string
      'cabal.ghc800.buildDir': string
      'cabal.ghc800': {
        pathExclusive: boolean
        pathTo: any[]
        sandbox: string
        buildDir: string
      }
      'cabal.ghc802.pathExclusive': boolean
      'cabal.ghc802.pathTo': any[]
      'cabal.ghc802.sandbox': string
      'cabal.ghc802.buildDir': string
      'cabal.ghc802': {
        pathExclusive: boolean
        pathTo: any[]
        sandbox: string
        buildDir: string
      }
      'cabal.ghc804.pathExclusive': boolean
      'cabal.ghc804.pathTo': any[]
      'cabal.ghc804.sandbox': string
      'cabal.ghc804.buildDir': string
      'cabal.ghc804': {
        pathExclusive: boolean
        pathTo: any[]
        sandbox: string
        buildDir: string
      }
      'cabal.ghc806.pathExclusive': boolean
      'cabal.ghc806.pathTo': any[]
      'cabal.ghc806.sandbox': string
      'cabal.ghc806.buildDir': string
      'cabal.ghc806': {
        pathExclusive: boolean
        pathTo: any[]
        sandbox: string
        buildDir: string
      }
      cabal: {
        ignoreNoSandbox: boolean
        activeGhcVersion:
          | '7.2'
          | '7.4'
          | '7.6'
          | '7.8'
          | '7.10'
          | '8.0'
          | '8.2'
          | '8.4'
          | '8.6'
        'ghc702.pathExclusive': boolean
        'ghc702.pathTo': any[]
        'ghc702.sandbox': string
        'ghc702.buildDir': string
        ghc702: {
          pathExclusive: boolean
          pathTo: any[]
          sandbox: string
          buildDir: string
        }
        'ghc704.pathExclusive': boolean
        'ghc704.pathTo': any[]
        'ghc704.sandbox': string
        'ghc704.buildDir': string
        ghc704: {
          pathExclusive: boolean
          pathTo: any[]
          sandbox: string
          buildDir: string
        }
        'ghc706.pathExclusive': boolean
        'ghc706.pathTo': any[]
        'ghc706.sandbox': string
        'ghc706.buildDir': string
        ghc706: {
          pathExclusive: boolean
          pathTo: any[]
          sandbox: string
          buildDir: string
        }
        'ghc708.pathExclusive': boolean
        'ghc708.pathTo': any[]
        'ghc708.sandbox': string
        'ghc708.buildDir': string
        ghc708: {
          pathExclusive: boolean
          pathTo: any[]
          sandbox: string
          buildDir: string
        }
        'ghc710.pathExclusive': boolean
        'ghc710.pathTo': any[]
        'ghc710.sandbox': string
        'ghc710.buildDir': string
        ghc710: {
          pathExclusive: boolean
          pathTo: any[]
          sandbox: string
          buildDir: string
        }
        'ghc800.pathExclusive': boolean
        'ghc800.pathTo': any[]
        'ghc800.sandbox': string
        'ghc800.buildDir': string
        ghc800: {
          pathExclusive: boolean
          pathTo: any[]
          sandbox: string
          buildDir: string
        }
        'ghc802.pathExclusive': boolean
        'ghc802.pathTo': any[]
        'ghc802.sandbox': string
        'ghc802.buildDir': string
        ghc802: {
          pathExclusive: boolean
          pathTo: any[]
          sandbox: string
          buildDir: string
        }
        'ghc804.pathExclusive': boolean
        'ghc804.pathTo': any[]
        'ghc804.sandbox': string
        'ghc804.buildDir': string
        ghc804: {
          pathExclusive: boolean
          pathTo: any[]
          sandbox: string
          buildDir: string
        }
        'ghc806.pathExclusive': boolean
        'ghc806.pathTo': any[]
        'ghc806.sandbox': string
        'ghc806.buildDir': string
        ghc806: {
          pathExclusive: boolean
          pathTo: any[]
          sandbox: string
          buildDir: string
        }
      }
    }
  }
}
