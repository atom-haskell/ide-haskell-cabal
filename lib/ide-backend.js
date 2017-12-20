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
            ret[`ide-haskell-cabal:${cmd}`] = async () => this.runCabalCommand(cmd);
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
            type: 'auto',
            dir: undefined,
        };
        return {
            default: defaultVal,
            items: async () => {
                const projects = [defaultVal];
                for (const d of atom.project.getDirectories()) {
                    const dir = d.getPath();
                    const [cabalFile] = (await Util.getRootDir(dir)).getEntriesSync().filter(isCabalFile);
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
                this.upi.setStatus({ status: 'warning', detail: 'Builder already running' });
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
                'cabal': Builders.Cabal,
                'stack': Builders.Stack,
                'none': Builders.None,
            };
            const builder = builders[builderParam.name];
            if (builder === undefined) {
                throw new Error(`Unknown builder '${(builderParam && builderParam.name) || builderParam}'`);
            }
            const res = await (new builder({ opts, target: newTarget, cabalRoot })).runCommand(cmd);
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
    }
    async runCabalCommand(command) {
        const { messageTypes, defaultSeverity, canCancel } = commandOptions[command];
        const messages = [];
        this.upi.setMessages(messages);
        let cancelActionDisp;
        await this.cabalBuild(command, {
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
    }
}
exports.IdeBackend = IdeBackend;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaWRlLWJhY2tlbmQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaWRlLWJhY2tlbmQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSw2QkFBNEI7QUFDNUIsK0JBQXVFO0FBQ3ZFLHVDQUFzQztBQUN0QywyQ0FBMEM7QUFNMUMscUJBQXFCLElBQXVCO0lBQzFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDLE1BQU0sRUFBRSxJQUFJLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQTtBQUMzRSxDQUFDO0FBaUJELE1BQU0sY0FBYyxHQUEyQztJQUM3RCxLQUFLLEVBQUU7UUFDTCxZQUFZLEVBQUUsQ0FBQyxPQUFPLEVBQUUsU0FBUyxFQUFFLE9BQU8sQ0FBQztRQUMzQyxlQUFlLEVBQUUsT0FBTztRQUN4QixTQUFTLEVBQUUsSUFBSTtLQUNoQjtJQUNELEtBQUssRUFBRTtRQUNMLFlBQVksRUFBRSxDQUFDLE9BQU8sQ0FBQztRQUN2QixlQUFlLEVBQUUsT0FBTztRQUN4QixTQUFTLEVBQUUsS0FBSztLQUNqQjtJQUNELElBQUksRUFBRTtRQUNKLFlBQVksRUFBRSxDQUFDLE9BQU8sRUFBRSxTQUFTLEVBQUUsT0FBTyxFQUFFLE1BQU0sQ0FBQztRQUNuRCxlQUFlLEVBQUUsTUFBTTtRQUN2QixTQUFTLEVBQUUsSUFBSTtLQUNoQjtJQUNELEtBQUssRUFBRTtRQUNMLFlBQVksRUFBRSxDQUFDLE9BQU8sRUFBRSxTQUFTLEVBQUUsT0FBTyxFQUFFLE1BQU0sQ0FBQztRQUNuRCxlQUFlLEVBQUUsTUFBTTtRQUN2QixTQUFTLEVBQUUsSUFBSTtLQUNoQjtJQUNELElBQUksRUFBRTtRQUNKLFlBQVksRUFBRSxDQUFDLE9BQU8sQ0FBQztRQUN2QixlQUFlLEVBQUUsT0FBTztRQUN4QixTQUFTLEVBQUUsSUFBSTtLQUNoQjtDQUNGLENBQUE7QUFFRDtJ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RyxJQUFJLENBQUMsR0FBRyxDQUFDLGVBQWUsQ0FBQzt3QkFDMUMsT0FBTyxFQUFFLG9CQUFvQjt3QkFDN0IsSUFBSSxFQUFFOzRCQUNKLE9BQU8sRUFBRSxDQUFDLFFBQVEsQ0FBQzs0QkFDbkIsTUFBTSxFQUFFO2dDQUNOLEtBQUssRUFBRSxNQUFNOzZCQUNkO3lCQUNGO3FCQUNGLENBQUMsQ0FBQTtnQkFDSixDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVM7WUFDZixLQUFLLEVBQUUsQ0FBQyxPQUF3QixFQUFFLEVBQUU7Z0JBQ2xDLEVBQUUsQ0FBQyxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDNUMsUUFBUSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQTtvQkFDdEIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLENBQUE7Z0JBQ2hDLENBQUM7WUFDSCxDQUFDO1lBQ0QsVUFBVSxFQUNWLFNBQVM7Z0JBQ1AsQ0FBQyxDQUFDLENBQUMsUUFBZ0IsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsRUFBRSxNQUFNLEVBQUUsVUFBVSxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsR0FBRyxPQUFPLGNBQWMsRUFBRSxDQUFDO2dCQUM5RyxDQUFDLENBQUMsU0FBUztTQUNkLENBQUMsQ0FBQTtRQUNGLGdCQUFnQixJQUFJLGdCQUFnQixDQUFDLE9BQU8sRUFBRSxDQUFBO0lBQ2hELENBQUM7Q0FDRjtBQTdVRCxnQ0E2VUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnXG5pbXBvcnQgeyBGaWxlLCBDb21wb3NpdGVEaXNwb3NhYmxlLCBEaXNwb3NhYmxlLCBEaXJlY3RvcnkgfSBmcm9tICdhdG9tJ1xuaW1wb3J0ICogYXMgQnVpbGRlcnMgZnJvbSAnLi9idWlsZGVycydcbmltcG9ydCAqIGFzIFV0aWwgZnJvbSAnYXRvbS1oYXNrZWxsLXV0aWxzJ1xuaW1wb3J0IHsgVGFyZ2V0UGFyYW1UeXBlLCBDYWJhbENvbW1hbmQsIFRhcmdldFBhcmFtVHlwZUZvckJ1aWxkZXIgfSBmcm9tICcuL2NvbW1vbidcbmltcG9ydCAqIGFzIFVQSSBmcm9tICdhdG9tLWhhc2tlbGwtdXBpJ1xuXG5pbnRlcmZhY2UgQnVpbGRlclBhcmFtVHlwZSB7IG5hbWU6IHN0cmluZyB9XG5cbmZ1bmN0aW9uIGlzQ2FiYWxGaWxlKGZpbGU/OiBGaWxlIHwgRGlyZWN0b3J5KTogZmlsZSBpcyBGaWxlIHtcbiAgcmV0dXJuICEhKGZpbGUgJiYgZmlsZS5pc0ZpbGUoKSAmJiBmaWxlLmdldEJhc2VOYW1lKCkuZW5kc1dpdGgoJy5jYWJhbCcpKVxufVxuXG5pbnRlcmZhY2UgSUNvbW1hbmRPcHRpb25zIHtcbiAgbWVzc2FnZVR5cGVzOiBVUEkuVFNldmVyaXR5W11cbiAgZGVmYXVsdFNldmVyaXR5OiBVUEkuVFNldmVyaXR5XG4gIGNhbkNhbmNlbDogYm9vbGVhblxufVxuXG50eXBlIFRCdWlsZGVycyA9IHtcbiAgW2s6IHN0cmluZ106XG4gIHR5cGVvZiBCdWlsZGVycy5DYWJhbE5peCB8XG4gIHR5cGVvZiBCdWlsZGVycy5DYWJhbCB8XG4gIHR5cGVvZiBCdWlsZGVycy5TdGFjayB8XG4gIHR5cGVvZiBCdWlsZGVycy5Ob25lIHxcbiAgdW5kZWZpbmVkXG59XG5cbmNvbnN0IGNvbW1hbmRPcHRpb25zOiB7W0sgaW4gQ2FiYWxDb21tYW5kXTogSUNvbW1hbmRPcHRpb25zfSA9IHtcbiAgYnVpbGQ6IHtcbiAgICBtZXNzYWdlVHlwZXM6IFsnZXJyb3InLCAnd2FybmluZycsICdidWlsZCddLFxuICAgIGRlZmF1bHRTZXZlcml0eTogJ2J1aWxkJyxcbiAgICBjYW5DYW5jZWw6IHRydWUsXG4gIH0sXG4gIGNsZWFuOiB7XG4gICAgbWVzc2FnZVR5cGVzOiBbJ2J1aWxkJ10sXG4gICAgZGVmYXVsdFNldmVyaXR5OiAnYnVpbGQnLFxuICAgIGNhbkNhbmNlbDogZmFsc2UsXG4gIH0sXG4gIHRlc3Q6IHtcbiAgICBtZXNzYWdlVHlwZXM6IFsnZXJyb3InLCAnd2FybmluZycsICdidWlsZCcsICd0ZXN0J10sXG4gICAgZGVmYXVsdFNldmVyaXR5OiAndGVzdCcsXG4gICAgY2FuQ2FuY2VsOiB0cnVlLFxuICB9LFxuICBiZW5jaDoge1xuICAgIG1lc3NhZ2VUeXBlczogWydlcnJvcicsICd3YXJuaW5nJywgJ2J1aWxkJywgJ3Rlc3QnXSxcbiAgICBkZWZhdWx0U2V2ZXJpdHk6ICd0ZXN0JyxcbiAgICBjYW5DYW5jZWw6IHRydWUsXG4gIH0sXG4gIGRlcHM6IHtcbiAgICBtZXNzYWdlVHlwZXM6IFsnYnVpbGQnXSxcbiAgICBkZWZhdWx0U2V2ZXJpdHk6ICdidWlsZCcsXG4gICAgY2FuQ2FuY2VsOiB0cnVlLFxuICB9LFxufVxuXG5leHBvcnQgY2xhc3MgSWRlQmFja2VuZCB7XG4gIHByaXZhdGUgZGlzcG9zYWJsZXM6IENvbXBvc2l0ZURpc3Bvc2FibGVcbiAgcHJpdmF0ZSB1cGk6IFVQSS5JVVBJSW5zdGFuY2VcbiAgcHJpdmF0ZSBydW5uaW5nOiBib29sZWFuID0gZmFsc2VcbiAgcHJpdmF0ZSBjb21tYW5kcyA9IHtcbiAgICAuLi50aGlzLmNhYmFsQ29tbWFuZHMoKSxcbiAgICAnaWRlLWhhc2tlbGwtY2FiYWw6c2V0LWJ1aWxkLXRhcmdldCc6IGFzeW5jICgpID0+XG4gICAgICB0aGlzLnVwaS5zZXRDb25maWdQYXJhbSgndGFyZ2V0JyksXG4gICAgJ2lkZS1oYXNrZWxsLWNhYmFsOnNldC1hY3RpdmUtYnVpbGRlcic6IGFzeW5jICgpID0+XG4gICAgICB0aGlzLnVwaS5zZXRDb25maWdQYXJhbSgnYnVpbGRlcicpLFxuICB9XG4gIHByaXZhdGUgbWVudSA9IFtcbiAgICB7IGxhYmVsOiAnQnVpbGQgUHJvamVjdCcsIGNvbW1hbmQ6ICdpZGUtaGFza2VsbC1jYWJhbDpidWlsZCcgfSxcbiAgICB7IGxhYmVsOiAnQ2xlYW4gUHJvamVjdCcsIGNvbW1hbmQ6ICdpZGUtaGFza2VsbC1jYWJhbDpjbGVhbicgfSxcbiAgICB7IGxhYmVsOiAnVGVzdCcsIGNvbW1hbmQ6ICdpZGUtaGFza2VsbC1jYWJhbDp0ZXN0JyB9LFxuICAgIHsgbGFiZWw6ICdCZW5jaCcsIGNvbW1hbmQ6ICdpZGUtaGFza2VsbC1jYWJhbDpiZW5jaCcgfSxcbiAgICB7IGxhYmVsOiAnQnVpbGQgRGVwZW5kZW5jaWVzJywgY29tbWFuZDogJ2lkZS1oYXNrZWxsLWNhYmFsOmRlcHMnIH0sXG4gICAgeyBsYWJlbDogJ1NldCBBY3RpdmUgQnVpbGRlcicsIGNvbW1hbmQ6ICdpZGUtaGFza2VsbC1jYWJhbDpzZXQtYWN0aXZlLWJ1aWxkZXInIH0sXG4gICAgeyBsYWJlbDogJ1NldCBCdWlsZCBUYXJnZXQnLCBjb21tYW5kOiAnaWRlLWhhc2tlbGwtY2FiYWw6c2V0LWJ1aWxkLXRhcmdldCcgfSxcbiAgXVxuICBjb25zdHJ1Y3RvcihyZWc6IFVQSS5JVVBJUmVnaXN0cmF0aW9uKSB7XG4gICAgdGhpcy51cGkgPSByZWcoe1xuICAgICAgbmFtZTogJ2lkZS1oYXNrZWxsLWNhYmFsJyxcbiAgICAgIG1lc3NhZ2VUeXBlczoge1xuICAgICAgICBlcnJvcjoge30sXG4gICAgICAgIHdhcm5pbmc6IHt9LFxuICAgICAgICBidWlsZDoge1xuICAgICAgICAgIHVyaUZpbHRlcjogZmFsc2UsXG4gICAgICAgICAgYXV0b1Njcm9sbDogdHJ1ZSxcbiAgICAgICAgfSxcbiAgICAgICAgdGVzdDoge1xuICAgICAgICAgIHVyaUZpbHRlcjogZmFsc2UsXG4gICAgICAgICAgYXV0b1Njcm9sbDogdHJ1ZSxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICBtZW51OiB7XG4gICAgICAgIGxhYmVsOiAnQnVpbGRlcicsXG4gICAgICAgIG1lbnU6IHRoaXMubWVudSxcbiAgICAgIH0sXG4gICAgICBwYXJhbXM6IHtcbiAgICAgICAgYnVpbGRlcjogdGhpcy5idWlsZGVyUGFyYW1JbmZvKCksXG4gICAgICAgIHRhcmdldDogdGhpcy50YXJnZXRQYXJhbUluZm8oKSxcbiAgICAgIH0sXG4gICAgfSlcblxuICAgIHRoaXMuZGlzcG9zYWJsZXMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpXG5cbiAgICB0aGlzLmRpc3Bvc2FibGVzLmFkZChhdG9tLmNvbW1hbmRzLmFkZCgnYXRvbS13b3Jrc3BhY2UnLCB0aGlzLmNvbW1hbmRzKSlcbiAgICB0aGlzLmRpc3Bvc2FibGVzLmFkZCh0aGlzLnVwaSlcbiAgfVxuXG4gIHB1YmxpYyBkZXN0cm95KCkge1xuICAgIHRoaXMuZGlzcG9zYWJsZXMuZGlzcG9zZSgpXG4gIH1cblxuICBwcml2YXRlIGNhYmFsQ29tbWFuZHMoKSB7XG4gICAgY29uc3QgcmV0ID0ge31cbiAgICBmb3IgKGNvbnN0IGNtZCBvZiBPYmplY3Qua2V5cyhjb21tYW5kT3B0aW9ucykpIHtcbiAgICAgIHJldFtgaWRlLWhhc2tlbGwtY2FiYWw6JHtjbWR9YF0gPSBhc3luYyAoKSA9PlxuICAgICAgICB0aGlzLnJ1bkNhYmFsQ29tbWFuZChjbWQpXG4gICAgfVxuICAgIHJldHVybiByZXRcbiAgfVxuXG4gIHByaXZhdGUgYnVpbGRlclBhcmFtSW5mbygpOiBVUEkuSVBhcmFtU3BlYzxCdWlsZGVyUGFyYW1UeXBlPiB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGl0ZW1zOiAoKTogQnVpbGRlclBhcmFtVHlwZVtdID0+IHtcbiAgICAgICAgY29uc3QgYnVpbGRlcnMgPSBbeyBuYW1lOiAnY2FiYWwnIH0sIHsgbmFtZTogJ3N0YWNrJyB9XVxuICAgICAgICBpZiAoYXRvbS5jb25maWcuZ2V0KCdpZGUtaGFza2VsbC1jYWJhbC5lbmFibGVOaXhCdWlsZCcpKSB7XG4gICAgICAgICAgYnVpbGRlcnMucHVzaCh7IG5hbWU6ICdjYWJhbC1uaXgnIH0pXG4gICAgICAgIH1cbiAgICAgICAgYnVpbGRlcnMucHVzaCh7IG5hbWU6ICdub25lJyB9KVxuICAgICAgICByZXR1cm4gYnVpbGRlcnNcbiAgICAgIH0sXG4gICAgICBpdGVtVGVtcGxhdGU6IChpdGVtOiBCdWlsZGVyUGFyYW1UeXBlKSA9PiBgPGxpPjxkaXYgY2xhc3M9J25hbWUnPiR7aXRlbS5uYW1lfTwvZGl2PjwvbGk+YCxcbiAgICAgIGRpc3BsYXlUZW1wbGF0ZTogKGl0ZW0/OiBCdWlsZGVyUGFyYW1UeXBlKSA9PiBpdGVtICYmIGl0ZW0ubmFtZSA/IGl0ZW0ubmFtZSA6ICdOb3Qgc2V0JyxcbiAgICAgIGl0ZW1GaWx0ZXJLZXk6ICduYW1lJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnU2VsZWN0IGJ1aWxkZXIgdG8gdXNlIHdpdGggY3VycmVudCBwcm9qZWN0JyxcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHRhcmdldFBhcmFtSW5mbygpOiBVUEkuSVBhcmFtU3BlYzxUYXJnZXRQYXJhbVR5cGU+IHtcbiAgICBjb25zdCBkZWZhdWx0VmFsOiBUYXJnZXRQYXJhbVR5cGUgPSB7XG4gICAgICBwcm9qZWN0OiAnQXV0bycsXG4gICAgICB0eXBlOiAnYXV0bycsXG4gICAgICBkaXI6IHVuZGVmaW5lZCxcbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgIGRlZmF1bHQ6IGRlZmF1bHRWYWwsXG4gICAgICBpdGVtczogYXN5bmMgKCk6IFByb21pc2U8VGFyZ2V0UGFyYW1UeXBlW10+ID0+IHtcbiAgICAgICAgY29uc3QgcHJvamVjdHM6IFRhcmdldFBhcmFtVHlwZVtdID0gW2RlZmF1bHRWYWxdXG4gICAgICAgIGZvciAoY29uc3QgZCBvZiBhdG9tLnByb2plY3QuZ2V0RGlyZWN0b3JpZXMoKSkge1xuICAgICAgICAgIGNvbnN0IGRpciA9IGQuZ2V0UGF0aCgpXG4gICAgICAgICAgY29uc3QgW2NhYmFsRmlsZV0gPSAoYXdhaXQgVXRpbC5nZXRSb290RGlyKGRpcikpLmdldEVudHJpZXNTeW5jKCkuZmlsdGVyKGlzQ2FiYWxGaWxlKVxuICAgICAgICAgIGlmIChjYWJhbEZpbGUgJiYgY2FiYWxGaWxlLmlzRmlsZSgpKSB7XG4gICAgICAgICAgICBjb25zdCBkYXRhID0gYXdhaXQgY2FiYWxGaWxlLnJlYWQoKVxuICAgICAgICAgICAgY29uc3QgcHJvamVjdCA9IGF3YWl0IFV0aWwucGFyc2VEb3RDYWJhbChkYXRhKVxuICAgICAgICAgICAgaWYgKHByb2plY3QpIHtcbiAgICAgICAgICAgICAgcHJvamVjdHMucHVzaCh7IHByb2plY3Q6IHByb2plY3QubmFtZSwgZGlyLCB0eXBlOiAnYXV0bycgfSlcbiAgICAgICAgICAgICAgcHJvamVjdHMucHVzaCh7IHByb2plY3Q6IHByb2plY3QubmFtZSwgZGlyLCB0eXBlOiAnYWxsJyB9KVxuICAgICAgICAgICAgICBmb3IgKGNvbnN0IHRhcmdldCBvZiBwcm9qZWN0LnRhcmdldHMpIHtcbiAgICAgICAgICAgICAgICBwcm9qZWN0cy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgIHByb2plY3Q6IHByb2plY3QubmFtZSxcbiAgICAgICAgICAgICAgICAgIGRpcixcbiAgICAgICAgICAgICAgICAgIHR5cGU6ICdjb21wb25lbnQnLFxuICAgICAgICAgICAgICAgICAgdGFyZ2V0LFxuICAgICAgICAgICAgICAgICAgY29tcG9uZW50OiB0YXJnZXQudGFyZ2V0LFxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHByb2plY3RzXG4gICAgICB9LFxuICAgICAgaXRlbVRlbXBsYXRlOiAodGd0OiBUYXJnZXRQYXJhbVR5cGUpID0+IHtcbiAgICAgICAgbGV0IGRlc2M6IHN0cmluZ1xuICAgICAgICBzd2l0Y2ggKHRndC50eXBlKSB7XG4gICAgICAgICAgY2FzZSAnYXV0byc6XG4gICAgICAgICAgICBkZXNjID0gYDxkaXYgY2xhc3M9J25hbWUnPkF1dG88L2Rpdj5gXG4gICAgICAgICAgICBicmVha1xuICAgICAgICAgIGNhc2UgJ2FsbCc6XG4gICAgICAgICAgICBkZXNjID0gYDxkaXYgY2xhc3M9J25hbWUnPkFsbDwvZGl2PmBcbiAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgY2FzZSAnY29tcG9uZW50JzpcbiAgICAgICAgICAgIGRlc2MgPSBgXG4gICAgICAgICAgICA8ZGl2IGNsYXNzPSd0eXBlJz4ke3RndC50YXJnZXQudHlwZX08L2Rpdj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3M9J25hbWUnPiR7dGd0LnRhcmdldC5uYW1lfTwvZGl2PlxuICAgICAgICAgICAgYFxuICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgfVxuICAgICAgICAvLyB0c2xpbnQ6ZGlzYWJsZTpuby1ub24tbnVsbC1hc3NlcnRpb25cbiAgICAgICAgcmV0dXJuIGA8bGk+XG4gICAgICAgICAgPGRpdiBjbGFzcz0ncHJvamVjdCc+JHt0Z3QucHJvamVjdH08L2Rpdj5cbiAgICAgICAgICA8ZGl2IGNsYXNzPSdkaXInPiR7dGd0LmRpciB8fCAnJ308L2Rpdj5cbiAgICAgICAgICAke2Rlc2MhfVxuICAgICAgICAgIDxkaXYgY2xhc3M9J2NsZWFyZml4Jz48L2Rpdj5cbiAgICAgICAgPC9saT5gXG4gICAgICAgIC8vIHRzbGludDplbmFibGU6bm8tbm9uLW51bGwtYXNzZXJ0aW9uXG4gICAgICB9LFxuICAgICAgZGlzcGxheVRlbXBsYXRlOiAoaXRlbT86IFRhcmdldFBhcmFtVHlwZSkgPT4ge1xuICAgICAgICBpZiAoIWl0ZW0pIHJldHVybiAndW5kZWZpbmVkJ1xuICAgICAgICBpZiAoIWl0ZW0uZGlyKSB7XG4gICAgICAgICAgcmV0dXJuIGl0ZW0ucHJvamVjdFxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGxldCB0YXJnZXQ6IHN0cmluZ1xuICAgICAgICAgIHN3aXRjaCAoaXRlbS50eXBlKSB7XG4gICAgICAgICAgICBjYXNlICdhdXRvJzpcbiAgICAgICAgICAgICAgdGFyZ2V0ID0gJ0F1dG8nXG4gICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICBjYXNlICdhbGwnOlxuICAgICAgICAgICAgICB0YXJnZXQgPSAnQWxsJ1xuICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgY2FzZSAnY29tcG9uZW50JzpcbiAgICAgICAgICAgICAgdGFyZ2V0ID0gaXRlbS50YXJnZXQubmFtZVxuICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgIH1cbiAgICAgICAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6bm8tbm9uLW51bGwtYXNzZXJ0aW9uXG4gICAgICAgICAgcmV0dXJuIGAke2l0ZW0ucHJvamVjdH06ICR7dGFyZ2V0IX1gXG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBpdGVtRmlsdGVyS2V5OiAnbmFtZScsXG4gICAgICBkZXNjcmlwdGlvbjogJ1NlbGVjdCB0YXJnZXQgdG8gYnVpbGQnLFxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgZ2V0QWN0aXZlUHJvamVjdFBhdGgoKTogc3RyaW5nIHtcbiAgICBjb25zdCBlZGl0b3IgPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKClcbiAgICBpZiAoZWRpdG9yKSB7XG4gICAgICBjb25zdCBlZHBhdGggPSBlZGl0b3IuZ2V0UGF0aCgpXG4gICAgICBpZiAoZWRwYXRoKSB7XG4gICAgICAgIHJldHVybiBwYXRoLmRpcm5hbWUoZWRwYXRoKVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gYXRvbS5wcm9qZWN0LmdldFBhdGhzKClbMF0gfHwgcHJvY2Vzcy5jd2QoKVxuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBnZXRBY3RpdmVQcm9qZWN0VGFyZ2V0KGNhYmFsZmlsZTogc3RyaW5nLCBjYWJhbFJvb3Q6IERpcmVjdG9yeSk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICBjb25zdCBlZGl0b3IgPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKClcbiAgICBpZiAoZWRpdG9yKSB7XG4gICAgICBjb25zdCBlZHBhdGggPSBlZGl0b3IuZ2V0UGF0aCgpXG4gICAgICBpZiAoZWRwYXRoKSB7XG4gICAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IFV0aWwuZ2V0Q29tcG9uZW50RnJvbUZpbGUoY2FiYWxmaWxlLCBjYWJhbFJvb3QucmVsYXRpdml6ZShlZHBhdGgpKVxuICAgICAgICBpZiAocmVzKSByZXR1cm4gcmVzXG4gICAgICAgIGVsc2UgcmV0dXJuIFtdXG4gICAgICB9XG4gICAgfVxuICAgIC8vIGRlZmF1bHRcbiAgICByZXR1cm4gW11cbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgY2FiYWxCdWlsZChjbWQ6IENhYmFsQ29tbWFuZCwgb3B0czogQnVpbGRlcnMuSVBhcmFtcyk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRyeSB7XG4gICAgICBpZiAodGhpcy5ydW5uaW5nKSB7XG4gICAgICAgIHRoaXMudXBpLnNldFN0YXR1cyh7IHN0YXR1czogJ3dhcm5pbmcnLCBkZXRhaWw6ICdCdWlsZGVyIGFscmVhZHkgcnVubmluZycgfSlcbiAgICAgICAgcmV0dXJuXG4gICAgICB9XG4gICAgICB0aGlzLnJ1bm5pbmcgPSB0cnVlXG5cbiAgICAgIGNvbnN0IGJ1aWxkZXJQYXJhbSA9IGF3YWl0IHRoaXMudXBpLmdldENvbmZpZ1BhcmFtPEJ1aWxkZXJQYXJhbVR5cGU+KCdidWlsZGVyJylcbiAgICAgIGNvbnN0IHRhcmdldCA9IGF3YWl0IHRoaXMudXBpLmdldENvbmZpZ1BhcmFtPFRhcmdldFBhcmFtVHlwZT4oJ3RhcmdldCcpXG5cbiAgICAgIGlmICh0YXJnZXQgPT09IHVuZGVmaW5lZCkgeyB0aHJvdyBuZXcgRXJyb3IoJ1RhcmdldCB1bmRlZmluZWQnKSB9XG4gICAgICBpZiAoYnVpbGRlclBhcmFtID09PSB1bmRlZmluZWQpIHsgdGhyb3cgbmV3IEVycm9yKCdCdWlsZGVyIHVuZGVmaW5lZCcpIH1cblxuICAgICAgdGhpcy51cGkuc2V0U3RhdHVzKHtcbiAgICAgICAgc3RhdHVzOiAncHJvZ3Jlc3MnLFxuICAgICAgICBwcm9ncmVzczogb3B0cy5vblByb2dyZXNzID8gMC4wIDogdW5kZWZpbmVkLFxuICAgICAgICBkZXRhaWw6ICcnLFxuICAgICAgfSlcblxuICAgICAgY29uc3QgY2FiYWxSb290ID0gYXdhaXQgVXRpbC5nZXRSb290RGlyKHRhcmdldC5kaXIgPyB0YXJnZXQuZGlyIDogdGhpcy5nZXRBY3RpdmVQcm9qZWN0UGF0aCgpKVxuXG4gICAgICBjb25zdCBbY2FiYWxGaWxlXTogRmlsZVtdID0gY2FiYWxSb290LmdldEVudHJpZXNTeW5jKCkuZmlsdGVyKGlzQ2FiYWxGaWxlKVxuXG4gICAgICBpZiAoIWNhYmFsRmlsZSkgeyB0aHJvdyBuZXcgRXJyb3IoJ05vIGNhYmFsIGZpbGUgZm91bmQnKSB9XG5cbiAgICAgIGxldCBuZXdUYXJnZXQ6IFRhcmdldFBhcmFtVHlwZUZvckJ1aWxkZXIgfCB1bmRlZmluZWRcblxuICAgICAgaWYgKHRhcmdldC50eXBlID09PSAnYXV0bycpIHtcbiAgICAgICAgY29uc3QgY2FiYWxDb250ZW50cyA9IGF3YWl0IGNhYmFsRmlsZS5yZWFkKClcbiAgICAgICAgY29uc3QgdGd0cyA9IGF3YWl0IHRoaXMuZ2V0QWN0aXZlUHJvamVjdFRhcmdldChjYWJhbENvbnRlbnRzLCBjYWJhbFJvb3QpXG4gICAgICAgIGNvbnN0IFt0Z3RdID0gdGd0c1xuICAgICAgICBpZiAodGd0KSB7XG4gICAgICAgICAgY29uc3QgY2YgPSBhd2FpdCBVdGlsLnBhcnNlRG90Q2FiYWwoY2FiYWxDb250ZW50cylcbiAgICAgICAgICBpZiAoY2YpIHtcbiAgICAgICAgICAgIG5ld1RhcmdldCA9IHtcbiAgICAgICAgICAgICAgcHJvamVjdDogY2YubmFtZSxcbiAgICAgICAgICAgICAgZGlyOiBjYWJhbFJvb3QuZ2V0UGF0aCgpLFxuICAgICAgICAgICAgICB0eXBlOiAnY29tcG9uZW50JyxcbiAgICAgICAgICAgICAgY29tcG9uZW50OiB0Z3QsXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKHRhcmdldC50eXBlID09PSAnYWxsJykge1xuICAgICAgICBjb25zdCBjYWJhbENvbnRlbnRzID0gYXdhaXQgY2FiYWxGaWxlLnJlYWQoKVxuICAgICAgICBjb25zdCBjZiA9IGF3YWl0IFV0aWwucGFyc2VEb3RDYWJhbChjYWJhbENvbnRlbnRzKVxuICAgICAgICBpZiAoY2YpIHtcbiAgICAgICAgICBuZXdUYXJnZXQgPSBuZXdUYXJnZXQgPSB7XG4gICAgICAgICAgICBwcm9qZWN0OiBjZi5uYW1lLFxuICAgICAgICAgICAgZGlyOiBjYWJhbFJvb3QuZ2V0UGF0aCgpLFxuICAgICAgICAgICAgdHlwZTogJ2FsbCcsXG4gICAgICAgICAgICB0YXJnZXRzOiBjZi50YXJnZXRzLFxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmICh0YXJnZXQudHlwZSA9PT0gJ2NvbXBvbmVudCcpIHtcbiAgICAgICAgY29uc3QgeyBwcm9qZWN0LCBkaXIsIGNvbXBvbmVudCB9ID0gdGFyZ2V0XG4gICAgICAgIG5ld1RhcmdldCA9IHsgdHlwZTogJ2NvbXBvbmVudCcsIHByb2plY3QsIGRpciwgY29tcG9uZW50IH1cbiAgICAgIH1cbiAgICAgIGlmICghbmV3VGFyZ2V0KSB7XG4gICAgICAgIG5ld1RhcmdldCA9IHtcbiAgICAgICAgICB0eXBlOiAnYXV0bycsXG4gICAgICAgICAgcHJvamVjdDogdGFyZ2V0LnByb2plY3QsXG4gICAgICAgICAgZGlyOiB0YXJnZXQuZGlyLFxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBjb25zdCBidWlsZGVyczogVEJ1aWxkZXJzID0ge1xuICAgICAgICAnY2FiYWwtbml4JzogQnVpbGRlcnMuQ2FiYWxOaXgsXG4gICAgICAgICdjYWJhbCc6IEJ1aWxkZXJzLkNhYmFsLFxuICAgICAgICAnc3RhY2snOiBCdWlsZGVycy5TdGFjayxcbiAgICAgICAgJ25vbmUnOiBCdWlsZGVycy5Ob25lLFxuICAgICAgfVxuICAgICAgY29uc3QgYnVpbGRlciA9IGJ1aWxkZXJzW2J1aWxkZXJQYXJhbS5uYW1lXVxuXG4gICAgICBpZiAoYnVpbGRlciA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgVW5rbm93biBidWlsZGVyICckeyhidWlsZGVyUGFyYW0gJiYgYnVpbGRlclBhcmFtLm5hbWUpIHx8IGJ1aWxkZXJQYXJhbX0nYClcbiAgICAgIH1cblxuICAgICAgY29uc3QgcmVzID0gYXdhaXQgKG5ldyBidWlsZGVyKHsgb3B0cywgdGFyZ2V0OiBuZXdUYXJnZXQsIGNhYmFsUm9vdCB9KSkucnVuQ29tbWFuZChjbWQpXG4gICAgICAvLyBzZWUgQ2FiYWxQcm9jZXNzIGZvciBleHBsYWluYXRpb25cbiAgICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTogbm8tbnVsbC1rZXl3b3JkXG4gICAgICBpZiAocmVzLmV4aXRDb2RlID09PSBudWxsKSB7IC8vIHRoaXMgbWVhbnMgcHJvY2VzcyB3YXMga2lsbGVkXG4gICAgICAgIHRoaXMudXBpLnNldFN0YXR1cyh7IHN0YXR1czogJ3dhcm5pbmcnLCBkZXRhaWw6ICdCdWlsZCB3YXMgaW50ZXJydXB0ZWQnIH0pXG4gICAgICB9IGVsc2UgaWYgKHJlcy5leGl0Q29kZSAhPT0gMCkge1xuICAgICAgICBpZiAocmVzLmhhc0Vycm9yKSB7XG4gICAgICAgICAgdGhpcy51cGkuc2V0U3RhdHVzKHsgc3RhdHVzOiAnd2FybmluZycsIGRldGFpbDogJ1RoZXJlIHdlcmUgZXJyb3JzIGluIHNvdXJjZSBmaWxlcycgfSlcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLnVwaS5zZXRTdGF0dXMoe1xuICAgICAgICAgICAgc3RhdHVzOiAnZXJyb3InLFxuICAgICAgICAgICAgZGV0YWlsOiBgQnVpbGRlciBxdWl0IGFibm9ybWFsbHkgd2l0aCBleGl0IGNvZGUgJHtyZXMuZXhpdENvZGV9YCxcbiAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnVwaS5zZXRTdGF0dXMoeyBzdGF0dXM6ICdyZWFkeScsIGRldGFpbDogJ0J1aWxkIHdhcyBzdWNjZXNzZnVsJyB9KVxuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBpZiAoZXJyb3IpIHtcbiAgICAgICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOiBuby1jb25zb2xlXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpXG4gICAgICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTogbm8tdW5zYWZlLWFueVxuICAgICAgICB0aGlzLnVwaS5zZXRTdGF0dXMoeyBzdGF0dXM6ICdlcnJvcicsIGRldGFpbDogZXJyb3IudG9TdHJpbmcoKSB9KVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy51cGkuc2V0U3RhdHVzKHsgc3RhdHVzOiAnd2FybmluZycsIGRldGFpbDogJ0J1aWxkIGZhaWxlZCB3aXRoIG5vIGVycm9ycycgfSlcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5ydW5uaW5nID0gZmFsc2VcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgcnVuQ2FiYWxDb21tYW5kKGNvbW1hbmQ6IENhYmFsQ29tbWFuZCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IHsgbWVzc2FnZVR5cGVzLCBkZWZhdWx0U2V2ZXJpdHksIGNhbkNhbmNlbCB9ID0gY29tbWFuZE9wdGlvbnNbY29tbWFuZF1cbiAgICBjb25zdCBtZXNzYWdlczogVVBJLklSZXN1bHRJdGVtW10gPSBbXVxuICAgIHRoaXMudXBpLnNldE1lc3NhZ2VzKG1lc3NhZ2VzKVxuXG4gICAgbGV0IGNhbmNlbEFjdGlvbkRpc3A6IERpc3Bvc2FibGUgfCB1bmRlZmluZWRcblxuICAgIGF3YWl0IHRoaXMuY2FiYWxCdWlsZChjb21tYW5kLCB7XG4gICAgICBzZXZlcml0eTogZGVmYXVsdFNldmVyaXR5LFxuICAgICAgc2V0Q2FuY2VsQWN0aW9uOlxuICAgICAgY2FuQ2FuY2VsID9cbiAgICAgICAgKGFjdGlvbjogKCkgPT4gdm9pZCkgPT4ge1xuICAgICAgICAgIGNhbmNlbEFjdGlvbkRpc3AgJiYgY2FuY2VsQWN0aW9uRGlzcC5kaXNwb3NlKClcbiAgICAgICAgICBjYW5jZWxBY3Rpb25EaXNwID0gdGhpcy51cGkuYWRkUGFuZWxDb250cm9sKHtcbiAgICAgICAgICAgIGVsZW1lbnQ6ICdpZGUtaGFza2VsbC1idXR0b24nLFxuICAgICAgICAgICAgb3B0czoge1xuICAgICAgICAgICAgICBjbGFzc2VzOiBbJ2NhbmNlbCddLFxuICAgICAgICAgICAgICBldmVudHM6IHtcbiAgICAgICAgICAgICAgICBjbGljazogYWN0aW9uLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9KVxuICAgICAgICB9IDogdW5kZWZpbmVkLFxuICAgICAgb25Nc2c6IChtZXNzYWdlOiBVUEkuSVJlc3VsdEl0ZW0pID0+IHtcbiAgICAgICAgaWYgKG1lc3NhZ2VUeXBlcy5pbmNsdWRlcyhtZXNzYWdlLnNldmVyaXR5KSkge1xuICAgICAgICAgIG1lc3NhZ2VzLnB1c2gobWVzc2FnZSlcbiAgICAgICAgICB0aGlzLnVwaS5zZXRNZXNzYWdlcyhtZXNzYWdlcylcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIG9uUHJvZ3Jlc3M6XG4gICAgICBjYW5DYW5jZWxcbiAgICAgICAgPyAocHJvZ3Jlc3M6IG51bWJlcikgPT4gdGhpcy51cGkuc2V0U3RhdHVzKHsgc3RhdHVzOiAncHJvZ3Jlc3MnLCBwcm9ncmVzcywgZGV0YWlsOiBgJHtjb21tYW5kfSBpbiBwcm9ncmVzc2AgfSlcbiAgICAgICAgOiB1bmRlZmluZWQsXG4gICAgfSlcbiAgICBjYW5jZWxBY3Rpb25EaXNwICYmIGNhbmNlbEFjdGlvbkRpc3AuZGlzcG9zZSgpXG4gIH1cbn1cbiJdfQ==