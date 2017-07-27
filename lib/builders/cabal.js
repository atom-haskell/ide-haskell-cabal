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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FiYWwuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvYnVpbGRlcnMvY2FiYWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUFBLGlDQUE0QztBQUU1QyxtREFBK0M7QUFFL0MsYUFBcUIsU0FBUSxrQkFBVztJQUN0QyxZQUFhLElBQWM7UUFDekIsS0FBSyxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQTtJQUN0QixDQUFDO0lBRVksS0FBSzs7WUFDaEIsSUFBSSxDQUFDLFNBQVMsR0FBRyxDQUFDLE9BQU8sRUFBRSxRQUFRLENBQUMsQ0FBQTtZQUNwQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO2dCQUM1QixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUE7WUFDckQsQ0FBQztZQUNELE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUE7UUFDM0IsQ0FBQztLQUFBO0lBQ1ksSUFBSTs7WUFDZixJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxFQUFFLENBQUE7WUFDcEMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsK0JBQStCLENBQUE7WUFDMUYsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxHQUFHLE9BQU8sQ0FBQTtZQUNqQyxJQUFJLENBQUMsU0FBUyxHQUFHLENBQUMsTUFBTSxFQUFFLFFBQVEsRUFBRSx1QkFBdUIsQ0FBQyxDQUFBO1lBQzVELE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUE7UUFDM0IsQ0FBQztLQUFBO0lBQ1ksS0FBSzs7WUFDaEIsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsRUFBRSxDQUFBO1lBQ3BDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFJLDhCQUE4QixDQUFBO1lBQzFGLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsR0FBRyxPQUFPLENBQUE7WUFDakMsSUFBSSxDQUFDLFNBQVMsR0FBRyxDQUFDLE9BQU8sRUFBRSxRQUFRLEVBQUUsdUJBQXVCLENBQUMsQ0FBQTtZQUM3RCxNQUFNLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFBO1FBQzNCLENBQUM7S0FBQTtJQUNZLEtBQUs7O1lBQ2hCLElBQUksQ0FBQyxTQUFTLEdBQUcsQ0FBQyxPQUFPLEVBQUUsa0JBQWtCLENBQUMsQ0FBQTtZQUM5QyxNQUFNLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFBO1FBQzNCLENBQUM7S0FBQTtJQUNZLElBQUk7O1lBQ2YsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMseUNBQXlDLENBQUMsQ0FBQTtZQUV2RSxNQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxzQkFBc0IsQ0FBQyxJQUFJLHNCQUFzQixDQUFBO1lBQzFGLE1BQU0sRUFBRSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsQ0FBQyxVQUFVLEVBQUUsQ0FBQTtZQUNsRSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDbEIsTUFBTSxHQUFHLEdBQUcsTUFBTSxJQUFJLE9BQU8sQ0FBd0MsQ0FBQyxPQUFPLEVBQUUsTUFBTTtvQkFDbkYsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxVQUFVLENBQUMsNEJBQTRCLEVBQUU7d0JBQy9FLFdBQVcsRUFBRSxJQUFJO3dCQUNqQixNQUFNLEVBQUUsdURBQXVEOzRCQUN2RCxtREFBbUQ7NEJBQ25ELHVEQUF1RDs0QkFDdkQsNkJBQTZCO3dCQUNyQyxPQUFPLEVBQUU7NEJBQ1A7Z0NBQ0UsU0FBUyxFQUFFLGtCQUFrQjtnQ0FDN0IsSUFBSSxFQUFFLGtDQUFrQztnQ0FDeEMsVUFBVSxFQUFFO29DQUNWLE9BQU8sQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUMsQ0FBQTtvQ0FDN0IsWUFBWSxDQUFDLE9BQU8sRUFBRSxDQUFBO2dDQUN4QixDQUFDOzZCQUNGO3lCQUNGO3FCQUNGLENBQUMsQ0FBQTtvQkFDRixNQUFNLElBQUksR0FBRyxZQUFZLENBQUMsWUFBWSxDQUFDO3dCQUNyQyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUE7d0JBQ2QsTUFBTSxFQUFFLENBQUE7b0JBQ1YsQ0FBQyxDQUFDLENBQUE7Z0JBQ0osQ0FBQyxDQUFDLENBQUE7Z0JBQ0YsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLFFBQVEsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUN2QixNQUFNLENBQUMsR0FBRyxDQUFBO2dCQUNaLENBQUM7WUFDSCxDQUFDO1lBQ0QsSUFBSSxDQUFDLFNBQVMsR0FBRyxDQUFDLFNBQVMsRUFBRSxxQkFBcUIsRUFBRSxnQkFBZ0IsRUFBRSxxQkFBcUIsQ0FBQyxDQUFBO1lBQzVGLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUE7UUFDM0IsQ0FBQztLQUFBO0lBRWEsYUFBYTs7WUFDekIsTUFBTSxDQUFDLCtCQUFlLENBQUMsT0FBTyxFQUFFLENBQUMsU0FBUyxFQUFFLE1BQU0sQ0FBQyxFQUFFLElBQUksQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQTtRQUN0RixDQUFDO0tBQUE7SUFFYSxXQUFXOztZQUN2QixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFBO1lBQ2xFLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUE7UUFDeEIsQ0FBQztLQUFBO0NBQ0Y7QUEzRUQsMEJBMkVDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtDdG9yT3B0cywgQnVpbGRlckJhc2V9IGZyb20gJy4vYmFzZSdcblxuaW1wb3J0IHtydW5DYWJhbFByb2Nlc3N9IGZyb20gJy4vY2FiYWwtcHJvY2VzcydcblxuZXhwb3J0IGNsYXNzIEJ1aWxkZXIgZXh0ZW5kcyBCdWlsZGVyQmFzZSB7XG4gIGNvbnN0cnVjdG9yIChvcHRzOiBDdG9yT3B0cykge1xuICAgIHN1cGVyKCdjYWJhbCcsIG9wdHMpXG4gIH1cblxuICBwdWJsaWMgYXN5bmMgYnVpbGQgKCkge1xuICAgIHRoaXMuY2FiYWxBcmdzID0gWydidWlsZCcsICctLW9ubHknXVxuICAgIGlmICh0aGlzLm9wdHMudGFyZ2V0LnRhcmdldCkge1xuICAgICAgdGhpcy5jYWJhbEFyZ3MucHVzaCh0aGlzLm9wdHMudGFyZ2V0LnRhcmdldC50YXJnZXQpXG4gICAgfVxuICAgIHJldHVybiB0aGlzLmNvbW1vbkJ1aWxkKClcbiAgfVxuICBwdWJsaWMgYXN5bmMgdGVzdCAoKSB7XG4gICAgdGhpcy5vcHRzLm9wdHMuc2V2ZXJpdHlDaGFuZ2VSeCA9IHt9XG4gICAgdGhpcy5vcHRzLm9wdHMuc2V2ZXJpdHlDaGFuZ2VSeFt0aGlzLm9wdHMub3B0cy5zZXZlcml0eV0gPSAvUnVubmluZyBcXGQrIHRlc3Qgc3VpdGVzXFwuXFwuXFwuL1xuICAgIHRoaXMub3B0cy5vcHRzLnNldmVyaXR5ID0gJ2J1aWxkJ1xuICAgIHRoaXMuY2FiYWxBcmdzID0gWyd0ZXN0JywgJy0tb25seScsICctLXNob3ctZGV0YWlscz1hbHdheXMnXVxuICAgIHJldHVybiB0aGlzLmNvbW1vbkJ1aWxkKClcbiAgfVxuICBwdWJsaWMgYXN5bmMgYmVuY2ggKCkge1xuICAgIHRoaXMub3B0cy5vcHRzLnNldmVyaXR5Q2hhbmdlUnggPSB7fVxuICAgIHRoaXMub3B0cy5vcHRzLnNldmVyaXR5Q2hhbmdlUnhbdGhpcy5vcHRzLm9wdHMuc2V2ZXJpdHldID0gIC9SdW5uaW5nIFxcZCsgYmVuY2htYXJrc1xcLlxcLlxcLi9cbiAgICB0aGlzLm9wdHMub3B0cy5zZXZlcml0eSA9ICdidWlsZCdcbiAgICB0aGlzLmNhYmFsQXJncyA9IFsnYmVuY2gnLCAnLS1vbmx5JywgJy0tc2hvdy1kZXRhaWxzPWFsd2F5cyddXG4gICAgcmV0dXJuIHRoaXMuY29tbW9uQnVpbGQoKVxuICB9XG4gIHB1YmxpYyBhc3luYyBjbGVhbiAoKSB7XG4gICAgdGhpcy5jYWJhbEFyZ3MgPSBbJ2NsZWFuJywgJy0tc2F2ZS1jb25maWd1cmUnXVxuICAgIHJldHVybiB0aGlzLmNvbW1vbkJ1aWxkKClcbiAgfVxuICBwdWJsaWMgYXN5bmMgZGVwcyAoKSB7XG4gICAgY29uc3QgaWducyA9IGF0b20uY29uZmlnLmdldCgnaWRlLWhhc2tlbGwtY2FiYWwuY2FiYWwuaWdub3JlTm9TYW5kYm94JylcbiAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6IG5vLXN0cmluZy1saXRlcmFsXG4gICAgY29uc3Qgc2FuZGJveENvbmZpZyA9IHRoaXMuc3Bhd25PcHRzLmVudlsnQ0FCQUxfU0FOREJPWF9DT05GSUcnXSB8fCAnY2FiYWwuc2FuZGJveC5jb25maWcnXG4gICAgY29uc3Qgc2UgPSB0aGlzLm9wdHMuY2FiYWxSb290LmdldEZpbGUoc2FuZGJveENvbmZpZykuZXhpc3RzU3luYygpXG4gICAgaWYgKCEoc2UgfHwgaWducykpIHtcbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IG5ldyBQcm9taXNlPHtleGl0Q29kZTogbnVtYmVyLCBoYXNFcnJvcjogYm9vbGVhbn0+KChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgY29uc3Qgbm90aWZpY2F0aW9uID0gYXRvbS5ub3RpZmljYXRpb25zLmFkZFdhcm5pbmcoJ05vIHNhbmRib3ggZm91bmQsIHN0b3BwaW5nJywge1xuICAgICAgICAgIGRpc21pc3NhYmxlOiB0cnVlLFxuICAgICAgICAgIGRldGFpbDogJ2lkZS1oYXNrZWxsLWNhYmFsIGRpZCBub3QgZmluZCBzYW5kYm94IGNvbmZpZ3VyYXRpb24gJyArXG4gICAgICAgICAgICAgICAgICAnZmlsZS4gSW5zdGFsbGluZyBkZXBlbmRlbmNpZXMgd2l0aG91dCBzYW5kYm94IGlzICcgK1xuICAgICAgICAgICAgICAgICAgJ2Rhbmdlcm91cyBhbmQgaXMgbm90IHJlY29tbWVuZGVkLiBJdCBpcyBzdWdnZXN0ZWQgdG8gJyArXG4gICAgICAgICAgICAgICAgICAnY3JlYXRlIGEgc2FuZGJveCByaWdodCBub3cuJyxcbiAgICAgICAgICBidXR0b25zOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGNsYXNzTmFtZTogJ2ljb24gaWNvbi1yb2NrZXQnLFxuICAgICAgICAgICAgICB0ZXh0OiAnQ2xpY2sgaGVyZSB0byBjcmVhdGUgdGhlIHNhbmRib3gnLFxuICAgICAgICAgICAgICBvbkRpZENsaWNrOiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh0aGlzLmNyZWF0ZVNhbmRib3goKSlcbiAgICAgICAgICAgICAgICBub3RpZmljYXRpb24uZGlzbWlzcygpXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICBdXG4gICAgICAgIH0pXG4gICAgICAgIGNvbnN0IGRpc3AgPSBub3RpZmljYXRpb24ub25EaWREaXNtaXNzKCgpID0+IHtcbiAgICAgICAgICBkaXNwLmRpc3Bvc2UoKVxuICAgICAgICAgIHJlamVjdCgpXG4gICAgICAgIH0pXG4gICAgICB9KVxuICAgICAgaWYgKHJlcy5leGl0Q29kZSAhPT0gMCkge1xuICAgICAgICByZXR1cm4gcmVzXG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuY2FiYWxBcmdzID0gWydpbnN0YWxsJywgJy0tb25seS1kZXBlbmRlbmNpZXMnLCAnLS1lbmFibGUtdGVzdHMnLCAnLS1lbmFibGUtYmVuY2htYXJrcyddXG4gICAgcmV0dXJuIHRoaXMuY29tbW9uQnVpbGQoKVxuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBjcmVhdGVTYW5kYm94ICgpIHtcbiAgICByZXR1cm4gcnVuQ2FiYWxQcm9jZXNzKCdjYWJhbCcsIFsnc2FuZGJveCcsICdpbml0J10sIHRoaXMuc3Bhd25PcHRzLCB0aGlzLm9wdHMub3B0cylcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgY29tbW9uQnVpbGQgKCkge1xuICAgIHRoaXMuY2FiYWxBcmdzLnB1c2goJy0tYnVpbGRkaXI9JyArIHRoaXMuZ2V0Q29uZmlnT3B0KCdidWlsZERpcicpKVxuICAgIHJldHVybiB0aGlzLnJ1bkNhYmFsKClcbiAgfVxufVxuIl19