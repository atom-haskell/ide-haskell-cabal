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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaWRlLWJhY2tlbmQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaWRlLWJhY2tlbmQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUFBLDZCQUE0QjtBQUU1QiwrQkFBaUQ7QUFDakQsdUNBQXNDO0FBQ3RDLDJDQUEwQztBQUsxQyxxQkFBc0IsSUFBMkM7SUFDL0QsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksSUFBSSxJQUFJLENBQUMsTUFBTSxFQUFFLElBQUksSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFBO0FBQzNFLENBQUM7QUFFRDtJQUlFLFlBQWEsR0FBeUI7UUFEOUIsWUFBTyxHQUFZLEtBQUssQ0FBQTtRQUU5QixJQUFJLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQztZQUNiLElBQUksRUFBRSxtQkFBbUI7WUFDekIsWUFBWSxFQUFFO2dCQUNaLEtBQUssRUFBRSxFQUFFO2dCQUNULE9BQU8sRUFBRSxFQUFFO2dCQUNYLEtBQUssRUFBRTtvQkFDTCxTQUFTLEVBQUUsS0FBSztvQkFDaEIsVUFBVSxFQUFFLElBQUk7aUJBQ2pCO2dCQUNELElBQUksRUFBRTtvQkFDSixTQUFTLEVBQUUsS0FBSztvQkFDaEIsVUFBVSxFQUFFLElBQUk7aUJBQ2pCO2FBQ0Y7WUFDRCxJQUFJLEVBQUU7Z0JBQ0osS0FBSyxFQUFFLFNBQVM7Z0JBQ2hCLElBQUksRUFBRTtvQkFDSixFQUFDLEtBQUssRUFBRSxlQUFlLEVBQUUsT0FBTyxFQUFFLHlCQUF5QixFQUFDO29CQUM1RCxFQUFDLEtBQUssRUFBRSxlQUFlLEVBQUUsT0FBTyxFQUFFLHlCQUF5QixFQUFDO29CQUM1RCxFQUFDLEtBQUssRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFFLHdCQUF3QixFQUFDO29CQUNsRCxFQUFDLEtBQUssRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLHlCQUF5QixFQUFDO29CQUNwRCxF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QUFrRCxDQUFBO1lBRXRELE1BQU0sSUFBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLEVBQUU7Z0JBQzdCLFFBQVEsRUFBRSxlQUFlO2dCQUN6QixlQUFlLEVBQ1gsU0FBUztvQkFDVCxDQUFDLE1BQWtCO3dCQUNqQixnQkFBZ0IsSUFBSSxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsQ0FBQTt3QkFDOUMsZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxlQUFlLENBQUM7NEJBQzFDLE9BQU8sRUFBRSxvQkFBb0I7NEJBQzdCLElBQUksRUFBRTtnQ0FDSixPQUFPLEVBQUUsQ0FBQyxRQUFRLENBQUM7Z0NBQ25CLE1BQU0sRUFBRTtvQ0FDTixLQUFLLEVBQUUsTUFBTTtpQ0FDZDs2QkFDRjt5QkFDRixDQUFDLENBQUE7b0JBQ0osQ0FBQyxHQUFHLFNBQVM7Z0JBQ2pCLEtBQUssRUFBRSxDQUFDLE9BQXdCO29CQUM5QixFQUFFLENBQUMsQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7d0JBQzVDLFFBQVEsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUE7d0JBQ3RCLElBQUksQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUFBO29CQUNoQyxDQUFDO2dCQUNILENBQUM7Z0JBQ0QsVUFBVSxFQUNSLFNBQVM7c0JBQ1AsQ0FBQyxRQUFnQixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLEVBQUMsTUFBTSxFQUFFLFVBQVUsRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFLEVBQUUsRUFBQyxDQUFDO3NCQUNwRixTQUFTO2FBQ2QsQ0FBQyxDQUFBO1lBQ0YsZ0JBQWdCLElBQUksZ0JBQWdCLENBQUMsT0FBTyxFQUFFLENBQUE7UUFDaEQsQ0FBQztLQUFBO0NBQ0Y7QUE3VEQsZ0NBNlRDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJ1xuaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMnXG5pbXBvcnQge0NvbXBvc2l0ZURpc3Bvc2FibGUsIEVtaXR0ZXJ9IGZyb20gJ2F0b20nXG5pbXBvcnQgKiBhcyBCdWlsZGVycyBmcm9tICcuL2J1aWxkZXJzJ1xuaW1wb3J0ICogYXMgVXRpbCBmcm9tICdhdG9tLWhhc2tlbGwtdXRpbHMnXG5pbXBvcnQge1RhcmdldFBhcmFtVHlwZSwgQ2FiYWxDb21tYW5kfSBmcm9tICcuL2NvbW1vbidcblxuaW50ZXJmYWNlIEJ1aWxkZXJQYXJhbVR5cGUge25hbWU6IHN0cmluZ31cblxuZnVuY3Rpb24gaXNDYWJhbEZpbGUgKGZpbGU/OiBBdG9tVHlwZXMuRmlsZSB8IEF0b21UeXBlcy5EaXJlY3RvcnkpOiBmaWxlIGlzIEF0b21UeXBlcy5GaWxlIHtcbiAgcmV0dXJuICEhKGZpbGUgJiYgZmlsZS5pc0ZpbGUoKSAmJiBmaWxlLmdldEJhc2VOYW1lKCkuZW5kc1dpdGgoJy5jYWJhbCcpKVxufVxuXG5leHBvcnQgY2xhc3MgSWRlQmFja2VuZCB7XG4gIHByaXZhdGUgZGlzcG9zYWJsZXM6IENvbXBvc2l0ZURpc3Bvc2FibGVcbiAgcHJpdmF0ZSB1cGk6IFVQSS5JVVBJSW5zdGFuY2VcbiAgcHJpdmF0ZSBydW5uaW5nOiBib29sZWFuID0gZmFsc2VcbiAgY29uc3RydWN0b3IgKHJlZzogVVBJLklVUElSZWdpc3RyYXRpb24pIHtcbiAgICB0aGlzLnVwaSA9IHJlZyh7XG4gICAgICBuYW1lOiAnaWRlLWhhc2tlbGwtY2FiYWwnLFxuICAgICAgbWVzc2FnZVR5cGVzOiB7XG4gICAgICAgIGVycm9yOiB7fSxcbiAgICAgICAgd2FybmluZzoge30sXG4gICAgICAgIGJ1aWxkOiB7XG4gICAgICAgICAgdXJpRmlsdGVyOiBmYWxzZSxcbiAgICAgICAgICBhdXRvU2Nyb2xsOiB0cnVlXG4gICAgICAgIH0sXG4gICAgICAgIHRlc3Q6IHtcbiAgICAgICAgICB1cmlGaWx0ZXI6IGZhbHNlLFxuICAgICAgICAgIGF1dG9TY3JvbGw6IHRydWVcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICBtZW51OiB7XG4gICAgICAgIGxhYmVsOiAnQnVpbGRlcicsXG4gICAgICAgIG1lbnU6IFtcbiAgICAgICAgICB7bGFiZWw6ICdCdWlsZCBQcm9qZWN0JywgY29tbWFuZDogJ2lkZS1oYXNrZWxsLWNhYmFsOmJ1aWxkJ30sXG4gICAgICAgICAge2xhYmVsOiAnQ2xlYW4gUHJvamVjdCcsIGNvbW1hbmQ6ICdpZGUtaGFza2VsbC1jYWJhbDpjbGVhbid9LFxuICAgICAgICAgIHtsYWJlbDogJ1Rlc3QnLCBjb21tYW5kOiAnaWRlLWhhc2tlbGwtY2FiYWw6dGVzdCd9LFxuICAgICAgICAgIHtsYWJlbDogJ0JlbmNoJywgY29tbWFuZDogJ2lkZS1oYXNrZWxsLWNhYmFsOmJlbmNoJ30sXG4gICAgICAgICAge2xhYmVsOiAnQnVpbGQgRGVwZW5kZW5jaWVzJywgY29tbWFuZDogJ2lkZS1oYXNrZWxsLWNhYmFsOmJ1aWxkLWRlcGVuZGVuY2llcyd9LFxuICAgICAgICAgIHtsYWJlbDogJ1NldCBCdWlsZCBUYXJnZXQnLCBjb21tYW5kOiAnaWRlLWhhc2tlbGwtY2FiYWw6c2V0LWJ1aWxkLXRhcmdldCd9LFxuICAgICAgICBdXG4gICAgICB9LFxuICAgICAgcGFyYW1zOiB7XG4gICAgICAgIGJ1aWxkZXI6IHRoaXMuYnVpbGRlclBhcmFtSW5mbygpLFxuICAgICAgICB0YXJnZXQ6IHRoaXMudGFyZ2V0UGFyYW1JbmZvKClcbiAgICAgIH1cbiAgICB9KVxuXG4gICAgdGhpcy5kaXNwb3NhYmxlcyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKClcblxuICAgIHRoaXMuZGlzcG9zYWJsZXMuYWRkKGF0b20uY29tbWFuZHMuYWRkKCdhdG9tLXdvcmtzcGFjZScsIHtcbiAgICAgICdpZGUtaGFza2VsbC1jYWJhbDpidWlsZCc6ICgpID0+XG4gICAgICAgIHRoaXMuYnVpbGQoKSxcbiAgICAgICdpZGUtaGFza2VsbC1jYWJhbDpjbGVhbic6ICgpID0+XG4gICAgICAgIHRoaXMuY2xlYW4oKSxcbiAgICAgICdpZGUtaGFza2VsbC1jYWJhbDp0ZXN0JzogKCkgPT5cbiAgICAgICAgdGhpcy50ZXN0KCksXG4gICAgICAnaWRlLWhhc2tlbGwtY2FiYWw6YmVuY2gnOiAoKSA9PlxuICAgICAgICB0aGlzLmJlbmNoKCksXG4gICAgICAnaWRlLWhhc2tlbGwtY2FiYWw6YnVpbGQtZGVwZW5kZW5jaWVzJzogKCkgPT5cbiAgICAgICAgdGhpcy5kZXBlbmRlbmNpZXMoKSxcbiAgICAgICdpZGUtaGFza2VsbC1jYWJhbDpzZXQtYnVpbGQtdGFyZ2V0JzogYXN5bmMgKCkgPT5cbiAgICAgICAgdGhpcy51cGkuc2V0Q29uZmlnUGFyYW0oJ3RhcmdldCcpLFxuICAgICAgJ2lkZS1oYXNrZWxsLWNhYmFsOnNldC1hY3RpdmUtYnVpbGRlcic6IGFzeW5jICgpID0+XG4gICAgICAgIHRoaXMudXBpLnNldENvbmZpZ1BhcmFtKCdidWlsZGVyJyksXG4gICAgICB9KVxuICAgIClcbiAgICB0aGlzLmRpc3Bvc2FibGVzLmFkZCh0aGlzLnVwaSlcbiAgfVxuXG4gIHB1YmxpYyBkZXN0cm95ICgpIHtcbiAgICB0aGlzLmRpc3Bvc2FibGVzLmRpc3Bvc2UoKVxuICB9XG5cbiAgcHVibGljIGJ1aWxkICgpIHtcbiAgICB0aGlzLnJ1bkNhYmFsQ29tbWFuZCgnYnVpbGQnLCB7XG4gICAgICBtZXNzYWdlVHlwZXM6IFsnZXJyb3InLCAnd2FybmluZycsICdidWlsZCddLFxuICAgICAgZGVmYXVsdFNldmVyaXR5OiAnYnVpbGQnLFxuICAgICAgY2FuQ2FuY2VsOiB0cnVlLFxuICAgIH0pXG4gIH1cblxuICBwdWJsaWMgY2xlYW4gKCkge1xuICAgIHRoaXMucnVuQ2FiYWxDb21tYW5kKCdjbGVhbicsIHtcbiAgICAgIG1lc3NhZ2VUeXBlczogWydidWlsZCddLFxuICAgICAgZGVmYXVsdFNldmVyaXR5OiAnYnVpbGQnLFxuICAgICAgY2FuQ2FuY2VsOiBmYWxzZSxcbiAgICB9KVxuICB9XG5cbiAgcHVibGljIHRlc3QgKCkge1xuICAgIHRoaXMucnVuQ2FiYWxDb21tYW5kKCd0ZXN0Jywge1xuICAgICAgbWVzc2FnZVR5cGVzOiBbJ2Vycm9yJywgJ3dhcm5pbmcnLCAnYnVpbGQnLCAndGVzdCddLFxuICAgICAgZGVmYXVsdFNldmVyaXR5OiAndGVzdCcsXG4gICAgICBjYW5DYW5jZWw6IHRydWUsXG4gICAgfSlcbiAgfVxuXG4gIHB1YmxpYyBiZW5jaCAoKSB7XG4gICAgdGhpcy5ydW5DYWJhbENvbW1hbmQoJ2JlbmNoJywge1xuICAgICAgbWVzc2FnZVR5cGVzOiBbJ2Vycm9yJywgJ3dhcm5pbmcnLCAnYnVpbGQnLCAndGVzdCddLFxuICAgICAgZGVmYXVsdFNldmVyaXR5OiAndGVzdCcsXG4gICAgICBjYW5DYW5jZWw6IHRydWUsXG4gICAgfSlcbiAgfVxuXG4gIHB1YmxpYyBkZXBlbmRlbmNpZXMgKCkge1xuICAgIHRoaXMucnVuQ2FiYWxDb21tYW5kKCdkZXBzJywge1xuICAgICAgbWVzc2FnZVR5cGVzOiBbJ2J1aWxkJ10sXG4gICAgICBkZWZhdWx0U2V2ZXJpdHk6ICdidWlsZCcsXG4gICAgICBjYW5DYW5jZWw6IHRydWUsXG4gICAgfSlcbiAgfVxuXG4gIHByaXZhdGUgYnVpbGRlclBhcmFtSW5mbyAoKTogVVBJLklQYXJhbVNwZWM8QnVpbGRlclBhcmFtVHlwZT4ge1xuICAgIHJldHVybiB7XG4gICAgICBpdGVtczogKCk6IEJ1aWxkZXJQYXJhbVR5cGVbXSA9PiB7XG4gICAgICAgIGNvbnN0IGJ1aWxkZXJzID0gW3tuYW1lOiAnY2FiYWwnfSwge25hbWU6ICdzdGFjayd9XVxuICAgICAgICBpZiAoYXRvbS5jb25maWcuZ2V0KCdpZGUtaGFza2VsbC1jYWJhbC5lbmFibGVOaXhCdWlsZCcpKSB7XG4gICAgICAgICAgYnVpbGRlcnMucHVzaCh7bmFtZTogJ2NhYmFsLW5peCd9KVxuICAgICAgICB9XG4gICAgICAgIGJ1aWxkZXJzLnB1c2goe25hbWU6ICdub25lJ30pXG4gICAgICAgIHJldHVybiBidWlsZGVyc1xuICAgICAgfSxcbiAgICAgIGl0ZW1UZW1wbGF0ZTogKGl0ZW06IEJ1aWxkZXJQYXJhbVR5cGUpID0+IGA8bGk+PGRpdiBjbGFzcz0nbmFtZSc+JHtpdGVtLm5hbWV9PC9kaXY+PC9saT5gLFxuICAgICAgZGlzcGxheVRlbXBsYXRlOiAoaXRlbTogQnVpbGRlclBhcmFtVHlwZSkgPT4gaXRlbSAmJiBpdGVtLm5hbWUgPyBpdGVtLm5hbWUgOiAnTm90IHNldCcsXG4gICAgICBpdGVtRmlsdGVyS2V5OiAnbmFtZScsXG4gICAgICBkZXNjcmlwdGlvbjogJ1NlbGVjdCBidWlsZGVyIHRvIHVzZSB3aXRoIGN1cnJlbnQgcHJvamVjdCdcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHRhcmdldFBhcmFtSW5mbyAoKTogVVBJLklQYXJhbVNwZWM8VGFyZ2V0UGFyYW1UeXBlPiB7XG4gICAgY29uc3QgZGVmYXVsdFZhbCA9IHtcbiAgICAgIHByb2plY3Q6ICdBdXRvJyxcbiAgICAgIGNvbXBvbmVudDogdW5kZWZpbmVkLFxuICAgICAgZGlyOiB1bmRlZmluZWQsXG4gICAgICB0YXJnZXQ6IHVuZGVmaW5lZFxuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgZGVmYXVsdDogZGVmYXVsdFZhbCxcbiAgICAgIGl0ZW1zOiBhc3luYyAoKTogUHJvbWlzZTxUYXJnZXRQYXJhbVR5cGVbXT4gPT4ge1xuICAgICAgICBjb25zdCBwcm9qZWN0czogVGFyZ2V0UGFyYW1UeXBlW10gPSBbZGVmYXVsdFZhbF1cbiAgICAgICAgZm9yIChjb25zdCBkIG9mIGF0b20ucHJvamVjdC5nZXREaXJlY3RvcmllcygpKSB7XG4gICAgICAgICAgY29uc3QgZGlyID0gZC5nZXRQYXRoKClcbiAgICAgICAgICBjb25zdCBbY2FiYWxGaWxlXSA9IChhd2FpdCBVdGlsLmdldFJvb3REaXIoZGlyKSkuZ2V0RW50cmllc1N5bmMoKS5maWx0ZXIoaXNDYWJhbEZpbGUpXG4gICAgICAgICAgaWYgKGNhYmFsRmlsZSAmJiBjYWJhbEZpbGUuaXNGaWxlKCkpIHtcbiAgICAgICAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCBjYWJhbEZpbGUucmVhZCgpXG4gICAgICAgICAgICBjb25zdCBwcm9qZWN0ID0gYXdhaXQgVXRpbC5wYXJzZURvdENhYmFsKGRhdGEpXG4gICAgICAgICAgICBpZiAocHJvamVjdCkge1xuICAgICAgICAgICAgICBwcm9qZWN0cy5wdXNoKHtwcm9qZWN0OiBwcm9qZWN0Lm5hbWUsIGRpciwgY29tcG9uZW50OiB1bmRlZmluZWQsIHRhcmdldDogdW5kZWZpbmVkfSlcbiAgICAgICAgICAgICAgZm9yIChjb25zdCB0YXJnZXQgb2YgcHJvamVjdC50YXJnZXRzKSB7XG4gICAgICAgICAgICAgICAgcHJvamVjdHMucHVzaCh7cHJvamVjdDogcHJvamVjdC5uYW1lLCBkaXIsIHRhcmdldCwgY29tcG9uZW50OiB0YXJnZXQudGFyZ2V0fSlcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcHJvamVjdHNcbiAgICAgIH0sXG4gICAgICBpdGVtVGVtcGxhdGU6ICh0Z3Q6IFRhcmdldFBhcmFtVHlwZSkgPT5cbiAgICAgICAgYDxsaT5cbiAgICAgICAgICA8ZGl2IGNsYXNzPSdwcm9qZWN0Jz4ke3RndC5wcm9qZWN0fTwvZGl2PlxuICAgICAgICAgIDxkaXYgY2xhc3M9J2Rpcic+JHt0Z3QuZGlyIHx8ICcnfTwvZGl2PlxuICAgICAgICAgICR7XG4gICAgICAgICAgICB0Z3QudGFyZ2V0ID9cbiAgICAgICAgICAgIGBcbiAgICAgICAgICAgIDxkaXYgY2xhc3M9J3R5cGUnPiR7dGd0LnRhcmdldC50eXBlfTwvZGl2PlxuICAgICAgICAgICAgPGRpdiBjbGFzcz0nbmFtZSc+JHt0Z3QudGFyZ2V0Lm5hbWV9PC9kaXY+XG4gICAgICAgICAgICBgIDpcbiAgICAgICAgICAgIGA8ZGl2IGNsYXNzPSduYW1lJz4keydBbGwnfTwvZGl2PmBcbiAgICAgICAgICB9XG4gICAgICAgICAgPGRpdiBjbGFzcz0nY2xlYXJmaXgnPjwvZGl2PlxuICAgICAgICA8L2xpPmAsXG4gICAgICBkaXNwbGF5VGVtcGxhdGU6IChpdGVtOiBUYXJnZXRQYXJhbVR5cGUpID0+IHtcbiAgICAgICAgaWYgKCFpdGVtLmRpcikge1xuICAgICAgICAgIHJldHVybiBpdGVtLnByb2plY3RcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gYCR7aXRlbS5wcm9qZWN0fTogJHtpdGVtLnRhcmdldCA/IGl0ZW0udGFyZ2V0Lm5hbWUgOiAnQWxsJ31gXG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBpdGVtRmlsdGVyS2V5OiAnbmFtZScsXG4gICAgICBkZXNjcmlwdGlvbjogJ1NlbGVjdCB0YXJnZXQgdG8gYnVpbGQnXG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBnZXRBY3RpdmVQcm9qZWN0UGF0aCAoKTogc3RyaW5nIHtcbiAgICBjb25zdCBlZGl0b3IgPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKClcbiAgICBpZiAoZWRpdG9yICYmIGVkaXRvci5nZXRQYXRoKCkpIHtcbiAgICAgIHJldHVybiBwYXRoLmRpcm5hbWUoZWRpdG9yLmdldFBhdGgoKSlcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGF0b20ucHJvamVjdC5nZXRQYXRocygpWzBdIHx8IHByb2Nlc3MuY3dkKClcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGdldEFjdGl2ZVByb2plY3RUYXJnZXQgKGNhYmFsZmlsZTogc3RyaW5nLCBjYWJhbFJvb3Q6IEF0b21UeXBlcy5EaXJlY3RvcnkpIHtcbiAgICBjb25zdCBlZGl0b3IgPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKClcbiAgICBpZiAoZWRpdG9yICYmIGVkaXRvci5nZXRQYXRoKCkpIHtcbiAgICAgIHJldHVybiBVdGlsLmdldENvbXBvbmVudEZyb21GaWxlKGNhYmFsZmlsZSwgY2FiYWxSb290LnJlbGF0aXZpemUoZWRpdG9yLmdldFBhdGgoKSkpXG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBbXVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgY2FiYWxCdWlsZCAoY21kOiBDYWJhbENvbW1hbmQsIG9wdHM6IEJ1aWxkZXJzLklQYXJhbXMpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0cnkge1xuICAgICAgaWYgKHRoaXMucnVubmluZykge1xuICAgICAgICB0aGlzLnVwaS5zZXRTdGF0dXMoe3N0YXR1czogJ3dhcm5pbmcnLCBkZXRhaWw6ICdCdWlsZGVyIGFscmVhZHkgcnVubmluZyd9KVxuICAgICAgICByZXR1cm5cbiAgICAgIH1cbiAgICAgIHRoaXMucnVubmluZyA9IHRydWVcblxuICAgICAgY29uc3QgYnVpbGRlclBhcmFtID0gYXdhaXQgdGhpcy51cGkuZ2V0Q29uZmlnUGFyYW08QnVpbGRlclBhcmFtVHlwZT4oJ2J1aWxkZXInKVxuICAgICAgY29uc3QgdGFyZ2V0ID0gYXdhaXQgdGhpcy51cGkuZ2V0Q29uZmlnUGFyYW08VGFyZ2V0UGFyYW1UeXBlPigndGFyZ2V0JylcblxuICAgICAgaWYgKHRhcmdldCA9PT0gdW5kZWZpbmVkKSB7IHRocm93IG5ldyBFcnJvcignVGFyZ2V0IHVuZGVmaW5lZCcpIH1cbiAgICAgIGlmIChidWlsZGVyUGFyYW0gPT09IHVuZGVmaW5lZCkgeyB0aHJvdyBuZXcgRXJyb3IoJ0J1aWxkZXIgdW5kZWZpbmVkJykgfVxuXG4gICAgICB0aGlzLnVwaS5zZXRTdGF0dXMoe1xuICAgICAgICBzdGF0dXM6ICdwcm9ncmVzcycsXG4gICAgICAgIHByb2dyZXNzOiBvcHRzLm9uUHJvZ3Jlc3MgPyAwLjAgOiB1bmRlZmluZWQsXG4gICAgICAgIGRldGFpbDogJydcbiAgICAgIH0pXG5cbiAgICAgIGNvbnN0IGNhYmFsUm9vdCA9IGF3YWl0IFV0aWwuZ2V0Um9vdERpcih0YXJnZXQuZGlyID8gdGFyZ2V0LmRpciA6IHRoaXMuZ2V0QWN0aXZlUHJvamVjdFBhdGgoKSlcblxuICAgICAgY29uc3QgW2NhYmFsRmlsZV06IEF0b21UeXBlcy5GaWxlW10gPSBjYWJhbFJvb3QuZ2V0RW50cmllc1N5bmMoKS5maWx0ZXIoaXNDYWJhbEZpbGUpXG5cbiAgICAgIGlmICghY2FiYWxGaWxlKSB7IHRocm93IG5ldyBFcnJvcignTm8gY2FiYWwgZmlsZSBmb3VuZCcpIH1cblxuICAgICAgbGV0IG5ld1RhcmdldCA9IHsuLi50YXJnZXR9XG5cbiAgICAgIGlmICghIG5ld1RhcmdldC50YXJnZXQgJiYgWydidWlsZCcsICdkZXBzJ10uaW5jbHVkZXMoY21kKSkge1xuICAgICAgICBjb25zdCBjYWJhbENvbnRlbnRzID0gYXdhaXQgY2FiYWxGaWxlLnJlYWQoKVxuICAgICAgICBjb25zdCB0Z3RzID0gYXdhaXQgdGhpcy5nZXRBY3RpdmVQcm9qZWN0VGFyZ2V0KGNhYmFsQ29udGVudHMsIGNhYmFsUm9vdClcbiAgICAgICAgY29uc3QgW3RndF0gPSB0Z3RzXG4gICAgICAgIGlmICh0Z3QpIHtcbiAgICAgICAgICBjb25zdCBjZiA9IGF3YWl0IFV0aWwucGFyc2VEb3RDYWJhbChjYWJhbENvbnRlbnRzKVxuICAgICAgICAgIGlmIChjZikge1xuICAgICAgICAgICAgbmV3VGFyZ2V0ID0ge1xuICAgICAgICAgICAgICBwcm9qZWN0OiBjZi5uYW1lLFxuICAgICAgICAgICAgICBjb21wb25lbnQ6IHRndCxcbiAgICAgICAgICAgICAgZGlyOiBjYWJhbFJvb3QuZ2V0UGF0aCgpLFxuICAgICAgICAgICAgICB0YXJnZXQ6IHVuZGVmaW5lZFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgY29uc3QgYnVpbGRlcnM6IHtcbiAgICAgICAgW2s6IHN0cmluZ106XG4gICAgICAgICAgdHlwZW9mIEJ1aWxkZXJzLkNhYmFsTml4IHwgdHlwZW9mIEJ1aWxkZXJzLkNhYmFsIHwgdHlwZW9mIEJ1aWxkZXJzLlN0YWNrIHwgdHlwZW9mIEJ1aWxkZXJzLk5vbmUgfCB1bmRlZmluZWRcbiAgICAgIH0gPSB7XG4gICAgICAgICdjYWJhbC1uaXgnOiBCdWlsZGVycy5DYWJhbE5peCxcbiAgICAgICAgJ2NhYmFsJzogQnVpbGRlcnMuQ2FiYWwsXG4gICAgICAgICdzdGFjayc6IEJ1aWxkZXJzLlN0YWNrLFxuICAgICAgICAnbm9uZSc6IEJ1aWxkZXJzLk5vbmVcbiAgICAgIH1cbiAgICAgIGNvbnN0IGJ1aWxkZXIgPSBidWlsZGVyc1tidWlsZGVyUGFyYW0ubmFtZV1cblxuICAgICAgaWYgKGJ1aWxkZXIgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFVua25vd24gYnVpbGRlciAnJHsoYnVpbGRlclBhcmFtICYmIGJ1aWxkZXJQYXJhbS5uYW1lKSB8fCBidWlsZGVyUGFyYW19J2ApXG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IChuZXcgYnVpbGRlcih7b3B0cywgdGFyZ2V0LCBjYWJhbFJvb3R9KSkucnVuQ29tbWFuZChjbWQpXG4gICAgICAvLyBzZWUgQ2FiYWxQcm9jZXNzIGZvciBleHBsYWluYXRpb25cbiAgICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTogbm8tbnVsbC1rZXl3b3JkXG4gICAgICBpZiAocmVzLmV4aXRDb2RlID09PSBudWxsKSB7IC8vIHRoaXMgbWVhbnMgcHJvY2VzcyB3YXMga2lsbGVkXG4gICAgICAgIHRoaXMudXBpLnNldFN0YXR1cyh7c3RhdHVzOiAnd2FybmluZycsIGRldGFpbDogJ0J1aWxkIHdhcyBpbnRlcnJ1cHRlZCd9KVxuICAgICAgfSBlbHNlIGlmIChyZXMuZXhpdENvZGUgIT09IDApIHtcbiAgICAgICAgaWYgKHJlcy5oYXNFcnJvcikge1xuICAgICAgICAgIHRoaXMudXBpLnNldFN0YXR1cyh7c3RhdHVzOiAnd2FybmluZycsIGRldGFpbDogJ1RoZXJlIHdlcmUgZXJyb3JzIGluIHNvdXJjZSBmaWxlcyd9KVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMudXBpLnNldFN0YXR1cyh7XG4gICAgICAgICAgICBzdGF0dXM6ICdlcnJvcicsXG4gICAgICAgICAgICBkZXRhaWw6IGBCdWlsZGVyIHF1aXQgYWJub3JtYWxseSB3aXRoIGV4aXQgY29kZSAke3Jlcy5leGl0Q29kZX1gXG4gICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy51cGkuc2V0U3RhdHVzKHtzdGF0dXM6ICdyZWFkeScsIGRldGFpbDogJ0J1aWxkIHdhcyBzdWNjZXNzZnVsJ30pXG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGlmIChlcnJvcikge1xuICAgICAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6IG5vLWNvbnNvbGVcbiAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcilcbiAgICAgICAgdGhpcy51cGkuc2V0U3RhdHVzKHtzdGF0dXM6ICdlcnJvcicsIGRldGFpbDogZXJyb3IudG9TdHJpbmcoKX0pXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnVwaS5zZXRTdGF0dXMoe3N0YXR1czogJ3dhcm5pbmcnLCBkZXRhaWw6ICdCdWlsZCBmYWlsZWQgd2l0aCBubyBlcnJvcnMnfSlcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5ydW5uaW5nID0gZmFsc2VcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgcnVuQ2FiYWxDb21tYW5kIChcbiAgICBjb21tYW5kOiBDYWJhbENvbW1hbmQsXG4gICAge21lc3NhZ2VUeXBlcywgZGVmYXVsdFNldmVyaXR5LCBjYW5DYW5jZWx9OlxuICAgICAge21lc3NhZ2VUeXBlczogVVBJLlRTZXZlcml0eVtdLCBkZWZhdWx0U2V2ZXJpdHk6IFVQSS5UU2V2ZXJpdHksIGNhbkNhbmNlbDogYm9vbGVhbn1cbiAgKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgbWVzc2FnZXM6IFVQSS5JUmVzdWx0SXRlbVtdID0gW11cbiAgICB0aGlzLnVwaS5zZXRNZXNzYWdlcyhtZXNzYWdlcylcblxuICAgIGxldCBjYW5jZWxBY3Rpb25EaXNwOiBBdG9tVHlwZXMuRGlzcG9zYWJsZSB8IHVuZGVmaW5lZFxuXG4gICAgYXdhaXQgdGhpcy5jYWJhbEJ1aWxkKGNvbW1hbmQsIHtcbiAgICAgIHNldmVyaXR5OiBkZWZhdWx0U2V2ZXJpdHksXG4gICAgICBzZXRDYW5jZWxBY3Rpb246XG4gICAgICAgICAgY2FuQ2FuY2VsID9cbiAgICAgICAgICAoYWN0aW9uOiAoKSA9PiB2b2lkKSA9PiB7XG4gICAgICAgICAgICBjYW5jZWxBY3Rpb25EaXNwICYmIGNhbmNlbEFjdGlvbkRpc3AuZGlzcG9zZSgpXG4gICAgICAgICAgICBjYW5jZWxBY3Rpb25EaXNwID0gdGhpcy51cGkuYWRkUGFuZWxDb250cm9sKHtcbiAgICAgICAgICAgICAgZWxlbWVudDogJ2lkZS1oYXNrZWxsLWJ1dHRvbicsXG4gICAgICAgICAgICAgIG9wdHM6IHtcbiAgICAgICAgICAgICAgICBjbGFzc2VzOiBbJ2NhbmNlbCddLFxuICAgICAgICAgICAgICAgIGV2ZW50czoge1xuICAgICAgICAgICAgICAgICAgY2xpY2s6IGFjdGlvblxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICB9IDogdW5kZWZpbmVkLFxuICAgICAgb25Nc2c6IChtZXNzYWdlOiBVUEkuSVJlc3VsdEl0ZW0pID0+IHtcbiAgICAgICAgaWYgKG1lc3NhZ2VUeXBlcy5pbmNsdWRlcyhtZXNzYWdlLnNldmVyaXR5KSkge1xuICAgICAgICAgIG1lc3NhZ2VzLnB1c2gobWVzc2FnZSlcbiAgICAgICAgICB0aGlzLnVwaS5zZXRNZXNzYWdlcyhtZXNzYWdlcylcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIG9uUHJvZ3Jlc3M6XG4gICAgICAgIGNhbkNhbmNlbFxuICAgICAgICA/IChwcm9ncmVzczogbnVtYmVyKSA9PiB0aGlzLnVwaS5zZXRTdGF0dXMoe3N0YXR1czogJ3Byb2dyZXNzJywgcHJvZ3Jlc3MsIGRldGFpbDogJyd9KVxuICAgICAgICA6IHVuZGVmaW5lZFxuICAgIH0pXG4gICAgY2FuY2VsQWN0aW9uRGlzcCAmJiBjYW5jZWxBY3Rpb25EaXNwLmRpc3Bvc2UoKVxuICB9XG59XG4iXX0=