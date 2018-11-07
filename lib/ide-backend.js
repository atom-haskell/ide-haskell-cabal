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
        this.commands = Object.assign({}, this.cabalCommands(), { 'ide-haskell-cabal:set-build-target': async () => {
                await this.upi.setConfigParam('target');
            }, 'ide-haskell-cabal:set-active-builder': async () => {
                await this.upi.setConfigParam('builder');
            } });
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
                        if (data === null) {
                            throw new Error(`Could not read cabalfile ${cabalFile.getPath()}`);
                        }
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
                if (cabalContents === null) {
                    throw new Error(`Could not read cabalfile ${cabalFile.getPath()}`);
                }
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
                if (cabalContents === null) {
                    throw new Error(`Could not read cabalfile ${cabalFile.getPath()}`);
                }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaWRlLWJhY2tlbmQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaWRlLWJhY2tlbmQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSw2QkFBNEI7QUFDNUIsK0JBQXVFO0FBQ3ZFLHVDQUFzQztBQUN0QywyQ0FBMEM7QUFZMUMsU0FBUyxXQUFXLENBQUMsSUFBdUI7SUFDMUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDLE1BQU0sRUFBRSxJQUFJLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQTtBQUMzRSxDQUFDO0FBaUJELE1BQU0sY0FBYyxHQUE2QztJQUMvRCxLQUFLLEVBQUU7UUFDTCxZQUFZLEVBQUUsQ0FBQyxPQUFPLEVBQUUsU0FBUyxFQUFFLE9BQU8sQ0FBQztRQUMzQyxlQUFlLEVBQUUsT0FBTztRQUN4QixTQUFTLEVBQUUsSUFBSTtLQUNoQjtJQUNELEtBQUssRUFBRTtRQUNMLFlBQVksRUFBRSxDQUFDLE9BQU8sQ0FBQztRQUN2QixlQUFlLEVBQUUsT0FBTztRQUN4QixTQUFTLEVBQUUsS0FBSztLQUNqQjtJQUNELElBQUksRUFBRTtRQUNKLFlBQVksRUFBRSxDQUFDLE9BQU8sRUFBRSxTQUFTLEVBQUUsT0FBTyxFQUFFLE1BQU0sQ0FBQztRQUNuRCxlQUFlLEVBQUUsTUFBTTtRQUN2QixTQUFTLEVBQUUsSUFBSTtLQUNoQjtJQUNELEtBQUssRUFBRTtRQUNMLFlBQVksRUFBRSxDQUFDLE9BQU8sRUFBRSxTQUFTLEVBQUUsT0FBTyxFQUFFLE1BQU0sQ0FBQztRQUNuRCxlQUFlLEVBQUUsTUFBTTtRQUN2QixTQUFTLEVBQUUsSUFBSTtLQUNoQjtJQUNELElBQUksRUFBRTtRQUNKLFlBQVksRUFBRSxDQUFDLE9BQU8sQ0FBQztRQUN2QixlQUFlLEVBQUUsT0FBTztRQUN4QixTQUFTLEVBQUUsSUFBSTtLQUNoQjtDQUNGLENBQUE7QUFF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U0FBUztTQUNkLENBQUMsQ0FBQTtRQUNGLGdCQUFnQixJQUFJLGdCQUFnQixDQUFDLE9BQU8sRUFBRSxDQUFBO0lBQ2hELENBQUM7Q0FDRjtBQS9ZRCxnQ0ErWUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnXG5pbXBvcnQgeyBGaWxlLCBDb21wb3NpdGVEaXNwb3NhYmxlLCBEaXNwb3NhYmxlLCBEaXJlY3RvcnkgfSBmcm9tICdhdG9tJ1xuaW1wb3J0ICogYXMgQnVpbGRlcnMgZnJvbSAnLi9idWlsZGVycydcbmltcG9ydCAqIGFzIFV0aWwgZnJvbSAnYXRvbS1oYXNrZWxsLXV0aWxzJ1xuaW1wb3J0IHtcbiAgVGFyZ2V0UGFyYW1UeXBlLFxuICBDYWJhbENvbW1hbmQsXG4gIFRhcmdldFBhcmFtVHlwZUZvckJ1aWxkZXIsXG59IGZyb20gJy4vY29tbW9uJ1xuaW1wb3J0ICogYXMgVVBJIGZyb20gJ2F0b20taGFza2VsbC11cGknXG5cbmludGVyZmFjZSBCdWlsZGVyUGFyYW1UeXBlIHtcbiAgbmFtZTogJ2NhYmFsJyB8ICdzdGFjaycgfCAnY2FiYWwtbml4JyB8ICdub25lJ1xufVxuXG5mdW5jdGlvbiBpc0NhYmFsRmlsZShmaWxlPzogRmlsZSB8IERpcmVjdG9yeSk6IGZpbGUgaXMgRmlsZSB7XG4gIHJldHVybiAhIShmaWxlICYmIGZpbGUuaXNGaWxlKCkgJiYgZmlsZS5nZXRCYXNlTmFtZSgpLmVuZHNXaXRoKCcuY2FiYWwnKSlcbn1cblxuaW50ZXJmYWNlIElDb21tYW5kT3B0aW9ucyB7XG4gIG1lc3NhZ2VUeXBlczogVVBJLlRTZXZlcml0eVtdXG4gIGRlZmF1bHRTZXZlcml0eTogVVBJLlRTZXZlcml0eVxuICBjYW5DYW5jZWw6IGJvb2xlYW5cbn1cblxuaW50ZXJmYWNlIEJ1aWxkZXJDb25zdHJ1Y3RvciB7XG4gIG5ldyAob3B0czogQnVpbGRlcnMuQ3Rvck9wdHMpOiBCdWlsZGVycy5CdWlsZGVyXG59XG5cbnR5cGUgVEJ1aWxkZXJzID0gUmVjb3JkPFxuICBCdWlsZGVyUGFyYW1UeXBlWyduYW1lJ10sXG4gIEJ1aWxkZXJDb25zdHJ1Y3RvciB8IHVuZGVmaW5lZFxuPlxuXG5jb25zdCBjb21tYW5kT3B0aW9uczogeyBbSyBpbiBDYWJhbENvbW1hbmRdOiBJQ29tbWFuZE9wdGlvbnMgfSA9IHtcbiAgYnVpbGQ6IHtcbiAgICBtZXNzYWdlVHlwZXM6IFsnZXJyb3InLCAnd2FybmluZycsICdidWlsZCddLFxuICAgIGRlZmF1bHRTZXZlcml0eTogJ2J1aWxkJyxcbiAgICBjYW5DYW5jZWw6IHRydWUsXG4gIH0sXG4gIGNsZWFuOiB7XG4gICAgbWVzc2FnZVR5cGVzOiBbJ2J1aWxkJ10sXG4gICAgZGVmYXVsdFNldmVyaXR5OiAnYnVpbGQnLFxuICAgIGNhbkNhbmNlbDogZmFsc2UsXG4gIH0sXG4gIHRlc3Q6IHtcbiAgICBtZXNzYWdlVHlwZXM6IFsnZXJyb3InLCAnd2FybmluZycsICdidWlsZCcsICd0ZXN0J10sXG4gICAgZGVmYXVsdFNldmVyaXR5OiAndGVzdCcsXG4gICAgY2FuQ2FuY2VsOiB0cnVlLFxuICB9LFxuICBiZW5jaDoge1xuICAgIG1lc3NhZ2VUeXBlczogWydlcnJvcicsICd3YXJuaW5nJywgJ2J1aWxkJywgJ3Rlc3QnXSxcbiAgICBkZWZhdWx0U2V2ZXJpdHk6ICd0ZXN0JyxcbiAgICBjYW5DYW5jZWw6IHRydWUsXG4gIH0sXG4gIGRlcHM6IHtcbiAgICBtZXNzYWdlVHlwZXM6IFsnYnVpbGQnXSxcbiAgICBkZWZhdWx0U2V2ZXJpdHk6ICdidWlsZCcsXG4gICAgY2FuQ2FuY2VsOiB0cnVlLFxuICB9LFxufVxuXG5leHBvcnQgY2xhc3MgSWRlQmFja2VuZCB7XG4gIHByaXZhdGUgZGlzcG9zYWJsZXM6IENvbXBvc2l0ZURpc3Bvc2FibGVcbiAgcHJpdmF0ZSB1cGk6IFVQSS5JVVBJSW5zdGFuY2VcbiAgcHJpdmF0ZSBydW5uaW5nOiBib29sZWFuID0gZmFsc2VcbiAgcHJpdmF0ZSBjb21tYW5kcyA9IHtcbiAgICAuLi50aGlzLmNhYmFsQ29tbWFuZHMoKSxcbiAgICAnaWRlLWhhc2tlbGwtY2FiYWw6c2V0LWJ1aWxkLXRhcmdldCc6IGFzeW5jICgpID0+IHtcbiAgICAgIGF3YWl0IHRoaXMudXBpLnNldENvbmZpZ1BhcmFtKCd0YXJnZXQnKVxuICAgIH0sXG4gICAgJ2lkZS1oYXNrZWxsLWNhYmFsOnNldC1hY3RpdmUtYnVpbGRlcic6IGFzeW5jICgpID0+IHtcbiAgICAgIGF3YWl0IHRoaXMudXBpLnNldENvbmZpZ1BhcmFtKCdidWlsZGVyJylcbiAgICB9LFxuICB9XG4gIHByaXZhdGUgbWVudSA9IFtcbiAgICB7IGxhYmVsOiAnQnVpbGQgUHJvamVjdCcsIGNvbW1hbmQ6ICdpZGUtaGFza2VsbC1jYWJhbDpidWlsZCcgfSxcbiAgICB7IGxhYmVsOiAnQ2xlYW4gUHJvamVjdCcsIGNvbW1hbmQ6ICdpZGUtaGFza2VsbC1jYWJhbDpjbGVhbicgfSxcbiAgICB7IGxhYmVsOiAnVGVzdCcsIGNvbW1hbmQ6ICdpZGUtaGFza2VsbC1jYWJhbDp0ZXN0JyB9LFxuICAgIHsgbGFiZWw6ICdCZW5jaCcsIGNvbW1hbmQ6ICdpZGUtaGFza2VsbC1jYWJhbDpiZW5jaCcgfSxcbiAgICB7IGxhYmVsOiAnQnVpbGQgRGVwZW5kZW5jaWVzJywgY29tbWFuZDogJ2lkZS1oYXNrZWxsLWNhYmFsOmRlcHMnIH0sXG4gICAge1xuICAgICAgbGFiZWw6ICdTZXQgQWN0aXZlIEJ1aWxkZXInLFxuICAgICAgY29tbWFuZDogJ2lkZS1oYXNrZWxsLWNhYmFsOnNldC1hY3RpdmUtYnVpbGRlcicsXG4gICAgfSxcbiAgICB7XG4gICAgICBsYWJlbDogJ1NldCBCdWlsZCBUYXJnZXQnLFxuICAgICAgY29tbWFuZDogJ2lkZS1oYXNrZWxsLWNhYmFsOnNldC1idWlsZC10YXJnZXQnLFxuICAgIH0sXG4gIF1cbiAgY29uc3RydWN0b3IocmVnOiBVUEkuSVVQSVJlZ2lzdHJhdGlvbikge1xuICAgIHRoaXMudXBpID0gcmVnKHtcbiAgICAgIG5hbWU6ICdpZGUtaGFza2VsbC1jYWJhbCcsXG4gICAgICBtZXNzYWdlVHlwZXM6IHtcbiAgICAgICAgZXJyb3I6IHt9LFxuICAgICAgICB3YXJuaW5nOiB7fSxcbiAgICAgICAgYnVpbGQ6IHtcbiAgICAgICAgICB1cmlGaWx0ZXI6IGZhbHNlLFxuICAgICAgICAgIGF1dG9TY3JvbGw6IHRydWUsXG4gICAgICAgIH0sXG4gICAgICAgIHRlc3Q6IHtcbiAgICAgICAgICB1cmlGaWx0ZXI6IGZhbHNlLFxuICAgICAgICAgIGF1dG9TY3JvbGw6IHRydWUsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgbWVudToge1xuICAgICAgICBsYWJlbDogJ0J1aWxkZXInLFxuICAgICAgICBtZW51OiB0aGlzLm1lbnUsXG4gICAgICB9LFxuICAgICAgcGFyYW1zOiB7XG4gICAgICAgIGJ1aWxkZXI6IHRoaXMuYnVpbGRlclBhcmFtSW5mbygpLFxuICAgICAgICB0YXJnZXQ6IHRoaXMudGFyZ2V0UGFyYW1JbmZvKCksXG4gICAgICB9LFxuICAgIH0pXG5cbiAgICB0aGlzLmRpc3Bvc2FibGVzID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKVxuXG4gICAgdGhpcy5kaXNwb3NhYmxlcy5hZGQoYXRvbS5jb21tYW5kcy5hZGQoJ2F0b20td29ya3NwYWNlJywgdGhpcy5jb21tYW5kcykpXG4gICAgdGhpcy5kaXNwb3NhYmxlcy5hZGQodGhpcy51cGkpXG4gIH1cblxuICBwdWJsaWMgZGVzdHJveSgpIHtcbiAgICB0aGlzLmRpc3Bvc2FibGVzLmRpc3Bvc2UoKVxuICB9XG5cbiAgcHJpdmF0ZSBjYWJhbENvbW1hbmRzKCkge1xuICAgIGNvbnN0IHJldCA9IHt9XG4gICAgZm9yIChjb25zdCBjbWQgb2YgT2JqZWN0LmtleXMoY29tbWFuZE9wdGlvbnMpKSB7XG4gICAgICByZXRbYGlkZS1oYXNrZWxsLWNhYmFsOiR7Y21kfWBdID0gYXN5bmMgKCkgPT4gdGhpcy5ydW5DYWJhbENvbW1hbmQoY21kKVxuICAgIH1cbiAgICByZXR1cm4gcmV0XG4gIH1cblxuICBwcml2YXRlIGJ1aWxkZXJQYXJhbUluZm8oKTogVVBJLklQYXJhbVNwZWM8QnVpbGRlclBhcmFtVHlwZT4ge1xuICAgIHJldHVybiB7XG4gICAgICBpdGVtczogKCk6IEJ1aWxkZXJQYXJhbVR5cGVbXSA9PiB7XG4gICAgICAgIGNvbnN0IGJ1aWxkZXJzOiBCdWlsZGVyUGFyYW1UeXBlW10gPSBbXG4gICAgICAgICAgeyBuYW1lOiAnY2FiYWwnIH0sXG4gICAgICAgICAgeyBuYW1lOiAnc3RhY2snIH0sXG4gICAgICAgIF1cbiAgICAgICAgaWYgKGF0b20uY29uZmlnLmdldCgnaWRlLWhhc2tlbGwtY2FiYWwuZW5hYmxlTml4QnVpbGQnKSkge1xuICAgICAgICAgIGJ1aWxkZXJzLnB1c2goeyBuYW1lOiAnY2FiYWwtbml4JyB9KVxuICAgICAgICB9XG4gICAgICAgIGJ1aWxkZXJzLnB1c2goeyBuYW1lOiAnbm9uZScgfSlcbiAgICAgICAgcmV0dXJuIGJ1aWxkZXJzXG4gICAgICB9LFxuICAgICAgaXRlbVRlbXBsYXRlOiAoaXRlbTogQnVpbGRlclBhcmFtVHlwZSkgPT5cbiAgICAgICAgYDxsaT48ZGl2IGNsYXNzPSduYW1lJz4ke2l0ZW0ubmFtZX08L2Rpdj48L2xpPmAsXG4gICAgICBkaXNwbGF5VGVtcGxhdGU6IChpdGVtPzogQnVpbGRlclBhcmFtVHlwZSkgPT5cbiAgICAgICAgaXRlbSAmJiBpdGVtLm5hbWUgPyBpdGVtLm5hbWUgOiAnTm90IHNldCcsXG4gICAgICBpdGVtRmlsdGVyS2V5OiAnbmFtZScsXG4gICAgICBkZXNjcmlwdGlvbjogJ1NlbGVjdCBidWlsZGVyIHRvIHVzZSB3aXRoIGN1cnJlbnQgcHJvamVjdCcsXG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSB0YXJnZXRQYXJhbUluZm8oKTogVVBJLklQYXJhbVNwZWM8VGFyZ2V0UGFyYW1UeXBlPiB7XG4gICAgY29uc3QgZGVmYXVsdFZhbDogVGFyZ2V0UGFyYW1UeXBlID0ge1xuICAgICAgcHJvamVjdDogJ0F1dG8nLFxuICAgICAgdHlwZTogJ2F1dG8nLFxuICAgICAgZGlyOiB1bmRlZmluZWQsXG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICBkZWZhdWx0OiBkZWZhdWx0VmFsLFxuICAgICAgaXRlbXM6IGFzeW5jICgpOiBQcm9taXNlPFRhcmdldFBhcmFtVHlwZVtdPiA9PiB7XG4gICAgICAgIGNvbnN0IHByb2plY3RzOiBUYXJnZXRQYXJhbVR5cGVbXSA9IFtkZWZhdWx0VmFsXVxuICAgICAgICBmb3IgKGNvbnN0IGQgb2YgYXRvbS5wcm9qZWN0LmdldERpcmVjdG9yaWVzKCkpIHtcbiAgICAgICAgICBjb25zdCBkaXIgPSBkLmdldFBhdGgoKVxuICAgICAgICAgIGNvbnN0IFtjYWJhbEZpbGVdID0gKGF3YWl0IFV0aWwuZ2V0Um9vdERpcihkaXIpKVxuICAgICAgICAgICAgLmdldEVudHJpZXNTeW5jKClcbiAgICAgICAgICAgIC5maWx0ZXIoaXNDYWJhbEZpbGUpXG4gICAgICAgICAgaWYgKGNhYmFsRmlsZSAmJiBjYWJhbEZpbGUuaXNGaWxlKCkpIHtcbiAgICAgICAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCBjYWJhbEZpbGUucmVhZCgpXG4gICAgICAgICAgICBpZiAoZGF0YSA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYENvdWxkIG5vdCByZWFkIGNhYmFsZmlsZSAke2NhYmFsRmlsZS5nZXRQYXRoKCl9YClcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IHByb2plY3QgPSBhd2FpdCBVdGlsLnBhcnNlRG90Q2FiYWwoZGF0YSlcbiAgICAgICAgICAgIGlmIChwcm9qZWN0KSB7XG4gICAgICAgICAgICAgIHByb2plY3RzLnB1c2goeyBwcm9qZWN0OiBwcm9qZWN0Lm5hbWUsIGRpciwgdHlwZTogJ2F1dG8nIH0pXG4gICAgICAgICAgICAgIHByb2plY3RzLnB1c2goeyBwcm9qZWN0OiBwcm9qZWN0Lm5hbWUsIGRpciwgdHlwZTogJ2FsbCcgfSlcbiAgICAgICAgICAgICAgZm9yIChjb25zdCB0YXJnZXQgb2YgcHJvamVjdC50YXJnZXRzKSB7XG4gICAgICAgICAgICAgICAgcHJvamVjdHMucHVzaCh7XG4gICAgICAgICAgICAgICAgICBwcm9qZWN0OiBwcm9qZWN0Lm5hbWUsXG4gICAgICAgICAgICAgICAgICBkaXIsXG4gICAgICAgICAgICAgICAgICB0eXBlOiAnY29tcG9uZW50JyxcbiAgICAgICAgICAgICAgICAgIHRhcmdldCxcbiAgICAgICAgICAgICAgICAgIGNvbXBvbmVudDogdGFyZ2V0LnRhcmdldCxcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBwcm9qZWN0c1xuICAgICAgfSxcbiAgICAgIGl0ZW1UZW1wbGF0ZTogKHRndDogVGFyZ2V0UGFyYW1UeXBlKSA9PiB7XG4gICAgICAgIGxldCBkZXNjOiBzdHJpbmdcbiAgICAgICAgc3dpdGNoICh0Z3QudHlwZSkge1xuICAgICAgICAgIGNhc2UgJ2F1dG8nOlxuICAgICAgICAgICAgZGVzYyA9IGA8ZGl2IGNsYXNzPSduYW1lJz5BdXRvPC9kaXY+YFxuICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICBjYXNlICdhbGwnOlxuICAgICAgICAgICAgZGVzYyA9IGA8ZGl2IGNsYXNzPSduYW1lJz5BbGw8L2Rpdj5gXG4gICAgICAgICAgICBicmVha1xuICAgICAgICAgIGNhc2UgJ2NvbXBvbmVudCc6XG4gICAgICAgICAgICBkZXNjID0gYFxuICAgICAgICAgICAgPGRpdiBjbGFzcz0ndHlwZSc+JHt0Z3QudGFyZ2V0LnR5cGV9PC9kaXY+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzPSduYW1lJz4ke3RndC50YXJnZXQubmFtZX08L2Rpdj5cbiAgICAgICAgICAgIGBcbiAgICAgICAgICAgIGJyZWFrXG4gICAgICAgIH1cbiAgICAgICAgLy8gdHNsaW50OmRpc2FibGU6bm8tbm9uLW51bGwtYXNzZXJ0aW9uXG4gICAgICAgIHJldHVybiBgPGxpPlxuICAgICAgICAgIDxkaXYgY2xhc3M9J3Byb2plY3QnPiR7dGd0LnByb2plY3R9PC9kaXY+XG4gICAgICAgICAgPGRpdiBjbGFzcz0nZGlyJz4ke3RndC5kaXIgfHwgJyd9PC9kaXY+XG4gICAgICAgICAgJHtkZXNjIX1cbiAgICAgICAgICA8ZGl2IGNsYXNzPSdjbGVhcmZpeCc+PC9kaXY+XG4gICAgICAgIDwvbGk+YFxuICAgICAgICAvLyB0c2xpbnQ6ZW5hYmxlOm5vLW5vbi1udWxsLWFzc2VydGlvblxuICAgICAgfSxcbiAgICAgIGRpc3BsYXlUZW1wbGF0ZTogKGl0ZW0/OiBUYXJnZXRQYXJhbVR5cGUpID0+IHtcbiAgICAgICAgaWYgKCFpdGVtKSByZXR1cm4gJ3VuZGVmaW5lZCdcbiAgICAgICAgaWYgKCFpdGVtLmRpcikge1xuICAgICAgICAgIHJldHVybiBpdGVtLnByb2plY3RcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBsZXQgdGFyZ2V0OiBzdHJpbmdcbiAgICAgICAgICBzd2l0Y2ggKGl0ZW0udHlwZSkge1xuICAgICAgICAgICAgY2FzZSAnYXV0byc6XG4gICAgICAgICAgICAgIHRhcmdldCA9ICdBdXRvJ1xuICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgY2FzZSAnYWxsJzpcbiAgICAgICAgICAgICAgdGFyZ2V0ID0gJ0FsbCdcbiAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgIGNhc2UgJ2NvbXBvbmVudCc6XG4gICAgICAgICAgICAgIHRhcmdldCA9IGl0ZW0udGFyZ2V0Lm5hbWVcbiAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICB9XG4gICAgICAgICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOm5vLW5vbi1udWxsLWFzc2VydGlvblxuICAgICAgICAgIHJldHVybiBgJHtpdGVtLnByb2plY3R9OiAke3RhcmdldCF9YFxuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgaXRlbUZpbHRlcktleTogJ25hbWUnLFxuICAgICAgZGVzY3JpcHRpb246ICdTZWxlY3QgdGFyZ2V0IHRvIGJ1aWxkJyxcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGdldEFjdGl2ZVByb2plY3RQYXRoKCk6IHN0cmluZyB7XG4gICAgY29uc3QgZWRpdG9yID0gYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpXG4gICAgaWYgKGVkaXRvcikge1xuICAgICAgY29uc3QgZWRwYXRoID0gZWRpdG9yLmdldFBhdGgoKVxuICAgICAgaWYgKGVkcGF0aCkge1xuICAgICAgICByZXR1cm4gcGF0aC5kaXJuYW1lKGVkcGF0aClcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGF0b20ucHJvamVjdC5nZXRQYXRocygpWzBdIHx8IHByb2Nlc3MuY3dkKClcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgZ2V0QWN0aXZlUHJvamVjdFRhcmdldChcbiAgICBjYWJhbGZpbGU6IHN0cmluZyxcbiAgICBjYWJhbFJvb3Q6IERpcmVjdG9yeSxcbiAgKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICAgIGNvbnN0IGVkaXRvciA9IGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVRleHRFZGl0b3IoKVxuICAgIGlmIChlZGl0b3IpIHtcbiAgICAgIGNvbnN0IGVkcGF0aCA9IGVkaXRvci5nZXRQYXRoKClcbiAgICAgIGlmIChlZHBhdGgpIHtcbiAgICAgICAgY29uc3QgcmVzID0gYXdhaXQgVXRpbC5nZXRDb21wb25lbnRGcm9tRmlsZShcbiAgICAgICAgICBjYWJhbGZpbGUsXG4gICAgICAgICAgY2FiYWxSb290LnJlbGF0aXZpemUoZWRwYXRoKSxcbiAgICAgICAgKVxuICAgICAgICBpZiAocmVzKSByZXR1cm4gcmVzXG4gICAgICAgIGVsc2UgcmV0dXJuIFtdXG4gICAgICB9XG4gICAgfVxuICAgIC8vIGRlZmF1bHRcbiAgICByZXR1cm4gW11cbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgY2FiYWxCdWlsZChcbiAgICBjbWQ6IENhYmFsQ29tbWFuZCxcbiAgICBvcHRzOiBCdWlsZGVycy5JUGFyYW1zLFxuICApOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0cnkge1xuICAgICAgaWYgKHRoaXMucnVubmluZykge1xuICAgICAgICB0aGlzLnVwaS5zZXRTdGF0dXMoe1xuICAgICAgICAgIHN0YXR1czogJ3dhcm5pbmcnLFxuICAgICAgICAgIGRldGFpbDogJ0J1aWxkZXIgYWxyZWFkeSBydW5uaW5nJyxcbiAgICAgICAgfSlcbiAgICAgICAgcmV0dXJuXG4gICAgICB9XG4gICAgICB0aGlzLnJ1bm5pbmcgPSB0cnVlXG5cbiAgICAgIGNvbnN0IGJ1aWxkZXJQYXJhbSA9IGF3YWl0IHRoaXMudXBpLmdldENvbmZpZ1BhcmFtPEJ1aWxkZXJQYXJhbVR5cGU+KFxuICAgICAgICAnYnVpbGRlcicsXG4gICAgICApXG4gICAgICBjb25zdCB0YXJnZXQgPSBhd2FpdCB0aGlzLnVwaS5nZXRDb25maWdQYXJhbTxUYXJnZXRQYXJhbVR5cGU+KCd0YXJnZXQnKVxuXG4gICAgICBpZiAodGFyZ2V0ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdUYXJnZXQgdW5kZWZpbmVkJylcbiAgICAgIH1cbiAgICAgIGlmIChidWlsZGVyUGFyYW0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0J1aWxkZXIgdW5kZWZpbmVkJylcbiAgICAgIH1cblxuICAgICAgdGhpcy51cGkuc2V0U3RhdHVzKHtcbiAgICAgICAgc3RhdHVzOiAncHJvZ3Jlc3MnLFxuICAgICAgICBwcm9ncmVzczogb3B0cy5vblByb2dyZXNzID8gMC4wIDogdW5kZWZpbmVkLFxuICAgICAgICBkZXRhaWw6ICcnLFxuICAgICAgfSlcblxuICAgICAgY29uc3QgY2FiYWxSb290ID0gYXdhaXQgVXRpbC5nZXRSb290RGlyKFxuICAgICAgICB0YXJnZXQuZGlyID8gdGFyZ2V0LmRpciA6IHRoaXMuZ2V0QWN0aXZlUHJvamVjdFBhdGgoKSxcbiAgICAgIClcblxuICAgICAgY29uc3QgW2NhYmFsRmlsZV06IEZpbGVbXSA9IGNhYmFsUm9vdC5nZXRFbnRyaWVzU3luYygpLmZpbHRlcihpc0NhYmFsRmlsZSlcblxuICAgICAgaWYgKCFjYWJhbEZpbGUpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdObyBjYWJhbCBmaWxlIGZvdW5kJylcbiAgICAgIH1cblxuICAgICAgbGV0IG5ld1RhcmdldDogVGFyZ2V0UGFyYW1UeXBlRm9yQnVpbGRlciB8IHVuZGVmaW5lZFxuXG4gICAgICBpZiAodGFyZ2V0LnR5cGUgPT09ICdhdXRvJykge1xuICAgICAgICBjb25zdCBjYWJhbENvbnRlbnRzID0gYXdhaXQgY2FiYWxGaWxlLnJlYWQoKVxuICAgICAgICBpZiAoY2FiYWxDb250ZW50cyA9PT0gbnVsbCkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgQ291bGQgbm90IHJlYWQgY2FiYWxmaWxlICR7Y2FiYWxGaWxlLmdldFBhdGgoKX1gKVxuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHRndHMgPSBhd2FpdCB0aGlzLmdldEFjdGl2ZVByb2plY3RUYXJnZXQoY2FiYWxDb250ZW50cywgY2FiYWxSb290KVxuICAgICAgICBjb25zdCBbdGd0XSA9IHRndHNcbiAgICAgICAgaWYgKHRndCkge1xuICAgICAgICAgIGNvbnN0IGNmID0gYXdhaXQgVXRpbC5wYXJzZURvdENhYmFsKGNhYmFsQ29udGVudHMpXG4gICAgICAgICAgaWYgKGNmKSB7XG4gICAgICAgICAgICBuZXdUYXJnZXQgPSB7XG4gICAgICAgICAgICAgIHByb2plY3Q6IGNmLm5hbWUsXG4gICAgICAgICAgICAgIGRpcjogY2FiYWxSb290LmdldFBhdGgoKSxcbiAgICAgICAgICAgICAgdHlwZTogJ2NvbXBvbmVudCcsXG4gICAgICAgICAgICAgIGNvbXBvbmVudDogdGd0LFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmICh0YXJnZXQudHlwZSA9PT0gJ2FsbCcpIHtcbiAgICAgICAgY29uc3QgY2FiYWxDb250ZW50cyA9IGF3YWl0IGNhYmFsRmlsZS5yZWFkKClcbiAgICAgICAgaWYgKGNhYmFsQ29udGVudHMgPT09IG51bGwpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYENvdWxkIG5vdCByZWFkIGNhYmFsZmlsZSAke2NhYmFsRmlsZS5nZXRQYXRoKCl9YClcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBjZiA9IGF3YWl0IFV0aWwucGFyc2VEb3RDYWJhbChjYWJhbENvbnRlbnRzKVxuICAgICAgICBpZiAoY2YpIHtcbiAgICAgICAgICBuZXdUYXJnZXQgPSBuZXdUYXJnZXQgPSB7XG4gICAgICAgICAgICBwcm9qZWN0OiBjZi5uYW1lLFxuICAgICAgICAgICAgZGlyOiBjYWJhbFJvb3QuZ2V0UGF0aCgpLFxuICAgICAgICAgICAgdHlwZTogJ2FsbCcsXG4gICAgICAgICAgICB0YXJnZXRzOiBjZi50YXJnZXRzLFxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmICh0YXJnZXQudHlwZSA9PT0gJ2NvbXBvbmVudCcpIHtcbiAgICAgICAgY29uc3QgeyBwcm9qZWN0LCBkaXIsIGNvbXBvbmVudCB9ID0gdGFyZ2V0XG4gICAgICAgIG5ld1RhcmdldCA9IHsgdHlwZTogJ2NvbXBvbmVudCcsIHByb2plY3QsIGRpciwgY29tcG9uZW50IH1cbiAgICAgIH1cbiAgICAgIGlmICghbmV3VGFyZ2V0KSB7XG4gICAgICAgIG5ld1RhcmdldCA9IHtcbiAgICAgICAgICB0eXBlOiAnYXV0bycsXG4gICAgICAgICAgcHJvamVjdDogdGFyZ2V0LnByb2plY3QsXG4gICAgICAgICAgZGlyOiB0YXJnZXQuZGlyLFxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBjb25zdCBidWlsZGVyczogVEJ1aWxkZXJzID0ge1xuICAgICAgICAnY2FiYWwtbml4JzogQnVpbGRlcnMuQ2FiYWxOaXgsXG4gICAgICAgIGNhYmFsOiBCdWlsZGVycy5DYWJhbCxcbiAgICAgICAgc3RhY2s6IEJ1aWxkZXJzLlN0YWNrLFxuICAgICAgICBub25lOiBCdWlsZGVycy5Ob25lLFxuICAgICAgfVxuICAgICAgY29uc3QgYnVpbGRlciA9IGJ1aWxkZXJzW2J1aWxkZXJQYXJhbS5uYW1lXVxuXG4gICAgICBpZiAoYnVpbGRlciA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICBgVW5rbm93biBidWlsZGVyICckeyhidWlsZGVyUGFyYW0gJiYgYnVpbGRlclBhcmFtLm5hbWUpIHx8XG4gICAgICAgICAgICBidWlsZGVyUGFyYW19J2AsXG4gICAgICAgIClcbiAgICAgIH1cblxuICAgICAgY29uc3QgcmVzID0gYXdhaXQgbmV3IGJ1aWxkZXIoe1xuICAgICAgICBvcHRzLFxuICAgICAgICB0YXJnZXQ6IG5ld1RhcmdldCxcbiAgICAgICAgY2FiYWxSb290LFxuICAgICAgfSkucnVuQ29tbWFuZChjbWQpXG4gICAgICAvLyBzZWUgQ2FiYWxQcm9jZXNzIGZvciBleHBsYWluYXRpb25cbiAgICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTogbm8tbnVsbC1rZXl3b3JkXG4gICAgICBpZiAocmVzLmV4aXRDb2RlID09PSBudWxsKSB7XG4gICAgICAgIC8vIHRoaXMgbWVhbnMgcHJvY2VzcyB3YXMga2lsbGVkXG4gICAgICAgIHRoaXMudXBpLnNldFN0YXR1cyh7XG4gICAgICAgICAgc3RhdHVzOiAnd2FybmluZycsXG4gICAgICAgICAgZGV0YWlsOiAnQnVpbGQgd2FzIGludGVycnVwdGVkJyxcbiAgICAgICAgfSlcbiAgICAgIH0gZWxzZSBpZiAocmVzLmV4aXRDb2RlICE9PSAwKSB7XG4gICAgICAgIGlmIChyZXMuaGFzRXJyb3IpIHtcbiAgICAgICAgICB0aGlzLnVwaS5zZXRTdGF0dXMoe1xuICAgICAgICAgICAgc3RhdHVzOiAnd2FybmluZycsXG4gICAgICAgICAgICBkZXRhaWw6ICdUaGVyZSB3ZXJlIGVycm9ycyBpbiBzb3VyY2UgZmlsZXMnLFxuICAgICAgICAgIH0pXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy51cGkuc2V0U3RhdHVzKHtcbiAgICAgICAgICAgIHN0YXR1czogJ2Vycm9yJyxcbiAgICAgICAgICAgIGRldGFpbDogYEJ1aWxkZXIgcXVpdCBhYm5vcm1hbGx5IHdpdGggZXhpdCBjb2RlICR7cmVzLmV4aXRDb2RlfWAsXG4gICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy51cGkuc2V0U3RhdHVzKHsgc3RhdHVzOiAncmVhZHknLCBkZXRhaWw6ICdCdWlsZCB3YXMgc3VjY2Vzc2Z1bCcgfSlcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgaWYgKGVycm9yKSB7XG4gICAgICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTogbm8tY29uc29sZVxuICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKVxuICAgICAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6IG5vLXVuc2FmZS1hbnlcbiAgICAgICAgdGhpcy51cGkuc2V0U3RhdHVzKHsgc3RhdHVzOiAnZXJyb3InLCBkZXRhaWw6IGVycm9yLnRvU3RyaW5nKCkgfSlcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMudXBpLnNldFN0YXR1cyh7XG4gICAgICAgICAgc3RhdHVzOiAnd2FybmluZycsXG4gICAgICAgICAgZGV0YWlsOiAnQnVpbGQgZmFpbGVkIHdpdGggbm8gZXJyb3JzJyxcbiAgICAgICAgfSlcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5ydW5uaW5nID0gZmFsc2VcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgcnVuQ2FiYWxDb21tYW5kKGNvbW1hbmQ6IENhYmFsQ29tbWFuZCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IHsgbWVzc2FnZVR5cGVzLCBkZWZhdWx0U2V2ZXJpdHksIGNhbkNhbmNlbCB9ID0gY29tbWFuZE9wdGlvbnNbY29tbWFuZF1cbiAgICBjb25zdCBtZXNzYWdlczogVVBJLklSZXN1bHRJdGVtW10gPSBbXVxuICAgIHRoaXMudXBpLnNldE1lc3NhZ2VzKG1lc3NhZ2VzKVxuXG4gICAgbGV0IGNhbmNlbEFjdGlvbkRpc3A6IERpc3Bvc2FibGUgfCB1bmRlZmluZWRcblxuICAgIGF3YWl0IHRoaXMuY2FiYWxCdWlsZChjb21tYW5kLCB7XG4gICAgICBzZXZlcml0eTogZGVmYXVsdFNldmVyaXR5LFxuICAgICAgc2V0Q2FuY2VsQWN0aW9uOiBjYW5DYW5jZWxcbiAgICAgICAgPyAoYWN0aW9uOiAoKSA9PiB2b2lkKSA9PiB7XG4gICAgICAgICAgICBjYW5jZWxBY3Rpb25EaXNwICYmIGNhbmNlbEFjdGlvbkRpc3AuZGlzcG9zZSgpXG4gICAgICAgICAgICBjYW5jZWxBY3Rpb25EaXNwID0gdGhpcy51cGkuYWRkUGFuZWxDb250cm9sKHtcbiAgICAgICAgICAgICAgZWxlbWVudDogJ2lkZS1oYXNrZWxsLWJ1dHRvbicsXG4gICAgICAgICAgICAgIG9wdHM6IHtcbiAgICAgICAgICAgICAgICBjbGFzc2VzOiBbJ2NhbmNlbCddLFxuICAgICAgICAgICAgICAgIGV2ZW50czoge1xuICAgICAgICAgICAgICAgICAgY2xpY2s6IGFjdGlvbixcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSlcbiAgICAgICAgICB9XG4gICAgICAgIDogdW5kZWZpbmVkLFxuICAgICAgb25Nc2c6IChtZXNzYWdlOiBVUEkuSVJlc3VsdEl0ZW0pID0+IHtcbiAgICAgICAgaWYgKG1lc3NhZ2VUeXBlcy5pbmNsdWRlcyhtZXNzYWdlLnNldmVyaXR5KSkge1xuICAgICAgICAgIG1lc3NhZ2VzLnB1c2gobWVzc2FnZSlcbiAgICAgICAgICB0aGlzLnVwaS5zZXRNZXNzYWdlcyhtZXNzYWdlcylcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIG9uUHJvZ3Jlc3M6IGNhbkNhbmNlbFxuICAgICAgICA/IChwcm9ncmVzczogbnVtYmVyKSA9PlxuICAgICAgICAgICAgdGhpcy51cGkuc2V0U3RhdHVzKHtcbiAgICAgICAgICAgICAgc3RhdHVzOiAncHJvZ3Jlc3MnLFxuICAgICAgICAgICAgICBwcm9ncmVzcyxcbiAgICAgICAgICAgICAgZGV0YWlsOiBgJHtjb21tYW5kfSBpbiBwcm9ncmVzc2AsXG4gICAgICAgICAgICB9KVxuICAgICAgICA6IHVuZGVmaW5lZCxcbiAgICB9KVxuICAgIGNhbmNlbEFjdGlvbkRpc3AgJiYgY2FuY2VsQWN0aW9uRGlzcC5kaXNwb3NlKClcbiAgfVxufVxuIl19