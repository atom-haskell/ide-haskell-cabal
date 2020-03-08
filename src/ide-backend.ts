import * as path from 'path'
import { File, CompositeDisposable, Disposable, Directory } from 'atom'
import * as Builders from './builders'
import * as Util from 'atom-haskell-utils'
import {
  TargetParamType,
  CabalCommand,
  TargetParamTypeForBuilder,
} from './common'
import * as UPI from 'atom-haskell-upi'

interface BuilderParamType {
  name: 'cabal-v1' | 'cabal-v2' | 'stack' | 'none'
}

function isCabalFile(file?: File | Directory): file is File {
  return !!(file && file.isFile() && file.getBaseName().endsWith('.cabal'))
}

interface ICommandOptions {
  messageTypes: UPI.TSeverity[]
  defaultSeverity: UPI.TSeverity
  canCancel: boolean
}

interface BuilderConstructor {
  new (opts: Builders.CtorOpts): Builders.Builder
}

type TBuilders = Record<
  BuilderParamType['name'],
  BuilderConstructor | undefined
>

const commandOptions: { [K in CabalCommand]: ICommandOptions } = {
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
    'ide-haskell-cabal:set-build-target': async () => {
      await this.upi.setConfigParam('target')
    },
    'ide-haskell-cabal:set-active-builder': async () => {
      await this.upi.setConfigParam('builder')
    },
  }
  private menu = [
    { label: 'Build Project', command: 'ide-haskell-cabal:build' },
    { label: 'Clean Project', command: 'ide-haskell-cabal:clean' },
    { label: 'Test', command: 'ide-haskell-cabal:test' },
    { label: 'Bench', command: 'ide-haskell-cabal:bench' },
    { label: 'Build Dependencies', command: 'ide-haskell-cabal:deps' },
    {
      label: 'Set Active Builder',
      command: 'ide-haskell-cabal:set-active-builder',
    },
    {
      label: 'Set Build Target',
      command: 'ide-haskell-cabal:set-build-target',
    },
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
      ret[`ide-haskell-cabal:${cmd}`] = async () => this.runCabalCommand(cmd)
    }
    return ret
  }

  private builderParamInfo(): UPI.IParamSpec<BuilderParamType> {
    return {
      items: (): BuilderParamType[] => {
        const builders: BuilderParamType[] = [
          { name: 'cabal-v1' },
          { name: 'cabal-v2' },
          { name: 'stack' },
          { name: 'none' },
        ]
        return builders
      },
      itemTemplate: (item: BuilderParamType) =>
        `<li><div class='name'>${item.name}</div></li>`,
      displayTemplate: (item?: BuilderParamType) =>
        item && item.name ? item.name : 'Not set',
      itemFilterKey: 'name',
      description: 'Select builder to use with current project',
    }
  }

  private targetParamInfo(): UPI.IParamSpec<TargetParamType> {
    const defaultVal: TargetParamType = {
      project: 'Auto',
      type: 'auto',
      dir: undefined,
    }
    return {
      default: defaultVal,
      items: async (): Promise<TargetParamType[]> => {
        const projects: TargetParamType[] = [defaultVal]
        for (const d of atom.project.getDirectories()) {
          const dir = d.getPath()
          const [cabalFile] = (await Util.getRootDir(dir))
            .getEntriesSync()
            .filter(isCabalFile)
          if (cabalFile && cabalFile.isFile()) {
            const data = await cabalFile.read()
            if (data === null) {
              throw new Error(`Could not read cabalfile ${cabalFile.getPath()}`)
            }
            const project = await Util.parseDotCabal(data)
            if (project) {
              projects.push({ project: project.name, dir, type: 'auto' })
              projects.push({ project: project.name, dir, type: 'all' })
              for (const target of project.targets) {
                projects.push({
                  project: project.name,
                  dir,
                  type: 'component',
                  target,
                  component: target.target,
                })
              }
            }
          }
        }
        return projects
      },
      itemTemplate: (tgt: TargetParamType) => {
        let desc: string
        switch (tgt.type) {
          case 'auto':
            desc = `<div class='name'>Auto</div>`
            break
          case 'all':
            desc = `<div class='name'>All</div>`
            break
          case 'component':
            desc = `
            <div class='type'>${tgt.target.type}</div>
            <div class='name'>${tgt.target.name}</div>
            `
            break
        }
        // tslint:disable:no-non-null-assertion
        return `<li>
          <div class='project'>${tgt.project}</div>
          <div class='dir'>${tgt.dir || ''}</div>
          ${desc!}
          <div class='clearfix'></div>
        </li>`
        // tslint:enable:no-non-null-assertion
      },
      displayTemplate: (item?: TargetParamType) => {
        if (!item) return 'undefined'
        if (!item.dir) {
          return item.project
        } else {
          let target: string
          switch (item.type) {
            case 'auto':
              target = 'Auto'
              break
            case 'all':
              target = 'All'
              break
            case 'component':
              target = item.target.name
              break
          }
          // tslint:disable-next-line:no-non-null-assertion
          return `${item.project}: ${target!}`
        }
      },
      itemFilterKey: 'name',
      description: 'Select target to build',
    }
  }

  private getActiveProjectPath(): string {
    const editor = atom.workspace.getActiveTextEditor()
    if (editor) {
      const edpath = editor.getPath()
      if (edpath) {
        return path.dirname(edpath)
      }
    }
    return atom.project.getPaths()[0] || process.cwd()
  }

  private async getActiveProjectTarget(
    cabalfile: string,
    cabalRoot: Directory,
  ): Promise<string[]> {
    const editor = atom.workspace.getActiveTextEditor()
    if (editor) {
      const edpath = editor.getPath()
      if (edpath) {
        const res = await Util.getComponentFromFile(
          cabalfile,
          cabalRoot.relativize(edpath),
        )
        if (res) return res
        else return []
      }
    }
    // default
    return []
  }

  private async cabalBuild(
    cmd: CabalCommand,
    params: Builders.IParams,
  ): Promise<void> {
    try {
      if (this.running) {
        this.upi.setStatus({
          status: 'warning',
          detail: 'Builder already running',
        })
        return
      }
      this.running = true

      const builderParam = await this.upi.getConfigParam<BuilderParamType>(
        'builder',
      )
      const target = await this.upi.getConfigParam<TargetParamType>('target')

      if (target === undefined) {
        throw new Error('Target undefined')
      }
      if (builderParam === undefined) {
        throw new Error('Builder undefined')
      }
      if ((builderParam.name as string) === 'cabal') {
        builderParam.name = 'cabal-v1'
        await this.upi.setConfigParam<BuilderParamType>('builder', builderParam)
      } else if ((builderParam.name as string) === 'cabal-nix') {
        builderParam.name = 'cabal-v2'
        await this.upi.setConfigParam<BuilderParamType>('builder', builderParam)
      }

      this.upi.setStatus({
        status: 'progress',
        progress: params.onProgress ? 0.0 : undefined,
        detail: '',
      })

      const cabalRoot = await Util.getRootDir(
        target.dir ? target.dir : this.getActiveProjectPath(),
      )

      const [cabalFile]: File[] = cabalRoot.getEntriesSync().filter(isCabalFile)

      if (!cabalFile) {
        throw new Error('No cabal file found')
      }

      let newTarget: TargetParamTypeForBuilder | undefined

      if (target.type === 'auto') {
        const cabalContents = await cabalFile.read()
        if (cabalContents === null) {
          throw new Error(`Could not read cabalfile ${cabalFile.getPath()}`)
        }
        const tgts = await this.getActiveProjectTarget(cabalContents, cabalRoot)
        const [tgt] = tgts
        if (tgt) {
          const cf = await Util.parseDotCabal(cabalContents)
          if (cf) {
            newTarget = {
              project: cf.name,
              dir: cabalRoot.getPath(),
              type: 'component',
              component: tgt,
            }
          }
        }
      } else if (target.type === 'all') {
        const cabalContents = await cabalFile.read()
        if (cabalContents === null) {
          throw new Error(`Could not read cabalfile ${cabalFile.getPath()}`)
        }
        const cf = await Util.parseDotCabal(cabalContents)
        if (cf) {
          newTarget = newTarget = {
            project: cf.name,
            dir: cabalRoot.getPath(),
            type: 'all',
            targets: cf.targets,
          }
        }
      } else if (target.type === 'component') {
        const { project, dir, component } = target
        newTarget = { type: 'component', project, dir, component }
      }
      if (!newTarget) {
        newTarget = {
          type: 'auto',
          project: target.project,
          dir: target.dir,
        }
      }
      const builders: TBuilders = {
        'cabal-v1': Builders.CabalV1,
        'cabal-v2': Builders.CabalV2,
        stack: Builders.Stack,
        none: Builders.None,
      }
      const builder = builders[builderParam.name]

      if (builder === undefined) {
        throw new Error(
          `Unknown builder '${(builderParam && builderParam.name) ||
            builderParam}'`,
        )
      }

      const res = await new builder({
        params,
        target: newTarget,
        cabalRoot,
      }).runCommand(cmd)
      // see CabalProcess for explaination
      // tslint:disable-next-line: no-null-keyword
      if (res.exitCode === null) {
        // this means process was killed
        this.upi.setStatus({
          status: 'warning',
          detail: 'Build was interrupted',
        })
      } else if (res.exitCode !== 0) {
        if (res.hasError) {
          this.upi.setStatus({
            status: 'warning',
            detail: 'There were errors in source files',
          })
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
        // tslint:disable-next-line: no-unsafe-any
        this.upi.setStatus({ status: 'error', detail: error.toString() })
      } else {
        this.upi.setStatus({
          status: 'warning',
          detail: 'Build failed with no errors',
        })
      }
    }
    this.running = false
  }

  private async runCabalCommand(command: CabalCommand): Promise<void> {
    const { messageTypes, defaultSeverity, canCancel } = commandOptions[command]
    const messages: UPI.IResultItem[] = []
    this.upi.setMessages(messages)

    let cancelActionDisp: Disposable | undefined

    await this.cabalBuild(command, {
      severity: defaultSeverity,
      setCancelAction: canCancel
        ? (action: () => void) => {
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
          }
        : undefined,
      onMsg: (message: UPI.IResultItem) => {
        if (messageTypes.includes(message.severity)) {
          messages.push(message)
          this.upi.setMessages(messages)
        }
      },
      onProgress: canCancel
        ? (progress: number) =>
            this.upi.setStatus({
              status: 'progress',
              progress,
              detail: `${command} in progress`,
            })
        : undefined,
    })
    cancelActionDisp && cancelActionDisp.dispose()
  }
}
