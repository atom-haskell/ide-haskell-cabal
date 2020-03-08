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
        this.commands = Object.assign(Object.assign({}, this.cabalCommands()), { 'ide-haskell-cabal:set-build-target': async () => {
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
                    { name: 'cabal-v1' },
                    { name: 'cabal-v2' },
                    { name: 'stack' },
                    { name: 'none' },
                ];
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
    async cabalBuild(cmd, params) {
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
            if (builderParam.name === 'cabal') {
                builderParam.name = 'cabal-v1';
                await this.upi.setConfigParam('builder', builderParam);
            }
            else if (builderParam.name === 'cabal-nix') {
                builderParam.name = 'cabal-v2';
                await this.upi.setConfigParam('builder', builderParam);
            }
            this.upi.setStatus({
                status: 'progress',
                progress: params.onProgress ? 0.0 : undefined,
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
                'cabal-v1': Builders.CabalV1,
                'cabal-v2': Builders.CabalV2,
                stack: Builders.Stack,
                none: Builders.None,
            };
            const builder = builders[builderParam.name];
            if (builder === undefined) {
                throw new Error(`Unknown builder '${(builderParam && builderParam.name) ||
                    builderParam}'`);
            }
            const res = await new builder({
                params,
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaWRlLWJhY2tlbmQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaWRlLWJhY2tlbmQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSw2QkFBNEI7QUFDNUIsK0JBQXVFO0FBQ3ZFLHVDQUFzQztBQUN0QywyQ0FBMEM7QUFZMUMsU0FBUyxXQUFXLENBQUMsSUFBdUI7SUFDMUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDLE1BQU0sRUFBRSxJQUFJLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQTtBQUMzRSxDQUFDO0FBaUJELE1BQU0sY0FBYyxHQUE2QztJQUMvRCxLQUFLLEVBQUU7UUFDTCxZQUFZLEVBQUUsQ0FBQyxPQUFPLEVBQUUsU0FBUyxFQUFFLE9BQU8sQ0FBQztRQUMzQyxlQUFlLEVBQUUsT0FBTztRQUN4QixTQUFTLEVBQUUsSUFBSTtLQUNoQjtJQUNELEtBQUssRUFBRTtRQUNMLFlBQVksRUFBRSxDQUFDLE9BQU8sQ0FBQztRQUN2QixlQUFlLEVBQUUsT0FBTztRQUN4QixTQUFTLEVBQUUsS0FBSztLQUNqQjtJQUNELElBQUksRUFBRTtRQUNKLFlBQVksRUFBRSxDQUFDLE9BQU8sRUFBRSxTQUFTLEVBQUUsT0FBTyxFQUFFLE1BQU0sQ0FBQztRQUNuRCxlQUFlLEVBQUUsTUFBTTtRQUN2QixTQUFTLEVBQUUsSUFBSTtLQUNoQjtJQUNELEtBQUssRUFBRTtRQUNMLFlBQVksRUFBRSxDQUFDLE9BQU8sRUFBRSxTQUFTLEVBQUUsT0FBTyxFQUFFLE1BQU0sQ0FBQztRQUNuRCxlQUFlLEVBQUUsTUFBTTtRQUN2QixTQUFTLEVBQUUsSUFBSTtLQUNoQjtJQUNELElBQUksRUFBRTtRQUNKLFlBQVksRUFBRSxDQUFDLE9BQU8sQ0FBQztRQUN2QixlQUFlLEVBQUUsT0FBTztRQUN4QixTQUFTLEVBQUUsSUFBSTtLQUNoQjtDQUNGLENBQUE7QUFF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LEVBQUUsU0FBUztnQkFDbkIsQ0FBQyxDQUFDLENBQUMsUUFBZ0IsRUFBRSxFQUFFLENBQ25CLElBQUksQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDO29CQUNqQixNQUFNLEVBQUUsVUFBVTtvQkFDbEIsUUFBUTtvQkFDUixNQUFNLEVBQUUsR0FBRyxPQUFPLGNBQWM7aUJBQ2pDLENBQUM7Z0JBQ04sQ0FBQyxDQUFDLFNBQVM7U0FDZCxDQUFDLENBQUE7UUFDRixnQkFBZ0IsSUFBSSxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsQ0FBQTtJQUNoRCxDQUFDO0NBQ0Y7QUFwWkQsZ0NBb1pDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJ1xuaW1wb3J0IHsgRmlsZSwgQ29tcG9zaXRlRGlzcG9zYWJsZSwgRGlzcG9zYWJsZSwgRGlyZWN0b3J5IH0gZnJvbSAnYXRvbSdcbmltcG9ydCAqIGFzIEJ1aWxkZXJzIGZyb20gJy4vYnVpbGRlcnMnXG5pbXBvcnQgKiBhcyBVdGlsIGZyb20gJ2F0b20taGFza2VsbC11dGlscydcbmltcG9ydCB7XG4gIFRhcmdldFBhcmFtVHlwZSxcbiAgQ2FiYWxDb21tYW5kLFxuICBUYXJnZXRQYXJhbVR5cGVGb3JCdWlsZGVyLFxufSBmcm9tICcuL2NvbW1vbidcbmltcG9ydCAqIGFzIFVQSSBmcm9tICdhdG9tLWhhc2tlbGwtdXBpJ1xuXG5pbnRlcmZhY2UgQnVpbGRlclBhcmFtVHlwZSB7XG4gIG5hbWU6ICdjYWJhbC12MScgfCAnY2FiYWwtdjInIHwgJ3N0YWNrJyB8ICdub25lJ1xufVxuXG5mdW5jdGlvbiBpc0NhYmFsRmlsZShmaWxlPzogRmlsZSB8IERpcmVjdG9yeSk6IGZpbGUgaXMgRmlsZSB7XG4gIHJldHVybiAhIShmaWxlICYmIGZpbGUuaXNGaWxlKCkgJiYgZmlsZS5nZXRCYXNlTmFtZSgpLmVuZHNXaXRoKCcuY2FiYWwnKSlcbn1cblxuaW50ZXJmYWNlIElDb21tYW5kT3B0aW9ucyB7XG4gIG1lc3NhZ2VUeXBlczogVVBJLlRTZXZlcml0eVtdXG4gIGRlZmF1bHRTZXZlcml0eTogVVBJLlRTZXZlcml0eVxuICBjYW5DYW5jZWw6IGJvb2xlYW5cbn1cblxuaW50ZXJmYWNlIEJ1aWxkZXJDb25zdHJ1Y3RvciB7XG4gIG5ldyAob3B0czogQnVpbGRlcnMuQ3Rvck9wdHMpOiBCdWlsZGVycy5CdWlsZGVyXG59XG5cbnR5cGUgVEJ1aWxkZXJzID0gUmVjb3JkPFxuICBCdWlsZGVyUGFyYW1UeXBlWyduYW1lJ10sXG4gIEJ1aWxkZXJDb25zdHJ1Y3RvciB8IHVuZGVmaW5lZFxuPlxuXG5jb25zdCBjb21tYW5kT3B0aW9uczogeyBbSyBpbiBDYWJhbENvbW1hbmRdOiBJQ29tbWFuZE9wdGlvbnMgfSA9IHtcbiAgYnVpbGQ6IHtcbiAgICBtZXNzYWdlVHlwZXM6IFsnZXJyb3InLCAnd2FybmluZycsICdidWlsZCddLFxuICAgIGRlZmF1bHRTZXZlcml0eTogJ2J1aWxkJyxcbiAgICBjYW5DYW5jZWw6IHRydWUsXG4gIH0sXG4gIGNsZWFuOiB7XG4gICAgbWVzc2FnZVR5cGVzOiBbJ2J1aWxkJ10sXG4gICAgZGVmYXVsdFNldmVyaXR5OiAnYnVpbGQnLFxuICAgIGNhbkNhbmNlbDogZmFsc2UsXG4gIH0sXG4gIHRlc3Q6IHtcbiAgICBtZXNzYWdlVHlwZXM6IFsnZXJyb3InLCAnd2FybmluZycsICdidWlsZCcsICd0ZXN0J10sXG4gICAgZGVmYXVsdFNldmVyaXR5OiAndGVzdCcsXG4gICAgY2FuQ2FuY2VsOiB0cnVlLFxuICB9LFxuICBiZW5jaDoge1xuICAgIG1lc3NhZ2VUeXBlczogWydlcnJvcicsICd3YXJuaW5nJywgJ2J1aWxkJywgJ3Rlc3QnXSxcbiAgICBkZWZhdWx0U2V2ZXJpdHk6ICd0ZXN0JyxcbiAgICBjYW5DYW5jZWw6IHRydWUsXG4gIH0sXG4gIGRlcHM6IHtcbiAgICBtZXNzYWdlVHlwZXM6IFsnYnVpbGQnXSxcbiAgICBkZWZhdWx0U2V2ZXJpdHk6ICdidWlsZCcsXG4gICAgY2FuQ2FuY2VsOiB0cnVlLFxuICB9LFxufVxuXG5leHBvcnQgY2xhc3MgSWRlQmFja2VuZCB7XG4gIHByaXZhdGUgZGlzcG9zYWJsZXM6IENvbXBvc2l0ZURpc3Bvc2FibGVcbiAgcHJpdmF0ZSB1cGk6IFVQSS5JVVBJSW5zdGFuY2VcbiAgcHJpdmF0ZSBydW5uaW5nOiBib29sZWFuID0gZmFsc2VcbiAgcHJpdmF0ZSBjb21tYW5kcyA9IHtcbiAgICAuLi50aGlzLmNhYmFsQ29tbWFuZHMoKSxcbiAgICAnaWRlLWhhc2tlbGwtY2FiYWw6c2V0LWJ1aWxkLXRhcmdldCc6IGFzeW5jICgpID0+IHtcbiAgICAgIGF3YWl0IHRoaXMudXBpLnNldENvbmZpZ1BhcmFtKCd0YXJnZXQnKVxuICAgIH0sXG4gICAgJ2lkZS1oYXNrZWxsLWNhYmFsOnNldC1hY3RpdmUtYnVpbGRlcic6IGFzeW5jICgpID0+IHtcbiAgICAgIGF3YWl0IHRoaXMudXBpLnNldENvbmZpZ1BhcmFtKCdidWlsZGVyJylcbiAgICB9LFxuICB9XG4gIHByaXZhdGUgbWVudSA9IFtcbiAgICB7IGxhYmVsOiAnQnVpbGQgUHJvamVjdCcsIGNvbW1hbmQ6ICdpZGUtaGFza2VsbC1jYWJhbDpidWlsZCcgfSxcbiAgICB7IGxhYmVsOiAnQ2xlYW4gUHJvamVjdCcsIGNvbW1hbmQ6ICdpZGUtaGFza2VsbC1jYWJhbDpjbGVhbicgfSxcbiAgICB7IGxhYmVsOiAnVGVzdCcsIGNvbW1hbmQ6ICdpZGUtaGFza2VsbC1jYWJhbDp0ZXN0JyB9LFxuICAgIHsgbGFiZWw6ICdCZW5jaCcsIGNvbW1hbmQ6ICdpZGUtaGFza2VsbC1jYWJhbDpiZW5jaCcgfSxcbiAgICB7IGxhYmVsOiAnQnVpbGQgRGVwZW5kZW5jaWVzJywgY29tbWFuZDogJ2lkZS1oYXNrZWxsLWNhYmFsOmRlcHMnIH0sXG4gICAge1xuICAgICAgbGFiZWw6ICdTZXQgQWN0aXZlIEJ1aWxkZXInLFxuICAgICAgY29tbWFuZDogJ2lkZS1oYXNrZWxsLWNhYmFsOnNldC1hY3RpdmUtYnVpbGRlcicsXG4gICAgfSxcbiAgICB7XG4gICAgICBsYWJlbDogJ1NldCBCdWlsZCBUYXJnZXQnLFxuICAgICAgY29tbWFuZDogJ2lkZS1oYXNrZWxsLWNhYmFsOnNldC1idWlsZC10YXJnZXQnLFxuICAgIH0sXG4gIF1cbiAgY29uc3RydWN0b3IocmVnOiBVUEkuSVVQSVJlZ2lzdHJhdGlvbikge1xuICAgIHRoaXMudXBpID0gcmVnKHtcbiAgICAgIG5hbWU6ICdpZGUtaGFza2VsbC1jYWJhbCcsXG4gICAgICBtZXNzYWdlVHlwZXM6IHtcbiAgICAgICAgZXJyb3I6IHt9LFxuICAgICAgICB3YXJuaW5nOiB7fSxcbiAgICAgICAgYnVpbGQ6IHtcbiAgICAgICAgICB1cmlGaWx0ZXI6IGZhbHNlLFxuICAgICAgICAgIGF1dG9TY3JvbGw6IHRydWUsXG4gICAgICAgIH0sXG4gICAgICAgIHRlc3Q6IHtcbiAgICAgICAgICB1cmlGaWx0ZXI6IGZhbHNlLFxuICAgICAgICAgIGF1dG9TY3JvbGw6IHRydWUsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgbWVudToge1xuICAgICAgICBsYWJlbDogJ0J1aWxkZXInLFxuICAgICAgICBtZW51OiB0aGlzLm1lbnUsXG4gICAgICB9LFxuICAgICAgcGFyYW1zOiB7XG4gICAgICAgIGJ1aWxkZXI6IHRoaXMuYnVpbGRlclBhcmFtSW5mbygpLFxuICAgICAgICB0YXJnZXQ6IHRoaXMudGFyZ2V0UGFyYW1JbmZvKCksXG4gICAgICB9LFxuICAgIH0pXG5cbiAgICB0aGlzLmRpc3Bvc2FibGVzID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKVxuXG4gICAgdGhpcy5kaXNwb3NhYmxlcy5hZGQoYXRvbS5jb21tYW5kcy5hZGQoJ2F0b20td29ya3NwYWNlJywgdGhpcy5jb21tYW5kcykpXG4gICAgdGhpcy5kaXNwb3NhYmxlcy5hZGQodGhpcy51cGkpXG4gIH1cblxuICBwdWJsaWMgZGVzdHJveSgpIHtcbiAgICB0aGlzLmRpc3Bvc2FibGVzLmRpc3Bvc2UoKVxuICB9XG5cbiAgcHJpdmF0ZSBjYWJhbENvbW1hbmRzKCkge1xuICAgIGNvbnN0IHJldCA9IHt9XG4gICAgZm9yIChjb25zdCBjbWQgb2YgT2JqZWN0LmtleXMoY29tbWFuZE9wdGlvbnMpKSB7XG4gICAgICByZXRbYGlkZS1oYXNrZWxsLWNhYmFsOiR7Y21kfWBdID0gYXN5bmMgKCkgPT4gdGhpcy5ydW5DYWJhbENvbW1hbmQoY21kKVxuICAgIH1cbiAgICByZXR1cm4gcmV0XG4gIH1cblxuICBwcml2YXRlIGJ1aWxkZXJQYXJhbUluZm8oKTogVVBJLklQYXJhbVNwZWM8QnVpbGRlclBhcmFtVHlwZT4ge1xuICAgIHJldHVybiB7XG4gICAgICBpdGVtczogKCk6IEJ1aWxkZXJQYXJhbVR5cGVbXSA9PiB7XG4gICAgICAgIGNvbnN0IGJ1aWxkZXJzOiBCdWlsZGVyUGFyYW1UeXBlW10gPSBbXG4gICAgICAgICAgeyBuYW1lOiAnY2FiYWwtdjEnIH0sXG4gICAgICAgICAgeyBuYW1lOiAnY2FiYWwtdjInIH0sXG4gICAgICAgICAgeyBuYW1lOiAnc3RhY2snIH0sXG4gICAgICAgICAgeyBuYW1lOiAnbm9uZScgfSxcbiAgICAgICAgXVxuICAgICAgICByZXR1cm4gYnVpbGRlcnNcbiAgICAgIH0sXG4gICAgICBpdGVtVGVtcGxhdGU6IChpdGVtOiBCdWlsZGVyUGFyYW1UeXBlKSA9PlxuICAgICAgICBgPGxpPjxkaXYgY2xhc3M9J25hbWUnPiR7aXRlbS5uYW1lfTwvZGl2PjwvbGk+YCxcbiAgICAgIGRpc3BsYXlUZW1wbGF0ZTogKGl0ZW0/OiBCdWlsZGVyUGFyYW1UeXBlKSA9PlxuICAgICAgICBpdGVtICYmIGl0ZW0ubmFtZSA/IGl0ZW0ubmFtZSA6ICdOb3Qgc2V0JyxcbiAgICAgIGl0ZW1GaWx0ZXJLZXk6ICduYW1lJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnU2VsZWN0IGJ1aWxkZXIgdG8gdXNlIHdpdGggY3VycmVudCBwcm9qZWN0JyxcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHRhcmdldFBhcmFtSW5mbygpOiBVUEkuSVBhcmFtU3BlYzxUYXJnZXRQYXJhbVR5cGU+IHtcbiAgICBjb25zdCBkZWZhdWx0VmFsOiBUYXJnZXRQYXJhbVR5cGUgPSB7XG4gICAgICBwcm9qZWN0OiAnQXV0bycsXG4gICAgICB0eXBlOiAnYXV0bycsXG4gICAgICBkaXI6IHVuZGVmaW5lZCxcbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgIGRlZmF1bHQ6IGRlZmF1bHRWYWwsXG4gICAgICBpdGVtczogYXN5bmMgKCk6IFByb21pc2U8VGFyZ2V0UGFyYW1UeXBlW10+ID0+IHtcbiAgICAgICAgY29uc3QgcHJvamVjdHM6IFRhcmdldFBhcmFtVHlwZVtdID0gW2RlZmF1bHRWYWxdXG4gICAgICAgIGZvciAoY29uc3QgZCBvZiBhdG9tLnByb2plY3QuZ2V0RGlyZWN0b3JpZXMoKSkge1xuICAgICAgICAgIGNvbnN0IGRpciA9IGQuZ2V0UGF0aCgpXG4gICAgICAgICAgY29uc3QgW2NhYmFsRmlsZV0gPSAoYXdhaXQgVXRpbC5nZXRSb290RGlyKGRpcikpXG4gICAgICAgICAgICAuZ2V0RW50cmllc1N5bmMoKVxuICAgICAgICAgICAgLmZpbHRlcihpc0NhYmFsRmlsZSlcbiAgICAgICAgICBpZiAoY2FiYWxGaWxlICYmIGNhYmFsRmlsZS5pc0ZpbGUoKSkge1xuICAgICAgICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IGNhYmFsRmlsZS5yZWFkKClcbiAgICAgICAgICAgIGlmIChkYXRhID09PSBudWxsKSB7XG4gICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgQ291bGQgbm90IHJlYWQgY2FiYWxmaWxlICR7Y2FiYWxGaWxlLmdldFBhdGgoKX1gKVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgcHJvamVjdCA9IGF3YWl0IFV0aWwucGFyc2VEb3RDYWJhbChkYXRhKVxuICAgICAgICAgICAgaWYgKHByb2plY3QpIHtcbiAgICAgICAgICAgICAgcHJvamVjdHMucHVzaCh7IHByb2plY3Q6IHByb2plY3QubmFtZSwgZGlyLCB0eXBlOiAnYXV0bycgfSlcbiAgICAgICAgICAgICAgcHJvamVjdHMucHVzaCh7IHByb2plY3Q6IHByb2plY3QubmFtZSwgZGlyLCB0eXBlOiAnYWxsJyB9KVxuICAgICAgICAgICAgICBmb3IgKGNvbnN0IHRhcmdldCBvZiBwcm9qZWN0LnRhcmdldHMpIHtcbiAgICAgICAgICAgICAgICBwcm9qZWN0cy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgIHByb2plY3Q6IHByb2plY3QubmFtZSxcbiAgICAgICAgICAgICAgICAgIGRpcixcbiAgICAgICAgICAgICAgICAgIHR5cGU6ICdjb21wb25lbnQnLFxuICAgICAgICAgICAgICAgICAgdGFyZ2V0LFxuICAgICAgICAgICAgICAgICAgY29tcG9uZW50OiB0YXJnZXQudGFyZ2V0LFxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHByb2plY3RzXG4gICAgICB9LFxuICAgICAgaXRlbVRlbXBsYXRlOiAodGd0OiBUYXJnZXRQYXJhbVR5cGUpID0+IHtcbiAgICAgICAgbGV0IGRlc2M6IHN0cmluZ1xuICAgICAgICBzd2l0Y2ggKHRndC50eXBlKSB7XG4gICAgICAgICAgY2FzZSAnYXV0byc6XG4gICAgICAgICAgICBkZXNjID0gYDxkaXYgY2xhc3M9J25hbWUnPkF1dG88L2Rpdj5gXG4gICAgICAgICAgICBicmVha1xuICAgICAgICAgIGNhc2UgJ2FsbCc6XG4gICAgICAgICAgICBkZXNjID0gYDxkaXYgY2xhc3M9J25hbWUnPkFsbDwvZGl2PmBcbiAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgY2FzZSAnY29tcG9uZW50JzpcbiAgICAgICAgICAgIGRlc2MgPSBgXG4gICAgICAgICAgICA8ZGl2IGNsYXNzPSd0eXBlJz4ke3RndC50YXJnZXQudHlwZX08L2Rpdj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3M9J25hbWUnPiR7dGd0LnRhcmdldC5uYW1lfTwvZGl2PlxuICAgICAgICAgICAgYFxuICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgfVxuICAgICAgICAvLyB0c2xpbnQ6ZGlzYWJsZTpuby1ub24tbnVsbC1hc3NlcnRpb25cbiAgICAgICAgcmV0dXJuIGA8bGk+XG4gICAgICAgICAgPGRpdiBjbGFzcz0ncHJvamVjdCc+JHt0Z3QucHJvamVjdH08L2Rpdj5cbiAgICAgICAgICA8ZGl2IGNsYXNzPSdkaXInPiR7dGd0LmRpciB8fCAnJ308L2Rpdj5cbiAgICAgICAgICAke2Rlc2MhfVxuICAgICAgICAgIDxkaXYgY2xhc3M9J2NsZWFyZml4Jz48L2Rpdj5cbiAgICAgICAgPC9saT5gXG4gICAgICAgIC8vIHRzbGludDplbmFibGU6bm8tbm9uLW51bGwtYXNzZXJ0aW9uXG4gICAgICB9LFxuICAgICAgZGlzcGxheVRlbXBsYXRlOiAoaXRlbT86IFRhcmdldFBhcmFtVHlwZSkgPT4ge1xuICAgICAgICBpZiAoIWl0ZW0pIHJldHVybiAndW5kZWZpbmVkJ1xuICAgICAgICBpZiAoIWl0ZW0uZGlyKSB7XG4gICAgICAgICAgcmV0dXJuIGl0ZW0ucHJvamVjdFxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGxldCB0YXJnZXQ6IHN0cmluZ1xuICAgICAgICAgIHN3aXRjaCAoaXRlbS50eXBlKSB7XG4gICAgICAgICAgICBjYXNlICdhdXRvJzpcbiAgICAgICAgICAgICAgdGFyZ2V0ID0gJ0F1dG8nXG4gICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICBjYXNlICdhbGwnOlxuICAgICAgICAgICAgICB0YXJnZXQgPSAnQWxsJ1xuICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgY2FzZSAnY29tcG9uZW50JzpcbiAgICAgICAgICAgICAgdGFyZ2V0ID0gaXRlbS50YXJnZXQubmFtZVxuICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgIH1cbiAgICAgICAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6bm8tbm9uLW51bGwtYXNzZXJ0aW9uXG4gICAgICAgICAgcmV0dXJuIGAke2l0ZW0ucHJvamVjdH06ICR7dGFyZ2V0IX1gXG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBpdGVtRmlsdGVyS2V5OiAnbmFtZScsXG4gICAgICBkZXNjcmlwdGlvbjogJ1NlbGVjdCB0YXJnZXQgdG8gYnVpbGQnLFxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgZ2V0QWN0aXZlUHJvamVjdFBhdGgoKTogc3RyaW5nIHtcbiAgICBjb25zdCBlZGl0b3IgPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKClcbiAgICBpZiAoZWRpdG9yKSB7XG4gICAgICBjb25zdCBlZHBhdGggPSBlZGl0b3IuZ2V0UGF0aCgpXG4gICAgICBpZiAoZWRwYXRoKSB7XG4gICAgICAgIHJldHVybiBwYXRoLmRpcm5hbWUoZWRwYXRoKVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gYXRvbS5wcm9qZWN0LmdldFBhdGhzKClbMF0gfHwgcHJvY2Vzcy5jd2QoKVxuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBnZXRBY3RpdmVQcm9qZWN0VGFyZ2V0KFxuICAgIGNhYmFsZmlsZTogc3RyaW5nLFxuICAgIGNhYmFsUm9vdDogRGlyZWN0b3J5LFxuICApOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgY29uc3QgZWRpdG9yID0gYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpXG4gICAgaWYgKGVkaXRvcikge1xuICAgICAgY29uc3QgZWRwYXRoID0gZWRpdG9yLmdldFBhdGgoKVxuICAgICAgaWYgKGVkcGF0aCkge1xuICAgICAgICBjb25zdCByZXMgPSBhd2FpdCBVdGlsLmdldENvbXBvbmVudEZyb21GaWxlKFxuICAgICAgICAgIGNhYmFsZmlsZSxcbiAgICAgICAgICBjYWJhbFJvb3QucmVsYXRpdml6ZShlZHBhdGgpLFxuICAgICAgICApXG4gICAgICAgIGlmIChyZXMpIHJldHVybiByZXNcbiAgICAgICAgZWxzZSByZXR1cm4gW11cbiAgICAgIH1cbiAgICB9XG4gICAgLy8gZGVmYXVsdFxuICAgIHJldHVybiBbXVxuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBjYWJhbEJ1aWxkKFxuICAgIGNtZDogQ2FiYWxDb21tYW5kLFxuICAgIHBhcmFtczogQnVpbGRlcnMuSVBhcmFtcyxcbiAgKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdHJ5IHtcbiAgICAgIGlmICh0aGlzLnJ1bm5pbmcpIHtcbiAgICAgICAgdGhpcy51cGkuc2V0U3RhdHVzKHtcbiAgICAgICAgICBzdGF0dXM6ICd3YXJuaW5nJyxcbiAgICAgICAgICBkZXRhaWw6ICdCdWlsZGVyIGFscmVhZHkgcnVubmluZycsXG4gICAgICAgIH0pXG4gICAgICAgIHJldHVyblxuICAgICAgfVxuICAgICAgdGhpcy5ydW5uaW5nID0gdHJ1ZVxuXG4gICAgICBjb25zdCBidWlsZGVyUGFyYW0gPSBhd2FpdCB0aGlzLnVwaS5nZXRDb25maWdQYXJhbTxCdWlsZGVyUGFyYW1UeXBlPihcbiAgICAgICAgJ2J1aWxkZXInLFxuICAgICAgKVxuICAgICAgY29uc3QgdGFyZ2V0ID0gYXdhaXQgdGhpcy51cGkuZ2V0Q29uZmlnUGFyYW08VGFyZ2V0UGFyYW1UeXBlPigndGFyZ2V0JylcblxuICAgICAgaWYgKHRhcmdldCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignVGFyZ2V0IHVuZGVmaW5lZCcpXG4gICAgICB9XG4gICAgICBpZiAoYnVpbGRlclBhcmFtID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdCdWlsZGVyIHVuZGVmaW5lZCcpXG4gICAgICB9XG4gICAgICBpZiAoKGJ1aWxkZXJQYXJhbS5uYW1lIGFzIHN0cmluZykgPT09ICdjYWJhbCcpIHtcbiAgICAgICAgYnVpbGRlclBhcmFtLm5hbWUgPSAnY2FiYWwtdjEnXG4gICAgICAgIGF3YWl0IHRoaXMudXBpLnNldENvbmZpZ1BhcmFtPEJ1aWxkZXJQYXJhbVR5cGU+KCdidWlsZGVyJywgYnVpbGRlclBhcmFtKVxuICAgICAgfSBlbHNlIGlmICgoYnVpbGRlclBhcmFtLm5hbWUgYXMgc3RyaW5nKSA9PT0gJ2NhYmFsLW5peCcpIHtcbiAgICAgICAgYnVpbGRlclBhcmFtLm5hbWUgPSAnY2FiYWwtdjInXG4gICAgICAgIGF3YWl0IHRoaXMudXBpLnNldENvbmZpZ1BhcmFtPEJ1aWxkZXJQYXJhbVR5cGU+KCdidWlsZGVyJywgYnVpbGRlclBhcmFtKVxuICAgICAgfVxuXG4gICAgICB0aGlzLnVwaS5zZXRTdGF0dXMoe1xuICAgICAgICBzdGF0dXM6ICdwcm9ncmVzcycsXG4gICAgICAgIHByb2dyZXNzOiBwYXJhbXMub25Qcm9ncmVzcyA/IDAuMCA6IHVuZGVmaW5lZCxcbiAgICAgICAgZGV0YWlsOiAnJyxcbiAgICAgIH0pXG5cbiAgICAgIGNvbnN0IGNhYmFsUm9vdCA9IGF3YWl0IFV0aWwuZ2V0Um9vdERpcihcbiAgICAgICAgdGFyZ2V0LmRpciA/IHRhcmdldC5kaXIgOiB0aGlzLmdldEFjdGl2ZVByb2plY3RQYXRoKCksXG4gICAgICApXG5cbiAgICAgIGNvbnN0IFtjYWJhbEZpbGVdOiBGaWxlW10gPSBjYWJhbFJvb3QuZ2V0RW50cmllc1N5bmMoKS5maWx0ZXIoaXNDYWJhbEZpbGUpXG5cbiAgICAgIGlmICghY2FiYWxGaWxlKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignTm8gY2FiYWwgZmlsZSBmb3VuZCcpXG4gICAgICB9XG5cbiAgICAgIGxldCBuZXdUYXJnZXQ6IFRhcmdldFBhcmFtVHlwZUZvckJ1aWxkZXIgfCB1bmRlZmluZWRcblxuICAgICAgaWYgKHRhcmdldC50eXBlID09PSAnYXV0bycpIHtcbiAgICAgICAgY29uc3QgY2FiYWxDb250ZW50cyA9IGF3YWl0IGNhYmFsRmlsZS5yZWFkKClcbiAgICAgICAgaWYgKGNhYmFsQ29udGVudHMgPT09IG51bGwpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYENvdWxkIG5vdCByZWFkIGNhYmFsZmlsZSAke2NhYmFsRmlsZS5nZXRQYXRoKCl9YClcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB0Z3RzID0gYXdhaXQgdGhpcy5nZXRBY3RpdmVQcm9qZWN0VGFyZ2V0KGNhYmFsQ29udGVudHMsIGNhYmFsUm9vdClcbiAgICAgICAgY29uc3QgW3RndF0gPSB0Z3RzXG4gICAgICAgIGlmICh0Z3QpIHtcbiAgICAgICAgICBjb25zdCBjZiA9IGF3YWl0IFV0aWwucGFyc2VEb3RDYWJhbChjYWJhbENvbnRlbnRzKVxuICAgICAgICAgIGlmIChjZikge1xuICAgICAgICAgICAgbmV3VGFyZ2V0ID0ge1xuICAgICAgICAgICAgICBwcm9qZWN0OiBjZi5uYW1lLFxuICAgICAgICAgICAgICBkaXI6IGNhYmFsUm9vdC5nZXRQYXRoKCksXG4gICAgICAgICAgICAgIHR5cGU6ICdjb21wb25lbnQnLFxuICAgICAgICAgICAgICBjb21wb25lbnQ6IHRndCxcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAodGFyZ2V0LnR5cGUgPT09ICdhbGwnKSB7XG4gICAgICAgIGNvbnN0IGNhYmFsQ29udGVudHMgPSBhd2FpdCBjYWJhbEZpbGUucmVhZCgpXG4gICAgICAgIGlmIChjYWJhbENvbnRlbnRzID09PSBudWxsKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBDb3VsZCBub3QgcmVhZCBjYWJhbGZpbGUgJHtjYWJhbEZpbGUuZ2V0UGF0aCgpfWApXG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgY2YgPSBhd2FpdCBVdGlsLnBhcnNlRG90Q2FiYWwoY2FiYWxDb250ZW50cylcbiAgICAgICAgaWYgKGNmKSB7XG4gICAgICAgICAgbmV3VGFyZ2V0ID0gbmV3VGFyZ2V0ID0ge1xuICAgICAgICAgICAgcHJvamVjdDogY2YubmFtZSxcbiAgICAgICAgICAgIGRpcjogY2FiYWxSb290LmdldFBhdGgoKSxcbiAgICAgICAgICAgIHR5cGU6ICdhbGwnLFxuICAgICAgICAgICAgdGFyZ2V0czogY2YudGFyZ2V0cyxcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAodGFyZ2V0LnR5cGUgPT09ICdjb21wb25lbnQnKSB7XG4gICAgICAgIGNvbnN0IHsgcHJvamVjdCwgZGlyLCBjb21wb25lbnQgfSA9IHRhcmdldFxuICAgICAgICBuZXdUYXJnZXQgPSB7IHR5cGU6ICdjb21wb25lbnQnLCBwcm9qZWN0LCBkaXIsIGNvbXBvbmVudCB9XG4gICAgICB9XG4gICAgICBpZiAoIW5ld1RhcmdldCkge1xuICAgICAgICBuZXdUYXJnZXQgPSB7XG4gICAgICAgICAgdHlwZTogJ2F1dG8nLFxuICAgICAgICAgIHByb2plY3Q6IHRhcmdldC5wcm9qZWN0LFxuICAgICAgICAgIGRpcjogdGFyZ2V0LmRpcixcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgY29uc3QgYnVpbGRlcnM6IFRCdWlsZGVycyA9IHtcbiAgICAgICAgJ2NhYmFsLXYxJzogQnVpbGRlcnMuQ2FiYWxWMSxcbiAgICAgICAgJ2NhYmFsLXYyJzogQnVpbGRlcnMuQ2FiYWxWMixcbiAgICAgICAgc3RhY2s6IEJ1aWxkZXJzLlN0YWNrLFxuICAgICAgICBub25lOiBCdWlsZGVycy5Ob25lLFxuICAgICAgfVxuICAgICAgY29uc3QgYnVpbGRlciA9IGJ1aWxkZXJzW2J1aWxkZXJQYXJhbS5uYW1lXVxuXG4gICAgICBpZiAoYnVpbGRlciA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICBgVW5rbm93biBidWlsZGVyICckeyhidWlsZGVyUGFyYW0gJiYgYnVpbGRlclBhcmFtLm5hbWUpIHx8XG4gICAgICAgICAgICBidWlsZGVyUGFyYW19J2AsXG4gICAgICAgIClcbiAgICAgIH1cblxuICAgICAgY29uc3QgcmVzID0gYXdhaXQgbmV3IGJ1aWxkZXIoe1xuICAgICAgICBwYXJhbXMsXG4gICAgICAgIHRhcmdldDogbmV3VGFyZ2V0LFxuICAgICAgICBjYWJhbFJvb3QsXG4gICAgICB9KS5ydW5Db21tYW5kKGNtZClcbiAgICAgIC8vIHNlZSBDYWJhbFByb2Nlc3MgZm9yIGV4cGxhaW5hdGlvblxuICAgICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOiBuby1udWxsLWtleXdvcmRcbiAgICAgIGlmIChyZXMuZXhpdENvZGUgPT09IG51bGwpIHtcbiAgICAgICAgLy8gdGhpcyBtZWFucyBwcm9jZXNzIHdhcyBraWxsZWRcbiAgICAgICAgdGhpcy51cGkuc2V0U3RhdHVzKHtcbiAgICAgICAgICBzdGF0dXM6ICd3YXJuaW5nJyxcbiAgICAgICAgICBkZXRhaWw6ICdCdWlsZCB3YXMgaW50ZXJydXB0ZWQnLFxuICAgICAgICB9KVxuICAgICAgfSBlbHNlIGlmIChyZXMuZXhpdENvZGUgIT09IDApIHtcbiAgICAgICAgaWYgKHJlcy5oYXNFcnJvcikge1xuICAgICAgICAgIHRoaXMudXBpLnNldFN0YXR1cyh7XG4gICAgICAgICAgICBzdGF0dXM6ICd3YXJuaW5nJyxcbiAgICAgICAgICAgIGRldGFpbDogJ1RoZXJlIHdlcmUgZXJyb3JzIGluIHNvdXJjZSBmaWxlcycsXG4gICAgICAgICAgfSlcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLnVwaS5zZXRTdGF0dXMoe1xuICAgICAgICAgICAgc3RhdHVzOiAnZXJyb3InLFxuICAgICAgICAgICAgZGV0YWlsOiBgQnVpbGRlciBxdWl0IGFibm9ybWFsbHkgd2l0aCBleGl0IGNvZGUgJHtyZXMuZXhpdENvZGV9YCxcbiAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnVwaS5zZXRTdGF0dXMoeyBzdGF0dXM6ICdyZWFkeScsIGRldGFpbDogJ0J1aWxkIHdhcyBzdWNjZXNzZnVsJyB9KVxuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBpZiAoZXJyb3IpIHtcbiAgICAgICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOiBuby1jb25zb2xlXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpXG4gICAgICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTogbm8tdW5zYWZlLWFueVxuICAgICAgICB0aGlzLnVwaS5zZXRTdGF0dXMoeyBzdGF0dXM6ICdlcnJvcicsIGRldGFpbDogZXJyb3IudG9TdHJpbmcoKSB9KVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy51cGkuc2V0U3RhdHVzKHtcbiAgICAgICAgICBzdGF0dXM6ICd3YXJuaW5nJyxcbiAgICAgICAgICBkZXRhaWw6ICdCdWlsZCBmYWlsZWQgd2l0aCBubyBlcnJvcnMnLFxuICAgICAgICB9KVxuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLnJ1bm5pbmcgPSBmYWxzZVxuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBydW5DYWJhbENvbW1hbmQoY29tbWFuZDogQ2FiYWxDb21tYW5kKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgeyBtZXNzYWdlVHlwZXMsIGRlZmF1bHRTZXZlcml0eSwgY2FuQ2FuY2VsIH0gPSBjb21tYW5kT3B0aW9uc1tjb21tYW5kXVxuICAgIGNvbnN0IG1lc3NhZ2VzOiBVUEkuSVJlc3VsdEl0ZW1bXSA9IFtdXG4gICAgdGhpcy51cGkuc2V0TWVzc2FnZXMobWVzc2FnZXMpXG5cbiAgICBsZXQgY2FuY2VsQWN0aW9uRGlzcDogRGlzcG9zYWJsZSB8IHVuZGVmaW5lZFxuXG4gICAgYXdhaXQgdGhpcy5jYWJhbEJ1aWxkKGNvbW1hbmQsIHtcbiAgICAgIHNldmVyaXR5OiBkZWZhdWx0U2V2ZXJpdHksXG4gICAgICBzZXRDYW5jZWxBY3Rpb246IGNhbkNhbmNlbFxuICAgICAgICA/IChhY3Rpb246ICgpID0+IHZvaWQpID0+IHtcbiAgICAgICAgICAgIGNhbmNlbEFjdGlvbkRpc3AgJiYgY2FuY2VsQWN0aW9uRGlzcC5kaXNwb3NlKClcbiAgICAgICAgICAgIGNhbmNlbEFjdGlvbkRpc3AgPSB0aGlzLnVwaS5hZGRQYW5lbENvbnRyb2woe1xuICAgICAgICAgICAgICBlbGVtZW50OiAnaWRlLWhhc2tlbGwtYnV0dG9uJyxcbiAgICAgICAgICAgICAgb3B0czoge1xuICAgICAgICAgICAgICAgIGNsYXNzZXM6IFsnY2FuY2VsJ10sXG4gICAgICAgICAgICAgICAgZXZlbnRzOiB7XG4gICAgICAgICAgICAgICAgICBjbGljazogYWN0aW9uLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9KVxuICAgICAgICAgIH1cbiAgICAgICAgOiB1bmRlZmluZWQsXG4gICAgICBvbk1zZzogKG1lc3NhZ2U6IFVQSS5JUmVzdWx0SXRlbSkgPT4ge1xuICAgICAgICBpZiAobWVzc2FnZVR5cGVzLmluY2x1ZGVzKG1lc3NhZ2Uuc2V2ZXJpdHkpKSB7XG4gICAgICAgICAgbWVzc2FnZXMucHVzaChtZXNzYWdlKVxuICAgICAgICAgIHRoaXMudXBpLnNldE1lc3NhZ2VzKG1lc3NhZ2VzKVxuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgb25Qcm9ncmVzczogY2FuQ2FuY2VsXG4gICAgICAgID8gKHByb2dyZXNzOiBudW1iZXIpID0+XG4gICAgICAgICAgICB0aGlzLnVwaS5zZXRTdGF0dXMoe1xuICAgICAgICAgICAgICBzdGF0dXM6ICdwcm9ncmVzcycsXG4gICAgICAgICAgICAgIHByb2dyZXNzLFxuICAgICAgICAgICAgICBkZXRhaWw6IGAke2NvbW1hbmR9IGluIHByb2dyZXNzYCxcbiAgICAgICAgICAgIH0pXG4gICAgICAgIDogdW5kZWZpbmVkLFxuICAgIH0pXG4gICAgY2FuY2VsQWN0aW9uRGlzcCAmJiBjYW5jZWxBY3Rpb25EaXNwLmRpc3Bvc2UoKVxuICB9XG59XG4iXX0=