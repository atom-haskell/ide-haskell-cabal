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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaWRlLWJhY2tlbmQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaWRlLWJhY2tlbmQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUFBLDZCQUE0QjtBQUM1QiwrQkFBMEM7QUFDMUMsdUNBQXNDO0FBQ3RDLDJDQUEwQztBQUsxQyxxQkFBcUIsSUFBMkM7SUFDOUQsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksSUFBSSxJQUFJLENBQUMsTUFBTSxFQUFFLElBQUksSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFBO0FBQzNFLENBQUM7QUFpQkQsTUFBTSxjQUFjLEdBQTJDO0lBQzdELEtBQUssRUFBRTtRQUNMLFlBQVksRUFBRSxDQUFDLE9BQU8sRUFBRSxTQUFTLEVBQUUsT0FBTyxDQUFDO1FBQzNDLGVBQWUsRUFBRSxPQUFPO1FBQ3hCLFNBQVMsRUFBRSxJQUFJO0tBQ2hCO0lBQ0QsS0FBSyxFQUFFO1FBQ0wsWUFBWSxFQUFFLENBQUMsT0FBTyxDQUFDO1FBQ3ZCLGVBQWUsRUFBRSxPQUFPO1FBQ3hCLFNBQVMsRUFBRSxLQUFLO0tBQ2pCO0lBQ0QsSUFBSSxFQUFFO1FBQ0osWUFBWSxFQUFFLENBQUMsT0FBTyxFQUFFLFNBQVMsRUFBRSxPQUFPLEVBQUUsTUFBTSxDQUFDO1FBQ25ELGVBQWUsRUFBRSxNQUFNO1FBQ3ZCLFNBQVMsRUFBRSxJQUFJO0tBQ2hCO0lBQ0QsS0FBSyxFQUFFO1FBQ0wsWUFBWSxFQUFFLENBQUMsT0FBTyxFQUFFLFNBQVMsRUFBRSxPQUFPLEVBQUUsTUFBTSxDQUFDO1FBQ25ELGVBQWUsRUFBRSxNQUFNO1FBQ3ZCLFNBQVMsRUFBRSxJQUFJO0tBQ2hCO0lBQ0QsSUFBSSxFQUFFO1FBQ0osWUFBWSxFQUFFLENBQUMsT0FBTyxDQUFDO1FBQ3ZCLGVBQWUsRUFBRSxPQUFPO1FBQ3hCLFNBQVMsRUFBRSxJQUFJO0tBQ2hCO0NBQ0YsQ0FB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QkFDRCxVQUFVLEVBQ1YsU0FBUztvQkFDUCxDQUFDLENBQUMsQ0FBQyxRQUFnQixFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxFQUFFLE1BQU0sRUFBRSxVQUFVLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRSxHQUFHLE9BQU8sY0FBYyxFQUFFLENBQUM7b0JBQzlHLENBQUMsQ0FBQyxTQUFTO2FBQ2QsQ0FBQyxDQUFBO1lBQ0YsZ0JBQWdCLElBQUksZ0JBQWdCLENBQUMsT0FBTyxFQUFFLENBQUE7UUFDaEQsQ0FBQztLQUFBO0NBQ0Y7QUFuUkQsZ0NBbVJDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJ1xuaW1wb3J0IHsgQ29tcG9zaXRlRGlzcG9zYWJsZSB9IGZyb20gJ2F0b20nXG5pbXBvcnQgKiBhcyBCdWlsZGVycyBmcm9tICcuL2J1aWxkZXJzJ1xuaW1wb3J0ICogYXMgVXRpbCBmcm9tICdhdG9tLWhhc2tlbGwtdXRpbHMnXG5pbXBvcnQgeyBUYXJnZXRQYXJhbVR5cGUsIENhYmFsQ29tbWFuZCB9IGZyb20gJy4vY29tbW9uJ1xuXG5pbnRlcmZhY2UgQnVpbGRlclBhcmFtVHlwZSB7IG5hbWU6IHN0cmluZyB9XG5cbmZ1bmN0aW9uIGlzQ2FiYWxGaWxlKGZpbGU/OiBBdG9tVHlwZXMuRmlsZSB8IEF0b21UeXBlcy5EaXJlY3RvcnkpOiBmaWxlIGlzIEF0b21UeXBlcy5GaWxlIHtcbiAgcmV0dXJuICEhKGZpbGUgJiYgZmlsZS5pc0ZpbGUoKSAmJiBmaWxlLmdldEJhc2VOYW1lKCkuZW5kc1dpdGgoJy5jYWJhbCcpKVxufVxuXG5pbnRlcmZhY2UgSUNvbW1hbmRPcHRpb25zIHtcbiAgbWVzc2FnZVR5cGVzOiBVUEkuVFNldmVyaXR5W11cbiAgZGVmYXVsdFNldmVyaXR5OiBVUEkuVFNldmVyaXR5XG4gIGNhbkNhbmNlbDogYm9vbGVhblxufVxuXG50eXBlIFRCdWlsZGVycyA9IHtcbiAgW2s6IHN0cmluZ106XG4gIHR5cGVvZiBCdWlsZGVycy5DYWJhbE5peCB8XG4gIHR5cGVvZiBCdWlsZGVycy5DYWJhbCB8XG4gIHR5cGVvZiBCdWlsZGVycy5TdGFjayB8XG4gIHR5cGVvZiBCdWlsZGVycy5Ob25lIHxcbiAgdW5kZWZpbmVkXG59XG5cbmNvbnN0IGNvbW1hbmRPcHRpb25zOiB7W0sgaW4gQ2FiYWxDb21tYW5kXTogSUNvbW1hbmRPcHRpb25zfSA9IHtcbiAgYnVpbGQ6IHtcbiAgICBtZXNzYWdlVHlwZXM6IFsnZXJyb3InLCAnd2FybmluZycsICdidWlsZCddLFxuICAgIGRlZmF1bHRTZXZlcml0eTogJ2J1aWxkJyxcbiAgICBjYW5DYW5jZWw6IHRydWUsXG4gIH0sXG4gIGNsZWFuOiB7XG4gICAgbWVzc2FnZVR5cGVzOiBbJ2J1aWxkJ10sXG4gICAgZGVmYXVsdFNldmVyaXR5OiAnYnVpbGQnLFxuICAgIGNhbkNhbmNlbDogZmFsc2UsXG4gIH0sXG4gIHRlc3Q6IHtcbiAgICBtZXNzYWdlVHlwZXM6IFsnZXJyb3InLCAnd2FybmluZycsICdidWlsZCcsICd0ZXN0J10sXG4gICAgZGVmYXVsdFNldmVyaXR5OiAndGVzdCcsXG4gICAgY2FuQ2FuY2VsOiB0cnVlLFxuICB9LFxuICBiZW5jaDoge1xuICAgIG1lc3NhZ2VUeXBlczogWydlcnJvcicsICd3YXJuaW5nJywgJ2J1aWxkJywgJ3Rlc3QnXSxcbiAgICBkZWZhdWx0U2V2ZXJpdHk6ICd0ZXN0JyxcbiAgICBjYW5DYW5jZWw6IHRydWUsXG4gIH0sXG4gIGRlcHM6IHtcbiAgICBtZXNzYWdlVHlwZXM6IFsnYnVpbGQnXSxcbiAgICBkZWZhdWx0U2V2ZXJpdHk6ICdidWlsZCcsXG4gICAgY2FuQ2FuY2VsOiB0cnVlLFxuICB9LFxufVxuXG5leHBvcnQgY2xhc3MgSWRlQmFja2VuZCB7XG4gIHByaXZhdGUgZGlzcG9zYWJsZXM6IENvbXBvc2l0ZURpc3Bvc2FibGVcbiAgcHJpdmF0ZSB1cGk6IFVQSS5JVVBJSW5zdGFuY2VcbiAgcHJpdmF0ZSBydW5uaW5nOiBib29sZWFuID0gZmFsc2VcbiAgcHJpdmF0ZSBjb21tYW5kcyA9IHtcbiAgICAuLi50aGlzLmNhYmFsQ29tbWFuZHMoKSxcbiAgICAnaWRlLWhhc2tlbGwtY2FiYWw6c2V0LWJ1aWxkLXRhcmdldCc6IGFzeW5jICgpID0+XG4gICAgICB0aGlzLnVwaS5zZXRDb25maWdQYXJhbSgndGFyZ2V0JyksXG4gICAgJ2lkZS1oYXNrZWxsLWNhYmFsOnNldC1hY3RpdmUtYnVpbGRlcic6IGFzeW5jICgpID0+XG4gICAgICB0aGlzLnVwaS5zZXRDb25maWdQYXJhbSgnYnVpbGRlcicpLFxuICB9XG4gIHByaXZhdGUgbWVudSA9IFtcbiAgICB7IGxhYmVsOiAnQnVpbGQgUHJvamVjdCcsIGNvbW1hbmQ6ICdpZGUtaGFza2VsbC1jYWJhbDpidWlsZCcgfSxcbiAgICB7IGxhYmVsOiAnQ2xlYW4gUHJvamVjdCcsIGNvbW1hbmQ6ICdpZGUtaGFza2VsbC1jYWJhbDpjbGVhbicgfSxcbiAgICB7IGxhYmVsOiAnVGVzdCcsIGNvbW1hbmQ6ICdpZGUtaGFza2VsbC1jYWJhbDp0ZXN0JyB9LFxuICAgIHsgbGFiZWw6ICdCZW5jaCcsIGNvbW1hbmQ6ICdpZGUtaGFza2VsbC1jYWJhbDpiZW5jaCcgfSxcbiAgICB7IGxhYmVsOiAnQnVpbGQgRGVwZW5kZW5jaWVzJywgY29tbWFuZDogJ2lkZS1oYXNrZWxsLWNhYmFsOmRlcHMnIH0sXG4gICAgeyBsYWJlbDogJ1NldCBBY3RpdmUgQnVpbGRlcicsIGNvbW1hbmQ6ICdpZGUtaGFza2VsbC1jYWJhbDpzZXQtYWN0aXZlLWJ1aWxkZXInIH0sXG4gICAgeyBsYWJlbDogJ1NldCBCdWlsZCBUYXJnZXQnLCBjb21tYW5kOiAnaWRlLWhhc2tlbGwtY2FiYWw6c2V0LWJ1aWxkLXRhcmdldCcgfSxcbiAgXVxuICBjb25zdHJ1Y3RvcihyZWc6IFVQSS5JVVBJUmVnaXN0cmF0aW9uKSB7XG4gICAgdGhpcy51cGkgPSByZWcoe1xuICAgICAgbmFtZTogJ2lkZS1oYXNrZWxsLWNhYmFsJyxcbiAgICAgIG1lc3NhZ2VUeXBlczoge1xuICAgICAgICBlcnJvcjoge30sXG4gICAgICAgIHdhcm5pbmc6IHt9LFxuICAgICAgICBidWlsZDoge1xuICAgICAgICAgIHVyaUZpbHRlcjogZmFsc2UsXG4gICAgICAgICAgYXV0b1Njcm9sbDogdHJ1ZSxcbiAgICAgICAgfSxcbiAgICAgICAgdGVzdDoge1xuICAgICAgICAgIHVyaUZpbHRlcjogZmFsc2UsXG4gICAgICAgICAgYXV0b1Njcm9sbDogdHJ1ZSxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICBtZW51OiB7XG4gICAgICAgIGxhYmVsOiAnQnVpbGRlcicsXG4gICAgICAgIG1lbnU6IHRoaXMubWVudSxcbiAgICAgIH0sXG4gICAgICBwYXJhbXM6IHtcbiAgICAgICAgYnVpbGRlcjogdGhpcy5idWlsZGVyUGFyYW1JbmZvKCksXG4gICAgICAgIHRhcmdldDogdGhpcy50YXJnZXRQYXJhbUluZm8oKSxcbiAgICAgIH0sXG4gICAgfSlcblxuICAgIHRoaXMuZGlzcG9zYWJsZXMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpXG5cbiAgICB0aGlzLmRpc3Bvc2FibGVzLmFkZChhdG9tLmNvbW1hbmRzLmFkZCgnYXRvbS13b3Jrc3BhY2UnLCB0aGlzLmNvbW1hbmRzKSlcbiAgICB0aGlzLmRpc3Bvc2FibGVzLmFkZCh0aGlzLnVwaSlcbiAgfVxuXG4gIHB1YmxpYyBkZXN0cm95KCkge1xuICAgIHRoaXMuZGlzcG9zYWJsZXMuZGlzcG9zZSgpXG4gIH1cblxuICBwcml2YXRlIGNhYmFsQ29tbWFuZHMoKSB7XG4gICAgY29uc3QgcmV0ID0ge31cbiAgICBmb3IgKGNvbnN0IGNtZCBvZiBPYmplY3Qua2V5cyhjb21tYW5kT3B0aW9ucykpIHtcbiAgICAgIHJldFtgaWRlLWhhc2tlbGwtY2FiYWw6JHtjbWR9YF0gPSBhc3luYyAoKSA9PlxuICAgICAgICB0aGlzLnJ1bkNhYmFsQ29tbWFuZChjbWQpXG4gICAgfVxuICAgIHJldHVybiByZXRcbiAgfVxuXG4gIHByaXZhdGUgYnVpbGRlclBhcmFtSW5mbygpOiBVUEkuSVBhcmFtU3BlYzxCdWlsZGVyUGFyYW1UeXBlPiB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGl0ZW1zOiAoKTogQnVpbGRlclBhcmFtVHlwZVtdID0+IHtcbiAgICAgICAgY29uc3QgYnVpbGRlcnMgPSBbeyBuYW1lOiAnY2FiYWwnIH0sIHsgbmFtZTogJ3N0YWNrJyB9XVxuICAgICAgICBpZiAoYXRvbS5jb25maWcuZ2V0KCdpZGUtaGFza2VsbC1jYWJhbC5lbmFibGVOaXhCdWlsZCcpKSB7XG4gICAgICAgICAgYnVpbGRlcnMucHVzaCh7IG5hbWU6ICdjYWJhbC1uaXgnIH0pXG4gICAgICAgIH1cbiAgICAgICAgYnVpbGRlcnMucHVzaCh7IG5hbWU6ICdub25lJyB9KVxuICAgICAgICByZXR1cm4gYnVpbGRlcnNcbiAgICAgIH0sXG4gICAgICBpdGVtVGVtcGxhdGU6IChpdGVtOiBCdWlsZGVyUGFyYW1UeXBlKSA9PiBgPGxpPjxkaXYgY2xhc3M9J25hbWUnPiR7aXRlbS5uYW1lfTwvZGl2PjwvbGk+YCxcbiAgICAgIGRpc3BsYXlUZW1wbGF0ZTogKGl0ZW0/OiBCdWlsZGVyUGFyYW1UeXBlKSA9PiBpdGVtICYmIGl0ZW0ubmFtZSA/IGl0ZW0ubmFtZSA6ICdOb3Qgc2V0JyxcbiAgICAgIGl0ZW1GaWx0ZXJLZXk6ICduYW1lJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnU2VsZWN0IGJ1aWxkZXIgdG8gdXNlIHdpdGggY3VycmVudCBwcm9qZWN0JyxcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHRhcmdldFBhcmFtSW5mbygpOiBVUEkuSVBhcmFtU3BlYzxUYXJnZXRQYXJhbVR5cGU+IHtcbiAgICBjb25zdCBkZWZhdWx0VmFsID0ge1xuICAgICAgcHJvamVjdDogJ0F1dG8nLFxuICAgICAgY29tcG9uZW50OiB1bmRlZmluZWQsXG4gICAgICBkaXI6IHVuZGVmaW5lZCxcbiAgICAgIHRhcmdldDogdW5kZWZpbmVkLFxuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgZGVmYXVsdDogZGVmYXVsdFZhbCxcbiAgICAgIGl0ZW1zOiBhc3luYyAoKTogUHJvbWlzZTxUYXJnZXRQYXJhbVR5cGVbXT4gPT4ge1xuICAgICAgICBjb25zdCBwcm9qZWN0czogVGFyZ2V0UGFyYW1UeXBlW10gPSBbZGVmYXVsdFZhbF1cbiAgICAgICAgZm9yIChjb25zdCBkIG9mIGF0b20ucHJvamVjdC5nZXREaXJlY3RvcmllcygpKSB7XG4gICAgICAgICAgY29uc3QgZGlyID0gZC5nZXRQYXRoKClcbiAgICAgICAgICBjb25zdCBbY2FiYWxGaWxlXSA9IChhd2FpdCBVdGlsLmdldFJvb3REaXIoZGlyKSkuZ2V0RW50cmllc1N5bmMoKS5maWx0ZXIoaXNDYWJhbEZpbGUpXG4gICAgICAgICAgaWYgKGNhYmFsRmlsZSAmJiBjYWJhbEZpbGUuaXNGaWxlKCkpIHtcbiAgICAgICAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCBjYWJhbEZpbGUucmVhZCgpXG4gICAgICAgICAgICBjb25zdCBwcm9qZWN0ID0gYXdhaXQgVXRpbC5wYXJzZURvdENhYmFsKGRhdGEpXG4gICAgICAgICAgICBpZiAocHJvamVjdCkge1xuICAgICAgICAgICAgICBwcm9qZWN0cy5wdXNoKHsgcHJvamVjdDogcHJvamVjdC5uYW1lLCBkaXIsIGNvbXBvbmVudDogdW5kZWZpbmVkLCB0YXJnZXQ6IHVuZGVmaW5lZCB9KVxuICAgICAgICAgICAgICBmb3IgKGNvbnN0IHRhcmdldCBvZiBwcm9qZWN0LnRhcmdldHMpIHtcbiAgICAgICAgICAgICAgICBwcm9qZWN0cy5wdXNoKHsgcHJvamVjdDogcHJvamVjdC5uYW1lLCBkaXIsIHRhcmdldCwgY29tcG9uZW50OiB0YXJnZXQudGFyZ2V0IH0pXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHByb2plY3RzXG4gICAgICB9LFxuICAgICAgaXRlbVRlbXBsYXRlOiAodGd0OiBUYXJnZXRQYXJhbVR5cGUpID0+XG4gICAgICAgIGA8bGk+XG4gICAgICAgICAgPGRpdiBjbGFzcz0ncHJvamVjdCc+JHt0Z3QucHJvamVjdH08L2Rpdj5cbiAgICAgICAgICA8ZGl2IGNsYXNzPSdkaXInPiR7dGd0LmRpciB8fCAnJ308L2Rpdj5cbiAgICAgICAgICAke1xuICAgICAgICB0Z3QudGFyZ2V0ID9cbiAgICAgICAgICBgXG4gICAgICAgICAgICA8ZGl2IGNsYXNzPSd0eXBlJz4ke3RndC50YXJnZXQudHlwZX08L2Rpdj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3M9J25hbWUnPiR7dGd0LnRhcmdldC5uYW1lfTwvZGl2PlxuICAgICAgICAgICAgYCA6XG4gICAgICAgICAgYDxkaXYgY2xhc3M9J25hbWUnPiR7J0FsbCd9PC9kaXY+YFxuICAgICAgICB9XG4gICAgICAgICAgPGRpdiBjbGFzcz0nY2xlYXJmaXgnPjwvZGl2PlxuICAgICAgICA8L2xpPmAsXG4gICAgICBkaXNwbGF5VGVtcGxhdGU6IChpdGVtPzogVGFyZ2V0UGFyYW1UeXBlKSA9PiB7XG4gICAgICAgIGlmICghaXRlbSkgcmV0dXJuICd1bmRlZmluZWQnXG4gICAgICAgIGlmICghaXRlbS5kaXIpIHtcbiAgICAgICAgICByZXR1cm4gaXRlbS5wcm9qZWN0XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIGAke2l0ZW0ucHJvamVjdH06ICR7aXRlbS50YXJnZXQgPyBpdGVtLnRhcmdldC5uYW1lIDogJ0FsbCd9YFxuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgaXRlbUZpbHRlcktleTogJ25hbWUnLFxuICAgICAgZGVzY3JpcHRpb246ICdTZWxlY3QgdGFyZ2V0IHRvIGJ1aWxkJyxcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGdldEFjdGl2ZVByb2plY3RQYXRoKCk6IHN0cmluZyB7XG4gICAgY29uc3QgZWRpdG9yID0gYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpXG4gICAgaWYgKGVkaXRvciAmJiBlZGl0b3IuZ2V0UGF0aCgpKSB7XG4gICAgICByZXR1cm4gcGF0aC5kaXJuYW1lKGVkaXRvci5nZXRQYXRoKCkpXG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBhdG9tLnByb2plY3QuZ2V0UGF0aHMoKVswXSB8fCBwcm9jZXNzLmN3ZCgpXG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBnZXRBY3RpdmVQcm9qZWN0VGFyZ2V0KGNhYmFsZmlsZTogc3RyaW5nLCBjYWJhbFJvb3Q6IEF0b21UeXBlcy5EaXJlY3RvcnkpIHtcbiAgICBjb25zdCBlZGl0b3IgPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKClcbiAgICBpZiAoZWRpdG9yICYmIGVkaXRvci5nZXRQYXRoKCkpIHtcbiAgICAgIHJldHVybiBVdGlsLmdldENvbXBvbmVudEZyb21GaWxlKGNhYmFsZmlsZSwgY2FiYWxSb290LnJlbGF0aXZpemUoZWRpdG9yLmdldFBhdGgoKSkpXG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBbXVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgY2FiYWxCdWlsZChjbWQ6IENhYmFsQ29tbWFuZCwgb3B0czogQnVpbGRlcnMuSVBhcmFtcyk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRyeSB7XG4gICAgICBpZiAodGhpcy5ydW5uaW5nKSB7XG4gICAgICAgIHRoaXMudXBpLnNldFN0YXR1cyh7IHN0YXR1czogJ3dhcm5pbmcnLCBkZXRhaWw6ICdCdWlsZGVyIGFscmVhZHkgcnVubmluZycgfSlcbiAgICAgICAgcmV0dXJuXG4gICAgICB9XG4gICAgICB0aGlzLnJ1bm5pbmcgPSB0cnVlXG5cbiAgICAgIGNvbnN0IGJ1aWxkZXJQYXJhbSA9IGF3YWl0IHRoaXMudXBpLmdldENvbmZpZ1BhcmFtPEJ1aWxkZXJQYXJhbVR5cGU+KCdidWlsZGVyJylcbiAgICAgIGNvbnN0IHRhcmdldCA9IGF3YWl0IHRoaXMudXBpLmdldENvbmZpZ1BhcmFtPFRhcmdldFBhcmFtVHlwZT4oJ3RhcmdldCcpXG5cbiAgICAgIGlmICh0YXJnZXQgPT09IHVuZGVmaW5lZCkgeyB0aHJvdyBuZXcgRXJyb3IoJ1RhcmdldCB1bmRlZmluZWQnKSB9XG4gICAgICBpZiAoYnVpbGRlclBhcmFtID09PSB1bmRlZmluZWQpIHsgdGhyb3cgbmV3IEVycm9yKCdCdWlsZGVyIHVuZGVmaW5lZCcpIH1cblxuICAgICAgdGhpcy51cGkuc2V0U3RhdHVzKHtcbiAgICAgICAgc3RhdHVzOiAncHJvZ3Jlc3MnLFxuICAgICAgICBwcm9ncmVzczogb3B0cy5vblByb2dyZXNzID8gMC4wIDogdW5kZWZpbmVkLFxuICAgICAgICBkZXRhaWw6ICcnLFxuICAgICAgfSlcblxuICAgICAgY29uc3QgY2FiYWxSb290ID0gYXdhaXQgVXRpbC5nZXRSb290RGlyKHRhcmdldC5kaXIgPyB0YXJnZXQuZGlyIDogdGhpcy5nZXRBY3RpdmVQcm9qZWN0UGF0aCgpKVxuXG4gICAgICBjb25zdCBbY2FiYWxGaWxlXTogQXRvbVR5cGVzLkZpbGVbXSA9IGNhYmFsUm9vdC5nZXRFbnRyaWVzU3luYygpLmZpbHRlcihpc0NhYmFsRmlsZSlcblxuICAgICAgaWYgKCFjYWJhbEZpbGUpIHsgdGhyb3cgbmV3IEVycm9yKCdObyBjYWJhbCBmaWxlIGZvdW5kJykgfVxuXG4gICAgICBsZXQgbmV3VGFyZ2V0ID0geyAuLi50YXJnZXQgfVxuXG4gICAgICBpZiAoIW5ld1RhcmdldC50YXJnZXQgJiYgWydidWlsZCcsICdkZXBzJ10uaW5jbHVkZXMoY21kKSkge1xuICAgICAgICBjb25zdCBjYWJhbENvbnRlbnRzID0gYXdhaXQgY2FiYWxGaWxlLnJlYWQoKVxuICAgICAgICBjb25zdCB0Z3RzID0gYXdhaXQgdGhpcy5nZXRBY3RpdmVQcm9qZWN0VGFyZ2V0KGNhYmFsQ29udGVudHMsIGNhYmFsUm9vdClcbiAgICAgICAgY29uc3QgW3RndF0gPSB0Z3RzXG4gICAgICAgIGlmICh0Z3QpIHtcbiAgICAgICAgICBjb25zdCBjZiA9IGF3YWl0IFV0aWwucGFyc2VEb3RDYWJhbChjYWJhbENvbnRlbnRzKVxuICAgICAgICAgIGlmIChjZikge1xuICAgICAgICAgICAgbmV3VGFyZ2V0ID0ge1xuICAgICAgICAgICAgICBwcm9qZWN0OiBjZi5uYW1lLFxuICAgICAgICAgICAgICBjb21wb25lbnQ6IHRndCxcbiAgICAgICAgICAgICAgZGlyOiBjYWJhbFJvb3QuZ2V0UGF0aCgpLFxuICAgICAgICAgICAgICB0YXJnZXQ6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGNvbnN0IGJ1aWxkZXJzOiBUQnVpbGRlcnMgPSB7XG4gICAgICAgICdjYWJhbC1uaXgnOiBCdWlsZGVycy5DYWJhbE5peCxcbiAgICAgICAgJ2NhYmFsJzogQnVpbGRlcnMuQ2FiYWwsXG4gICAgICAgICdzdGFjayc6IEJ1aWxkZXJzLlN0YWNrLFxuICAgICAgICAnbm9uZSc6IEJ1aWxkZXJzLk5vbmUsXG4gICAgICB9XG4gICAgICBjb25zdCBidWlsZGVyID0gYnVpbGRlcnNbYnVpbGRlclBhcmFtLm5hbWVdXG5cbiAgICAgIGlmIChidWlsZGVyID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbmtub3duIGJ1aWxkZXIgJyR7KGJ1aWxkZXJQYXJhbSAmJiBidWlsZGVyUGFyYW0ubmFtZSkgfHwgYnVpbGRlclBhcmFtfSdgKVxuICAgICAgfVxuXG4gICAgICBjb25zdCByZXMgPSBhd2FpdCAobmV3IGJ1aWxkZXIoeyBvcHRzLCB0YXJnZXQ6IG5ld1RhcmdldCwgY2FiYWxSb290IH0pKS5ydW5Db21tYW5kKGNtZClcbiAgICAgIC8vIHNlZSBDYWJhbFByb2Nlc3MgZm9yIGV4cGxhaW5hdGlvblxuICAgICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOiBuby1udWxsLWtleXdvcmRcbiAgICAgIGlmIChyZXMuZXhpdENvZGUgPT09IG51bGwpIHsgLy8gdGhpcyBtZWFucyBwcm9jZXNzIHdhcyBraWxsZWRcbiAgICAgICAgdGhpcy51cGkuc2V0U3RhdHVzKHsgc3RhdHVzOiAnd2FybmluZycsIGRldGFpbDogJ0J1aWxkIHdhcyBpbnRlcnJ1cHRlZCcgfSlcbiAgICAgIH0gZWxzZSBpZiAocmVzLmV4aXRDb2RlICE9PSAwKSB7XG4gICAgICAgIGlmIChyZXMuaGFzRXJyb3IpIHtcbiAgICAgICAgICB0aGlzLnVwaS5zZXRTdGF0dXMoeyBzdGF0dXM6ICd3YXJuaW5nJywgZGV0YWlsOiAnVGhlcmUgd2VyZSBlcnJvcnMgaW4gc291cmNlIGZpbGVzJyB9KVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMudXBpLnNldFN0YXR1cyh7XG4gICAgICAgICAgICBzdGF0dXM6ICdlcnJvcicsXG4gICAgICAgICAgICBkZXRhaWw6IGBCdWlsZGVyIHF1aXQgYWJub3JtYWxseSB3aXRoIGV4aXQgY29kZSAke3Jlcy5leGl0Q29kZX1gLFxuICAgICAgICAgIH0pXG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMudXBpLnNldFN0YXR1cyh7IHN0YXR1czogJ3JlYWR5JywgZGV0YWlsOiAnQnVpbGQgd2FzIHN1Y2Nlc3NmdWwnIH0pXG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGlmIChlcnJvcikge1xuICAgICAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6IG5vLWNvbnNvbGVcbiAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcilcbiAgICAgICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOiBuby11bnNhZmUtYW55XG4gICAgICAgIHRoaXMudXBpLnNldFN0YXR1cyh7IHN0YXR1czogJ2Vycm9yJywgZGV0YWlsOiBlcnJvci50b1N0cmluZygpIH0pXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnVwaS5zZXRTdGF0dXMoeyBzdGF0dXM6ICd3YXJuaW5nJywgZGV0YWlsOiAnQnVpbGQgZmFpbGVkIHdpdGggbm8gZXJyb3JzJyB9KVxuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLnJ1bm5pbmcgPSBmYWxzZVxuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBydW5DYWJhbENvbW1hbmQoY29tbWFuZDogQ2FiYWxDb21tYW5kKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgeyBtZXNzYWdlVHlwZXMsIGRlZmF1bHRTZXZlcml0eSwgY2FuQ2FuY2VsIH0gPSBjb21tYW5kT3B0aW9uc1tjb21tYW5kXVxuICAgIGNvbnN0IG1lc3NhZ2VzOiBVUEkuSVJlc3VsdEl0ZW1bXSA9IFtdXG4gICAgdGhpcy51cGkuc2V0TWVzc2FnZXMobWVzc2FnZXMpXG5cbiAgICBsZXQgY2FuY2VsQWN0aW9uRGlzcDogQXRvbVR5cGVzLkRpc3Bvc2FibGUgfCB1bmRlZmluZWRcblxuICAgIGF3YWl0IHRoaXMuY2FiYWxCdWlsZChjb21tYW5kLCB7XG4gICAgICBzZXZlcml0eTogZGVmYXVsdFNldmVyaXR5LFxuICAgICAgc2V0Q2FuY2VsQWN0aW9uOlxuICAgICAgY2FuQ2FuY2VsID9cbiAgICAgICAgKGFjdGlvbjogKCkgPT4gdm9pZCkgPT4ge1xuICAgICAgICAgIGNhbmNlbEFjdGlvbkRpc3AgJiYgY2FuY2VsQWN0aW9uRGlzcC5kaXNwb3NlKClcbiAgICAgICAgICBjYW5jZWxBY3Rpb25EaXNwID0gdGhpcy51cGkuYWRkUGFuZWxDb250cm9sKHtcbiAgICAgICAgICAgIGVsZW1lbnQ6ICdpZGUtaGFza2VsbC1idXR0b24nLFxuICAgICAgICAgICAgb3B0czoge1xuICAgICAgICAgICAgICBjbGFzc2VzOiBbJ2NhbmNlbCddLFxuICAgICAgICAgICAgICBldmVudHM6IHtcbiAgICAgICAgICAgICAgICBjbGljazogYWN0aW9uLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9KVxuICAgICAgICB9IDogdW5kZWZpbmVkLFxuICAgICAgb25Nc2c6IChtZXNzYWdlOiBVUEkuSVJlc3VsdEl0ZW0pID0+IHtcbiAgICAgICAgaWYgKG1lc3NhZ2VUeXBlcy5pbmNsdWRlcyhtZXNzYWdlLnNldmVyaXR5KSkge1xuICAgICAgICAgIG1lc3NhZ2VzLnB1c2gobWVzc2FnZSlcbiAgICAgICAgICB0aGlzLnVwaS5zZXRNZXNzYWdlcyhtZXNzYWdlcylcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIG9uUHJvZ3Jlc3M6XG4gICAgICBjYW5DYW5jZWxcbiAgICAgICAgPyAocHJvZ3Jlc3M6IG51bWJlcikgPT4gdGhpcy51cGkuc2V0U3RhdHVzKHsgc3RhdHVzOiAncHJvZ3Jlc3MnLCBwcm9ncmVzcywgZGV0YWlsOiBgJHtjb21tYW5kfSBpbiBwcm9ncmVzc2AgfSlcbiAgICAgICAgOiB1bmRlZmluZWQsXG4gICAgfSlcbiAgICBjYW5jZWxBY3Rpb25EaXNwICYmIGNhbmNlbEFjdGlvbkRpc3AuZGlzcG9zZSgpXG4gIH1cbn1cbiJdfQ==