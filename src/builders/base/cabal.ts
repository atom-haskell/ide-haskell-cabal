import { CtorOpts, BuilderBase } from './index'
import { delimiter } from 'path'
import { ConfigValues } from 'atom'
import child_process = require('child_process')

type GHCVerProps = ConfigValues['ide-haskell-cabal']['cabal']['ghc800']
type CabalVersion = { major: number; minor: number }

declare module 'atom' {
  interface Package {
    metadata: {
      version: string
    }
  }
}

export abstract class CabalBase extends BuilderBase {
  private static cabalVersionMap = new Map<string, CabalVersion>()
  protected versionPromise: Promise<CabalVersion>

  constructor(opts: CtorOpts, globals: object = {}) {
    super('cabal', opts, globals)
    this.versionPromise = this.getVersion()
  }

  protected additionalEnvSetup(env: typeof process.env) {
    const opts = getCabalOpts()
    const ghcPath = opts.pathTo
    if (opts.pathExclusive) {
      env.PATH = ghcPath.join(delimiter)
    } else if (ghcPath.length > 0) {
      env.PATH = ghcPath
        .concat((env.PATH || '').split(delimiter))
        .join(delimiter)
    }

    return env
  }

  protected component() {
    switch (this.opts.target.type) {
      case 'all':
        return this.opts.target.targets.map((x) => x.target)
      case 'component':
        return [this.opts.target.component]
      case 'auto':
        return []
    }
  }

  protected async withPrefix(
    cmd: string,
    { oldprefix, newprefix }: { oldprefix: string; newprefix: string },
  ) {
    const v = await this.versionPromise
    if (v.major > 2 || (v.major === 2 && v.minor >= 4)) {
      return `${newprefix}${cmd}`
    } else {
      return `${oldprefix}${cmd}`
    }
  }

  private async getVersion() {
    const spawnOpts = this.getSpawnOpts()
    const spawnOptsStr = JSON.stringify({
      path: spawnOpts.env.PATH,
    })
    const result = CabalBase.cabalVersionMap.get(spawnOptsStr)
    if (result) {
      return result
    } else {
      return new Promise<CabalVersion>((resolve) => {
        child_process.execFile(
          'cabal',
          ['--numeric-version'],
          spawnOpts,
          (error, stdout, stderr) => {
            if (error) {
              const title =
                'IDE-Haskell-Cabal failed to get cabal-install version. ' +
                'Assuming cabal-install < 2.4'
              const body = `<!-- Provide details about your environment here -->

<!-- Technical details below (please try to provide as much information as
  possible, but feel free to redact to avoid leaking personal information) -->
\`\`\`
Atom: ${atom.getVersion()}
OS: ${process.platform}
Released: ${atom.isReleasedVersion()}
IDE-Haskell-Cabal: ${
                atom.packages.getLoadedPackage('ide-haskell-cabal')?.metadata
                  .version
              }
IDE-Haskell: ${atom.packages.getLoadedPackage('ide-haskell')?.metadata.version}
Error Message: ${error.message}
Error Stack:
${error.stack}
Cabal output (if any):
${stderr.toString()}
PATH: ${spawnOpts.env.PATH}
System PATH: ${process.env.PATH}
\`\`\`
`
              const reportUrl =
                'https://github.com/atom-haskell/ide-haskell-cabal/issues/new' +
                `?title=${encodeURIComponent(title)}&body=${encodeURIComponent(
                  body,
                )}`
                  .replace(/\(/g, '%28')
                  .replace(/\)/g, '%29')
              atom.notifications.addError(title, {
                dismissable: true,
                description:
                  'IDE-Haskell-Cabal encountered the error above while ' +
                  'trying to query cabal-install version. Assuming ' +
                  "cabal-install < 2.4.0.0. If you're reasonably certain this is " +
                  'an issue with IDE-Haskell-Cabal, and not with your ' +
                  `setup, please [file a bug report](${reportUrl}).`,
                detail: error.message,
                stack: new Error().stack,
              })
              console.error(error)
              resolve({ major: 0, minor: 0 })
            } else {
              const versionraw = stdout
                .split('.')
                .slice(0, 2)
                .map((x) => parseInt(x, 10))
              const version = { major: versionraw[0], minor: versionraw[1] }
              CabalBase.cabalVersionMap.set(spawnOptsStr, version)
              resolve(version)
            }
          },
        )
      })
    }
  }
}

export function getCabalOpts(): GHCVerProps {
  const vers = atom.config.get('ide-haskell-cabal.cabal.activeGhcVersion')
  const [maj, min] = vers.split('.')
  const key = `ide-haskell-cabal.cabal.ghc${maj}${
    min.length === 1 ? `0${min}` : min
  }`
  return atom.config.get(key)
}
