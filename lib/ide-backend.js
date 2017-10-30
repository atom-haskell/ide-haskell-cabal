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
                const res = yield Util.getComponentFromFile(cabalfile, cabalRoot.relativize(editor.getPath()));
                if (res)
                    return res;
                else
                    return [];
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
                const res = yield (new builder({ opts, target: newTarget, cabalRoot })).runCommand(cmd);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaWRlLWJhY2tlbmQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaWRlLWJhY2tlbmQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUFBLDZCQUE0QjtBQUM1QiwrQkFBMEM7QUFDMUMsdUNBQXNDO0FBQ3RDLDJDQUEwQztBQUsxQyxxQkFBcUIsSUFBMkM7SUFDOUQsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksSUFBSSxJQUFJLENBQUMsTUFBTSxFQUFFLElBQUksSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFBO0FBQzNFLENBQUM7QUFpQkQsTUFBTSxjQUFjLEdBQTJDO0lBQzdELEtBQUssRUFBRTtRQUNMLFlBQVksRUFBRSxDQUFDLE9BQU8sRUFBRSxTQUFTLEVBQUUsT0FBTyxDQUFDO1FBQzNDLGVBQWUsRUFBRSxPQUFPO1FBQ3hCLFNBQVMsRUFBRSxJQUFJO0tBQ2hCO0lBQ0QsS0FBSyxFQUFFO1FBQ0wsWUFBWSxFQUFFLENBQUMsT0FBTyxDQUFDO1FBQ3ZCLGVBQWUsRUFBRSxPQUFPO1FBQ3hCLFNBQVMsRUFBRSxLQUFLO0tBQ2pCO0lBQ0QsSUFBSSxFQUFFO1FBQ0osWUFBWSxFQUFFLENBQUMsT0FBTyxFQUFFLFNBQVMsRUFBRSxPQUFPLEVBQUUsTUFBTSxDQUFDO1FBQ25ELGVBQWUsRUFBRSxNQUFNO1FBQ3ZCLFNBQVMsRUFBRSxJQUFJO0tBQ2hCO0lBQ0QsS0FBSyxFQUFFO1FBQ0wsWUFBWSxFQUFFLENBQUMsT0FBTyxFQUFFLFNBQVMsRUFBRSxPQUFPLEVBQUUsTUFBTSxDQUFDO1FBQ25ELGVBQWUsRUFBRSxNQUFNO1FBQ3ZCLFNBQVMsRUFBRSxJQUFJO0tBQ2hCO0lBQ0QsSUFBSSxFQUFFO1FBQ0osWUFBWSxFQUFFLENBQUMsT0FBTyxDQUFDO1FBQ3ZCLGVBQWUsRUFBRSxPQUFPO1FBQ3hCLFNBQVMsRUFBRSxJQUFJO0tBQ2hCO0NBQ0YsQ0FB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Q0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUE7d0JBQ3RCLElBQUksQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUFBO29CQUNoQyxDQUFDO2dCQUNILENBQUM7Z0JBQ0QsVUFBVSxFQUNWLFNBQVM7b0JBQ1AsQ0FBQyxDQUFDLENBQUMsUUFBZ0IsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsRUFBRSxNQUFNLEVBQUUsVUFBVSxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsR0FBRyxPQUFPLGNBQWMsRUFBRSxDQUFDO29CQUM5RyxDQUFDLENBQUMsU0FBUzthQUNkLENBQUMsQ0FBQTtZQUNGLGdCQUFnQixJQUFJLGdCQUFnQixDQUFDLE9BQU8sRUFBRSxDQUFBO1FBQ2hELENBQUM7S0FBQTtDQUNGO0FBclJELGdDQXFSQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCdcbmltcG9ydCB7IENvbXBvc2l0ZURpc3Bvc2FibGUgfSBmcm9tICdhdG9tJ1xuaW1wb3J0ICogYXMgQnVpbGRlcnMgZnJvbSAnLi9idWlsZGVycydcbmltcG9ydCAqIGFzIFV0aWwgZnJvbSAnYXRvbS1oYXNrZWxsLXV0aWxzJ1xuaW1wb3J0IHsgVGFyZ2V0UGFyYW1UeXBlLCBDYWJhbENvbW1hbmQgfSBmcm9tICcuL2NvbW1vbidcblxuaW50ZXJmYWNlIEJ1aWxkZXJQYXJhbVR5cGUgeyBuYW1lOiBzdHJpbmcgfVxuXG5mdW5jdGlvbiBpc0NhYmFsRmlsZShmaWxlPzogQXRvbVR5cGVzLkZpbGUgfCBBdG9tVHlwZXMuRGlyZWN0b3J5KTogZmlsZSBpcyBBdG9tVHlwZXMuRmlsZSB7XG4gIHJldHVybiAhIShmaWxlICYmIGZpbGUuaXNGaWxlKCkgJiYgZmlsZS5nZXRCYXNlTmFtZSgpLmVuZHNXaXRoKCcuY2FiYWwnKSlcbn1cblxuaW50ZXJmYWNlIElDb21tYW5kT3B0aW9ucyB7XG4gIG1lc3NhZ2VUeXBlczogVVBJLlRTZXZlcml0eVtdXG4gIGRlZmF1bHRTZXZlcml0eTogVVBJLlRTZXZlcml0eVxuICBjYW5DYW5jZWw6IGJvb2xlYW5cbn1cblxudHlwZSBUQnVpbGRlcnMgPSB7XG4gIFtrOiBzdHJpbmddOlxuICB0eXBlb2YgQnVpbGRlcnMuQ2FiYWxOaXggfFxuICB0eXBlb2YgQnVpbGRlcnMuQ2FiYWwgfFxuICB0eXBlb2YgQnVpbGRlcnMuU3RhY2sgfFxuICB0eXBlb2YgQnVpbGRlcnMuTm9uZSB8XG4gIHVuZGVmaW5lZFxufVxuXG5jb25zdCBjb21tYW5kT3B0aW9uczoge1tLIGluIENhYmFsQ29tbWFuZF06IElDb21tYW5kT3B0aW9uc30gPSB7XG4gIGJ1aWxkOiB7XG4gICAgbWVzc2FnZVR5cGVzOiBbJ2Vycm9yJywgJ3dhcm5pbmcnLCAnYnVpbGQnXSxcbiAgICBkZWZhdWx0U2V2ZXJpdHk6ICdidWlsZCcsXG4gICAgY2FuQ2FuY2VsOiB0cnVlLFxuICB9LFxuICBjbGVhbjoge1xuICAgIG1lc3NhZ2VUeXBlczogWydidWlsZCddLFxuICAgIGRlZmF1bHRTZXZlcml0eTogJ2J1aWxkJyxcbiAgICBjYW5DYW5jZWw6IGZhbHNlLFxuICB9LFxuICB0ZXN0OiB7XG4gICAgbWVzc2FnZVR5cGVzOiBbJ2Vycm9yJywgJ3dhcm5pbmcnLCAnYnVpbGQnLCAndGVzdCddLFxuICAgIGRlZmF1bHRTZXZlcml0eTogJ3Rlc3QnLFxuICAgIGNhbkNhbmNlbDogdHJ1ZSxcbiAgfSxcbiAgYmVuY2g6IHtcbiAgICBtZXNzYWdlVHlwZXM6IFsnZXJyb3InLCAnd2FybmluZycsICdidWlsZCcsICd0ZXN0J10sXG4gICAgZGVmYXVsdFNldmVyaXR5OiAndGVzdCcsXG4gICAgY2FuQ2FuY2VsOiB0cnVlLFxuICB9LFxuICBkZXBzOiB7XG4gICAgbWVzc2FnZVR5cGVzOiBbJ2J1aWxkJ10sXG4gICAgZGVmYXVsdFNldmVyaXR5OiAnYnVpbGQnLFxuICAgIGNhbkNhbmNlbDogdHJ1ZSxcbiAgfSxcbn1cblxuZXhwb3J0IGNsYXNzIElkZUJhY2tlbmQge1xuICBwcml2YXRlIGRpc3Bvc2FibGVzOiBDb21wb3NpdGVEaXNwb3NhYmxlXG4gIHByaXZhdGUgdXBpOiBVUEkuSVVQSUluc3RhbmNlXG4gIHByaXZhdGUgcnVubmluZzogYm9vbGVhbiA9IGZhbHNlXG4gIHByaXZhdGUgY29tbWFuZHMgPSB7XG4gICAgLi4udGhpcy5jYWJhbENvbW1hbmRzKCksXG4gICAgJ2lkZS1oYXNrZWxsLWNhYmFsOnNldC1idWlsZC10YXJnZXQnOiBhc3luYyAoKSA9PlxuICAgICAgdGhpcy51cGkuc2V0Q29uZmlnUGFyYW0oJ3RhcmdldCcpLFxuICAgICdpZGUtaGFza2VsbC1jYWJhbDpzZXQtYWN0aXZlLWJ1aWxkZXInOiBhc3luYyAoKSA9PlxuICAgICAgdGhpcy51cGkuc2V0Q29uZmlnUGFyYW0oJ2J1aWxkZXInKSxcbiAgfVxuICBwcml2YXRlIG1lbnUgPSBbXG4gICAgeyBsYWJlbDogJ0J1aWxkIFByb2plY3QnLCBjb21tYW5kOiAnaWRlLWhhc2tlbGwtY2FiYWw6YnVpbGQnIH0sXG4gICAgeyBsYWJlbDogJ0NsZWFuIFByb2plY3QnLCBjb21tYW5kOiAnaWRlLWhhc2tlbGwtY2FiYWw6Y2xlYW4nIH0sXG4gICAgeyBsYWJlbDogJ1Rlc3QnLCBjb21tYW5kOiAnaWRlLWhhc2tlbGwtY2FiYWw6dGVzdCcgfSxcbiAgICB7IGxhYmVsOiAnQmVuY2gnLCBjb21tYW5kOiAnaWRlLWhhc2tlbGwtY2FiYWw6YmVuY2gnIH0sXG4gICAgeyBsYWJlbDogJ0J1aWxkIERlcGVuZGVuY2llcycsIGNvbW1hbmQ6ICdpZGUtaGFza2VsbC1jYWJhbDpkZXBzJyB9LFxuICAgIHsgbGFiZWw6ICdTZXQgQWN0aXZlIEJ1aWxkZXInLCBjb21tYW5kOiAnaWRlLWhhc2tlbGwtY2FiYWw6c2V0LWFjdGl2ZS1idWlsZGVyJyB9LFxuICAgIHsgbGFiZWw6ICdTZXQgQnVpbGQgVGFyZ2V0JywgY29tbWFuZDogJ2lkZS1oYXNrZWxsLWNhYmFsOnNldC1idWlsZC10YXJnZXQnIH0sXG4gIF1cbiAgY29uc3RydWN0b3IocmVnOiBVUEkuSVVQSVJlZ2lzdHJhdGlvbikge1xuICAgIHRoaXMudXBpID0gcmVnKHtcbiAgICAgIG5hbWU6ICdpZGUtaGFza2VsbC1jYWJhbCcsXG4gICAgICBtZXNzYWdlVHlwZXM6IHtcbiAgICAgICAgZXJyb3I6IHt9LFxuICAgICAgICB3YXJuaW5nOiB7fSxcbiAgICAgICAgYnVpbGQ6IHtcbiAgICAgICAgICB1cmlGaWx0ZXI6IGZhbHNlLFxuICAgICAgICAgIGF1dG9TY3JvbGw6IHRydWUsXG4gICAgICAgIH0sXG4gICAgICAgIHRlc3Q6IHtcbiAgICAgICAgICB1cmlGaWx0ZXI6IGZhbHNlLFxuICAgICAgICAgIGF1dG9TY3JvbGw6IHRydWUsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgbWVudToge1xuICAgICAgICBsYWJlbDogJ0J1aWxkZXInLFxuICAgICAgICBtZW51OiB0aGlzLm1lbnUsXG4gICAgICB9LFxuICAgICAgcGFyYW1zOiB7XG4gICAgICAgIGJ1aWxkZXI6IHRoaXMuYnVpbGRlclBhcmFtSW5mbygpLFxuICAgICAgICB0YXJnZXQ6IHRoaXMudGFyZ2V0UGFyYW1JbmZvKCksXG4gICAgICB9LFxuICAgIH0pXG5cbiAgICB0aGlzLmRpc3Bvc2FibGVzID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKVxuXG4gICAgdGhpcy5kaXNwb3NhYmxlcy5hZGQoYXRvbS5jb21tYW5kcy5hZGQoJ2F0b20td29ya3NwYWNlJywgdGhpcy5jb21tYW5kcykpXG4gICAgdGhpcy5kaXNwb3NhYmxlcy5hZGQodGhpcy51cGkpXG4gIH1cblxuICBwdWJsaWMgZGVzdHJveSgpIHtcbiAgICB0aGlzLmRpc3Bvc2FibGVzLmRpc3Bvc2UoKVxuICB9XG5cbiAgcHJpdmF0ZSBjYWJhbENvbW1hbmRzKCkge1xuICAgIGNvbnN0IHJldCA9IHt9XG4gICAgZm9yIChjb25zdCBjbWQgb2YgT2JqZWN0LmtleXMoY29tbWFuZE9wdGlvbnMpKSB7XG4gICAgICByZXRbYGlkZS1oYXNrZWxsLWNhYmFsOiR7Y21kfWBdID0gYXN5bmMgKCkgPT5cbiAgICAgICAgdGhpcy5ydW5DYWJhbENvbW1hbmQoY21kKVxuICAgIH1cbiAgICByZXR1cm4gcmV0XG4gIH1cblxuICBwcml2YXRlIGJ1aWxkZXJQYXJhbUluZm8oKTogVVBJLklQYXJhbVNwZWM8QnVpbGRlclBhcmFtVHlwZT4ge1xuICAgIHJldHVybiB7XG4gICAgICBpdGVtczogKCk6IEJ1aWxkZXJQYXJhbVR5cGVbXSA9PiB7XG4gICAgICAgIGNvbnN0IGJ1aWxkZXJzID0gW3sgbmFtZTogJ2NhYmFsJyB9LCB7IG5hbWU6ICdzdGFjaycgfV1cbiAgICAgICAgaWYgKGF0b20uY29uZmlnLmdldCgnaWRlLWhhc2tlbGwtY2FiYWwuZW5hYmxlTml4QnVpbGQnKSkge1xuICAgICAgICAgIGJ1aWxkZXJzLnB1c2goeyBuYW1lOiAnY2FiYWwtbml4JyB9KVxuICAgICAgICB9XG4gICAgICAgIGJ1aWxkZXJzLnB1c2goeyBuYW1lOiAnbm9uZScgfSlcbiAgICAgICAgcmV0dXJuIGJ1aWxkZXJzXG4gICAgICB9LFxuICAgICAgaXRlbVRlbXBsYXRlOiAoaXRlbTogQnVpbGRlclBhcmFtVHlwZSkgPT4gYDxsaT48ZGl2IGNsYXNzPSduYW1lJz4ke2l0ZW0ubmFtZX08L2Rpdj48L2xpPmAsXG4gICAgICBkaXNwbGF5VGVtcGxhdGU6IChpdGVtPzogQnVpbGRlclBhcmFtVHlwZSkgPT4gaXRlbSAmJiBpdGVtLm5hbWUgPyBpdGVtLm5hbWUgOiAnTm90IHNldCcsXG4gICAgICBpdGVtRmlsdGVyS2V5OiAnbmFtZScsXG4gICAgICBkZXNjcmlwdGlvbjogJ1NlbGVjdCBidWlsZGVyIHRvIHVzZSB3aXRoIGN1cnJlbnQgcHJvamVjdCcsXG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSB0YXJnZXRQYXJhbUluZm8oKTogVVBJLklQYXJhbVNwZWM8VGFyZ2V0UGFyYW1UeXBlPiB7XG4gICAgY29uc3QgZGVmYXVsdFZhbCA9IHtcbiAgICAgIHByb2plY3Q6ICdBdXRvJyxcbiAgICAgIGNvbXBvbmVudDogdW5kZWZpbmVkLFxuICAgICAgZGlyOiB1bmRlZmluZWQsXG4gICAgICB0YXJnZXQ6IHVuZGVmaW5lZCxcbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgIGRlZmF1bHQ6IGRlZmF1bHRWYWwsXG4gICAgICBpdGVtczogYXN5bmMgKCk6IFByb21pc2U8VGFyZ2V0UGFyYW1UeXBlW10+ID0+IHtcbiAgICAgICAgY29uc3QgcHJvamVjdHM6IFRhcmdldFBhcmFtVHlwZVtdID0gW2RlZmF1bHRWYWxdXG4gICAgICAgIGZvciAoY29uc3QgZCBvZiBhdG9tLnByb2plY3QuZ2V0RGlyZWN0b3JpZXMoKSkge1xuICAgICAgICAgIGNvbnN0IGRpciA9IGQuZ2V0UGF0aCgpXG4gICAgICAgICAgY29uc3QgW2NhYmFsRmlsZV0gPSAoYXdhaXQgVXRpbC5nZXRSb290RGlyKGRpcikpLmdldEVudHJpZXNTeW5jKCkuZmlsdGVyKGlzQ2FiYWxGaWxlKVxuICAgICAgICAgIGlmIChjYWJhbEZpbGUgJiYgY2FiYWxGaWxlLmlzRmlsZSgpKSB7XG4gICAgICAgICAgICBjb25zdCBkYXRhID0gYXdhaXQgY2FiYWxGaWxlLnJlYWQoKVxuICAgICAgICAgICAgY29uc3QgcHJvamVjdCA9IGF3YWl0IFV0aWwucGFyc2VEb3RDYWJhbChkYXRhKVxuICAgICAgICAgICAgaWYgKHByb2plY3QpIHtcbiAgICAgICAgICAgICAgcHJvamVjdHMucHVzaCh7IHByb2plY3Q6IHByb2plY3QubmFtZSwgZGlyLCBjb21wb25lbnQ6IHVuZGVmaW5lZCwgdGFyZ2V0OiB1bmRlZmluZWQgfSlcbiAgICAgICAgICAgICAgZm9yIChjb25zdCB0YXJnZXQgb2YgcHJvamVjdC50YXJnZXRzKSB7XG4gICAgICAgICAgICAgICAgcHJvamVjdHMucHVzaCh7IHByb2plY3Q6IHByb2plY3QubmFtZSwgZGlyLCB0YXJnZXQsIGNvbXBvbmVudDogdGFyZ2V0LnRhcmdldCB9KVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBwcm9qZWN0c1xuICAgICAgfSxcbiAgICAgIGl0ZW1UZW1wbGF0ZTogKHRndDogVGFyZ2V0UGFyYW1UeXBlKSA9PlxuICAgICAgICBgPGxpPlxuICAgICAgICAgIDxkaXYgY2xhc3M9J3Byb2plY3QnPiR7dGd0LnByb2plY3R9PC9kaXY+XG4gICAgICAgICAgPGRpdiBjbGFzcz0nZGlyJz4ke3RndC5kaXIgfHwgJyd9PC9kaXY+XG4gICAgICAgICAgJHtcbiAgICAgICAgdGd0LnRhcmdldCA/XG4gICAgICAgICAgYFxuICAgICAgICAgICAgPGRpdiBjbGFzcz0ndHlwZSc+JHt0Z3QudGFyZ2V0LnR5cGV9PC9kaXY+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzPSduYW1lJz4ke3RndC50YXJnZXQubmFtZX08L2Rpdj5cbiAgICAgICAgICAgIGAgOlxuICAgICAgICAgIGA8ZGl2IGNsYXNzPSduYW1lJz4keydBbGwnfTwvZGl2PmBcbiAgICAgICAgfVxuICAgICAgICAgIDxkaXYgY2xhc3M9J2NsZWFyZml4Jz48L2Rpdj5cbiAgICAgICAgPC9saT5gLFxuICAgICAgZGlzcGxheVRlbXBsYXRlOiAoaXRlbT86IFRhcmdldFBhcmFtVHlwZSkgPT4ge1xuICAgICAgICBpZiAoIWl0ZW0pIHJldHVybiAndW5kZWZpbmVkJ1xuICAgICAgICBpZiAoIWl0ZW0uZGlyKSB7XG4gICAgICAgICAgcmV0dXJuIGl0ZW0ucHJvamVjdFxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBgJHtpdGVtLnByb2plY3R9OiAke2l0ZW0udGFyZ2V0ID8gaXRlbS50YXJnZXQubmFtZSA6ICdBbGwnfWBcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIGl0ZW1GaWx0ZXJLZXk6ICduYW1lJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnU2VsZWN0IHRhcmdldCB0byBidWlsZCcsXG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBnZXRBY3RpdmVQcm9qZWN0UGF0aCgpOiBzdHJpbmcge1xuICAgIGNvbnN0IGVkaXRvciA9IGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVRleHRFZGl0b3IoKVxuICAgIGlmIChlZGl0b3IgJiYgZWRpdG9yLmdldFBhdGgoKSkge1xuICAgICAgcmV0dXJuIHBhdGguZGlybmFtZShlZGl0b3IuZ2V0UGF0aCgpKVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gYXRvbS5wcm9qZWN0LmdldFBhdGhzKClbMF0gfHwgcHJvY2Vzcy5jd2QoKVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgZ2V0QWN0aXZlUHJvamVjdFRhcmdldChjYWJhbGZpbGU6IHN0cmluZywgY2FiYWxSb290OiBBdG9tVHlwZXMuRGlyZWN0b3J5KTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICAgIGNvbnN0IGVkaXRvciA9IGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVRleHRFZGl0b3IoKVxuICAgIGlmIChlZGl0b3IgJiYgZWRpdG9yLmdldFBhdGgoKSkge1xuICAgICAgY29uc3QgcmVzID0gYXdhaXQgVXRpbC5nZXRDb21wb25lbnRGcm9tRmlsZShjYWJhbGZpbGUsIGNhYmFsUm9vdC5yZWxhdGl2aXplKGVkaXRvci5nZXRQYXRoKCkpKVxuICAgICAgaWYgKHJlcykgcmV0dXJuIHJlc1xuICAgICAgZWxzZSByZXR1cm4gW11cbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIFtdXG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBjYWJhbEJ1aWxkKGNtZDogQ2FiYWxDb21tYW5kLCBvcHRzOiBCdWlsZGVycy5JUGFyYW1zKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdHJ5IHtcbiAgICAgIGlmICh0aGlzLnJ1bm5pbmcpIHtcbiAgICAgICAgdGhpcy51cGkuc2V0U3RhdHVzKHsgc3RhdHVzOiAnd2FybmluZycsIGRldGFpbDogJ0J1aWxkZXIgYWxyZWFkeSBydW5uaW5nJyB9KVxuICAgICAgICByZXR1cm5cbiAgICAgIH1cbiAgICAgIHRoaXMucnVubmluZyA9IHRydWVcblxuICAgICAgY29uc3QgYnVpbGRlclBhcmFtID0gYXdhaXQgdGhpcy51cGkuZ2V0Q29uZmlnUGFyYW08QnVpbGRlclBhcmFtVHlwZT4oJ2J1aWxkZXInKVxuICAgICAgY29uc3QgdGFyZ2V0ID0gYXdhaXQgdGhpcy51cGkuZ2V0Q29uZmlnUGFyYW08VGFyZ2V0UGFyYW1UeXBlPigndGFyZ2V0JylcblxuICAgICAgaWYgKHRhcmdldCA9PT0gdW5kZWZpbmVkKSB7IHRocm93IG5ldyBFcnJvcignVGFyZ2V0IHVuZGVmaW5lZCcpIH1cbiAgICAgIGlmIChidWlsZGVyUGFyYW0gPT09IHVuZGVmaW5lZCkgeyB0aHJvdyBuZXcgRXJyb3IoJ0J1aWxkZXIgdW5kZWZpbmVkJykgfVxuXG4gICAgICB0aGlzLnVwaS5zZXRTdGF0dXMoe1xuICAgICAgICBzdGF0dXM6ICdwcm9ncmVzcycsXG4gICAgICAgIHByb2dyZXNzOiBvcHRzLm9uUHJvZ3Jlc3MgPyAwLjAgOiB1bmRlZmluZWQsXG4gICAgICAgIGRldGFpbDogJycsXG4gICAgICB9KVxuXG4gICAgICBjb25zdCBjYWJhbFJvb3QgPSBhd2FpdCBVdGlsLmdldFJvb3REaXIodGFyZ2V0LmRpciA/IHRhcmdldC5kaXIgOiB0aGlzLmdldEFjdGl2ZVByb2plY3RQYXRoKCkpXG5cbiAgICAgIGNvbnN0IFtjYWJhbEZpbGVdOiBBdG9tVHlwZXMuRmlsZVtdID0gY2FiYWxSb290LmdldEVudHJpZXNTeW5jKCkuZmlsdGVyKGlzQ2FiYWxGaWxlKVxuXG4gICAgICBpZiAoIWNhYmFsRmlsZSkgeyB0aHJvdyBuZXcgRXJyb3IoJ05vIGNhYmFsIGZpbGUgZm91bmQnKSB9XG5cbiAgICAgIGxldCBuZXdUYXJnZXQgPSB7IC4uLnRhcmdldCB9XG5cbiAgICAgIGlmICghbmV3VGFyZ2V0LnRhcmdldCAmJiBbJ2J1aWxkJywgJ2RlcHMnXS5pbmNsdWRlcyhjbWQpKSB7XG4gICAgICAgIGNvbnN0IGNhYmFsQ29udGVudHMgPSBhd2FpdCBjYWJhbEZpbGUucmVhZCgpXG4gICAgICAgIGNvbnN0IHRndHMgPSBhd2FpdCB0aGlzLmdldEFjdGl2ZVByb2plY3RUYXJnZXQoY2FiYWxDb250ZW50cywgY2FiYWxSb290KVxuICAgICAgICBjb25zdCBbdGd0XSA9IHRndHNcbiAgICAgICAgaWYgKHRndCkge1xuICAgICAgICAgIGNvbnN0IGNmID0gYXdhaXQgVXRpbC5wYXJzZURvdENhYmFsKGNhYmFsQ29udGVudHMpXG4gICAgICAgICAgaWYgKGNmKSB7XG4gICAgICAgICAgICBuZXdUYXJnZXQgPSB7XG4gICAgICAgICAgICAgIHByb2plY3Q6IGNmLm5hbWUsXG4gICAgICAgICAgICAgIGNvbXBvbmVudDogdGd0LFxuICAgICAgICAgICAgICBkaXI6IGNhYmFsUm9vdC5nZXRQYXRoKCksXG4gICAgICAgICAgICAgIHRhcmdldDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgY29uc3QgYnVpbGRlcnM6IFRCdWlsZGVycyA9IHtcbiAgICAgICAgJ2NhYmFsLW5peCc6IEJ1aWxkZXJzLkNhYmFsTml4LFxuICAgICAgICAnY2FiYWwnOiBCdWlsZGVycy5DYWJhbCxcbiAgICAgICAgJ3N0YWNrJzogQnVpbGRlcnMuU3RhY2ssXG4gICAgICAgICdub25lJzogQnVpbGRlcnMuTm9uZSxcbiAgICAgIH1cbiAgICAgIGNvbnN0IGJ1aWxkZXIgPSBidWlsZGVyc1tidWlsZGVyUGFyYW0ubmFtZV1cblxuICAgICAgaWYgKGJ1aWxkZXIgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFVua25vd24gYnVpbGRlciAnJHsoYnVpbGRlclBhcmFtICYmIGJ1aWxkZXJQYXJhbS5uYW1lKSB8fCBidWlsZGVyUGFyYW19J2ApXG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IChuZXcgYnVpbGRlcih7IG9wdHMsIHRhcmdldDogbmV3VGFyZ2V0LCBjYWJhbFJvb3QgfSkpLnJ1bkNvbW1hbmQoY21kKVxuICAgICAgLy8gc2VlIENhYmFsUHJvY2VzcyBmb3IgZXhwbGFpbmF0aW9uXG4gICAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6IG5vLW51bGwta2V5d29yZFxuICAgICAgaWYgKHJlcy5leGl0Q29kZSA9PT0gbnVsbCkgeyAvLyB0aGlzIG1lYW5zIHByb2Nlc3Mgd2FzIGtpbGxlZFxuICAgICAgICB0aGlzLnVwaS5zZXRTdGF0dXMoeyBzdGF0dXM6ICd3YXJuaW5nJywgZGV0YWlsOiAnQnVpbGQgd2FzIGludGVycnVwdGVkJyB9KVxuICAgICAgfSBlbHNlIGlmIChyZXMuZXhpdENvZGUgIT09IDApIHtcbiAgICAgICAgaWYgKHJlcy5oYXNFcnJvcikge1xuICAgICAgICAgIHRoaXMudXBpLnNldFN0YXR1cyh7IHN0YXR1czogJ3dhcm5pbmcnLCBkZXRhaWw6ICdUaGVyZSB3ZXJlIGVycm9ycyBpbiBzb3VyY2UgZmlsZXMnIH0pXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy51cGkuc2V0U3RhdHVzKHtcbiAgICAgICAgICAgIHN0YXR1czogJ2Vycm9yJyxcbiAgICAgICAgICAgIGRldGFpbDogYEJ1aWxkZXIgcXVpdCBhYm5vcm1hbGx5IHdpdGggZXhpdCBjb2RlICR7cmVzLmV4aXRDb2RlfWAsXG4gICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy51cGkuc2V0U3RhdHVzKHsgc3RhdHVzOiAncmVhZHknLCBkZXRhaWw6ICdCdWlsZCB3YXMgc3VjY2Vzc2Z1bCcgfSlcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgaWYgKGVycm9yKSB7XG4gICAgICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTogbm8tY29uc29sZVxuICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKVxuICAgICAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6IG5vLXVuc2FmZS1hbnlcbiAgICAgICAgdGhpcy51cGkuc2V0U3RhdHVzKHsgc3RhdHVzOiAnZXJyb3InLCBkZXRhaWw6IGVycm9yLnRvU3RyaW5nKCkgfSlcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMudXBpLnNldFN0YXR1cyh7IHN0YXR1czogJ3dhcm5pbmcnLCBkZXRhaWw6ICdCdWlsZCBmYWlsZWQgd2l0aCBubyBlcnJvcnMnIH0pXG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMucnVubmluZyA9IGZhbHNlXG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHJ1bkNhYmFsQ29tbWFuZChjb21tYW5kOiBDYWJhbENvbW1hbmQpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCB7IG1lc3NhZ2VUeXBlcywgZGVmYXVsdFNldmVyaXR5LCBjYW5DYW5jZWwgfSA9IGNvbW1hbmRPcHRpb25zW2NvbW1hbmRdXG4gICAgY29uc3QgbWVzc2FnZXM6IFVQSS5JUmVzdWx0SXRlbVtdID0gW11cbiAgICB0aGlzLnVwaS5zZXRNZXNzYWdlcyhtZXNzYWdlcylcblxuICAgIGxldCBjYW5jZWxBY3Rpb25EaXNwOiBBdG9tVHlwZXMuRGlzcG9zYWJsZSB8IHVuZGVmaW5lZFxuXG4gICAgYXdhaXQgdGhpcy5jYWJhbEJ1aWxkKGNvbW1hbmQsIHtcbiAgICAgIHNldmVyaXR5OiBkZWZhdWx0U2V2ZXJpdHksXG4gICAgICBzZXRDYW5jZWxBY3Rpb246XG4gICAgICBjYW5DYW5jZWwgP1xuICAgICAgICAoYWN0aW9uOiAoKSA9PiB2b2lkKSA9PiB7XG4gICAgICAgICAgY2FuY2VsQWN0aW9uRGlzcCAmJiBjYW5jZWxBY3Rpb25EaXNwLmRpc3Bvc2UoKVxuICAgICAgICAgIGNhbmNlbEFjdGlvbkRpc3AgPSB0aGlzLnVwaS5hZGRQYW5lbENvbnRyb2woe1xuICAgICAgICAgICAgZWxlbWVudDogJ2lkZS1oYXNrZWxsLWJ1dHRvbicsXG4gICAgICAgICAgICBvcHRzOiB7XG4gICAgICAgICAgICAgIGNsYXNzZXM6IFsnY2FuY2VsJ10sXG4gICAgICAgICAgICAgIGV2ZW50czoge1xuICAgICAgICAgICAgICAgIGNsaWNrOiBhY3Rpb24sXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0pXG4gICAgICAgIH0gOiB1bmRlZmluZWQsXG4gICAgICBvbk1zZzogKG1lc3NhZ2U6IFVQSS5JUmVzdWx0SXRlbSkgPT4ge1xuICAgICAgICBpZiAobWVzc2FnZVR5cGVzLmluY2x1ZGVzKG1lc3NhZ2Uuc2V2ZXJpdHkpKSB7XG4gICAgICAgICAgbWVzc2FnZXMucHVzaChtZXNzYWdlKVxuICAgICAgICAgIHRoaXMudXBpLnNldE1lc3NhZ2VzKG1lc3NhZ2VzKVxuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgb25Qcm9ncmVzczpcbiAgICAgIGNhbkNhbmNlbFxuICAgICAgICA/IChwcm9ncmVzczogbnVtYmVyKSA9PiB0aGlzLnVwaS5zZXRTdGF0dXMoeyBzdGF0dXM6ICdwcm9ncmVzcycsIHByb2dyZXNzLCBkZXRhaWw6IGAke2NvbW1hbmR9IGluIHByb2dyZXNzYCB9KVxuICAgICAgICA6IHVuZGVmaW5lZCxcbiAgICB9KVxuICAgIGNhbmNlbEFjdGlvbkRpc3AgJiYgY2FuY2VsQWN0aW9uRGlzcC5kaXNwb3NlKClcbiAgfVxufVxuIl19