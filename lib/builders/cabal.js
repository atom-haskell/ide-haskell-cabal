"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const base_1 = require("./base");
const cabal_process_1 = require("./cabal-process");
class Builder extends base_1.BuilderBase {
    constructor(opts) {
        super('cabal', opts);
    }
    async build() {
        this.cabalArgs = ['build', '--only'];
        this.component();
        return this.commonBuild();
    }
    async test() {
        this.opts.opts.severityChangeRx = {};
        this.opts.opts.severityChangeRx[this.opts.opts.severity] = /Running \d+ test suites\.\.\./;
        this.opts.opts.severity = 'build';
        this.cabalArgs = ['test', '--only', '--show-details=always'];
        return this.commonBuild();
    }
    async bench() {
        this.opts.opts.severityChangeRx = {};
        this.opts.opts.severityChangeRx[this.opts.opts.severity] = /Running \d+ benchmarks\.\.\./;
        this.opts.opts.severity = 'build';
        this.cabalArgs = ['bench', '--only', '--show-details=always'];
        return this.commonBuild();
    }
    async clean() {
        this.cabalArgs = ['clean', '--save-configure'];
        return this.commonBuild();
    }
    async deps() {
        const igns = atom.config.get('ide-haskell-cabal.cabal.ignoreNoSandbox');
        const sandboxConfig = this.spawnOpts.env['CABAL_SANDBOX_CONFIG'] || 'cabal.sandbox.config';
        const se = this.opts.cabalRoot.getFile(sandboxConfig).existsSync();
        if (!(se || igns)) {
            const res = await new Promise((resolve, reject) => {
                const notification = atom.notifications.addWarning('No sandbox found, stopping', {
                    dismissable: true,
                    detail: 'ide-haskell-cabal did not find sandbox configuration ' +
                        'file. Installing dependencies without sandbox is ' +
                        'dangerous and is not recommended. It is suggested to ' +
                        'create a sandbox right now.',
                    buttons: [
                        {
                            className: 'icon icon-rocket',
                            text: 'Click here to create the sandbox',
                            onDidClick: () => {
                                resolve(this.createSandbox());
                                notification.dismiss();
                            },
                        },
                    ],
                });
                const disp = notification.onDidDismiss(() => {
                    disp.dispose();
                    reject();
                });
            });
            if (res.exitCode !== 0) {
                return res;
            }
        }
        this.cabalArgs = ['install', '--only-dependencies', '--enable-tests', '--enable-benchmarks'];
        return this.commonBuild();
    }
    component() {
        switch (this.opts.target.type) {
            case 'all':
                this.cabalArgs.push(...this.opts.target.targets.map(x => x.target));
                break;
            case 'component':
                this.cabalArgs.push(this.opts.target.component);
                break;
            case 'auto':
                break;
        }
    }
    async createSandbox() {
        return cabal_process_1.runCabalProcess('cabal', ['sandbox', 'init'], this.spawnOpts, this.opts.opts);
    }
    async commonBuild() {
        this.cabalArgs.push('--builddir=' + this.getConfigOpt('buildDir'));
        return this.runCabal();
    }
}
exports.Builder = Builder;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FiYWwuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvYnVpbGRlcnMvY2FiYWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxpQ0FBOEM7QUFFOUMsbURBQWlEO0FBRWpELGFBQXFCLFNBQVEsa0JBQVc7SUFDdEMsWUFBWSxJQUFjO1FBQ3hCLEtBQUssQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUE7SUFDdEIsQ0FBQztJQUVNLEtBQUssQ0FBQyxLQUFLO1FBQ2hCLElBQUksQ0FBQyxTQUFTLEdBQUcsQ0FBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLENBQUE7UUFDcEMsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFBO1FBQ2hCLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUE7SUFDM0IsQ0FBQztJQUNNLEtBQUssQ0FBQyxJQUFJO1FBQ2YsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsRUFBRSxDQUFBO1FBQ3BDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLCtCQUErQixDQUFBO1FBQzFGLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsR0FBRyxPQUFPLENBQUE7UUFDakMsSUFBSSxDQUFDLFNBQVMsR0FBRyxDQUFDLE1BQU0sRUFBRSxRQUFRLEVBQUUsdUJBQXVCLENBQUMsQ0FBQTtRQUM1RCxNQUFNLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFBO0lBQzNCLENBQUM7SUFDTSxLQUFLLENBQUMsS0FBSztRQUNoQixJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxFQUFFLENBQUE7UUFDcEMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENB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QUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFBO2dCQUMvQyxLQUFLLENBQUE7WUFDUCxLQUFLLE1BQU07Z0JBQ1QsS0FBSyxDQUFBO1FBQ1QsQ0FBQztJQUNILENBQUM7SUFFTyxLQUFLLENBQUMsYUFBYTtRQUN6QixNQUFNLENBQUMsK0JBQWUsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxTQUFTLEVBQUUsTUFBTSxDQUFDLEVBQUUsSUFBSSxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFBO0lBQ3RGLENBQUM7SUFFTyxLQUFLLENBQUMsV0FBVztRQUN2QixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFBO1FBQ2xFLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUE7SUFDeEIsQ0FBQztDQUNGO0FBdEZELDBCQXNGQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEN0b3JPcHRzLCBCdWlsZGVyQmFzZSB9IGZyb20gJy4vYmFzZSdcblxuaW1wb3J0IHsgcnVuQ2FiYWxQcm9jZXNzIH0gZnJvbSAnLi9jYWJhbC1wcm9jZXNzJ1xuXG5leHBvcnQgY2xhc3MgQnVpbGRlciBleHRlbmRzIEJ1aWxkZXJCYXNlIHtcbiAgY29uc3RydWN0b3Iob3B0czogQ3Rvck9wdHMpIHtcbiAgICBzdXBlcignY2FiYWwnLCBvcHRzKVxuICB9XG5cbiAgcHVibGljIGFzeW5jIGJ1aWxkKCkge1xuICAgIHRoaXMuY2FiYWxBcmdzID0gWydidWlsZCcsICctLW9ubHknXVxuICAgIHRoaXMuY29tcG9uZW50KClcbiAgICByZXR1cm4gdGhpcy5jb21tb25CdWlsZCgpXG4gIH1cbiAgcHVibGljIGFzeW5jIHRlc3QoKSB7XG4gICAgdGhpcy5vcHRzLm9wdHMuc2V2ZXJpdHlDaGFuZ2VSeCA9IHt9XG4gICAgdGhpcy5vcHRzLm9wdHMuc2V2ZXJpdHlDaGFuZ2VSeFt0aGlzLm9wdHMub3B0cy5zZXZlcml0eV0gPSAvUnVubmluZyBcXGQrIHRlc3Qgc3VpdGVzXFwuXFwuXFwuL1xuICAgIHRoaXMub3B0cy5vcHRzLnNldmVyaXR5ID0gJ2J1aWxkJ1xuICAgIHRoaXMuY2FiYWxBcmdzID0gWyd0ZXN0JywgJy0tb25seScsICctLXNob3ctZGV0YWlscz1hbHdheXMnXVxuICAgIHJldHVybiB0aGlzLmNvbW1vbkJ1aWxkKClcbiAgfVxuICBwdWJsaWMgYXN5bmMgYmVuY2goKSB7XG4gICAgdGhpcy5vcHRzLm9wdHMuc2V2ZXJpdHlDaGFuZ2VSeCA9IHt9XG4gICAgdGhpcy5vcHRzLm9wdHMuc2V2ZXJpdHlDaGFuZ2VSeFt0aGlzLm9wdHMub3B0cy5zZXZlcml0eV0gPSAvUnVubmluZyBcXGQrIGJlbmNobWFya3NcXC5cXC5cXC4vXG4gICAgdGhpcy5vcHRzLm9wdHMuc2V2ZXJpdHkgPSAnYnVpbGQnXG4gICAgdGhpcy5jYWJhbEFyZ3MgPSBbJ2JlbmNoJywgJy0tb25seScsICctLXNob3ctZGV0YWlscz1hbHdheXMnXVxuICAgIHJldHVybiB0aGlzLmNvbW1vbkJ1aWxkKClcbiAgfVxuICBwdWJsaWMgYXN5bmMgY2xlYW4oKSB7XG4gICAgdGhpcy5jYWJhbEFyZ3MgPSBbJ2NsZWFuJywgJy0tc2F2ZS1jb25maWd1cmUnXVxuICAgIHJldHVybiB0aGlzLmNvbW1vbkJ1aWxkKClcbiAgfVxuICBwdWJsaWMgYXN5bmMgZGVwcygpIHtcbiAgICBjb25zdCBpZ25zID0gYXRvbS5jb25maWcuZ2V0KCdpZGUtaGFza2VsbC1jYWJhbC5jYWJhbC5pZ25vcmVOb1NhbmRib3gnKVxuICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTogbm8tc3RyaW5nLWxpdGVyYWxcbiAgICBjb25zdCBzYW5kYm94Q29uZmlnID0gdGhpcy5zcGF3bk9wdHMuZW52WydDQUJBTF9TQU5EQk9YX0NPTkZJRyddIHx8ICdjYWJhbC5zYW5kYm94LmNvbmZpZydcbiAgICBjb25zdCBzZSA9IHRoaXMub3B0cy5jYWJhbFJvb3QuZ2V0RmlsZShzYW5kYm94Q29uZmlnKS5leGlzdHNTeW5jKClcbiAgICBpZiAoIShzZSB8fCBpZ25zKSkge1xuICAgICAgY29uc3QgcmVzID0gYXdhaXQgbmV3IFByb21pc2U8eyBleGl0Q29kZTogbnVtYmVyLCBoYXNFcnJvcjogYm9vbGVhbiB9PigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIGNvbnN0IG5vdGlmaWNhdGlvbiA9IGF0b20ubm90aWZpY2F0aW9ucy5hZGRXYXJuaW5nKCdObyBzYW5kYm94IGZvdW5kLCBzdG9wcGluZycsIHtcbiAgICAgICAgICBkaXNtaXNzYWJsZTogdHJ1ZSxcbiAgICAgICAgICBkZXRhaWw6ICdpZGUtaGFza2VsbC1jYWJhbCBkaWQgbm90IGZpbmQgc2FuZGJveCBjb25maWd1cmF0aW9uICcgK1xuICAgICAgICAgICdmaWxlLiBJbnN0YWxsaW5nIGRlcGVuZGVuY2llcyB3aXRob3V0IHNhbmRib3ggaXMgJyArXG4gICAgICAgICAgJ2Rhbmdlcm91cyBhbmQgaXMgbm90IHJlY29tbWVuZGVkLiBJdCBpcyBzdWdnZXN0ZWQgdG8gJyArXG4gICAgICAgICAgJ2NyZWF0ZSBhIHNhbmRib3ggcmlnaHQgbm93LicsXG4gICAgICAgICAgYnV0dG9uczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBjbGFzc05hbWU6ICdpY29uIGljb24tcm9ja2V0JyxcbiAgICAgICAgICAgICAgdGV4dDogJ0NsaWNrIGhlcmUgdG8gY3JlYXRlIHRoZSBzYW5kYm94JyxcbiAgICAgICAgICAgICAgb25EaWRDbGljazogKCkgPT4ge1xuICAgICAgICAgICAgICAgIHJlc29sdmUodGhpcy5jcmVhdGVTYW5kYm94KCkpXG4gICAgICAgICAgICAgICAgbm90aWZpY2F0aW9uLmRpc21pc3MoKVxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICBdLFxuICAgICAgICB9KVxuICAgICAgICBjb25zdCBkaXNwID0gbm90aWZpY2F0aW9uLm9uRGlkRGlzbWlzcygoKSA9PiB7XG4gICAgICAgICAgZGlzcC5kaXNwb3NlKClcbiAgICAgICAgICByZWplY3QoKVxuICAgICAgICB9KVxuICAgICAgfSlcbiAgICAgIGlmIChyZXMuZXhpdENvZGUgIT09IDApIHtcbiAgICAgICAgcmV0dXJuIHJlc1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLmNhYmFsQXJncyA9IFsnaW5zdGFsbCcsICctLW9ubHktZGVwZW5kZW5jaWVzJywgJy0tZW5hYmxlLXRlc3RzJywgJy0tZW5hYmxlLWJlbmNobWFya3MnXVxuICAgIHJldHVybiB0aGlzLmNvbW1vbkJ1aWxkKClcbiAgfVxuXG4gIHByaXZhdGUgY29tcG9uZW50KCkge1xuICAgIHN3aXRjaCAodGhpcy5vcHRzLnRhcmdldC50eXBlKSB7XG4gICAgICBjYXNlICdhbGwnOlxuICAgICAgICB0aGlzLmNhYmFsQXJncy5wdXNoKC4uLnRoaXMub3B0cy50YXJnZXQudGFyZ2V0cy5tYXAoeCA9PiB4LnRhcmdldCkpXG4gICAgICAgIGJyZWFrXG4gICAgICBjYXNlICdjb21wb25lbnQnOlxuICAgICAgICB0aGlzLmNhYmFsQXJncy5wdXNoKHRoaXMub3B0cy50YXJnZXQuY29tcG9uZW50KVxuICAgICAgICBicmVha1xuICAgICAgY2FzZSAnYXV0byc6XG4gICAgICAgIGJyZWFrXG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBjcmVhdGVTYW5kYm94KCkge1xuICAgIHJldHVybiBydW5DYWJhbFByb2Nlc3MoJ2NhYmFsJywgWydzYW5kYm94JywgJ2luaXQnXSwgdGhpcy5zcGF3bk9wdHMsIHRoaXMub3B0cy5vcHRzKVxuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBjb21tb25CdWlsZCgpIHtcbiAgICB0aGlzLmNhYmFsQXJncy5wdXNoKCctLWJ1aWxkZGlyPScgKyB0aGlzLmdldENvbmZpZ09wdCgnYnVpbGREaXInKSlcbiAgICByZXR1cm4gdGhpcy5ydW5DYWJhbCgpXG4gIH1cbn1cbiJdfQ==