"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const process_1 = require("./base/process");
const cabal_1 = require("./base/cabal");
class Builder extends cabal_1.CabalBase {
    constructor(opts) {
        super(opts);
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
        const sandboxConfig = this.spawnOpts.env.CABAL_SANDBOX_CONFIG || 'cabal.sandbox.config';
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
        this.cabalArgs = [
            'install',
            '--only-dependencies',
            '--enable-tests',
            '--enable-benchmarks',
        ];
        return this.commonBuild();
    }
    additionalEnvSetup(env) {
        env = super.additionalEnvSetup(env);
        const sandboxConfig = cabal_1.getCabalOpts().sandbox;
        if (sandboxConfig !== '') {
            env.CABAL_SANDBOX_CONFIG = sandboxConfig;
        }
        return env;
    }
    async createSandbox() {
        return process_1.runProcess('cabal', ['sandbox', 'init'], this.spawnOpts, this.opts.opts);
    }
    async commonBuild() {
        this.cabalArgs.push('--builddir=' + cabal_1.getCabalOpts().buildDir);
        return this.runCabal();
    }
}
exports.Builder = Builder;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FiYWwuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvYnVpbGRlcnMvY2FiYWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFDQSw0Q0FBMkM7QUFDM0Msd0NBQXNEO0FBRXRELGFBQXFCLFNBQVEsaUJBQVM7SUFDcEMsWUFBWSxJQUFjO1FBQ3hCLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQTtJQUNiLENBQUM7SUFFTSxLQUFLLENBQUMsS0FBSztRQUNoQixJQUFJLENBQUMsU0FBUyxHQUFHLENBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxDQUFBO1FBQ3BDLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQTtRQUNoQixNQUFNLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFBO0lBQzNCLENBQUM7SUFDTSxLQUFLLENBQUMsSUFBSTtRQUNmLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGdCQUFnQixHQUFHLEVBQUUsQ0FBQTtRQUNwQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FDN0IsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUN4QixHQUFHLCtCQUErQixDQUFBO1FBQ25DLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsR0FBRyxPQUFPLENBQUE7UUFDakMsSUFBSSxDQUFDLFNBQVMsR0FBRyxDQUFDLE1BQU0sRUFBRSxRQUFRLEVBQUUsdUJBQXVCLENBQUMsQ0FBQTtRQUM1RCxNQUFNLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFBO0lBQzNCLENBQUM7SUFDTSxLQUFLLENBQUMsS0FBSztRQUNoQixJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxFQUFFLENBQUE7UUFDcEMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQzdCLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEs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LEVBQUUsTUFBTSxDQUFDLEVBQ25CLElBQUksQ0FBQyxTQUFTLEVBQ2QsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQ2YsQ0FBQTtJQUNILENBQUM7SUFFTyxLQUFLLENBQUMsV0FBVztRQUN2QixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxhQUFhLEdBQUcsb0JBQVksRUFBRSxDQUFDLFFBQVEsQ0FBQyxDQUFBO1FBQzVELE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUE7SUFDeEIsQ0FBQztDQUNGO0FBeEdELDBCQXdHQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEN0b3JPcHRzIH0gZnJvbSAnLi9iYXNlJ1xuaW1wb3J0IHsgcnVuUHJvY2VzcyB9IGZyb20gJy4vYmFzZS9wcm9jZXNzJ1xuaW1wb3J0IHsgQ2FiYWxCYXNlLCBnZXRDYWJhbE9wdHMgfSBmcm9tICcuL2Jhc2UvY2FiYWwnXG5cbmV4cG9ydCBjbGFzcyBCdWlsZGVyIGV4dGVuZHMgQ2FiYWxCYXNlIHtcbiAgY29uc3RydWN0b3Iob3B0czogQ3Rvck9wdHMpIHtcbiAgICBzdXBlcihvcHRzKVxuICB9XG5cbiAgcHVibGljIGFzeW5jIGJ1aWxkKCkge1xuICAgIHRoaXMuY2FiYWxBcmdzID0gWydidWlsZCcsICctLW9ubHknXVxuICAgIHRoaXMuY29tcG9uZW50KClcbiAgICByZXR1cm4gdGhpcy5jb21tb25CdWlsZCgpXG4gIH1cbiAgcHVibGljIGFzeW5jIHRlc3QoKSB7XG4gICAgdGhpcy5vcHRzLm9wdHMuc2V2ZXJpdHlDaGFuZ2VSeCA9IHt9XG4gICAgdGhpcy5vcHRzLm9wdHMuc2V2ZXJpdHlDaGFuZ2VSeFtcbiAgICAgIHRoaXMub3B0cy5vcHRzLnNldmVyaXR5XG4gICAgXSA9IC9SdW5uaW5nIFxcZCsgdGVzdCBzdWl0ZXNcXC5cXC5cXC4vXG4gICAgdGhpcy5vcHRzLm9wdHMuc2V2ZXJpdHkgPSAnYnVpbGQnXG4gICAgdGhpcy5jYWJhbEFyZ3MgPSBbJ3Rlc3QnLCAnLS1vbmx5JywgJy0tc2hvdy1kZXRhaWxzPWFsd2F5cyddXG4gICAgcmV0dXJuIHRoaXMuY29tbW9uQnVpbGQoKVxuICB9XG4gIHB1YmxpYyBhc3luYyBiZW5jaCgpIHtcbiAgICB0aGlzLm9wdHMub3B0cy5zZXZlcml0eUNoYW5nZVJ4ID0ge31cbiAgICB0aGlzLm9wdHMub3B0cy5zZXZlcml0eUNoYW5nZVJ4W1xuICAgICAgdGhpcy5vcHRzLm9wdHMuc2V2ZXJpdHlcbiAgICBdID0gL1J1bm5pbmcgXFxkKyBiZW5jaG1hcmtzXFwuXFwuXFwuL1xuICAgIHRoaXMub3B0cy5vcHRzLnNldmVyaXR5ID0gJ2J1aWxkJ1xuICAgIHRoaXMuY2FiYWxBcmdzID0gWydiZW5jaCcsICctLW9ubHknLCAnLS1zaG93LWRldGFpbHM9YWx3YXlzJ11cbiAgICByZXR1cm4gdGhpcy5jb21tb25CdWlsZCgpXG4gIH1cbiAgcHVibGljIGFzeW5jIGNsZWFuKCkge1xuICAgIHRoaXMuY2FiYWxBcmdzID0gWydjbGVhbicsICctLXNhdmUtY29uZmlndXJlJ11cbiAgICByZXR1cm4gdGhpcy5jb21tb25CdWlsZCgpXG4gIH1cbiAgcHVibGljIGFzeW5jIGRlcHMoKSB7XG4gICAgY29uc3QgaWducyA9IGF0b20uY29uZmlnLmdldCgnaWRlLWhhc2tlbGwtY2FiYWwuY2FiYWwuaWdub3JlTm9TYW5kYm94JylcbiAgICBjb25zdCBzYW5kYm94Q29uZmlnID1cbiAgICAgIHRoaXMuc3Bhd25PcHRzLmVudi5DQUJBTF9TQU5EQk9YX0NPTkZJRyB8fCAnY2FiYWwuc2FuZGJveC5jb25maWcnXG4gICAgY29uc3Qgc2UgPSB0aGlzLm9wdHMuY2FiYWxSb290LmdldEZpbGUoc2FuZGJveENvbmZpZykuZXhpc3RzU3luYygpXG4gICAgaWYgKCEoc2UgfHwgaWducykpIHtcbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IG5ldyBQcm9taXNlPHsgZXhpdENvZGU6IG51bWJlcjsgaGFzRXJyb3I6IGJvb2xlYW4gfT4oXG4gICAgICAgIChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICBjb25zdCBub3RpZmljYXRpb24gPSBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkV2FybmluZyhcbiAgICAgICAgICAgICdObyBzYW5kYm94IGZvdW5kLCBzdG9wcGluZycsXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGRpc21pc3NhYmxlOiB0cnVlLFxuICAgICAgICAgICAgICBkZXRhaWw6XG4gICAgICAgICAgICAgICAgJ2lkZS1oYXNrZWxsLWNhYmFsIGRpZCBub3QgZmluZCBzYW5kYm94IGNvbmZpZ3VyYXRpb24gJyArXG4gICAgICAgICAgICAgICAgJ2ZpbGUuIEluc3RhbGxpbmcgZGVwZW5kZW5jaWVzIHdpdGhvdXQgc2FuZGJveCBpcyAnICtcbiAgICAgICAgICAgICAgICAnZGFuZ2Vyb3VzIGFuZCBpcyBub3QgcmVjb21tZW5kZWQuIEl0IGlzIHN1Z2dlc3RlZCB0byAnICtcbiAgICAgICAgICAgICAgICAnY3JlYXRlIGEgc2FuZGJveCByaWdodCBub3cuJyxcbiAgICAgICAgICAgICAgYnV0dG9uczogW1xuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZTogJ2ljb24gaWNvbi1yb2NrZXQnLFxuICAgICAgICAgICAgICAgICAgdGV4dDogJ0NsaWNrIGhlcmUgdG8gY3JlYXRlIHRoZSBzYW5kYm94JyxcbiAgICAgICAgICAgICAgICAgIG9uRGlkQ2xpY2s6ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh0aGlzLmNyZWF0ZVNhbmRib3goKSlcbiAgICAgICAgICAgICAgICAgICAgbm90aWZpY2F0aW9uLmRpc21pc3MoKVxuICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICApXG4gICAgICAgICAgY29uc3QgZGlzcCA9IG5vdGlmaWNhdGlvbi5vbkRpZERpc21pc3MoKCkgPT4ge1xuICAgICAgICAgICAgZGlzcC5kaXNwb3NlKClcbiAgICAgICAgICAgIHJlamVjdCgpXG4gICAgICAgICAgfSlcbiAgICAgICAgfSxcbiAgICAgIClcbiAgICAgIGlmIChyZXMuZXhpdENvZGUgIT09IDApIHtcbiAgICAgICAgcmV0dXJuIHJlc1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLmNhYmFsQXJncyA9IFtcbiAgICAgICdpbnN0YWxsJyxcbiAgICAgICctLW9ubHktZGVwZW5kZW5jaWVzJyxcbiAgICAgICctLWVuYWJsZS10ZXN0cycsXG4gICAgICAnLS1lbmFibGUtYmVuY2htYXJrcycsXG4gICAgXVxuICAgIHJldHVybiB0aGlzLmNvbW1vbkJ1aWxkKClcbiAgfVxuXG4gIHByb3RlY3RlZCBhZGRpdGlvbmFsRW52U2V0dXAoZW52OiB0eXBlb2YgcHJvY2Vzcy5lbnYpIHtcbiAgICBlbnYgPSBzdXBlci5hZGRpdGlvbmFsRW52U2V0dXAoZW52KVxuXG4gICAgLy8gU2V0IHNhbmRib3ggZmlsZSAoaWYgc3BlY2lmaWVkKVxuICAgIGNvbnN0IHNhbmRib3hDb25maWcgPSBnZXRDYWJhbE9wdHMoKS5zYW5kYm94XG4gICAgaWYgKHNhbmRib3hDb25maWcgIT09ICcnKSB7XG4gICAgICBlbnYuQ0FCQUxfU0FOREJPWF9DT05GSUcgPSBzYW5kYm94Q29uZmlnXG4gICAgfVxuICAgIHJldHVybiBlbnZcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgY3JlYXRlU2FuZGJveCgpIHtcbiAgICByZXR1cm4gcnVuUHJvY2VzcyhcbiAgICAgICdjYWJhbCcsXG4gICAgICBbJ3NhbmRib3gnLCAnaW5pdCddLFxuICAgICAgdGhpcy5zcGF3bk9wdHMsXG4gICAgICB0aGlzLm9wdHMub3B0cyxcbiAgICApXG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGNvbW1vbkJ1aWxkKCkge1xuICAgIHRoaXMuY2FiYWxBcmdzLnB1c2goJy0tYnVpbGRkaXI9JyArIGdldENhYmFsT3B0cygpLmJ1aWxkRGlyKVxuICAgIHJldHVybiB0aGlzLnJ1bkNhYmFsKClcbiAgfVxufVxuIl19