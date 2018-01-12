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
    component() {
        switch (this.opts.target.type) {
            case 'all':
                this.cabalArgs.push(...this.opts.target.targets.map((x) => x.target));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FiYWwuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvYnVpbGRlcnMvY2FiYWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxpQ0FBOEM7QUFFOUMsbURBQWlEO0FBRWpELGFBQXFCLFNBQVEsa0JBQVc7SUFDdEMsWUFBWSxJQUFjO1FBQ3hCLEtBQUssQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUE7SUFDdEIsQ0FBQztJQUVNLEtBQUssQ0FBQyxLQUFLO1FBQ2hCLElBQUksQ0FBQyxTQUFTLEdBQUcsQ0FBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLENBQUE7UUFDcEMsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFBO1FBQ2hCLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUE7SUFDM0IsQ0FBQztJQUNNLEtBQUssQ0FBQyxJQUFJO1FBQ2YsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsRUFBRSxDQUFBO1FBQ3BDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUM3QixJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQ3hCLEdBQUcsK0JBQStCLENBQUE7UUFDbkMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxHQUFHLE9BQU8sQ0FBQTtRQUNqQyxJQUFJLENBQUMsU0FBUyxHQUFHLENBQUMsTUFBTSxFQUFFLFFBQVEsRUFBRSx1QkFBdUIsQ0FBQyxDQUFBO1FBQzVELE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUE7SUFDM0IsQ0FBQztJQUNNLEtBQUssQ0FBQyxLQUFLO1FBQ2hCLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGdCQUFnQixHQUFHLEVBQUUsQ0FBQTtRQUNwQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FDN0IsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJ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SSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUE7Z0JBQy9DLEtBQUssQ0FBQTtZQUNQLEtBQUssTUFBTTtnQkFDVCxLQUFLLENBQUE7UUFDVCxDQUFDO0lBQ0gsQ0FBQztJQUVPLEtBQUssQ0FBQyxhQUFhO1FBQ3pCLE1BQU0sQ0FBQywrQkFBZSxDQUNwQixPQUFPLEVBQ1AsQ0FBQyxTQUFTLEVBQUUsTUFBTSxDQUFDLEVBQ25CLElBQUksQ0FBQyxTQUFTLEVBQ2QsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQ2YsQ0FBQTtJQUNILENBQUM7SUFFTyxLQUFLLENBQUMsV0FBVztRQUN2QixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFBO1FBQ2xFLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUE7SUFDeEIsQ0FBQztDQUNGO0FBMUdELDBCQTBHQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEN0b3JPcHRzLCBCdWlsZGVyQmFzZSB9IGZyb20gJy4vYmFzZSdcblxuaW1wb3J0IHsgcnVuQ2FiYWxQcm9jZXNzIH0gZnJvbSAnLi9jYWJhbC1wcm9jZXNzJ1xuXG5leHBvcnQgY2xhc3MgQnVpbGRlciBleHRlbmRzIEJ1aWxkZXJCYXNlIHtcbiAgY29uc3RydWN0b3Iob3B0czogQ3Rvck9wdHMpIHtcbiAgICBzdXBlcignY2FiYWwnLCBvcHRzKVxuICB9XG5cbiAgcHVibGljIGFzeW5jIGJ1aWxkKCkge1xuICAgIHRoaXMuY2FiYWxBcmdzID0gWydidWlsZCcsICctLW9ubHknXVxuICAgIHRoaXMuY29tcG9uZW50KClcbiAgICByZXR1cm4gdGhpcy5jb21tb25CdWlsZCgpXG4gIH1cbiAgcHVibGljIGFzeW5jIHRlc3QoKSB7XG4gICAgdGhpcy5vcHRzLm9wdHMuc2V2ZXJpdHlDaGFuZ2VSeCA9IHt9XG4gICAgdGhpcy5vcHRzLm9wdHMuc2V2ZXJpdHlDaGFuZ2VSeFtcbiAgICAgIHRoaXMub3B0cy5vcHRzLnNldmVyaXR5XG4gICAgXSA9IC9SdW5uaW5nIFxcZCsgdGVzdCBzdWl0ZXNcXC5cXC5cXC4vXG4gICAgdGhpcy5vcHRzLm9wdHMuc2V2ZXJpdHkgPSAnYnVpbGQnXG4gICAgdGhpcy5jYWJhbEFyZ3MgPSBbJ3Rlc3QnLCAnLS1vbmx5JywgJy0tc2hvdy1kZXRhaWxzPWFsd2F5cyddXG4gICAgcmV0dXJuIHRoaXMuY29tbW9uQnVpbGQoKVxuICB9XG4gIHB1YmxpYyBhc3luYyBiZW5jaCgpIHtcbiAgICB0aGlzLm9wdHMub3B0cy5zZXZlcml0eUNoYW5nZVJ4ID0ge31cbiAgICB0aGlzLm9wdHMub3B0cy5zZXZlcml0eUNoYW5nZVJ4W1xuICAgICAgdGhpcy5vcHRzLm9wdHMuc2V2ZXJpdHlcbiAgICBdID0gL1J1bm5pbmcgXFxkKyBiZW5jaG1hcmtzXFwuXFwuXFwuL1xuICAgIHRoaXMub3B0cy5vcHRzLnNldmVyaXR5ID0gJ2J1aWxkJ1xuICAgIHRoaXMuY2FiYWxBcmdzID0gWydiZW5jaCcsICctLW9ubHknLCAnLS1zaG93LWRldGFpbHM9YWx3YXlzJ11cbiAgICByZXR1cm4gdGhpcy5jb21tb25CdWlsZCgpXG4gIH1cbiAgcHVibGljIGFzeW5jIGNsZWFuKCkge1xuICAgIHRoaXMuY2FiYWxBcmdzID0gWydjbGVhbicsICctLXNhdmUtY29uZmlndXJlJ11cbiAgICByZXR1cm4gdGhpcy5jb21tb25CdWlsZCgpXG4gIH1cbiAgcHVibGljIGFzeW5jIGRlcHMoKSB7XG4gICAgY29uc3QgaWducyA9IGF0b20uY29uZmlnLmdldCgnaWRlLWhhc2tlbGwtY2FiYWwuY2FiYWwuaWdub3JlTm9TYW5kYm94JylcbiAgICBjb25zdCBzYW5kYm94Q29uZmlnID1cbiAgICAgIHRoaXMuc3Bhd25PcHRzLmVudi5DQUJBTF9TQU5EQk9YX0NPTkZJRyB8fCAnY2FiYWwuc2FuZGJveC5jb25maWcnXG4gICAgY29uc3Qgc2UgPSB0aGlzLm9wdHMuY2FiYWxSb290LmdldEZpbGUoc2FuZGJveENvbmZpZykuZXhpc3RzU3luYygpXG4gICAgaWYgKCEoc2UgfHwgaWducykpIHtcbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IG5ldyBQcm9taXNlPHsgZXhpdENvZGU6IG51bWJlcjsgaGFzRXJyb3I6IGJvb2xlYW4gfT4oXG4gICAgICAgIChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICBjb25zdCBub3RpZmljYXRpb24gPSBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkV2FybmluZyhcbiAgICAgICAgICAgICdObyBzYW5kYm94IGZvdW5kLCBzdG9wcGluZycsXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGRpc21pc3NhYmxlOiB0cnVlLFxuICAgICAgICAgICAgICBkZXRhaWw6XG4gICAgICAgICAgICAgICAgJ2lkZS1oYXNrZWxsLWNhYmFsIGRpZCBub3QgZmluZCBzYW5kYm94IGNvbmZpZ3VyYXRpb24gJyArXG4gICAgICAgICAgICAgICAgJ2ZpbGUuIEluc3RhbGxpbmcgZGVwZW5kZW5jaWVzIHdpdGhvdXQgc2FuZGJveCBpcyAnICtcbiAgICAgICAgICAgICAgICAnZGFuZ2Vyb3VzIGFuZCBpcyBub3QgcmVjb21tZW5kZWQuIEl0IGlzIHN1Z2dlc3RlZCB0byAnICtcbiAgICAgICAgICAgICAgICAnY3JlYXRlIGEgc2FuZGJveCByaWdodCBub3cuJyxcbiAgICAgICAgICAgICAgYnV0dG9uczogW1xuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZTogJ2ljb24gaWNvbi1yb2NrZXQnLFxuICAgICAgICAgICAgICAgICAgdGV4dDogJ0NsaWNrIGhlcmUgdG8gY3JlYXRlIHRoZSBzYW5kYm94JyxcbiAgICAgICAgICAgICAgICAgIG9uRGlkQ2xpY2s6ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh0aGlzLmNyZWF0ZVNhbmRib3goKSlcbiAgICAgICAgICAgICAgICAgICAgbm90aWZpY2F0aW9uLmRpc21pc3MoKVxuICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICApXG4gICAgICAgICAgY29uc3QgZGlzcCA9IG5vdGlmaWNhdGlvbi5vbkRpZERpc21pc3MoKCkgPT4ge1xuICAgICAgICAgICAgZGlzcC5kaXNwb3NlKClcbiAgICAgICAgICAgIHJlamVjdCgpXG4gICAgICAgICAgfSlcbiAgICAgICAgfSxcbiAgICAgIClcbiAgICAgIGlmIChyZXMuZXhpdENvZGUgIT09IDApIHtcbiAgICAgICAgcmV0dXJuIHJlc1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLmNhYmFsQXJncyA9IFtcbiAgICAgICdpbnN0YWxsJyxcbiAgICAgICctLW9ubHktZGVwZW5kZW5jaWVzJyxcbiAgICAgICctLWVuYWJsZS10ZXN0cycsXG4gICAgICAnLS1lbmFibGUtYmVuY2htYXJrcycsXG4gICAgXVxuICAgIHJldHVybiB0aGlzLmNvbW1vbkJ1aWxkKClcbiAgfVxuXG4gIHByaXZhdGUgY29tcG9uZW50KCkge1xuICAgIHN3aXRjaCAodGhpcy5vcHRzLnRhcmdldC50eXBlKSB7XG4gICAgICBjYXNlICdhbGwnOlxuICAgICAgICB0aGlzLmNhYmFsQXJncy5wdXNoKC4uLnRoaXMub3B0cy50YXJnZXQudGFyZ2V0cy5tYXAoKHgpID0+IHgudGFyZ2V0KSlcbiAgICAgICAgYnJlYWtcbiAgICAgIGNhc2UgJ2NvbXBvbmVudCc6XG4gICAgICAgIHRoaXMuY2FiYWxBcmdzLnB1c2godGhpcy5vcHRzLnRhcmdldC5jb21wb25lbnQpXG4gICAgICAgIGJyZWFrXG4gICAgICBjYXNlICdhdXRvJzpcbiAgICAgICAgYnJlYWtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGNyZWF0ZVNhbmRib3goKSB7XG4gICAgcmV0dXJuIHJ1bkNhYmFsUHJvY2VzcyhcbiAgICAgICdjYWJhbCcsXG4gICAgICBbJ3NhbmRib3gnLCAnaW5pdCddLFxuICAgICAgdGhpcy5zcGF3bk9wdHMsXG4gICAgICB0aGlzLm9wdHMub3B0cyxcbiAgICApXG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGNvbW1vbkJ1aWxkKCkge1xuICAgIHRoaXMuY2FiYWxBcmdzLnB1c2goJy0tYnVpbGRkaXI9JyArIHRoaXMuZ2V0Q29uZmlnT3B0KCdidWlsZERpcicpKVxuICAgIHJldHVybiB0aGlzLnJ1bkNhYmFsKClcbiAgfVxufVxuIl19