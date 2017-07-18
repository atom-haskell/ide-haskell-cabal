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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FiYWwuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvYnVpbGRlcnMvY2FiYWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUFBLGlDQUE0QztBQUU1QyxtREFBK0M7QUFFL0MsYUFBcUIsU0FBUSxrQkFBVztJQUN0QyxZQUFhLElBQWM7UUFDekIsS0FBSyxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQTtJQUN0QixDQUFDO0lBRWUsS0FBSzs7WUFDbkIsSUFBSSxDQUFDLFNBQVMsR0FBRyxDQUFDLE9BQU8sRUFBRSxRQUFRLENBQUMsQ0FBQTtZQUNwQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO2dCQUM1QixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUE7WUFDckQsQ0FBQztZQUNELE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUE7UUFDM0IsQ0FBQztLQUFBO0lBQ2UsSUFBSTs7WUFDbEIsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsRUFBRSxDQUFBO1lBQ3BDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLCtCQUErQixDQUFBO1lBQzFGLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsR0FBRyxPQUFPLENBQUE7WUFDakMsSUFBSSxDQUFDLFNBQVMsR0FBRyxDQUFDLE1BQU0sRUFBRSxRQUFRLEVBQUUsdUJBQXVCLENBQUMsQ0FBQTtZQUM1RCxNQUFNLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFBO1FBQzNCLENBQUM7S0FBQTtJQUNlLEtBQUs7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QUFBO1lBQ2xFLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUE7UUFDeEIsQ0FBQztLQUFBO0NBQ0Y7QUExRUQsMEJBMEVDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtDdG9yT3B0cywgQnVpbGRlckJhc2V9IGZyb20gJy4vYmFzZSdcblxuaW1wb3J0IHtydW5DYWJhbFByb2Nlc3N9IGZyb20gJy4vY2FiYWwtcHJvY2VzcydcblxuZXhwb3J0IGNsYXNzIEJ1aWxkZXIgZXh0ZW5kcyBCdWlsZGVyQmFzZSB7XG4gIGNvbnN0cnVjdG9yIChvcHRzOiBDdG9yT3B0cykge1xuICAgIHN1cGVyKCdjYWJhbCcsIG9wdHMpXG4gIH1cblxuICBwcm90ZWN0ZWQgYXN5bmMgYnVpbGQgKCkge1xuICAgIHRoaXMuY2FiYWxBcmdzID0gWydidWlsZCcsICctLW9ubHknXVxuICAgIGlmICh0aGlzLm9wdHMudGFyZ2V0LnRhcmdldCkge1xuICAgICAgdGhpcy5jYWJhbEFyZ3MucHVzaCh0aGlzLm9wdHMudGFyZ2V0LnRhcmdldC50YXJnZXQpXG4gICAgfVxuICAgIHJldHVybiB0aGlzLmNvbW1vbkJ1aWxkKClcbiAgfVxuICBwcm90ZWN0ZWQgYXN5bmMgdGVzdCAoKSB7XG4gICAgdGhpcy5vcHRzLm9wdHMuc2V2ZXJpdHlDaGFuZ2VSeCA9IHt9XG4gICAgdGhpcy5vcHRzLm9wdHMuc2V2ZXJpdHlDaGFuZ2VSeFt0aGlzLm9wdHMub3B0cy5zZXZlcml0eV0gPSAvUnVubmluZyBcXGQrIHRlc3Qgc3VpdGVzXFwuXFwuXFwuL1xuICAgIHRoaXMub3B0cy5vcHRzLnNldmVyaXR5ID0gJ2J1aWxkJ1xuICAgIHRoaXMuY2FiYWxBcmdzID0gWyd0ZXN0JywgJy0tb25seScsICctLXNob3ctZGV0YWlscz1hbHdheXMnXVxuICAgIHJldHVybiB0aGlzLmNvbW1vbkJ1aWxkKClcbiAgfVxuICBwcm90ZWN0ZWQgYXN5bmMgYmVuY2ggKCkge1xuICAgIHRoaXMub3B0cy5vcHRzLnNldmVyaXR5Q2hhbmdlUnggPSB7fVxuICAgIHRoaXMub3B0cy5vcHRzLnNldmVyaXR5Q2hhbmdlUnhbdGhpcy5vcHRzLm9wdHMuc2V2ZXJpdHldID0gIC9SdW5uaW5nIFxcZCsgYmVuY2htYXJrc1xcLlxcLlxcLi9cbiAgICB0aGlzLm9wdHMub3B0cy5zZXZlcml0eSA9ICdidWlsZCdcbiAgICB0aGlzLmNhYmFsQXJncyA9IFsnYmVuY2gnLCAnLS1vbmx5JywgJy0tc2hvdy1kZXRhaWxzPWFsd2F5cyddXG4gICAgcmV0dXJuIHRoaXMuY29tbW9uQnVpbGQoKVxuICB9XG4gIHByb3RlY3RlZCBhc3luYyBjbGVhbiAoKSB7XG4gICAgdGhpcy5jYWJhbEFyZ3MgPSBbJ2NsZWFuJywgJy0tc2F2ZS1jb25maWd1cmUnXVxuICAgIHJldHVybiB0aGlzLmNvbW1vbkJ1aWxkKClcbiAgfVxuICBwcm90ZWN0ZWQgYXN5bmMgZGVwcyAoKSB7XG4gICAgY29uc3QgaWducyA9IGF0b20uY29uZmlnLmdldCgnaWRlLWhhc2tlbGwtY2FiYWwuY2FiYWwuaWdub3JlTm9TYW5kYm94JylcbiAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6IG5vLXN0cmluZy1saXRlcmFsXG4gICAgY29uc3Qgc2FuZGJveENvbmZpZyA9IHRoaXMuc3Bhd25PcHRzLmVudlsnQ0FCQUxfU0FOREJPWF9DT05GSUcnXSB8fCAnY2FiYWwuc2FuZGJveC5jb25maWcnXG4gICAgY29uc3Qgc2UgPSB0aGlzLm9wdHMuY2FiYWxSb290LmdldEZpbGUoc2FuZGJveENvbmZpZykuZXhpc3RzU3luYygpXG4gICAgaWYgKCEoc2UgfHwgaWducykpIHtcbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IG5ldyBQcm9taXNlPHtleGl0Q29kZTogbnVtYmVyLCBoYXNFcnJvcjogYm9vbGVhbn0+KChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgY29uc3Qgbm90aWZpY2F0aW9uID0gYXRvbS5ub3RpZmljYXRpb25zLmFkZFdhcm5pbmcoJ05vIHNhbmRib3ggZm91bmQsIHN0b3BwaW5nJywge1xuICAgICAgICAgIGRpc21pc3NhYmxlOiB0cnVlLFxuICAgICAgICAgIGRldGFpbDogJ2lkZS1oYXNrZWxsLWNhYmFsIGRpZCBub3QgZmluZCBzYW5kYm94IGNvbmZpZ3VyYXRpb24gJyArXG4gICAgICAgICAgICAgICAgICAnZmlsZS4gSW5zdGFsbGluZyBkZXBlbmRlbmNpZXMgd2l0aG91dCBzYW5kYm94IGlzICcgK1xuICAgICAgICAgICAgICAgICAgJ2Rhbmdlcm91cyBhbmQgaXMgbm90IHJlY29tbWVuZGVkLiBJdCBpcyBzdWdnZXN0ZWQgdG8gJyArXG4gICAgICAgICAgICAgICAgICAnY3JlYXRlIGEgc2FuZGJveCByaWdodCBub3cuJyxcbiAgICAgICAgICBidXR0b25zOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGNsYXNzTmFtZTogJ2ljb24gaWNvbi1yb2NrZXQnLFxuICAgICAgICAgICAgICB0ZXh0OiAnQ2xpY2sgaGVyZSB0byBjcmVhdGUgdGhlIHNhbmRib3gnLFxuICAgICAgICAgICAgICBvbkRpZENsaWNrOiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh0aGlzLmNyZWF0ZVNhbmRib3goKSlcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIF1cbiAgICAgICAgfSlcbiAgICAgICAgY29uc3QgZGlzcCA9IG5vdGlmaWNhdGlvbi5vbkRpZERpc21pc3MoKCkgPT4ge1xuICAgICAgICAgIGRpc3AuZGlzcG9zZSgpXG4gICAgICAgICAgcmVqZWN0KClcbiAgICAgICAgfSlcbiAgICAgIH0pXG4gICAgICBpZiAocmVzLmV4aXRDb2RlICE9PSAwKSB7XG4gICAgICAgIHJldHVybiByZXNcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5jYWJhbEFyZ3MgPSBbJ2luc3RhbGwnLCAnLS1vbmx5LWRlcGVuZGVuY2llcycsICctLWVuYWJsZS10ZXN0cycsICctLWVuYWJsZS1iZW5jaG1hcmtzJ11cbiAgICByZXR1cm4gdGhpcy5jb21tb25CdWlsZCgpXG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGNyZWF0ZVNhbmRib3ggKCkge1xuICAgIHJldHVybiBydW5DYWJhbFByb2Nlc3MoJ2NhYmFsJywgWydzYW5kYm94JywgJ2luaXQnXSwgdGhpcy5zcGF3bk9wdHMsIHRoaXMub3B0cy5vcHRzKVxuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBjb21tb25CdWlsZCAoKTogUHJvbWlzZTx7ZXhpdENvZGU6IG51bWJlciwgaGFzRXJyb3I6IGJvb2xlYW59PiB7XG4gICAgdGhpcy5jYWJhbEFyZ3MucHVzaCgnLS1idWlsZGRpcj0nICsgdGhpcy5nZXRDb25maWdPcHQoJ2J1aWxkRGlyJykpXG4gICAgcmV0dXJuIHRoaXMucnVuQ2FiYWwoKVxuICB9XG59XG4iXX0=