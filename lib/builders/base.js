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
const path_1 = require("path");
const cabal_process_1 = require("./cabal-process");
class BuilderBase {
    constructor(processName, opts) {
        this.processName = processName;
        this.opts = opts;
        this.spawnOpts = this.getSpawnOpts();
        this.cabalArgs = [];
    }
    runCommand(cmd) {
        return __awaiter(this, void 0, void 0, function* () {
            return this[cmd]();
        });
    }
    runCabal(extraArgs = []) {
        return __awaiter(this, void 0, void 0, function* () {
            return cabal_process_1.runCabalProcess(this.processName, this.cabalArgs.concat(extraArgs), this.spawnOpts, this.opts.opts);
        });
    }
    getConfigOpt(opt) {
        const map = {
            '7.2': atom.config.get(`ide-haskell-cabal.cabal.ghc702.${opt}`),
            '7.4': atom.config.get(`ide-haskell-cabal.cabal.ghc704.${opt}`),
            '7.6': atom.config.get(`ide-haskell-cabal.cabal.ghc706.${opt}`),
            '7.8': atom.config.get(`ide-haskell-cabal.cabal.ghc708.${opt}`),
            '7.10': atom.config.get(`ide-haskell-cabal.cabal.ghc710.${opt}`),
            '8.0': atom.config.get(`ide-haskell-cabal.cabal.ghc800.${opt}`),
        };
        return map[atom.config.get('ide-haskell-cabal.cabal.activeGhcVersion')];
    }
    getSpawnOpts() {
        const opts = {
            cwd: this.opts.cabalRoot.getPath(),
            detached: true,
            env: {},
        };
        const env = Object.assign({}, process.env);
        if (process.platform === 'win32') {
            const path = [];
            const capMask = (str, mask) => {
                const a = str.split('');
                for (let i = 0; i < a.length; i++) {
                    if (mask & Math.pow(2, i)) {
                        a[i] = a[i].toUpperCase();
                    }
                }
                return a.join('');
            };
            for (let m = 0b1111; m >= 0; m--) {
                const vn = capMask('path', m);
                const evn = env[vn];
                if (evn !== undefined) {
                    path.push(evn);
                }
            }
            env['PATH'] = path.join(path_1.delimiter);
        }
        const ghcPath = this.getConfigOpt('pathTo');
        if (this.getConfigOpt('pathExclusive')) {
            env['PATH'] = ghcPath.join(path_1.delimiter);
        }
        else if (ghcPath) {
            env['PATH'] = ghcPath.concat((env['PATH'] || '').split(path_1.delimiter)).join(path_1.delimiter);
        }
        const sandboxConfig = this.getConfigOpt('sandbox');
        if (sandboxConfig !== '') {
            env['CABAL_SANDBOX_CONFIG'] = sandboxConfig;
        }
        opts.env = env;
        return opts;
    }
}
exports.BuilderBase = BuilderBase;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFzZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9idWlsZGVycy9iYXNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFBQSwrQkFBZ0M7QUFJaEMsbURBQTBEO0FBZ0IxRDtJQUlFLFlBQ1UsV0FBbUIsRUFDakIsSUFBYztRQURoQixnQkFBVyxHQUFYLFdBQVcsQ0FBUTtRQUNqQixTQUFJLEdBQUosSUFBSSxDQUFVO1FBRXhCLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFBO1FBQ3BDLElBQUksQ0FBQyxTQUFTLEdBQUcsRUFBRSxDQUFBO0lBQ3JCLENBQUM7SUFFWSxVQUFVLENBQUMsR0FBaUI7O1lBQ3ZDLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQTtRQUNwQixDQUFDO0tBQUE7SUFRZSxRQUFRLENBQUMsWUFBc0IsRUFBRTs7WUFDL0MsTUFBTSxDQUFDLCtCQUFlLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsRUFBRSxJQUFJLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUE7UUFDNUcsQ0FBQztLQUFBO0lBRVMsWUFBWSxDQUFDLEdBQVc7UUFDaEMsTUFBTSxHQUFHLEdBQUc7WUFDVixLQUFLLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsa0NBQWtDLEdBQUcsRUFBRSxDQUFDO1lBQy9ELEtBQUssRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxrQ0FBa0MsR0FBRyxFQUFFLENBQUM7WUFDL0QsS0FBSyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLGtDQUFrQyxHQUFHLEVBQUUsQ0FBQztZQUMvRCxLQUFLLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsa0NBQWtD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Q0FBQyxTQUFTLENBQUMsQ0FBQTtRQUNsRCxFQUFFLENBQUMsQ0FBQyxhQUFhLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN6QixHQUFHLENBQUMsc0JBQXNCLENBQUMsR0FBRyxhQUFhLENBQUE7UUFDN0MsQ0FBQztRQUVELElBQUksQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFBO1FBQ2QsTUFBTSxDQUFDLElBQUksQ0FBQTtJQUNiLENBQUM7Q0FFRjtBQTFGRCxrQ0EwRkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBkZWxpbWl0ZXIgfSBmcm9tICdwYXRoJ1xuXG5pbXBvcnQgeyBDYWJhbENvbW1hbmQsIFRhcmdldFBhcmFtVHlwZSB9IGZyb20gJy4vLi4vY29tbW9uJ1xuXG5pbXBvcnQgeyBydW5DYWJhbFByb2Nlc3MsIElQYXJhbXMgfSBmcm9tICcuL2NhYmFsLXByb2Nlc3MnXG5leHBvcnQgeyBJUGFyYW1zIH1cblxuZXhwb3J0IGludGVyZmFjZSBDdG9yT3B0cyB7XG4gIG9wdHM6IElQYXJhbXMsXG4gIHRhcmdldDogVGFyZ2V0UGFyYW1UeXBlLFxuICBjYWJhbFJvb3Q6IEF0b21UeXBlcy5EaXJlY3Rvcnlcbn1cblxuZXhwb3J0IGludGVyZmFjZSBSZXN1bHRUeXBlIHtcbiAgZXhpdENvZGU6IG51bWJlciB8IG51bGxcbiAgaGFzRXJyb3I6IGJvb2xlYW5cbn1cblxuZXhwb3J0IHR5cGUgVEJ1aWxkZXJCYXNlID0ge1tLIGluIENhYmFsQ29tbWFuZF06ICgpID0+IFByb21pc2U8UmVzdWx0VHlwZT59XG5cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBCdWlsZGVyQmFzZSBpbXBsZW1lbnRzIFRCdWlsZGVyQmFzZSB7XG4gIHByb3RlY3RlZCBjYWJhbEFyZ3M6IHN0cmluZ1tdXG4gIHByb3RlY3RlZCBzcGF3bk9wdHM6IHsgY3dkOiBzdHJpbmcsIGRldGFjaGVkOiBib29sZWFuLCBlbnY6IHsgW2tleTogc3RyaW5nXTogc3RyaW5nIHwgdW5kZWZpbmVkIH0gfVxuXG4gIGNvbnN0cnVjdG9yKFxuICAgIHByaXZhdGUgcHJvY2Vzc05hbWU6IHN0cmluZyxcbiAgICBwcm90ZWN0ZWQgb3B0czogQ3Rvck9wdHMsXG4gICkge1xuICAgIHRoaXMuc3Bhd25PcHRzID0gdGhpcy5nZXRTcGF3bk9wdHMoKVxuICAgIHRoaXMuY2FiYWxBcmdzID0gW11cbiAgfVxuXG4gIHB1YmxpYyBhc3luYyBydW5Db21tYW5kKGNtZDogQ2FiYWxDb21tYW5kKTogUHJvbWlzZTxSZXN1bHRUeXBlPiB7XG4gICAgcmV0dXJuIHRoaXNbY21kXSgpXG4gIH1cblxuICBwdWJsaWMgYWJzdHJhY3QgYnVpbGQoKTogUHJvbWlzZTxSZXN1bHRUeXBlPlxuICBwdWJsaWMgYWJzdHJhY3QgdGVzdCgpOiBQcm9taXNlPFJlc3VsdFR5cGU+XG4gIHB1YmxpYyBhYnN0cmFjdCBiZW5jaCgpOiBQcm9taXNlPFJlc3VsdFR5cGU+XG4gIHB1YmxpYyBhYnN0cmFjdCBjbGVhbigpOiBQcm9taXNlPFJlc3VsdFR5cGU+XG4gIHB1YmxpYyBhYnN0cmFjdCBkZXBzKCk6IFByb21pc2U8UmVzdWx0VHlwZT5cblxuICBwcm90ZWN0ZWQgYXN5bmMgcnVuQ2FiYWwoZXh0cmFBcmdzOiBzdHJpbmdbXSA9IFtdKTogUHJvbWlzZTxSZXN1bHRUeXBlPiB7XG4gICAgcmV0dXJuIHJ1bkNhYmFsUHJvY2Vzcyh0aGlzLnByb2Nlc3NOYW1lLCB0aGlzLmNhYmFsQXJncy5jb25jYXQoZXh0cmFBcmdzKSwgdGhpcy5zcGF3bk9wdHMsIHRoaXMub3B0cy5vcHRzKVxuICB9XG5cbiAgcHJvdGVjdGVkIGdldENvbmZpZ09wdChvcHQ6IHN0cmluZykge1xuICAgIGNvbnN0IG1hcCA9IHtcbiAgICAgICc3LjInOiBhdG9tLmNvbmZpZy5nZXQoYGlkZS1oYXNrZWxsLWNhYmFsLmNhYmFsLmdoYzcwMi4ke29wdH1gKSxcbiAgICAgICc3LjQnOiBhdG9tLmNvbmZpZy5nZXQoYGlkZS1oYXNrZWxsLWNhYmFsLmNhYmFsLmdoYzcwNC4ke29wdH1gKSxcbiAgICAgICc3LjYnOiBhdG9tLmNvbmZpZy5nZXQoYGlkZS1oYXNrZWxsLWNhYmFsLmNhYmFsLmdoYzcwNi4ke29wdH1gKSxcbiAgICAgICc3LjgnOiBhdG9tLmNvbmZpZy5nZXQoYGlkZS1oYXNrZWxsLWNhYmFsLmNhYmFsLmdoYzcwOC4ke29wdH1gKSxcbiAgICAgICc3LjEwJzogYXRvbS5jb25maWcuZ2V0KGBpZGUtaGFza2VsbC1jYWJhbC5jYWJhbC5naGM3MTAuJHtvcHR9YCksXG4gICAgICAnOC4wJzogYXRvbS5jb25maWcuZ2V0KGBpZGUtaGFza2VsbC1jYWJhbC5jYWJhbC5naGM4MDAuJHtvcHR9YCksXG4gICAgfVxuICAgIHJldHVybiBtYXBbYXRvbS5jb25maWcuZ2V0KCdpZGUtaGFza2VsbC1jYWJhbC5jYWJhbC5hY3RpdmVHaGNWZXJzaW9uJyldXG4gIH1cblxuICAvKiB0c2xpbnQ6ZGlzYWJsZTogbm8tc3RyaW5nLWxpdGVyYWwgKi9cbiAgcHJpdmF0ZSBnZXRTcGF3bk9wdHMoKSB7XG4gICAgLy8gU2V0dXAgZGVmYXVsdCBvcHRzXG4gICAgY29uc3Qgb3B0cyA9IHtcbiAgICAgIGN3ZDogdGhpcy5vcHRzLmNhYmFsUm9vdC5nZXRQYXRoKCksXG4gICAgICBkZXRhY2hlZDogdHJ1ZSxcbiAgICAgIGVudjoge30sXG4gICAgfVxuXG4gICAgY29uc3QgZW52ID0geyAuLi5wcm9jZXNzLmVudiB9XG5cbiAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6IHRvdGFsaXR5LWNoZWNrXG4gICAgaWYgKHByb2Nlc3MucGxhdGZvcm0gPT09ICd3aW4zMicpIHtcbiAgICAgIGNvbnN0IHBhdGg6IHN0cmluZ1tdID0gW11cbiAgICAgIGNvbnN0IGNhcE1hc2sgPSAoc3RyOiBzdHJpbmcsIG1hc2s6IG51bWJlcikgPT4ge1xuICAgICAgICBjb25zdCBhID0gc3RyLnNwbGl0KCcnKVxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGEubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6IG5vLWJpdHdpc2VcbiAgICAgICAgICBpZiAobWFzayAmIE1hdGgucG93KDIsIGkpKSB7XG4gICAgICAgICAgICBhW2ldID0gYVtpXS50b1VwcGVyQ2FzZSgpXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBhLmpvaW4oJycpXG4gICAgICB9XG4gICAgICBmb3IgKGxldCBtID0gMGIxMTExOyBtID49IDA7IG0tLSkge1xuICAgICAgICBjb25zdCB2biA9IGNhcE1hc2soJ3BhdGgnLCBtKVxuICAgICAgICBjb25zdCBldm4gPSBlbnZbdm5dXG4gICAgICAgIGlmIChldm4gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIHBhdGgucHVzaChldm4pXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVudlsnUEFUSCddID0gcGF0aC5qb2luKGRlbGltaXRlcilcbiAgICB9XG5cbiAgICAvLyBzZXQgUEFUSCBkZXBlbmRpbmcgb24gY29uZmlnIHNldHRpbmdzXG4gICAgY29uc3QgZ2hjUGF0aCA9IHRoaXMuZ2V0Q29uZmlnT3B0KCdwYXRoVG8nKVxuICAgIGlmICh0aGlzLmdldENvbmZpZ09wdCgncGF0aEV4Y2x1c2l2ZScpKSB7XG4gICAgICBlbnZbJ1BBVEgnXSA9IGdoY1BhdGguam9pbihkZWxpbWl0ZXIpXG4gICAgfSBlbHNlIGlmIChnaGNQYXRoKSB7XG4gICAgICBlbnZbJ1BBVEgnXSA9IGdoY1BhdGguY29uY2F0KChlbnZbJ1BBVEgnXSB8fCAnJykuc3BsaXQoZGVsaW1pdGVyKSkuam9pbihkZWxpbWl0ZXIpXG4gICAgfVxuXG4gICAgLy8gU2V0IHNhbmRib3ggZmlsZSAoaWYgc3BlY2lmaWVkKVxuICAgIGNvbnN0IHNhbmRib3hDb25maWcgPSB0aGlzLmdldENvbmZpZ09wdCgnc2FuZGJveCcpXG4gICAgaWYgKHNhbmRib3hDb25maWcgIT09ICcnKSB7XG4gICAgICBlbnZbJ0NBQkFMX1NBTkRCT1hfQ09ORklHJ10gPSBzYW5kYm94Q29uZmlnXG4gICAgfVxuXG4gICAgb3B0cy5lbnYgPSBlbnZcbiAgICByZXR1cm4gb3B0c1xuICB9XG4gIC8qIHRzbGludDplbmFibGU6IG5vLXN0cmluZy1saXRlcmFsICovXG59XG4iXX0=