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
            description: 'Select builder to use with current project',
        };
    }
    targetParamInfo() {
        const defaultVal = {
            project: 'Auto',
            component: undefined,
            dir: undefined,
            target: undefined,
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
            description: 'Select target to build',
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
                    detail: '',
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
                                target: undefined,
                            };
                        }
                    }
                }
                const builders = {
                    'cabal-nix': Builders.CabalNix,
                    'cabal': Builders.Cabal,
                    'stack': Builders.Stack,
                    'none': Builders.None,
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
                            detail: `Builder quit abnormally with exit code ${res.exitCode}`,
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
                                    click: action,
                                },
                            },
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
                    : undefined,
            });
            cancelActionDisp && cancelActionDisp.dispose();
        });
    }
}
exports.IdeBackend = IdeBackend;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaWRlLWJhY2tlbmQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaWRlLWJhY2tlbmQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUFBLDZCQUE0QjtBQUM1QiwrQkFBMEM7QUFDMUMsdUNBQXNDO0FBQ3RDLDJDQUEwQztBQUsxQyxxQkFBcUIsSUFBMkM7SUFDOUQsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksSUFBSSxJQUFJLENBQUMsTUFBTSxFQUFFLElBQUksSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFBO0FBQzNFLENBQUM7QUFpQkQsTUFBTSxjQUFjLEdBQTJDO0lBQzdELEtBQUssRUFBRTtRQUNMLFlBQVksRUFBRSxDQUFDLE9BQU8sRUFBRSxTQUFTLEVBQUUsT0FBTyxDQUFDO1FBQzNDLGVBQWUsRUFBRSxPQUFPO1FBQ3hCLFNBQVMsRUFBRSxJQUFJO0tBQ2hCO0lBQ0QsS0FBSyxFQUFFO1FBQ0wsWUFBWSxFQUFFLENBQUMsT0FBTyxDQUFDO1FBQ3ZCLGVBQWUsRUFBRSxPQUFPO1FBQ3hCLFNBQVMsRUFBRSxLQUFLO0tBQ2pCO0lBQ0QsSUFBSSxFQUFFO1FBQ0osWUFBWSxFQUFFLENBQUMsT0FBTyxFQUFFLFNBQVMsRUFBRSxPQUFPLEVBQUUsTUFBTSxDQUFDO1FBQ25ELGVBQWUsRUFBRSxNQUFNO1FBQ3ZCLFNBQVMsRUFBRSxJQUFJO0tBQ2hCO0lBQ0QsS0FBSyxFQUFFO1FBQ0wsWUFBWSxFQUFFLENBQUMsT0FBTyxFQUFFLFNBQVMsRUFBRSxPQUFPLEVBQUUsTUFBTSxDQUFDO1FBQ25ELGVBQWUsRUFBRSxNQUFNO1FBQ3ZCLFNBQVMsRUFBRSxJQUFJO0tBQ2hCO0lBQ0QsSUFBSSxFQUFFO1FBQ0osWUFBWSxFQUFFLENBQUMsT0FBTyxDQUFDO1FBQ3ZCLGVBQWUsRUFBRSxPQUFPO1FBQ3hCLFNBQVMsRUFBRSxJQUFJO0tBQ2hCO0NBQ0YsQ0FB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b21wb3NpdGVEaXNwb3NhYmxlIH0gZnJvbSAnYXRvbSdcbmltcG9ydCAqIGFzIEJ1aWxkZXJzIGZyb20gJy4vYnVpbGRlcnMnXG5pbXBvcnQgKiBhcyBVdGlsIGZyb20gJ2F0b20taGFza2VsbC11dGlscydcbmltcG9ydCB7IFRhcmdldFBhcmFtVHlwZSwgQ2FiYWxDb21tYW5kIH0gZnJvbSAnLi9jb21tb24nXG5cbmludGVyZmFjZSBCdWlsZGVyUGFyYW1UeXBlIHsgbmFtZTogc3RyaW5nIH1cblxuZnVuY3Rpb24gaXNDYWJhbEZpbGUoZmlsZT86IEF0b21UeXBlcy5GaWxlIHwgQXRvbVR5cGVzLkRpcmVjdG9yeSk6IGZpbGUgaXMgQXRvbVR5cGVzLkZpbGUge1xuICByZXR1cm4gISEoZmlsZSAmJiBmaWxlLmlzRmlsZSgpICYmIGZpbGUuZ2V0QmFzZU5hbWUoKS5lbmRzV2l0aCgnLmNhYmFsJykpXG59XG5cbmludGVyZmFjZSBJQ29tbWFuZE9wdGlvbnMge1xuICBtZXNzYWdlVHlwZXM6IFVQSS5UU2V2ZXJpdHlbXVxuICBkZWZhdWx0U2V2ZXJpdHk6IFVQSS5UU2V2ZXJpdHlcbiAgY2FuQ2FuY2VsOiBib29sZWFuXG59XG5cbnR5cGUgVEJ1aWxkZXJzID0ge1xuICBbazogc3RyaW5nXTpcbiAgdHlwZW9mIEJ1aWxkZXJzLkNhYmFsTml4IHxcbiAgdHlwZW9mIEJ1aWxkZXJzLkNhYmFsIHxcbiAgdHlwZW9mIEJ1aWxkZXJzLlN0YWNrIHxcbiAgdHlwZW9mIEJ1aWxkZXJzLk5vbmUgfFxuICB1bmRlZmluZWRcbn1cblxuY29uc3QgY29tbWFuZE9wdGlvbnM6IHtbSyBpbiBDYWJhbENvbW1hbmRdOiBJQ29tbWFuZE9wdGlvbnN9ID0ge1xuICBidWlsZDoge1xuICAgIG1lc3NhZ2VUeXBlczogWydlcnJvcicsICd3YXJuaW5nJywgJ2J1aWxkJ10sXG4gICAgZGVmYXVsdFNldmVyaXR5OiAnYnVpbGQnLFxuICAgIGNhbkNhbmNlbDogdHJ1ZSxcbiAgfSxcbiAgY2xlYW46IHtcbiAgICBtZXNzYWdlVHlwZXM6IFsnYnVpbGQnXSxcbiAgICBkZWZhdWx0U2V2ZXJpdHk6ICdidWlsZCcsXG4gICAgY2FuQ2FuY2VsOiBmYWxzZSxcbiAgfSxcbiAgdGVzdDoge1xuICAgIG1lc3NhZ2VUeXBlczogWydlcnJvcicsICd3YXJuaW5nJywgJ2J1aWxkJywgJ3Rlc3QnXSxcbiAgICBkZWZhdWx0U2V2ZXJpdHk6ICd0ZXN0JyxcbiAgICBjYW5DYW5jZWw6IHRydWUsXG4gIH0sXG4gIGJlbmNoOiB7XG4gICAgbWVzc2FnZVR5cGVzOiBbJ2Vycm9yJywgJ3dhcm5pbmcnLCAnYnVpbGQnLCAndGVzdCddLFxuICAgIGRlZmF1bHRTZXZlcml0eTogJ3Rlc3QnLFxuICAgIGNhbkNhbmNlbDogdHJ1ZSxcbiAgfSxcbiAgZGVwczoge1xuICAgIG1lc3NhZ2VUeXBlczogWydidWlsZCddLFxuICAgIGRlZmF1bHRTZXZlcml0eTogJ2J1aWxkJyxcbiAgICBjYW5DYW5jZWw6IHRydWUsXG4gIH0sXG59XG5cbmV4cG9ydCBjbGFzcyBJZGVCYWNrZW5kIHtcbiAgcHJpdmF0ZSBkaXNwb3NhYmxlczogQ29tcG9zaXRlRGlzcG9zYWJsZVxuICBwcml2YXRlIHVwaTogVVBJLklVUElJbnN0YW5jZVxuICBwcml2YXRlIHJ1bm5pbmc6IGJvb2xlYW4gPSBmYWxzZVxuICBwcml2YXRlIGNvbW1hbmRzID0ge1xuICAgIC4uLnRoaXMuY2FiYWxDb21tYW5kcygpLFxuICAgICdpZGUtaGFza2VsbC1jYWJhbDpzZXQtYnVpbGQtdGFyZ2V0JzogYXN5bmMgKCkgPT5cbiAgICAgIHRoaXMudXBpLnNldENvbmZpZ1BhcmFtKCd0YXJnZXQnKSxcbiAgICAnaWRlLWhhc2tlbGwtY2FiYWw6c2V0LWFjdGl2ZS1idWlsZGVyJzogYXN5bmMgKCkgPT5cbiAgICAgIHRoaXMudXBpLnNldENvbmZpZ1BhcmFtKCdidWlsZGVyJyksXG4gIH1cbiAgcHJpdmF0ZSBtZW51ID0gW1xuICAgIHsgbGFiZWw6ICdCdWlsZCBQcm9qZWN0JywgY29tbWFuZDogJ2lkZS1oYXNrZWxsLWNhYmFsOmJ1aWxkJyB9LFxuICAgIHsgbGFiZWw6ICdDbGVhbiBQcm9qZWN0JywgY29tbWFuZDogJ2lkZS1oYXNrZWxsLWNhYmFsOmNsZWFuJyB9LFxuICAgIHsgbGFiZWw6ICdUZXN0JywgY29tbWFuZDogJ2lkZS1oYXNrZWxsLWNhYmFsOnRlc3QnIH0sXG4gICAgeyBsYWJlbDogJ0JlbmNoJywgY29tbWFuZDogJ2lkZS1oYXNrZWxsLWNhYmFsOmJlbmNoJyB9LFxuICAgIHsgbGFiZWw6ICdCdWlsZCBEZXBlbmRlbmNpZXMnLCBjb21tYW5kOiAnaWRlLWhhc2tlbGwtY2FiYWw6ZGVwcycgfSxcbiAgICB7IGxhYmVsOiAnU2V0IEFjdGl2ZSBCdWlsZGVyJywgY29tbWFuZDogJ2lkZS1oYXNrZWxsLWNhYmFsOnNldC1hY3RpdmUtYnVpbGRlcicgfSxcbiAgICB7IGxhYmVsOiAnU2V0IEJ1aWxkIFRhcmdldCcsIGNvbW1hbmQ6ICdpZGUtaGFza2VsbC1jYWJhbDpzZXQtYnVpbGQtdGFyZ2V0JyB9LFxuICBdXG4gIGNvbnN0cnVjdG9yKHJlZzogVVBJLklVUElSZWdpc3RyYXRpb24pIHtcbiAgICB0aGlzLnVwaSA9IHJlZyh7XG4gICAgICBuYW1lOiAnaWRlLWhhc2tlbGwtY2FiYWwnLFxuICAgICAgbWVzc2FnZVR5cGVzOiB7XG4gICAgICAgIGVycm9yOiB7fSxcbiAgICAgICAgd2FybmluZzoge30sXG4gICAgICAgIGJ1aWxkOiB7XG4gICAgICAgICAgdXJpRmlsdGVyOiBmYWxzZSxcbiAgICAgICAgICBhdXRvU2Nyb2xsOiB0cnVlLFxuICAgICAgICB9LFxuICAgICAgICB0ZXN0OiB7XG4gICAgICAgICAgdXJpRmlsdGVyOiBmYWxzZSxcbiAgICAgICAgICBhdXRvU2Nyb2xsOiB0cnVlLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIG1lbnU6IHtcbiAgICAgICAgbGFiZWw6ICdCdWlsZGVyJyxcbiAgICAgICAgbWVudTogdGhpcy5tZW51LFxuICAgICAgfSxcbiAgICAgIHBhcmFtczoge1xuICAgICAgICBidWlsZGVyOiB0aGlzLmJ1aWxkZXJQYXJhbUluZm8oKSxcbiAgICAgICAgdGFyZ2V0OiB0aGlzLnRhcmdldFBhcmFtSW5mbygpLFxuICAgICAgfSxcbiAgICB9KVxuXG4gICAgdGhpcy5kaXNwb3NhYmxlcyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKClcblxuICAgIHRoaXMuZGlzcG9zYWJsZXMuYWRkKGF0b20uY29tbWFuZHMuYWRkKCdhdG9tLXdvcmtzcGFjZScsIHRoaXMuY29tbWFuZHMpKVxuICAgIHRoaXMuZGlzcG9zYWJsZXMuYWRkKHRoaXMudXBpKVxuICB9XG5cbiAgcHVibGljIGRlc3Ryb3koKSB7XG4gICAgdGhpcy5kaXNwb3NhYmxlcy5kaXNwb3NlKClcbiAgfVxuXG4gIHByaXZhdGUgY2FiYWxDb21tYW5kcygpIHtcbiAgICBjb25zdCByZXQgPSB7fVxuICAgIGZvciAoY29uc3QgY21kIG9mIE9iamVjdC5rZXlzKGNvbW1hbmRPcHRpb25zKSkge1xuICAgICAgcmV0W2BpZGUtaGFza2VsbC1jYWJhbDoke2NtZH1gXSA9IGFzeW5jICgpID0+XG4gICAgICAgIHRoaXMucnVuQ2FiYWxDb21tYW5kKGNtZClcbiAgICB9XG4gICAgcmV0dXJuIHJldFxuICB9XG5cbiAgcHJpdmF0ZSBidWlsZGVyUGFyYW1JbmZvKCk6IFVQSS5JUGFyYW1TcGVjPEJ1aWxkZXJQYXJhbVR5cGU+IHtcbiAgICByZXR1cm4ge1xuICAgICAgaXRlbXM6ICgpOiBCdWlsZGVyUGFyYW1UeXBlW10gPT4ge1xuICAgICAgICBjb25zdCBidWlsZGVycyA9IFt7IG5hbWU6ICdjYWJhbCcgfSwgeyBuYW1lOiAnc3RhY2snIH1dXG4gICAgICAgIGlmIChhdG9tLmNvbmZpZy5nZXQoJ2lkZS1oYXNrZWxsLWNhYmFsLmVuYWJsZU5peEJ1aWxkJykpIHtcbiAgICAgICAgICBidWlsZGVycy5wdXNoKHsgbmFtZTogJ2NhYmFsLW5peCcgfSlcbiAgICAgICAgfVxuICAgICAgICBidWlsZGVycy5wdXNoKHsgbmFtZTogJ25vbmUnIH0pXG4gICAgICAgIHJldHVybiBidWlsZGVyc1xuICAgICAgfSxcbiAgICAgIGl0ZW1UZW1wbGF0ZTogKGl0ZW06IEJ1aWxkZXJQYXJhbVR5cGUpID0+IGA8bGk+PGRpdiBjbGFzcz0nbmFtZSc+JHtpdGVtLm5hbWV9PC9kaXY+PC9saT5gLFxuICAgICAgZGlzcGxheVRlbXBsYXRlOiAoaXRlbTogQnVpbGRlclBhcmFtVHlwZSkgPT4gaXRlbSAmJiBpdGVtLm5hbWUgPyBpdGVtLm5hbWUgOiAnTm90IHNldCcsXG4gICAgICBpdGVtRmlsdGVyS2V5OiAnbmFtZScsXG4gICAgICBkZXNjcmlwdGlvbjogJ1NlbGVjdCBidWlsZGVyIHRvIHVzZSB3aXRoIGN1cnJlbnQgcHJvamVjdCcsXG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSB0YXJnZXRQYXJhbUluZm8oKTogVVBJLklQYXJhbVNwZWM8VGFyZ2V0UGFyYW1UeXBlPiB7XG4gICAgY29uc3QgZGVmYXVsdFZhbCA9IHtcbiAgICAgIHByb2plY3Q6ICdBdXRvJyxcbiAgICAgIGNvbXBvbmVudDogdW5kZWZpbmVkLFxuICAgICAgZGlyOiB1bmRlZmluZWQsXG4gICAgICB0YXJnZXQ6IHVuZGVmaW5lZCxcbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgIGRlZmF1bHQ6IGRlZmF1bHRWYWwsXG4gICAgICBpdGVtczogYXN5bmMgKCk6IFByb21pc2U8VGFyZ2V0UGFyYW1UeXBlW10+ID0+IHtcbiAgICAgICAgY29uc3QgcHJvamVjdHM6IFRhcmdldFBhcmFtVHlwZVtdID0gW2RlZmF1bHRWYWxdXG4gICAgICAgIGZvciAoY29uc3QgZCBvZiBhdG9tLnByb2plY3QuZ2V0RGlyZWN0b3JpZXMoKSkge1xuICAgICAgICAgIGNvbnN0IGRpciA9IGQuZ2V0UGF0aCgpXG4gICAgICAgICAgY29uc3QgW2NhYmFsRmlsZV0gPSAoYXdhaXQgVXRpbC5nZXRSb290RGlyKGRpcikpLmdldEVudHJpZXNTeW5jKCkuZmlsdGVyKGlzQ2FiYWxGaWxlKVxuICAgICAgICAgIGlmIChjYWJhbEZpbGUgJiYgY2FiYWxGaWxlLmlzRmlsZSgpKSB7XG4gICAgICAgICAgICBjb25zdCBkYXRhID0gYXdhaXQgY2FiYWxGaWxlLnJlYWQoKVxuICAgICAgICAgICAgY29uc3QgcHJvamVjdCA9IGF3YWl0IFV0aWwucGFyc2VEb3RDYWJhbChkYXRhKVxuICAgICAgICAgICAgaWYgKHByb2plY3QpIHtcbiAgICAgICAgICAgICAgcHJvamVjdHMucHVzaCh7IHByb2plY3Q6IHByb2plY3QubmFtZSwgZGlyLCBjb21wb25lbnQ6IHVuZGVmaW5lZCwgdGFyZ2V0OiB1bmRlZmluZWQgfSlcbiAgICAgICAgICAgICAgZm9yIChjb25zdCB0YXJnZXQgb2YgcHJvamVjdC50YXJnZXRzKSB7XG4gICAgICAgICAgICAgICAgcHJvamVjdHMucHVzaCh7IHByb2plY3Q6IHByb2plY3QubmFtZSwgZGlyLCB0YXJnZXQsIGNvbXBvbmVudDogdGFyZ2V0LnRhcmdldCB9KVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBwcm9qZWN0c1xuICAgICAgfSxcbiAgICAgIGl0ZW1UZW1wbGF0ZTogKHRndDogVGFyZ2V0UGFyYW1UeXBlKSA9PlxuICAgICAgICBgPGxpPlxuICAgICAgICAgIDxkaXYgY2xhc3M9J3Byb2plY3QnPiR7dGd0LnByb2plY3R9PC9kaXY+XG4gICAgICAgICAgPGRpdiBjbGFzcz0nZGlyJz4ke3RndC5kaXIgfHwgJyd9PC9kaXY+XG4gICAgICAgICAgJHtcbiAgICAgICAgdGd0LnRhcmdldCA/XG4gICAgICAgICAgYFxuICAgICAgICAgICAgPGRpdiBjbGFzcz0ndHlwZSc+JHt0Z3QudGFyZ2V0LnR5cGV9PC9kaXY+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzPSduYW1lJz4ke3RndC50YXJnZXQubmFtZX08L2Rpdj5cbiAgICAgICAgICAgIGAgOlxuICAgICAgICAgIGA8ZGl2IGNsYXNzPSduYW1lJz4keydBbGwnfTwvZGl2PmBcbiAgICAgICAgfVxuICAgICAgICAgIDxkaXYgY2xhc3M9J2NsZWFyZml4Jz48L2Rpdj5cbiAgICAgICAgPC9saT5gLFxuICAgICAgZGlzcGxheVRlbXBsYXRlOiAoaXRlbTogVGFyZ2V0UGFyYW1UeXBlKSA9PiB7XG4gICAgICAgIGlmICghaXRlbS5kaXIpIHtcbiAgICAgICAgICByZXR1cm4gaXRlbS5wcm9qZWN0XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIGAke2l0ZW0ucHJvamVjdH06ICR7aXRlbS50YXJnZXQgPyBpdGVtLnRhcmdldC5uYW1lIDogJ0FsbCd9YFxuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgaXRlbUZpbHRlcktleTogJ25hbWUnLFxuICAgICAgZGVzY3JpcHRpb246ICdTZWxlY3QgdGFyZ2V0IHRvIGJ1aWxkJyxcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGdldEFjdGl2ZVByb2plY3RQYXRoKCk6IHN0cmluZyB7XG4gICAgY29uc3QgZWRpdG9yID0gYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpXG4gICAgaWYgKGVkaXRvciAmJiBlZGl0b3IuZ2V0UGF0aCgpKSB7XG4gICAgICByZXR1cm4gcGF0aC5kaXJuYW1lKGVkaXRvci5nZXRQYXRoKCkpXG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBhdG9tLnByb2plY3QuZ2V0UGF0aHMoKVswXSB8fCBwcm9jZXNzLmN3ZCgpXG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBnZXRBY3RpdmVQcm9qZWN0VGFyZ2V0KGNhYmFsZmlsZTogc3RyaW5nLCBjYWJhbFJvb3Q6IEF0b21UeXBlcy5EaXJlY3RvcnkpIHtcbiAgICBjb25zdCBlZGl0b3IgPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKClcbiAgICBpZiAoZWRpdG9yICYmIGVkaXRvci5nZXRQYXRoKCkpIHtcbiAgICAgIHJldHVybiBVdGlsLmdldENvbXBvbmVudEZyb21GaWxlKGNhYmFsZmlsZSwgY2FiYWxSb290LnJlbGF0aXZpemUoZWRpdG9yLmdldFBhdGgoKSkpXG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBbXVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgY2FiYWxCdWlsZChjbWQ6IENhYmFsQ29tbWFuZCwgb3B0czogQnVpbGRlcnMuSVBhcmFtcyk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRyeSB7XG4gICAgICBpZiAodGhpcy5ydW5uaW5nKSB7XG4gICAgICAgIHRoaXMudXBpLnNldFN0YXR1cyh7IHN0YXR1czogJ3dhcm5pbmcnLCBkZXRhaWw6ICdCdWlsZGVyIGFscmVhZHkgcnVubmluZycgfSlcbiAgICAgICAgcmV0dXJuXG4gICAgICB9XG4gICAgICB0aGlzLnJ1bm5pbmcgPSB0cnVlXG5cbiAgICAgIGNvbnN0IGJ1aWxkZXJQYXJhbSA9IGF3YWl0IHRoaXMudXBpLmdldENvbmZpZ1BhcmFtPEJ1aWxkZXJQYXJhbVR5cGU+KCdidWlsZGVyJylcbiAgICAgIGNvbnN0IHRhcmdldCA9IGF3YWl0IHRoaXMudXBpLmdldENvbmZpZ1BhcmFtPFRhcmdldFBhcmFtVHlwZT4oJ3RhcmdldCcpXG5cbiAgICAgIGlmICh0YXJnZXQgPT09IHVuZGVmaW5lZCkgeyB0aHJvdyBuZXcgRXJyb3IoJ1RhcmdldCB1bmRlZmluZWQnKSB9XG4gICAgICBpZiAoYnVpbGRlclBhcmFtID09PSB1bmRlZmluZWQpIHsgdGhyb3cgbmV3IEVycm9yKCdCdWlsZGVyIHVuZGVmaW5lZCcpIH1cblxuICAgICAgdGhpcy51cGkuc2V0U3RhdHVzKHtcbiAgICAgICAgc3RhdHVzOiAncHJvZ3Jlc3MnLFxuICAgICAgICBwcm9ncmVzczogb3B0cy5vblByb2dyZXNzID8gMC4wIDogdW5kZWZpbmVkLFxuICAgICAgICBkZXRhaWw6ICcnLFxuICAgICAgfSlcblxuICAgICAgY29uc3QgY2FiYWxSb290ID0gYXdhaXQgVXRpbC5nZXRSb290RGlyKHRhcmdldC5kaXIgPyB0YXJnZXQuZGlyIDogdGhpcy5nZXRBY3RpdmVQcm9qZWN0UGF0aCgpKVxuXG4gICAgICBjb25zdCBbY2FiYWxGaWxlXTogQXRvbVR5cGVzLkZpbGVbXSA9IGNhYmFsUm9vdC5nZXRFbnRyaWVzU3luYygpLmZpbHRlcihpc0NhYmFsRmlsZSlcblxuICAgICAgaWYgKCFjYWJhbEZpbGUpIHsgdGhyb3cgbmV3IEVycm9yKCdObyBjYWJhbCBmaWxlIGZvdW5kJykgfVxuXG4gICAgICBsZXQgbmV3VGFyZ2V0ID0geyAuLi50YXJnZXQgfVxuXG4gICAgICBpZiAoIW5ld1RhcmdldC50YXJnZXQgJiYgWydidWlsZCcsICdkZXBzJ10uaW5jbHVkZXMoY21kKSkge1xuICAgICAgICBjb25zdCBjYWJhbENvbnRlbnRzID0gYXdhaXQgY2FiYWxGaWxlLnJlYWQoKVxuICAgICAgICBjb25zdCB0Z3RzID0gYXdhaXQgdGhpcy5nZXRBY3RpdmVQcm9qZWN0VGFyZ2V0KGNhYmFsQ29udGVudHMsIGNhYmFsUm9vdClcbiAgICAgICAgY29uc3QgW3RndF0gPSB0Z3RzXG4gICAgICAgIGlmICh0Z3QpIHtcbiAgICAgICAgICBjb25zdCBjZiA9IGF3YWl0IFV0aWwucGFyc2VEb3RDYWJhbChjYWJhbENvbnRlbnRzKVxuICAgICAgICAgIGlmIChjZikge1xuICAgICAgICAgICAgbmV3VGFyZ2V0ID0ge1xuICAgICAgICAgICAgICBwcm9qZWN0OiBjZi5uYW1lLFxuICAgICAgICAgICAgICBjb21wb25lbnQ6IHRndCxcbiAgICAgICAgICAgICAgZGlyOiBjYWJhbFJvb3QuZ2V0UGF0aCgpLFxuICAgICAgICAgICAgICB0YXJnZXQ6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGNvbnN0IGJ1aWxkZXJzOiBUQnVpbGRlcnMgPSB7XG4gICAgICAgICdjYWJhbC1uaXgnOiBCdWlsZGVycy5DYWJhbE5peCxcbiAgICAgICAgJ2NhYmFsJzogQnVpbGRlcnMuQ2FiYWwsXG4gICAgICAgICdzdGFjayc6IEJ1aWxkZXJzLlN0YWNrLFxuICAgICAgICAnbm9uZSc6IEJ1aWxkZXJzLk5vbmUsXG4gICAgICB9XG4gICAgICBjb25zdCBidWlsZGVyID0gYnVpbGRlcnNbYnVpbGRlclBhcmFtLm5hbWVdXG5cbiAgICAgIGlmIChidWlsZGVyID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbmtub3duIGJ1aWxkZXIgJyR7KGJ1aWxkZXJQYXJhbSAmJiBidWlsZGVyUGFyYW0ubmFtZSkgfHwgYnVpbGRlclBhcmFtfSdgKVxuICAgICAgfVxuXG4gICAgICBjb25zdCByZXMgPSBhd2FpdCAobmV3IGJ1aWxkZXIoeyBvcHRzLCB0YXJnZXQsIGNhYmFsUm9vdCB9KSkucnVuQ29tbWFuZChjbWQpXG4gICAgICAvLyBzZWUgQ2FiYWxQcm9jZXNzIGZvciBleHBsYWluYXRpb25cbiAgICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTogbm8tbnVsbC1rZXl3b3JkXG4gICAgICBpZiAocmVzLmV4aXRDb2RlID09PSBudWxsKSB7IC8vIHRoaXMgbWVhbnMgcHJvY2VzcyB3YXMga2lsbGVkXG4gICAgICAgIHRoaXMudXBpLnNldFN0YXR1cyh7IHN0YXR1czogJ3dhcm5pbmcnLCBkZXRhaWw6ICdCdWlsZCB3YXMgaW50ZXJydXB0ZWQnIH0pXG4gICAgICB9IGVsc2UgaWYgKHJlcy5leGl0Q29kZSAhPT0gMCkge1xuICAgICAgICBpZiAocmVzLmhhc0Vycm9yKSB7XG4gICAgICAgICAgdGhpcy51cGkuc2V0U3RhdHVzKHsgc3RhdHVzOiAnd2FybmluZycsIGRldGFpbDogJ1RoZXJlIHdlcmUgZXJyb3JzIGluIHNvdXJjZSBmaWxlcycgfSlcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLnVwaS5zZXRTdGF0dXMoe1xuICAgICAgICAgICAgc3RhdHVzOiAnZXJyb3InLFxuICAgICAgICAgICAgZGV0YWlsOiBgQnVpbGRlciBxdWl0IGFibm9ybWFsbHkgd2l0aCBleGl0IGNvZGUgJHtyZXMuZXhpdENvZGV9YCxcbiAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnVwaS5zZXRTdGF0dXMoeyBzdGF0dXM6ICdyZWFkeScsIGRldGFpbDogJ0J1aWxkIHdhcyBzdWNjZXNzZnVsJyB9KVxuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBpZiAoZXJyb3IpIHtcbiAgICAgICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOiBuby1jb25zb2xlXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpXG4gICAgICAgIHRoaXMudXBpLnNldFN0YXR1cyh7IHN0YXR1czogJ2Vycm9yJywgZGV0YWlsOiBlcnJvci50b1N0cmluZygpIH0pXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnVwaS5zZXRTdGF0dXMoeyBzdGF0dXM6ICd3YXJuaW5nJywgZGV0YWlsOiAnQnVpbGQgZmFpbGVkIHdpdGggbm8gZXJyb3JzJyB9KVxuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLnJ1bm5pbmcgPSBmYWxzZVxuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBydW5DYWJhbENvbW1hbmQoY29tbWFuZDogQ2FiYWxDb21tYW5kKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgeyBtZXNzYWdlVHlwZXMsIGRlZmF1bHRTZXZlcml0eSwgY2FuQ2FuY2VsIH0gPSBjb21tYW5kT3B0aW9uc1tjb21tYW5kXVxuICAgIGNvbnN0IG1lc3NhZ2VzOiBVUEkuSVJlc3VsdEl0ZW1bXSA9IFtdXG4gICAgdGhpcy51cGkuc2V0TWVzc2FnZXMobWVzc2FnZXMpXG5cbiAgICBsZXQgY2FuY2VsQWN0aW9uRGlzcDogQXRvbVR5cGVzLkRpc3Bvc2FibGUgfCB1bmRlZmluZWRcblxuICAgIGF3YWl0IHRoaXMuY2FiYWxCdWlsZChjb21tYW5kLCB7XG4gICAgICBzZXZlcml0eTogZGVmYXVsdFNldmVyaXR5LFxuICAgICAgc2V0Q2FuY2VsQWN0aW9uOlxuICAgICAgY2FuQ2FuY2VsID9cbiAgICAgICAgKGFjdGlvbjogKCkgPT4gdm9pZCkgPT4ge1xuICAgICAgICAgIGNhbmNlbEFjdGlvbkRpc3AgJiYgY2FuY2VsQWN0aW9uRGlzcC5kaXNwb3NlKClcbiAgICAgICAgICBjYW5jZWxBY3Rpb25EaXNwID0gdGhpcy51cGkuYWRkUGFuZWxDb250cm9sKHtcbiAgICAgICAgICAgIGVsZW1lbnQ6ICdpZGUtaGFza2VsbC1idXR0b24nLFxuICAgICAgICAgICAgb3B0czoge1xuICAgICAgICAgICAgICBjbGFzc2VzOiBbJ2NhbmNlbCddLFxuICAgICAgICAgICAgICBldmVudHM6IHtcbiAgICAgICAgICAgICAgICBjbGljazogYWN0aW9uLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9KVxuICAgICAgICB9IDogdW5kZWZpbmVkLFxuICAgICAgb25Nc2c6IChtZXNzYWdlOiBVUEkuSVJlc3VsdEl0ZW0pID0+IHtcbiAgICAgICAgaWYgKG1lc3NhZ2VUeXBlcy5pbmNsdWRlcyhtZXNzYWdlLnNldmVyaXR5KSkge1xuICAgICAgICAgIG1lc3NhZ2VzLnB1c2gobWVzc2FnZSlcbiAgICAgICAgICB0aGlzLnVwaS5zZXRNZXNzYWdlcyhtZXNzYWdlcylcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIG9uUHJvZ3Jlc3M6XG4gICAgICBjYW5DYW5jZWxcbiAgICAgICAgPyAocHJvZ3Jlc3M6IG51bWJlcikgPT4gdGhpcy51cGkuc2V0U3RhdHVzKHsgc3RhdHVzOiAncHJvZ3Jlc3MnLCBwcm9ncmVzcywgZGV0YWlsOiBgJHtjb21tYW5kfSBpbiBwcm9ncmVzc2AgfSlcbiAgICAgICAgOiB1bmRlZmluZWQsXG4gICAgfSlcbiAgICBjYW5jZWxBY3Rpb25EaXNwICYmIGNhbmNlbEFjdGlvbkRpc3AuZGlzcG9zZSgpXG4gIH1cbn1cbiJdfQ==