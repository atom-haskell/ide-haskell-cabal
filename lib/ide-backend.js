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
                            projects.push({ project: project.name, dir, type: 'all', targets: project.targets });
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
            let newTarget = Object.assign({}, target);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaWRlLWJhY2tlbmQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaWRlLWJhY2tlbmQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSw2QkFBNEI7QUFDNUIsK0JBQXVFO0FBQ3ZFLHVDQUFzQztBQUN0QywyQ0FBMEM7QUFNMUMscUJBQXFCLElBQXVCO0lBQzFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDLE1BQU0sRUFBRSxJQUFJLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQTtBQUMzRSxDQUFDO0FBaUJELE1BQU0sY0FBYyxHQUEyQztJQUM3RCxLQUFLLEVBQUU7UUFDTCxZQUFZLEVBQUUsQ0FBQyxPQUFPLEVBQUUsU0FBUyxFQUFFLE9BQU8sQ0FBQztRQUMzQyxlQUFlLEVBQUUsT0FBTztRQUN4QixTQUFTLEVBQUUsSUFBSTtLQUNoQjtJQUNELEtBQUssRUFBRTtRQUNMLFlBQVksRUFBRSxDQUFDLE9BQU8sQ0FBQztRQUN2QixlQUFlLEVBQUUsT0FBTztRQUN4QixTQUFTLEVBQUUsS0FBSztLQUNqQjtJQUNELElBQUksRUFBRTtRQUNKLFlBQVksRUFBRSxDQUFDLE9BQU8sRUFBRSxTQUFTLEVBQUUsT0FBTyxFQUFFLE1BQU0sQ0FBQztRQUNuRCxlQUFlLEVBQUUsTUFBTTtRQUN2QixTQUFTLEVBQUUsSUFBSTtLQUNoQjtJQUNELEtBQUssRUFBRTtRQUNMLFlBQVksRUFBRSxDQUFDLE9BQU8sRUFBRSxTQUFTLEVBQUUsT0FBTyxFQUFFLE1BQU0sQ0FBQztRQUNuRCxlQUFlLEVBQUUsTUFBTTtRQUN2QixTQUFTLEVBQUUsSUFBSTtLQUNoQjtJQUNELElBQUksRUFBRTtRQUNKLFlBQVksRUFBRSxDQUFDLE9BQU8sQ0FBQztRQUN2QixlQUFlLEVBQUUsT0FBTztRQUN4QixTQUFTLEVBQUUsSUFBSTtLQUNoQjtDQUNGLENBQUE7QUFFRDtJ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aCdcbmltcG9ydCB7IEZpbGUsIENvbXBvc2l0ZURpc3Bvc2FibGUsIERpc3Bvc2FibGUsIERpcmVjdG9yeSB9IGZyb20gJ2F0b20nXG5pbXBvcnQgKiBhcyBCdWlsZGVycyBmcm9tICcuL2J1aWxkZXJzJ1xuaW1wb3J0ICogYXMgVXRpbCBmcm9tICdhdG9tLWhhc2tlbGwtdXRpbHMnXG5pbXBvcnQgeyBUYXJnZXRQYXJhbVR5cGUsIENhYmFsQ29tbWFuZCwgVGFyZ2V0UGFyYW1UeXBlUGFydGlhbCB9IGZyb20gJy4vY29tbW9uJ1xuaW1wb3J0ICogYXMgVVBJIGZyb20gJ2F0b20taGFza2VsbC11cGknXG5cbmludGVyZmFjZSBCdWlsZGVyUGFyYW1UeXBlIHsgbmFtZTogc3RyaW5nIH1cblxuZnVuY3Rpb24gaXNDYWJhbEZpbGUoZmlsZT86IEZpbGUgfCBEaXJlY3RvcnkpOiBmaWxlIGlzIEZpbGUge1xuICByZXR1cm4gISEoZmlsZSAmJiBmaWxlLmlzRmlsZSgpICYmIGZpbGUuZ2V0QmFzZU5hbWUoKS5lbmRzV2l0aCgnLmNhYmFsJykpXG59XG5cbmludGVyZmFjZSBJQ29tbWFuZE9wdGlvbnMge1xuICBtZXNzYWdlVHlwZXM6IFVQSS5UU2V2ZXJpdHlbXVxuICBkZWZhdWx0U2V2ZXJpdHk6IFVQSS5UU2V2ZXJpdHlcbiAgY2FuQ2FuY2VsOiBib29sZWFuXG59XG5cbnR5cGUgVEJ1aWxkZXJzID0ge1xuICBbazogc3RyaW5nXTpcbiAgdHlwZW9mIEJ1aWxkZXJzLkNhYmFsTml4IHxcbiAgdHlwZW9mIEJ1aWxkZXJzLkNhYmFsIHxcbiAgdHlwZW9mIEJ1aWxkZXJzLlN0YWNrIHxcbiAgdHlwZW9mIEJ1aWxkZXJzLk5vbmUgfFxuICB1bmRlZmluZWRcbn1cblxuY29uc3QgY29tbWFuZE9wdGlvbnM6IHtbSyBpbiBDYWJhbENvbW1hbmRdOiBJQ29tbWFuZE9wdGlvbnN9ID0ge1xuICBidWlsZDoge1xuICAgIG1lc3NhZ2VUeXBlczogWydlcnJvcicsICd3YXJuaW5nJywgJ2J1aWxkJ10sXG4gICAgZGVmYXVsdFNldmVyaXR5OiAnYnVpbGQnLFxuICAgIGNhbkNhbmNlbDogdHJ1ZSxcbiAgfSxcbiAgY2xlYW46IHtcbiAgICBtZXNzYWdlVHlwZXM6IFsnYnVpbGQnXSxcbiAgICBkZWZhdWx0U2V2ZXJpdHk6ICdidWlsZCcsXG4gICAgY2FuQ2FuY2VsOiBmYWxzZSxcbiAgfSxcbiAgdGVzdDoge1xuICAgIG1lc3NhZ2VUeXBlczogWydlcnJvcicsICd3YXJuaW5nJywgJ2J1aWxkJywgJ3Rlc3QnXSxcbiAgICBkZWZhdWx0U2V2ZXJpdHk6ICd0ZXN0JyxcbiAgICBjYW5DYW5jZWw6IHRydWUsXG4gIH0sXG4gIGJlbmNoOiB7XG4gICAgbWVzc2FnZVR5cGVzOiBbJ2Vycm9yJywgJ3dhcm5pbmcnLCAnYnVpbGQnLCAndGVzdCddLFxuICAgIGRlZmF1bHRTZXZlcml0eTogJ3Rlc3QnLFxuICAgIGNhbkNhbmNlbDogdHJ1ZSxcbiAgfSxcbiAgZGVwczoge1xuICAgIG1lc3NhZ2VUeXBlczogWydidWlsZCddLFxuICAgIGRlZmF1bHRTZXZlcml0eTogJ2J1aWxkJyxcbiAgICBjYW5DYW5jZWw6IHRydWUsXG4gIH0sXG59XG5cbmV4cG9ydCBjbGFzcyBJZGVCYWNrZW5kIHtcbiAgcHJpdmF0ZSBkaXNwb3NhYmxlczogQ29tcG9zaXRlRGlzcG9zYWJsZVxuICBwcml2YXRlIHVwaTogVVBJLklVUElJbnN0YW5jZVxuICBwcml2YXRlIHJ1bm5pbmc6IGJvb2xlYW4gPSBmYWxzZVxuICBwcml2YXRlIGNvbW1hbmRzID0ge1xuICAgIC4uLnRoaXMuY2FiYWxDb21tYW5kcygpLFxuICAgICdpZGUtaGFza2VsbC1jYWJhbDpzZXQtYnVpbGQtdGFyZ2V0JzogYXN5bmMgKCkgPT5cbiAgICAgIHRoaXMudXBpLnNldENvbmZpZ1BhcmFtKCd0YXJnZXQnKSxcbiAgICAnaWRlLWhhc2tlbGwtY2FiYWw6c2V0LWFjdGl2ZS1idWlsZGVyJzogYXN5bmMgKCkgPT5cbiAgICAgIHRoaXMudXBpLnNldENvbmZpZ1BhcmFtKCdidWlsZGVyJyksXG4gIH1cbiAgcHJpdmF0ZSBtZW51ID0gW1xuICAgIHsgbGFiZWw6ICdCdWlsZCBQcm9qZWN0JywgY29tbWFuZDogJ2lkZS1oYXNrZWxsLWNhYmFsOmJ1aWxkJyB9LFxuICAgIHsgbGFiZWw6ICdDbGVhbiBQcm9qZWN0JywgY29tbWFuZDogJ2lkZS1oYXNrZWxsLWNhYmFsOmNsZWFuJyB9LFxuICAgIHsgbGFiZWw6ICdUZXN0JywgY29tbWFuZDogJ2lkZS1oYXNrZWxsLWNhYmFsOnRlc3QnIH0sXG4gICAgeyBsYWJlbDogJ0JlbmNoJywgY29tbWFuZDogJ2lkZS1oYXNrZWxsLWNhYmFsOmJlbmNoJyB9LFxuICAgIHsgbGFiZWw6ICdCdWlsZCBEZXBlbmRlbmNpZXMnLCBjb21tYW5kOiAnaWRlLWhhc2tlbGwtY2FiYWw6ZGVwcycgfSxcbiAgICB7IGxhYmVsOiAnU2V0IEFjdGl2ZSBCdWlsZGVyJywgY29tbWFuZDogJ2lkZS1oYXNrZWxsLWNhYmFsOnNldC1hY3RpdmUtYnVpbGRlcicgfSxcbiAgICB7IGxhYmVsOiAnU2V0IEJ1aWxkIFRhcmdldCcsIGNvbW1hbmQ6ICdpZGUtaGFza2VsbC1jYWJhbDpzZXQtYnVpbGQtdGFyZ2V0JyB9LFxuICBdXG4gIGNvbnN0cnVjdG9yKHJlZzogVVBJLklVUElSZWdpc3RyYXRpb24pIHtcbiAgICB0aGlzLnVwaSA9IHJlZyh7XG4gICAgICBuYW1lOiAnaWRlLWhhc2tlbGwtY2FiYWwnLFxuICAgICAgbWVzc2FnZVR5cGVzOiB7XG4gICAgICAgIGVycm9yOiB7fSxcbiAgICAgICAgd2FybmluZzoge30sXG4gICAgICAgIGJ1aWxkOiB7XG4gICAgICAgICAgdXJpRmlsdGVyOiBmYWxzZSxcbiAgICAgICAgICBhdXRvU2Nyb2xsOiB0cnVlLFxuICAgICAgICB9LFxuICAgICAgICB0ZXN0OiB7XG4gICAgICAgICAgdXJpRmlsdGVyOiBmYWxzZSxcbiAgICAgICAgICBhdXRvU2Nyb2xsOiB0cnVlLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIG1lbnU6IHtcbiAgICAgICAgbGFiZWw6ICdCdWlsZGVyJyxcbiAgICAgICAgbWVudTogdGhpcy5tZW51LFxuICAgICAgfSxcbiAgICAgIHBhcmFtczoge1xuICAgICAgICBidWlsZGVyOiB0aGlzLmJ1aWxkZXJQYXJhbUluZm8oKSxcbiAgICAgICAgdGFyZ2V0OiB0aGlzLnRhcmdldFBhcmFtSW5mbygpLFxuICAgICAgfSxcbiAgICB9KVxuXG4gICAgdGhpcy5kaXNwb3NhYmxlcyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKClcblxuICAgIHRoaXMuZGlzcG9zYWJsZXMuYWRkKGF0b20uY29tbWFuZHMuYWRkKCdhdG9tLXdvcmtzcGFjZScsIHRoaXMuY29tbWFuZHMpKVxuICAgIHRoaXMuZGlzcG9zYWJsZXMuYWRkKHRoaXMudXBpKVxuICB9XG5cbiAgcHVibGljIGRlc3Ryb3koKSB7XG4gICAgdGhpcy5kaXNwb3NhYmxlcy5kaXNwb3NlKClcbiAgfVxuXG4gIHByaXZhdGUgY2FiYWxDb21tYW5kcygpIHtcbiAgICBjb25zdCByZXQgPSB7fVxuICAgIGZvciAoY29uc3QgY21kIG9mIE9iamVjdC5rZXlzKGNvbW1hbmRPcHRpb25zKSkge1xuICAgICAgcmV0W2BpZGUtaGFza2VsbC1jYWJhbDoke2NtZH1gXSA9IGFzeW5jICgpID0+XG4gICAgICAgIHRoaXMucnVuQ2FiYWxDb21tYW5kKGNtZClcbiAgICB9XG4gICAgcmV0dXJuIHJldFxuICB9XG5cbiAgcHJpdmF0ZSBidWlsZGVyUGFyYW1JbmZvKCk6IFVQSS5JUGFyYW1TcGVjPEJ1aWxkZXJQYXJhbVR5cGU+IHtcbiAgICByZXR1cm4ge1xuICAgICAgaXRlbXM6ICgpOiBCdWlsZGVyUGFyYW1UeXBlW10gPT4ge1xuICAgICAgICBjb25zdCBidWlsZGVycyA9IFt7IG5hbWU6ICdjYWJhbCcgfSwgeyBuYW1lOiAnc3RhY2snIH1dXG4gICAgICAgIGlmIChhdG9tLmNvbmZpZy5nZXQoJ2lkZS1oYXNrZWxsLWNhYmFsLmVuYWJsZU5peEJ1aWxkJykpIHtcbiAgICAgICAgICBidWlsZGVycy5wdXNoKHsgbmFtZTogJ2NhYmFsLW5peCcgfSlcbiAgICAgICAgfVxuICAgICAgICBidWlsZGVycy5wdXNoKHsgbmFtZTogJ25vbmUnIH0pXG4gICAgICAgIHJldHVybiBidWlsZGVyc1xuICAgICAgfSxcbiAgICAgIGl0ZW1UZW1wbGF0ZTogKGl0ZW06IEJ1aWxkZXJQYXJhbVR5cGUpID0+IGA8bGk+PGRpdiBjbGFzcz0nbmFtZSc+JHtpdGVtLm5hbWV9PC9kaXY+PC9saT5gLFxuICAgICAgZGlzcGxheVRlbXBsYXRlOiAoaXRlbT86IEJ1aWxkZXJQYXJhbVR5cGUpID0+IGl0ZW0gJiYgaXRlbS5uYW1lID8gaXRlbS5uYW1lIDogJ05vdCBzZXQnLFxuICAgICAgaXRlbUZpbHRlcktleTogJ25hbWUnLFxuICAgICAgZGVzY3JpcHRpb246ICdTZWxlY3QgYnVpbGRlciB0byB1c2Ugd2l0aCBjdXJyZW50IHByb2plY3QnLFxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgdGFyZ2V0UGFyYW1JbmZvKCk6IFVQSS5JUGFyYW1TcGVjPFRhcmdldFBhcmFtVHlwZT4ge1xuICAgIGNvbnN0IGRlZmF1bHRWYWw6IFRhcmdldFBhcmFtVHlwZSA9IHtcbiAgICAgIHByb2plY3Q6ICdBdXRvJyxcbiAgICAgIHR5cGU6ICdhdXRvJyxcbiAgICAgIGRpcjogdW5kZWZpbmVkLFxuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgZGVmYXVsdDogZGVmYXVsdFZhbCxcbiAgICAgIGl0ZW1zOiBhc3luYyAoKTogUHJvbWlzZTxUYXJnZXRQYXJhbVR5cGVbXT4gPT4ge1xuICAgICAgICBjb25zdCBwcm9qZWN0czogVGFyZ2V0UGFyYW1UeXBlW10gPSBbZGVmYXVsdFZhbF1cbiAgICAgICAgZm9yIChjb25zdCBkIG9mIGF0b20ucHJvamVjdC5nZXREaXJlY3RvcmllcygpKSB7XG4gICAgICAgICAgY29uc3QgZGlyID0gZC5nZXRQYXRoKClcbiAgICAgICAgICBjb25zdCBbY2FiYWxGaWxlXSA9IChhd2FpdCBVdGlsLmdldFJvb3REaXIoZGlyKSkuZ2V0RW50cmllc1N5bmMoKS5maWx0ZXIoaXNDYWJhbEZpbGUpXG4gICAgICAgICAgaWYgKGNhYmFsRmlsZSAmJiBjYWJhbEZpbGUuaXNGaWxlKCkpIHtcbiAgICAgICAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCBjYWJhbEZpbGUucmVhZCgpXG4gICAgICAgICAgICBjb25zdCBwcm9qZWN0ID0gYXdhaXQgVXRpbC5wYXJzZURvdENhYmFsKGRhdGEpXG4gICAgICAgICAgICBpZiAocHJvamVjdCkge1xuICAgICAgICAgICAgICBwcm9qZWN0cy5wdXNoKHsgcHJvamVjdDogcHJvamVjdC5uYW1lLCBkaXIsIHR5cGU6ICdhdXRvJyB9KVxuICAgICAgICAgICAgICBwcm9qZWN0cy5wdXNoKHsgcHJvamVjdDogcHJvamVjdC5uYW1lLCBkaXIsIHR5cGU6ICdhbGwnLCB0YXJnZXRzOiBwcm9qZWN0LnRhcmdldHMgfSlcbiAgICAgICAgICAgICAgZm9yIChjb25zdCB0YXJnZXQgb2YgcHJvamVjdC50YXJnZXRzKSB7XG4gICAgICAgICAgICAgICAgcHJvamVjdHMucHVzaCh7XG4gICAgICAgICAgICAgICAgICBwcm9qZWN0OiBwcm9qZWN0Lm5hbWUsXG4gICAgICAgICAgICAgICAgICBkaXIsXG4gICAgICAgICAgICAgICAgICB0eXBlOiAnY29tcG9uZW50JyxcbiAgICAgICAgICAgICAgICAgIHRhcmdldCxcbiAgICAgICAgICAgICAgICAgIGNvbXBvbmVudDogdGFyZ2V0LnRhcmdldCxcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBwcm9qZWN0c1xuICAgICAgfSxcbiAgICAgIGl0ZW1UZW1wbGF0ZTogKHRndDogVGFyZ2V0UGFyYW1UeXBlKSA9PiB7XG4gICAgICAgIGxldCBkZXNjOiBzdHJpbmdcbiAgICAgICAgc3dpdGNoICh0Z3QudHlwZSkge1xuICAgICAgICAgIGNhc2UgJ2F1dG8nOlxuICAgICAgICAgICAgZGVzYyA9IGA8ZGl2IGNsYXNzPSduYW1lJz5BdXRvPC9kaXY+YFxuICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICBjYXNlICdhbGwnOlxuICAgICAgICAgICAgZGVzYyA9IGA8ZGl2IGNsYXNzPSduYW1lJz5BbGw8L2Rpdj5gXG4gICAgICAgICAgICBicmVha1xuICAgICAgICAgIGNhc2UgJ2NvbXBvbmVudCc6XG4gICAgICAgICAgICBkZXNjID0gYFxuICAgICAgICAgICAgPGRpdiBjbGFzcz0ndHlwZSc+JHt0Z3QudGFyZ2V0LnR5cGV9PC9kaXY+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzPSduYW1lJz4ke3RndC50YXJnZXQubmFtZX08L2Rpdj5cbiAgICAgICAgICAgIGBcbiAgICAgICAgICAgIGJyZWFrXG4gICAgICAgIH1cbiAgICAgICAgLy8gdHNsaW50OmRpc2FibGU6bm8tbm9uLW51bGwtYXNzZXJ0aW9uXG4gICAgICAgIHJldHVybiBgPGxpPlxuICAgICAgICAgIDxkaXYgY2xhc3M9J3Byb2plY3QnPiR7dGd0LnByb2plY3R9PC9kaXY+XG4gICAgICAgICAgPGRpdiBjbGFzcz0nZGlyJz4ke3RndC5kaXIgfHwgJyd9PC9kaXY+XG4gICAgICAgICAgJHtkZXNjIX1cbiAgICAgICAgICA8ZGl2IGNsYXNzPSdjbGVhcmZpeCc+PC9kaXY+XG4gICAgICAgIDwvbGk+YFxuICAgICAgICAvLyB0c2xpbnQ6ZW5hYmxlOm5vLW5vbi1udWxsLWFzc2VydGlvblxuICAgICAgfSxcbiAgICAgIGRpc3BsYXlUZW1wbGF0ZTogKGl0ZW0/OiBUYXJnZXRQYXJhbVR5cGUpID0+IHtcbiAgICAgICAgaWYgKCFpdGVtKSByZXR1cm4gJ3VuZGVmaW5lZCdcbiAgICAgICAgaWYgKCFpdGVtLmRpcikge1xuICAgICAgICAgIHJldHVybiBpdGVtLnByb2plY3RcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBsZXQgdGFyZ2V0OiBzdHJpbmdcbiAgICAgICAgICBzd2l0Y2ggKGl0ZW0udHlwZSkge1xuICAgICAgICAgICAgY2FzZSAnYXV0byc6XG4gICAgICAgICAgICAgIHRhcmdldCA9ICdBdXRvJ1xuICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgY2FzZSAnYWxsJzpcbiAgICAgICAgICAgICAgdGFyZ2V0ID0gJ0FsbCdcbiAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgIGNhc2UgJ2NvbXBvbmVudCc6XG4gICAgICAgICAgICAgIHRhcmdldCA9IGl0ZW0udGFyZ2V0Lm5hbWVcbiAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICB9XG4gICAgICAgICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOm5vLW5vbi1udWxsLWFzc2VydGlvblxuICAgICAgICAgIHJldHVybiBgJHtpdGVtLnByb2plY3R9OiAke3RhcmdldCF9YFxuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgaXRlbUZpbHRlcktleTogJ25hbWUnLFxuICAgICAgZGVzY3JpcHRpb246ICdTZWxlY3QgdGFyZ2V0IHRvIGJ1aWxkJyxcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGdldEFjdGl2ZVByb2plY3RQYXRoKCk6IHN0cmluZyB7XG4gICAgY29uc3QgZWRpdG9yID0gYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpXG4gICAgaWYgKGVkaXRvcikge1xuICAgICAgY29uc3QgZWRwYXRoID0gZWRpdG9yLmdldFBhdGgoKVxuICAgICAgaWYgKGVkcGF0aCkge1xuICAgICAgICByZXR1cm4gcGF0aC5kaXJuYW1lKGVkcGF0aClcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGF0b20ucHJvamVjdC5nZXRQYXRocygpWzBdIHx8IHByb2Nlc3MuY3dkKClcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgZ2V0QWN0aXZlUHJvamVjdFRhcmdldChjYWJhbGZpbGU6IHN0cmluZywgY2FiYWxSb290OiBEaXJlY3RvcnkpOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgY29uc3QgZWRpdG9yID0gYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpXG4gICAgaWYgKGVkaXRvcikge1xuICAgICAgY29uc3QgZWRwYXRoID0gZWRpdG9yLmdldFBhdGgoKVxuICAgICAgaWYgKGVkcGF0aCkge1xuICAgICAgICBjb25zdCByZXMgPSBhd2FpdCBVdGlsLmdldENvbXBvbmVudEZyb21GaWxlKGNhYmFsZmlsZSwgY2FiYWxSb290LnJlbGF0aXZpemUoZWRwYXRoKSlcbiAgICAgICAgaWYgKHJlcykgcmV0dXJuIHJlc1xuICAgICAgICBlbHNlIHJldHVybiBbXVxuICAgICAgfVxuICAgIH1cbiAgICAvLyBkZWZhdWx0XG4gICAgcmV0dXJuIFtdXG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGNhYmFsQnVpbGQoY21kOiBDYWJhbENvbW1hbmQsIG9wdHM6IEJ1aWxkZXJzLklQYXJhbXMpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0cnkge1xuICAgICAgaWYgKHRoaXMucnVubmluZykge1xuICAgICAgICB0aGlzLnVwaS5zZXRTdGF0dXMoeyBzdGF0dXM6ICd3YXJuaW5nJywgZGV0YWlsOiAnQnVpbGRlciBhbHJlYWR5IHJ1bm5pbmcnIH0pXG4gICAgICAgIHJldHVyblxuICAgICAgfVxuICAgICAgdGhpcy5ydW5uaW5nID0gdHJ1ZVxuXG4gICAgICBjb25zdCBidWlsZGVyUGFyYW0gPSBhd2FpdCB0aGlzLnVwaS5nZXRDb25maWdQYXJhbTxCdWlsZGVyUGFyYW1UeXBlPignYnVpbGRlcicpXG4gICAgICBjb25zdCB0YXJnZXQgPSBhd2FpdCB0aGlzLnVwaS5nZXRDb25maWdQYXJhbTxUYXJnZXRQYXJhbVR5cGU+KCd0YXJnZXQnKVxuXG4gICAgICBpZiAodGFyZ2V0ID09PSB1bmRlZmluZWQpIHsgdGhyb3cgbmV3IEVycm9yKCdUYXJnZXQgdW5kZWZpbmVkJykgfVxuICAgICAgaWYgKGJ1aWxkZXJQYXJhbSA9PT0gdW5kZWZpbmVkKSB7IHRocm93IG5ldyBFcnJvcignQnVpbGRlciB1bmRlZmluZWQnKSB9XG5cbiAgICAgIHRoaXMudXBpLnNldFN0YXR1cyh7XG4gICAgICAgIHN0YXR1czogJ3Byb2dyZXNzJyxcbiAgICAgICAgcHJvZ3Jlc3M6IG9wdHMub25Qcm9ncmVzcyA/IDAuMCA6IHVuZGVmaW5lZCxcbiAgICAgICAgZGV0YWlsOiAnJyxcbiAgICAgIH0pXG5cbiAgICAgIGNvbnN0IGNhYmFsUm9vdCA9IGF3YWl0IFV0aWwuZ2V0Um9vdERpcih0YXJnZXQuZGlyID8gdGFyZ2V0LmRpciA6IHRoaXMuZ2V0QWN0aXZlUHJvamVjdFBhdGgoKSlcblxuICAgICAgY29uc3QgW2NhYmFsRmlsZV06IEZpbGVbXSA9IGNhYmFsUm9vdC5nZXRFbnRyaWVzU3luYygpLmZpbHRlcihpc0NhYmFsRmlsZSlcblxuICAgICAgaWYgKCFjYWJhbEZpbGUpIHsgdGhyb3cgbmV3IEVycm9yKCdObyBjYWJhbCBmaWxlIGZvdW5kJykgfVxuXG4gICAgICBsZXQgbmV3VGFyZ2V0OiBUYXJnZXRQYXJhbVR5cGVQYXJ0aWFsID0geyAuLi50YXJnZXQgfVxuXG4gICAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6dG90YWxpdHktY2hlY2tcbiAgICAgIGlmICh0YXJnZXQudHlwZSA9PT0gJ2F1dG8nKSB7XG4gICAgICAgIGNvbnN0IGNhYmFsQ29udGVudHMgPSBhd2FpdCBjYWJhbEZpbGUucmVhZCgpXG4gICAgICAgIGNvbnN0IHRndHMgPSBhd2FpdCB0aGlzLmdldEFjdGl2ZVByb2plY3RUYXJnZXQoY2FiYWxDb250ZW50cywgY2FiYWxSb290KVxuICAgICAgICBjb25zdCBbdGd0XSA9IHRndHNcbiAgICAgICAgaWYgKHRndCkge1xuICAgICAgICAgIGNvbnN0IGNmID0gYXdhaXQgVXRpbC5wYXJzZURvdENhYmFsKGNhYmFsQ29udGVudHMpXG4gICAgICAgICAgaWYgKGNmKSB7XG4gICAgICAgICAgICBuZXdUYXJnZXQgPSB7XG4gICAgICAgICAgICAgIHByb2plY3Q6IGNmLm5hbWUsXG4gICAgICAgICAgICAgIGRpcjogY2FiYWxSb290LmdldFBhdGgoKSxcbiAgICAgICAgICAgICAgdHlwZTogJ2NvbXBvbmVudCcsXG4gICAgICAgICAgICAgIGNvbXBvbmVudDogdGd0LFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgY29uc3QgYnVpbGRlcnM6IFRCdWlsZGVycyA9IHtcbiAgICAgICAgJ2NhYmFsLW5peCc6IEJ1aWxkZXJzLkNhYmFsTml4LFxuICAgICAgICAnY2FiYWwnOiBCdWlsZGVycy5DYWJhbCxcbiAgICAgICAgJ3N0YWNrJzogQnVpbGRlcnMuU3RhY2ssXG4gICAgICAgICdub25lJzogQnVpbGRlcnMuTm9uZSxcbiAgICAgIH1cbiAgICAgIGNvbnN0IGJ1aWxkZXIgPSBidWlsZGVyc1tidWlsZGVyUGFyYW0ubmFtZV1cblxuICAgICAgaWYgKGJ1aWxkZXIgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFVua25vd24gYnVpbGRlciAnJHsoYnVpbGRlclBhcmFtICYmIGJ1aWxkZXJQYXJhbS5uYW1lKSB8fCBidWlsZGVyUGFyYW19J2ApXG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IChuZXcgYnVpbGRlcih7IG9wdHMsIHRhcmdldDogbmV3VGFyZ2V0LCBjYWJhbFJvb3QgfSkpLnJ1bkNvbW1hbmQoY21kKVxuICAgICAgLy8gc2VlIENhYmFsUHJvY2VzcyBmb3IgZXhwbGFpbmF0aW9uXG4gICAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6IG5vLW51bGwta2V5d29yZFxuICAgICAgaWYgKHJlcy5leGl0Q29kZSA9PT0gbnVsbCkgeyAvLyB0aGlzIG1lYW5zIHByb2Nlc3Mgd2FzIGtpbGxlZFxuICAgICAgICB0aGlzLnVwaS5zZXRTdGF0dXMoeyBzdGF0dXM6ICd3YXJuaW5nJywgZGV0YWlsOiAnQnVpbGQgd2FzIGludGVycnVwdGVkJyB9KVxuICAgICAgfSBlbHNlIGlmIChyZXMuZXhpdENvZGUgIT09IDApIHtcbiAgICAgICAgaWYgKHJlcy5oYXNFcnJvcikge1xuICAgICAgICAgIHRoaXMudXBpLnNldFN0YXR1cyh7IHN0YXR1czogJ3dhcm5pbmcnLCBkZXRhaWw6ICdUaGVyZSB3ZXJlIGVycm9ycyBpbiBzb3VyY2UgZmlsZXMnIH0pXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy51cGkuc2V0U3RhdHVzKHtcbiAgICAgICAgICAgIHN0YXR1czogJ2Vycm9yJyxcbiAgICAgICAgICAgIGRldGFpbDogYEJ1aWxkZXIgcXVpdCBhYm5vcm1hbGx5IHdpdGggZXhpdCBjb2RlICR7cmVzLmV4aXRDb2RlfWAsXG4gICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy51cGkuc2V0U3RhdHVzKHsgc3RhdHVzOiAncmVhZHknLCBkZXRhaWw6ICdCdWlsZCB3YXMgc3VjY2Vzc2Z1bCcgfSlcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgaWYgKGVycm9yKSB7XG4gICAgICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTogbm8tY29uc29sZVxuICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKVxuICAgICAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6IG5vLXVuc2FmZS1hbnlcbiAgICAgICAgdGhpcy51cGkuc2V0U3RhdHVzKHsgc3RhdHVzOiAnZXJyb3InLCBkZXRhaWw6IGVycm9yLnRvU3RyaW5nKCkgfSlcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMudXBpLnNldFN0YXR1cyh7IHN0YXR1czogJ3dhcm5pbmcnLCBkZXRhaWw6ICdCdWlsZCBmYWlsZWQgd2l0aCBubyBlcnJvcnMnIH0pXG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMucnVubmluZyA9IGZhbHNlXG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHJ1bkNhYmFsQ29tbWFuZChjb21tYW5kOiBDYWJhbENvbW1hbmQpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCB7IG1lc3NhZ2VUeXBlcywgZGVmYXVsdFNldmVyaXR5LCBjYW5DYW5jZWwgfSA9IGNvbW1hbmRPcHRpb25zW2NvbW1hbmRdXG4gICAgY29uc3QgbWVzc2FnZXM6IFVQSS5JUmVzdWx0SXRlbVtdID0gW11cbiAgICB0aGlzLnVwaS5zZXRNZXNzYWdlcyhtZXNzYWdlcylcblxuICAgIGxldCBjYW5jZWxBY3Rpb25EaXNwOiBEaXNwb3NhYmxlIHwgdW5kZWZpbmVkXG5cbiAgICBhd2FpdCB0aGlzLmNhYmFsQnVpbGQoY29tbWFuZCwge1xuICAgICAgc2V2ZXJpdHk6IGRlZmF1bHRTZXZlcml0eSxcbiAgICAgIHNldENhbmNlbEFjdGlvbjpcbiAgICAgIGNhbkNhbmNlbCA/XG4gICAgICAgIChhY3Rpb246ICgpID0+IHZvaWQpID0+IHtcbiAgICAgICAgICBjYW5jZWxBY3Rpb25EaXNwICYmIGNhbmNlbEFjdGlvbkRpc3AuZGlzcG9zZSgpXG4gICAgICAgICAgY2FuY2VsQWN0aW9uRGlzcCA9IHRoaXMudXBpLmFkZFBhbmVsQ29udHJvbCh7XG4gICAgICAgICAgICBlbGVtZW50OiAnaWRlLWhhc2tlbGwtYnV0dG9uJyxcbiAgICAgICAgICAgIG9wdHM6IHtcbiAgICAgICAgICAgICAgY2xhc3NlczogWydjYW5jZWwnXSxcbiAgICAgICAgICAgICAgZXZlbnRzOiB7XG4gICAgICAgICAgICAgICAgY2xpY2s6IGFjdGlvbixcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSlcbiAgICAgICAgfSA6IHVuZGVmaW5lZCxcbiAgICAgIG9uTXNnOiAobWVzc2FnZTogVVBJLklSZXN1bHRJdGVtKSA9PiB7XG4gICAgICAgIGlmIChtZXNzYWdlVHlwZXMuaW5jbHVkZXMobWVzc2FnZS5zZXZlcml0eSkpIHtcbiAgICAgICAgICBtZXNzYWdlcy5wdXNoKG1lc3NhZ2UpXG4gICAgICAgICAgdGhpcy51cGkuc2V0TWVzc2FnZXMobWVzc2FnZXMpXG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBvblByb2dyZXNzOlxuICAgICAgY2FuQ2FuY2VsXG4gICAgICAgID8gKHByb2dyZXNzOiBudW1iZXIpID0+IHRoaXMudXBpLnNldFN0YXR1cyh7IHN0YXR1czogJ3Byb2dyZXNzJywgcHJvZ3Jlc3MsIGRldGFpbDogYCR7Y29tbWFuZH0gaW4gcHJvZ3Jlc3NgIH0pXG4gICAgICAgIDogdW5kZWZpbmVkLFxuICAgIH0pXG4gICAgY2FuY2VsQWN0aW9uRGlzcCAmJiBjYW5jZWxBY3Rpb25EaXNwLmRpc3Bvc2UoKVxuICB9XG59XG4iXX0=