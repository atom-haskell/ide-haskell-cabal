import { expect } from 'chai'
import { BuilderBase, CtorOpts } from '../src/builders/base'
import { Directory } from 'atom'
import { delimiter } from 'path'

class BuilderMock extends BuilderBase {
  private mockResult = { exitCode: 0, hasError: false }
  constructor(
    opts: CtorOpts,
    env: object = {
      PATH: 'PATH',
    },
    platform = 'unix',
  ) {
    super('mock', opts, {
      process: { env, platform },
      runProcess: (command: any, args: any, spawn: any, opts1: any) => {
        expect(command).to.equal('mock')
        expect(args).to.deep.equal(['extra', 'args'])
        expect(spawn).to.deep.equal(this.getSpawnOpts())
        expect(opts1).to.deep.equal(this.opts.params)
      },
    })
  }

  public spawnOptsTest() {
    return this.getSpawnOpts()
  }

  public async run() {
    return this.runCabal(['extra', 'args'])
  }

  public async build() {
    return this.mockResult
  }
  public async test() {
    return this.mockResult
  }
  public async deps() {
    return this.mockResult
  }
  public async clean() {
    return this.mockResult
  }
  public async bench() {
    return this.mockResult
  }
}

describe('BuilderBase', function() {
  describe('construction', () => {
    it('should construct and set spawnOpts', async () => {
      const builder = new BuilderMock({
        params: { severity: 'build' },
        target: { type: 'auto', project: 'All', dir: undefined },
        cabalRoot: new Directory('/cabal/root'),
      })
      expect(builder.spawnOptsTest()).to.deep.equal({
        cwd: '/cabal/root',
        detached: true,
        env: {
          PATH: 'PATH',
        },
      })
    })
    it('sets PATH correctly on win32', async () => {
      const builder = new BuilderMock(
        {
          params: { severity: 'build' },
          target: { type: 'auto', project: 'All', dir: undefined },
          cabalRoot: new Directory('/cabal/root'),
        },
        {
          PATH: 'PATH',
          Path: 'Path',
        },
        'win32',
      )
      expect(builder.spawnOptsTest().env.PATH).to.deep.equal(
        ['PATH', 'Path'].join(delimiter),
      )
    })
    it('does not honor non-capitalized PATH on non-win32', async () => {
      const builder = new BuilderMock(
        {
          params: { severity: 'build' },
          target: { type: 'auto', project: 'All', dir: undefined },
          cabalRoot: new Directory('/cabal/root'),
        },
        {
          PATH: 'PATH',
          Path: 'Path',
        },
        'darwin',
      )
      expect(builder.spawnOptsTest().env.PATH).to.deep.equal('PATH')
    })
  })
  describe('runCabal', () => {
    it('should call runProcess', async () => {
      const builder = new BuilderMock({
        params: { severity: 'build' },
        target: { type: 'auto', project: 'All', dir: undefined },
        cabalRoot: new Directory('/cabal/root'),
      })
      await builder.run()
    })
  })
})
