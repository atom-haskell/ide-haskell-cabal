import { expect } from 'chai'
import { collectPathCapitalizations } from '../src/builders/base'

describe('collectPathCapitalizations', function() {
  it('should work', async () => {
    const env = {
      PATH: 'PATH',
      Path: 'Path',
      pAtH: 'pAtH',
      path: 'path',
    }
    const collected = collectPathCapitalizations(env)
    expect(collected).to.deep.equal(Object.values(env))
  })
})
