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
                if (!item)
                    return 'undefined';
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaWRlLWJhY2tlbmQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaWRlLWJhY2tlbmQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUFBLDZCQUE0QjtBQUM1QiwrQkFBMEM7QUFDMUMsdUNBQXNDO0FBQ3RDLDJDQUEwQztBQUsxQyxxQkFBcUIsSUFBMkM7SUFDOUQsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksSUFBSSxJQUFJLENBQUMsTUFBTSxFQUFFLElBQUksSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFBO0FBQzNFLENBQUM7QUFpQkQsTUFBTSxjQUFjLEdBQTJDO0lBQzdELEtBQUssRUFBRTtRQUNMLFlBQVksRUFBRSxDQUFDLE9BQU8sRUFBRSxTQUFTLEVBQUUsT0FBTyxDQUFDO1FBQzNDLGVBQWUsRUFBRSxPQUFPO1FBQ3hCLFNBQVMsRUFBRSxJQUFJO0tBQ2hCO0lBQ0QsS0FBSyxFQUFFO1FBQ0wsWUFBWSxFQUFFLENBQUMsT0FBTyxDQUFDO1FBQ3ZCLGVBQWUsRUFBRSxPQUFPO1FBQ3hCLFNBQVMsRUFBRSxLQUFLO0tBQ2pCO0lBQ0QsSUFBSSxFQUFFO1FBQ0osWUFBWSxFQUFFLENBQUMsT0FBTyxFQUFFLFNBQVMsRUFBRSxPQUFPLEVBQUUsTUFBTSxDQUFDO1FBQ25ELGVBQWUsRUFBRSxNQUFNO1FBQ3ZCLFNBQVMsRUFBRSxJQUFJO0tBQ2hCO0lBQ0QsS0FBSyxFQUFFO1FBQ0wsWUFBWSxFQUFFLENBQUMsT0FBTyxFQUFFLFNBQVMsRUFBRSxPQUFPLEVBQUUsTUFBTSxDQUFDO1FBQ25ELGVBQWUsRUFBRSxNQUFNO1FBQ3ZCLFNBQVMsRUFBRSxJQUFJO0tBQ2hCO0lBQ0QsSUFBSSxFQUFFO1FBQ0osWUFBWSxFQUFFLENBQUMsT0FBTyxDQUFDO1FBQ3ZCLGVBQWUsRUFBRSxPQUFPO1FBQ3hCLFNBQVMsRUFBRSxJQUFJO0tBQ2hCO0NBQ0YsQ0FB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UkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnXG5pbXBvcnQgeyBDb21wb3NpdGVEaXNwb3NhYmxlIH0gZnJvbSAnYXRvbSdcbmltcG9ydCAqIGFzIEJ1aWxkZXJzIGZyb20gJy4vYnVpbGRlcnMnXG5pbXBvcnQgKiBhcyBVdGlsIGZyb20gJ2F0b20taGFza2VsbC11dGlscydcbmltcG9ydCB7IFRhcmdldFBhcmFtVHlwZSwgQ2FiYWxDb21tYW5kIH0gZnJvbSAnLi9jb21tb24nXG5cbmludGVyZmFjZSBCdWlsZGVyUGFyYW1UeXBlIHsgbmFtZTogc3RyaW5nIH1cblxuZnVuY3Rpb24gaXNDYWJhbEZpbGUoZmlsZT86IEF0b21UeXBlcy5GaWxlIHwgQXRvbVR5cGVzLkRpcmVjdG9yeSk6IGZpbGUgaXMgQXRvbVR5cGVzLkZpbGUge1xuICByZXR1cm4gISEoZmlsZSAmJiBmaWxlLmlzRmlsZSgpICYmIGZpbGUuZ2V0QmFzZU5hbWUoKS5lbmRzV2l0aCgnLmNhYmFsJykpXG59XG5cbmludGVyZmFjZSBJQ29tbWFuZE9wdGlvbnMge1xuICBtZXNzYWdlVHlwZXM6IFVQSS5UU2V2ZXJpdHlbXVxuICBkZWZhdWx0U2V2ZXJpdHk6IFVQSS5UU2V2ZXJpdHlcbiAgY2FuQ2FuY2VsOiBib29sZWFuXG59XG5cbnR5cGUgVEJ1aWxkZXJzID0ge1xuICBbazogc3RyaW5nXTpcbiAgdHlwZW9mIEJ1aWxkZXJzLkNhYmFsTml4IHxcbiAgdHlwZW9mIEJ1aWxkZXJzLkNhYmFsIHxcbiAgdHlwZW9mIEJ1aWxkZXJzLlN0YWNrIHxcbiAgdHlwZW9mIEJ1aWxkZXJzLk5vbmUgfFxuICB1bmRlZmluZWRcbn1cblxuY29uc3QgY29tbWFuZE9wdGlvbnM6IHtbSyBpbiBDYWJhbENvbW1hbmRdOiBJQ29tbWFuZE9wdGlvbnN9ID0ge1xuICBidWlsZDoge1xuICAgIG1lc3NhZ2VUeXBlczogWydlcnJvcicsICd3YXJuaW5nJywgJ2J1aWxkJ10sXG4gICAgZGVmYXVsdFNldmVyaXR5OiAnYnVpbGQnLFxuICAgIGNhbkNhbmNlbDogdHJ1ZSxcbiAgfSxcbiAgY2xlYW46IHtcbiAgICBtZXNzYWdlVHlwZXM6IFsnYnVpbGQnXSxcbiAgICBkZWZhdWx0U2V2ZXJpdHk6ICdidWlsZCcsXG4gICAgY2FuQ2FuY2VsOiBmYWxzZSxcbiAgfSxcbiAgdGVzdDoge1xuICAgIG1lc3NhZ2VUeXBlczogWydlcnJvcicsICd3YXJuaW5nJywgJ2J1aWxkJywgJ3Rlc3QnXSxcbiAgICBkZWZhdWx0U2V2ZXJpdHk6ICd0ZXN0JyxcbiAgICBjYW5DYW5jZWw6IHRydWUsXG4gIH0sXG4gIGJlbmNoOiB7XG4gICAgbWVzc2FnZVR5cGVzOiBbJ2Vycm9yJywgJ3dhcm5pbmcnLCAnYnVpbGQnLCAndGVzdCddLFxuICAgIGRlZmF1bHRTZXZlcml0eTogJ3Rlc3QnLFxuICAgIGNhbkNhbmNlbDogdHJ1ZSxcbiAgfSxcbiAgZGVwczoge1xuICAgIG1lc3NhZ2VUeXBlczogWydidWlsZCddLFxuICAgIGRlZmF1bHRTZXZlcml0eTogJ2J1aWxkJyxcbiAgICBjYW5DYW5jZWw6IHRydWUsXG4gIH0sXG59XG5cbmV4cG9ydCBjbGFzcyBJZGVCYWNrZW5kIHtcbiAgcHJpdmF0ZSBkaXNwb3NhYmxlczogQ29tcG9zaXRlRGlzcG9zYWJsZVxuICBwcml2YXRlIHVwaTogVVBJLklVUElJbnN0YW5jZVxuICBwcml2YXRlIHJ1bm5pbmc6IGJvb2xlYW4gPSBmYWxzZVxuICBwcml2YXRlIGNvbW1hbmRzID0ge1xuICAgIC4uLnRoaXMuY2FiYWxDb21tYW5kcygpLFxuICAgICdpZGUtaGFza2VsbC1jYWJhbDpzZXQtYnVpbGQtdGFyZ2V0JzogYXN5bmMgKCkgPT5cbiAgICAgIHRoaXMudXBpLnNldENvbmZpZ1BhcmFtKCd0YXJnZXQnKSxcbiAgICAnaWRlLWhhc2tlbGwtY2FiYWw6c2V0LWFjdGl2ZS1idWlsZGVyJzogYXN5bmMgKCkgPT5cbiAgICAgIHRoaXMudXBpLnNldENvbmZpZ1BhcmFtKCdidWlsZGVyJyksXG4gIH1cbiAgcHJpdmF0ZSBtZW51ID0gW1xuICAgIHsgbGFiZWw6ICdCdWlsZCBQcm9qZWN0JywgY29tbWFuZDogJ2lkZS1oYXNrZWxsLWNhYmFsOmJ1aWxkJyB9LFxuICAgIHsgbGFiZWw6ICdDbGVhbiBQcm9qZWN0JywgY29tbWFuZDogJ2lkZS1oYXNrZWxsLWNhYmFsOmNsZWFuJyB9LFxuICAgIHsgbGFiZWw6ICdUZXN0JywgY29tbWFuZDogJ2lkZS1oYXNrZWxsLWNhYmFsOnRlc3QnIH0sXG4gICAgeyBsYWJlbDogJ0JlbmNoJywgY29tbWFuZDogJ2lkZS1oYXNrZWxsLWNhYmFsOmJlbmNoJyB9LFxuICAgIHsgbGFiZWw6ICdCdWlsZCBEZXBlbmRlbmNpZXMnLCBjb21tYW5kOiAnaWRlLWhhc2tlbGwtY2FiYWw6ZGVwcycgfSxcbiAgICB7IGxhYmVsOiAnU2V0IEFjdGl2ZSBCdWlsZGVyJywgY29tbWFuZDogJ2lkZS1oYXNrZWxsLWNhYmFsOnNldC1hY3RpdmUtYnVpbGRlcicgfSxcbiAgICB7IGxhYmVsOiAnU2V0IEJ1aWxkIFRhcmdldCcsIGNvbW1hbmQ6ICdpZGUtaGFza2VsbC1jYWJhbDpzZXQtYnVpbGQtdGFyZ2V0JyB9LFxuICBdXG4gIGNvbnN0cnVjdG9yKHJlZzogVVBJLklVUElSZWdpc3RyYXRpb24pIHtcbiAgICB0aGlzLnVwaSA9IHJlZyh7XG4gICAgICBuYW1lOiAnaWRlLWhhc2tlbGwtY2FiYWwnLFxuICAgICAgbWVzc2FnZVR5cGVzOiB7XG4gICAgICAgIGVycm9yOiB7fSxcbiAgICAgICAgd2FybmluZzoge30sXG4gICAgICAgIGJ1aWxkOiB7XG4gICAgICAgICAgdXJpRmlsdGVyOiBmYWxzZSxcbiAgICAgICAgICBhdXRvU2Nyb2xsOiB0cnVlLFxuICAgICAgICB9LFxuICAgICAgICB0ZXN0OiB7XG4gICAgICAgICAgdXJpRmlsdGVyOiBmYWxzZSxcbiAgICAgICAgICBhdXRvU2Nyb2xsOiB0cnVlLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIG1lbnU6IHtcbiAgICAgICAgbGFiZWw6ICdCdWlsZGVyJyxcbiAgICAgICAgbWVudTogdGhpcy5tZW51LFxuICAgICAgfSxcbiAgICAgIHBhcmFtczoge1xuICAgICAgICBidWlsZGVyOiB0aGlzLmJ1aWxkZXJQYXJhbUluZm8oKSxcbiAgICAgICAgdGFyZ2V0OiB0aGlzLnRhcmdldFBhcmFtSW5mbygpLFxuICAgICAgfSxcbiAgICB9KVxuXG4gICAgdGhpcy5kaXNwb3NhYmxlcyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKClcblxuICAgIHRoaXMuZGlzcG9zYWJsZXMuYWRkKGF0b20uY29tbWFuZHMuYWRkKCdhdG9tLXdvcmtzcGFjZScsIHRoaXMuY29tbWFuZHMpKVxuICAgIHRoaXMuZGlzcG9zYWJsZXMuYWRkKHRoaXMudXBpKVxuICB9XG5cbiAgcHVibGljIGRlc3Ryb3koKSB7XG4gICAgdGhpcy5kaXNwb3NhYmxlcy5kaXNwb3NlKClcbiAgfVxuXG4gIHByaXZhdGUgY2FiYWxDb21tYW5kcygpIHtcbiAgICBjb25zdCByZXQgPSB7fVxuICAgIGZvciAoY29uc3QgY21kIG9mIE9iamVjdC5rZXlzKGNvbW1hbmRPcHRpb25zKSkge1xuICAgICAgcmV0W2BpZGUtaGFza2VsbC1jYWJhbDoke2NtZH1gXSA9IGFzeW5jICgpID0+XG4gICAgICAgIHRoaXMucnVuQ2FiYWxDb21tYW5kKGNtZClcbiAgICB9XG4gICAgcmV0dXJuIHJldFxuICB9XG5cbiAgcHJpdmF0ZSBidWlsZGVyUGFyYW1JbmZvKCk6IFVQSS5JUGFyYW1TcGVjPEJ1aWxkZXJQYXJhbVR5cGU+IHtcbiAgICByZXR1cm4ge1xuICAgICAgaXRlbXM6ICgpOiBCdWlsZGVyUGFyYW1UeXBlW10gPT4ge1xuICAgICAgICBjb25zdCBidWlsZGVycyA9IFt7IG5hbWU6ICdjYWJhbCcgfSwgeyBuYW1lOiAnc3RhY2snIH1dXG4gICAgICAgIGlmIChhdG9tLmNvbmZpZy5nZXQoJ2lkZS1oYXNrZWxsLWNhYmFsLmVuYWJsZU5peEJ1aWxkJykpIHtcbiAgICAgICAgICBidWlsZGVycy5wdXNoKHsgbmFtZTogJ2NhYmFsLW5peCcgfSlcbiAgICAgICAgfVxuICAgICAgICBidWlsZGVycy5wdXNoKHsgbmFtZTogJ25vbmUnIH0pXG4gICAgICAgIHJldHVybiBidWlsZGVyc1xuICAgICAgfSxcbiAgICAgIGl0ZW1UZW1wbGF0ZTogKGl0ZW06IEJ1aWxkZXJQYXJhbVR5cGUpID0+IGA8bGk+PGRpdiBjbGFzcz0nbmFtZSc+JHtpdGVtLm5hbWV9PC9kaXY+PC9saT5gLFxuICAgICAgZGlzcGxheVRlbXBsYXRlOiAoaXRlbT86IEJ1aWxkZXJQYXJhbVR5cGUpID0+IGl0ZW0gJiYgaXRlbS5uYW1lID8gaXRlbS5uYW1lIDogJ05vdCBzZXQnLFxuICAgICAgaXRlbUZpbHRlcktleTogJ25hbWUnLFxuICAgICAgZGVzY3JpcHRpb246ICdTZWxlY3QgYnVpbGRlciB0byB1c2Ugd2l0aCBjdXJyZW50IHByb2plY3QnLFxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgdGFyZ2V0UGFyYW1JbmZvKCk6IFVQSS5JUGFyYW1TcGVjPFRhcmdldFBhcmFtVHlwZT4ge1xuICAgIGNvbnN0IGRlZmF1bHRWYWwgPSB7XG4gICAgICBwcm9qZWN0OiAnQXV0bycsXG4gICAgICBjb21wb25lbnQ6IHVuZGVmaW5lZCxcbiAgICAgIGRpcjogdW5kZWZpbmVkLFxuICAgICAgdGFyZ2V0OiB1bmRlZmluZWQsXG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICBkZWZhdWx0OiBkZWZhdWx0VmFsLFxuICAgICAgaXRlbXM6IGFzeW5jICgpOiBQcm9taXNlPFRhcmdldFBhcmFtVHlwZVtdPiA9PiB7XG4gICAgICAgIGNvbnN0IHByb2plY3RzOiBUYXJnZXRQYXJhbVR5cGVbXSA9IFtkZWZhdWx0VmFsXVxuICAgICAgICBmb3IgKGNvbnN0IGQgb2YgYXRvbS5wcm9qZWN0LmdldERpcmVjdG9yaWVzKCkpIHtcbiAgICAgICAgICBjb25zdCBkaXIgPSBkLmdldFBhdGgoKVxuICAgICAgICAgIGNvbnN0IFtjYWJhbEZpbGVdID0gKGF3YWl0IFV0aWwuZ2V0Um9vdERpcihkaXIpKS5nZXRFbnRyaWVzU3luYygpLmZpbHRlcihpc0NhYmFsRmlsZSlcbiAgICAgICAgICBpZiAoY2FiYWxGaWxlICYmIGNhYmFsRmlsZS5pc0ZpbGUoKSkge1xuICAgICAgICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IGNhYmFsRmlsZS5yZWFkKClcbiAgICAgICAgICAgIGNvbnN0IHByb2plY3QgPSBhd2FpdCBVdGlsLnBhcnNlRG90Q2FiYWwoZGF0YSlcbiAgICAgICAgICAgIGlmIChwcm9qZWN0KSB7XG4gICAgICAgICAgICAgIHByb2plY3RzLnB1c2goeyBwcm9qZWN0OiBwcm9qZWN0Lm5hbWUsIGRpciwgY29tcG9uZW50OiB1bmRlZmluZWQsIHRhcmdldDogdW5kZWZpbmVkIH0pXG4gICAgICAgICAgICAgIGZvciAoY29uc3QgdGFyZ2V0IG9mIHByb2plY3QudGFyZ2V0cykge1xuICAgICAgICAgICAgICAgIHByb2plY3RzLnB1c2goeyBwcm9qZWN0OiBwcm9qZWN0Lm5hbWUsIGRpciwgdGFyZ2V0LCBjb21wb25lbnQ6IHRhcmdldC50YXJnZXQgfSlcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcHJvamVjdHNcbiAgICAgIH0sXG4gICAgICBpdGVtVGVtcGxhdGU6ICh0Z3Q6IFRhcmdldFBhcmFtVHlwZSkgPT5cbiAgICAgICAgYDxsaT5cbiAgICAgICAgICA8ZGl2IGNsYXNzPSdwcm9qZWN0Jz4ke3RndC5wcm9qZWN0fTwvZGl2PlxuICAgICAgICAgIDxkaXYgY2xhc3M9J2Rpcic+JHt0Z3QuZGlyIHx8ICcnfTwvZGl2PlxuICAgICAgICAgICR7XG4gICAgICAgIHRndC50YXJnZXQgP1xuICAgICAgICAgIGBcbiAgICAgICAgICAgIDxkaXYgY2xhc3M9J3R5cGUnPiR7dGd0LnRhcmdldC50eXBlfTwvZGl2PlxuICAgICAgICAgICAgPGRpdiBjbGFzcz0nbmFtZSc+JHt0Z3QudGFyZ2V0Lm5hbWV9PC9kaXY+XG4gICAgICAgICAgICBgIDpcbiAgICAgICAgICBgPGRpdiBjbGFzcz0nbmFtZSc+JHsnQWxsJ308L2Rpdj5gXG4gICAgICAgIH1cbiAgICAgICAgICA8ZGl2IGNsYXNzPSdjbGVhcmZpeCc+PC9kaXY+XG4gICAgICAgIDwvbGk+YCxcbiAgICAgIGRpc3BsYXlUZW1wbGF0ZTogKGl0ZW0/OiBUYXJnZXRQYXJhbVR5cGUpID0+IHtcbiAgICAgICAgaWYgKCFpdGVtKSByZXR1cm4gJ3VuZGVmaW5lZCdcbiAgICAgICAgaWYgKCFpdGVtLmRpcikge1xuICAgICAgICAgIHJldHVybiBpdGVtLnByb2plY3RcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gYCR7aXRlbS5wcm9qZWN0fTogJHtpdGVtLnRhcmdldCA/IGl0ZW0udGFyZ2V0Lm5hbWUgOiAnQWxsJ31gXG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBpdGVtRmlsdGVyS2V5OiAnbmFtZScsXG4gICAgICBkZXNjcmlwdGlvbjogJ1NlbGVjdCB0YXJnZXQgdG8gYnVpbGQnLFxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgZ2V0QWN0aXZlUHJvamVjdFBhdGgoKTogc3RyaW5nIHtcbiAgICBjb25zdCBlZGl0b3IgPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKClcbiAgICBpZiAoZWRpdG9yICYmIGVkaXRvci5nZXRQYXRoKCkpIHtcbiAgICAgIHJldHVybiBwYXRoLmRpcm5hbWUoZWRpdG9yLmdldFBhdGgoKSlcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGF0b20ucHJvamVjdC5nZXRQYXRocygpWzBdIHx8IHByb2Nlc3MuY3dkKClcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGdldEFjdGl2ZVByb2plY3RUYXJnZXQoY2FiYWxmaWxlOiBzdHJpbmcsIGNhYmFsUm9vdDogQXRvbVR5cGVzLkRpcmVjdG9yeSkge1xuICAgIGNvbnN0IGVkaXRvciA9IGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVRleHRFZGl0b3IoKVxuICAgIGlmIChlZGl0b3IgJiYgZWRpdG9yLmdldFBhdGgoKSkge1xuICAgICAgcmV0dXJuIFV0aWwuZ2V0Q29tcG9uZW50RnJvbUZpbGUoY2FiYWxmaWxlLCBjYWJhbFJvb3QucmVsYXRpdml6ZShlZGl0b3IuZ2V0UGF0aCgpKSlcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIFtdXG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBjYWJhbEJ1aWxkKGNtZDogQ2FiYWxDb21tYW5kLCBvcHRzOiBCdWlsZGVycy5JUGFyYW1zKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdHJ5IHtcbiAgICAgIGlmICh0aGlzLnJ1bm5pbmcpIHtcbiAgICAgICAgdGhpcy51cGkuc2V0U3RhdHVzKHsgc3RhdHVzOiAnd2FybmluZycsIGRldGFpbDogJ0J1aWxkZXIgYWxyZWFkeSBydW5uaW5nJyB9KVxuICAgICAgICByZXR1cm5cbiAgICAgIH1cbiAgICAgIHRoaXMucnVubmluZyA9IHRydWVcblxuICAgICAgY29uc3QgYnVpbGRlclBhcmFtID0gYXdhaXQgdGhpcy51cGkuZ2V0Q29uZmlnUGFyYW08QnVpbGRlclBhcmFtVHlwZT4oJ2J1aWxkZXInKVxuICAgICAgY29uc3QgdGFyZ2V0ID0gYXdhaXQgdGhpcy51cGkuZ2V0Q29uZmlnUGFyYW08VGFyZ2V0UGFyYW1UeXBlPigndGFyZ2V0JylcblxuICAgICAgaWYgKHRhcmdldCA9PT0gdW5kZWZpbmVkKSB7IHRocm93IG5ldyBFcnJvcignVGFyZ2V0IHVuZGVmaW5lZCcpIH1cbiAgICAgIGlmIChidWlsZGVyUGFyYW0gPT09IHVuZGVmaW5lZCkgeyB0aHJvdyBuZXcgRXJyb3IoJ0J1aWxkZXIgdW5kZWZpbmVkJykgfVxuXG4gICAgICB0aGlzLnVwaS5zZXRTdGF0dXMoe1xuICAgICAgICBzdGF0dXM6ICdwcm9ncmVzcycsXG4gICAgICAgIHByb2dyZXNzOiBvcHRzLm9uUHJvZ3Jlc3MgPyAwLjAgOiB1bmRlZmluZWQsXG4gICAgICAgIGRldGFpbDogJycsXG4gICAgICB9KVxuXG4gICAgICBjb25zdCBjYWJhbFJvb3QgPSBhd2FpdCBVdGlsLmdldFJvb3REaXIodGFyZ2V0LmRpciA/IHRhcmdldC5kaXIgOiB0aGlzLmdldEFjdGl2ZVByb2plY3RQYXRoKCkpXG5cbiAgICAgIGNvbnN0IFtjYWJhbEZpbGVdOiBBdG9tVHlwZXMuRmlsZVtdID0gY2FiYWxSb290LmdldEVudHJpZXNTeW5jKCkuZmlsdGVyKGlzQ2FiYWxGaWxlKVxuXG4gICAgICBpZiAoIWNhYmFsRmlsZSkgeyB0aHJvdyBuZXcgRXJyb3IoJ05vIGNhYmFsIGZpbGUgZm91bmQnKSB9XG5cbiAgICAgIGxldCBuZXdUYXJnZXQgPSB7IC4uLnRhcmdldCB9XG5cbiAgICAgIGlmICghbmV3VGFyZ2V0LnRhcmdldCAmJiBbJ2J1aWxkJywgJ2RlcHMnXS5pbmNsdWRlcyhjbWQpKSB7XG4gICAgICAgIGNvbnN0IGNhYmFsQ29udGVudHMgPSBhd2FpdCBjYWJhbEZpbGUucmVhZCgpXG4gICAgICAgIGNvbnN0IHRndHMgPSBhd2FpdCB0aGlzLmdldEFjdGl2ZVByb2plY3RUYXJnZXQoY2FiYWxDb250ZW50cywgY2FiYWxSb290KVxuICAgICAgICBjb25zdCBbdGd0XSA9IHRndHNcbiAgICAgICAgaWYgKHRndCkge1xuICAgICAgICAgIGNvbnN0IGNmID0gYXdhaXQgVXRpbC5wYXJzZURvdENhYmFsKGNhYmFsQ29udGVudHMpXG4gICAgICAgICAgaWYgKGNmKSB7XG4gICAgICAgICAgICBuZXdUYXJnZXQgPSB7XG4gICAgICAgICAgICAgIHByb2plY3Q6IGNmLm5hbWUsXG4gICAgICAgICAgICAgIGNvbXBvbmVudDogdGd0LFxuICAgICAgICAgICAgICBkaXI6IGNhYmFsUm9vdC5nZXRQYXRoKCksXG4gICAgICAgICAgICAgIHRhcmdldDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgY29uc3QgYnVpbGRlcnM6IFRCdWlsZGVycyA9IHtcbiAgICAgICAgJ2NhYmFsLW5peCc6IEJ1aWxkZXJzLkNhYmFsTml4LFxuICAgICAgICAnY2FiYWwnOiBCdWlsZGVycy5DYWJhbCxcbiAgICAgICAgJ3N0YWNrJzogQnVpbGRlcnMuU3RhY2ssXG4gICAgICAgICdub25lJzogQnVpbGRlcnMuTm9uZSxcbiAgICAgIH1cbiAgICAgIGNvbnN0IGJ1aWxkZXIgPSBidWlsZGVyc1tidWlsZGVyUGFyYW0ubmFtZV1cblxuICAgICAgaWYgKGJ1aWxkZXIgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFVua25vd24gYnVpbGRlciAnJHsoYnVpbGRlclBhcmFtICYmIGJ1aWxkZXJQYXJhbS5uYW1lKSB8fCBidWlsZGVyUGFyYW19J2ApXG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IChuZXcgYnVpbGRlcih7IG9wdHMsIHRhcmdldCwgY2FiYWxSb290IH0pKS5ydW5Db21tYW5kKGNtZClcbiAgICAgIC8vIHNlZSBDYWJhbFByb2Nlc3MgZm9yIGV4cGxhaW5hdGlvblxuICAgICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOiBuby1udWxsLWtleXdvcmRcbiAgICAgIGlmIChyZXMuZXhpdENvZGUgPT09IG51bGwpIHsgLy8gdGhpcyBtZWFucyBwcm9jZXNzIHdhcyBraWxsZWRcbiAgICAgICAgdGhpcy51cGkuc2V0U3RhdHVzKHsgc3RhdHVzOiAnd2FybmluZycsIGRldGFpbDogJ0J1aWxkIHdhcyBpbnRlcnJ1cHRlZCcgfSlcbiAgICAgIH0gZWxzZSBpZiAocmVzLmV4aXRDb2RlICE9PSAwKSB7XG4gICAgICAgIGlmIChyZXMuaGFzRXJyb3IpIHtcbiAgICAgICAgICB0aGlzLnVwaS5zZXRTdGF0dXMoeyBzdGF0dXM6ICd3YXJuaW5nJywgZGV0YWlsOiAnVGhlcmUgd2VyZSBlcnJvcnMgaW4gc291cmNlIGZpbGVzJyB9KVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMudXBpLnNldFN0YXR1cyh7XG4gICAgICAgICAgICBzdGF0dXM6ICdlcnJvcicsXG4gICAgICAgICAgICBkZXRhaWw6IGBCdWlsZGVyIHF1aXQgYWJub3JtYWxseSB3aXRoIGV4aXQgY29kZSAke3Jlcy5leGl0Q29kZX1gLFxuICAgICAgICAgIH0pXG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMudXBpLnNldFN0YXR1cyh7IHN0YXR1czogJ3JlYWR5JywgZGV0YWlsOiAnQnVpbGQgd2FzIHN1Y2Nlc3NmdWwnIH0pXG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGlmIChlcnJvcikge1xuICAgICAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6IG5vLWNvbnNvbGVcbiAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcilcbiAgICAgICAgdGhpcy51cGkuc2V0U3RhdHVzKHsgc3RhdHVzOiAnZXJyb3InLCBkZXRhaWw6IGVycm9yLnRvU3RyaW5nKCkgfSlcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMudXBpLnNldFN0YXR1cyh7IHN0YXR1czogJ3dhcm5pbmcnLCBkZXRhaWw6ICdCdWlsZCBmYWlsZWQgd2l0aCBubyBlcnJvcnMnIH0pXG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMucnVubmluZyA9IGZhbHNlXG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHJ1bkNhYmFsQ29tbWFuZChjb21tYW5kOiBDYWJhbENvbW1hbmQpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCB7IG1lc3NhZ2VUeXBlcywgZGVmYXVsdFNldmVyaXR5LCBjYW5DYW5jZWwgfSA9IGNvbW1hbmRPcHRpb25zW2NvbW1hbmRdXG4gICAgY29uc3QgbWVzc2FnZXM6IFVQSS5JUmVzdWx0SXRlbVtdID0gW11cbiAgICB0aGlzLnVwaS5zZXRNZXNzYWdlcyhtZXNzYWdlcylcblxuICAgIGxldCBjYW5jZWxBY3Rpb25EaXNwOiBBdG9tVHlwZXMuRGlzcG9zYWJsZSB8IHVuZGVmaW5lZFxuXG4gICAgYXdhaXQgdGhpcy5jYWJhbEJ1aWxkKGNvbW1hbmQsIHtcbiAgICAgIHNldmVyaXR5OiBkZWZhdWx0U2V2ZXJpdHksXG4gICAgICBzZXRDYW5jZWxBY3Rpb246XG4gICAgICBjYW5DYW5jZWwgP1xuICAgICAgICAoYWN0aW9uOiAoKSA9PiB2b2lkKSA9PiB7XG4gICAgICAgICAgY2FuY2VsQWN0aW9uRGlzcCAmJiBjYW5jZWxBY3Rpb25EaXNwLmRpc3Bvc2UoKVxuICAgICAgICAgIGNhbmNlbEFjdGlvbkRpc3AgPSB0aGlzLnVwaS5hZGRQYW5lbENvbnRyb2woe1xuICAgICAgICAgICAgZWxlbWVudDogJ2lkZS1oYXNrZWxsLWJ1dHRvbicsXG4gICAgICAgICAgICBvcHRzOiB7XG4gICAgICAgICAgICAgIGNsYXNzZXM6IFsnY2FuY2VsJ10sXG4gICAgICAgICAgICAgIGV2ZW50czoge1xuICAgICAgICAgICAgICAgIGNsaWNrOiBhY3Rpb24sXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0pXG4gICAgICAgIH0gOiB1bmRlZmluZWQsXG4gICAgICBvbk1zZzogKG1lc3NhZ2U6IFVQSS5JUmVzdWx0SXRlbSkgPT4ge1xuICAgICAgICBpZiAobWVzc2FnZVR5cGVzLmluY2x1ZGVzKG1lc3NhZ2Uuc2V2ZXJpdHkpKSB7XG4gICAgICAgICAgbWVzc2FnZXMucHVzaChtZXNzYWdlKVxuICAgICAgICAgIHRoaXMudXBpLnNldE1lc3NhZ2VzKG1lc3NhZ2VzKVxuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgb25Qcm9ncmVzczpcbiAgICAgIGNhbkNhbmNlbFxuICAgICAgICA/IChwcm9ncmVzczogbnVtYmVyKSA9PiB0aGlzLnVwaS5zZXRTdGF0dXMoeyBzdGF0dXM6ICdwcm9ncmVzcycsIHByb2dyZXNzLCBkZXRhaWw6IGAke2NvbW1hbmR9IGluIHByb2dyZXNzYCB9KVxuICAgICAgICA6IHVuZGVmaW5lZCxcbiAgICB9KVxuICAgIGNhbmNlbEFjdGlvbkRpc3AgJiYgY2FuY2VsQWN0aW9uRGlzcC5kaXNwb3NlKClcbiAgfVxufVxuIl19