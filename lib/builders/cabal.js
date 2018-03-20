"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cabal_process_1 = require("./cabal-process");
const cabal_base_1 = require("./cabal-base");
class Builder extends cabal_base_1.CabalBase {
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
        const sandboxConfig = this.cabalOpts.sandbox;
        if (sandboxConfig !== '') {
            env.CABAL_SANDBOX_CONFIG = sandboxConfig;
        }
        return env;
    }
    async createSandbox() {
        return cabal_process_1.runCabalProcess('cabal', ['sandbox', 'init'], this.spawnOpts, this.opts.opts);
    }
    async commonBuild() {
        this.cabalArgs.push('--builddir=' + this.cabalOpts.buildDir);
        return this.runCabal();
    }
}
exports.Builder = Builder;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FiYWwuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvYnVpbGRlcnMvY2FiYWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFDQSxtREFBaUQ7QUFDakQsNkNBQXdDO0FBRXhDLGFBQXFCLFNBQVEsc0JBQVM7SUFDcEMsWUFBWSxJQUFjO1FBQ3hCLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQTtJQUNiLENBQUM7SUFFTSxLQUFLLENBQUMsS0FBSztRQUNoQixJQUFJLENBQUMsU0FBUyxHQUFHLENBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxDQUFBO1FBQ3BDLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQTtRQUNoQixNQUFNLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFBO0lBQzNCLENBQUM7SUFDTSxLQUFLLENBQUMsSUFBSTtRQUNmLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGdCQUFnQixHQUFHLEVBQUUsQ0FBQTtRQUNwQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FDN0IsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUN4QixHQUFHLCtCQUErQixDQUFBO1FBQ25DLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsR0FBRyxPQUFPLENBQUE7UUFDakMsSUFBSSxDQUFDLFNBQVMsR0FBRyxDQUFDLE1BQU0sRUFBRSxRQUFRLEVBQUUsdUJBQXVCLENBQUMsQ0FBQTtRQUM1RCxNQUFNLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFBO0lBQzNCLENBQUM7SUFDTSxLQUFLLENBQUMsS0FBSztRQUNoQixJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxFQUFFLENBQUE7UUFDcEMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQzdCLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEs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LFNBQVMsRUFBRSxNQUFNLENBQUMsRUFDbkIsSUFBSSxDQUFDLFNBQVMsRUFDZCxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FDZixDQUFBO0lBQ0gsQ0FBQztJQUVPLEtBQUssQ0FBQyxXQUFXO1FBQ3ZCLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFBO1FBQzVELE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUE7SUFDeEIsQ0FBQztDQUNGO0FBeEdELDBCQXdHQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEN0b3JPcHRzIH0gZnJvbSAnLi9iYXNlJ1xuaW1wb3J0IHsgcnVuQ2FiYWxQcm9jZXNzIH0gZnJvbSAnLi9jYWJhbC1wcm9jZXNzJ1xuaW1wb3J0IHsgQ2FiYWxCYXNlIH0gZnJvbSAnLi9jYWJhbC1iYXNlJ1xuXG5leHBvcnQgY2xhc3MgQnVpbGRlciBleHRlbmRzIENhYmFsQmFzZSB7XG4gIGNvbnN0cnVjdG9yKG9wdHM6IEN0b3JPcHRzKSB7XG4gICAgc3VwZXIob3B0cylcbiAgfVxuXG4gIHB1YmxpYyBhc3luYyBidWlsZCgpIHtcbiAgICB0aGlzLmNhYmFsQXJncyA9IFsnYnVpbGQnLCAnLS1vbmx5J11cbiAgICB0aGlzLmNvbXBvbmVudCgpXG4gICAgcmV0dXJuIHRoaXMuY29tbW9uQnVpbGQoKVxuICB9XG4gIHB1YmxpYyBhc3luYyB0ZXN0KCkge1xuICAgIHRoaXMub3B0cy5vcHRzLnNldmVyaXR5Q2hhbmdlUnggPSB7fVxuICAgIHRoaXMub3B0cy5vcHRzLnNldmVyaXR5Q2hhbmdlUnhbXG4gICAgICB0aGlzLm9wdHMub3B0cy5zZXZlcml0eVxuICAgIF0gPSAvUnVubmluZyBcXGQrIHRlc3Qgc3VpdGVzXFwuXFwuXFwuL1xuICAgIHRoaXMub3B0cy5vcHRzLnNldmVyaXR5ID0gJ2J1aWxkJ1xuICAgIHRoaXMuY2FiYWxBcmdzID0gWyd0ZXN0JywgJy0tb25seScsICctLXNob3ctZGV0YWlscz1hbHdheXMnXVxuICAgIHJldHVybiB0aGlzLmNvbW1vbkJ1aWxkKClcbiAgfVxuICBwdWJsaWMgYXN5bmMgYmVuY2goKSB7XG4gICAgdGhpcy5vcHRzLm9wdHMuc2V2ZXJpdHlDaGFuZ2VSeCA9IHt9XG4gICAgdGhpcy5vcHRzLm9wdHMuc2V2ZXJpdHlDaGFuZ2VSeFtcbiAgICAgIHRoaXMub3B0cy5vcHRzLnNldmVyaXR5XG4gICAgXSA9IC9SdW5uaW5nIFxcZCsgYmVuY2htYXJrc1xcLlxcLlxcLi9cbiAgICB0aGlzLm9wdHMub3B0cy5zZXZlcml0eSA9ICdidWlsZCdcbiAgICB0aGlzLmNhYmFsQXJncyA9IFsnYmVuY2gnLCAnLS1vbmx5JywgJy0tc2hvdy1kZXRhaWxzPWFsd2F5cyddXG4gICAgcmV0dXJuIHRoaXMuY29tbW9uQnVpbGQoKVxuICB9XG4gIHB1YmxpYyBhc3luYyBjbGVhbigpIHtcbiAgICB0aGlzLmNhYmFsQXJncyA9IFsnY2xlYW4nLCAnLS1zYXZlLWNvbmZpZ3VyZSddXG4gICAgcmV0dXJuIHRoaXMuY29tbW9uQnVpbGQoKVxuICB9XG4gIHB1YmxpYyBhc3luYyBkZXBzKCkge1xuICAgIGNvbnN0IGlnbnMgPSBhdG9tLmNvbmZpZy5nZXQoJ2lkZS1oYXNrZWxsLWNhYmFsLmNhYmFsLmlnbm9yZU5vU2FuZGJveCcpXG4gICAgY29uc3Qgc2FuZGJveENvbmZpZyA9XG4gICAgICB0aGlzLnNwYXduT3B0cy5lbnYuQ0FCQUxfU0FOREJPWF9DT05GSUcgfHwgJ2NhYmFsLnNhbmRib3guY29uZmlnJ1xuICAgIGNvbnN0IHNlID0gdGhpcy5vcHRzLmNhYmFsUm9vdC5nZXRGaWxlKHNhbmRib3hDb25maWcpLmV4aXN0c1N5bmMoKVxuICAgIGlmICghKHNlIHx8IGlnbnMpKSB7XG4gICAgICBjb25zdCByZXMgPSBhd2FpdCBuZXcgUHJvbWlzZTx7IGV4aXRDb2RlOiBudW1iZXI7IGhhc0Vycm9yOiBib29sZWFuIH0+KFxuICAgICAgICAocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgY29uc3Qgbm90aWZpY2F0aW9uID0gYXRvbS5ub3RpZmljYXRpb25zLmFkZFdhcm5pbmcoXG4gICAgICAgICAgICAnTm8gc2FuZGJveCBmb3VuZCwgc3RvcHBpbmcnLFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBkaXNtaXNzYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgICAgZGV0YWlsOlxuICAgICAgICAgICAgICAgICdpZGUtaGFza2VsbC1jYWJhbCBkaWQgbm90IGZpbmQgc2FuZGJveCBjb25maWd1cmF0aW9uICcgK1xuICAgICAgICAgICAgICAgICdmaWxlLiBJbnN0YWxsaW5nIGRlcGVuZGVuY2llcyB3aXRob3V0IHNhbmRib3ggaXMgJyArXG4gICAgICAgICAgICAgICAgJ2Rhbmdlcm91cyBhbmQgaXMgbm90IHJlY29tbWVuZGVkLiBJdCBpcyBzdWdnZXN0ZWQgdG8gJyArXG4gICAgICAgICAgICAgICAgJ2NyZWF0ZSBhIHNhbmRib3ggcmlnaHQgbm93LicsXG4gICAgICAgICAgICAgIGJ1dHRvbnM6IFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICBjbGFzc05hbWU6ICdpY29uIGljb24tcm9ja2V0JyxcbiAgICAgICAgICAgICAgICAgIHRleHQ6ICdDbGljayBoZXJlIHRvIGNyZWF0ZSB0aGUgc2FuZGJveCcsXG4gICAgICAgICAgICAgICAgICBvbkRpZENsaWNrOiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUodGhpcy5jcmVhdGVTYW5kYm94KCkpXG4gICAgICAgICAgICAgICAgICAgIG5vdGlmaWNhdGlvbi5kaXNtaXNzKClcbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgKVxuICAgICAgICAgIGNvbnN0IGRpc3AgPSBub3RpZmljYXRpb24ub25EaWREaXNtaXNzKCgpID0+IHtcbiAgICAgICAgICAgIGRpc3AuZGlzcG9zZSgpXG4gICAgICAgICAgICByZWplY3QoKVxuICAgICAgICAgIH0pXG4gICAgICAgIH0sXG4gICAgICApXG4gICAgICBpZiAocmVzLmV4aXRDb2RlICE9PSAwKSB7XG4gICAgICAgIHJldHVybiByZXNcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5jYWJhbEFyZ3MgPSBbXG4gICAgICAnaW5zdGFsbCcsXG4gICAgICAnLS1vbmx5LWRlcGVuZGVuY2llcycsXG4gICAgICAnLS1lbmFibGUtdGVzdHMnLFxuICAgICAgJy0tZW5hYmxlLWJlbmNobWFya3MnLFxuICAgIF1cbiAgICByZXR1cm4gdGhpcy5jb21tb25CdWlsZCgpXG4gIH1cblxuICBwcm90ZWN0ZWQgYWRkaXRpb25hbEVudlNldHVwKGVudjogdHlwZW9mIHByb2Nlc3MuZW52KSB7XG4gICAgZW52ID0gc3VwZXIuYWRkaXRpb25hbEVudlNldHVwKGVudilcblxuICAgIC8vIFNldCBzYW5kYm94IGZpbGUgKGlmIHNwZWNpZmllZClcbiAgICBjb25zdCBzYW5kYm94Q29uZmlnID0gdGhpcy5jYWJhbE9wdHMuc2FuZGJveFxuICAgIGlmIChzYW5kYm94Q29uZmlnICE9PSAnJykge1xuICAgICAgZW52LkNBQkFMX1NBTkRCT1hfQ09ORklHID0gc2FuZGJveENvbmZpZ1xuICAgIH1cbiAgICByZXR1cm4gZW52XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGNyZWF0ZVNhbmRib3goKSB7XG4gICAgcmV0dXJuIHJ1bkNhYmFsUHJvY2VzcyhcbiAgICAgICdjYWJhbCcsXG4gICAgICBbJ3NhbmRib3gnLCAnaW5pdCddLFxuICAgICAgdGhpcy5zcGF3bk9wdHMsXG4gICAgICB0aGlzLm9wdHMub3B0cyxcbiAgICApXG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGNvbW1vbkJ1aWxkKCkge1xuICAgIHRoaXMuY2FiYWxBcmdzLnB1c2goJy0tYnVpbGRkaXI9JyArIHRoaXMuY2FiYWxPcHRzLmJ1aWxkRGlyKVxuICAgIHJldHVybiB0aGlzLnJ1bkNhYmFsKClcbiAgfVxufVxuIl19