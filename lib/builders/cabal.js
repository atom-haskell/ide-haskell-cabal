"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const base_1 = require("./base");
const cabal_process_1 = require("./cabal-process");
class Builder extends base_1.BuilderBase {
    constructor(opts) {
        super('cabal', opts);
    }
    build() {
        return __awaiter(this, void 0, void 0, function* () {
            this.cabalArgs = ['build', '--only'];
            if (this.opts.target.target) {
                this.cabalArgs.push(this.opts.target.target.target);
            }
            return this.commonBuild();
        });
    }
    test() {
        return __awaiter(this, void 0, void 0, function* () {
            this.opts.opts.severityChangeRx = {};
            this.opts.opts.severityChangeRx[this.opts.opts.severity] = /Running \d+ test suites\.\.\./;
            this.opts.opts.severity = 'build';
            this.cabalArgs = ['test', '--only', '--show-details=always'];
            return this.commonBuild();
        });
    }
    bench() {
        return __awaiter(this, void 0, void 0, function* () {
            this.opts.opts.severityChangeRx = {};
            this.opts.opts.severityChangeRx[this.opts.opts.severity] = /Running \d+ benchmarks\.\.\./;
            this.opts.opts.severity = 'build';
            this.cabalArgs = ['bench', '--only', '--show-details=always'];
            return this.commonBuild();
        });
    }
    clean() {
        return __awaiter(this, void 0, void 0, function* () {
            this.cabalArgs = ['clean', '--save-configure'];
            return this.commonBuild();
        });
    }
    deps() {
        return __awaiter(this, void 0, void 0, function* () {
            const igns = atom.config.get('ide-haskell-cabal.cabal.ignoreNoSandbox');
            const sandboxConfig = this.spawnOpts.env['CABAL_SANDBOX_CONFIG'] || 'cabal.sandbox.config';
            const se = this.opts.cabalRoot.getFile(sandboxConfig).existsSync();
            if (!(se || igns)) {
                const res = yield new Promise((resolve, reject) => {
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
                                }
                            }
                        ]
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
        });
    }
    createSandbox() {
        return __awaiter(this, void 0, void 0, function* () {
            return cabal_process_1.runCabalProcess('cabal', ['sandbox', 'init'], this.spawnOpts, this.opts.opts);
        });
    }
    commonBuild() {
        return __awaiter(this, void 0, void 0, function* () {
            this.cabalArgs.push('--builddir=' + this.getConfigOpt('buildDir'));
            return this.runCabal();
        });
    }
}
exports.Builder = Builder;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FiYWwuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvYnVpbGRlcnMvY2FiYWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUFBLGlDQUE0QztBQUU1QyxtREFBK0M7QUFFL0MsYUFBcUIsU0FBUSxrQkFBVztJQUN0QyxZQUFhLElBQWM7UUFDekIsS0FBSyxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQTtJQUN0QixDQUFDO0lBRWUsS0FBSzs7WUFDbkIsSUFBSSxDQUFDLFNBQVMsR0FBRyxDQUFDLE9BQU8sRUFBRSxRQUFRLENBQUMsQ0FBQTtZQUNwQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO2dCQUM1QixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUE7WUFDckQsQ0FBQztZQUNELE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUE7UUFDM0IsQ0FBQztLQUFBO0lBQ2UsSUFBSTs7WUFDbEIsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsRUFBRSxDQUFBO1lBQ3BDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLCtCQUErQixDQUFBO1lBQzFGLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsR0FBRyxPQUFPLENBQUE7WUFDakMsSUFBSSxDQUFDLFNBQVMsR0FBRyxDQUFDLE1BQU0sRUFBRSxRQUFRLEVBQUUsdUJBQXVCLENBQUMsQ0FBQTtZQUM1RCxNQUFNLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFBO1FBQzNCLENBQUM7S0FBQTtJQUNlLEtBQUs7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LENBQUMsWUFBWSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUE7WUFDbEUsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQTtRQUN4QixDQUFDO0tBQUE7Q0FDRjtBQTNFRCwwQkEyRUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge0N0b3JPcHRzLCBCdWlsZGVyQmFzZX0gZnJvbSAnLi9iYXNlJ1xuXG5pbXBvcnQge3J1bkNhYmFsUHJvY2Vzc30gZnJvbSAnLi9jYWJhbC1wcm9jZXNzJ1xuXG5leHBvcnQgY2xhc3MgQnVpbGRlciBleHRlbmRzIEJ1aWxkZXJCYXNlIHtcbiAgY29uc3RydWN0b3IgKG9wdHM6IEN0b3JPcHRzKSB7XG4gICAgc3VwZXIoJ2NhYmFsJywgb3B0cylcbiAgfVxuXG4gIHByb3RlY3RlZCBhc3luYyBidWlsZCAoKSB7XG4gICAgdGhpcy5jYWJhbEFyZ3MgPSBbJ2J1aWxkJywgJy0tb25seSddXG4gICAgaWYgKHRoaXMub3B0cy50YXJnZXQudGFyZ2V0KSB7XG4gICAgICB0aGlzLmNhYmFsQXJncy5wdXNoKHRoaXMub3B0cy50YXJnZXQudGFyZ2V0LnRhcmdldClcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuY29tbW9uQnVpbGQoKVxuICB9XG4gIHByb3RlY3RlZCBhc3luYyB0ZXN0ICgpIHtcbiAgICB0aGlzLm9wdHMub3B0cy5zZXZlcml0eUNoYW5nZVJ4ID0ge31cbiAgICB0aGlzLm9wdHMub3B0cy5zZXZlcml0eUNoYW5nZVJ4W3RoaXMub3B0cy5vcHRzLnNldmVyaXR5XSA9IC9SdW5uaW5nIFxcZCsgdGVzdCBzdWl0ZXNcXC5cXC5cXC4vXG4gICAgdGhpcy5vcHRzLm9wdHMuc2V2ZXJpdHkgPSAnYnVpbGQnXG4gICAgdGhpcy5jYWJhbEFyZ3MgPSBbJ3Rlc3QnLCAnLS1vbmx5JywgJy0tc2hvdy1kZXRhaWxzPWFsd2F5cyddXG4gICAgcmV0dXJuIHRoaXMuY29tbW9uQnVpbGQoKVxuICB9XG4gIHByb3RlY3RlZCBhc3luYyBiZW5jaCAoKSB7XG4gICAgdGhpcy5vcHRzLm9wdHMuc2V2ZXJpdHlDaGFuZ2VSeCA9IHt9XG4gICAgdGhpcy5vcHRzLm9wdHMuc2V2ZXJpdHlDaGFuZ2VSeFt0aGlzLm9wdHMub3B0cy5zZXZlcml0eV0gPSAgL1J1bm5pbmcgXFxkKyBiZW5jaG1hcmtzXFwuXFwuXFwuL1xuICAgIHRoaXMub3B0cy5vcHRzLnNldmVyaXR5ID0gJ2J1aWxkJ1xuICAgIHRoaXMuY2FiYWxBcmdzID0gWydiZW5jaCcsICctLW9ubHknLCAnLS1zaG93LWRldGFpbHM9YWx3YXlzJ11cbiAgICByZXR1cm4gdGhpcy5jb21tb25CdWlsZCgpXG4gIH1cbiAgcHJvdGVjdGVkIGFzeW5jIGNsZWFuICgpIHtcbiAgICB0aGlzLmNhYmFsQXJncyA9IFsnY2xlYW4nLCAnLS1zYXZlLWNvbmZpZ3VyZSddXG4gICAgcmV0dXJuIHRoaXMuY29tbW9uQnVpbGQoKVxuICB9XG4gIHByb3RlY3RlZCBhc3luYyBkZXBzICgpIHtcbiAgICBjb25zdCBpZ25zID0gYXRvbS5jb25maWcuZ2V0KCdpZGUtaGFza2VsbC1jYWJhbC5jYWJhbC5pZ25vcmVOb1NhbmRib3gnKVxuICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTogbm8tc3RyaW5nLWxpdGVyYWxcbiAgICBjb25zdCBzYW5kYm94Q29uZmlnID0gdGhpcy5zcGF3bk9wdHMuZW52WydDQUJBTF9TQU5EQk9YX0NPTkZJRyddIHx8ICdjYWJhbC5zYW5kYm94LmNvbmZpZydcbiAgICBjb25zdCBzZSA9IHRoaXMub3B0cy5jYWJhbFJvb3QuZ2V0RmlsZShzYW5kYm94Q29uZmlnKS5leGlzdHNTeW5jKClcbiAgICBpZiAoIShzZSB8fCBpZ25zKSkge1xuICAgICAgY29uc3QgcmVzID0gYXdhaXQgbmV3IFByb21pc2U8e2V4aXRDb2RlOiBudW1iZXIsIGhhc0Vycm9yOiBib29sZWFufT4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBjb25zdCBub3RpZmljYXRpb24gPSBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkV2FybmluZygnTm8gc2FuZGJveCBmb3VuZCwgc3RvcHBpbmcnLCB7XG4gICAgICAgICAgZGlzbWlzc2FibGU6IHRydWUsXG4gICAgICAgICAgZGV0YWlsOiAnaWRlLWhhc2tlbGwtY2FiYWwgZGlkIG5vdCBmaW5kIHNhbmRib3ggY29uZmlndXJhdGlvbiAnICtcbiAgICAgICAgICAgICAgICAgICdmaWxlLiBJbnN0YWxsaW5nIGRlcGVuZGVuY2llcyB3aXRob3V0IHNhbmRib3ggaXMgJyArXG4gICAgICAgICAgICAgICAgICAnZGFuZ2Vyb3VzIGFuZCBpcyBub3QgcmVjb21tZW5kZWQuIEl0IGlzIHN1Z2dlc3RlZCB0byAnICtcbiAgICAgICAgICAgICAgICAgICdjcmVhdGUgYSBzYW5kYm94IHJpZ2h0IG5vdy4nLFxuICAgICAgICAgIGJ1dHRvbnM6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgY2xhc3NOYW1lOiAnaWNvbiBpY29uLXJvY2tldCcsXG4gICAgICAgICAgICAgIHRleHQ6ICdDbGljayBoZXJlIHRvIGNyZWF0ZSB0aGUgc2FuZGJveCcsXG4gICAgICAgICAgICAgIG9uRGlkQ2xpY2s6ICgpID0+IHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHRoaXMuY3JlYXRlU2FuZGJveCgpKVxuICAgICAgICAgICAgICAgIG5vdGlmaWNhdGlvbi5kaXNtaXNzKClcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIF1cbiAgICAgICAgfSlcbiAgICAgICAgY29uc3QgZGlzcCA9IG5vdGlmaWNhdGlvbi5vbkRpZERpc21pc3MoKCkgPT4ge1xuICAgICAgICAgIGRpc3AuZGlzcG9zZSgpXG4gICAgICAgICAgcmVqZWN0KClcbiAgICAgICAgfSlcbiAgICAgIH0pXG4gICAgICBpZiAocmVzLmV4aXRDb2RlICE9PSAwKSB7XG4gICAgICAgIHJldHVybiByZXNcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5jYWJhbEFyZ3MgPSBbJ2luc3RhbGwnLCAnLS1vbmx5LWRlcGVuZGVuY2llcycsICctLWVuYWJsZS10ZXN0cycsICctLWVuYWJsZS1iZW5jaG1hcmtzJ11cbiAgICByZXR1cm4gdGhpcy5jb21tb25CdWlsZCgpXG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGNyZWF0ZVNhbmRib3ggKCkge1xuICAgIHJldHVybiBydW5DYWJhbFByb2Nlc3MoJ2NhYmFsJywgWydzYW5kYm94JywgJ2luaXQnXSwgdGhpcy5zcGF3bk9wdHMsIHRoaXMub3B0cy5vcHRzKVxuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBjb21tb25CdWlsZCAoKTogUHJvbWlzZTx7ZXhpdENvZGU6IG51bWJlciwgaGFzRXJyb3I6IGJvb2xlYW59PiB7XG4gICAgdGhpcy5jYWJhbEFyZ3MucHVzaCgnLS1idWlsZGRpcj0nICsgdGhpcy5nZXRDb25maWdPcHQoJ2J1aWxkRGlyJykpXG4gICAgcmV0dXJuIHRoaXMucnVuQ2FiYWwoKVxuICB9XG59XG4iXX0=