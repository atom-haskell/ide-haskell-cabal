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
class IdeBackend {
    constructor(reg) {
        this.running = false;
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
                menu: [
                    { label: 'Build Project', command: 'ide-haskell-cabal:build' },
                    { label: 'Clean Project', command: 'ide-haskell-cabal:clean' },
                    { label: 'Test', command: 'ide-haskell-cabal:test' },
                    { label: 'Bench', command: 'ide-haskell-cabal:bench' },
                    { label: 'Build Dependencies', command: 'ide-haskell-cabal:build-dependencies' },
                    { label: 'Set Build Target', command: 'ide-haskell-cabal:set-build-target' },
                ]
            },
            params: {
                builder: this.builderParamInfo(),
                target: this.targetParamInfo()
            }
        });
        this.disposables = new atom_1.CompositeDisposable();
        this.disposables.add(atom.commands.add('atom-workspace', {
            'ide-haskell-cabal:build': () => this.build(),
            'ide-haskell-cabal:clean': () => this.clean(),
            'ide-haskell-cabal:test': () => this.test(),
            'ide-haskell-cabal:bench': () => this.bench(),
            'ide-haskell-cabal:build-dependencies': () => this.dependencies(),
            'ide-haskell-cabal:set-build-target': () => __awaiter(this, void 0, void 0, function* () { return this.upi.setConfigParam('target'); }),
            'ide-haskell-cabal:set-active-builder': () => __awaiter(this, void 0, void 0, function* () { return this.upi.setConfigParam('builder'); }),
        }));
        this.disposables.add(this.upi);
    }
    destroy() {
        this.disposables.dispose();
    }
    build() {
        this.runCabalCommand('build', {
            messageTypes: ['error', 'warning', 'build'],
            defaultSeverity: 'build',
            canCancel: true,
        });
    }
    clean() {
        this.runCabalCommand('clean', {
            messageTypes: ['build'],
            defaultSeverity: 'build',
            canCancel: false,
        });
    }
    test() {
        this.runCabalCommand('test', {
            messageTypes: ['error', 'warning', 'build', 'test'],
            defaultSeverity: 'test',
            canCancel: true,
        });
    }
    bench() {
        this.runCabalCommand('bench', {
            messageTypes: ['error', 'warning', 'build', 'test'],
            defaultSeverity: 'test',
            canCancel: true,
        });
    }
    dependencies() {
        this.runCabalCommand('deps', {
            messageTypes: ['build'],
            defaultSeverity: 'build',
            canCancel: true,
        });
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
            let res;
            try {
                if (this.running) {
                    throw new Error('Already running');
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
                res = yield (new builder({ opts, target, cabalRoot })).runCommand(cmd);
                if (res.exitCode !== 0) {
                    if (res.hasError) {
                        this.upi.setStatus({ status: 'warning', detail: 'There were build errors' });
                    }
                    else {
                        this.upi.setStatus({ status: 'error', detail: 'There was a builder error' });
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
            finally {
                this.running = false;
            }
        });
    }
    runCabalCommand(command, { messageTypes, defaultSeverity, canCancel }) {
        return __awaiter(this, void 0, void 0, function* () {
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
                    ? (progress) => this.upi.setStatus({ status: 'progress', progress, detail: '' })
                    : undefined
            });
            cancelActionDisp && cancelActionDisp.dispose();
        });
    }
}
exports.IdeBackend = IdeBackend;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaWRlLWJhY2tlbmQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaWRlLWJhY2tlbmQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUFBLDZCQUE0QjtBQUU1QiwrQkFBaUQ7QUFDakQsdUNBQXNDO0FBQ3RDLDJDQUEwQztBQUsxQyxxQkFBc0IsSUFBMkM7SUFDL0QsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksSUFBSSxJQUFJLENBQUMsTUFBTSxFQUFFLElBQUksSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFBO0FBQzNFLENBQUM7QUFFRDtJQUlFLFlBQWEsR0FBeUI7UUFEOUIsWUFBTyxHQUFZLEtBQUssQ0FBQTtRQUU5QixJQUFJLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQztZQUNiLElBQUksRUFBRSxtQkFBbUI7WUFDekIsWUFBWSxFQUFFO2dCQUNaLEtBQUssRUFBRSxFQUFFO2dCQUNULE9BQU8sRUFBRSxFQUFFO2dCQUNYLEtBQUssRUFBRTtvQkFDTCxTQUFTLEVBQUUsS0FBSztvQkFDaEIsVUFBVSxFQUFFLElBQUk7aUJBQ2pCO2dCQUNELElBQUksRUFBRTtvQkFDSixTQUFTLEVBQUUsS0FBSztvQkFDaEIsVUFBVSxFQUFFLElBQUk7aUJBQ2pCO2FBQ0Y7WUFDRCxJQUFJLEVBQUU7Z0JBQ0osS0FBSyxFQUFFLFNBQVM7Z0JBQ2hCLElBQUksRUFBRTtvQkFDSixFQUFDLEtBQUssRUFBRSxlQUFlLEVBQUUsT0FBTyxFQUFFLHlCQUF5QixFQUFDO29CQUM1RCxFQUFDLEtBQUssRUFBRSxlQUFlLEVBQUUsT0FBTyxFQUFFLHlCQUF5QixFQUFDO29CQUM1RCxFQUFDLEtBQUssRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFFLHdCQUF3QixFQUFDO29CQUNsRCxFQUFDLEtBQUssRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLHlCQUF5QixFQUFDO29CQUNwRCxF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T0FBd0I7b0JBQzlCLEVBQUUsQ0FBQyxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQzt3QkFDNUMsUUFBUSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQTt3QkFDdEIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLENBQUE7b0JBQ2hDLENBQUM7Z0JBQ0gsQ0FBQztnQkFDRCxVQUFVLEVBQ1IsU0FBUztzQkFDUCxDQUFDLFFBQWdCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsRUFBQyxNQUFNLEVBQUUsVUFBVSxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsRUFBRSxFQUFDLENBQUM7c0JBQ3BGLFNBQVM7YUFDZCxDQUFDLENBQUE7WUFDRixnQkFBZ0IsSUFBSSxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsQ0FBQTtRQUNoRCxDQUFDO0tBQUE7Q0FDRjtBQXpURCxnQ0F5VEMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnXG5pbXBvcnQgKiBhcyBmcyBmcm9tICdmcydcbmltcG9ydCB7Q29tcG9zaXRlRGlzcG9zYWJsZSwgRW1pdHRlcn0gZnJvbSAnYXRvbSdcbmltcG9ydCAqIGFzIEJ1aWxkZXJzIGZyb20gJy4vYnVpbGRlcnMnXG5pbXBvcnQgKiBhcyBVdGlsIGZyb20gJ2F0b20taGFza2VsbC11dGlscydcbmltcG9ydCB7VGFyZ2V0UGFyYW1UeXBlLCBDYWJhbENvbW1hbmR9IGZyb20gJy4vY29tbW9uJ1xuXG5pbnRlcmZhY2UgQnVpbGRlclBhcmFtVHlwZSB7bmFtZTogc3RyaW5nfVxuXG5mdW5jdGlvbiBpc0NhYmFsRmlsZSAoZmlsZT86IEF0b21UeXBlcy5GaWxlIHwgQXRvbVR5cGVzLkRpcmVjdG9yeSk6IGZpbGUgaXMgQXRvbVR5cGVzLkZpbGUge1xuICByZXR1cm4gISEoZmlsZSAmJiBmaWxlLmlzRmlsZSgpICYmIGZpbGUuZ2V0QmFzZU5hbWUoKS5lbmRzV2l0aCgnLmNhYmFsJykpXG59XG5cbmV4cG9ydCBjbGFzcyBJZGVCYWNrZW5kIHtcbiAgcHJpdmF0ZSBkaXNwb3NhYmxlczogQ29tcG9zaXRlRGlzcG9zYWJsZVxuICBwcml2YXRlIHVwaTogVVBJLklVUElJbnN0YW5jZVxuICBwcml2YXRlIHJ1bm5pbmc6IGJvb2xlYW4gPSBmYWxzZVxuICBjb25zdHJ1Y3RvciAocmVnOiBVUEkuSVVQSVJlZ2lzdHJhdGlvbikge1xuICAgIHRoaXMudXBpID0gcmVnKHtcbiAgICAgIG5hbWU6ICdpZGUtaGFza2VsbC1jYWJhbCcsXG4gICAgICBtZXNzYWdlVHlwZXM6IHtcbiAgICAgICAgZXJyb3I6IHt9LFxuICAgICAgICB3YXJuaW5nOiB7fSxcbiAgICAgICAgYnVpbGQ6IHtcbiAgICAgICAgICB1cmlGaWx0ZXI6IGZhbHNlLFxuICAgICAgICAgIGF1dG9TY3JvbGw6IHRydWVcbiAgICAgICAgfSxcbiAgICAgICAgdGVzdDoge1xuICAgICAgICAgIHVyaUZpbHRlcjogZmFsc2UsXG4gICAgICAgICAgYXV0b1Njcm9sbDogdHJ1ZVxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIG1lbnU6IHtcbiAgICAgICAgbGFiZWw6ICdCdWlsZGVyJyxcbiAgICAgICAgbWVudTogW1xuICAgICAgICAgIHtsYWJlbDogJ0J1aWxkIFByb2plY3QnLCBjb21tYW5kOiAnaWRlLWhhc2tlbGwtY2FiYWw6YnVpbGQnfSxcbiAgICAgICAgICB7bGFiZWw6ICdDbGVhbiBQcm9qZWN0JywgY29tbWFuZDogJ2lkZS1oYXNrZWxsLWNhYmFsOmNsZWFuJ30sXG4gICAgICAgICAge2xhYmVsOiAnVGVzdCcsIGNvbW1hbmQ6ICdpZGUtaGFza2VsbC1jYWJhbDp0ZXN0J30sXG4gICAgICAgICAge2xhYmVsOiAnQmVuY2gnLCBjb21tYW5kOiAnaWRlLWhhc2tlbGwtY2FiYWw6YmVuY2gnfSxcbiAgICAgICAgICB7bGFiZWw6ICdCdWlsZCBEZXBlbmRlbmNpZXMnLCBjb21tYW5kOiAnaWRlLWhhc2tlbGwtY2FiYWw6YnVpbGQtZGVwZW5kZW5jaWVzJ30sXG4gICAgICAgICAge2xhYmVsOiAnU2V0IEJ1aWxkIFRhcmdldCcsIGNvbW1hbmQ6ICdpZGUtaGFza2VsbC1jYWJhbDpzZXQtYnVpbGQtdGFyZ2V0J30sXG4gICAgICAgIF1cbiAgICAgIH0sXG4gICAgICBwYXJhbXM6IHtcbiAgICAgICAgYnVpbGRlcjogdGhpcy5idWlsZGVyUGFyYW1JbmZvKCksXG4gICAgICAgIHRhcmdldDogdGhpcy50YXJnZXRQYXJhbUluZm8oKVxuICAgICAgfVxuICAgIH0pXG5cbiAgICB0aGlzLmRpc3Bvc2FibGVzID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKVxuXG4gICAgdGhpcy5kaXNwb3NhYmxlcy5hZGQoYXRvbS5jb21tYW5kcy5hZGQoJ2F0b20td29ya3NwYWNlJywge1xuICAgICAgJ2lkZS1oYXNrZWxsLWNhYmFsOmJ1aWxkJzogKCkgPT5cbiAgICAgICAgdGhpcy5idWlsZCgpLFxuICAgICAgJ2lkZS1oYXNrZWxsLWNhYmFsOmNsZWFuJzogKCkgPT5cbiAgICAgICAgdGhpcy5jbGVhbigpLFxuICAgICAgJ2lkZS1oYXNrZWxsLWNhYmFsOnRlc3QnOiAoKSA9PlxuICAgICAgICB0aGlzLnRlc3QoKSxcbiAgICAgICdpZGUtaGFza2VsbC1jYWJhbDpiZW5jaCc6ICgpID0+XG4gICAgICAgIHRoaXMuYmVuY2goKSxcbiAgICAgICdpZGUtaGFza2VsbC1jYWJhbDpidWlsZC1kZXBlbmRlbmNpZXMnOiAoKSA9PlxuICAgICAgICB0aGlzLmRlcGVuZGVuY2llcygpLFxuICAgICAgJ2lkZS1oYXNrZWxsLWNhYmFsOnNldC1idWlsZC10YXJnZXQnOiBhc3luYyAoKSA9PlxuICAgICAgICB0aGlzLnVwaS5zZXRDb25maWdQYXJhbSgndGFyZ2V0JyksXG4gICAgICAnaWRlLWhhc2tlbGwtY2FiYWw6c2V0LWFjdGl2ZS1idWlsZGVyJzogYXN5bmMgKCkgPT5cbiAgICAgICAgdGhpcy51cGkuc2V0Q29uZmlnUGFyYW0oJ2J1aWxkZXInKSxcbiAgICAgIH0pXG4gICAgKVxuICAgIHRoaXMuZGlzcG9zYWJsZXMuYWRkKHRoaXMudXBpKVxuICB9XG5cbiAgcHVibGljIGRlc3Ryb3kgKCkge1xuICAgIHRoaXMuZGlzcG9zYWJsZXMuZGlzcG9zZSgpXG4gIH1cblxuICBwdWJsaWMgYnVpbGQgKCkge1xuICAgIHRoaXMucnVuQ2FiYWxDb21tYW5kKCdidWlsZCcsIHtcbiAgICAgIG1lc3NhZ2VUeXBlczogWydlcnJvcicsICd3YXJuaW5nJywgJ2J1aWxkJ10sXG4gICAgICBkZWZhdWx0U2V2ZXJpdHk6ICdidWlsZCcsXG4gICAgICBjYW5DYW5jZWw6IHRydWUsXG4gICAgfSlcbiAgfVxuXG4gIHB1YmxpYyBjbGVhbiAoKSB7XG4gICAgdGhpcy5ydW5DYWJhbENvbW1hbmQoJ2NsZWFuJywge1xuICAgICAgbWVzc2FnZVR5cGVzOiBbJ2J1aWxkJ10sXG4gICAgICBkZWZhdWx0U2V2ZXJpdHk6ICdidWlsZCcsXG4gICAgICBjYW5DYW5jZWw6IGZhbHNlLFxuICAgIH0pXG4gIH1cblxuICBwdWJsaWMgdGVzdCAoKSB7XG4gICAgdGhpcy5ydW5DYWJhbENvbW1hbmQoJ3Rlc3QnLCB7XG4gICAgICBtZXNzYWdlVHlwZXM6IFsnZXJyb3InLCAnd2FybmluZycsICdidWlsZCcsICd0ZXN0J10sXG4gICAgICBkZWZhdWx0U2V2ZXJpdHk6ICd0ZXN0JyxcbiAgICAgIGNhbkNhbmNlbDogdHJ1ZSxcbiAgICB9KVxuICB9XG5cbiAgcHVibGljIGJlbmNoICgpIHtcbiAgICB0aGlzLnJ1bkNhYmFsQ29tbWFuZCgnYmVuY2gnLCB7XG4gICAgICBtZXNzYWdlVHlwZXM6IFsnZXJyb3InLCAnd2FybmluZycsICdidWlsZCcsICd0ZXN0J10sXG4gICAgICBkZWZhdWx0U2V2ZXJpdHk6ICd0ZXN0JyxcbiAgICAgIGNhbkNhbmNlbDogdHJ1ZSxcbiAgICB9KVxuICB9XG5cbiAgcHVibGljIGRlcGVuZGVuY2llcyAoKSB7XG4gICAgdGhpcy5ydW5DYWJhbENvbW1hbmQoJ2RlcHMnLCB7XG4gICAgICBtZXNzYWdlVHlwZXM6IFsnYnVpbGQnXSxcbiAgICAgIGRlZmF1bHRTZXZlcml0eTogJ2J1aWxkJyxcbiAgICAgIGNhbkNhbmNlbDogdHJ1ZSxcbiAgICB9KVxuICB9XG5cbiAgcHJpdmF0ZSBidWlsZGVyUGFyYW1JbmZvICgpOiBVUEkuSVBhcmFtU3BlYzxCdWlsZGVyUGFyYW1UeXBlPiB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGl0ZW1zOiAoKTogQnVpbGRlclBhcmFtVHlwZVtdID0+IHtcbiAgICAgICAgY29uc3QgYnVpbGRlcnMgPSBbe25hbWU6ICdjYWJhbCd9LCB7bmFtZTogJ3N0YWNrJ31dXG4gICAgICAgIGlmIChhdG9tLmNvbmZpZy5nZXQoJ2lkZS1oYXNrZWxsLWNhYmFsLmVuYWJsZU5peEJ1aWxkJykpIHtcbiAgICAgICAgICBidWlsZGVycy5wdXNoKHtuYW1lOiAnY2FiYWwtbml4J30pXG4gICAgICAgIH1cbiAgICAgICAgYnVpbGRlcnMucHVzaCh7bmFtZTogJ25vbmUnfSlcbiAgICAgICAgcmV0dXJuIGJ1aWxkZXJzXG4gICAgICB9LFxuICAgICAgaXRlbVRlbXBsYXRlOiAoaXRlbTogQnVpbGRlclBhcmFtVHlwZSkgPT4gYDxsaT48ZGl2IGNsYXNzPSduYW1lJz4ke2l0ZW0ubmFtZX08L2Rpdj48L2xpPmAsXG4gICAgICBkaXNwbGF5VGVtcGxhdGU6IChpdGVtOiBCdWlsZGVyUGFyYW1UeXBlKSA9PiBpdGVtICYmIGl0ZW0ubmFtZSA/IGl0ZW0ubmFtZSA6ICdOb3Qgc2V0JyxcbiAgICAgIGl0ZW1GaWx0ZXJLZXk6ICduYW1lJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnU2VsZWN0IGJ1aWxkZXIgdG8gdXNlIHdpdGggY3VycmVudCBwcm9qZWN0J1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgdGFyZ2V0UGFyYW1JbmZvICgpOiBVUEkuSVBhcmFtU3BlYzxUYXJnZXRQYXJhbVR5cGU+IHtcbiAgICBjb25zdCBkZWZhdWx0VmFsID0ge1xuICAgICAgcHJvamVjdDogJ0F1dG8nLFxuICAgICAgY29tcG9uZW50OiB1bmRlZmluZWQsXG4gICAgICBkaXI6IHVuZGVmaW5lZCxcbiAgICAgIHRhcmdldDogdW5kZWZpbmVkXG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICBkZWZhdWx0OiBkZWZhdWx0VmFsLFxuICAgICAgaXRlbXM6IGFzeW5jICgpOiBQcm9taXNlPFRhcmdldFBhcmFtVHlwZVtdPiA9PiB7XG4gICAgICAgIGNvbnN0IHByb2plY3RzOiBUYXJnZXRQYXJhbVR5cGVbXSA9IFtkZWZhdWx0VmFsXVxuICAgICAgICBmb3IgKGNvbnN0IGQgb2YgYXRvbS5wcm9qZWN0LmdldERpcmVjdG9yaWVzKCkpIHtcbiAgICAgICAgICBjb25zdCBkaXIgPSBkLmdldFBhdGgoKVxuICAgICAgICAgIGNvbnN0IFtjYWJhbEZpbGVdID0gKGF3YWl0IFV0aWwuZ2V0Um9vdERpcihkaXIpKS5nZXRFbnRyaWVzU3luYygpLmZpbHRlcihpc0NhYmFsRmlsZSlcbiAgICAgICAgICBpZiAoY2FiYWxGaWxlICYmIGNhYmFsRmlsZS5pc0ZpbGUoKSkge1xuICAgICAgICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IGNhYmFsRmlsZS5yZWFkKClcbiAgICAgICAgICAgIGNvbnN0IHByb2plY3QgPSBhd2FpdCBVdGlsLnBhcnNlRG90Q2FiYWwoZGF0YSlcbiAgICAgICAgICAgIGlmIChwcm9qZWN0KSB7XG4gICAgICAgICAgICAgIHByb2plY3RzLnB1c2goe3Byb2plY3Q6IHByb2plY3QubmFtZSwgZGlyLCBjb21wb25lbnQ6IHVuZGVmaW5lZCwgdGFyZ2V0OiB1bmRlZmluZWR9KVxuICAgICAgICAgICAgICBmb3IgKGNvbnN0IHRhcmdldCBvZiBwcm9qZWN0LnRhcmdldHMpIHtcbiAgICAgICAgICAgICAgICBwcm9qZWN0cy5wdXNoKHtwcm9qZWN0OiBwcm9qZWN0Lm5hbWUsIGRpciwgdGFyZ2V0LCBjb21wb25lbnQ6IHRhcmdldC50YXJnZXR9KVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBwcm9qZWN0c1xuICAgICAgfSxcbiAgICAgIGl0ZW1UZW1wbGF0ZTogKHRndDogVGFyZ2V0UGFyYW1UeXBlKSA9PlxuICAgICAgICBgPGxpPlxuICAgICAgICAgIDxkaXYgY2xhc3M9J3Byb2plY3QnPiR7dGd0LnByb2plY3R9PC9kaXY+XG4gICAgICAgICAgPGRpdiBjbGFzcz0nZGlyJz4ke3RndC5kaXIgfHwgJyd9PC9kaXY+XG4gICAgICAgICAgJHtcbiAgICAgICAgICAgIHRndC50YXJnZXQgP1xuICAgICAgICAgICAgYFxuICAgICAgICAgICAgPGRpdiBjbGFzcz0ndHlwZSc+JHt0Z3QudGFyZ2V0LnR5cGV9PC9kaXY+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzPSduYW1lJz4ke3RndC50YXJnZXQubmFtZX08L2Rpdj5cbiAgICAgICAgICAgIGAgOlxuICAgICAgICAgICAgYDxkaXYgY2xhc3M9J25hbWUnPiR7J0FsbCd9PC9kaXY+YFxuICAgICAgICAgIH1cbiAgICAgICAgICA8ZGl2IGNsYXNzPSdjbGVhcmZpeCc+PC9kaXY+XG4gICAgICAgIDwvbGk+YCxcbiAgICAgIGRpc3BsYXlUZW1wbGF0ZTogKGl0ZW06IFRhcmdldFBhcmFtVHlwZSkgPT4ge1xuICAgICAgICBpZiAoIWl0ZW0uZGlyKSB7XG4gICAgICAgICAgcmV0dXJuIGl0ZW0ucHJvamVjdFxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBgJHtpdGVtLnByb2plY3R9OiAke2l0ZW0udGFyZ2V0ID8gaXRlbS50YXJnZXQubmFtZSA6ICdBbGwnfWBcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIGl0ZW1GaWx0ZXJLZXk6ICduYW1lJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnU2VsZWN0IHRhcmdldCB0byBidWlsZCdcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGdldEFjdGl2ZVByb2plY3RQYXRoICgpOiBzdHJpbmcge1xuICAgIGNvbnN0IGVkaXRvciA9IGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVRleHRFZGl0b3IoKVxuICAgIGlmIChlZGl0b3IgJiYgZWRpdG9yLmdldFBhdGgoKSkge1xuICAgICAgcmV0dXJuIHBhdGguZGlybmFtZShlZGl0b3IuZ2V0UGF0aCgpKVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gYXRvbS5wcm9qZWN0LmdldFBhdGhzKClbMF0gfHwgcHJvY2Vzcy5jd2QoKVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgZ2V0QWN0aXZlUHJvamVjdFRhcmdldCAoY2FiYWxmaWxlOiBzdHJpbmcsIGNhYmFsUm9vdDogQXRvbVR5cGVzLkRpcmVjdG9yeSkge1xuICAgIGNvbnN0IGVkaXRvciA9IGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVRleHRFZGl0b3IoKVxuICAgIGlmIChlZGl0b3IgJiYgZWRpdG9yLmdldFBhdGgoKSkge1xuICAgICAgcmV0dXJuIFV0aWwuZ2V0Q29tcG9uZW50RnJvbUZpbGUoY2FiYWxmaWxlLCBjYWJhbFJvb3QucmVsYXRpdml6ZShlZGl0b3IuZ2V0UGF0aCgpKSlcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIFtdXG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBjYWJhbEJ1aWxkIChjbWQ6IENhYmFsQ29tbWFuZCwgb3B0czogQnVpbGRlcnMuSVBhcmFtcyk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgLy8gSXQgc2hvdWxkbid0IGJlIHBvc3NpYmxlIHRvIGNhbGwgdGhpcyBmdW5jdGlvbiB1bnRpbCBjYWJhbFByb2Nlc3NcbiAgICAgIC8vIGV4aXRzLiBPdGhlcndpc2UsIHByb2JsZW1zIHdpbGwgZW5zdWUuXG4gICAgbGV0IHJlc1xuICAgIHRyeSB7XG4gICAgICBpZiAodGhpcy5ydW5uaW5nKSB7IHRocm93IG5ldyBFcnJvcignQWxyZWFkeSBydW5uaW5nJykgfVxuICAgICAgdGhpcy5ydW5uaW5nID0gdHJ1ZVxuXG4gICAgICBjb25zdCBidWlsZGVyUGFyYW0gPSBhd2FpdCB0aGlzLnVwaS5nZXRDb25maWdQYXJhbTxCdWlsZGVyUGFyYW1UeXBlPignYnVpbGRlcicpXG4gICAgICBjb25zdCB0YXJnZXQgPSBhd2FpdCB0aGlzLnVwaS5nZXRDb25maWdQYXJhbTxUYXJnZXRQYXJhbVR5cGU+KCd0YXJnZXQnKVxuXG4gICAgICBpZiAodGFyZ2V0ID09PSB1bmRlZmluZWQpIHsgdGhyb3cgbmV3IEVycm9yKCdUYXJnZXQgdW5kZWZpbmVkJykgfVxuICAgICAgaWYgKGJ1aWxkZXJQYXJhbSA9PT0gdW5kZWZpbmVkKSB7IHRocm93IG5ldyBFcnJvcignQnVpbGRlciB1bmRlZmluZWQnKSB9XG5cbiAgICAgIHRoaXMudXBpLnNldFN0YXR1cyh7XG4gICAgICAgIHN0YXR1czogJ3Byb2dyZXNzJyxcbiAgICAgICAgcHJvZ3Jlc3M6IG9wdHMub25Qcm9ncmVzcyA/IDAuMCA6IHVuZGVmaW5lZCxcbiAgICAgICAgZGV0YWlsOiAnJ1xuICAgICAgfSlcblxuICAgICAgY29uc3QgY2FiYWxSb290ID0gYXdhaXQgVXRpbC5nZXRSb290RGlyKHRhcmdldC5kaXIgPyB0YXJnZXQuZGlyIDogdGhpcy5nZXRBY3RpdmVQcm9qZWN0UGF0aCgpKVxuXG4gICAgICBjb25zdCBbY2FiYWxGaWxlXTogQXRvbVR5cGVzLkZpbGVbXSA9IGNhYmFsUm9vdC5nZXRFbnRyaWVzU3luYygpLmZpbHRlcihpc0NhYmFsRmlsZSlcblxuICAgICAgaWYgKCFjYWJhbEZpbGUpIHsgdGhyb3cgbmV3IEVycm9yKCdObyBjYWJhbCBmaWxlIGZvdW5kJykgfVxuXG4gICAgICBsZXQgbmV3VGFyZ2V0ID0gey4uLnRhcmdldH1cblxuICAgICAgaWYgKCEgbmV3VGFyZ2V0LnRhcmdldCAmJiBbJ2J1aWxkJywgJ2RlcHMnXS5pbmNsdWRlcyhjbWQpKSB7XG4gICAgICAgIGNvbnN0IGNhYmFsQ29udGVudHMgPSBhd2FpdCBjYWJhbEZpbGUucmVhZCgpXG4gICAgICAgIGNvbnN0IHRndHMgPSBhd2FpdCB0aGlzLmdldEFjdGl2ZVByb2plY3RUYXJnZXQoY2FiYWxDb250ZW50cywgY2FiYWxSb290KVxuICAgICAgICBjb25zdCBbdGd0XSA9IHRndHNcbiAgICAgICAgaWYgKHRndCkge1xuICAgICAgICAgIGNvbnN0IGNmID0gYXdhaXQgVXRpbC5wYXJzZURvdENhYmFsKGNhYmFsQ29udGVudHMpXG4gICAgICAgICAgaWYgKGNmKSB7XG4gICAgICAgICAgICBuZXdUYXJnZXQgPSB7XG4gICAgICAgICAgICAgIHByb2plY3Q6IGNmLm5hbWUsXG4gICAgICAgICAgICAgIGNvbXBvbmVudDogdGd0LFxuICAgICAgICAgICAgICBkaXI6IGNhYmFsUm9vdC5nZXRQYXRoKCksXG4gICAgICAgICAgICAgIHRhcmdldDogdW5kZWZpbmVkXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICAvLyB0cnkge1xuICAgICAgLy9cbiAgICAgIC8vIH0gY2F0Y2ggKGUpIHtcbiAgICAgIC8vICAgdGhyb3cgbmV3IEVycm9yKGBVbmtub3duIGJ1aWxkZXIgJyR7KGJ1aWxkZXJQYXJhbSAmJiBidWlsZGVyUGFyYW0ubmFtZSkgfHwgYnVpbGRlclBhcmFtfSdgKVxuICAgICAgLy8gfVxuICAgICAgY29uc3QgYnVpbGRlcnM6IHtcbiAgICAgICAgW2s6IHN0cmluZ106XG4gICAgICAgICAgdHlwZW9mIEJ1aWxkZXJzLkNhYmFsTml4IHwgdHlwZW9mIEJ1aWxkZXJzLkNhYmFsIHwgdHlwZW9mIEJ1aWxkZXJzLlN0YWNrIHwgdHlwZW9mIEJ1aWxkZXJzLk5vbmVcbiAgICAgIH0gPSB7XG4gICAgICAgICdjYWJhbC1uaXgnOiBCdWlsZGVycy5DYWJhbE5peCxcbiAgICAgICAgJ2NhYmFsJzogQnVpbGRlcnMuQ2FiYWwsXG4gICAgICAgICdzdGFjayc6IEJ1aWxkZXJzLlN0YWNrLFxuICAgICAgICAnbm9uZSc6IEJ1aWxkZXJzLk5vbmVcbiAgICAgIH1cbiAgICAgIGNvbnN0IGJ1aWxkZXIgPSBidWlsZGVyc1tidWlsZGVyUGFyYW0ubmFtZV1cblxuICAgICAgcmVzID0gYXdhaXQgKG5ldyBidWlsZGVyKHtvcHRzLCB0YXJnZXQsIGNhYmFsUm9vdH0pKS5ydW5Db21tYW5kKGNtZClcbiAgICAgIC8vIHNlZSBDYWJhbFByb2Nlc3MgZm9yIGV4cGxhaW5hdGlvblxuICAgICAgaWYgKHJlcy5leGl0Q29kZSAhPT0gMCkge1xuICAgICAgICBpZiAocmVzLmhhc0Vycm9yKSB7XG4gICAgICAgICAgdGhpcy51cGkuc2V0U3RhdHVzKHtzdGF0dXM6ICd3YXJuaW5nJywgZGV0YWlsOiAnVGhlcmUgd2VyZSBidWlsZCBlcnJvcnMnfSlcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLnVwaS5zZXRTdGF0dXMoe3N0YXR1czogJ2Vycm9yJywgZGV0YWlsOiAnVGhlcmUgd2FzIGEgYnVpbGRlciBlcnJvcid9KVxuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnVwaS5zZXRTdGF0dXMoe3N0YXR1czogJ3JlYWR5JywgZGV0YWlsOiAnQnVpbGQgd2FzIHN1Y2Nlc3NmdWwnfSlcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgaWYgKGVycm9yKSB7XG4gICAgICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTogbm8tY29uc29sZVxuICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKVxuICAgICAgICB0aGlzLnVwaS5zZXRTdGF0dXMoe3N0YXR1czogJ2Vycm9yJywgZGV0YWlsOiBlcnJvci50b1N0cmluZygpfSlcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMudXBpLnNldFN0YXR1cyh7c3RhdHVzOiAnd2FybmluZycsIGRldGFpbDogJ0J1aWxkIGZhaWxlZCB3aXRoIG5vIGVycm9ycyd9KVxuICAgICAgfVxuICAgIH0gZmluYWxseSB7XG4gICAgICB0aGlzLnJ1bm5pbmcgPSBmYWxzZVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgcnVuQ2FiYWxDb21tYW5kIChcbiAgICBjb21tYW5kOiBDYWJhbENvbW1hbmQsXG4gICAge21lc3NhZ2VUeXBlcywgZGVmYXVsdFNldmVyaXR5LCBjYW5DYW5jZWx9OlxuICAgICAge21lc3NhZ2VUeXBlczogVVBJLlRTZXZlcml0eVtdLCBkZWZhdWx0U2V2ZXJpdHk6IFVQSS5UU2V2ZXJpdHksIGNhbkNhbmNlbDogYm9vbGVhbn1cbiAgKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgbWVzc2FnZXM6IFVQSS5JUmVzdWx0SXRlbVtdID0gW11cbiAgICB0aGlzLnVwaS5zZXRNZXNzYWdlcyhtZXNzYWdlcylcblxuICAgIGxldCBjYW5jZWxBY3Rpb25EaXNwOiBBdG9tVHlwZXMuRGlzcG9zYWJsZSB8IHVuZGVmaW5lZFxuXG4gICAgYXdhaXQgdGhpcy5jYWJhbEJ1aWxkKGNvbW1hbmQsIHtcbiAgICAgIHNldmVyaXR5OiBkZWZhdWx0U2V2ZXJpdHksXG4gICAgICBzZXRDYW5jZWxBY3Rpb246XG4gICAgICAgICAgY2FuQ2FuY2VsID9cbiAgICAgICAgICAoYWN0aW9uOiAoKSA9PiB2b2lkKSA9PiB7XG4gICAgICAgICAgICBjYW5jZWxBY3Rpb25EaXNwICYmIGNhbmNlbEFjdGlvbkRpc3AuZGlzcG9zZSgpXG4gICAgICAgICAgICBjYW5jZWxBY3Rpb25EaXNwID0gdGhpcy51cGkuYWRkUGFuZWxDb250cm9sKHtcbiAgICAgICAgICAgICAgZWxlbWVudDogJ2lkZS1oYXNrZWxsLWJ1dHRvbicsXG4gICAgICAgICAgICAgIG9wdHM6IHtcbiAgICAgICAgICAgICAgICBjbGFzc2VzOiBbJ2NhbmNlbCddLFxuICAgICAgICAgICAgICAgIGV2ZW50czoge1xuICAgICAgICAgICAgICAgICAgY2xpY2s6IGFjdGlvblxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICB9IDogdW5kZWZpbmVkLFxuICAgICAgb25Nc2c6IChtZXNzYWdlOiBVUEkuSVJlc3VsdEl0ZW0pID0+IHtcbiAgICAgICAgaWYgKG1lc3NhZ2VUeXBlcy5pbmNsdWRlcyhtZXNzYWdlLnNldmVyaXR5KSkge1xuICAgICAgICAgIG1lc3NhZ2VzLnB1c2gobWVzc2FnZSlcbiAgICAgICAgICB0aGlzLnVwaS5zZXRNZXNzYWdlcyhtZXNzYWdlcylcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIG9uUHJvZ3Jlc3M6XG4gICAgICAgIGNhbkNhbmNlbFxuICAgICAgICA/IChwcm9ncmVzczogbnVtYmVyKSA9PiB0aGlzLnVwaS5zZXRTdGF0dXMoe3N0YXR1czogJ3Byb2dyZXNzJywgcHJvZ3Jlc3MsIGRldGFpbDogJyd9KVxuICAgICAgICA6IHVuZGVmaW5lZFxuICAgIH0pXG4gICAgY2FuY2VsQWN0aW9uRGlzcCAmJiBjYW5jZWxBY3Rpb25EaXNwLmRpc3Bvc2UoKVxuICB9XG59XG4iXX0=