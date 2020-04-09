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
        if (atom.config.get('ide-haskell-cabal.cabal.runHpack')) {
            if (await this.opts.cabalRoot.getFile('package.yaml').exists()) {
                await process_1.runProcess('hpack', [], this.getSpawnOpts(), this.opts.params);
            }
        }
        return this.runCabal([
            await this.withPrefix(command),
            ...args,
            '--builddir=' + cabal_1.getCabalOpts().buildDir,
        ], override);
    }
}
exports.Builder = Builder;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FiYWwtdjEuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvYnVpbGRlcnMvY2FiYWwtdjEudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFDQSw0Q0FBb0Q7QUFDcEQsd0NBQXNEO0FBRXRELE1BQWEsT0FBUSxTQUFRLGlCQUFTO0lBQ3BDLFlBQVksSUFBYztRQUN4QixLQUFLLENBQUMsSUFBSSxDQUFDLENBQUE7SUFDYixDQUFDO0lBRU0sS0FBSyxDQUFDLEtBQUs7UUFDaEIsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDLE9BQU8sRUFBRSxDQUFDLFFBQVEsRUFBRSxHQUFHLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDLENBQUE7SUFDbkUsQ0FBQztJQUNNLEtBQUssQ0FBQyxJQUFJO1FBQ2YsTUFBTSxnQkFBZ0IsR0FBRyxFQUFFLENBQUE7UUFDM0IsZ0JBQWdCLENBQ2QsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUMxQixHQUFHLCtCQUErQixDQUFBO1FBQ25DLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxRQUFRLEVBQUUsdUJBQXVCLENBQUMsRUFBRTtZQUNuRSxnQkFBZ0I7WUFDaEIsUUFBUSxFQUFFLE9BQU87U0FDbEIsQ0FBQyxDQUFBO0lBQ0osQ0FBQztJQUNNLEtBQUssQ0FBQyxLQUFLO1FBQ2hCLE1BQU0sZ0JBQWdCLEdBQUcsRUFBRSxDQUFBO1FBQzNCLGdCQUFnQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxHQUFHLDhCQUE4QixDQUFBO1FBQzVFLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxRQUFRLEVBQUUsdUJBQXVCLENBQUMsRUFBRTtZQUNwRSxnQkFBZ0I7WUFDaEIsUUFBUSxFQUFFLE9BQU87U0FDbEIsQ0FBQyxDQUFBO0lBQ0osQ0FBQztJQUNNLEtBQUssQ0FBQyxLQUFLO1FB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LENBQUMsRUFBRTtZQUN2RCxJQUFJLE1BQU0sSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLGNBQWMsQ0FBQyxDQUFDLE1BQU0sRUFBRSxFQUFFO2dCQUM5RCxNQUFNLG9CQUFVLENBQUMsT0FBTyxFQUFFLEVBQUUsRUFBRSxJQUFJLENBQUMsWUFBWSxFQUFFLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQTthQUNyRTtTQUNGO1FBQ0QsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUNsQjtZQUNFLE1BQU0sSUFBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUM7WUFDOUIsR0FBRyxJQUFJO1lBQ1AsYUFBYSxHQUFHLG9CQUFZLEVBQUUsQ0FBQyxRQUFRO1NBQ3hDLEVBQ0QsUUFBUSxDQUNULENBQUE7SUFDSCxDQUFDO0NBQ0Y7QUF0SEQsMEJBc0hDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ3Rvck9wdHMgfSBmcm9tICcuL2Jhc2UnXG5pbXBvcnQgeyBydW5Qcm9jZXNzLCBJUGFyYW1zIH0gZnJvbSAnLi9iYXNlL3Byb2Nlc3MnXG5pbXBvcnQgeyBDYWJhbEJhc2UsIGdldENhYmFsT3B0cyB9IGZyb20gJy4vYmFzZS9jYWJhbCdcblxuZXhwb3J0IGNsYXNzIEJ1aWxkZXIgZXh0ZW5kcyBDYWJhbEJhc2Uge1xuICBjb25zdHJ1Y3RvcihvcHRzOiBDdG9yT3B0cykge1xuICAgIHN1cGVyKG9wdHMpXG4gIH1cblxuICBwdWJsaWMgYXN5bmMgYnVpbGQoKSB7XG4gICAgcmV0dXJuIHRoaXMuY29tbW9uQnVpbGQoJ2J1aWxkJywgWyctLW9ubHknLCAuLi50aGlzLmNvbXBvbmVudCgpXSlcbiAgfVxuICBwdWJsaWMgYXN5bmMgdGVzdCgpIHtcbiAgICBjb25zdCBzZXZlcml0eUNoYW5nZVJ4ID0ge31cbiAgICBzZXZlcml0eUNoYW5nZVJ4W1xuICAgICAgdGhpcy5vcHRzLnBhcmFtcy5zZXZlcml0eVxuICAgIF0gPSAvUnVubmluZyBcXGQrIHRlc3Qgc3VpdGVzXFwuXFwuXFwuL1xuICAgIHJldHVybiB0aGlzLmNvbW1vbkJ1aWxkKCd0ZXN0JywgWyctLW9ubHknLCAnLS1zaG93LWRldGFpbHM9YWx3YXlzJ10sIHtcbiAgICAgIHNldmVyaXR5Q2hhbmdlUngsXG4gICAgICBzZXZlcml0eTogJ2J1aWxkJyxcbiAgICB9KVxuICB9XG4gIHB1YmxpYyBhc3luYyBiZW5jaCgpIHtcbiAgICBjb25zdCBzZXZlcml0eUNoYW5nZVJ4ID0ge31cbiAgICBzZXZlcml0eUNoYW5nZVJ4W3RoaXMub3B0cy5wYXJhbXMuc2V2ZXJpdHldID0gL1J1bm5pbmcgXFxkKyBiZW5jaG1hcmtzXFwuXFwuXFwuL1xuICAgIHJldHVybiB0aGlzLmNvbW1vbkJ1aWxkKCdiZW5jaCcsIFsnLS1vbmx5JywgJy0tc2hvdy1kZXRhaWxzPWFsd2F5cyddLCB7XG4gICAgICBzZXZlcml0eUNoYW5nZVJ4LFxuICAgICAgc2V2ZXJpdHk6ICdidWlsZCcsXG4gICAgfSlcbiAgfVxuICBwdWJsaWMgYXN5bmMgY2xlYW4oKSB7XG4gICAgcmV0dXJuIHRoaXMuY29tbW9uQnVpbGQoJ2NsZWFuJywgWyctLXNhdmUtY29uZmlndXJlJ10pXG4gIH1cbiAgcHVibGljIGFzeW5jIGRlcHMoKSB7XG4gICAgY29uc3QgaWducyA9IGF0b20uY29uZmlnLmdldCgnaWRlLWhhc2tlbGwtY2FiYWwuY2FiYWwuaWdub3JlTm9TYW5kYm94JylcbiAgICBjb25zdCBzYW5kYm94Q29uZmlnID1cbiAgICAgIHRoaXMuZ2V0U3Bhd25PcHRzKCkuZW52LkNBQkFMX1NBTkRCT1hfQ09ORklHIHx8ICdjYWJhbC5zYW5kYm94LmNvbmZpZydcbiAgICBjb25zdCBzZSA9IHRoaXMub3B0cy5jYWJhbFJvb3QuZ2V0RmlsZShzYW5kYm94Q29uZmlnKS5leGlzdHNTeW5jKClcbiAgICBpZiAoIShzZSB8fCBpZ25zKSkge1xuICAgICAgY29uc3QgcmVzID0gYXdhaXQgbmV3IFByb21pc2U8eyBleGl0Q29kZTogbnVtYmVyOyBoYXNFcnJvcjogYm9vbGVhbiB9PihcbiAgICAgICAgKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgIGNvbnN0IG5vdGlmaWNhdGlvbiA9IGF0b20ubm90aWZpY2F0aW9ucy5hZGRXYXJuaW5nKFxuICAgICAgICAgICAgJ05vIHNhbmRib3ggZm91bmQsIHN0b3BwaW5nJyxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgZGlzbWlzc2FibGU6IHRydWUsXG4gICAgICAgICAgICAgIGRldGFpbDpcbiAgICAgICAgICAgICAgICAnaWRlLWhhc2tlbGwtY2FiYWwgZGlkIG5vdCBmaW5kIHNhbmRib3ggY29uZmlndXJhdGlvbiAnICtcbiAgICAgICAgICAgICAgICAnZmlsZS4gSW5zdGFsbGluZyBkZXBlbmRlbmNpZXMgd2l0aG91dCBzYW5kYm94IGlzICcgK1xuICAgICAgICAgICAgICAgICdkYW5nZXJvdXMgYW5kIGlzIG5vdCByZWNvbW1lbmRlZC4gSXQgaXMgc3VnZ2VzdGVkIHRvICcgK1xuICAgICAgICAgICAgICAgICdjcmVhdGUgYSBzYW5kYm94IHJpZ2h0IG5vdy4nLFxuICAgICAgICAgICAgICBidXR0b25zOiBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lOiAnaWNvbiBpY29uLXJvY2tldCcsXG4gICAgICAgICAgICAgICAgICB0ZXh0OiAnQ2xpY2sgaGVyZSB0byBjcmVhdGUgdGhlIHNhbmRib3gnLFxuICAgICAgICAgICAgICAgICAgb25EaWRDbGljazogKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHRoaXMuY3JlYXRlU2FuZGJveCgpKVxuICAgICAgICAgICAgICAgICAgICBub3RpZmljYXRpb24uZGlzbWlzcygpXG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIClcbiAgICAgICAgICBjb25zdCBkaXNwID0gbm90aWZpY2F0aW9uLm9uRGlkRGlzbWlzcygoKSA9PiB7XG4gICAgICAgICAgICBkaXNwLmRpc3Bvc2UoKVxuICAgICAgICAgICAgcmVqZWN0KClcbiAgICAgICAgICB9KVxuICAgICAgICB9LFxuICAgICAgKVxuICAgICAgaWYgKHJlcy5leGl0Q29kZSAhPT0gMCkge1xuICAgICAgICByZXR1cm4gcmVzXG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0aGlzLmNvbW1vbkJ1aWxkKCdpbnN0YWxsJywgW1xuICAgICAgJy0tb25seS1kZXBlbmRlbmNpZXMnLFxuICAgICAgJy0tZW5hYmxlLXRlc3RzJyxcbiAgICAgICctLWVuYWJsZS1iZW5jaG1hcmtzJyxcbiAgICBdKVxuICB9XG5cbiAgcHJvdGVjdGVkIGFkZGl0aW9uYWxFbnZTZXR1cChlbnY6IHR5cGVvZiBwcm9jZXNzLmVudikge1xuICAgIGVudiA9IHN1cGVyLmFkZGl0aW9uYWxFbnZTZXR1cChlbnYpXG5cbiAgICAvLyBTZXQgc2FuZGJveCBmaWxlIChpZiBzcGVjaWZpZWQpXG4gICAgY29uc3Qgc2FuZGJveENvbmZpZyA9IGdldENhYmFsT3B0cygpLnNhbmRib3hcbiAgICBpZiAoc2FuZGJveENvbmZpZyAhPT0gJycpIHtcbiAgICAgIGVudi5DQUJBTF9TQU5EQk9YX0NPTkZJRyA9IHNhbmRib3hDb25maWdcbiAgICB9XG4gICAgcmV0dXJuIGVudlxuICB9XG5cbiAgcHJvdGVjdGVkIGFzeW5jIHdpdGhQcmVmaXgoY21kOiBzdHJpbmcpIHtcbiAgICByZXR1cm4gc3VwZXIud2l0aFByZWZpeChjbWQsIHsgb2xkcHJlZml4OiAnJywgbmV3cHJlZml4OiAndjEtJyB9KVxuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBjcmVhdGVTYW5kYm94KCkge1xuICAgIHJldHVybiBydW5Qcm9jZXNzKFxuICAgICAgJ2NhYmFsJyxcbiAgICAgIFthd2FpdCB0aGlzLndpdGhQcmVmaXgoJ3NhbmRib3gnKSwgJ2luaXQnXSxcbiAgICAgIHRoaXMuZ2V0U3Bhd25PcHRzKCksXG4gICAgICB0aGlzLm9wdHMucGFyYW1zLFxuICAgIClcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgY29tbW9uQnVpbGQoXG4gICAgY29tbWFuZDogJ2J1aWxkJyB8ICd0ZXN0JyB8ICdiZW5jaCcgfCAnaW5zdGFsbCcgfCAnY2xlYW4nLFxuICAgIGFyZ3M6IHN0cmluZ1tdLFxuICAgIG92ZXJyaWRlOiBQYXJ0aWFsPElQYXJhbXM+ID0ge30sXG4gICkge1xuICAgIGlmIChhdG9tLmNvbmZpZy5nZXQoJ2lkZS1oYXNrZWxsLWNhYmFsLmNhYmFsLnJ1bkhwYWNrJykpIHtcbiAgICAgIGlmIChhd2FpdCB0aGlzLm9wdHMuY2FiYWxSb290LmdldEZpbGUoJ3BhY2thZ2UueWFtbCcpLmV4aXN0cygpKSB7XG4gICAgICAgIGF3YWl0IHJ1blByb2Nlc3MoJ2hwYWNrJywgW10sIHRoaXMuZ2V0U3Bhd25PcHRzKCksIHRoaXMub3B0cy5wYXJhbXMpXG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0aGlzLnJ1bkNhYmFsKFxuICAgICAgW1xuICAgICAgICBhd2FpdCB0aGlzLndpdGhQcmVmaXgoY29tbWFuZCksXG4gICAgICAgIC4uLmFyZ3MsXG4gICAgICAgICctLWJ1aWxkZGlyPScgKyBnZXRDYWJhbE9wdHMoKS5idWlsZERpcixcbiAgICAgIF0sXG4gICAgICBvdmVycmlkZSxcbiAgICApXG4gIH1cbn1cbiJdfQ==