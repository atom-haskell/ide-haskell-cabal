import * as path from 'path'
import { CompositeDisposable } from 'atom'
import * as Builders from './builders'
import * as Util from 'atom-haskell-utils'
import { TargetParamType, CabalCommand } from './common'

interface BuilderParamType { name: string }

function isCabalFile(file?: AtomTypes.File | AtomTypes.Directory): file is AtomTypes.File {
  return !!(file && file.isFile() && file.getBaseName().endsWith('.cabal'))
}

interface ICommandOptions {
  messageTypes: UPI.TSeverity[]
  defaultSeverity: UPI.TSeverity
  canCancel: boolean
}

type TBuilders = {
  [k: string]:
  typeof Builders.CabalNix |
  typeof Builders.Cabal |
  typeof Builders.Stack |
  typeof Builders.None |
  undefined
}

const commandOptions: {[K in CabalCommand]: ICommandOptions} = {
  build: {
    messageTypes: ['error', 'warning', 'build'],
    defaultSeverity: 'build',
    canCancel: true,
  },
  clean: {
    messageTypes: ['build'],
    defaultSeverity: 'build',
    canCancel: false,
  },
  test: {
    messageTypes: ['error', 'warning', 'build', 'test'],
    defaultSeverity: 'test',
    canCancel: true,
  },
  bench: {
    messageTypes: ['error', 'warning', 'build', 'test'],
    defaultSeverity: 'test',
    canCancel: true,
  },
  deps: {
    messageTypes: ['build'],
    defaultSeverity: 'build',
    canCancel: true,
  },
}

export class IdeBackend {
  private disposables: CompositeDisposable
  private upi: UPI.IUPIInstance
  private running: boolean = false
  private commands = {
    ...this.cabalCommands(),
    'ide-haskell-cabal:set-build-target': async () =>
      this.upi.setConfigParam('target'),
    'ide-haskell-cabal:set-active-builder': async () =>
      this.upi.setConfigParam('builder'),
  }
  private menu = [
    { label: 'Build Project', command: 'ide-haskell-cabal:build' },
    { label: 'Clean Project', command: 'ide-haskell-cabal:clean' },
    { label: 'Test', command: 'ide-haskell-cabal:test' },
    { label: 'Bench', command: 'ide-haskell-cabal:bench' },
    { label: 'Build Dependencies', command: 'ide-haskell-cabal:deps' },
    { label: 'Set Active Builder', command: 'ide-haskell-cabal:set-active-builder' },
    { label: 'Set Build Target', command: 'ide-haskell-cabal:set-build-target' },
  ]
  constructor(reg: UPI.IUPIRegistration) {
    this.upi = reg({
      name: 'ide-haskell-cabal',
      messageTypes: {
        error: {},
        warning: {},
        build: {
          uriFilter: false,
          autoScroll: true,
        },
        test: {
          uriFilter: false,
          autoScroll: true,
        },
      },
      menu: {
        label: 'Builder',
        menu: this.menu,
      },
      params: {
        builder: this.builderParamInfo(),
        target: this.targetParamInfo(),
      },
    })

    this.disposables = new CompositeDisposable()

    this.disposables.add(atom.commands.add('atom-workspace', this.commands))
    this.disposables.add(this.upi)
  }

  public destroy() {
    this.disposables.dispose()
  }

  private cabalCommands() {
    const ret = {}
    for (const cmd of Object.keys(commandOptions)) {
      ret[`ide-haskell-cabal:${cmd}`] = async () =>
        this.runCabalCommand(cmd)
    }
    return ret
  }

  private builderParamInfo(): UPI.IParamSpec<BuilderParamType> {
    return {
      items: (): BuilderParamType[] => {
        const builders = [{ name: 'cabal' }, { name: 'stack' }]
        if (atom.config.get('ide-haskell-cabal.enableNixBuild')) {
          builders.push({ name: 'cabal-nix' })
        }
        builders.push({ name: 'none' })
        return builders
      },
      itemTemplate: (item: BuilderParamType) => `<li><div class='name'>${item.name}</div></li>`,
      displayTemplate: (item?: BuilderParamType) => item && item.name ? item.name : 'Not set',
      itemFilterKey: 'name',
      description: 'Select builder to use with current project',
    }
  }

  private targetParamInfo(): UPI.IParamSpec<TargetParamType> {
    const defaultVal = {
      project: 'Auto',
      component: undefined,
      dir: undefined,
      target: undefined,
    }
    return {
      default: defaultVal,
      items: async (): Promise<TargetParamType[]> => {
        const projects: TargetParamType[] = [defaultVal]
        for (const d of atom.project.getDirectories()) {
          const dir = d.getPath()
          const [cabalFile] = (await Util.getRootDir(dir)).getEntriesSync().filter(isCabalFile)
          if (cabalFile && cabalFile.isFile()) {
            const data = await cabalFile.read()
            const project = await Util.parseDotCabal(data)
            if (project) {
              projects.push({ project: project.name, dir, component: undefined, target: undefined })
              for (const target of project.targets) {
                projects.push({ project: project.name, dir, target, component: target.target })
              }
            }
          }
        }
        return projects
      },
      itemTemplate: (tgt: TargetParamType) =>
        `<li>
          <div class='project'>${tgt.project}</div>
          <div class='dir'>${tgt.dir || ''}</div>
          ${
        tgt.target ?
          `
            <div class='type'>${tgt.target.type}</div>
            <div class='name'>${tgt.target.name}</div>
            ` :
          `<div class='name'>${'All'}</div>`
        }
          <div class='clearfix'></div>
        </li>`,
      displayTemplate: (item?: TargetParamType) => {
        if (!item) return 'undefined'
        if (!item.dir) {
          return item.project
        } else {
          return `${item.project}: ${item.target ? item.target.name : 'All'}`
        }
      },
      itemFilterKey: 'name',
      description: 'Select target to build',
    }
  }

  private getActiveProjectPath(): string {
    const editor = atom.workspace.getActiveTextEditor()
    if (editor && editor.getPath()) {
      return path.dirname(editor.getPath())
    } else {
      return atom.project.getPaths()[0] || process.cwd()
    }
  }

  private async getActiveProjectTarget(cabalfile: string, cabalRoot: AtomTypes.Directory) {
    const editor = atom.workspace.getActiveTextEditor()
    if (editor && editor.getPath()) {
      return Util.getComponentFromFile(cabalfile, cabalRoot.relativize(editor.getPath()))
    } else {
      return []
    }
  }

  private async cabalBuild(cmd: CabalCommand, opts: Builders.IParams): Promise<void> {
    try {
      if (this.running) {
        this.upi.setStatus({ status: 'warning', detail: 'Builder already running' })
        return
      }
      this.running = true

      const builderParam = await this.upi.getConfigParam<BuilderParamType>('builder')
      const target = await this.upi.getConfigParam<TargetParamType>('target')

      if (target === undefined) { throw new Error('Target undefined') }
      if (builderParam === undefined) { throw new Error('Builder undefined') }

      this.upi.setStatus({
        status: 'progress',
        progress: opts.onProgress ? 0.0 : undefined,
        detail: '',
      })

      const cabalRoot = await Util.getRootDir(target.dir ? target.dir : this.getActiveProjectPath())

      const [cabalFile]: AtomTypes.File[] = cabalRoot.getEntriesSync().filter(isCabalFile)

      if (!cabalFile) { throw new Error('No cabal file found') }

      let newTarget = { ...target }

      if (!newTarget.target && ['build', 'deps'].includes(cmd)) {
        const cabalContents = await cabalFile.read()
        const tgts = await this.getActiveProjectTarget(cabalContents, cabalRoot)
        const [tgt] = tgts
        if (tgt) {
          const cf = await Util.parseDotCabal(cabalContents)
          if (cf) {
            newTarget = {
              project: cf.name,
              component: tgt,
              dir: cabalRoot.getPath(),
              target: undefined,
            }
          }
        }
      }
      const builders: TBuilders = {
        'cabal-nix': Builders.CabalNix,
        'cabal': Builders.Cabal,
        'stack': Builders.Stack,
        'none': Builders.None,
      }
      const builder = builders[builderParam.name]

      if (builder === undefined) {
        throw new Error(`Unknown builder '${(builderParam && builderParam.name) || builderParam}'`)
      }

      const res = await (new builder({ opts, target, cabalRoot })).runCommand(cmd)
      // see CabalProcess for explaination
      // tslint:disable-next-line: no-null-keyword
      if (res.exitCode === null) { // this means process was killed
        this.upi.setStatus({ status: 'warning', detail: 'Build was interrupted' })
      } else if (res.exitCode !== 0) {
        if (res.hasError) {
          this.upi.setStatus({ status: 'warning', detail: 'There were errors in source files' })
        } else {
          this.upi.setStatus({
            status: 'error',
            detail: `Builder quit abnormally with exit code ${res.exitCode}`,
          })
        }
      } else {
        this.upi.setStatus({ status: 'ready', detail: 'Build was successful' })
      }
    } catch (error) {
      if (error) {
        // tslint:disable-next-line: no-console
        console.error(error)
        this.upi.setStatus({ status: 'error', detail: error.toString() })
      } else {
        this.upi.setStatus({ status: 'warning', detail: 'Build failed with no errors' })
      }
    }
    this.running = false
  }

  private async runCabalCommand(command: CabalCommand): Promise<void> {
    const { messageTypes, defaultSeverity, canCancel } = commandOptions[command]
    const messages: UPI.IResultItem[] = []
    this.upi.setMessages(messages)

    let cancelActionDisp: AtomTypes.Disposable | undefined

    await this.cabalBuild(command, {
      severity: defaultSeverity,
      setCancelAction:
      canCancel ?
        (action: () => void) => {
          cancelActionDisp && cancelActionDisp.dispose()
          cancelActionDisp = this.upi.addPanelControl({
            element: 'ide-haskell-button',
            opts: {
              classes: ['cancel'],
              events: {
                click: action,
              },
            },
          })
        } : undefined,
      onMsg: (message: UPI.IResultItem) => {
        if (messageTypes.includes(message.severity)) {
          messages.push(message)
          this.upi.setMessages(messages)
        }
      },
      onProgress:
      canCancel
        ? (progress: number) => this.upi.setStatus({ status: 'progress', progress, detail: `${command} in progress` })
        : undefined,
    })
    cancelActionDisp && cancelActionDisp.dispose()
  }
}
