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
            const comp = (this.opts.target.target && this.opts.target.target.target)
                || this.opts.target.component;
            if (comp) {
                this.cabalArgs.push(comp);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FiYWwuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvYnVpbGRlcnMvY2FiYWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUFBLGlDQUE4QztBQUU5QyxtREFBaUQ7QUFFakQsYUFBcUIsU0FBUSxrQkFBVztJQUN0QyxZQUFZLElBQWM7UUFDeEIsS0FBSyxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQTtJQUN0QixDQUFDO0lBRVksS0FBSzs7WUFDaEIsSUFBSSxDQUFDLFNBQVMsR0FBRyxDQUFDLE9BQU8sRUFBRSxRQUFRLENBQUMsQ0FBQTtZQUNwQyxNQUFNLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDO21CQUN4RCxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUE7WUFDMUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztnQkFDVCxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQTtZQUMzQixDQUFDO1lBQ0QsTUFBTSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQTtRQUMzQixDQUFDO0tBQUE7SUFDWSxJQUFJOztZQUNmLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGdCQUFnQixHQUFHLEVBQUUsQ0FBQTtZQUNwQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRywrQkFBK0IsQ0FBQTtZQUMxRixJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEdBQUcsT0FBTyxDQUFBO1lBQ2pDLElBQUksQ0FBQyxTQUFTLEdBQUcsQ0FBQyxNQUFNLEVBQUUsUUFBUSxFQUFFLHVCQUF1QixDQUFDLENBQUE7WUFDNUQsTUFBTSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQTtRQUMzQixDQUFDO0tBQUE7SUFDWSxLQUFLOztZQUNoQixJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxFQUFFLENBQUE7WUFDcEMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsOEJBQThCLENBQUE7WUFDekYsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxHQUFHLE9BQU8sQ0FBQTtZQUNqQyxJQUFJLENBQUMsU0FBUyxHQUFHLENBQUMsT0FBTyxFQUFFLFFBQVEsRUFBRSx1QkFBdUIsQ0FBQyxDQUFBO1lBQzdELE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUE7UUFDM0IsQ0FBQztLQUFBO0lBQ1ksS0FBSzs7WUFDaEIsSUFBSSxDQUFDLFNBQVMsR0FBRyxDQUFDLE9BQU8sRUFBRSxrQkFBa0IsQ0FBQyxDQUFBO1lBQzlDLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUE7UUFDM0IsQ0FBQztLQUFBO0lBQ1ksSUFBSTs7WUFDZixNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyx5Q0FBeUMsQ0FBQyxDQUFBO1lBRXZFLE1BQU0sYUFBYSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLHNCQUFzQixDQUFDLElBQUksc0JBQXNCLENBQUE7WUFDMUYsTUFBTSxFQUFFLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxDQUFDLFVBQVUsRUFBRSxDQUFBO1lBQ2xFLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNsQixNQUFNLEdBQUcsR0FBRyxNQUFNLElBQUksT0FBTyxDQUEwQyxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRTtvQkFDekYsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxVQUFVLENBQUMsNEJBQTRCLEVBQUU7d0JBQy9FLFdBQVcsRUFBRSxJQUFJO3dCQUNqQixNQUFNLEVBQUUsdURBQXVEOzRCQUMvRCxtREFBbUQ7NEJBQ25ELHVEQUF1RDs0QkFDdkQsNkJBQTZCO3dCQUM3QixPQUFPLEVBQUU7NEJBQ1A7Z0NBQ0UsU0FBUyxFQUFFLGtCQUFrQjtnQ0FDN0IsSUFBSSxFQUFFLGtDQUFrQztnQ0FDeEMsVUFBVSxFQUFFLEdBQUcsRUFBRTtvQ0FDZixPQUFPLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDLENBQUE7b0NBQzdCLFlBQVksQ0FBQyxPQUFPLEVBQUUsQ0FBQTtnQ0FDeEIsQ0FBQzs2QkFDRjt5QkFDRjtxQkFDRixDQUFDLENBQUE7b0JBQ0YsTUFBTSxJQUFJLEdBQUcsWUFBWSxDQUFDLFlBQVksQ0FBQyxHQUFHLEVBQUU7d0JBQzFDLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQTt3QkFDZCxNQUFNLEVBQUUsQ0FBQTtvQkFDVixDQUFDLENBQUMsQ0FBQTtnQkFDSixDQUFDLENBQUMsQ0FBQTtnQkFDRixFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsUUFBUSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQ3ZCLE1BQU0sQ0FBQyxHQUFHLENBQUE7Z0JBQ1osQ0FBQztZQUNILENBQUM7WUFDRCxJQUFJLENBQUMsU0FBUyxHQUFHLENBQUMsU0FBUyxFQUFFLHFCQUFxQixFQUFFLGdCQUFnQixFQUFFLHFCQUFxQixDQUFDLENBQUE7WUFDNUYsTUFBTSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQTtRQUMzQixDQUFDO0tBQUE7SUFFYSxhQUFhOztZQUN6QixNQUFNLENBQUMsK0JBQWUsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxTQUFTLEVBQUUsTUFBTSxDQUFDLEVBQUUsSUFBSSxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFBO1FBQ3RGLENBQUM7S0FBQTtJQUVhLFdBQVc7O1lBQ3ZCLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUE7WUFDbEUsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQTtRQUN4QixDQUFDO0tBQUE7Q0FDRjtBQTdFRCwwQkE2RUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDdG9yT3B0cywgQnVpbGRlckJhc2UgfSBmcm9tICcuL2Jhc2UnXG5cbmltcG9ydCB7IHJ1bkNhYmFsUHJvY2VzcyB9IGZyb20gJy4vY2FiYWwtcHJvY2VzcydcblxuZXhwb3J0IGNsYXNzIEJ1aWxkZXIgZXh0ZW5kcyBCdWlsZGVyQmFzZSB7XG4gIGNvbnN0cnVjdG9yKG9wdHM6IEN0b3JPcHRzKSB7XG4gICAgc3VwZXIoJ2NhYmFsJywgb3B0cylcbiAgfVxuXG4gIHB1YmxpYyBhc3luYyBidWlsZCgpIHtcbiAgICB0aGlzLmNhYmFsQXJncyA9IFsnYnVpbGQnLCAnLS1vbmx5J11cbiAgICBjb25zdCBjb21wID0gKHRoaXMub3B0cy50YXJnZXQudGFyZ2V0ICYmIHRoaXMub3B0cy50YXJnZXQudGFyZ2V0LnRhcmdldClcbiAgICAgICAgICAgICAgICAgfHwgdGhpcy5vcHRzLnRhcmdldC5jb21wb25lbnRcbiAgICBpZiAoY29tcCkge1xuICAgICAgdGhpcy5jYWJhbEFyZ3MucHVzaChjb21wKVxuICAgIH1cbiAgICByZXR1cm4gdGhpcy5jb21tb25CdWlsZCgpXG4gIH1cbiAgcHVibGljIGFzeW5jIHRlc3QoKSB7XG4gICAgdGhpcy5vcHRzLm9wdHMuc2V2ZXJpdHlDaGFuZ2VSeCA9IHt9XG4gICAgdGhpcy5vcHRzLm9wdHMuc2V2ZXJpdHlDaGFuZ2VSeFt0aGlzLm9wdHMub3B0cy5zZXZlcml0eV0gPSAvUnVubmluZyBcXGQrIHRlc3Qgc3VpdGVzXFwuXFwuXFwuL1xuICAgIHRoaXMub3B0cy5vcHRzLnNldmVyaXR5ID0gJ2J1aWxkJ1xuICAgIHRoaXMuY2FiYWxBcmdzID0gWyd0ZXN0JywgJy0tb25seScsICctLXNob3ctZGV0YWlscz1hbHdheXMnXVxuICAgIHJldHVybiB0aGlzLmNvbW1vbkJ1aWxkKClcbiAgfVxuICBwdWJsaWMgYXN5bmMgYmVuY2goKSB7XG4gICAgdGhpcy5vcHRzLm9wdHMuc2V2ZXJpdHlDaGFuZ2VSeCA9IHt9XG4gICAgdGhpcy5vcHRzLm9wdHMuc2V2ZXJpdHlDaGFuZ2VSeFt0aGlzLm9wdHMub3B0cy5zZXZlcml0eV0gPSAvUnVubmluZyBcXGQrIGJlbmNobWFya3NcXC5cXC5cXC4vXG4gICAgdGhpcy5vcHRzLm9wdHMuc2V2ZXJpdHkgPSAnYnVpbGQnXG4gICAgdGhpcy5jYWJhbEFyZ3MgPSBbJ2JlbmNoJywgJy0tb25seScsICctLXNob3ctZGV0YWlscz1hbHdheXMnXVxuICAgIHJldHVybiB0aGlzLmNvbW1vbkJ1aWxkKClcbiAgfVxuICBwdWJsaWMgYXN5bmMgY2xlYW4oKSB7XG4gICAgdGhpcy5jYWJhbEFyZ3MgPSBbJ2NsZWFuJywgJy0tc2F2ZS1jb25maWd1cmUnXVxuICAgIHJldHVybiB0aGlzLmNvbW1vbkJ1aWxkKClcbiAgfVxuICBwdWJsaWMgYXN5bmMgZGVwcygpIHtcbiAgICBjb25zdCBpZ25zID0gYXRvbS5jb25maWcuZ2V0KCdpZGUtaGFza2VsbC1jYWJhbC5jYWJhbC5pZ25vcmVOb1NhbmRib3gnKVxuICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTogbm8tc3RyaW5nLWxpdGVyYWxcbiAgICBjb25zdCBzYW5kYm94Q29uZmlnID0gdGhpcy5zcGF3bk9wdHMuZW52WydDQUJBTF9TQU5EQk9YX0NPTkZJRyddIHx8ICdjYWJhbC5zYW5kYm94LmNvbmZpZydcbiAgICBjb25zdCBzZSA9IHRoaXMub3B0cy5jYWJhbFJvb3QuZ2V0RmlsZShzYW5kYm94Q29uZmlnKS5leGlzdHNTeW5jKClcbiAgICBpZiAoIShzZSB8fCBpZ25zKSkge1xuICAgICAgY29uc3QgcmVzID0gYXdhaXQgbmV3IFByb21pc2U8eyBleGl0Q29kZTogbnVtYmVyLCBoYXNFcnJvcjogYm9vbGVhbiB9PigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIGNvbnN0IG5vdGlmaWNhdGlvbiA9IGF0b20ubm90aWZpY2F0aW9ucy5hZGRXYXJuaW5nKCdObyBzYW5kYm94IGZvdW5kLCBzdG9wcGluZycsIHtcbiAgICAgICAgICBkaXNtaXNzYWJsZTogdHJ1ZSxcbiAgICAgICAgICBkZXRhaWw6ICdpZGUtaGFza2VsbC1jYWJhbCBkaWQgbm90IGZpbmQgc2FuZGJveCBjb25maWd1cmF0aW9uICcgK1xuICAgICAgICAgICdmaWxlLiBJbnN0YWxsaW5nIGRlcGVuZGVuY2llcyB3aXRob3V0IHNhbmRib3ggaXMgJyArXG4gICAgICAgICAgJ2Rhbmdlcm91cyBhbmQgaXMgbm90IHJlY29tbWVuZGVkLiBJdCBpcyBzdWdnZXN0ZWQgdG8gJyArXG4gICAgICAgICAgJ2NyZWF0ZSBhIHNhbmRib3ggcmlnaHQgbm93LicsXG4gICAgICAgICAgYnV0dG9uczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBjbGFzc05hbWU6ICdpY29uIGljb24tcm9ja2V0JyxcbiAgICAgICAgICAgICAgdGV4dDogJ0NsaWNrIGhlcmUgdG8gY3JlYXRlIHRoZSBzYW5kYm94JyxcbiAgICAgICAgICAgICAgb25EaWRDbGljazogKCkgPT4ge1xuICAgICAgICAgICAgICAgIHJlc29sdmUodGhpcy5jcmVhdGVTYW5kYm94KCkpXG4gICAgICAgICAgICAgICAgbm90aWZpY2F0aW9uLmRpc21pc3MoKVxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICBdLFxuICAgICAgICB9KVxuICAgICAgICBjb25zdCBkaXNwID0gbm90aWZpY2F0aW9uLm9uRGlkRGlzbWlzcygoKSA9PiB7XG4gICAgICAgICAgZGlzcC5kaXNwb3NlKClcbiAgICAgICAgICByZWplY3QoKVxuICAgICAgICB9KVxuICAgICAgfSlcbiAgICAgIGlmIChyZXMuZXhpdENvZGUgIT09IDApIHtcbiAgICAgICAgcmV0dXJuIHJlc1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLmNhYmFsQXJncyA9IFsnaW5zdGFsbCcsICctLW9ubHktZGVwZW5kZW5jaWVzJywgJy0tZW5hYmxlLXRlc3RzJywgJy0tZW5hYmxlLWJlbmNobWFya3MnXVxuICAgIHJldHVybiB0aGlzLmNvbW1vbkJ1aWxkKClcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgY3JlYXRlU2FuZGJveCgpIHtcbiAgICByZXR1cm4gcnVuQ2FiYWxQcm9jZXNzKCdjYWJhbCcsIFsnc2FuZGJveCcsICdpbml0J10sIHRoaXMuc3Bhd25PcHRzLCB0aGlzLm9wdHMub3B0cylcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgY29tbW9uQnVpbGQoKSB7XG4gICAgdGhpcy5jYWJhbEFyZ3MucHVzaCgnLS1idWlsZGRpcj0nICsgdGhpcy5nZXRDb25maWdPcHQoJ2J1aWxkRGlyJykpXG4gICAgcmV0dXJuIHRoaXMucnVuQ2FiYWwoKVxuICB9XG59XG4iXX0=