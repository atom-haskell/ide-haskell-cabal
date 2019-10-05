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
                this.upi.setConfigParam('builder', builderParam);
            }
            else if (builderParam.name === 'cabal-nix') {
                builderParam.name = 'cabal-v2';
                this.upi.setConfigParam('builder', builderParam);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaWRlLWJhY2tlbmQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaWRlLWJhY2tlbmQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSw2QkFBNEI7QUFDNUIsK0JBQXVFO0FBQ3ZFLHVDQUFzQztBQUN0QywyQ0FBMEM7QUFZMUMsU0FBUyxXQUFXLENBQUMsSUFBdUI7SUFDMUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDLE1BQU0sRUFBRSxJQUFJLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQTtBQUMzRSxDQUFDO0FBaUJELE1BQU0sY0FBYyxHQUE2QztJQUMvRCxLQUFLLEVBQUU7UUFDTCxZQUFZLEVBQUUsQ0FBQyxPQUFPLEVBQUUsU0FBUyxFQUFFLE9BQU8sQ0FBQztRQUMzQyxlQUFlLEVBQUUsT0FBTztRQUN4QixTQUFTLEVBQUUsSUFBSTtLQUNoQjtJQUNELEtBQUssRUFBRTtRQUNMLFlBQVksRUFBRSxDQUFDLE9BQU8sQ0FBQztRQUN2QixlQUFlLEVBQUUsT0FBTztRQUN4QixTQUFTLEVBQUUsS0FBSztLQUNqQjtJQUNELElBQUksRUFBRTtRQUNKLFlBQVksRUFBRSxDQUFDLE9BQU8sRUFBRSxTQUFTLEVBQUUsT0FBTyxFQUFFLE1BQU0sQ0FBQztRQUNuRCxlQUFlLEVBQUUsTUFBTTtRQUN2QixTQUFTLEVBQUUsSUFBSTtLQUNoQjtJQUNELEtBQUssRUFBRTtRQUNMLFlBQVksRUFBRSxDQUFDLE9BQU8sRUFBRSxTQUFTLEVBQUUsT0FBTyxFQUFFLE1BQU0sQ0FBQztRQUNuRCxlQUFlLEVBQUUsTUFBTTtRQUN2QixTQUFTLEVBQUUsSUFBSTtLQUNoQjtJQUNELElBQUksRUFBRTtRQUNKLFlBQVksRUFBRSxDQUFDLE9BQU8sQ0FBQztRQUN2QixlQUFlLEVBQUUsT0FBTztRQUN4QixTQUFTLEVBQUUsSUFBSTtLQUNoQjtDQUNGLENBQUE7QUFF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O2dCQUNuQixDQUFDLENBQUMsQ0FBQyxRQUFnQixFQUFFLEVBQUUsQ0FDbkIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUM7b0JBQ2pCLE1BQU0sRUFBRSxVQUFVO29CQUNsQixRQUFRO29CQUNSLE1BQU0sRUFBRSxHQUFHLE9BQU8sY0FBYztpQkFDakMsQ0FBQztnQkFDTixDQUFDLENBQUMsU0FBUztTQUNkLENBQUMsQ0FBQTtRQUNGLGdCQUFnQixJQUFJLGdCQUFnQixDQUFDLE9BQU8sRUFBRSxDQUFBO0lBQ2hELENBQUM7Q0FDRjtBQXBaRCxnQ0FvWkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnXG5pbXBvcnQgeyBGaWxlLCBDb21wb3NpdGVEaXNwb3NhYmxlLCBEaXNwb3NhYmxlLCBEaXJlY3RvcnkgfSBmcm9tICdhdG9tJ1xuaW1wb3J0ICogYXMgQnVpbGRlcnMgZnJvbSAnLi9idWlsZGVycydcbmltcG9ydCAqIGFzIFV0aWwgZnJvbSAnYXRvbS1oYXNrZWxsLXV0aWxzJ1xuaW1wb3J0IHtcbiAgVGFyZ2V0UGFyYW1UeXBlLFxuICBDYWJhbENvbW1hbmQsXG4gIFRhcmdldFBhcmFtVHlwZUZvckJ1aWxkZXIsXG59IGZyb20gJy4vY29tbW9uJ1xuaW1wb3J0ICogYXMgVVBJIGZyb20gJ2F0b20taGFza2VsbC11cGknXG5cbmludGVyZmFjZSBCdWlsZGVyUGFyYW1UeXBlIHtcbiAgbmFtZTogJ2NhYmFsLXYxJyB8ICdjYWJhbC12MicgfCAnc3RhY2snIHwgJ25vbmUnXG59XG5cbmZ1bmN0aW9uIGlzQ2FiYWxGaWxlKGZpbGU/OiBGaWxlIHwgRGlyZWN0b3J5KTogZmlsZSBpcyBGaWxlIHtcbiAgcmV0dXJuICEhKGZpbGUgJiYgZmlsZS5pc0ZpbGUoKSAmJiBmaWxlLmdldEJhc2VOYW1lKCkuZW5kc1dpdGgoJy5jYWJhbCcpKVxufVxuXG5pbnRlcmZhY2UgSUNvbW1hbmRPcHRpb25zIHtcbiAgbWVzc2FnZVR5cGVzOiBVUEkuVFNldmVyaXR5W11cbiAgZGVmYXVsdFNldmVyaXR5OiBVUEkuVFNldmVyaXR5XG4gIGNhbkNhbmNlbDogYm9vbGVhblxufVxuXG5pbnRlcmZhY2UgQnVpbGRlckNvbnN0cnVjdG9yIHtcbiAgbmV3IChvcHRzOiBCdWlsZGVycy5DdG9yT3B0cyk6IEJ1aWxkZXJzLkJ1aWxkZXJcbn1cblxudHlwZSBUQnVpbGRlcnMgPSBSZWNvcmQ8XG4gIEJ1aWxkZXJQYXJhbVR5cGVbJ25hbWUnXSxcbiAgQnVpbGRlckNvbnN0cnVjdG9yIHwgdW5kZWZpbmVkXG4+XG5cbmNvbnN0IGNvbW1hbmRPcHRpb25zOiB7IFtLIGluIENhYmFsQ29tbWFuZF06IElDb21tYW5kT3B0aW9ucyB9ID0ge1xuICBidWlsZDoge1xuICAgIG1lc3NhZ2VUeXBlczogWydlcnJvcicsICd3YXJuaW5nJywgJ2J1aWxkJ10sXG4gICAgZGVmYXVsdFNldmVyaXR5OiAnYnVpbGQnLFxuICAgIGNhbkNhbmNlbDogdHJ1ZSxcbiAgfSxcbiAgY2xlYW46IHtcbiAgICBtZXNzYWdlVHlwZXM6IFsnYnVpbGQnXSxcbiAgICBkZWZhdWx0U2V2ZXJpdHk6ICdidWlsZCcsXG4gICAgY2FuQ2FuY2VsOiBmYWxzZSxcbiAgfSxcbiAgdGVzdDoge1xuICAgIG1lc3NhZ2VUeXBlczogWydlcnJvcicsICd3YXJuaW5nJywgJ2J1aWxkJywgJ3Rlc3QnXSxcbiAgICBkZWZhdWx0U2V2ZXJpdHk6ICd0ZXN0JyxcbiAgICBjYW5DYW5jZWw6IHRydWUsXG4gIH0sXG4gIGJlbmNoOiB7XG4gICAgbWVzc2FnZVR5cGVzOiBbJ2Vycm9yJywgJ3dhcm5pbmcnLCAnYnVpbGQnLCAndGVzdCddLFxuICAgIGRlZmF1bHRTZXZlcml0eTogJ3Rlc3QnLFxuICAgIGNhbkNhbmNlbDogdHJ1ZSxcbiAgfSxcbiAgZGVwczoge1xuICAgIG1lc3NhZ2VUeXBlczogWydidWlsZCddLFxuICAgIGRlZmF1bHRTZXZlcml0eTogJ2J1aWxkJyxcbiAgICBjYW5DYW5jZWw6IHRydWUsXG4gIH0sXG59XG5cbmV4cG9ydCBjbGFzcyBJZGVCYWNrZW5kIHtcbiAgcHJpdmF0ZSBkaXNwb3NhYmxlczogQ29tcG9zaXRlRGlzcG9zYWJsZVxuICBwcml2YXRlIHVwaTogVVBJLklVUElJbnN0YW5jZVxuICBwcml2YXRlIHJ1bm5pbmc6IGJvb2xlYW4gPSBmYWxzZVxuICBwcml2YXRlIGNvbW1hbmRzID0ge1xuICAgIC4uLnRoaXMuY2FiYWxDb21tYW5kcygpLFxuICAgICdpZGUtaGFza2VsbC1jYWJhbDpzZXQtYnVpbGQtdGFyZ2V0JzogYXN5bmMgKCkgPT4ge1xuICAgICAgYXdhaXQgdGhpcy51cGkuc2V0Q29uZmlnUGFyYW0oJ3RhcmdldCcpXG4gICAgfSxcbiAgICAnaWRlLWhhc2tlbGwtY2FiYWw6c2V0LWFjdGl2ZS1idWlsZGVyJzogYXN5bmMgKCkgPT4ge1xuICAgICAgYXdhaXQgdGhpcy51cGkuc2V0Q29uZmlnUGFyYW0oJ2J1aWxkZXInKVxuICAgIH0sXG4gIH1cbiAgcHJpdmF0ZSBtZW51ID0gW1xuICAgIHsgbGFiZWw6ICdCdWlsZCBQcm9qZWN0JywgY29tbWFuZDogJ2lkZS1oYXNrZWxsLWNhYmFsOmJ1aWxkJyB9LFxuICAgIHsgbGFiZWw6ICdDbGVhbiBQcm9qZWN0JywgY29tbWFuZDogJ2lkZS1oYXNrZWxsLWNhYmFsOmNsZWFuJyB9LFxuICAgIHsgbGFiZWw6ICdUZXN0JywgY29tbWFuZDogJ2lkZS1oYXNrZWxsLWNhYmFsOnRlc3QnIH0sXG4gICAgeyBsYWJlbDogJ0JlbmNoJywgY29tbWFuZDogJ2lkZS1oYXNrZWxsLWNhYmFsOmJlbmNoJyB9LFxuICAgIHsgbGFiZWw6ICdCdWlsZCBEZXBlbmRlbmNpZXMnLCBjb21tYW5kOiAnaWRlLWhhc2tlbGwtY2FiYWw6ZGVwcycgfSxcbiAgICB7XG4gICAgICBsYWJlbDogJ1NldCBBY3RpdmUgQnVpbGRlcicsXG4gICAgICBjb21tYW5kOiAnaWRlLWhhc2tlbGwtY2FiYWw6c2V0LWFjdGl2ZS1idWlsZGVyJyxcbiAgICB9LFxuICAgIHtcbiAgICAgIGxhYmVsOiAnU2V0IEJ1aWxkIFRhcmdldCcsXG4gICAgICBjb21tYW5kOiAnaWRlLWhhc2tlbGwtY2FiYWw6c2V0LWJ1aWxkLXRhcmdldCcsXG4gICAgfSxcbiAgXVxuICBjb25zdHJ1Y3RvcihyZWc6IFVQSS5JVVBJUmVnaXN0cmF0aW9uKSB7XG4gICAgdGhpcy51cGkgPSByZWcoe1xuICAgICAgbmFtZTogJ2lkZS1oYXNrZWxsLWNhYmFsJyxcbiAgICAgIG1lc3NhZ2VUeXBlczoge1xuICAgICAgICBlcnJvcjoge30sXG4gICAgICAgIHdhcm5pbmc6IHt9LFxuICAgICAgICBidWlsZDoge1xuICAgICAgICAgIHVyaUZpbHRlcjogZmFsc2UsXG4gICAgICAgICAgYXV0b1Njcm9sbDogdHJ1ZSxcbiAgICAgICAgfSxcbiAgICAgICAgdGVzdDoge1xuICAgICAgICAgIHVyaUZpbHRlcjogZmFsc2UsXG4gICAgICAgICAgYXV0b1Njcm9sbDogdHJ1ZSxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICBtZW51OiB7XG4gICAgICAgIGxhYmVsOiAnQnVpbGRlcicsXG4gICAgICAgIG1lbnU6IHRoaXMubWVudSxcbiAgICAgIH0sXG4gICAgICBwYXJhbXM6IHtcbiAgICAgICAgYnVpbGRlcjogdGhpcy5idWlsZGVyUGFyYW1JbmZvKCksXG4gICAgICAgIHRhcmdldDogdGhpcy50YXJnZXRQYXJhbUluZm8oKSxcbiAgICAgIH0sXG4gICAgfSlcblxuICAgIHRoaXMuZGlzcG9zYWJsZXMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpXG5cbiAgICB0aGlzLmRpc3Bvc2FibGVzLmFkZChhdG9tLmNvbW1hbmRzLmFkZCgnYXRvbS13b3Jrc3BhY2UnLCB0aGlzLmNvbW1hbmRzKSlcbiAgICB0aGlzLmRpc3Bvc2FibGVzLmFkZCh0aGlzLnVwaSlcbiAgfVxuXG4gIHB1YmxpYyBkZXN0cm95KCkge1xuICAgIHRoaXMuZGlzcG9zYWJsZXMuZGlzcG9zZSgpXG4gIH1cblxuICBwcml2YXRlIGNhYmFsQ29tbWFuZHMoKSB7XG4gICAgY29uc3QgcmV0ID0ge31cbiAgICBmb3IgKGNvbnN0IGNtZCBvZiBPYmplY3Qua2V5cyhjb21tYW5kT3B0aW9ucykpIHtcbiAgICAgIHJldFtgaWRlLWhhc2tlbGwtY2FiYWw6JHtjbWR9YF0gPSBhc3luYyAoKSA9PiB0aGlzLnJ1bkNhYmFsQ29tbWFuZChjbWQpXG4gICAgfVxuICAgIHJldHVybiByZXRcbiAgfVxuXG4gIHByaXZhdGUgYnVpbGRlclBhcmFtSW5mbygpOiBVUEkuSVBhcmFtU3BlYzxCdWlsZGVyUGFyYW1UeXBlPiB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGl0ZW1zOiAoKTogQnVpbGRlclBhcmFtVHlwZVtdID0+IHtcbiAgICAgICAgY29uc3QgYnVpbGRlcnM6IEJ1aWxkZXJQYXJhbVR5cGVbXSA9IFtcbiAgICAgICAgICB7IG5hbWU6ICdjYWJhbC12MScgfSxcbiAgICAgICAgICB7IG5hbWU6ICdjYWJhbC12MicgfSxcbiAgICAgICAgICB7IG5hbWU6ICdzdGFjaycgfSxcbiAgICAgICAgICB7IG5hbWU6ICdub25lJyB9LFxuICAgICAgICBdXG4gICAgICAgIHJldHVybiBidWlsZGVyc1xuICAgICAgfSxcbiAgICAgIGl0ZW1UZW1wbGF0ZTogKGl0ZW06IEJ1aWxkZXJQYXJhbVR5cGUpID0+XG4gICAgICAgIGA8bGk+PGRpdiBjbGFzcz0nbmFtZSc+JHtpdGVtLm5hbWV9PC9kaXY+PC9saT5gLFxuICAgICAgZGlzcGxheVRlbXBsYXRlOiAoaXRlbT86IEJ1aWxkZXJQYXJhbVR5cGUpID0+XG4gICAgICAgIGl0ZW0gJiYgaXRlbS5uYW1lID8gaXRlbS5uYW1lIDogJ05vdCBzZXQnLFxuICAgICAgaXRlbUZpbHRlcktleTogJ25hbWUnLFxuICAgICAgZGVzY3JpcHRpb246ICdTZWxlY3QgYnVpbGRlciB0byB1c2Ugd2l0aCBjdXJyZW50IHByb2plY3QnLFxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgdGFyZ2V0UGFyYW1JbmZvKCk6IFVQSS5JUGFyYW1TcGVjPFRhcmdldFBhcmFtVHlwZT4ge1xuICAgIGNvbnN0IGRlZmF1bHRWYWw6IFRhcmdldFBhcmFtVHlwZSA9IHtcbiAgICAgIHByb2plY3Q6ICdBdXRvJyxcbiAgICAgIHR5cGU6ICdhdXRvJyxcbiAgICAgIGRpcjogdW5kZWZpbmVkLFxuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgZGVmYXVsdDogZGVmYXVsdFZhbCxcbiAgICAgIGl0ZW1zOiBhc3luYyAoKTogUHJvbWlzZTxUYXJnZXRQYXJhbVR5cGVbXT4gPT4ge1xuICAgICAgICBjb25zdCBwcm9qZWN0czogVGFyZ2V0UGFyYW1UeXBlW10gPSBbZGVmYXVsdFZhbF1cbiAgICAgICAgZm9yIChjb25zdCBkIG9mIGF0b20ucHJvamVjdC5nZXREaXJlY3RvcmllcygpKSB7XG4gICAgICAgICAgY29uc3QgZGlyID0gZC5nZXRQYXRoKClcbiAgICAgICAgICBjb25zdCBbY2FiYWxGaWxlXSA9IChhd2FpdCBVdGlsLmdldFJvb3REaXIoZGlyKSlcbiAgICAgICAgICAgIC5nZXRFbnRyaWVzU3luYygpXG4gICAgICAgICAgICAuZmlsdGVyKGlzQ2FiYWxGaWxlKVxuICAgICAgICAgIGlmIChjYWJhbEZpbGUgJiYgY2FiYWxGaWxlLmlzRmlsZSgpKSB7XG4gICAgICAgICAgICBjb25zdCBkYXRhID0gYXdhaXQgY2FiYWxGaWxlLnJlYWQoKVxuICAgICAgICAgICAgaWYgKGRhdGEgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBDb3VsZCBub3QgcmVhZCBjYWJhbGZpbGUgJHtjYWJhbEZpbGUuZ2V0UGF0aCgpfWApXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBwcm9qZWN0ID0gYXdhaXQgVXRpbC5wYXJzZURvdENhYmFsKGRhdGEpXG4gICAgICAgICAgICBpZiAocHJvamVjdCkge1xuICAgICAgICAgICAgICBwcm9qZWN0cy5wdXNoKHsgcHJvamVjdDogcHJvamVjdC5uYW1lLCBkaXIsIHR5cGU6ICdhdXRvJyB9KVxuICAgICAgICAgICAgICBwcm9qZWN0cy5wdXNoKHsgcHJvamVjdDogcHJvamVjdC5uYW1lLCBkaXIsIHR5cGU6ICdhbGwnIH0pXG4gICAgICAgICAgICAgIGZvciAoY29uc3QgdGFyZ2V0IG9mIHByb2plY3QudGFyZ2V0cykge1xuICAgICAgICAgICAgICAgIHByb2plY3RzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgcHJvamVjdDogcHJvamVjdC5uYW1lLFxuICAgICAgICAgICAgICAgICAgZGlyLFxuICAgICAgICAgICAgICAgICAgdHlwZTogJ2NvbXBvbmVudCcsXG4gICAgICAgICAgICAgICAgICB0YXJnZXQsXG4gICAgICAgICAgICAgICAgICBjb21wb25lbnQ6IHRhcmdldC50YXJnZXQsXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcHJvamVjdHNcbiAgICAgIH0sXG4gICAgICBpdGVtVGVtcGxhdGU6ICh0Z3Q6IFRhcmdldFBhcmFtVHlwZSkgPT4ge1xuICAgICAgICBsZXQgZGVzYzogc3RyaW5nXG4gICAgICAgIHN3aXRjaCAodGd0LnR5cGUpIHtcbiAgICAgICAgICBjYXNlICdhdXRvJzpcbiAgICAgICAgICAgIGRlc2MgPSBgPGRpdiBjbGFzcz0nbmFtZSc+QXV0bzwvZGl2PmBcbiAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgY2FzZSAnYWxsJzpcbiAgICAgICAgICAgIGRlc2MgPSBgPGRpdiBjbGFzcz0nbmFtZSc+QWxsPC9kaXY+YFxuICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICBjYXNlICdjb21wb25lbnQnOlxuICAgICAgICAgICAgZGVzYyA9IGBcbiAgICAgICAgICAgIDxkaXYgY2xhc3M9J3R5cGUnPiR7dGd0LnRhcmdldC50eXBlfTwvZGl2PlxuICAgICAgICAgICAgPGRpdiBjbGFzcz0nbmFtZSc+JHt0Z3QudGFyZ2V0Lm5hbWV9PC9kaXY+XG4gICAgICAgICAgICBgXG4gICAgICAgICAgICBicmVha1xuICAgICAgICB9XG4gICAgICAgIC8vIHRzbGludDpkaXNhYmxlOm5vLW5vbi1udWxsLWFzc2VydGlvblxuICAgICAgICByZXR1cm4gYDxsaT5cbiAgICAgICAgICA8ZGl2IGNsYXNzPSdwcm9qZWN0Jz4ke3RndC5wcm9qZWN0fTwvZGl2PlxuICAgICAgICAgIDxkaXYgY2xhc3M9J2Rpcic+JHt0Z3QuZGlyIHx8ICcnfTwvZGl2PlxuICAgICAgICAgICR7ZGVzYyF9XG4gICAgICAgICAgPGRpdiBjbGFzcz0nY2xlYXJmaXgnPjwvZGl2PlxuICAgICAgICA8L2xpPmBcbiAgICAgICAgLy8gdHNsaW50OmVuYWJsZTpuby1ub24tbnVsbC1hc3NlcnRpb25cbiAgICAgIH0sXG4gICAgICBkaXNwbGF5VGVtcGxhdGU6IChpdGVtPzogVGFyZ2V0UGFyYW1UeXBlKSA9PiB7XG4gICAgICAgIGlmICghaXRlbSkgcmV0dXJuICd1bmRlZmluZWQnXG4gICAgICAgIGlmICghaXRlbS5kaXIpIHtcbiAgICAgICAgICByZXR1cm4gaXRlbS5wcm9qZWN0XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbGV0IHRhcmdldDogc3RyaW5nXG4gICAgICAgICAgc3dpdGNoIChpdGVtLnR5cGUpIHtcbiAgICAgICAgICAgIGNhc2UgJ2F1dG8nOlxuICAgICAgICAgICAgICB0YXJnZXQgPSAnQXV0bydcbiAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgIGNhc2UgJ2FsbCc6XG4gICAgICAgICAgICAgIHRhcmdldCA9ICdBbGwnXG4gICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICBjYXNlICdjb21wb25lbnQnOlxuICAgICAgICAgICAgICB0YXJnZXQgPSBpdGVtLnRhcmdldC5uYW1lXG4gICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgfVxuICAgICAgICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpuby1ub24tbnVsbC1hc3NlcnRpb25cbiAgICAgICAgICByZXR1cm4gYCR7aXRlbS5wcm9qZWN0fTogJHt0YXJnZXQhfWBcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIGl0ZW1GaWx0ZXJLZXk6ICduYW1lJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnU2VsZWN0IHRhcmdldCB0byBidWlsZCcsXG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBnZXRBY3RpdmVQcm9qZWN0UGF0aCgpOiBzdHJpbmcge1xuICAgIGNvbnN0IGVkaXRvciA9IGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVRleHRFZGl0b3IoKVxuICAgIGlmIChlZGl0b3IpIHtcbiAgICAgIGNvbnN0IGVkcGF0aCA9IGVkaXRvci5nZXRQYXRoKClcbiAgICAgIGlmIChlZHBhdGgpIHtcbiAgICAgICAgcmV0dXJuIHBhdGguZGlybmFtZShlZHBhdGgpXG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBhdG9tLnByb2plY3QuZ2V0UGF0aHMoKVswXSB8fCBwcm9jZXNzLmN3ZCgpXG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGdldEFjdGl2ZVByb2plY3RUYXJnZXQoXG4gICAgY2FiYWxmaWxlOiBzdHJpbmcsXG4gICAgY2FiYWxSb290OiBEaXJlY3RvcnksXG4gICk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICBjb25zdCBlZGl0b3IgPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKClcbiAgICBpZiAoZWRpdG9yKSB7XG4gICAgICBjb25zdCBlZHBhdGggPSBlZGl0b3IuZ2V0UGF0aCgpXG4gICAgICBpZiAoZWRwYXRoKSB7XG4gICAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IFV0aWwuZ2V0Q29tcG9uZW50RnJvbUZpbGUoXG4gICAgICAgICAgY2FiYWxmaWxlLFxuICAgICAgICAgIGNhYmFsUm9vdC5yZWxhdGl2aXplKGVkcGF0aCksXG4gICAgICAgIClcbiAgICAgICAgaWYgKHJlcykgcmV0dXJuIHJlc1xuICAgICAgICBlbHNlIHJldHVybiBbXVxuICAgICAgfVxuICAgIH1cbiAgICAvLyBkZWZhdWx0XG4gICAgcmV0dXJuIFtdXG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGNhYmFsQnVpbGQoXG4gICAgY21kOiBDYWJhbENvbW1hbmQsXG4gICAgcGFyYW1zOiBCdWlsZGVycy5JUGFyYW1zLFxuICApOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0cnkge1xuICAgICAgaWYgKHRoaXMucnVubmluZykge1xuICAgICAgICB0aGlzLnVwaS5zZXRTdGF0dXMoe1xuICAgICAgICAgIHN0YXR1czogJ3dhcm5pbmcnLFxuICAgICAgICAgIGRldGFpbDogJ0J1aWxkZXIgYWxyZWFkeSBydW5uaW5nJyxcbiAgICAgICAgfSlcbiAgICAgICAgcmV0dXJuXG4gICAgICB9XG4gICAgICB0aGlzLnJ1bm5pbmcgPSB0cnVlXG5cbiAgICAgIGNvbnN0IGJ1aWxkZXJQYXJhbSA9IGF3YWl0IHRoaXMudXBpLmdldENvbmZpZ1BhcmFtPEJ1aWxkZXJQYXJhbVR5cGU+KFxuICAgICAgICAnYnVpbGRlcicsXG4gICAgICApXG4gICAgICBjb25zdCB0YXJnZXQgPSBhd2FpdCB0aGlzLnVwaS5nZXRDb25maWdQYXJhbTxUYXJnZXRQYXJhbVR5cGU+KCd0YXJnZXQnKVxuXG4gICAgICBpZiAodGFyZ2V0ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdUYXJnZXQgdW5kZWZpbmVkJylcbiAgICAgIH1cbiAgICAgIGlmIChidWlsZGVyUGFyYW0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0J1aWxkZXIgdW5kZWZpbmVkJylcbiAgICAgIH1cbiAgICAgIGlmICgoYnVpbGRlclBhcmFtLm5hbWUgYXMgc3RyaW5nKSA9PT0gJ2NhYmFsJykge1xuICAgICAgICBidWlsZGVyUGFyYW0ubmFtZSA9ICdjYWJhbC12MSdcbiAgICAgICAgdGhpcy51cGkuc2V0Q29uZmlnUGFyYW08QnVpbGRlclBhcmFtVHlwZT4oJ2J1aWxkZXInLCBidWlsZGVyUGFyYW0pXG4gICAgICB9IGVsc2UgaWYgKChidWlsZGVyUGFyYW0ubmFtZSBhcyBzdHJpbmcpID09PSAnY2FiYWwtbml4Jykge1xuICAgICAgICBidWlsZGVyUGFyYW0ubmFtZSA9ICdjYWJhbC12MidcbiAgICAgICAgdGhpcy51cGkuc2V0Q29uZmlnUGFyYW08QnVpbGRlclBhcmFtVHlwZT4oJ2J1aWxkZXInLCBidWlsZGVyUGFyYW0pXG4gICAgICB9XG5cbiAgICAgIHRoaXMudXBpLnNldFN0YXR1cyh7XG4gICAgICAgIHN0YXR1czogJ3Byb2dyZXNzJyxcbiAgICAgICAgcHJvZ3Jlc3M6IHBhcmFtcy5vblByb2dyZXNzID8gMC4wIDogdW5kZWZpbmVkLFxuICAgICAgICBkZXRhaWw6ICcnLFxuICAgICAgfSlcblxuICAgICAgY29uc3QgY2FiYWxSb290ID0gYXdhaXQgVXRpbC5nZXRSb290RGlyKFxuICAgICAgICB0YXJnZXQuZGlyID8gdGFyZ2V0LmRpciA6IHRoaXMuZ2V0QWN0aXZlUHJvamVjdFBhdGgoKSxcbiAgICAgIClcblxuICAgICAgY29uc3QgW2NhYmFsRmlsZV06IEZpbGVbXSA9IGNhYmFsUm9vdC5nZXRFbnRyaWVzU3luYygpLmZpbHRlcihpc0NhYmFsRmlsZSlcblxuICAgICAgaWYgKCFjYWJhbEZpbGUpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdObyBjYWJhbCBmaWxlIGZvdW5kJylcbiAgICAgIH1cblxuICAgICAgbGV0IG5ld1RhcmdldDogVGFyZ2V0UGFyYW1UeXBlRm9yQnVpbGRlciB8IHVuZGVmaW5lZFxuXG4gICAgICBpZiAodGFyZ2V0LnR5cGUgPT09ICdhdXRvJykge1xuICAgICAgICBjb25zdCBjYWJhbENvbnRlbnRzID0gYXdhaXQgY2FiYWxGaWxlLnJlYWQoKVxuICAgICAgICBpZiAoY2FiYWxDb250ZW50cyA9PT0gbnVsbCkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgQ291bGQgbm90IHJlYWQgY2FiYWxmaWxlICR7Y2FiYWxGaWxlLmdldFBhdGgoKX1gKVxuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHRndHMgPSBhd2FpdCB0aGlzLmdldEFjdGl2ZVByb2plY3RUYXJnZXQoY2FiYWxDb250ZW50cywgY2FiYWxSb290KVxuICAgICAgICBjb25zdCBbdGd0XSA9IHRndHNcbiAgICAgICAgaWYgKHRndCkge1xuICAgICAgICAgIGNvbnN0IGNmID0gYXdhaXQgVXRpbC5wYXJzZURvdENhYmFsKGNhYmFsQ29udGVudHMpXG4gICAgICAgICAgaWYgKGNmKSB7XG4gICAgICAgICAgICBuZXdUYXJnZXQgPSB7XG4gICAgICAgICAgICAgIHByb2plY3Q6IGNmLm5hbWUsXG4gICAgICAgICAgICAgIGRpcjogY2FiYWxSb290LmdldFBhdGgoKSxcbiAgICAgICAgICAgICAgdHlwZTogJ2NvbXBvbmVudCcsXG4gICAgICAgICAgICAgIGNvbXBvbmVudDogdGd0LFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmICh0YXJnZXQudHlwZSA9PT0gJ2FsbCcpIHtcbiAgICAgICAgY29uc3QgY2FiYWxDb250ZW50cyA9IGF3YWl0IGNhYmFsRmlsZS5yZWFkKClcbiAgICAgICAgaWYgKGNhYmFsQ29udGVudHMgPT09IG51bGwpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYENvdWxkIG5vdCByZWFkIGNhYmFsZmlsZSAke2NhYmFsRmlsZS5nZXRQYXRoKCl9YClcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBjZiA9IGF3YWl0IFV0aWwucGFyc2VEb3RDYWJhbChjYWJhbENvbnRlbnRzKVxuICAgICAgICBpZiAoY2YpIHtcbiAgICAgICAgICBuZXdUYXJnZXQgPSBuZXdUYXJnZXQgPSB7XG4gICAgICAgICAgICBwcm9qZWN0OiBjZi5uYW1lLFxuICAgICAgICAgICAgZGlyOiBjYWJhbFJvb3QuZ2V0UGF0aCgpLFxuICAgICAgICAgICAgdHlwZTogJ2FsbCcsXG4gICAgICAgICAgICB0YXJnZXRzOiBjZi50YXJnZXRzLFxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmICh0YXJnZXQudHlwZSA9PT0gJ2NvbXBvbmVudCcpIHtcbiAgICAgICAgY29uc3QgeyBwcm9qZWN0LCBkaXIsIGNvbXBvbmVudCB9ID0gdGFyZ2V0XG4gICAgICAgIG5ld1RhcmdldCA9IHsgdHlwZTogJ2NvbXBvbmVudCcsIHByb2plY3QsIGRpciwgY29tcG9uZW50IH1cbiAgICAgIH1cbiAgICAgIGlmICghbmV3VGFyZ2V0KSB7XG4gICAgICAgIG5ld1RhcmdldCA9IHtcbiAgICAgICAgICB0eXBlOiAnYXV0bycsXG4gICAgICAgICAgcHJvamVjdDogdGFyZ2V0LnByb2plY3QsXG4gICAgICAgICAgZGlyOiB0YXJnZXQuZGlyLFxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBjb25zdCBidWlsZGVyczogVEJ1aWxkZXJzID0ge1xuICAgICAgICAnY2FiYWwtdjEnOiBCdWlsZGVycy5DYWJhbFYxLFxuICAgICAgICAnY2FiYWwtdjInOiBCdWlsZGVycy5DYWJhbFYyLFxuICAgICAgICBzdGFjazogQnVpbGRlcnMuU3RhY2ssXG4gICAgICAgIG5vbmU6IEJ1aWxkZXJzLk5vbmUsXG4gICAgICB9XG4gICAgICBjb25zdCBidWlsZGVyID0gYnVpbGRlcnNbYnVpbGRlclBhcmFtLm5hbWVdXG5cbiAgICAgIGlmIChidWlsZGVyID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgIGBVbmtub3duIGJ1aWxkZXIgJyR7KGJ1aWxkZXJQYXJhbSAmJiBidWlsZGVyUGFyYW0ubmFtZSkgfHxcbiAgICAgICAgICAgIGJ1aWxkZXJQYXJhbX0nYCxcbiAgICAgICAgKVxuICAgICAgfVxuXG4gICAgICBjb25zdCByZXMgPSBhd2FpdCBuZXcgYnVpbGRlcih7XG4gICAgICAgIHBhcmFtcyxcbiAgICAgICAgdGFyZ2V0OiBuZXdUYXJnZXQsXG4gICAgICAgIGNhYmFsUm9vdCxcbiAgICAgIH0pLnJ1bkNvbW1hbmQoY21kKVxuICAgICAgLy8gc2VlIENhYmFsUHJvY2VzcyBmb3IgZXhwbGFpbmF0aW9uXG4gICAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6IG5vLW51bGwta2V5d29yZFxuICAgICAgaWYgKHJlcy5leGl0Q29kZSA9PT0gbnVsbCkge1xuICAgICAgICAvLyB0aGlzIG1lYW5zIHByb2Nlc3Mgd2FzIGtpbGxlZFxuICAgICAgICB0aGlzLnVwaS5zZXRTdGF0dXMoe1xuICAgICAgICAgIHN0YXR1czogJ3dhcm5pbmcnLFxuICAgICAgICAgIGRldGFpbDogJ0J1aWxkIHdhcyBpbnRlcnJ1cHRlZCcsXG4gICAgICAgIH0pXG4gICAgICB9IGVsc2UgaWYgKHJlcy5leGl0Q29kZSAhPT0gMCkge1xuICAgICAgICBpZiAocmVzLmhhc0Vycm9yKSB7XG4gICAgICAgICAgdGhpcy51cGkuc2V0U3RhdHVzKHtcbiAgICAgICAgICAgIHN0YXR1czogJ3dhcm5pbmcnLFxuICAgICAgICAgICAgZGV0YWlsOiAnVGhlcmUgd2VyZSBlcnJvcnMgaW4gc291cmNlIGZpbGVzJyxcbiAgICAgICAgICB9KVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMudXBpLnNldFN0YXR1cyh7XG4gICAgICAgICAgICBzdGF0dXM6ICdlcnJvcicsXG4gICAgICAgICAgICBkZXRhaWw6IGBCdWlsZGVyIHF1aXQgYWJub3JtYWxseSB3aXRoIGV4aXQgY29kZSAke3Jlcy5leGl0Q29kZX1gLFxuICAgICAgICAgIH0pXG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMudXBpLnNldFN0YXR1cyh7IHN0YXR1czogJ3JlYWR5JywgZGV0YWlsOiAnQnVpbGQgd2FzIHN1Y2Nlc3NmdWwnIH0pXG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGlmIChlcnJvcikge1xuICAgICAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6IG5vLWNvbnNvbGVcbiAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcilcbiAgICAgICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOiBuby11bnNhZmUtYW55XG4gICAgICAgIHRoaXMudXBpLnNldFN0YXR1cyh7IHN0YXR1czogJ2Vycm9yJywgZGV0YWlsOiBlcnJvci50b1N0cmluZygpIH0pXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnVwaS5zZXRTdGF0dXMoe1xuICAgICAgICAgIHN0YXR1czogJ3dhcm5pbmcnLFxuICAgICAgICAgIGRldGFpbDogJ0J1aWxkIGZhaWxlZCB3aXRoIG5vIGVycm9ycycsXG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMucnVubmluZyA9IGZhbHNlXG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHJ1bkNhYmFsQ29tbWFuZChjb21tYW5kOiBDYWJhbENvbW1hbmQpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCB7IG1lc3NhZ2VUeXBlcywgZGVmYXVsdFNldmVyaXR5LCBjYW5DYW5jZWwgfSA9IGNvbW1hbmRPcHRpb25zW2NvbW1hbmRdXG4gICAgY29uc3QgbWVzc2FnZXM6IFVQSS5JUmVzdWx0SXRlbVtdID0gW11cbiAgICB0aGlzLnVwaS5zZXRNZXNzYWdlcyhtZXNzYWdlcylcblxuICAgIGxldCBjYW5jZWxBY3Rpb25EaXNwOiBEaXNwb3NhYmxlIHwgdW5kZWZpbmVkXG5cbiAgICBhd2FpdCB0aGlzLmNhYmFsQnVpbGQoY29tbWFuZCwge1xuICAgICAgc2V2ZXJpdHk6IGRlZmF1bHRTZXZlcml0eSxcbiAgICAgIHNldENhbmNlbEFjdGlvbjogY2FuQ2FuY2VsXG4gICAgICAgID8gKGFjdGlvbjogKCkgPT4gdm9pZCkgPT4ge1xuICAgICAgICAgICAgY2FuY2VsQWN0aW9uRGlzcCAmJiBjYW5jZWxBY3Rpb25EaXNwLmRpc3Bvc2UoKVxuICAgICAgICAgICAgY2FuY2VsQWN0aW9uRGlzcCA9IHRoaXMudXBpLmFkZFBhbmVsQ29udHJvbCh7XG4gICAgICAgICAgICAgIGVsZW1lbnQ6ICdpZGUtaGFza2VsbC1idXR0b24nLFxuICAgICAgICAgICAgICBvcHRzOiB7XG4gICAgICAgICAgICAgICAgY2xhc3NlczogWydjYW5jZWwnXSxcbiAgICAgICAgICAgICAgICBldmVudHM6IHtcbiAgICAgICAgICAgICAgICAgIGNsaWNrOiBhY3Rpb24sXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgfVxuICAgICAgICA6IHVuZGVmaW5lZCxcbiAgICAgIG9uTXNnOiAobWVzc2FnZTogVVBJLklSZXN1bHRJdGVtKSA9PiB7XG4gICAgICAgIGlmIChtZXNzYWdlVHlwZXMuaW5jbHVkZXMobWVzc2FnZS5zZXZlcml0eSkpIHtcbiAgICAgICAgICBtZXNzYWdlcy5wdXNoKG1lc3NhZ2UpXG4gICAgICAgICAgdGhpcy51cGkuc2V0TWVzc2FnZXMobWVzc2FnZXMpXG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBvblByb2dyZXNzOiBjYW5DYW5jZWxcbiAgICAgICAgPyAocHJvZ3Jlc3M6IG51bWJlcikgPT5cbiAgICAgICAgICAgIHRoaXMudXBpLnNldFN0YXR1cyh7XG4gICAgICAgICAgICAgIHN0YXR1czogJ3Byb2dyZXNzJyxcbiAgICAgICAgICAgICAgcHJvZ3Jlc3MsXG4gICAgICAgICAgICAgIGRldGFpbDogYCR7Y29tbWFuZH0gaW4gcHJvZ3Jlc3NgLFxuICAgICAgICAgICAgfSlcbiAgICAgICAgOiB1bmRlZmluZWQsXG4gICAgfSlcbiAgICBjYW5jZWxBY3Rpb25EaXNwICYmIGNhbmNlbEFjdGlvbkRpc3AuZGlzcG9zZSgpXG4gIH1cbn1cbiJdfQ==