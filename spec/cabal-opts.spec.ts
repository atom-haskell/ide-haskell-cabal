import { expect } from 'chai'
import { join } from 'path'
import { getCabalOpts } from '../src/builders/base/cabal'
import { Package } from 'atom'

const pkgDir = join(__dirname, '..')

describe('cabalOpts', function() {
  let pkg: Package
  before(async () => {
    pkg = await atom.packages.activatePackage(pkgDir)
  })
  after(async () => atom.packages.deactivatePackage(pkg.name))

  it('should work', async () => {
    const opts = getCabalOpts()
    expect(opts).not.to.be.undefined
    expect(opts.pathTo).not.to.be.undefined
  })

  it('should change depending on activeGhcVersion', async () => {
    atom.config.set('ide-haskell-cabal.cabal.activeGhcVersion', '8.0')
    atom.config.set('ide-haskell-cabal.cabal.ghc800.pathTo', [
      '/path/to/ghc800',
    ])
    atom.config.set('ide-haskell-cabal.cabal.ghc802.pathTo', [
      '/path/to/ghc802',
    ])
    expect(getCabalOpts().pathTo).to.deep.equal(['/path/to/ghc800'])

    atom.config.set('ide-haskell-cabal.cabal.activeGhcVersion', '8.2')
    expect(getCabalOpts().pathTo).to.deep.equal(['/path/to/ghc802'])
  })
})
