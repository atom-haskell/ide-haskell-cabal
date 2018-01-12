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
        enum: ['7.2', '7.4', '7.6', '7.8', '7.10', '8.0'],
      },
      ghc702: {
        type: 'object',
        title: 'GHC 7.2',
        properties: ghcVerProps,
      },
      ghc704: {
        type: 'object',
        title: 'GHC 7.4',
        properties: ghcVerProps,
      },
      ghc706: {
        type: 'object',
        title: 'GHC 7.6',
        properties: ghcVerProps,
      },
      ghc708: {
        type: 'object',
        title: 'GHC 7.8',
        properties: ghcVerProps,
      },
      ghc710: {
        type: 'object',
        title: 'GHC 7.10',
        properties: ghcVerProps,
      },
      ghc800: {
        type: 'object',
        title: 'GHC 8.0',
        properties: ghcVerProps,
      },
    },
  },
}
