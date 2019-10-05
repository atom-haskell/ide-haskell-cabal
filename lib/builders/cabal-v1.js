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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FiYWwtdjEuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvYnVpbGRlcnMvY2FiYWwtdjEudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFDQSw0Q0FBb0Q7QUFDcEQsd0NBQXNEO0FBRXRELE1BQWEsT0FBUSxTQUFRLGlCQUFTO0lBQ3BDLFlBQVksSUFBYztRQUN4QixLQUFLLENBQUMsSUFBSSxDQUFDLENBQUE7SUFDYixDQUFDO0lBRU0sS0FBSyxDQUFDLEtBQUs7UUFDaEIsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDLE9BQU8sRUFBRSxDQUFDLFFBQVEsRUFBRSxHQUFHLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDLENBQUE7SUFDbkUsQ0FBQztJQUNNLEtBQUssQ0FBQyxJQUFJO1FBQ2YsTUFBTSxnQkFBZ0IsR0FBRyxFQUFFLENBQUE7UUFDM0IsZ0JBQWdCLENBQ2QsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUMxQixHQUFHLCtCQUErQixDQUFBO1FBQ25DLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxRQUFRLEVBQUUsdUJBQXVCLENBQUMsRUFBRTtZQUNuRSxnQkFBZ0I7WUFDaEIsUUFBUSxFQUFFLE9BQU87U0FDbEIsQ0FBQyxDQUFBO0lBQ0osQ0FBQztJQUNNLEtBQUssQ0FBQyxLQUFLO1FBQ2hCLE1BQU0sZ0JBQWdCLEdBQUcsRUFBRSxDQUFBO1FBQzNCLGdCQUFnQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxHQUFHLDhCQUE4QixDQUFBO1FBQzVFLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxRQUFRLEVBQUUsdUJBQXVCLENBQUMsRUFBRTtZQUNwRSxnQkFBZ0I7WUFDaEIsUUFBUSxFQUFFLE9BQU87U0FDbEIsQ0FBQyxDQUFBO0lBQ0osQ0FBQztJQUNNLEtBQUssQ0FBQyxLQUFLO1FB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LEdBQVc7UUFDbEMsTUFBTSxPQUFPLEdBQUcsQ0FBQyxNQUFNLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUE7UUFDdEQsTUFBTSxLQUFLLEdBQUcsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQTtRQUN0QyxNQUFNLEtBQUssR0FBRyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFBO1FBQ3RDLElBQUksS0FBSyxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssSUFBSSxDQUFDLElBQUksS0FBSyxJQUFJLENBQUMsQ0FBQyxFQUFFO1lBQzNDLE9BQU8sTUFBTSxHQUFHLEVBQUUsQ0FBQTtTQUNuQjthQUFNO1lBQ0wsT0FBTyxHQUFHLENBQUE7U0FDWDtJQUNILENBQUM7Q0FDRjtBQXhIRCwwQkF3SEMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDdG9yT3B0cyB9IGZyb20gJy4vYmFzZSdcbmltcG9ydCB7IHJ1blByb2Nlc3MsIElQYXJhbXMgfSBmcm9tICcuL2Jhc2UvcHJvY2VzcydcbmltcG9ydCB7IENhYmFsQmFzZSwgZ2V0Q2FiYWxPcHRzIH0gZnJvbSAnLi9iYXNlL2NhYmFsJ1xuXG5leHBvcnQgY2xhc3MgQnVpbGRlciBleHRlbmRzIENhYmFsQmFzZSB7XG4gIGNvbnN0cnVjdG9yKG9wdHM6IEN0b3JPcHRzKSB7XG4gICAgc3VwZXIob3B0cylcbiAgfVxuXG4gIHB1YmxpYyBhc3luYyBidWlsZCgpIHtcbiAgICByZXR1cm4gdGhpcy5jb21tb25CdWlsZCgnYnVpbGQnLCBbJy0tb25seScsIC4uLnRoaXMuY29tcG9uZW50KCldKVxuICB9XG4gIHB1YmxpYyBhc3luYyB0ZXN0KCkge1xuICAgIGNvbnN0IHNldmVyaXR5Q2hhbmdlUnggPSB7fVxuICAgIHNldmVyaXR5Q2hhbmdlUnhbXG4gICAgICB0aGlzLm9wdHMucGFyYW1zLnNldmVyaXR5XG4gICAgXSA9IC9SdW5uaW5nIFxcZCsgdGVzdCBzdWl0ZXNcXC5cXC5cXC4vXG4gICAgcmV0dXJuIHRoaXMuY29tbW9uQnVpbGQoJ3Rlc3QnLCBbJy0tb25seScsICctLXNob3ctZGV0YWlscz1hbHdheXMnXSwge1xuICAgICAgc2V2ZXJpdHlDaGFuZ2VSeCxcbiAgICAgIHNldmVyaXR5OiAnYnVpbGQnLFxuICAgIH0pXG4gIH1cbiAgcHVibGljIGFzeW5jIGJlbmNoKCkge1xuICAgIGNvbnN0IHNldmVyaXR5Q2hhbmdlUnggPSB7fVxuICAgIHNldmVyaXR5Q2hhbmdlUnhbdGhpcy5vcHRzLnBhcmFtcy5zZXZlcml0eV0gPSAvUnVubmluZyBcXGQrIGJlbmNobWFya3NcXC5cXC5cXC4vXG4gICAgcmV0dXJuIHRoaXMuY29tbW9uQnVpbGQoJ2JlbmNoJywgWyctLW9ubHknLCAnLS1zaG93LWRldGFpbHM9YWx3YXlzJ10sIHtcbiAgICAgIHNldmVyaXR5Q2hhbmdlUngsXG4gICAgICBzZXZlcml0eTogJ2J1aWxkJyxcbiAgICB9KVxuICB9XG4gIHB1YmxpYyBhc3luYyBjbGVhbigpIHtcbiAgICByZXR1cm4gdGhpcy5jb21tb25CdWlsZCgnY2xlYW4nLCBbJy0tc2F2ZS1jb25maWd1cmUnXSlcbiAgfVxuICBwdWJsaWMgYXN5bmMgZGVwcygpIHtcbiAgICBjb25zdCBpZ25zID0gYXRvbS5jb25maWcuZ2V0KCdpZGUtaGFza2VsbC1jYWJhbC5jYWJhbC5pZ25vcmVOb1NhbmRib3gnKVxuICAgIGNvbnN0IHNhbmRib3hDb25maWcgPVxuICAgICAgdGhpcy5nZXRTcGF3bk9wdHMoKS5lbnYuQ0FCQUxfU0FOREJPWF9DT05GSUcgfHwgJ2NhYmFsLnNhbmRib3guY29uZmlnJ1xuICAgIGNvbnN0IHNlID0gdGhpcy5vcHRzLmNhYmFsUm9vdC5nZXRGaWxlKHNhbmRib3hDb25maWcpLmV4aXN0c1N5bmMoKVxuICAgIGlmICghKHNlIHx8IGlnbnMpKSB7XG4gICAgICBjb25zdCByZXMgPSBhd2FpdCBuZXcgUHJvbWlzZTx7IGV4aXRDb2RlOiBudW1iZXI7IGhhc0Vycm9yOiBib29sZWFuIH0+KFxuICAgICAgICAocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgY29uc3Qgbm90aWZpY2F0aW9uID0gYXRvbS5ub3RpZmljYXRpb25zLmFkZFdhcm5pbmcoXG4gICAgICAgICAgICAnTm8gc2FuZGJveCBmb3VuZCwgc3RvcHBpbmcnLFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBkaXNtaXNzYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgICAgZGV0YWlsOlxuICAgICAgICAgICAgICAgICdpZGUtaGFza2VsbC1jYWJhbCBkaWQgbm90IGZpbmQgc2FuZGJveCBjb25maWd1cmF0aW9uICcgK1xuICAgICAgICAgICAgICAgICdmaWxlLiBJbnN0YWxsaW5nIGRlcGVuZGVuY2llcyB3aXRob3V0IHNhbmRib3ggaXMgJyArXG4gICAgICAgICAgICAgICAgJ2Rhbmdlcm91cyBhbmQgaXMgbm90IHJlY29tbWVuZGVkLiBJdCBpcyBzdWdnZXN0ZWQgdG8gJyArXG4gICAgICAgICAgICAgICAgJ2NyZWF0ZSBhIHNhbmRib3ggcmlnaHQgbm93LicsXG4gICAgICAgICAgICAgIGJ1dHRvbnM6IFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICBjbGFzc05hbWU6ICdpY29uIGljb24tcm9ja2V0JyxcbiAgICAgICAgICAgICAgICAgIHRleHQ6ICdDbGljayBoZXJlIHRvIGNyZWF0ZSB0aGUgc2FuZGJveCcsXG4gICAgICAgICAgICAgICAgICBvbkRpZENsaWNrOiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUodGhpcy5jcmVhdGVTYW5kYm94KCkpXG4gICAgICAgICAgICAgICAgICAgIG5vdGlmaWNhdGlvbi5kaXNtaXNzKClcbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgKVxuICAgICAgICAgIGNvbnN0IGRpc3AgPSBub3RpZmljYXRpb24ub25EaWREaXNtaXNzKCgpID0+IHtcbiAgICAgICAgICAgIGRpc3AuZGlzcG9zZSgpXG4gICAgICAgICAgICByZWplY3QoKVxuICAgICAgICAgIH0pXG4gICAgICAgIH0sXG4gICAgICApXG4gICAgICBpZiAocmVzLmV4aXRDb2RlICE9PSAwKSB7XG4gICAgICAgIHJldHVybiByZXNcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuY29tbW9uQnVpbGQoJ2luc3RhbGwnLCBbXG4gICAgICAnLS1vbmx5LWRlcGVuZGVuY2llcycsXG4gICAgICAnLS1lbmFibGUtdGVzdHMnLFxuICAgICAgJy0tZW5hYmxlLWJlbmNobWFya3MnLFxuICAgIF0pXG4gIH1cblxuICBwcm90ZWN0ZWQgYWRkaXRpb25hbEVudlNldHVwKGVudjogdHlwZW9mIHByb2Nlc3MuZW52KSB7XG4gICAgZW52ID0gc3VwZXIuYWRkaXRpb25hbEVudlNldHVwKGVudilcblxuICAgIC8vIFNldCBzYW5kYm94IGZpbGUgKGlmIHNwZWNpZmllZClcbiAgICBjb25zdCBzYW5kYm94Q29uZmlnID0gZ2V0Q2FiYWxPcHRzKCkuc2FuZGJveFxuICAgIGlmIChzYW5kYm94Q29uZmlnICE9PSAnJykge1xuICAgICAgZW52LkNBQkFMX1NBTkRCT1hfQ09ORklHID0gc2FuZGJveENvbmZpZ1xuICAgIH1cbiAgICByZXR1cm4gZW52XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGNyZWF0ZVNhbmRib3goKSB7XG4gICAgcmV0dXJuIHJ1blByb2Nlc3MoXG4gICAgICAnY2FiYWwnLFxuICAgICAgW2F3YWl0IHRoaXMud2l0aFByZWZpeCgnc2FuZGJveCcpLCAnaW5pdCddLFxuICAgICAgdGhpcy5nZXRTcGF3bk9wdHMoKSxcbiAgICAgIHRoaXMub3B0cy5wYXJhbXMsXG4gICAgKVxuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBjb21tb25CdWlsZChcbiAgICBjb21tYW5kOiAnYnVpbGQnIHwgJ3Rlc3QnIHwgJ2JlbmNoJyB8ICdpbnN0YWxsJyB8ICdjbGVhbicsXG4gICAgYXJnczogc3RyaW5nW10sXG4gICAgb3ZlcnJpZGU6IFBhcnRpYWw8SVBhcmFtcz4gPSB7fSxcbiAgKSB7XG4gICAgcmV0dXJuIHRoaXMucnVuQ2FiYWwoXG4gICAgICBbXG4gICAgICAgIGF3YWl0IHRoaXMud2l0aFByZWZpeChjb21tYW5kKSxcbiAgICAgICAgLi4uYXJncyxcbiAgICAgICAgJy0tYnVpbGRkaXI9JyArIGdldENhYmFsT3B0cygpLmJ1aWxkRGlyLFxuICAgICAgXSxcbiAgICAgIG92ZXJyaWRlLFxuICAgIClcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgd2l0aFByZWZpeChjbWQ6IHN0cmluZykge1xuICAgIGNvbnN0IHZlcnNpb24gPSAoYXdhaXQgdGhpcy52ZXJzaW9uUHJvbWlzZSkuc3BsaXQoJy4nKVxuICAgIGNvbnN0IG1ham9yID0gcGFyc2VJbnQodmVyc2lvblswXSwgMTApXG4gICAgY29uc3QgbWlub3IgPSBwYXJzZUludCh2ZXJzaW9uWzFdLCAxMClcbiAgICBpZiAobWFqb3IgPiAyIHx8IChtYWpvciA9PSAyICYmIG1pbm9yID49IDQpKSB7XG4gICAgICByZXR1cm4gYHYxLSR7Y21kfWBcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGNtZFxuICAgIH1cbiAgfVxufVxuIl19