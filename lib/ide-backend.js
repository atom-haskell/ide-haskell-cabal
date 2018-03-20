"use strict";
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
        this.commands = Object.assign({}, this.cabalCommands(), { 'ide-haskell-cabal:set-build-target': async () => this.upi.setConfigParam('target'), 'ide-haskell-cabal:set-active-builder': async () => this.upi.setConfigParam('builder') });
        this.menu = [
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
            ret[`ide-haskell-cabal:${cmd}`] = async () => this.runCabalCommand(cmd);
        }
        return ret;
    }
    builderParamInfo() {
        return {
            items: () => {
                const builders = [
                    { name: 'cabal' },
                    { name: 'stack' },
                ];
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
            type: 'auto',
            dir: undefined,
        };
        return {
            default: defaultVal,
            items: async () => {
                const projects = [defaultVal];
                for (const d of atom.project.getDirectories()) {
                    const dir = d.getPath();
                    const [cabalFile] = (await Util.getRootDir(dir))
                        .getEntriesSync()
                        .filter(isCabalFile);
                    if (cabalFile && cabalFile.isFile()) {
                        const data = await cabalFile.read();
                        const project = await Util.parseDotCabal(data);
                        if (project) {
                            projects.push({ project: project.name, dir, type: 'auto' });
                            projects.push({ project: project.name, dir, type: 'all' });
                            for (const target of project.targets) {
                                projects.push({
                                    project: project.name,
                                    dir,
                                    type: 'component',
                                    target,
                                    component: target.target,
                                });
                            }
                        }
                    }
                }
                return projects;
            },
            itemTemplate: (tgt) => {
                let desc;
                switch (tgt.type) {
                    case 'auto':
                        desc = `<div class='name'>Auto</div>`;
                        break;
                    case 'all':
                        desc = `<div class='name'>All</div>`;
                        break;
                    case 'component':
                        desc = `
            <div class='type'>${tgt.target.type}</div>
            <div class='name'>${tgt.target.name}</div>
            `;
                        break;
                }
                return `<li>
          <div class='project'>${tgt.project}</div>
          <div class='dir'>${tgt.dir || ''}</div>
          ${desc}
          <div class='clearfix'></div>
        </li>`;
            },
            displayTemplate: (item) => {
                if (!item)
                    return 'undefined';
                if (!item.dir) {
                    return item.project;
                }
                else {
                    let target;
                    switch (item.type) {
                        case 'auto':
                            target = 'Auto';
                            break;
                        case 'all':
                            target = 'All';
                            break;
                        case 'component':
                            target = item.target.name;
                            break;
                    }
                    return `${item.project}: ${target}`;
                }
            },
            itemFilterKey: 'name',
            description: 'Select target to build',
        };
    }
    getActiveProjectPath() {
        const editor = atom.workspace.getActiveTextEditor();
        if (editor) {
            const edpath = editor.getPath();
            if (edpath) {
                return path.dirname(edpath);
            }
        }
        return atom.project.getPaths()[0] || process.cwd();
    }
    async getActiveProjectTarget(cabalfile, cabalRoot) {
        const editor = atom.workspace.getActiveTextEditor();
        if (editor) {
            const edpath = editor.getPath();
            if (edpath) {
                const res = await Util.getComponentFromFile(cabalfile, cabalRoot.relativize(edpath));
                if (res)
                    return res;
                else
                    return [];
            }
        }
        return [];
    }
    async cabalBuild(cmd, opts) {
        try {
            if (this.running) {
                this.upi.setStatus({
                    status: 'warning',
                    detail: 'Builder already running',
                });
                return;
            }
            this.running = true;
            const builderParam = await this.upi.getConfigParam('builder');
            const target = await this.upi.getConfigParam('target');
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
            const cabalRoot = await Util.getRootDir(target.dir ? target.dir : this.getActiveProjectPath());
            const [cabalFile] = cabalRoot.getEntriesSync().filter(isCabalFile);
            if (!cabalFile) {
                throw new Error('No cabal file found');
            }
            let newTarget;
            if (target.type === 'auto') {
                const cabalContents = await cabalFile.read();
                const tgts = await this.getActiveProjectTarget(cabalContents, cabalRoot);
                const [tgt] = tgts;
                if (tgt) {
                    const cf = await Util.parseDotCabal(cabalContents);
                    if (cf) {
                        newTarget = {
                            project: cf.name,
                            dir: cabalRoot.getPath(),
                            type: 'component',
                            component: tgt,
                        };
                    }
                }
            }
            else if (target.type === 'all') {
                const cabalContents = await cabalFile.read();
                const cf = await Util.parseDotCabal(cabalContents);
                if (cf) {
                    newTarget = newTarget = {
                        project: cf.name,
                        dir: cabalRoot.getPath(),
                        type: 'all',
                        targets: cf.targets,
                    };
                }
            }
            else if (target.type === 'component') {
                const { project, dir, component } = target;
                newTarget = { type: 'component', project, dir, component };
            }
            if (!newTarget) {
                newTarget = {
                    type: 'auto',
                    project: target.project,
                    dir: target.dir,
                };
            }
            const builders = {
                'cabal-nix': Builders.CabalNix,
                cabal: Builders.Cabal,
                stack: Builders.Stack,
                none: Builders.None,
            };
            const builder = builders[builderParam.name];
            if (builder === undefined) {
                throw new Error(`Unknown builder '${(builderParam && builderParam.name) ||
                    builderParam}'`);
            }
            const res = await new builder({
                opts,
                target: newTarget,
                cabalRoot,
            }).runCommand(cmd);
            if (res.exitCode === null) {
                this.upi.setStatus({
                    status: 'warning',
                    detail: 'Build was interrupted',
                });
            }
            else if (res.exitCode !== 0) {
                if (res.hasError) {
                    this.upi.setStatus({
                        status: 'warning',
                        detail: 'There were errors in source files',
                    });
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
                this.upi.setStatus({
                    status: 'warning',
                    detail: 'Build failed with no errors',
                });
            }
        }
        this.running = false;
    }
    async runCabalCommand(command) {
        const { messageTypes, defaultSeverity, canCancel } = commandOptions[command];
        const messages = [];
        this.upi.setMessages(messages);
        let cancelActionDisp;
        await this.cabalBuild(command, {
            severity: defaultSeverity,
            setCancelAction: canCancel
                ? (action) => {
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
                }
                : undefined,
            onMsg: (message) => {
                if (messageTypes.includes(message.severity)) {
                    messages.push(message);
                    this.upi.setMessages(messages);
                }
            },
            onProgress: canCancel
                ? (progress) => this.upi.setStatus({
                    status: 'progress',
                    progress,
                    detail: `${command} in progress`,
                })
                : undefined,
        });
        cancelActionDisp && cancelActionDisp.dispose();
    }
}
exports.IdeBackend = IdeBackend;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaWRlLWJhY2tlbmQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaWRlLWJhY2tlbmQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSw2QkFBNEI7QUFDNUIsK0JBQXVFO0FBQ3ZFLHVDQUFzQztBQUN0QywyQ0FBMEM7QUFZMUMscUJBQXFCLElBQXVCO0lBQzFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDLE1BQU0sRUFBRSxJQUFJLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQTtBQUMzRSxDQUFDO0FBaUJELE1BQU0sY0FBYyxHQUE2QztJQUMvRCxLQUFLLEVBQUU7UUFDTCxZQUFZLEVBQUUsQ0FBQyxPQUFPLEVBQUUsU0FBUyxFQUFFLE9BQU8sQ0FBQztRQUMzQyxlQUFlLEVBQUUsT0FBTztRQUN4QixTQUFTLEVBQUUsSUFBSTtLQUNoQjtJQUNELEtBQUssRUFBRTtRQUNMLFlBQVksRUFBRSxDQUFDLE9BQU8sQ0FBQztRQUN2QixlQUFlLEVBQUUsT0FBTztRQUN4QixTQUFTLEVBQUUsS0FBSztLQUNqQjtJQUNELElBQUksRUFBRTtRQUNKLFlBQVksRUFBRSxDQUFDLE9BQU8sRUFBRSxTQUFTLEVBQUUsT0FBTyxFQUFFLE1BQU0sQ0FBQztRQUNuRCxlQUFlLEVBQUUsTUFBTTtRQUN2QixTQUFTLEVBQUUsSUFBSTtLQUNoQjtJQUNELEtBQUssRUFBRTtRQUNMLFlBQVksRUFBRSxDQUFDLE9BQU8sRUFBRSxTQUFTLEVBQUUsT0FBTyxFQUFFLE1BQU0sQ0FBQztRQUNuRCxlQUFlLEVBQUUsTUFBTTtRQUN2QixTQUFTLEVBQUUsSUFBSTtLQUNoQjtJQUNELElBQUksRUFBRTtRQUNKLFlBQVksRUFBRSxDQUFDLE9BQU8sQ0FBQztRQUN2QixlQUFlLEVBQUUsT0FBTztRQUN4QixTQUFTLEVBQUUsSUFBSTtLQUNoQjtDQUNGLENBQUE7QUFFRDtJ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QUFnQixDQUFDLE9BQU8sRUFBRSxDQUFBO29CQUM5QyxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLGVBQWUsQ0FBQzt3QkFDMUMsT0FBTyxFQUFFLG9CQUFvQjt3QkFDN0IsSUFBSSxFQUFFOzRCQUNKLE9BQU8sRUFBRSxDQUFDLFFBQVEsQ0FBQzs0QkFDbkIsTUFBTSxFQUFFO2dDQUNOLEtBQUssRUFBRSxNQUFNOzZCQUNkO3lCQUNGO3FCQUNGLENBQUMsQ0FBQTtnQkFDSixDQUFDO2dCQUNILENBQUMsQ0FBQyxTQUFTO1lBQ2IsS0FBSyxFQUFFLENBQUMsT0FBd0IsRUFBRSxFQUFFO2dCQUNsQyxFQUFFLENBQUMsQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQzVDLFFBQVEsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUE7b0JBQ3RCLElBQUksQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUFBO2dCQUNoQyxDQUFDO1lBQ0gsQ0FBQztZQUNELFVBQVUsRUFBRSxTQUFTO2dCQUNuQixDQUFDLENBQUMsQ0FBQyxRQUFnQixFQUFFLEVBQUUsQ0FDbkIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUM7b0JBQ2pCLE1BQU0sRUFBRSxVQUFVO29CQUNsQixRQUFRO29CQUNSLE1BQU0sRUFBRSxHQUFHLE9BQU8sY0FBYztpQkFDakMsQ0FBQztnQkFDTixDQUFDLENBQUMsU0FBUztTQUNkLENBQUMsQ0FBQTtRQUNGLGdCQUFnQixJQUFJLGdCQUFnQixDQUFDLE9BQU8sRUFBRSxDQUFBO0lBQ2hELENBQUM7Q0FDRjtBQXBZRCxnQ0FvWUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnXG5pbXBvcnQgeyBGaWxlLCBDb21wb3NpdGVEaXNwb3NhYmxlLCBEaXNwb3NhYmxlLCBEaXJlY3RvcnkgfSBmcm9tICdhdG9tJ1xuaW1wb3J0ICogYXMgQnVpbGRlcnMgZnJvbSAnLi9idWlsZGVycydcbmltcG9ydCAqIGFzIFV0aWwgZnJvbSAnYXRvbS1oYXNrZWxsLXV0aWxzJ1xuaW1wb3J0IHtcbiAgVGFyZ2V0UGFyYW1UeXBlLFxuICBDYWJhbENvbW1hbmQsXG4gIFRhcmdldFBhcmFtVHlwZUZvckJ1aWxkZXIsXG59IGZyb20gJy4vY29tbW9uJ1xuaW1wb3J0ICogYXMgVVBJIGZyb20gJ2F0b20taGFza2VsbC11cGknXG5cbmludGVyZmFjZSBCdWlsZGVyUGFyYW1UeXBlIHtcbiAgbmFtZTogJ2NhYmFsJyB8ICdzdGFjaycgfCAnY2FiYWwtbml4JyB8ICdub25lJ1xufVxuXG5mdW5jdGlvbiBpc0NhYmFsRmlsZShmaWxlPzogRmlsZSB8IERpcmVjdG9yeSk6IGZpbGUgaXMgRmlsZSB7XG4gIHJldHVybiAhIShmaWxlICYmIGZpbGUuaXNGaWxlKCkgJiYgZmlsZS5nZXRCYXNlTmFtZSgpLmVuZHNXaXRoKCcuY2FiYWwnKSlcbn1cblxuaW50ZXJmYWNlIElDb21tYW5kT3B0aW9ucyB7XG4gIG1lc3NhZ2VUeXBlczogVVBJLlRTZXZlcml0eVtdXG4gIGRlZmF1bHRTZXZlcml0eTogVVBJLlRTZXZlcml0eVxuICBjYW5DYW5jZWw6IGJvb2xlYW5cbn1cblxuaW50ZXJmYWNlIEJ1aWxkZXJDb25zdHJ1Y3RvciB7XG4gIG5ldyAob3B0czogQnVpbGRlcnMuQ3Rvck9wdHMpOiBCdWlsZGVycy5CdWlsZGVyXG59XG5cbnR5cGUgVEJ1aWxkZXJzID0gUmVjb3JkPFxuICBCdWlsZGVyUGFyYW1UeXBlWyduYW1lJ10sXG4gIEJ1aWxkZXJDb25zdHJ1Y3RvciB8IHVuZGVmaW5lZFxuPlxuXG5jb25zdCBjb21tYW5kT3B0aW9uczogeyBbSyBpbiBDYWJhbENvbW1hbmRdOiBJQ29tbWFuZE9wdGlvbnMgfSA9IHtcbiAgYnVpbGQ6IHtcbiAgICBtZXNzYWdlVHlwZXM6IFsnZXJyb3InLCAnd2FybmluZycsICdidWlsZCddLFxuICAgIGRlZmF1bHRTZXZlcml0eTogJ2J1aWxkJyxcbiAgICBjYW5DYW5jZWw6IHRydWUsXG4gIH0sXG4gIGNsZWFuOiB7XG4gICAgbWVzc2FnZVR5cGVzOiBbJ2J1aWxkJ10sXG4gICAgZGVmYXVsdFNldmVyaXR5OiAnYnVpbGQnLFxuICAgIGNhbkNhbmNlbDogZmFsc2UsXG4gIH0sXG4gIHRlc3Q6IHtcbiAgICBtZXNzYWdlVHlwZXM6IFsnZXJyb3InLCAnd2FybmluZycsICdidWlsZCcsICd0ZXN0J10sXG4gICAgZGVmYXVsdFNldmVyaXR5OiAndGVzdCcsXG4gICAgY2FuQ2FuY2VsOiB0cnVlLFxuICB9LFxuICBiZW5jaDoge1xuICAgIG1lc3NhZ2VUeXBlczogWydlcnJvcicsICd3YXJuaW5nJywgJ2J1aWxkJywgJ3Rlc3QnXSxcbiAgICBkZWZhdWx0U2V2ZXJpdHk6ICd0ZXN0JyxcbiAgICBjYW5DYW5jZWw6IHRydWUsXG4gIH0sXG4gIGRlcHM6IHtcbiAgICBtZXNzYWdlVHlwZXM6IFsnYnVpbGQnXSxcbiAgICBkZWZhdWx0U2V2ZXJpdHk6ICdidWlsZCcsXG4gICAgY2FuQ2FuY2VsOiB0cnVlLFxuICB9LFxufVxuXG5leHBvcnQgY2xhc3MgSWRlQmFja2VuZCB7XG4gIHByaXZhdGUgZGlzcG9zYWJsZXM6IENvbXBvc2l0ZURpc3Bvc2FibGVcbiAgcHJpdmF0ZSB1cGk6IFVQSS5JVVBJSW5zdGFuY2VcbiAgcHJpdmF0ZSBydW5uaW5nOiBib29sZWFuID0gZmFsc2VcbiAgcHJpdmF0ZSBjb21tYW5kcyA9IHtcbiAgICAuLi50aGlzLmNhYmFsQ29tbWFuZHMoKSxcbiAgICAnaWRlLWhhc2tlbGwtY2FiYWw6c2V0LWJ1aWxkLXRhcmdldCc6IGFzeW5jICgpID0+XG4gICAgICB0aGlzLnVwaS5zZXRDb25maWdQYXJhbSgndGFyZ2V0JyksXG4gICAgJ2lkZS1oYXNrZWxsLWNhYmFsOnNldC1hY3RpdmUtYnVpbGRlcic6IGFzeW5jICgpID0+XG4gICAgICB0aGlzLnVwaS5zZXRDb25maWdQYXJhbSgnYnVpbGRlcicpLFxuICB9XG4gIHByaXZhdGUgbWVudSA9IFtcbiAgICB7IGxhYmVsOiAnQnVpbGQgUHJvamVjdCcsIGNvbW1hbmQ6ICdpZGUtaGFza2VsbC1jYWJhbDpidWlsZCcgfSxcbiAgICB7IGxhYmVsOiAnQ2xlYW4gUHJvamVjdCcsIGNvbW1hbmQ6ICdpZGUtaGFza2VsbC1jYWJhbDpjbGVhbicgfSxcbiAgICB7IGxhYmVsOiAnVGVzdCcsIGNvbW1hbmQ6ICdpZGUtaGFza2VsbC1jYWJhbDp0ZXN0JyB9LFxuICAgIHsgbGFiZWw6ICdCZW5jaCcsIGNvbW1hbmQ6ICdpZGUtaGFza2VsbC1jYWJhbDpiZW5jaCcgfSxcbiAgICB7IGxhYmVsOiAnQnVpbGQgRGVwZW5kZW5jaWVzJywgY29tbWFuZDogJ2lkZS1oYXNrZWxsLWNhYmFsOmRlcHMnIH0sXG4gICAge1xuICAgICAgbGFiZWw6ICdTZXQgQWN0aXZlIEJ1aWxkZXInLFxuICAgICAgY29tbWFuZDogJ2lkZS1oYXNrZWxsLWNhYmFsOnNldC1hY3RpdmUtYnVpbGRlcicsXG4gICAgfSxcbiAgICB7XG4gICAgICBsYWJlbDogJ1NldCBCdWlsZCBUYXJnZXQnLFxuICAgICAgY29tbWFuZDogJ2lkZS1oYXNrZWxsLWNhYmFsOnNldC1idWlsZC10YXJnZXQnLFxuICAgIH0sXG4gIF1cbiAgY29uc3RydWN0b3IocmVnOiBVUEkuSVVQSVJlZ2lzdHJhdGlvbikge1xuICAgIHRoaXMudXBpID0gcmVnKHtcbiAgICAgIG5hbWU6ICdpZGUtaGFza2VsbC1jYWJhbCcsXG4gICAgICBtZXNzYWdlVHlwZXM6IHtcbiAgICAgICAgZXJyb3I6IHt9LFxuICAgICAgICB3YXJuaW5nOiB7fSxcbiAgICAgICAgYnVpbGQ6IHtcbiAgICAgICAgICB1cmlGaWx0ZXI6IGZhbHNlLFxuICAgICAgICAgIGF1dG9TY3JvbGw6IHRydWUsXG4gICAgICAgIH0sXG4gICAgICAgIHRlc3Q6IHtcbiAgICAgICAgICB1cmlGaWx0ZXI6IGZhbHNlLFxuICAgICAgICAgIGF1dG9TY3JvbGw6IHRydWUsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgbWVudToge1xuICAgICAgICBsYWJlbDogJ0J1aWxkZXInLFxuICAgICAgICBtZW51OiB0aGlzLm1lbnUsXG4gICAgICB9LFxuICAgICAgcGFyYW1zOiB7XG4gICAgICAgIGJ1aWxkZXI6IHRoaXMuYnVpbGRlclBhcmFtSW5mbygpLFxuICAgICAgICB0YXJnZXQ6IHRoaXMudGFyZ2V0UGFyYW1JbmZvKCksXG4gICAgICB9LFxuICAgIH0pXG5cbiAgICB0aGlzLmRpc3Bvc2FibGVzID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKVxuXG4gICAgdGhpcy5kaXNwb3NhYmxlcy5hZGQoYXRvbS5jb21tYW5kcy5hZGQoJ2F0b20td29ya3NwYWNlJywgdGhpcy5jb21tYW5kcykpXG4gICAgdGhpcy5kaXNwb3NhYmxlcy5hZGQodGhpcy51cGkpXG4gIH1cblxuICBwdWJsaWMgZGVzdHJveSgpIHtcbiAgICB0aGlzLmRpc3Bvc2FibGVzLmRpc3Bvc2UoKVxuICB9XG5cbiAgcHJpdmF0ZSBjYWJhbENvbW1hbmRzKCkge1xuICAgIGNvbnN0IHJldCA9IHt9XG4gICAgZm9yIChjb25zdCBjbWQgb2YgT2JqZWN0LmtleXMoY29tbWFuZE9wdGlvbnMpKSB7XG4gICAgICByZXRbYGlkZS1oYXNrZWxsLWNhYmFsOiR7Y21kfWBdID0gYXN5bmMgKCkgPT4gdGhpcy5ydW5DYWJhbENvbW1hbmQoY21kKVxuICAgIH1cbiAgICByZXR1cm4gcmV0XG4gIH1cblxuICBwcml2YXRlIGJ1aWxkZXJQYXJhbUluZm8oKTogVVBJLklQYXJhbVNwZWM8QnVpbGRlclBhcmFtVHlwZT4ge1xuICAgIHJldHVybiB7XG4gICAgICBpdGVtczogKCk6IEJ1aWxkZXJQYXJhbVR5cGVbXSA9PiB7XG4gICAgICAgIGNvbnN0IGJ1aWxkZXJzOiBCdWlsZGVyUGFyYW1UeXBlW10gPSBbXG4gICAgICAgICAgeyBuYW1lOiAnY2FiYWwnIH0sXG4gICAgICAgICAgeyBuYW1lOiAnc3RhY2snIH0sXG4gICAgICAgIF1cbiAgICAgICAgaWYgKGF0b20uY29uZmlnLmdldCgnaWRlLWhhc2tlbGwtY2FiYWwuZW5hYmxlTml4QnVpbGQnKSkge1xuICAgICAgICAgIGJ1aWxkZXJzLnB1c2goeyBuYW1lOiAnY2FiYWwtbml4JyB9KVxuICAgICAgICB9XG4gICAgICAgIGJ1aWxkZXJzLnB1c2goeyBuYW1lOiAnbm9uZScgfSlcbiAgICAgICAgcmV0dXJuIGJ1aWxkZXJzXG4gICAgICB9LFxuICAgICAgaXRlbVRlbXBsYXRlOiAoaXRlbTogQnVpbGRlclBhcmFtVHlwZSkgPT5cbiAgICAgICAgYDxsaT48ZGl2IGNsYXNzPSduYW1lJz4ke2l0ZW0ubmFtZX08L2Rpdj48L2xpPmAsXG4gICAgICBkaXNwbGF5VGVtcGxhdGU6IChpdGVtPzogQnVpbGRlclBhcmFtVHlwZSkgPT5cbiAgICAgICAgaXRlbSAmJiBpdGVtLm5hbWUgPyBpdGVtLm5hbWUgOiAnTm90IHNldCcsXG4gICAgICBpdGVtRmlsdGVyS2V5OiAnbmFtZScsXG4gICAgICBkZXNjcmlwdGlvbjogJ1NlbGVjdCBidWlsZGVyIHRvIHVzZSB3aXRoIGN1cnJlbnQgcHJvamVjdCcsXG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSB0YXJnZXRQYXJhbUluZm8oKTogVVBJLklQYXJhbVNwZWM8VGFyZ2V0UGFyYW1UeXBlPiB7XG4gICAgY29uc3QgZGVmYXVsdFZhbDogVGFyZ2V0UGFyYW1UeXBlID0ge1xuICAgICAgcHJvamVjdDogJ0F1dG8nLFxuICAgICAgdHlwZTogJ2F1dG8nLFxuICAgICAgZGlyOiB1bmRlZmluZWQsXG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICBkZWZhdWx0OiBkZWZhdWx0VmFsLFxuICAgICAgaXRlbXM6IGFzeW5jICgpOiBQcm9taXNlPFRhcmdldFBhcmFtVHlwZVtdPiA9PiB7XG4gICAgICAgIGNvbnN0IHByb2plY3RzOiBUYXJnZXRQYXJhbVR5cGVbXSA9IFtkZWZhdWx0VmFsXVxuICAgICAgICBmb3IgKGNvbnN0IGQgb2YgYXRvbS5wcm9qZWN0LmdldERpcmVjdG9yaWVzKCkpIHtcbiAgICAgICAgICBjb25zdCBkaXIgPSBkLmdldFBhdGgoKVxuICAgICAgICAgIGNvbnN0IFtjYWJhbEZpbGVdID0gKGF3YWl0IFV0aWwuZ2V0Um9vdERpcihkaXIpKVxuICAgICAgICAgICAgLmdldEVudHJpZXNTeW5jKClcbiAgICAgICAgICAgIC5maWx0ZXIoaXNDYWJhbEZpbGUpXG4gICAgICAgICAgaWYgKGNhYmFsRmlsZSAmJiBjYWJhbEZpbGUuaXNGaWxlKCkpIHtcbiAgICAgICAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCBjYWJhbEZpbGUucmVhZCgpXG4gICAgICAgICAgICBjb25zdCBwcm9qZWN0ID0gYXdhaXQgVXRpbC5wYXJzZURvdENhYmFsKGRhdGEpXG4gICAgICAgICAgICBpZiAocHJvamVjdCkge1xuICAgICAgICAgICAgICBwcm9qZWN0cy5wdXNoKHsgcHJvamVjdDogcHJvamVjdC5uYW1lLCBkaXIsIHR5cGU6ICdhdXRvJyB9KVxuICAgICAgICAgICAgICBwcm9qZWN0cy5wdXNoKHsgcHJvamVjdDogcHJvamVjdC5uYW1lLCBkaXIsIHR5cGU6ICdhbGwnIH0pXG4gICAgICAgICAgICAgIGZvciAoY29uc3QgdGFyZ2V0IG9mIHByb2plY3QudGFyZ2V0cykge1xuICAgICAgICAgICAgICAgIHByb2plY3RzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgcHJvamVjdDogcHJvamVjdC5uYW1lLFxuICAgICAgICAgICAgICAgICAgZGlyLFxuICAgICAgICAgICAgICAgICAgdHlwZTogJ2NvbXBvbmVudCcsXG4gICAgICAgICAgICAgICAgICB0YXJnZXQsXG4gICAgICAgICAgICAgICAgICBjb21wb25lbnQ6IHRhcmdldC50YXJnZXQsXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcHJvamVjdHNcbiAgICAgIH0sXG4gICAgICBpdGVtVGVtcGxhdGU6ICh0Z3Q6IFRhcmdldFBhcmFtVHlwZSkgPT4ge1xuICAgICAgICBsZXQgZGVzYzogc3RyaW5nXG4gICAgICAgIHN3aXRjaCAodGd0LnR5cGUpIHtcbiAgICAgICAgICBjYXNlICdhdXRvJzpcbiAgICAgICAgICAgIGRlc2MgPSBgPGRpdiBjbGFzcz0nbmFtZSc+QXV0bzwvZGl2PmBcbiAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgY2FzZSAnYWxsJzpcbiAgICAgICAgICAgIGRlc2MgPSBgPGRpdiBjbGFzcz0nbmFtZSc+QWxsPC9kaXY+YFxuICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICBjYXNlICdjb21wb25lbnQnOlxuICAgICAgICAgICAgZGVzYyA9IGBcbiAgICAgICAgICAgIDxkaXYgY2xhc3M9J3R5cGUnPiR7dGd0LnRhcmdldC50eXBlfTwvZGl2PlxuICAgICAgICAgICAgPGRpdiBjbGFzcz0nbmFtZSc+JHt0Z3QudGFyZ2V0Lm5hbWV9PC9kaXY+XG4gICAgICAgICAgICBgXG4gICAgICAgICAgICBicmVha1xuICAgICAgICB9XG4gICAgICAgIC8vIHRzbGludDpkaXNhYmxlOm5vLW5vbi1udWxsLWFzc2VydGlvblxuICAgICAgICByZXR1cm4gYDxsaT5cbiAgICAgICAgICA8ZGl2IGNsYXNzPSdwcm9qZWN0Jz4ke3RndC5wcm9qZWN0fTwvZGl2PlxuICAgICAgICAgIDxkaXYgY2xhc3M9J2Rpcic+JHt0Z3QuZGlyIHx8ICcnfTwvZGl2PlxuICAgICAgICAgICR7ZGVzYyF9XG4gICAgICAgICAgPGRpdiBjbGFzcz0nY2xlYXJmaXgnPjwvZGl2PlxuICAgICAgICA8L2xpPmBcbiAgICAgICAgLy8gdHNsaW50OmVuYWJsZTpuby1ub24tbnVsbC1hc3NlcnRpb25cbiAgICAgIH0sXG4gICAgICBkaXNwbGF5VGVtcGxhdGU6IChpdGVtPzogVGFyZ2V0UGFyYW1UeXBlKSA9PiB7XG4gICAgICAgIGlmICghaXRlbSkgcmV0dXJuICd1bmRlZmluZWQnXG4gICAgICAgIGlmICghaXRlbS5kaXIpIHtcbiAgICAgICAgICByZXR1cm4gaXRlbS5wcm9qZWN0XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbGV0IHRhcmdldDogc3RyaW5nXG4gICAgICAgICAgc3dpdGNoIChpdGVtLnR5cGUpIHtcbiAgICAgICAgICAgIGNhc2UgJ2F1dG8nOlxuICAgICAgICAgICAgICB0YXJnZXQgPSAnQXV0bydcbiAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgIGNhc2UgJ2FsbCc6XG4gICAgICAgICAgICAgIHRhcmdldCA9ICdBbGwnXG4gICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICBjYXNlICdjb21wb25lbnQnOlxuICAgICAgICAgICAgICB0YXJnZXQgPSBpdGVtLnRhcmdldC5uYW1lXG4gICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgfVxuICAgICAgICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpuby1ub24tbnVsbC1hc3NlcnRpb25cbiAgICAgICAgICByZXR1cm4gYCR7aXRlbS5wcm9qZWN0fTogJHt0YXJnZXQhfWBcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIGl0ZW1GaWx0ZXJLZXk6ICduYW1lJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnU2VsZWN0IHRhcmdldCB0byBidWlsZCcsXG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBnZXRBY3RpdmVQcm9qZWN0UGF0aCgpOiBzdHJpbmcge1xuICAgIGNvbnN0IGVkaXRvciA9IGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVRleHRFZGl0b3IoKVxuICAgIGlmIChlZGl0b3IpIHtcbiAgICAgIGNvbnN0IGVkcGF0aCA9IGVkaXRvci5nZXRQYXRoKClcbiAgICAgIGlmIChlZHBhdGgpIHtcbiAgICAgICAgcmV0dXJuIHBhdGguZGlybmFtZShlZHBhdGgpXG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBhdG9tLnByb2plY3QuZ2V0UGF0aHMoKVswXSB8fCBwcm9jZXNzLmN3ZCgpXG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGdldEFjdGl2ZVByb2plY3RUYXJnZXQoXG4gICAgY2FiYWxmaWxlOiBzdHJpbmcsXG4gICAgY2FiYWxSb290OiBEaXJlY3RvcnksXG4gICk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICBjb25zdCBlZGl0b3IgPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKClcbiAgICBpZiAoZWRpdG9yKSB7XG4gICAgICBjb25zdCBlZHBhdGggPSBlZGl0b3IuZ2V0UGF0aCgpXG4gICAgICBpZiAoZWRwYXRoKSB7XG4gICAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IFV0aWwuZ2V0Q29tcG9uZW50RnJvbUZpbGUoXG4gICAgICAgICAgY2FiYWxmaWxlLFxuICAgICAgICAgIGNhYmFsUm9vdC5yZWxhdGl2aXplKGVkcGF0aCksXG4gICAgICAgIClcbiAgICAgICAgaWYgKHJlcykgcmV0dXJuIHJlc1xuICAgICAgICBlbHNlIHJldHVybiBbXVxuICAgICAgfVxuICAgIH1cbiAgICAvLyBkZWZhdWx0XG4gICAgcmV0dXJuIFtdXG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGNhYmFsQnVpbGQoXG4gICAgY21kOiBDYWJhbENvbW1hbmQsXG4gICAgb3B0czogQnVpbGRlcnMuSVBhcmFtcyxcbiAgKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdHJ5IHtcbiAgICAgIGlmICh0aGlzLnJ1bm5pbmcpIHtcbiAgICAgICAgdGhpcy51cGkuc2V0U3RhdHVzKHtcbiAgICAgICAgICBzdGF0dXM6ICd3YXJuaW5nJyxcbiAgICAgICAgICBkZXRhaWw6ICdCdWlsZGVyIGFscmVhZHkgcnVubmluZycsXG4gICAgICAgIH0pXG4gICAgICAgIHJldHVyblxuICAgICAgfVxuICAgICAgdGhpcy5ydW5uaW5nID0gdHJ1ZVxuXG4gICAgICBjb25zdCBidWlsZGVyUGFyYW0gPSBhd2FpdCB0aGlzLnVwaS5nZXRDb25maWdQYXJhbTxCdWlsZGVyUGFyYW1UeXBlPihcbiAgICAgICAgJ2J1aWxkZXInLFxuICAgICAgKVxuICAgICAgY29uc3QgdGFyZ2V0ID0gYXdhaXQgdGhpcy51cGkuZ2V0Q29uZmlnUGFyYW08VGFyZ2V0UGFyYW1UeXBlPigndGFyZ2V0JylcblxuICAgICAgaWYgKHRhcmdldCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignVGFyZ2V0IHVuZGVmaW5lZCcpXG4gICAgICB9XG4gICAgICBpZiAoYnVpbGRlclBhcmFtID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdCdWlsZGVyIHVuZGVmaW5lZCcpXG4gICAgICB9XG5cbiAgICAgIHRoaXMudXBpLnNldFN0YXR1cyh7XG4gICAgICAgIHN0YXR1czogJ3Byb2dyZXNzJyxcbiAgICAgICAgcHJvZ3Jlc3M6IG9wdHMub25Qcm9ncmVzcyA/IDAuMCA6IHVuZGVmaW5lZCxcbiAgICAgICAgZGV0YWlsOiAnJyxcbiAgICAgIH0pXG5cbiAgICAgIGNvbnN0IGNhYmFsUm9vdCA9IGF3YWl0IFV0aWwuZ2V0Um9vdERpcihcbiAgICAgICAgdGFyZ2V0LmRpciA/IHRhcmdldC5kaXIgOiB0aGlzLmdldEFjdGl2ZVByb2plY3RQYXRoKCksXG4gICAgICApXG5cbiAgICAgIGNvbnN0IFtjYWJhbEZpbGVdOiBGaWxlW10gPSBjYWJhbFJvb3QuZ2V0RW50cmllc1N5bmMoKS5maWx0ZXIoaXNDYWJhbEZpbGUpXG5cbiAgICAgIGlmICghY2FiYWxGaWxlKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignTm8gY2FiYWwgZmlsZSBmb3VuZCcpXG4gICAgICB9XG5cbiAgICAgIGxldCBuZXdUYXJnZXQ6IFRhcmdldFBhcmFtVHlwZUZvckJ1aWxkZXIgfCB1bmRlZmluZWRcblxuICAgICAgaWYgKHRhcmdldC50eXBlID09PSAnYXV0bycpIHtcbiAgICAgICAgY29uc3QgY2FiYWxDb250ZW50cyA9IGF3YWl0IGNhYmFsRmlsZS5yZWFkKClcbiAgICAgICAgY29uc3QgdGd0cyA9IGF3YWl0IHRoaXMuZ2V0QWN0aXZlUHJvamVjdFRhcmdldChjYWJhbENvbnRlbnRzLCBjYWJhbFJvb3QpXG4gICAgICAgIGNvbnN0IFt0Z3RdID0gdGd0c1xuICAgICAgICBpZiAodGd0KSB7XG4gICAgICAgICAgY29uc3QgY2YgPSBhd2FpdCBVdGlsLnBhcnNlRG90Q2FiYWwoY2FiYWxDb250ZW50cylcbiAgICAgICAgICBpZiAoY2YpIHtcbiAgICAgICAgICAgIG5ld1RhcmdldCA9IHtcbiAgICAgICAgICAgICAgcHJvamVjdDogY2YubmFtZSxcbiAgICAgICAgICAgICAgZGlyOiBjYWJhbFJvb3QuZ2V0UGF0aCgpLFxuICAgICAgICAgICAgICB0eXBlOiAnY29tcG9uZW50JyxcbiAgICAgICAgICAgICAgY29tcG9uZW50OiB0Z3QsXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKHRhcmdldC50eXBlID09PSAnYWxsJykge1xuICAgICAgICBjb25zdCBjYWJhbENvbnRlbnRzID0gYXdhaXQgY2FiYWxGaWxlLnJlYWQoKVxuICAgICAgICBjb25zdCBjZiA9IGF3YWl0IFV0aWwucGFyc2VEb3RDYWJhbChjYWJhbENvbnRlbnRzKVxuICAgICAgICBpZiAoY2YpIHtcbiAgICAgICAgICBuZXdUYXJnZXQgPSBuZXdUYXJnZXQgPSB7XG4gICAgICAgICAgICBwcm9qZWN0OiBjZi5uYW1lLFxuICAgICAgICAgICAgZGlyOiBjYWJhbFJvb3QuZ2V0UGF0aCgpLFxuICAgICAgICAgICAgdHlwZTogJ2FsbCcsXG4gICAgICAgICAgICB0YXJnZXRzOiBjZi50YXJnZXRzLFxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmICh0YXJnZXQudHlwZSA9PT0gJ2NvbXBvbmVudCcpIHtcbiAgICAgICAgY29uc3QgeyBwcm9qZWN0LCBkaXIsIGNvbXBvbmVudCB9ID0gdGFyZ2V0XG4gICAgICAgIG5ld1RhcmdldCA9IHsgdHlwZTogJ2NvbXBvbmVudCcsIHByb2plY3QsIGRpciwgY29tcG9uZW50IH1cbiAgICAgIH1cbiAgICAgIGlmICghbmV3VGFyZ2V0KSB7XG4gICAgICAgIG5ld1RhcmdldCA9IHtcbiAgICAgICAgICB0eXBlOiAnYXV0bycsXG4gICAgICAgICAgcHJvamVjdDogdGFyZ2V0LnByb2plY3QsXG4gICAgICAgICAgZGlyOiB0YXJnZXQuZGlyLFxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBjb25zdCBidWlsZGVyczogVEJ1aWxkZXJzID0ge1xuICAgICAgICAnY2FiYWwtbml4JzogQnVpbGRlcnMuQ2FiYWxOaXgsXG4gICAgICAgIGNhYmFsOiBCdWlsZGVycy5DYWJhbCxcbiAgICAgICAgc3RhY2s6IEJ1aWxkZXJzLlN0YWNrLFxuICAgICAgICBub25lOiBCdWlsZGVycy5Ob25lLFxuICAgICAgfVxuICAgICAgY29uc3QgYnVpbGRlciA9IGJ1aWxkZXJzW2J1aWxkZXJQYXJhbS5uYW1lXVxuXG4gICAgICBpZiAoYnVpbGRlciA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICBgVW5rbm93biBidWlsZGVyICckeyhidWlsZGVyUGFyYW0gJiYgYnVpbGRlclBhcmFtLm5hbWUpIHx8XG4gICAgICAgICAgICBidWlsZGVyUGFyYW19J2AsXG4gICAgICAgIClcbiAgICAgIH1cblxuICAgICAgY29uc3QgcmVzID0gYXdhaXQgbmV3IGJ1aWxkZXIoe1xuICAgICAgICBvcHRzLFxuICAgICAgICB0YXJnZXQ6IG5ld1RhcmdldCxcbiAgICAgICAgY2FiYWxSb290LFxuICAgICAgfSkucnVuQ29tbWFuZChjbWQpXG4gICAgICAvLyBzZWUgQ2FiYWxQcm9jZXNzIGZvciBleHBsYWluYXRpb25cbiAgICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTogbm8tbnVsbC1rZXl3b3JkXG4gICAgICBpZiAocmVzLmV4aXRDb2RlID09PSBudWxsKSB7XG4gICAgICAgIC8vIHRoaXMgbWVhbnMgcHJvY2VzcyB3YXMga2lsbGVkXG4gICAgICAgIHRoaXMudXBpLnNldFN0YXR1cyh7XG4gICAgICAgICAgc3RhdHVzOiAnd2FybmluZycsXG4gICAgICAgICAgZGV0YWlsOiAnQnVpbGQgd2FzIGludGVycnVwdGVkJyxcbiAgICAgICAgfSlcbiAgICAgIH0gZWxzZSBpZiAocmVzLmV4aXRDb2RlICE9PSAwKSB7XG4gICAgICAgIGlmIChyZXMuaGFzRXJyb3IpIHtcbiAgICAgICAgICB0aGlzLnVwaS5zZXRTdGF0dXMoe1xuICAgICAgICAgICAgc3RhdHVzOiAnd2FybmluZycsXG4gICAgICAgICAgICBkZXRhaWw6ICdUaGVyZSB3ZXJlIGVycm9ycyBpbiBzb3VyY2UgZmlsZXMnLFxuICAgICAgICAgIH0pXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy51cGkuc2V0U3RhdHVzKHtcbiAgICAgICAgICAgIHN0YXR1czogJ2Vycm9yJyxcbiAgICAgICAgICAgIGRldGFpbDogYEJ1aWxkZXIgcXVpdCBhYm5vcm1hbGx5IHdpdGggZXhpdCBjb2RlICR7cmVzLmV4aXRDb2RlfWAsXG4gICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy51cGkuc2V0U3RhdHVzKHsgc3RhdHVzOiAncmVhZHknLCBkZXRhaWw6ICdCdWlsZCB3YXMgc3VjY2Vzc2Z1bCcgfSlcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgaWYgKGVycm9yKSB7XG4gICAgICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTogbm8tY29uc29sZVxuICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKVxuICAgICAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6IG5vLXVuc2FmZS1hbnlcbiAgICAgICAgdGhpcy51cGkuc2V0U3RhdHVzKHsgc3RhdHVzOiAnZXJyb3InLCBkZXRhaWw6IGVycm9yLnRvU3RyaW5nKCkgfSlcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMudXBpLnNldFN0YXR1cyh7XG4gICAgICAgICAgc3RhdHVzOiAnd2FybmluZycsXG4gICAgICAgICAgZGV0YWlsOiAnQnVpbGQgZmFpbGVkIHdpdGggbm8gZXJyb3JzJyxcbiAgICAgICAgfSlcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5ydW5uaW5nID0gZmFsc2VcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgcnVuQ2FiYWxDb21tYW5kKGNvbW1hbmQ6IENhYmFsQ29tbWFuZCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IHsgbWVzc2FnZVR5cGVzLCBkZWZhdWx0U2V2ZXJpdHksIGNhbkNhbmNlbCB9ID0gY29tbWFuZE9wdGlvbnNbY29tbWFuZF1cbiAgICBjb25zdCBtZXNzYWdlczogVVBJLklSZXN1bHRJdGVtW10gPSBbXVxuICAgIHRoaXMudXBpLnNldE1lc3NhZ2VzKG1lc3NhZ2VzKVxuXG4gICAgbGV0IGNhbmNlbEFjdGlvbkRpc3A6IERpc3Bvc2FibGUgfCB1bmRlZmluZWRcblxuICAgIGF3YWl0IHRoaXMuY2FiYWxCdWlsZChjb21tYW5kLCB7XG4gICAgICBzZXZlcml0eTogZGVmYXVsdFNldmVyaXR5LFxuICAgICAgc2V0Q2FuY2VsQWN0aW9uOiBjYW5DYW5jZWxcbiAgICAgICAgPyAoYWN0aW9uOiAoKSA9PiB2b2lkKSA9PiB7XG4gICAgICAgICAgICBjYW5jZWxBY3Rpb25EaXNwICYmIGNhbmNlbEFjdGlvbkRpc3AuZGlzcG9zZSgpXG4gICAgICAgICAgICBjYW5jZWxBY3Rpb25EaXNwID0gdGhpcy51cGkuYWRkUGFuZWxDb250cm9sKHtcbiAgICAgICAgICAgICAgZWxlbWVudDogJ2lkZS1oYXNrZWxsLWJ1dHRvbicsXG4gICAgICAgICAgICAgIG9wdHM6IHtcbiAgICAgICAgICAgICAgICBjbGFzc2VzOiBbJ2NhbmNlbCddLFxuICAgICAgICAgICAgICAgIGV2ZW50czoge1xuICAgICAgICAgICAgICAgICAgY2xpY2s6IGFjdGlvbixcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSlcbiAgICAgICAgICB9XG4gICAgICAgIDogdW5kZWZpbmVkLFxuICAgICAgb25Nc2c6IChtZXNzYWdlOiBVUEkuSVJlc3VsdEl0ZW0pID0+IHtcbiAgICAgICAgaWYgKG1lc3NhZ2VUeXBlcy5pbmNsdWRlcyhtZXNzYWdlLnNldmVyaXR5KSkge1xuICAgICAgICAgIG1lc3NhZ2VzLnB1c2gobWVzc2FnZSlcbiAgICAgICAgICB0aGlzLnVwaS5zZXRNZXNzYWdlcyhtZXNzYWdlcylcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIG9uUHJvZ3Jlc3M6IGNhbkNhbmNlbFxuICAgICAgICA/IChwcm9ncmVzczogbnVtYmVyKSA9PlxuICAgICAgICAgICAgdGhpcy51cGkuc2V0U3RhdHVzKHtcbiAgICAgICAgICAgICAgc3RhdHVzOiAncHJvZ3Jlc3MnLFxuICAgICAgICAgICAgICBwcm9ncmVzcyxcbiAgICAgICAgICAgICAgZGV0YWlsOiBgJHtjb21tYW5kfSBpbiBwcm9ncmVzc2AsXG4gICAgICAgICAgICB9KVxuICAgICAgICA6IHVuZGVmaW5lZCxcbiAgICB9KVxuICAgIGNhbmNlbEFjdGlvbkRpc3AgJiYgY2FuY2VsQWN0aW9uRGlzcC5kaXNwb3NlKClcbiAgfVxufVxuIl19