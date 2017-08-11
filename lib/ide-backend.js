"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const atom_1 = require("atom");
const Builders = require("./builders");
const Util = require("atom-haskell-utils");
function isCabalFile(file) {
    return !!(file && file.isFile() && file.getBaseName().endsWith('.cabal'));
}
const commandOptions = {
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
};
class IdeBackend {
    constructor(reg) {
        this.running = false;
        this.commands = Object.assign({}, this.cabalCommands(), { 'ide-haskell-cabal:set-build-target': () => __awaiter(this, void 0, void 0, function* () { return this.upi.setConfigParam('target'); }), 'ide-haskell-cabal:set-active-builder': () => __awaiter(this, void 0, void 0, function* () { return this.upi.setConfigParam('builder'); }) });
        this.menu = [
            { label: 'Build Project', command: 'ide-haskell-cabal:build' },
            { label: 'Clean Project', command: 'ide-haskell-cabal:clean' },
            { label: 'Test', command: 'ide-haskell-cabal:test' },
            { label: 'Bench', command: 'ide-haskell-cabal:bench' },
            { label: 'Build Dependencies', command: 'ide-haskell-cabal:deps' },
            { label: 'Set Active Builder', command: 'ide-haskell-cabal:set-active-builder' },
            { label: 'Set Build Target', command: 'ide-haskell-cabal:set-build-target' },
        ];
        this.upi = reg({
            name: 'ide-haskell-cabal',
            messageTypes: {
                error: {},
                warning: {},
                build: {
                    uriFilter: false,
                    autoScroll: true
                },
                test: {
                    uriFilter: false,
                    autoScroll: true
                },
            },
            menu: {
                label: 'Builder',
                menu: this.menu,
            },
            params: {
                builder: this.builderParamInfo(),
                target: this.targetParamInfo()
            }
        });
        this.disposables = new atom_1.CompositeDisposable();
        this.disposables.add(atom.commands.add('atom-workspace', this.commands));
        this.disposables.add(this.upi);
    }
    destroy() {
        this.disposables.dispose();
    }
    cabalCommands() {
        const ret = {};
        for (const cmd of Object.keys(commandOptions)) {
            ret[`ide-haskell-cabal:${cmd}`] = () => __awaiter(this, void 0, void 0, function* () { return this.runCabalCommand(cmd); });
        }
        return ret;
    }
    builderParamInfo() {
        return {
            items: () => {
                const builders = [{ name: 'cabal' }, { name: 'stack' }];
                if (atom.config.get('ide-haskell-cabal.enableNixBuild')) {
                    builders.push({ name: 'cabal-nix' });
                }
                builders.push({ name: 'none' });
                return builders;
            },
            itemTemplate: (item) => `<li><div class='name'>${item.name}</div></li>`,
            displayTemplate: (item) => item && item.name ? item.name : 'Not set',
            itemFilterKey: 'name',
            description: 'Select builder to use with current project'
        };
    }
    targetParamInfo() {
        const defaultVal = {
            project: 'Auto',
            component: undefined,
            dir: undefined,
            target: undefined
        };
        return {
            default: defaultVal,
            items: () => __awaiter(this, void 0, void 0, function* () {
                const projects = [defaultVal];
                for (const d of atom.project.getDirectories()) {
                    const dir = d.getPath();
                    const [cabalFile] = (yield Util.getRootDir(dir)).getEntriesSync().filter(isCabalFile);
                    if (cabalFile && cabalFile.isFile()) {
                        const data = yield cabalFile.read();
                        const project = yield Util.parseDotCabal(data);
                        if (project) {
                            projects.push({ project: project.name, dir, component: undefined, target: undefined });
                            for (const target of project.targets) {
                                projects.push({ project: project.name, dir, target, component: target.target });
                            }
                        }
                    }
                }
                return projects;
            }),
            itemTemplate: (tgt) => `<li>
          <div class='project'>${tgt.project}</div>
          <div class='dir'>${tgt.dir || ''}</div>
          ${tgt.target ?
                `
            <div class='type'>${tgt.target.type}</div>
            <div class='name'>${tgt.target.name}</div>
            ` :
                `<div class='name'>${'All'}</div>`}
          <div class='clearfix'></div>
        </li>`,
            displayTemplate: (item) => {
                if (!item.dir) {
                    return item.project;
                }
                else {
                    return `${item.project}: ${item.target ? item.target.name : 'All'}`;
                }
            },
            itemFilterKey: 'name',
            description: 'Select target to build'
        };
    }
    getActiveProjectPath() {
        const editor = atom.workspace.getActiveTextEditor();
        if (editor && editor.getPath()) {
            return path.dirname(editor.getPath());
        }
        else {
            return atom.project.getPaths()[0] || process.cwd();
        }
    }
    getActiveProjectTarget(cabalfile, cabalRoot) {
        return __awaiter(this, void 0, void 0, function* () {
            const editor = atom.workspace.getActiveTextEditor();
            if (editor && editor.getPath()) {
                return Util.getComponentFromFile(cabalfile, cabalRoot.relativize(editor.getPath()));
            }
            else {
                return [];
            }
        });
    }
    cabalBuild(cmd, opts) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (this.running) {
                    this.upi.setStatus({ status: 'warning', detail: 'Builder already running' });
                    return;
                }
                this.running = true;
                const builderParam = yield this.upi.getConfigParam('builder');
                const target = yield this.upi.getConfigParam('target');
                if (target === undefined) {
                    throw new Error('Target undefined');
                }
                if (builderParam === undefined) {
                    throw new Error('Builder undefined');
                }
                this.upi.setStatus({
                    status: 'progress',
                    progress: opts.onProgress ? 0.0 : undefined,
                    detail: ''
                });
                const cabalRoot = yield Util.getRootDir(target.dir ? target.dir : this.getActiveProjectPath());
                const [cabalFile] = cabalRoot.getEntriesSync().filter(isCabalFile);
                if (!cabalFile) {
                    throw new Error('No cabal file found');
                }
                let newTarget = Object.assign({}, target);
                if (!newTarget.target && ['build', 'deps'].includes(cmd)) {
                    const cabalContents = yield cabalFile.read();
                    const tgts = yield this.getActiveProjectTarget(cabalContents, cabalRoot);
                    const [tgt] = tgts;
                    if (tgt) {
                        const cf = yield Util.parseDotCabal(cabalContents);
                        if (cf) {
                            newTarget = {
                                project: cf.name,
                                component: tgt,
                                dir: cabalRoot.getPath(),
                                target: undefined
                            };
                        }
                    }
                }
                const builders = {
                    'cabal-nix': Builders.CabalNix,
                    'cabal': Builders.Cabal,
                    'stack': Builders.Stack,
                    'none': Builders.None
                };
                const builder = builders[builderParam.name];
                if (builder === undefined) {
                    throw new Error(`Unknown builder '${(builderParam && builderParam.name) || builderParam}'`);
                }
                const res = yield (new builder({ opts, target, cabalRoot })).runCommand(cmd);
                if (res.exitCode === null) {
                    this.upi.setStatus({ status: 'warning', detail: 'Build was interrupted' });
                }
                else if (res.exitCode !== 0) {
                    if (res.hasError) {
                        this.upi.setStatus({ status: 'warning', detail: 'There were errors in source files' });
                    }
                    else {
                        this.upi.setStatus({
                            status: 'error',
                            detail: `Builder quit abnormally with exit code ${res.exitCode}`
                        });
                    }
                }
                else {
                    this.upi.setStatus({ status: 'ready', detail: 'Build was successful' });
                }
            }
            catch (error) {
                if (error) {
                    console.error(error);
                    this.upi.setStatus({ status: 'error', detail: error.toString() });
                }
                else {
                    this.upi.setStatus({ status: 'warning', detail: 'Build failed with no errors' });
                }
            }
            this.running = false;
        });
    }
    runCabalCommand(command) {
        return __awaiter(this, void 0, void 0, function* () {
            const { messageTypes, defaultSeverity, canCancel } = commandOptions[command];
            const messages = [];
            this.upi.setMessages(messages);
            let cancelActionDisp;
            yield this.cabalBuild(command, {
                severity: defaultSeverity,
                setCancelAction: canCancel ?
                    (action) => {
                        cancelActionDisp && cancelActionDisp.dispose();
                        cancelActionDisp = this.upi.addPanelControl({
                            element: 'ide-haskell-button',
                            opts: {
                                classes: ['cancel'],
                                events: {
                                    click: action
                                }
                            }
                        });
                    } : undefined,
                onMsg: (message) => {
                    if (messageTypes.includes(message.severity)) {
                        messages.push(message);
                        this.upi.setMessages(messages);
                    }
                },
                onProgress: canCancel
                    ? (progress) => this.upi.setStatus({ status: 'progress', progress, detail: `${command} in progress` })
                    : undefined
            });
            cancelActionDisp && cancelActionDisp.dispose();
        });
    }
}
exports.IdeBackend = IdeBackend;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaWRlLWJhY2tlbmQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaWRlLWJhY2tlbmQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUFBLDZCQUE0QjtBQUM1QiwrQkFBd0M7QUFDeEMsdUNBQXNDO0FBQ3RDLDJDQUEwQztBQUsxQyxxQkFBc0IsSUFBMkM7SUFDL0QsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksSUFBSSxJQUFJLENBQUMsTUFBTSxFQUFFLElBQUksSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFBO0FBQzNFLENBQUM7QUFRRCxNQUFNLGNBQWMsR0FBMkM7SUFDN0QsS0FBSyxFQUFFO1FBQ0wsWUFBWSxFQUFFLENBQUMsT0FBTyxFQUFFLFNBQVMsRUFBRSxPQUFPLENBQUM7UUFDM0MsZUFBZSxFQUFFLE9BQU87UUFDeEIsU0FBUyxFQUFFLElBQUk7S0FDaEI7SUFDRCxLQUFLLEVBQUU7UUFDTCxZQUFZLEVBQUUsQ0FBQyxPQUFPLENBQUM7UUFDdkIsZUFBZSxFQUFFLE9BQU87UUFDeEIsU0FBUyxFQUFFLEtBQUs7S0FDakI7SUFDRCxJQUFJLEVBQUU7UUFDSixZQUFZLEVBQUUsQ0FBQyxPQUFPLEVBQUUsU0FBUyxFQUFFLE9BQU8sRUFBRSxNQUFNLENBQUM7UUFDbkQsZUFBZSxFQUFFLE1BQU07UUFDdkIsU0FBUyxFQUFFLElBQUk7S0FDaEI7SUFDRCxLQUFLLEVBQUU7UUFDTCxZQUFZLEVBQUUsQ0FBQyxPQUFPLEVBQUUsU0FBUyxFQUFFLE9BQU8sRUFBRSxNQUFNLENBQUM7UUFDbkQsZUFBZSxFQUFFLE1BQU07UUFDdkIsU0FBUyxFQUFFLElBQUk7S0FDaEI7SUFDRCxJQUFJLEVBQUU7UUFDSixZQUFZLEVBQUUsQ0FBQyxPQUFPLENBQUM7UUFDdkIsZUFBZSxFQUFFLE9BQU87UUFDeEIsU0FBUyxFQUFFLElBQUk7S0FDaEI7Q0FDRixDQUFB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cG9zaXRlRGlzcG9zYWJsZX0gZnJvbSAnYXRvbSdcbmltcG9ydCAqIGFzIEJ1aWxkZXJzIGZyb20gJy4vYnVpbGRlcnMnXG5pbXBvcnQgKiBhcyBVdGlsIGZyb20gJ2F0b20taGFza2VsbC11dGlscydcbmltcG9ydCB7VGFyZ2V0UGFyYW1UeXBlLCBDYWJhbENvbW1hbmR9IGZyb20gJy4vY29tbW9uJ1xuXG5pbnRlcmZhY2UgQnVpbGRlclBhcmFtVHlwZSB7bmFtZTogc3RyaW5nfVxuXG5mdW5jdGlvbiBpc0NhYmFsRmlsZSAoZmlsZT86IEF0b21UeXBlcy5GaWxlIHwgQXRvbVR5cGVzLkRpcmVjdG9yeSk6IGZpbGUgaXMgQXRvbVR5cGVzLkZpbGUge1xuICByZXR1cm4gISEoZmlsZSAmJiBmaWxlLmlzRmlsZSgpICYmIGZpbGUuZ2V0QmFzZU5hbWUoKS5lbmRzV2l0aCgnLmNhYmFsJykpXG59XG5cbmludGVyZmFjZSBJQ29tbWFuZE9wdGlvbnMge1xuICBtZXNzYWdlVHlwZXM6IFVQSS5UU2V2ZXJpdHlbXVxuICBkZWZhdWx0U2V2ZXJpdHk6IFVQSS5UU2V2ZXJpdHlcbiAgY2FuQ2FuY2VsOiBib29sZWFuXG59XG5cbmNvbnN0IGNvbW1hbmRPcHRpb25zOiB7W0sgaW4gQ2FiYWxDb21tYW5kXTogSUNvbW1hbmRPcHRpb25zfSA9IHtcbiAgYnVpbGQ6IHtcbiAgICBtZXNzYWdlVHlwZXM6IFsnZXJyb3InLCAnd2FybmluZycsICdidWlsZCddLFxuICAgIGRlZmF1bHRTZXZlcml0eTogJ2J1aWxkJyxcbiAgICBjYW5DYW5jZWw6IHRydWUsXG4gIH0sXG4gIGNsZWFuOiB7XG4gICAgbWVzc2FnZVR5cGVzOiBbJ2J1aWxkJ10sXG4gICAgZGVmYXVsdFNldmVyaXR5OiAnYnVpbGQnLFxuICAgIGNhbkNhbmNlbDogZmFsc2UsXG4gIH0sXG4gIHRlc3Q6IHtcbiAgICBtZXNzYWdlVHlwZXM6IFsnZXJyb3InLCAnd2FybmluZycsICdidWlsZCcsICd0ZXN0J10sXG4gICAgZGVmYXVsdFNldmVyaXR5OiAndGVzdCcsXG4gICAgY2FuQ2FuY2VsOiB0cnVlLFxuICB9LFxuICBiZW5jaDoge1xuICAgIG1lc3NhZ2VUeXBlczogWydlcnJvcicsICd3YXJuaW5nJywgJ2J1aWxkJywgJ3Rlc3QnXSxcbiAgICBkZWZhdWx0U2V2ZXJpdHk6ICd0ZXN0JyxcbiAgICBjYW5DYW5jZWw6IHRydWUsXG4gIH0sXG4gIGRlcHM6IHtcbiAgICBtZXNzYWdlVHlwZXM6IFsnYnVpbGQnXSxcbiAgICBkZWZhdWx0U2V2ZXJpdHk6ICdidWlsZCcsXG4gICAgY2FuQ2FuY2VsOiB0cnVlLFxuICB9LFxufVxuXG5leHBvcnQgY2xhc3MgSWRlQmFja2VuZCB7XG4gIHByaXZhdGUgZGlzcG9zYWJsZXM6IENvbXBvc2l0ZURpc3Bvc2FibGVcbiAgcHJpdmF0ZSB1cGk6IFVQSS5JVVBJSW5zdGFuY2VcbiAgcHJpdmF0ZSBydW5uaW5nOiBib29sZWFuID0gZmFsc2VcbiAgcHJpdmF0ZSBjb21tYW5kcyA9IHtcbiAgICAuLi50aGlzLmNhYmFsQ29tbWFuZHMoKSxcbiAgICAnaWRlLWhhc2tlbGwtY2FiYWw6c2V0LWJ1aWxkLXRhcmdldCc6IGFzeW5jICgpID0+XG4gICAgICB0aGlzLnVwaS5zZXRDb25maWdQYXJhbSgndGFyZ2V0JyksXG4gICAgJ2lkZS1oYXNrZWxsLWNhYmFsOnNldC1hY3RpdmUtYnVpbGRlcic6IGFzeW5jICgpID0+XG4gICAgICB0aGlzLnVwaS5zZXRDb25maWdQYXJhbSgnYnVpbGRlcicpLFxuICAgIH1cbiAgcHJpdmF0ZSBtZW51ID0gW1xuICAgIHtsYWJlbDogJ0J1aWxkIFByb2plY3QnLCBjb21tYW5kOiAnaWRlLWhhc2tlbGwtY2FiYWw6YnVpbGQnfSxcbiAgICB7bGFiZWw6ICdDbGVhbiBQcm9qZWN0JywgY29tbWFuZDogJ2lkZS1oYXNrZWxsLWNhYmFsOmNsZWFuJ30sXG4gICAge2xhYmVsOiAnVGVzdCcsIGNvbW1hbmQ6ICdpZGUtaGFza2VsbC1jYWJhbDp0ZXN0J30sXG4gICAge2xhYmVsOiAnQmVuY2gnLCBjb21tYW5kOiAnaWRlLWhhc2tlbGwtY2FiYWw6YmVuY2gnfSxcbiAgICB7bGFiZWw6ICdCdWlsZCBEZXBlbmRlbmNpZXMnLCBjb21tYW5kOiAnaWRlLWhhc2tlbGwtY2FiYWw6ZGVwcyd9LFxuICAgIHtsYWJlbDogJ1NldCBBY3RpdmUgQnVpbGRlcicsIGNvbW1hbmQ6ICdpZGUtaGFza2VsbC1jYWJhbDpzZXQtYWN0aXZlLWJ1aWxkZXInfSxcbiAgICB7bGFiZWw6ICdTZXQgQnVpbGQgVGFyZ2V0JywgY29tbWFuZDogJ2lkZS1oYXNrZWxsLWNhYmFsOnNldC1idWlsZC10YXJnZXQnfSxcbiAgXVxuICBjb25zdHJ1Y3RvciAocmVnOiBVUEkuSVVQSVJlZ2lzdHJhdGlvbikge1xuICAgIHRoaXMudXBpID0gcmVnKHtcbiAgICAgIG5hbWU6ICdpZGUtaGFza2VsbC1jYWJhbCcsXG4gICAgICBtZXNzYWdlVHlwZXM6IHtcbiAgICAgICAgZXJyb3I6IHt9LFxuICAgICAgICB3YXJuaW5nOiB7fSxcbiAgICAgICAgYnVpbGQ6IHtcbiAgICAgICAgICB1cmlGaWx0ZXI6IGZhbHNlLFxuICAgICAgICAgIGF1dG9TY3JvbGw6IHRydWVcbiAgICAgICAgfSxcbiAgICAgICAgdGVzdDoge1xuICAgICAgICAgIHVyaUZpbHRlcjogZmFsc2UsXG4gICAgICAgICAgYXV0b1Njcm9sbDogdHJ1ZVxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIG1lbnU6IHtcbiAgICAgICAgbGFiZWw6ICdCdWlsZGVyJyxcbiAgICAgICAgbWVudTogdGhpcy5tZW51LFxuICAgICAgfSxcbiAgICAgIHBhcmFtczoge1xuICAgICAgICBidWlsZGVyOiB0aGlzLmJ1aWxkZXJQYXJhbUluZm8oKSxcbiAgICAgICAgdGFyZ2V0OiB0aGlzLnRhcmdldFBhcmFtSW5mbygpXG4gICAgICB9XG4gICAgfSlcblxuICAgIHRoaXMuZGlzcG9zYWJsZXMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpXG5cbiAgICB0aGlzLmRpc3Bvc2FibGVzLmFkZChhdG9tLmNvbW1hbmRzLmFkZCgnYXRvbS13b3Jrc3BhY2UnLCB0aGlzLmNvbW1hbmRzKSlcbiAgICB0aGlzLmRpc3Bvc2FibGVzLmFkZCh0aGlzLnVwaSlcbiAgfVxuXG4gIHB1YmxpYyBkZXN0cm95ICgpIHtcbiAgICB0aGlzLmRpc3Bvc2FibGVzLmRpc3Bvc2UoKVxuICB9XG5cbiAgcHJpdmF0ZSBjYWJhbENvbW1hbmRzICgpIHtcbiAgICBjb25zdCByZXQgPSB7fVxuICAgIGZvciAoY29uc3QgY21kIG9mIE9iamVjdC5rZXlzKGNvbW1hbmRPcHRpb25zKSkge1xuICAgICAgcmV0W2BpZGUtaGFza2VsbC1jYWJhbDoke2NtZH1gXSA9IGFzeW5jICgpID0+XG4gICAgICAgIHRoaXMucnVuQ2FiYWxDb21tYW5kKGNtZClcbiAgICB9XG4gICAgcmV0dXJuIHJldFxuICB9XG5cbiAgcHJpdmF0ZSBidWlsZGVyUGFyYW1JbmZvICgpOiBVUEkuSVBhcmFtU3BlYzxCdWlsZGVyUGFyYW1UeXBlPiB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGl0ZW1zOiAoKTogQnVpbGRlclBhcmFtVHlwZVtdID0+IHtcbiAgICAgICAgY29uc3QgYnVpbGRlcnMgPSBbe25hbWU6ICdjYWJhbCd9LCB7bmFtZTogJ3N0YWNrJ31dXG4gICAgICAgIGlmIChhdG9tLmNvbmZpZy5nZXQoJ2lkZS1oYXNrZWxsLWNhYmFsLmVuYWJsZU5peEJ1aWxkJykpIHtcbiAgICAgICAgICBidWlsZGVycy5wdXNoKHtuYW1lOiAnY2FiYWwtbml4J30pXG4gICAgICAgIH1cbiAgICAgICAgYnVpbGRlcnMucHVzaCh7bmFtZTogJ25vbmUnfSlcbiAgICAgICAgcmV0dXJuIGJ1aWxkZXJzXG4gICAgICB9LFxuICAgICAgaXRlbVRlbXBsYXRlOiAoaXRlbTogQnVpbGRlclBhcmFtVHlwZSkgPT4gYDxsaT48ZGl2IGNsYXNzPSduYW1lJz4ke2l0ZW0ubmFtZX08L2Rpdj48L2xpPmAsXG4gICAgICBkaXNwbGF5VGVtcGxhdGU6IChpdGVtOiBCdWlsZGVyUGFyYW1UeXBlKSA9PiBpdGVtICYmIGl0ZW0ubmFtZSA/IGl0ZW0ubmFtZSA6ICdOb3Qgc2V0JyxcbiAgICAgIGl0ZW1GaWx0ZXJLZXk6ICduYW1lJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnU2VsZWN0IGJ1aWxkZXIgdG8gdXNlIHdpdGggY3VycmVudCBwcm9qZWN0J1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgdGFyZ2V0UGFyYW1JbmZvICgpOiBVUEkuSVBhcmFtU3BlYzxUYXJnZXRQYXJhbVR5cGU+IHtcbiAgICBjb25zdCBkZWZhdWx0VmFsID0ge1xuICAgICAgcHJvamVjdDogJ0F1dG8nLFxuICAgICAgY29tcG9uZW50OiB1bmRlZmluZWQsXG4gICAgICBkaXI6IHVuZGVmaW5lZCxcbiAgICAgIHRhcmdldDogdW5kZWZpbmVkXG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICBkZWZhdWx0OiBkZWZhdWx0VmFsLFxuICAgICAgaXRlbXM6IGFzeW5jICgpOiBQcm9taXNlPFRhcmdldFBhcmFtVHlwZVtdPiA9PiB7XG4gICAgICAgIGNvbnN0IHByb2plY3RzOiBUYXJnZXRQYXJhbVR5cGVbXSA9IFtkZWZhdWx0VmFsXVxuICAgICAgICBmb3IgKGNvbnN0IGQgb2YgYXRvbS5wcm9qZWN0LmdldERpcmVjdG9yaWVzKCkpIHtcbiAgICAgICAgICBjb25zdCBkaXIgPSBkLmdldFBhdGgoKVxuICAgICAgICAgIGNvbnN0IFtjYWJhbEZpbGVdID0gKGF3YWl0IFV0aWwuZ2V0Um9vdERpcihkaXIpKS5nZXRFbnRyaWVzU3luYygpLmZpbHRlcihpc0NhYmFsRmlsZSlcbiAgICAgICAgICBpZiAoY2FiYWxGaWxlICYmIGNhYmFsRmlsZS5pc0ZpbGUoKSkge1xuICAgICAgICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IGNhYmFsRmlsZS5yZWFkKClcbiAgICAgICAgICAgIGNvbnN0IHByb2plY3QgPSBhd2FpdCBVdGlsLnBhcnNlRG90Q2FiYWwoZGF0YSlcbiAgICAgICAgICAgIGlmIChwcm9qZWN0KSB7XG4gICAgICAgICAgICAgIHByb2plY3RzLnB1c2goe3Byb2plY3Q6IHByb2plY3QubmFtZSwgZGlyLCBjb21wb25lbnQ6IHVuZGVmaW5lZCwgdGFyZ2V0OiB1bmRlZmluZWR9KVxuICAgICAgICAgICAgICBmb3IgKGNvbnN0IHRhcmdldCBvZiBwcm9qZWN0LnRhcmdldHMpIHtcbiAgICAgICAgICAgICAgICBwcm9qZWN0cy5wdXNoKHtwcm9qZWN0OiBwcm9qZWN0Lm5hbWUsIGRpciwgdGFyZ2V0LCBjb21wb25lbnQ6IHRhcmdldC50YXJnZXR9KVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBwcm9qZWN0c1xuICAgICAgfSxcbiAgICAgIGl0ZW1UZW1wbGF0ZTogKHRndDogVGFyZ2V0UGFyYW1UeXBlKSA9PlxuICAgICAgICBgPGxpPlxuICAgICAgICAgIDxkaXYgY2xhc3M9J3Byb2plY3QnPiR7dGd0LnByb2plY3R9PC9kaXY+XG4gICAgICAgICAgPGRpdiBjbGFzcz0nZGlyJz4ke3RndC5kaXIgfHwgJyd9PC9kaXY+XG4gICAgICAgICAgJHtcbiAgICAgICAgICAgIHRndC50YXJnZXQgP1xuICAgICAgICAgICAgYFxuICAgICAgICAgICAgPGRpdiBjbGFzcz0ndHlwZSc+JHt0Z3QudGFyZ2V0LnR5cGV9PC9kaXY+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzPSduYW1lJz4ke3RndC50YXJnZXQubmFtZX08L2Rpdj5cbiAgICAgICAgICAgIGAgOlxuICAgICAgICAgICAgYDxkaXYgY2xhc3M9J25hbWUnPiR7J0FsbCd9PC9kaXY+YFxuICAgICAgICAgIH1cbiAgICAgICAgICA8ZGl2IGNsYXNzPSdjbGVhcmZpeCc+PC9kaXY+XG4gICAgICAgIDwvbGk+YCxcbiAgICAgIGRpc3BsYXlUZW1wbGF0ZTogKGl0ZW06IFRhcmdldFBhcmFtVHlwZSkgPT4ge1xuICAgICAgICBpZiAoIWl0ZW0uZGlyKSB7XG4gICAgICAgICAgcmV0dXJuIGl0ZW0ucHJvamVjdFxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBgJHtpdGVtLnByb2plY3R9OiAke2l0ZW0udGFyZ2V0ID8gaXRlbS50YXJnZXQubmFtZSA6ICdBbGwnfWBcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIGl0ZW1GaWx0ZXJLZXk6ICduYW1lJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnU2VsZWN0IHRhcmdldCB0byBidWlsZCdcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGdldEFjdGl2ZVByb2plY3RQYXRoICgpOiBzdHJpbmcge1xuICAgIGNvbnN0IGVkaXRvciA9IGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVRleHRFZGl0b3IoKVxuICAgIGlmIChlZGl0b3IgJiYgZWRpdG9yLmdldFBhdGgoKSkge1xuICAgICAgcmV0dXJuIHBhdGguZGlybmFtZShlZGl0b3IuZ2V0UGF0aCgpKVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gYXRvbS5wcm9qZWN0LmdldFBhdGhzKClbMF0gfHwgcHJvY2Vzcy5jd2QoKVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgZ2V0QWN0aXZlUHJvamVjdFRhcmdldCAoY2FiYWxmaWxlOiBzdHJpbmcsIGNhYmFsUm9vdDogQXRvbVR5cGVzLkRpcmVjdG9yeSkge1xuICAgIGNvbnN0IGVkaXRvciA9IGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVRleHRFZGl0b3IoKVxuICAgIGlmIChlZGl0b3IgJiYgZWRpdG9yLmdldFBhdGgoKSkge1xuICAgICAgcmV0dXJuIFV0aWwuZ2V0Q29tcG9uZW50RnJvbUZpbGUoY2FiYWxmaWxlLCBjYWJhbFJvb3QucmVsYXRpdml6ZShlZGl0b3IuZ2V0UGF0aCgpKSlcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIFtdXG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBjYWJhbEJ1aWxkIChjbWQ6IENhYmFsQ29tbWFuZCwgb3B0czogQnVpbGRlcnMuSVBhcmFtcyk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRyeSB7XG4gICAgICBpZiAodGhpcy5ydW5uaW5nKSB7XG4gICAgICAgIHRoaXMudXBpLnNldFN0YXR1cyh7c3RhdHVzOiAnd2FybmluZycsIGRldGFpbDogJ0J1aWxkZXIgYWxyZWFkeSBydW5uaW5nJ30pXG4gICAgICAgIHJldHVyblxuICAgICAgfVxuICAgICAgdGhpcy5ydW5uaW5nID0gdHJ1ZVxuXG4gICAgICBjb25zdCBidWlsZGVyUGFyYW0gPSBhd2FpdCB0aGlzLnVwaS5nZXRDb25maWdQYXJhbTxCdWlsZGVyUGFyYW1UeXBlPignYnVpbGRlcicpXG4gICAgICBjb25zdCB0YXJnZXQgPSBhd2FpdCB0aGlzLnVwaS5nZXRDb25maWdQYXJhbTxUYXJnZXRQYXJhbVR5cGU+KCd0YXJnZXQnKVxuXG4gICAgICBpZiAodGFyZ2V0ID09PSB1bmRlZmluZWQpIHsgdGhyb3cgbmV3IEVycm9yKCdUYXJnZXQgdW5kZWZpbmVkJykgfVxuICAgICAgaWYgKGJ1aWxkZXJQYXJhbSA9PT0gdW5kZWZpbmVkKSB7IHRocm93IG5ldyBFcnJvcignQnVpbGRlciB1bmRlZmluZWQnKSB9XG5cbiAgICAgIHRoaXMudXBpLnNldFN0YXR1cyh7XG4gICAgICAgIHN0YXR1czogJ3Byb2dyZXNzJyxcbiAgICAgICAgcHJvZ3Jlc3M6IG9wdHMub25Qcm9ncmVzcyA/IDAuMCA6IHVuZGVmaW5lZCxcbiAgICAgICAgZGV0YWlsOiAnJ1xuICAgICAgfSlcblxuICAgICAgY29uc3QgY2FiYWxSb290ID0gYXdhaXQgVXRpbC5nZXRSb290RGlyKHRhcmdldC5kaXIgPyB0YXJnZXQuZGlyIDogdGhpcy5nZXRBY3RpdmVQcm9qZWN0UGF0aCgpKVxuXG4gICAgICBjb25zdCBbY2FiYWxGaWxlXTogQXRvbVR5cGVzLkZpbGVbXSA9IGNhYmFsUm9vdC5nZXRFbnRyaWVzU3luYygpLmZpbHRlcihpc0NhYmFsRmlsZSlcblxuICAgICAgaWYgKCFjYWJhbEZpbGUpIHsgdGhyb3cgbmV3IEVycm9yKCdObyBjYWJhbCBmaWxlIGZvdW5kJykgfVxuXG4gICAgICBsZXQgbmV3VGFyZ2V0ID0gey4uLnRhcmdldH1cblxuICAgICAgaWYgKCEgbmV3VGFyZ2V0LnRhcmdldCAmJiBbJ2J1aWxkJywgJ2RlcHMnXS5pbmNsdWRlcyhjbWQpKSB7XG4gICAgICAgIGNvbnN0IGNhYmFsQ29udGVudHMgPSBhd2FpdCBjYWJhbEZpbGUucmVhZCgpXG4gICAgICAgIGNvbnN0IHRndHMgPSBhd2FpdCB0aGlzLmdldEFjdGl2ZVByb2plY3RUYXJnZXQoY2FiYWxDb250ZW50cywgY2FiYWxSb290KVxuICAgICAgICBjb25zdCBbdGd0XSA9IHRndHNcbiAgICAgICAgaWYgKHRndCkge1xuICAgICAgICAgIGNvbnN0IGNmID0gYXdhaXQgVXRpbC5wYXJzZURvdENhYmFsKGNhYmFsQ29udGVudHMpXG4gICAgICAgICAgaWYgKGNmKSB7XG4gICAgICAgICAgICBuZXdUYXJnZXQgPSB7XG4gICAgICAgICAgICAgIHByb2plY3Q6IGNmLm5hbWUsXG4gICAgICAgICAgICAgIGNvbXBvbmVudDogdGd0LFxuICAgICAgICAgICAgICBkaXI6IGNhYmFsUm9vdC5nZXRQYXRoKCksXG4gICAgICAgICAgICAgIHRhcmdldDogdW5kZWZpbmVkXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBjb25zdCBidWlsZGVyczoge1xuICAgICAgICBbazogc3RyaW5nXTpcbiAgICAgICAgICB0eXBlb2YgQnVpbGRlcnMuQ2FiYWxOaXggfCB0eXBlb2YgQnVpbGRlcnMuQ2FiYWwgfCB0eXBlb2YgQnVpbGRlcnMuU3RhY2sgfCB0eXBlb2YgQnVpbGRlcnMuTm9uZSB8IHVuZGVmaW5lZFxuICAgICAgfSA9IHtcbiAgICAgICAgJ2NhYmFsLW5peCc6IEJ1aWxkZXJzLkNhYmFsTml4LFxuICAgICAgICAnY2FiYWwnOiBCdWlsZGVycy5DYWJhbCxcbiAgICAgICAgJ3N0YWNrJzogQnVpbGRlcnMuU3RhY2ssXG4gICAgICAgICdub25lJzogQnVpbGRlcnMuTm9uZVxuICAgICAgfVxuICAgICAgY29uc3QgYnVpbGRlciA9IGJ1aWxkZXJzW2J1aWxkZXJQYXJhbS5uYW1lXVxuXG4gICAgICBpZiAoYnVpbGRlciA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgVW5rbm93biBidWlsZGVyICckeyhidWlsZGVyUGFyYW0gJiYgYnVpbGRlclBhcmFtLm5hbWUpIHx8IGJ1aWxkZXJQYXJhbX0nYClcbiAgICAgIH1cblxuICAgICAgY29uc3QgcmVzID0gYXdhaXQgKG5ldyBidWlsZGVyKHtvcHRzLCB0YXJnZXQsIGNhYmFsUm9vdH0pKS5ydW5Db21tYW5kKGNtZClcbiAgICAgIC8vIHNlZSBDYWJhbFByb2Nlc3MgZm9yIGV4cGxhaW5hdGlvblxuICAgICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOiBuby1udWxsLWtleXdvcmRcbiAgICAgIGlmIChyZXMuZXhpdENvZGUgPT09IG51bGwpIHsgLy8gdGhpcyBtZWFucyBwcm9jZXNzIHdhcyBraWxsZWRcbiAgICAgICAgdGhpcy51cGkuc2V0U3RhdHVzKHtzdGF0dXM6ICd3YXJuaW5nJywgZGV0YWlsOiAnQnVpbGQgd2FzIGludGVycnVwdGVkJ30pXG4gICAgICB9IGVsc2UgaWYgKHJlcy5leGl0Q29kZSAhPT0gMCkge1xuICAgICAgICBpZiAocmVzLmhhc0Vycm9yKSB7XG4gICAgICAgICAgdGhpcy51cGkuc2V0U3RhdHVzKHtzdGF0dXM6ICd3YXJuaW5nJywgZGV0YWlsOiAnVGhlcmUgd2VyZSBlcnJvcnMgaW4gc291cmNlIGZpbGVzJ30pXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy51cGkuc2V0U3RhdHVzKHtcbiAgICAgICAgICAgIHN0YXR1czogJ2Vycm9yJyxcbiAgICAgICAgICAgIGRldGFpbDogYEJ1aWxkZXIgcXVpdCBhYm5vcm1hbGx5IHdpdGggZXhpdCBjb2RlICR7cmVzLmV4aXRDb2RlfWBcbiAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnVwaS5zZXRTdGF0dXMoe3N0YXR1czogJ3JlYWR5JywgZGV0YWlsOiAnQnVpbGQgd2FzIHN1Y2Nlc3NmdWwnfSlcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgaWYgKGVycm9yKSB7XG4gICAgICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTogbm8tY29uc29sZVxuICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKVxuICAgICAgICB0aGlzLnVwaS5zZXRTdGF0dXMoe3N0YXR1czogJ2Vycm9yJywgZGV0YWlsOiBlcnJvci50b1N0cmluZygpfSlcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMudXBpLnNldFN0YXR1cyh7c3RhdHVzOiAnd2FybmluZycsIGRldGFpbDogJ0J1aWxkIGZhaWxlZCB3aXRoIG5vIGVycm9ycyd9KVxuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLnJ1bm5pbmcgPSBmYWxzZVxuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBydW5DYWJhbENvbW1hbmQgKGNvbW1hbmQ6IENhYmFsQ29tbWFuZCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IHttZXNzYWdlVHlwZXMsIGRlZmF1bHRTZXZlcml0eSwgY2FuQ2FuY2VsfSA9IGNvbW1hbmRPcHRpb25zW2NvbW1hbmRdXG4gICAgY29uc3QgbWVzc2FnZXM6IFVQSS5JUmVzdWx0SXRlbVtdID0gW11cbiAgICB0aGlzLnVwaS5zZXRNZXNzYWdlcyhtZXNzYWdlcylcblxuICAgIGxldCBjYW5jZWxBY3Rpb25EaXNwOiBBdG9tVHlwZXMuRGlzcG9zYWJsZSB8IHVuZGVmaW5lZFxuXG4gICAgYXdhaXQgdGhpcy5jYWJhbEJ1aWxkKGNvbW1hbmQsIHtcbiAgICAgIHNldmVyaXR5OiBkZWZhdWx0U2V2ZXJpdHksXG4gICAgICBzZXRDYW5jZWxBY3Rpb246XG4gICAgICAgICAgY2FuQ2FuY2VsID9cbiAgICAgICAgICAoYWN0aW9uOiAoKSA9PiB2b2lkKSA9PiB7XG4gICAgICAgICAgICBjYW5jZWxBY3Rpb25EaXNwICYmIGNhbmNlbEFjdGlvbkRpc3AuZGlzcG9zZSgpXG4gICAgICAgICAgICBjYW5jZWxBY3Rpb25EaXNwID0gdGhpcy51cGkuYWRkUGFuZWxDb250cm9sKHtcbiAgICAgICAgICAgICAgZWxlbWVudDogJ2lkZS1oYXNrZWxsLWJ1dHRvbicsXG4gICAgICAgICAgICAgIG9wdHM6IHtcbiAgICAgICAgICAgICAgICBjbGFzc2VzOiBbJ2NhbmNlbCddLFxuICAgICAgICAgICAgICAgIGV2ZW50czoge1xuICAgICAgICAgICAgICAgICAgY2xpY2s6IGFjdGlvblxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICB9IDogdW5kZWZpbmVkLFxuICAgICAgb25Nc2c6IChtZXNzYWdlOiBVUEkuSVJlc3VsdEl0ZW0pID0+IHtcbiAgICAgICAgaWYgKG1lc3NhZ2VUeXBlcy5pbmNsdWRlcyhtZXNzYWdlLnNldmVyaXR5KSkge1xuICAgICAgICAgIG1lc3NhZ2VzLnB1c2gobWVzc2FnZSlcbiAgICAgICAgICB0aGlzLnVwaS5zZXRNZXNzYWdlcyhtZXNzYWdlcylcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIG9uUHJvZ3Jlc3M6XG4gICAgICAgIGNhbkNhbmNlbFxuICAgICAgICA/IChwcm9ncmVzczogbnVtYmVyKSA9PiB0aGlzLnVwaS5zZXRTdGF0dXMoe3N0YXR1czogJ3Byb2dyZXNzJywgcHJvZ3Jlc3MsIGRldGFpbDogYCR7Y29tbWFuZH0gaW4gcHJvZ3Jlc3NgfSlcbiAgICAgICAgOiB1bmRlZmluZWRcbiAgICB9KVxuICAgIGNhbmNlbEFjdGlvbkRpc3AgJiYgY2FuY2VsQWN0aW9uRGlzcC5kaXNwb3NlKClcbiAgfVxufVxuIl19