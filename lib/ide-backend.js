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
                return (new builder({ opts, target, cabalRoot })).runCommand(cmd);
            }
            catch (error) {
                if (error) {
                    console.error(error);
                    atom.notifications.addFatalError(error.toString(), { detail: error, dismissable: true });
                }
                return { exitCode: -127, hasError: false };
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
            const { exitCode, hasError } = yield this.cabalBuild(command, {
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
                                },
                                before: '#progressBar'
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
            this.upi.setStatus({ status: 'ready', detail: '' });
            if (exitCode !== 0) {
                if (hasError) {
                    this.upi.setStatus({ status: 'warning', detail: '' });
                }
                else {
                    this.upi.setStatus({ status: 'error', detail: '' });
                }
            }
        });
    }
}
exports.IdeBackend = IdeBackend;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaWRlLWJhY2tlbmQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaWRlLWJhY2tlbmQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUFBLDZCQUE0QjtBQUU1QiwrQkFBaUQ7QUFDakQsdUNBQXNDO0FBQ3RDLDJDQUEwQztBQUsxQyxxQkFBc0IsSUFBMkM7SUFDL0QsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksSUFBSSxJQUFJLENBQUMsTUFBTSxFQUFFLElBQUksSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFBO0FBQzNFLENBQUM7QUFFRDtJQUlFLFlBQWEsR0FBeUI7UUFEOUIsWUFBTyxHQUFZLEtBQUssQ0FBQTtRQUU5QixJQUFJLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQztZQUNiLElBQUksRUFBRSxtQkFBbUI7WUFDekIsWUFBWSxFQUFFO2dCQUNaLEtBQUssRUFBRSxFQUFFO2dCQUNULE9BQU8sRUFBRSxFQUFFO2dCQUNYLEtBQUssRUFBRTtvQkFDTCxTQUFTLEVBQUUsS0FBSztvQkFDaEIsVUFBVSxFQUFFLElBQUk7aUJBQ2pCO2dCQUNELElBQUksRUFBRTtvQkFDSixTQUFTLEVBQUUsS0FBSztvQkFDaEIsVUFBVSxFQUFFLElBQUk7aUJBQ2pCO2FBQ0Y7WUFDRCxJQUFJLEVBQUU7Z0JBQ0osS0FBSyxFQUFFLFNBQVM7Z0JBQ2hCLElBQUksRUFBRTtvQkFDSixFQUFDLEtBQUssRUFBRSxlQUFlLEVBQUUsT0FBTyxFQUFFLHlCQUF5QixFQUFDO29CQUM1RCxFQUFDLEtBQUssRUFBRSxlQUFlLEVBQUUsT0FBTyxFQUFFLHlCQUF5QixFQUFDO29CQUM1RCxFQUFDLEtBQUssRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFFLHdCQUF3QixFQUFDO29CQUNsRCxFQUFDLEtBQUssRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLHlCQUF5QixFQUFDO29CQUNwRCxF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QTtZQUVqRCxFQUFFLENBQUMsQ0FBQyxRQUFRLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDbkIsRUFBRSxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztvQkFDYixJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxFQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUUsTUFBTSxFQUFFLEVBQUUsRUFBQyxDQUFDLENBQUE7Z0JBQ3JELENBQUM7Z0JBQUMsSUFBSSxDQUFDLENBQUM7b0JBQ04sSUFBSSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsRUFBQyxNQUFNLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFLEVBQUMsQ0FBQyxDQUFBO2dCQUNuRCxDQUFDO1lBQ0gsQ0FBQztRQUNILENBQUM7S0FBQTtDQUNGO0FBdlRELGdDQXVUQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCdcbmltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzJ1xuaW1wb3J0IHtDb21wb3NpdGVEaXNwb3NhYmxlLCBFbWl0dGVyfSBmcm9tICdhdG9tJ1xuaW1wb3J0ICogYXMgQnVpbGRlcnMgZnJvbSAnLi9idWlsZGVycydcbmltcG9ydCAqIGFzIFV0aWwgZnJvbSAnYXRvbS1oYXNrZWxsLXV0aWxzJ1xuaW1wb3J0IHtUYXJnZXRQYXJhbVR5cGUsIENhYmFsQ29tbWFuZH0gZnJvbSAnLi9jb21tb24nXG5cbmludGVyZmFjZSBCdWlsZGVyUGFyYW1UeXBlIHtuYW1lOiBzdHJpbmd9XG5cbmZ1bmN0aW9uIGlzQ2FiYWxGaWxlIChmaWxlPzogQXRvbVR5cGVzLkZpbGUgfCBBdG9tVHlwZXMuRGlyZWN0b3J5KTogZmlsZSBpcyBBdG9tVHlwZXMuRmlsZSB7XG4gIHJldHVybiAhIShmaWxlICYmIGZpbGUuaXNGaWxlKCkgJiYgZmlsZS5nZXRCYXNlTmFtZSgpLmVuZHNXaXRoKCcuY2FiYWwnKSlcbn1cblxuZXhwb3J0IGNsYXNzIElkZUJhY2tlbmQge1xuICBwcml2YXRlIGRpc3Bvc2FibGVzOiBDb21wb3NpdGVEaXNwb3NhYmxlXG4gIHByaXZhdGUgdXBpOiBVUEkuSVVQSUluc3RhbmNlXG4gIHByaXZhdGUgcnVubmluZzogYm9vbGVhbiA9IGZhbHNlXG4gIGNvbnN0cnVjdG9yIChyZWc6IFVQSS5JVVBJUmVnaXN0cmF0aW9uKSB7XG4gICAgdGhpcy51cGkgPSByZWcoe1xuICAgICAgbmFtZTogJ2lkZS1oYXNrZWxsLWNhYmFsJyxcbiAgICAgIG1lc3NhZ2VUeXBlczoge1xuICAgICAgICBlcnJvcjoge30sXG4gICAgICAgIHdhcm5pbmc6IHt9LFxuICAgICAgICBidWlsZDoge1xuICAgICAgICAgIHVyaUZpbHRlcjogZmFsc2UsXG4gICAgICAgICAgYXV0b1Njcm9sbDogdHJ1ZVxuICAgICAgICB9LFxuICAgICAgICB0ZXN0OiB7XG4gICAgICAgICAgdXJpRmlsdGVyOiBmYWxzZSxcbiAgICAgICAgICBhdXRvU2Nyb2xsOiB0cnVlXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgbWVudToge1xuICAgICAgICBsYWJlbDogJ0J1aWxkZXInLFxuICAgICAgICBtZW51OiBbXG4gICAgICAgICAge2xhYmVsOiAnQnVpbGQgUHJvamVjdCcsIGNvbW1hbmQ6ICdpZGUtaGFza2VsbC1jYWJhbDpidWlsZCd9LFxuICAgICAgICAgIHtsYWJlbDogJ0NsZWFuIFByb2plY3QnLCBjb21tYW5kOiAnaWRlLWhhc2tlbGwtY2FiYWw6Y2xlYW4nfSxcbiAgICAgICAgICB7bGFiZWw6ICdUZXN0JywgY29tbWFuZDogJ2lkZS1oYXNrZWxsLWNhYmFsOnRlc3QnfSxcbiAgICAgICAgICB7bGFiZWw6ICdCZW5jaCcsIGNvbW1hbmQ6ICdpZGUtaGFza2VsbC1jYWJhbDpiZW5jaCd9LFxuICAgICAgICAgIHtsYWJlbDogJ0J1aWxkIERlcGVuZGVuY2llcycsIGNvbW1hbmQ6ICdpZGUtaGFza2VsbC1jYWJhbDpidWlsZC1kZXBlbmRlbmNpZXMnfSxcbiAgICAgICAgICB7bGFiZWw6ICdTZXQgQnVpbGQgVGFyZ2V0JywgY29tbWFuZDogJ2lkZS1oYXNrZWxsLWNhYmFsOnNldC1idWlsZC10YXJnZXQnfSxcbiAgICAgICAgXVxuICAgICAgfSxcbiAgICAgIHBhcmFtczoge1xuICAgICAgICBidWlsZGVyOiB0aGlzLmJ1aWxkZXJQYXJhbUluZm8oKSxcbiAgICAgICAgdGFyZ2V0OiB0aGlzLnRhcmdldFBhcmFtSW5mbygpXG4gICAgICB9XG4gICAgfSlcblxuICAgIHRoaXMuZGlzcG9zYWJsZXMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpXG5cbiAgICB0aGlzLmRpc3Bvc2FibGVzLmFkZChhdG9tLmNvbW1hbmRzLmFkZCgnYXRvbS13b3Jrc3BhY2UnLCB7XG4gICAgICAnaWRlLWhhc2tlbGwtY2FiYWw6YnVpbGQnOiAoKSA9PlxuICAgICAgICB0aGlzLmJ1aWxkKCksXG4gICAgICAnaWRlLWhhc2tlbGwtY2FiYWw6Y2xlYW4nOiAoKSA9PlxuICAgICAgICB0aGlzLmNsZWFuKCksXG4gICAgICAnaWRlLWhhc2tlbGwtY2FiYWw6dGVzdCc6ICgpID0+XG4gICAgICAgIHRoaXMudGVzdCgpLFxuICAgICAgJ2lkZS1oYXNrZWxsLWNhYmFsOmJlbmNoJzogKCkgPT5cbiAgICAgICAgdGhpcy5iZW5jaCgpLFxuICAgICAgJ2lkZS1oYXNrZWxsLWNhYmFsOmJ1aWxkLWRlcGVuZGVuY2llcyc6ICgpID0+XG4gICAgICAgIHRoaXMuZGVwZW5kZW5jaWVzKCksXG4gICAgICAnaWRlLWhhc2tlbGwtY2FiYWw6c2V0LWJ1aWxkLXRhcmdldCc6IGFzeW5jICgpID0+XG4gICAgICAgIHRoaXMudXBpLnNldENvbmZpZ1BhcmFtKCd0YXJnZXQnKSxcbiAgICAgICdpZGUtaGFza2VsbC1jYWJhbDpzZXQtYWN0aXZlLWJ1aWxkZXInOiBhc3luYyAoKSA9PlxuICAgICAgICB0aGlzLnVwaS5zZXRDb25maWdQYXJhbSgnYnVpbGRlcicpLFxuICAgICAgfSlcbiAgICApXG4gICAgdGhpcy5kaXNwb3NhYmxlcy5hZGQodGhpcy51cGkpXG4gIH1cblxuICBwdWJsaWMgZGVzdHJveSAoKSB7XG4gICAgdGhpcy5kaXNwb3NhYmxlcy5kaXNwb3NlKClcbiAgfVxuXG4gIHB1YmxpYyBidWlsZCAoKSB7XG4gICAgdGhpcy5ydW5DYWJhbENvbW1hbmQoJ2J1aWxkJywge1xuICAgICAgbWVzc2FnZVR5cGVzOiBbJ2Vycm9yJywgJ3dhcm5pbmcnLCAnYnVpbGQnXSxcbiAgICAgIGRlZmF1bHRTZXZlcml0eTogJ2J1aWxkJyxcbiAgICAgIGNhbkNhbmNlbDogdHJ1ZSxcbiAgICB9KVxuICB9XG5cbiAgcHVibGljIGNsZWFuICgpIHtcbiAgICB0aGlzLnJ1bkNhYmFsQ29tbWFuZCgnY2xlYW4nLCB7XG4gICAgICBtZXNzYWdlVHlwZXM6IFsnYnVpbGQnXSxcbiAgICAgIGRlZmF1bHRTZXZlcml0eTogJ2J1aWxkJyxcbiAgICAgIGNhbkNhbmNlbDogZmFsc2UsXG4gICAgfSlcbiAgfVxuXG4gIHB1YmxpYyB0ZXN0ICgpIHtcbiAgICB0aGlzLnJ1bkNhYmFsQ29tbWFuZCgndGVzdCcsIHtcbiAgICAgIG1lc3NhZ2VUeXBlczogWydlcnJvcicsICd3YXJuaW5nJywgJ2J1aWxkJywgJ3Rlc3QnXSxcbiAgICAgIGRlZmF1bHRTZXZlcml0eTogJ3Rlc3QnLFxuICAgICAgY2FuQ2FuY2VsOiB0cnVlLFxuICAgIH0pXG4gIH1cblxuICBwdWJsaWMgYmVuY2ggKCkge1xuICAgIHRoaXMucnVuQ2FiYWxDb21tYW5kKCdiZW5jaCcsIHtcbiAgICAgIG1lc3NhZ2VUeXBlczogWydlcnJvcicsICd3YXJuaW5nJywgJ2J1aWxkJywgJ3Rlc3QnXSxcbiAgICAgIGRlZmF1bHRTZXZlcml0eTogJ3Rlc3QnLFxuICAgICAgY2FuQ2FuY2VsOiB0cnVlLFxuICAgIH0pXG4gIH1cblxuICBwdWJsaWMgZGVwZW5kZW5jaWVzICgpIHtcbiAgICB0aGlzLnJ1bkNhYmFsQ29tbWFuZCgnZGVwcycsIHtcbiAgICAgIG1lc3NhZ2VUeXBlczogWydidWlsZCddLFxuICAgICAgZGVmYXVsdFNldmVyaXR5OiAnYnVpbGQnLFxuICAgICAgY2FuQ2FuY2VsOiB0cnVlLFxuICAgIH0pXG4gIH1cblxuICBwcml2YXRlIGJ1aWxkZXJQYXJhbUluZm8gKCk6IFVQSS5JUGFyYW1TcGVjPEJ1aWxkZXJQYXJhbVR5cGU+IHtcbiAgICByZXR1cm4ge1xuICAgICAgaXRlbXM6ICgpOiBCdWlsZGVyUGFyYW1UeXBlW10gPT4ge1xuICAgICAgICBjb25zdCBidWlsZGVycyA9IFt7bmFtZTogJ2NhYmFsJ30sIHtuYW1lOiAnc3RhY2snfV1cbiAgICAgICAgaWYgKGF0b20uY29uZmlnLmdldCgnaWRlLWhhc2tlbGwtY2FiYWwuZW5hYmxlTml4QnVpbGQnKSkge1xuICAgICAgICAgIGJ1aWxkZXJzLnB1c2goe25hbWU6ICdjYWJhbC1uaXgnfSlcbiAgICAgICAgfVxuICAgICAgICBidWlsZGVycy5wdXNoKHtuYW1lOiAnbm9uZSd9KVxuICAgICAgICByZXR1cm4gYnVpbGRlcnNcbiAgICAgIH0sXG4gICAgICBpdGVtVGVtcGxhdGU6IChpdGVtOiBCdWlsZGVyUGFyYW1UeXBlKSA9PiBgPGxpPjxkaXYgY2xhc3M9J25hbWUnPiR7aXRlbS5uYW1lfTwvZGl2PjwvbGk+YCxcbiAgICAgIGRpc3BsYXlUZW1wbGF0ZTogKGl0ZW06IEJ1aWxkZXJQYXJhbVR5cGUpID0+IGl0ZW0gJiYgaXRlbS5uYW1lID8gaXRlbS5uYW1lIDogJ05vdCBzZXQnLFxuICAgICAgaXRlbUZpbHRlcktleTogJ25hbWUnLFxuICAgICAgZGVzY3JpcHRpb246ICdTZWxlY3QgYnVpbGRlciB0byB1c2Ugd2l0aCBjdXJyZW50IHByb2plY3QnXG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSB0YXJnZXRQYXJhbUluZm8gKCk6IFVQSS5JUGFyYW1TcGVjPFRhcmdldFBhcmFtVHlwZT4ge1xuICAgIGNvbnN0IGRlZmF1bHRWYWwgPSB7XG4gICAgICBwcm9qZWN0OiAnQXV0bycsXG4gICAgICBjb21wb25lbnQ6IHVuZGVmaW5lZCxcbiAgICAgIGRpcjogdW5kZWZpbmVkLFxuICAgICAgdGFyZ2V0OiB1bmRlZmluZWRcbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgIGRlZmF1bHQ6IGRlZmF1bHRWYWwsXG4gICAgICBpdGVtczogYXN5bmMgKCk6IFByb21pc2U8VGFyZ2V0UGFyYW1UeXBlW10+ID0+IHtcbiAgICAgICAgY29uc3QgcHJvamVjdHM6IFRhcmdldFBhcmFtVHlwZVtdID0gW2RlZmF1bHRWYWxdXG4gICAgICAgIGZvciAoY29uc3QgZCBvZiBhdG9tLnByb2plY3QuZ2V0RGlyZWN0b3JpZXMoKSkge1xuICAgICAgICAgIGNvbnN0IGRpciA9IGQuZ2V0UGF0aCgpXG4gICAgICAgICAgY29uc3QgW2NhYmFsRmlsZV0gPSAoYXdhaXQgVXRpbC5nZXRSb290RGlyKGRpcikpLmdldEVudHJpZXNTeW5jKCkuZmlsdGVyKGlzQ2FiYWxGaWxlKVxuICAgICAgICAgIGlmIChjYWJhbEZpbGUgJiYgY2FiYWxGaWxlLmlzRmlsZSgpKSB7XG4gICAgICAgICAgICBjb25zdCBkYXRhID0gYXdhaXQgY2FiYWxGaWxlLnJlYWQoKVxuICAgICAgICAgICAgY29uc3QgcHJvamVjdCA9IGF3YWl0IFV0aWwucGFyc2VEb3RDYWJhbChkYXRhKVxuICAgICAgICAgICAgaWYgKHByb2plY3QpIHtcbiAgICAgICAgICAgICAgcHJvamVjdHMucHVzaCh7cHJvamVjdDogcHJvamVjdC5uYW1lLCBkaXIsIGNvbXBvbmVudDogdW5kZWZpbmVkLCB0YXJnZXQ6IHVuZGVmaW5lZH0pXG4gICAgICAgICAgICAgIGZvciAoY29uc3QgdGFyZ2V0IG9mIHByb2plY3QudGFyZ2V0cykge1xuICAgICAgICAgICAgICAgIHByb2plY3RzLnB1c2goe3Byb2plY3Q6IHByb2plY3QubmFtZSwgZGlyLCB0YXJnZXQsIGNvbXBvbmVudDogdGFyZ2V0LnRhcmdldH0pXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHByb2plY3RzXG4gICAgICB9LFxuICAgICAgaXRlbVRlbXBsYXRlOiAodGd0OiBUYXJnZXRQYXJhbVR5cGUpID0+XG4gICAgICAgIGA8bGk+XG4gICAgICAgICAgPGRpdiBjbGFzcz0ncHJvamVjdCc+JHt0Z3QucHJvamVjdH08L2Rpdj5cbiAgICAgICAgICA8ZGl2IGNsYXNzPSdkaXInPiR7dGd0LmRpciB8fCAnJ308L2Rpdj5cbiAgICAgICAgICAke1xuICAgICAgICAgICAgdGd0LnRhcmdldCA/XG4gICAgICAgICAgICBgXG4gICAgICAgICAgICA8ZGl2IGNsYXNzPSd0eXBlJz4ke3RndC50YXJnZXQudHlwZX08L2Rpdj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3M9J25hbWUnPiR7dGd0LnRhcmdldC5uYW1lfTwvZGl2PlxuICAgICAgICAgICAgYCA6XG4gICAgICAgICAgICBgPGRpdiBjbGFzcz0nbmFtZSc+JHsnQWxsJ308L2Rpdj5gXG4gICAgICAgICAgfVxuICAgICAgICAgIDxkaXYgY2xhc3M9J2NsZWFyZml4Jz48L2Rpdj5cbiAgICAgICAgPC9saT5gLFxuICAgICAgZGlzcGxheVRlbXBsYXRlOiAoaXRlbTogVGFyZ2V0UGFyYW1UeXBlKSA9PiB7XG4gICAgICAgIGlmICghaXRlbS5kaXIpIHtcbiAgICAgICAgICByZXR1cm4gaXRlbS5wcm9qZWN0XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIGAke2l0ZW0ucHJvamVjdH06ICR7aXRlbS50YXJnZXQgPyBpdGVtLnRhcmdldC5uYW1lIDogJ0FsbCd9YFxuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgaXRlbUZpbHRlcktleTogJ25hbWUnLFxuICAgICAgZGVzY3JpcHRpb246ICdTZWxlY3QgdGFyZ2V0IHRvIGJ1aWxkJ1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgZ2V0QWN0aXZlUHJvamVjdFBhdGggKCk6IHN0cmluZyB7XG4gICAgY29uc3QgZWRpdG9yID0gYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpXG4gICAgaWYgKGVkaXRvciAmJiBlZGl0b3IuZ2V0UGF0aCgpKSB7XG4gICAgICByZXR1cm4gcGF0aC5kaXJuYW1lKGVkaXRvci5nZXRQYXRoKCkpXG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBhdG9tLnByb2plY3QuZ2V0UGF0aHMoKVswXSB8fCBwcm9jZXNzLmN3ZCgpXG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBnZXRBY3RpdmVQcm9qZWN0VGFyZ2V0IChjYWJhbGZpbGU6IHN0cmluZywgY2FiYWxSb290OiBBdG9tVHlwZXMuRGlyZWN0b3J5KSB7XG4gICAgY29uc3QgZWRpdG9yID0gYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpXG4gICAgaWYgKGVkaXRvciAmJiBlZGl0b3IuZ2V0UGF0aCgpKSB7XG4gICAgICByZXR1cm4gVXRpbC5nZXRDb21wb25lbnRGcm9tRmlsZShjYWJhbGZpbGUsIGNhYmFsUm9vdC5yZWxhdGl2aXplKGVkaXRvci5nZXRQYXRoKCkpKVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gW11cbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGNhYmFsQnVpbGQgKGNtZDogQ2FiYWxDb21tYW5kLCBvcHRzOiBCdWlsZGVycy5JUGFyYW1zKTogUHJvbWlzZTx7ZXhpdENvZGU6IG51bWJlciwgaGFzRXJyb3I6IGJvb2xlYW59PiB7XG4gICAgICAvLyBJdCBzaG91bGRuJ3QgYmUgcG9zc2libGUgdG8gY2FsbCB0aGlzIGZ1bmN0aW9uIHVudGlsIGNhYmFsUHJvY2Vzc1xuICAgICAgLy8gZXhpdHMuIE90aGVyd2lzZSwgcHJvYmxlbXMgd2lsbCBlbnN1ZS5cbiAgICB0cnkge1xuICAgICAgaWYgKHRoaXMucnVubmluZykgeyB0aHJvdyBuZXcgRXJyb3IoJ0FscmVhZHkgcnVubmluZycpIH1cbiAgICAgIHRoaXMucnVubmluZyA9IHRydWVcblxuICAgICAgY29uc3QgYnVpbGRlclBhcmFtID0gYXdhaXQgdGhpcy51cGkuZ2V0Q29uZmlnUGFyYW08QnVpbGRlclBhcmFtVHlwZT4oJ2J1aWxkZXInKVxuICAgICAgY29uc3QgdGFyZ2V0ID0gYXdhaXQgdGhpcy51cGkuZ2V0Q29uZmlnUGFyYW08VGFyZ2V0UGFyYW1UeXBlPigndGFyZ2V0JylcblxuICAgICAgaWYgKHRhcmdldCA9PT0gdW5kZWZpbmVkKSB7IHRocm93IG5ldyBFcnJvcignVGFyZ2V0IHVuZGVmaW5lZCcpIH1cbiAgICAgIGlmIChidWlsZGVyUGFyYW0gPT09IHVuZGVmaW5lZCkgeyB0aHJvdyBuZXcgRXJyb3IoJ0J1aWxkZXIgdW5kZWZpbmVkJykgfVxuXG4gICAgICB0aGlzLnVwaS5zZXRTdGF0dXMoe1xuICAgICAgICBzdGF0dXM6ICdwcm9ncmVzcycsXG4gICAgICAgIHByb2dyZXNzOiBvcHRzLm9uUHJvZ3Jlc3MgPyAwLjAgOiB1bmRlZmluZWQsXG4gICAgICAgIGRldGFpbDogJydcbiAgICAgIH0pXG5cbiAgICAgIGNvbnN0IGNhYmFsUm9vdCA9IGF3YWl0IFV0aWwuZ2V0Um9vdERpcih0YXJnZXQuZGlyID8gdGFyZ2V0LmRpciA6IHRoaXMuZ2V0QWN0aXZlUHJvamVjdFBhdGgoKSlcblxuICAgICAgY29uc3QgW2NhYmFsRmlsZV06IEF0b21UeXBlcy5GaWxlW10gPSBjYWJhbFJvb3QuZ2V0RW50cmllc1N5bmMoKS5maWx0ZXIoaXNDYWJhbEZpbGUpXG5cbiAgICAgIGlmICghY2FiYWxGaWxlKSB7IHRocm93IG5ldyBFcnJvcignTm8gY2FiYWwgZmlsZSBmb3VuZCcpIH1cblxuICAgICAgbGV0IG5ld1RhcmdldCA9IHsuLi50YXJnZXR9XG5cbiAgICAgIGlmICghIG5ld1RhcmdldC50YXJnZXQgJiYgWydidWlsZCcsICdkZXBzJ10uaW5jbHVkZXMoY21kKSkge1xuICAgICAgICBjb25zdCBjYWJhbENvbnRlbnRzID0gYXdhaXQgY2FiYWxGaWxlLnJlYWQoKVxuICAgICAgICBjb25zdCB0Z3RzID0gYXdhaXQgdGhpcy5nZXRBY3RpdmVQcm9qZWN0VGFyZ2V0KGNhYmFsQ29udGVudHMsIGNhYmFsUm9vdClcbiAgICAgICAgY29uc3QgW3RndF0gPSB0Z3RzXG4gICAgICAgIGlmICh0Z3QpIHtcbiAgICAgICAgICBjb25zdCBjZiA9IGF3YWl0IFV0aWwucGFyc2VEb3RDYWJhbChjYWJhbENvbnRlbnRzKVxuICAgICAgICAgIGlmIChjZikge1xuICAgICAgICAgICAgbmV3VGFyZ2V0ID0ge1xuICAgICAgICAgICAgICBwcm9qZWN0OiBjZi5uYW1lLFxuICAgICAgICAgICAgICBjb21wb25lbnQ6IHRndCxcbiAgICAgICAgICAgICAgZGlyOiBjYWJhbFJvb3QuZ2V0UGF0aCgpLFxuICAgICAgICAgICAgICB0YXJnZXQ6IHVuZGVmaW5lZFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgLy8gdHJ5IHtcbiAgICAgIC8vXG4gICAgICAvLyB9IGNhdGNoIChlKSB7XG4gICAgICAvLyAgIHRocm93IG5ldyBFcnJvcihgVW5rbm93biBidWlsZGVyICckeyhidWlsZGVyUGFyYW0gJiYgYnVpbGRlclBhcmFtLm5hbWUpIHx8IGJ1aWxkZXJQYXJhbX0nYClcbiAgICAgIC8vIH1cbiAgICAgIGNvbnN0IGJ1aWxkZXJzOiB7XG4gICAgICAgIFtrOiBzdHJpbmddOlxuICAgICAgICAgIHR5cGVvZiBCdWlsZGVycy5DYWJhbE5peCB8IHR5cGVvZiBCdWlsZGVycy5DYWJhbCB8IHR5cGVvZiBCdWlsZGVycy5TdGFjayB8IHR5cGVvZiBCdWlsZGVycy5Ob25lXG4gICAgICB9ID0ge1xuICAgICAgICAnY2FiYWwtbml4JzogQnVpbGRlcnMuQ2FiYWxOaXgsXG4gICAgICAgICdjYWJhbCc6IEJ1aWxkZXJzLkNhYmFsLFxuICAgICAgICAnc3RhY2snOiBCdWlsZGVycy5TdGFjayxcbiAgICAgICAgJ25vbmUnOiBCdWlsZGVycy5Ob25lXG4gICAgICB9XG4gICAgICBjb25zdCBidWlsZGVyID0gYnVpbGRlcnNbYnVpbGRlclBhcmFtLm5hbWVdXG4gICAgICByZXR1cm4gKG5ldyBidWlsZGVyKHtvcHRzLCB0YXJnZXQsIGNhYmFsUm9vdH0pKS5ydW5Db21tYW5kKGNtZClcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgaWYgKGVycm9yKSB7XG4gICAgICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTogbm8tY29uc29sZVxuICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKVxuICAgICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkRmF0YWxFcnJvcihlcnJvci50b1N0cmluZygpLCB7IGRldGFpbDogZXJyb3IsIGRpc21pc3NhYmxlOiB0cnVlIH0pXG4gICAgICB9XG4gICAgICByZXR1cm4geyBleGl0Q29kZTogLTEyNywgaGFzRXJyb3I6IGZhbHNlIH1cbiAgICB9IGZpbmFsbHkge1xuICAgICAgdGhpcy5ydW5uaW5nID0gZmFsc2VcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHJ1bkNhYmFsQ29tbWFuZCAoXG4gICAgY29tbWFuZDogQ2FiYWxDb21tYW5kLFxuICAgIHttZXNzYWdlVHlwZXMsIGRlZmF1bHRTZXZlcml0eSwgY2FuQ2FuY2VsfTpcbiAgICAgIHttZXNzYWdlVHlwZXM6IFVQSS5UU2V2ZXJpdHlbXSwgZGVmYXVsdFNldmVyaXR5OiBVUEkuVFNldmVyaXR5LCBjYW5DYW5jZWw6IGJvb2xlYW59XG4gICkge1xuICAgIGNvbnN0IG1lc3NhZ2VzOiBVUEkuSVJlc3VsdEl0ZW1bXSA9IFtdXG4gICAgdGhpcy51cGkuc2V0TWVzc2FnZXMobWVzc2FnZXMpXG5cbiAgICBsZXQgY2FuY2VsQWN0aW9uRGlzcDogQXRvbVR5cGVzLkRpc3Bvc2FibGUgfCB1bmRlZmluZWRcbiAgICBjb25zdCB7ZXhpdENvZGUsIGhhc0Vycm9yfSA9XG4gICAgICBhd2FpdCB0aGlzLmNhYmFsQnVpbGQoY29tbWFuZCwge1xuICAgICAgICBzZXZlcml0eTogZGVmYXVsdFNldmVyaXR5LFxuICAgICAgICBzZXRDYW5jZWxBY3Rpb246XG4gICAgICAgICAgICBjYW5DYW5jZWwgP1xuICAgICAgICAgICAgKGFjdGlvbjogKCkgPT4gdm9pZCkgPT4ge1xuICAgICAgICAgICAgICBjYW5jZWxBY3Rpb25EaXNwICYmIGNhbmNlbEFjdGlvbkRpc3AuZGlzcG9zZSgpXG4gICAgICAgICAgICAgIGNhbmNlbEFjdGlvbkRpc3AgPSB0aGlzLnVwaS5hZGRQYW5lbENvbnRyb2woe1xuICAgICAgICAgICAgICAgIGVsZW1lbnQ6ICdpZGUtaGFza2VsbC1idXR0b24nLFxuICAgICAgICAgICAgICAgIG9wdHM6IHtcbiAgICAgICAgICAgICAgICAgIGNsYXNzZXM6IFsnY2FuY2VsJ10sXG4gICAgICAgICAgICAgICAgICBldmVudHM6IHtcbiAgICAgICAgICAgICAgICAgICAgY2xpY2s6IGFjdGlvblxuICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgIGJlZm9yZTogJyNwcm9ncmVzc0JhcidcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9IDogdW5kZWZpbmVkLFxuICAgICAgICBvbk1zZzogKG1lc3NhZ2U6IFVQSS5JUmVzdWx0SXRlbSkgPT4ge1xuICAgICAgICAgIGlmIChtZXNzYWdlVHlwZXMuaW5jbHVkZXMobWVzc2FnZS5zZXZlcml0eSkpIHtcbiAgICAgICAgICAgIG1lc3NhZ2VzLnB1c2gobWVzc2FnZSlcbiAgICAgICAgICAgIHRoaXMudXBpLnNldE1lc3NhZ2VzKG1lc3NhZ2VzKVxuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgb25Qcm9ncmVzczpcbiAgICAgICAgICBjYW5DYW5jZWxcbiAgICAgICAgICA/IChwcm9ncmVzczogbnVtYmVyKSA9PiB0aGlzLnVwaS5zZXRTdGF0dXMoe3N0YXR1czogJ3Byb2dyZXNzJywgcHJvZ3Jlc3MsIGRldGFpbDogJyd9KVxuICAgICAgICAgIDogdW5kZWZpbmVkXG4gICAgICAgIH0pXG5cbiAgICBjYW5jZWxBY3Rpb25EaXNwICYmIGNhbmNlbEFjdGlvbkRpc3AuZGlzcG9zZSgpXG4gICAgdGhpcy51cGkuc2V0U3RhdHVzKHtzdGF0dXM6ICdyZWFkeScsIGRldGFpbDogJyd9KVxuICAgIC8vIHNlZSBDYWJhbFByb2Nlc3MgZm9yIGV4cGxhaW5hdGlvblxuICAgIGlmIChleGl0Q29kZSAhPT0gMCkge1xuICAgICAgaWYgKGhhc0Vycm9yKSB7XG4gICAgICAgIHRoaXMudXBpLnNldFN0YXR1cyh7c3RhdHVzOiAnd2FybmluZycsIGRldGFpbDogJyd9KVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy51cGkuc2V0U3RhdHVzKHtzdGF0dXM6ICdlcnJvcicsIGRldGFpbDogJyd9KVxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuIl19