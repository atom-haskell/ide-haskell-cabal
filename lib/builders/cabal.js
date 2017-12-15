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
        const comp = (this.opts.target.target && this.opts.target.target.target)
            || this.opts.target.component;
        if (comp) {
            this.cabalArgs.push(comp);
        }
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
    async createSandbox() {
        return cabal_process_1.runCabalProcess('cabal', ['sandbox', 'init'], this.spawnOpts, this.opts.opts);
    }
    async commonBuild() {
        this.cabalArgs.push('--builddir=' + this.getConfigOpt('buildDir'));
        return this.runCabal();
    }
}
exports.Builder = Builder;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FiYWwuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvYnVpbGRlcnMvY2FiYWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxpQ0FBOEM7QUFFOUMsbURBQWlEO0FBRWpELGFBQXFCLFNBQVEsa0JBQVc7SUFDdEMsWUFBWSxJQUFjO1FBQ3hCLEtBQUssQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUE7SUFDdEIsQ0FBQztJQUVNLEtBQUssQ0FBQyxLQUFLO1FBQ2hCLElBQUksQ0FBQyxTQUFTLEdBQUcsQ0FBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLENBQUE7UUFDcEMsTUFBTSxJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQztlQUN4RCxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUE7UUFDMUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUNULElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFBO1FBQzNCLENBQUM7UUFDRCxNQUFNLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFBO0lBQzNCLENBQUM7SUFDTSxLQUFLLENBQUMsSUFBSTtRQUNmLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGdCQUFnQixHQUFHLEVBQUUsQ0FBQTtRQUNwQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRywrQkFBK0IsQ0FBQTtRQUMxRixJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEdBQUcsT0FBTyxDQUFBO1FBQ2pDLElBQUksQ0FBQyxTQUFTLEdBQUcsQ0FBQyxNQUFNLEVBQUUs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QUUsSUFBSSxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFBO0lBQ3RGLENBQUM7SUFFTyxLQUFLLENBQUMsV0FBVztRQUN2QixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFBO1FBQ2xFLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUE7SUFDeEIsQ0FBQztDQUNGO0FBN0VELDBCQTZFQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEN0b3JPcHRzLCBCdWlsZGVyQmFzZSB9IGZyb20gJy4vYmFzZSdcblxuaW1wb3J0IHsgcnVuQ2FiYWxQcm9jZXNzIH0gZnJvbSAnLi9jYWJhbC1wcm9jZXNzJ1xuXG5leHBvcnQgY2xhc3MgQnVpbGRlciBleHRlbmRzIEJ1aWxkZXJCYXNlIHtcbiAgY29uc3RydWN0b3Iob3B0czogQ3Rvck9wdHMpIHtcbiAgICBzdXBlcignY2FiYWwnLCBvcHRzKVxuICB9XG5cbiAgcHVibGljIGFzeW5jIGJ1aWxkKCkge1xuICAgIHRoaXMuY2FiYWxBcmdzID0gWydidWlsZCcsICctLW9ubHknXVxuICAgIGNvbnN0IGNvbXAgPSAodGhpcy5vcHRzLnRhcmdldC50YXJnZXQgJiYgdGhpcy5vcHRzLnRhcmdldC50YXJnZXQudGFyZ2V0KVxuICAgICAgICAgICAgICAgICB8fCB0aGlzLm9wdHMudGFyZ2V0LmNvbXBvbmVudFxuICAgIGlmIChjb21wKSB7XG4gICAgICB0aGlzLmNhYmFsQXJncy5wdXNoKGNvbXApXG4gICAgfVxuICAgIHJldHVybiB0aGlzLmNvbW1vbkJ1aWxkKClcbiAgfVxuICBwdWJsaWMgYXN5bmMgdGVzdCgpIHtcbiAgICB0aGlzLm9wdHMub3B0cy5zZXZlcml0eUNoYW5nZVJ4ID0ge31cbiAgICB0aGlzLm9wdHMub3B0cy5zZXZlcml0eUNoYW5nZVJ4W3RoaXMub3B0cy5vcHRzLnNldmVyaXR5XSA9IC9SdW5uaW5nIFxcZCsgdGVzdCBzdWl0ZXNcXC5cXC5cXC4vXG4gICAgdGhpcy5vcHRzLm9wdHMuc2V2ZXJpdHkgPSAnYnVpbGQnXG4gICAgdGhpcy5jYWJhbEFyZ3MgPSBbJ3Rlc3QnLCAnLS1vbmx5JywgJy0tc2hvdy1kZXRhaWxzPWFsd2F5cyddXG4gICAgcmV0dXJuIHRoaXMuY29tbW9uQnVpbGQoKVxuICB9XG4gIHB1YmxpYyBhc3luYyBiZW5jaCgpIHtcbiAgICB0aGlzLm9wdHMub3B0cy5zZXZlcml0eUNoYW5nZVJ4ID0ge31cbiAgICB0aGlzLm9wdHMub3B0cy5zZXZlcml0eUNoYW5nZVJ4W3RoaXMub3B0cy5vcHRzLnNldmVyaXR5XSA9IC9SdW5uaW5nIFxcZCsgYmVuY2htYXJrc1xcLlxcLlxcLi9cbiAgICB0aGlzLm9wdHMub3B0cy5zZXZlcml0eSA9ICdidWlsZCdcbiAgICB0aGlzLmNhYmFsQXJncyA9IFsnYmVuY2gnLCAnLS1vbmx5JywgJy0tc2hvdy1kZXRhaWxzPWFsd2F5cyddXG4gICAgcmV0dXJuIHRoaXMuY29tbW9uQnVpbGQoKVxuICB9XG4gIHB1YmxpYyBhc3luYyBjbGVhbigpIHtcbiAgICB0aGlzLmNhYmFsQXJncyA9IFsnY2xlYW4nLCAnLS1zYXZlLWNvbmZpZ3VyZSddXG4gICAgcmV0dXJuIHRoaXMuY29tbW9uQnVpbGQoKVxuICB9XG4gIHB1YmxpYyBhc3luYyBkZXBzKCkge1xuICAgIGNvbnN0IGlnbnMgPSBhdG9tLmNvbmZpZy5nZXQoJ2lkZS1oYXNrZWxsLWNhYmFsLmNhYmFsLmlnbm9yZU5vU2FuZGJveCcpXG4gICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOiBuby1zdHJpbmctbGl0ZXJhbFxuICAgIGNvbnN0IHNhbmRib3hDb25maWcgPSB0aGlzLnNwYXduT3B0cy5lbnZbJ0NBQkFMX1NBTkRCT1hfQ09ORklHJ10gfHwgJ2NhYmFsLnNhbmRib3guY29uZmlnJ1xuICAgIGNvbnN0IHNlID0gdGhpcy5vcHRzLmNhYmFsUm9vdC5nZXRGaWxlKHNhbmRib3hDb25maWcpLmV4aXN0c1N5bmMoKVxuICAgIGlmICghKHNlIHx8IGlnbnMpKSB7XG4gICAgICBjb25zdCByZXMgPSBhd2FpdCBuZXcgUHJvbWlzZTx7IGV4aXRDb2RlOiBudW1iZXIsIGhhc0Vycm9yOiBib29sZWFuIH0+KChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgY29uc3Qgbm90aWZpY2F0aW9uID0gYXRvbS5ub3RpZmljYXRpb25zLmFkZFdhcm5pbmcoJ05vIHNhbmRib3ggZm91bmQsIHN0b3BwaW5nJywge1xuICAgICAgICAgIGRpc21pc3NhYmxlOiB0cnVlLFxuICAgICAgICAgIGRldGFpbDogJ2lkZS1oYXNrZWxsLWNhYmFsIGRpZCBub3QgZmluZCBzYW5kYm94IGNvbmZpZ3VyYXRpb24gJyArXG4gICAgICAgICAgJ2ZpbGUuIEluc3RhbGxpbmcgZGVwZW5kZW5jaWVzIHdpdGhvdXQgc2FuZGJveCBpcyAnICtcbiAgICAgICAgICAnZGFuZ2Vyb3VzIGFuZCBpcyBub3QgcmVjb21tZW5kZWQuIEl0IGlzIHN1Z2dlc3RlZCB0byAnICtcbiAgICAgICAgICAnY3JlYXRlIGEgc2FuZGJveCByaWdodCBub3cuJyxcbiAgICAgICAgICBidXR0b25zOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGNsYXNzTmFtZTogJ2ljb24gaWNvbi1yb2NrZXQnLFxuICAgICAgICAgICAgICB0ZXh0OiAnQ2xpY2sgaGVyZSB0byBjcmVhdGUgdGhlIHNhbmRib3gnLFxuICAgICAgICAgICAgICBvbkRpZENsaWNrOiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh0aGlzLmNyZWF0ZVNhbmRib3goKSlcbiAgICAgICAgICAgICAgICBub3RpZmljYXRpb24uZGlzbWlzcygpXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIF0sXG4gICAgICAgIH0pXG4gICAgICAgIGNvbnN0IGRpc3AgPSBub3RpZmljYXRpb24ub25EaWREaXNtaXNzKCgpID0+IHtcbiAgICAgICAgICBkaXNwLmRpc3Bvc2UoKVxuICAgICAgICAgIHJlamVjdCgpXG4gICAgICAgIH0pXG4gICAgICB9KVxuICAgICAgaWYgKHJlcy5leGl0Q29kZSAhPT0gMCkge1xuICAgICAgICByZXR1cm4gcmVzXG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuY2FiYWxBcmdzID0gWydpbnN0YWxsJywgJy0tb25seS1kZXBlbmRlbmNpZXMnLCAnLS1lbmFibGUtdGVzdHMnLCAnLS1lbmFibGUtYmVuY2htYXJrcyddXG4gICAgcmV0dXJuIHRoaXMuY29tbW9uQnVpbGQoKVxuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBjcmVhdGVTYW5kYm94KCkge1xuICAgIHJldHVybiBydW5DYWJhbFByb2Nlc3MoJ2NhYmFsJywgWydzYW5kYm94JywgJ2luaXQnXSwgdGhpcy5zcGF3bk9wdHMsIHRoaXMub3B0cy5vcHRzKVxuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBjb21tb25CdWlsZCgpIHtcbiAgICB0aGlzLmNhYmFsQXJncy5wdXNoKCctLWJ1aWxkZGlyPScgKyB0aGlzLmdldENvbmZpZ09wdCgnYnVpbGREaXInKSlcbiAgICByZXR1cm4gdGhpcy5ydW5DYWJhbCgpXG4gIH1cbn1cbiJdfQ==