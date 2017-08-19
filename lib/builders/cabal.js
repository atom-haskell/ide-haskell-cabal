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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FiYWwuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvYnVpbGRlcnMvY2FiYWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUFBLGlDQUE4QztBQUU5QyxtREFBaUQ7QUFFakQsYUFBcUIsU0FBUSxrQkFBVztJQUN0QyxZQUFZLElBQWM7UUFDeEIsS0FBSyxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQTtJQUN0QixDQUFDO0lBRVksS0FBSzs7WUFDaEIsSUFBSSxDQUFDLFNBQVMsR0FBRyxDQUFDLE9BQU8sRUFBRSxRQUFRLENBQUMsQ0FBQTtZQUNwQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO2dCQUM1QixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUE7WUFDckQsQ0FBQztZQUNELE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUE7UUFDM0IsQ0FBQztLQUFBO0lBQ1ksSUFBSTs7WUFDZixJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxFQUFFLENBQUE7WUFDcEMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsK0JBQStCLENBQUE7WUFDMUYsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxHQUFHLE9BQU8sQ0FBQTtZQUNqQyxJQUFJLENBQUMsU0FBUyxHQUFHLENBQUMsTUFBTSxFQUFFLFFBQVEsRUFBRSx1QkFBdUIsQ0FBQyxDQUFBO1lBQzVELE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUE7UUFDM0IsQ0FBQztLQUFBO0lBQ1ksS0FBSzs7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QUFDLFlBQVksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFBO1lBQ2xFLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUE7UUFDeEIsQ0FBQztLQUFBO0NBQ0Y7QUEzRUQsMEJBMkVDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ3Rvck9wdHMsIEJ1aWxkZXJCYXNlIH0gZnJvbSAnLi9iYXNlJ1xuXG5pbXBvcnQgeyBydW5DYWJhbFByb2Nlc3MgfSBmcm9tICcuL2NhYmFsLXByb2Nlc3MnXG5cbmV4cG9ydCBjbGFzcyBCdWlsZGVyIGV4dGVuZHMgQnVpbGRlckJhc2Uge1xuICBjb25zdHJ1Y3RvcihvcHRzOiBDdG9yT3B0cykge1xuICAgIHN1cGVyKCdjYWJhbCcsIG9wdHMpXG4gIH1cblxuICBwdWJsaWMgYXN5bmMgYnVpbGQoKSB7XG4gICAgdGhpcy5jYWJhbEFyZ3MgPSBbJ2J1aWxkJywgJy0tb25seSddXG4gICAgaWYgKHRoaXMub3B0cy50YXJnZXQudGFyZ2V0KSB7XG4gICAgICB0aGlzLmNhYmFsQXJncy5wdXNoKHRoaXMub3B0cy50YXJnZXQudGFyZ2V0LnRhcmdldClcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuY29tbW9uQnVpbGQoKVxuICB9XG4gIHB1YmxpYyBhc3luYyB0ZXN0KCkge1xuICAgIHRoaXMub3B0cy5vcHRzLnNldmVyaXR5Q2hhbmdlUnggPSB7fVxuICAgIHRoaXMub3B0cy5vcHRzLnNldmVyaXR5Q2hhbmdlUnhbdGhpcy5vcHRzLm9wdHMuc2V2ZXJpdHldID0gL1J1bm5pbmcgXFxkKyB0ZXN0IHN1aXRlc1xcLlxcLlxcLi9cbiAgICB0aGlzLm9wdHMub3B0cy5zZXZlcml0eSA9ICdidWlsZCdcbiAgICB0aGlzLmNhYmFsQXJncyA9IFsndGVzdCcsICctLW9ubHknLCAnLS1zaG93LWRldGFpbHM9YWx3YXlzJ11cbiAgICByZXR1cm4gdGhpcy5jb21tb25CdWlsZCgpXG4gIH1cbiAgcHVibGljIGFzeW5jIGJlbmNoKCkge1xuICAgIHRoaXMub3B0cy5vcHRzLnNldmVyaXR5Q2hhbmdlUnggPSB7fVxuICAgIHRoaXMub3B0cy5vcHRzLnNldmVyaXR5Q2hhbmdlUnhbdGhpcy5vcHRzLm9wdHMuc2V2ZXJpdHldID0gL1J1bm5pbmcgXFxkKyBiZW5jaG1hcmtzXFwuXFwuXFwuL1xuICAgIHRoaXMub3B0cy5vcHRzLnNldmVyaXR5ID0gJ2J1aWxkJ1xuICAgIHRoaXMuY2FiYWxBcmdzID0gWydiZW5jaCcsICctLW9ubHknLCAnLS1zaG93LWRldGFpbHM9YWx3YXlzJ11cbiAgICByZXR1cm4gdGhpcy5jb21tb25CdWlsZCgpXG4gIH1cbiAgcHVibGljIGFzeW5jIGNsZWFuKCkge1xuICAgIHRoaXMuY2FiYWxBcmdzID0gWydjbGVhbicsICctLXNhdmUtY29uZmlndXJlJ11cbiAgICByZXR1cm4gdGhpcy5jb21tb25CdWlsZCgpXG4gIH1cbiAgcHVibGljIGFzeW5jIGRlcHMoKSB7XG4gICAgY29uc3QgaWducyA9IGF0b20uY29uZmlnLmdldCgnaWRlLWhhc2tlbGwtY2FiYWwuY2FiYWwuaWdub3JlTm9TYW5kYm94JylcbiAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6IG5vLXN0cmluZy1saXRlcmFsXG4gICAgY29uc3Qgc2FuZGJveENvbmZpZyA9IHRoaXMuc3Bhd25PcHRzLmVudlsnQ0FCQUxfU0FOREJPWF9DT05GSUcnXSB8fCAnY2FiYWwuc2FuZGJveC5jb25maWcnXG4gICAgY29uc3Qgc2UgPSB0aGlzLm9wdHMuY2FiYWxSb290LmdldEZpbGUoc2FuZGJveENvbmZpZykuZXhpc3RzU3luYygpXG4gICAgaWYgKCEoc2UgfHwgaWducykpIHtcbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IG5ldyBQcm9taXNlPHsgZXhpdENvZGU6IG51bWJlciwgaGFzRXJyb3I6IGJvb2xlYW4gfT4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBjb25zdCBub3RpZmljYXRpb24gPSBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkV2FybmluZygnTm8gc2FuZGJveCBmb3VuZCwgc3RvcHBpbmcnLCB7XG4gICAgICAgICAgZGlzbWlzc2FibGU6IHRydWUsXG4gICAgICAgICAgZGV0YWlsOiAnaWRlLWhhc2tlbGwtY2FiYWwgZGlkIG5vdCBmaW5kIHNhbmRib3ggY29uZmlndXJhdGlvbiAnICtcbiAgICAgICAgICAnZmlsZS4gSW5zdGFsbGluZyBkZXBlbmRlbmNpZXMgd2l0aG91dCBzYW5kYm94IGlzICcgK1xuICAgICAgICAgICdkYW5nZXJvdXMgYW5kIGlzIG5vdCByZWNvbW1lbmRlZC4gSXQgaXMgc3VnZ2VzdGVkIHRvICcgK1xuICAgICAgICAgICdjcmVhdGUgYSBzYW5kYm94IHJpZ2h0IG5vdy4nLFxuICAgICAgICAgIGJ1dHRvbnM6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgY2xhc3NOYW1lOiAnaWNvbiBpY29uLXJvY2tldCcsXG4gICAgICAgICAgICAgIHRleHQ6ICdDbGljayBoZXJlIHRvIGNyZWF0ZSB0aGUgc2FuZGJveCcsXG4gICAgICAgICAgICAgIG9uRGlkQ2xpY2s6ICgpID0+IHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHRoaXMuY3JlYXRlU2FuZGJveCgpKVxuICAgICAgICAgICAgICAgIG5vdGlmaWNhdGlvbi5kaXNtaXNzKClcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgXSxcbiAgICAgICAgfSlcbiAgICAgICAgY29uc3QgZGlzcCA9IG5vdGlmaWNhdGlvbi5vbkRpZERpc21pc3MoKCkgPT4ge1xuICAgICAgICAgIGRpc3AuZGlzcG9zZSgpXG4gICAgICAgICAgcmVqZWN0KClcbiAgICAgICAgfSlcbiAgICAgIH0pXG4gICAgICBpZiAocmVzLmV4aXRDb2RlICE9PSAwKSB7XG4gICAgICAgIHJldHVybiByZXNcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5jYWJhbEFyZ3MgPSBbJ2luc3RhbGwnLCAnLS1vbmx5LWRlcGVuZGVuY2llcycsICctLWVuYWJsZS10ZXN0cycsICctLWVuYWJsZS1iZW5jaG1hcmtzJ11cbiAgICByZXR1cm4gdGhpcy5jb21tb25CdWlsZCgpXG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGNyZWF0ZVNhbmRib3goKSB7XG4gICAgcmV0dXJuIHJ1bkNhYmFsUHJvY2VzcygnY2FiYWwnLCBbJ3NhbmRib3gnLCAnaW5pdCddLCB0aGlzLnNwYXduT3B0cywgdGhpcy5vcHRzLm9wdHMpXG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGNvbW1vbkJ1aWxkKCkge1xuICAgIHRoaXMuY2FiYWxBcmdzLnB1c2goJy0tYnVpbGRkaXI9JyArIHRoaXMuZ2V0Q29uZmlnT3B0KCdidWlsZERpcicpKVxuICAgIHJldHVybiB0aGlzLnJ1bkNhYmFsKClcbiAgfVxufVxuIl19