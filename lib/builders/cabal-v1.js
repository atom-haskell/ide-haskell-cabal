"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const process_1 = require("./base/process");
const cabal_1 = require("./base/cabal");
class Builder extends cabal_1.CabalBase {
    constructor(opts) {
        super(opts);
    }
    async build() {
        return this.commonBuild('build', ['--only', ...this.component()]);
    }
    async test() {
        const severityChangeRx = {};
        severityChangeRx[this.opts.params.severity] = /Running \d+ test suites\.\.\./;
        return this.commonBuild('test', ['--only', '--show-details=always'], {
            severityChangeRx,
            severity: 'build',
        });
    }
    async bench() {
        const severityChangeRx = {};
        severityChangeRx[this.opts.params.severity] = /Running \d+ benchmarks\.\.\./;
        return this.commonBuild('bench', ['--only', '--show-details=always'], {
            severityChangeRx,
            severity: 'build',
        });
    }
    async clean() {
        return this.commonBuild('clean', ['--save-configure']);
    }
    async deps() {
        const igns = atom.config.get('ide-haskell-cabal.cabal.ignoreNoSandbox');
        const sandboxConfig = this.getSpawnOpts().env.CABAL_SANDBOX_CONFIG || 'cabal.sandbox.config';
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
        return this.commonBuild('install', [
            '--only-dependencies',
            '--enable-tests',
            '--enable-benchmarks',
        ]);
    }
    additionalEnvSetup(env) {
        env = super.additionalEnvSetup(env);
        const sandboxConfig = cabal_1.getCabalOpts().sandbox;
        if (sandboxConfig !== '') {
            env.CABAL_SANDBOX_CONFIG = sandboxConfig;
        }
        return env;
    }
    async withPrefix(cmd) {
        return super.withPrefix(cmd, { oldprefix: '', newprefix: 'v1-' });
    }
    async createSandbox() {
        return process_1.runProcess('cabal', [await this.withPrefix('sandbox'), 'init'], this.getSpawnOpts(), this.opts.params);
    }
    async commonBuild(command, args, override = {}) {
        return this.runCabal([
            await this.withPrefix(command),
            ...args,
            '--builddir=' + cabal_1.getCabalOpts().buildDir,
        ], override);
    }
}
exports.Builder = Builder;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FiYWwtdjEuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvYnVpbGRlcnMvY2FiYWwtdjEudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFDQSw0Q0FBb0Q7QUFDcEQsd0NBQXNEO0FBRXRELE1BQWEsT0FBUSxTQUFRLGlCQUFTO0lBQ3BDLFlBQVksSUFBYztRQUN4QixLQUFLLENBQUMsSUFBSSxDQUFDLENBQUE7SUFDYixDQUFDO0lBRU0sS0FBSyxDQUFDLEtBQUs7UUFDaEIsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDLE9BQU8sRUFBRSxDQUFDLFFBQVEsRUFBRSxHQUFHLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDLENBQUE7SUFDbkUsQ0FBQztJQUNNLEtBQUssQ0FBQyxJQUFJO1FBQ2YsTUFBTSxnQkFBZ0IsR0FBRyxFQUFFLENBQUE7UUFDM0IsZ0JBQWdCLENBQ2QsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUMxQixHQUFHLCtCQUErQixDQUFBO1FBQ25DLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxRQUFRLEVBQUUsdUJBQXVCLENBQUMsRUFBRTtZQUNuRSxnQkFBZ0I7WUFDaEIsUUFBUSxFQUFFLE9BQU87U0FDbEIsQ0FBQyxDQUFBO0lBQ0osQ0FBQztJQUNNLEtBQUssQ0FBQyxLQUFLO1FBQ2hCLE1BQU0sZ0JBQWdCLEdBQUcsRUFBRSxDQUFBO1FBQzNCLGdCQUFnQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxHQUFHLDhCQUE4QixDQUFBO1FBQzVFLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxRQUFRLEVBQUUsdUJBQXVCLENBQUMsRUFBRTtZQUNwRSxnQkFBZ0I7WUFDaEIsUUFBUSxFQUFFLE9BQU87U0FDbEIsQ0FBQyxDQUFBO0lBQ0osQ0FBQztJQUNNLEtBQUssQ0FBQyxLQUFLO1FB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Q0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDO1lBQzlCLEdBQUcsSUFBSTtZQUNQLGFBQWEsR0FBRyxvQkFBWSxFQUFFLENBQUMsUUFBUTtTQUN4QyxFQUNELFFBQVEsQ0FDVCxDQUFBO0lBQ0gsQ0FBQztDQUNGO0FBakhELDBCQWlIQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEN0b3JPcHRzIH0gZnJvbSAnLi9iYXNlJ1xuaW1wb3J0IHsgcnVuUHJvY2VzcywgSVBhcmFtcyB9IGZyb20gJy4vYmFzZS9wcm9jZXNzJ1xuaW1wb3J0IHsgQ2FiYWxCYXNlLCBnZXRDYWJhbE9wdHMgfSBmcm9tICcuL2Jhc2UvY2FiYWwnXG5cbmV4cG9ydCBjbGFzcyBCdWlsZGVyIGV4dGVuZHMgQ2FiYWxCYXNlIHtcbiAgY29uc3RydWN0b3Iob3B0czogQ3Rvck9wdHMpIHtcbiAgICBzdXBlcihvcHRzKVxuICB9XG5cbiAgcHVibGljIGFzeW5jIGJ1aWxkKCkge1xuICAgIHJldHVybiB0aGlzLmNvbW1vbkJ1aWxkKCdidWlsZCcsIFsnLS1vbmx5JywgLi4udGhpcy5jb21wb25lbnQoKV0pXG4gIH1cbiAgcHVibGljIGFzeW5jIHRlc3QoKSB7XG4gICAgY29uc3Qgc2V2ZXJpdHlDaGFuZ2VSeCA9IHt9XG4gICAgc2V2ZXJpdHlDaGFuZ2VSeFtcbiAgICAgIHRoaXMub3B0cy5wYXJhbXMuc2V2ZXJpdHlcbiAgICBdID0gL1J1bm5pbmcgXFxkKyB0ZXN0IHN1aXRlc1xcLlxcLlxcLi9cbiAgICByZXR1cm4gdGhpcy5jb21tb25CdWlsZCgndGVzdCcsIFsnLS1vbmx5JywgJy0tc2hvdy1kZXRhaWxzPWFsd2F5cyddLCB7XG4gICAgICBzZXZlcml0eUNoYW5nZVJ4LFxuICAgICAgc2V2ZXJpdHk6ICdidWlsZCcsXG4gICAgfSlcbiAgfVxuICBwdWJsaWMgYXN5bmMgYmVuY2goKSB7XG4gICAgY29uc3Qgc2V2ZXJpdHlDaGFuZ2VSeCA9IHt9XG4gICAgc2V2ZXJpdHlDaGFuZ2VSeFt0aGlzLm9wdHMucGFyYW1zLnNldmVyaXR5XSA9IC9SdW5uaW5nIFxcZCsgYmVuY2htYXJrc1xcLlxcLlxcLi9cbiAgICByZXR1cm4gdGhpcy5jb21tb25CdWlsZCgnYmVuY2gnLCBbJy0tb25seScsICctLXNob3ctZGV0YWlscz1hbHdheXMnXSwge1xuICAgICAgc2V2ZXJpdHlDaGFuZ2VSeCxcbiAgICAgIHNldmVyaXR5OiAnYnVpbGQnLFxuICAgIH0pXG4gIH1cbiAgcHVibGljIGFzeW5jIGNsZWFuKCkge1xuICAgIHJldHVybiB0aGlzLmNvbW1vbkJ1aWxkKCdjbGVhbicsIFsnLS1zYXZlLWNvbmZpZ3VyZSddKVxuICB9XG4gIHB1YmxpYyBhc3luYyBkZXBzKCkge1xuICAgIGNvbnN0IGlnbnMgPSBhdG9tLmNvbmZpZy5nZXQoJ2lkZS1oYXNrZWxsLWNhYmFsLmNhYmFsLmlnbm9yZU5vU2FuZGJveCcpXG4gICAgY29uc3Qgc2FuZGJveENvbmZpZyA9XG4gICAgICB0aGlzLmdldFNwYXduT3B0cygpLmVudi5DQUJBTF9TQU5EQk9YX0NPTkZJRyB8fCAnY2FiYWwuc2FuZGJveC5jb25maWcnXG4gICAgY29uc3Qgc2UgPSB0aGlzLm9wdHMuY2FiYWxSb290LmdldEZpbGUoc2FuZGJveENvbmZpZykuZXhpc3RzU3luYygpXG4gICAgaWYgKCEoc2UgfHwgaWducykpIHtcbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IG5ldyBQcm9taXNlPHsgZXhpdENvZGU6IG51bWJlcjsgaGFzRXJyb3I6IGJvb2xlYW4gfT4oXG4gICAgICAgIChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICBjb25zdCBub3RpZmljYXRpb24gPSBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkV2FybmluZyhcbiAgICAgICAgICAgICdObyBzYW5kYm94IGZvdW5kLCBzdG9wcGluZycsXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGRpc21pc3NhYmxlOiB0cnVlLFxuICAgICAgICAgICAgICBkZXRhaWw6XG4gICAgICAgICAgICAgICAgJ2lkZS1oYXNrZWxsLWNhYmFsIGRpZCBub3QgZmluZCBzYW5kYm94IGNvbmZpZ3VyYXRpb24gJyArXG4gICAgICAgICAgICAgICAgJ2ZpbGUuIEluc3RhbGxpbmcgZGVwZW5kZW5jaWVzIHdpdGhvdXQgc2FuZGJveCBpcyAnICtcbiAgICAgICAgICAgICAgICAnZGFuZ2Vyb3VzIGFuZCBpcyBub3QgcmVjb21tZW5kZWQuIEl0IGlzIHN1Z2dlc3RlZCB0byAnICtcbiAgICAgICAgICAgICAgICAnY3JlYXRlIGEgc2FuZGJveCByaWdodCBub3cuJyxcbiAgICAgICAgICAgICAgYnV0dG9uczogW1xuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZTogJ2ljb24gaWNvbi1yb2NrZXQnLFxuICAgICAgICAgICAgICAgICAgdGV4dDogJ0NsaWNrIGhlcmUgdG8gY3JlYXRlIHRoZSBzYW5kYm94JyxcbiAgICAgICAgICAgICAgICAgIG9uRGlkQ2xpY2s6ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh0aGlzLmNyZWF0ZVNhbmRib3goKSlcbiAgICAgICAgICAgICAgICAgICAgbm90aWZpY2F0aW9uLmRpc21pc3MoKVxuICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICApXG4gICAgICAgICAgY29uc3QgZGlzcCA9IG5vdGlmaWNhdGlvbi5vbkRpZERpc21pc3MoKCkgPT4ge1xuICAgICAgICAgICAgZGlzcC5kaXNwb3NlKClcbiAgICAgICAgICAgIHJlamVjdCgpXG4gICAgICAgICAgfSlcbiAgICAgICAgfSxcbiAgICAgIClcbiAgICAgIGlmIChyZXMuZXhpdENvZGUgIT09IDApIHtcbiAgICAgICAgcmV0dXJuIHJlc1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGhpcy5jb21tb25CdWlsZCgnaW5zdGFsbCcsIFtcbiAgICAgICctLW9ubHktZGVwZW5kZW5jaWVzJyxcbiAgICAgICctLWVuYWJsZS10ZXN0cycsXG4gICAgICAnLS1lbmFibGUtYmVuY2htYXJrcycsXG4gICAgXSlcbiAgfVxuXG4gIHByb3RlY3RlZCBhZGRpdGlvbmFsRW52U2V0dXAoZW52OiB0eXBlb2YgcHJvY2Vzcy5lbnYpIHtcbiAgICBlbnYgPSBzdXBlci5hZGRpdGlvbmFsRW52U2V0dXAoZW52KVxuXG4gICAgLy8gU2V0IHNhbmRib3ggZmlsZSAoaWYgc3BlY2lmaWVkKVxuICAgIGNvbnN0IHNhbmRib3hDb25maWcgPSBnZXRDYWJhbE9wdHMoKS5zYW5kYm94XG4gICAgaWYgKHNhbmRib3hDb25maWcgIT09ICcnKSB7XG4gICAgICBlbnYuQ0FCQUxfU0FOREJPWF9DT05GSUcgPSBzYW5kYm94Q29uZmlnXG4gICAgfVxuICAgIHJldHVybiBlbnZcbiAgfVxuXG4gIHByb3RlY3RlZCBhc3luYyB3aXRoUHJlZml4KGNtZDogc3RyaW5nKSB7XG4gICAgcmV0dXJuIHN1cGVyLndpdGhQcmVmaXgoY21kLCB7IG9sZHByZWZpeDogJycsIG5ld3ByZWZpeDogJ3YxLScgfSlcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgY3JlYXRlU2FuZGJveCgpIHtcbiAgICByZXR1cm4gcnVuUHJvY2VzcyhcbiAgICAgICdjYWJhbCcsXG4gICAgICBbYXdhaXQgdGhpcy53aXRoUHJlZml4KCdzYW5kYm94JyksICdpbml0J10sXG4gICAgICB0aGlzLmdldFNwYXduT3B0cygpLFxuICAgICAgdGhpcy5vcHRzLnBhcmFtcyxcbiAgICApXG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGNvbW1vbkJ1aWxkKFxuICAgIGNvbW1hbmQ6ICdidWlsZCcgfCAndGVzdCcgfCAnYmVuY2gnIHwgJ2luc3RhbGwnIHwgJ2NsZWFuJyxcbiAgICBhcmdzOiBzdHJpbmdbXSxcbiAgICBvdmVycmlkZTogUGFydGlhbDxJUGFyYW1zPiA9IHt9LFxuICApIHtcbiAgICByZXR1cm4gdGhpcy5ydW5DYWJhbChcbiAgICAgIFtcbiAgICAgICAgYXdhaXQgdGhpcy53aXRoUHJlZml4KGNvbW1hbmQpLFxuICAgICAgICAuLi5hcmdzLFxuICAgICAgICAnLS1idWlsZGRpcj0nICsgZ2V0Q2FiYWxPcHRzKCkuYnVpbGREaXIsXG4gICAgICBdLFxuICAgICAgb3ZlcnJpZGUsXG4gICAgKVxuICB9XG59XG4iXX0=