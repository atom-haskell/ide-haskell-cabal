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
        severityChangeRx[this.opts.opts.severity] = /Running \d+ test suites\.\.\./;
        return this.commonBuild('test', ['--only', '--show-details=always'], {
            severityChangeRx,
            severity: 'build',
        });
    }
    async bench() {
        const severityChangeRx = {};
        severityChangeRx[this.opts.opts.severity] = /Running \d+ benchmarks\.\.\./;
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
    async createSandbox() {
        return process_1.runProcess('cabal', [await this.withPrefix('sandbox'), 'init'], this.spawnOpts, this.opts.opts);
    }
    async commonBuild(command, args, override = {}) {
        return this.runCabal([
            await this.withPrefix(command),
            ...args,
            '--builddir=' + cabal_1.getCabalOpts().buildDir,
        ], override);
    }
    async withPrefix(cmd) {
        const version = (await this.versionPromise).split('.');
        const major = parseInt(version[0], 10);
        const minor = parseInt(version[1], 10);
        if (major > 2 || (major == 2 && minor >= 4)) {
            return `v1-${cmd}`;
        }
        else {
            return cmd;
        }
    }
}
exports.Builder = Builder;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FiYWwtdjEuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvYnVpbGRlcnMvY2FiYWwtdjEudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFDQSw0Q0FBb0Q7QUFDcEQsd0NBQXNEO0FBRXRELE1BQWEsT0FBUSxTQUFRLGlCQUFTO0lBQ3BDLFlBQVksSUFBYztRQUN4QixLQUFLLENBQUMsSUFBSSxDQUFDLENBQUE7SUFDYixDQUFDO0lBRU0sS0FBSyxDQUFDLEtBQUs7UUFDaEIsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDLE9BQU8sRUFBRSxDQUFDLFFBQVEsRUFBRSxHQUFHLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDLENBQUE7SUFDbkUsQ0FBQztJQUNNLEtBQUssQ0FBQyxJQUFJO1FBQ2YsTUFBTSxnQkFBZ0IsR0FBRyxFQUFFLENBQUE7UUFDM0IsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsK0JBQStCLENBQUE7UUFDM0UsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDLE1BQU0sRUFBRSxDQUFDLFFBQVEsRUFBRSx1QkFBdUIsQ0FBQyxFQUFFO1lBQ25FLGdCQUFnQjtZQUNoQixRQUFRLEVBQUUsT0FBTztTQUNsQixDQUFDLENBQUE7SUFDSixDQUFDO0lBQ00sS0FBSyxDQUFDLEtBQUs7UUFDaEIsTUFBTSxnQkFBZ0IsR0FBRyxFQUFFLENBQUE7UUFDM0IsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsOEJBQThCLENBQUE7UUFDMUUsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDLE9BQU8sRUFBRSxDQUFDLFFBQVEsRUFBRSx1QkFBdUIsQ0FBQyxFQUFFO1lBQ3BFLGdCQUFnQjtZQUNoQixRQUFRLEVBQUUsT0FBTztTQUNsQixDQUFDLENBQUE7SUFDSixDQUFDO0lBQ00sS0FBSyxDQUFDLEtBQUs7UUFD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QUFNLE9BQU8sR0FBRyxDQUFDLE1BQU0sSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQTtRQUN0RCxNQUFNLEtBQUssR0FBRyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFBO1FBQ3RDLE1BQU0sS0FBSyxHQUFHLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUE7UUFDdEMsSUFBSSxLQUFLLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxJQUFJLENBQUMsSUFBSSxLQUFLLElBQUksQ0FBQyxDQUFDLEVBQUU7WUFDM0MsT0FBTyxNQUFNLEdBQUcsRUFBRSxDQUFBO1NBQ25CO2FBQU07WUFDTCxPQUFPLEdBQUcsQ0FBQTtTQUNYO0lBQ0gsQ0FBQztDQUNGO0FBdEhELDBCQXNIQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEN0b3JPcHRzIH0gZnJvbSAnLi9iYXNlJ1xuaW1wb3J0IHsgcnVuUHJvY2VzcywgSVBhcmFtcyB9IGZyb20gJy4vYmFzZS9wcm9jZXNzJ1xuaW1wb3J0IHsgQ2FiYWxCYXNlLCBnZXRDYWJhbE9wdHMgfSBmcm9tICcuL2Jhc2UvY2FiYWwnXG5cbmV4cG9ydCBjbGFzcyBCdWlsZGVyIGV4dGVuZHMgQ2FiYWxCYXNlIHtcbiAgY29uc3RydWN0b3Iob3B0czogQ3Rvck9wdHMpIHtcbiAgICBzdXBlcihvcHRzKVxuICB9XG5cbiAgcHVibGljIGFzeW5jIGJ1aWxkKCkge1xuICAgIHJldHVybiB0aGlzLmNvbW1vbkJ1aWxkKCdidWlsZCcsIFsnLS1vbmx5JywgLi4udGhpcy5jb21wb25lbnQoKV0pXG4gIH1cbiAgcHVibGljIGFzeW5jIHRlc3QoKSB7XG4gICAgY29uc3Qgc2V2ZXJpdHlDaGFuZ2VSeCA9IHt9XG4gICAgc2V2ZXJpdHlDaGFuZ2VSeFt0aGlzLm9wdHMub3B0cy5zZXZlcml0eV0gPSAvUnVubmluZyBcXGQrIHRlc3Qgc3VpdGVzXFwuXFwuXFwuL1xuICAgIHJldHVybiB0aGlzLmNvbW1vbkJ1aWxkKCd0ZXN0JywgWyctLW9ubHknLCAnLS1zaG93LWRldGFpbHM9YWx3YXlzJ10sIHtcbiAgICAgIHNldmVyaXR5Q2hhbmdlUngsXG4gICAgICBzZXZlcml0eTogJ2J1aWxkJyxcbiAgICB9KVxuICB9XG4gIHB1YmxpYyBhc3luYyBiZW5jaCgpIHtcbiAgICBjb25zdCBzZXZlcml0eUNoYW5nZVJ4ID0ge31cbiAgICBzZXZlcml0eUNoYW5nZVJ4W3RoaXMub3B0cy5vcHRzLnNldmVyaXR5XSA9IC9SdW5uaW5nIFxcZCsgYmVuY2htYXJrc1xcLlxcLlxcLi9cbiAgICByZXR1cm4gdGhpcy5jb21tb25CdWlsZCgnYmVuY2gnLCBbJy0tb25seScsICctLXNob3ctZGV0YWlscz1hbHdheXMnXSwge1xuICAgICAgc2V2ZXJpdHlDaGFuZ2VSeCxcbiAgICAgIHNldmVyaXR5OiAnYnVpbGQnLFxuICAgIH0pXG4gIH1cbiAgcHVibGljIGFzeW5jIGNsZWFuKCkge1xuICAgIHJldHVybiB0aGlzLmNvbW1vbkJ1aWxkKCdjbGVhbicsIFsnLS1zYXZlLWNvbmZpZ3VyZSddKVxuICB9XG4gIHB1YmxpYyBhc3luYyBkZXBzKCkge1xuICAgIGNvbnN0IGlnbnMgPSBhdG9tLmNvbmZpZy5nZXQoJ2lkZS1oYXNrZWxsLWNhYmFsLmNhYmFsLmlnbm9yZU5vU2FuZGJveCcpXG4gICAgY29uc3Qgc2FuZGJveENvbmZpZyA9XG4gICAgICB0aGlzLnNwYXduT3B0cy5lbnYuQ0FCQUxfU0FOREJPWF9DT05GSUcgfHwgJ2NhYmFsLnNhbmRib3guY29uZmlnJ1xuICAgIGNvbnN0IHNlID0gdGhpcy5vcHRzLmNhYmFsUm9vdC5nZXRGaWxlKHNhbmRib3hDb25maWcpLmV4aXN0c1N5bmMoKVxuICAgIGlmICghKHNlIHx8IGlnbnMpKSB7XG4gICAgICBjb25zdCByZXMgPSBhd2FpdCBuZXcgUHJvbWlzZTx7IGV4aXRDb2RlOiBudW1iZXI7IGhhc0Vycm9yOiBib29sZWFuIH0+KFxuICAgICAgICAocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgY29uc3Qgbm90aWZpY2F0aW9uID0gYXRvbS5ub3RpZmljYXRpb25zLmFkZFdhcm5pbmcoXG4gICAgICAgICAgICAnTm8gc2FuZGJveCBmb3VuZCwgc3RvcHBpbmcnLFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBkaXNtaXNzYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgICAgZGV0YWlsOlxuICAgICAgICAgICAgICAgICdpZGUtaGFza2VsbC1jYWJhbCBkaWQgbm90IGZpbmQgc2FuZGJveCBjb25maWd1cmF0aW9uICcgK1xuICAgICAgICAgICAgICAgICdmaWxlLiBJbnN0YWxsaW5nIGRlcGVuZGVuY2llcyB3aXRob3V0IHNhbmRib3ggaXMgJyArXG4gICAgICAgICAgICAgICAgJ2Rhbmdlcm91cyBhbmQgaXMgbm90IHJlY29tbWVuZGVkLiBJdCBpcyBzdWdnZXN0ZWQgdG8gJyArXG4gICAgICAgICAgICAgICAgJ2NyZWF0ZSBhIHNhbmRib3ggcmlnaHQgbm93LicsXG4gICAgICAgICAgICAgIGJ1dHRvbnM6IFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICBjbGFzc05hbWU6ICdpY29uIGljb24tcm9ja2V0JyxcbiAgICAgICAgICAgICAgICAgIHRleHQ6ICdDbGljayBoZXJlIHRvIGNyZWF0ZSB0aGUgc2FuZGJveCcsXG4gICAgICAgICAgICAgICAgICBvbkRpZENsaWNrOiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUodGhpcy5jcmVhdGVTYW5kYm94KCkpXG4gICAgICAgICAgICAgICAgICAgIG5vdGlmaWNhdGlvbi5kaXNtaXNzKClcbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgKVxuICAgICAgICAgIGNvbnN0IGRpc3AgPSBub3RpZmljYXRpb24ub25EaWREaXNtaXNzKCgpID0+IHtcbiAgICAgICAgICAgIGRpc3AuZGlzcG9zZSgpXG4gICAgICAgICAgICByZWplY3QoKVxuICAgICAgICAgIH0pXG4gICAgICAgIH0sXG4gICAgICApXG4gICAgICBpZiAocmVzLmV4aXRDb2RlICE9PSAwKSB7XG4gICAgICAgIHJldHVybiByZXNcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuY29tbW9uQnVpbGQoJ2luc3RhbGwnLCBbXG4gICAgICAnLS1vbmx5LWRlcGVuZGVuY2llcycsXG4gICAgICAnLS1lbmFibGUtdGVzdHMnLFxuICAgICAgJy0tZW5hYmxlLWJlbmNobWFya3MnLFxuICAgIF0pXG4gIH1cblxuICBwcm90ZWN0ZWQgYWRkaXRpb25hbEVudlNldHVwKGVudjogdHlwZW9mIHByb2Nlc3MuZW52KSB7XG4gICAgZW52ID0gc3VwZXIuYWRkaXRpb25hbEVudlNldHVwKGVudilcblxuICAgIC8vIFNldCBzYW5kYm94IGZpbGUgKGlmIHNwZWNpZmllZClcbiAgICBjb25zdCBzYW5kYm94Q29uZmlnID0gZ2V0Q2FiYWxPcHRzKCkuc2FuZGJveFxuICAgIGlmIChzYW5kYm94Q29uZmlnICE9PSAnJykge1xuICAgICAgZW52LkNBQkFMX1NBTkRCT1hfQ09ORklHID0gc2FuZGJveENvbmZpZ1xuICAgIH1cbiAgICByZXR1cm4gZW52XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGNyZWF0ZVNhbmRib3goKSB7XG4gICAgcmV0dXJuIHJ1blByb2Nlc3MoXG4gICAgICAnY2FiYWwnLFxuICAgICAgW2F3YWl0IHRoaXMud2l0aFByZWZpeCgnc2FuZGJveCcpLCAnaW5pdCddLFxuICAgICAgdGhpcy5zcGF3bk9wdHMsXG4gICAgICB0aGlzLm9wdHMub3B0cyxcbiAgICApXG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGNvbW1vbkJ1aWxkKFxuICAgIGNvbW1hbmQ6ICdidWlsZCcgfCAndGVzdCcgfCAnYmVuY2gnIHwgJ2luc3RhbGwnIHwgJ2NsZWFuJyxcbiAgICBhcmdzOiBzdHJpbmdbXSxcbiAgICBvdmVycmlkZTogUGFydGlhbDxJUGFyYW1zPiA9IHt9LFxuICApIHtcbiAgICByZXR1cm4gdGhpcy5ydW5DYWJhbChcbiAgICAgIFtcbiAgICAgICAgYXdhaXQgdGhpcy53aXRoUHJlZml4KGNvbW1hbmQpLFxuICAgICAgICAuLi5hcmdzLFxuICAgICAgICAnLS1idWlsZGRpcj0nICsgZ2V0Q2FiYWxPcHRzKCkuYnVpbGREaXIsXG4gICAgICBdLFxuICAgICAgb3ZlcnJpZGUsXG4gICAgKVxuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyB3aXRoUHJlZml4KGNtZDogc3RyaW5nKSB7XG4gICAgY29uc3QgdmVyc2lvbiA9IChhd2FpdCB0aGlzLnZlcnNpb25Qcm9taXNlKS5zcGxpdCgnLicpXG4gICAgY29uc3QgbWFqb3IgPSBwYXJzZUludCh2ZXJzaW9uWzBdLCAxMClcbiAgICBjb25zdCBtaW5vciA9IHBhcnNlSW50KHZlcnNpb25bMV0sIDEwKVxuICAgIGlmIChtYWpvciA+IDIgfHwgKG1ham9yID09IDIgJiYgbWlub3IgPj0gNCkpIHtcbiAgICAgIHJldHVybiBgdjEtJHtjbWR9YFxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gY21kXG4gICAgfVxuICB9XG59XG4iXX0=