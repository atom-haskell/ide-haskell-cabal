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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFzZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9idWlsZGVycy9iYXNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFBQSwrQkFBOEI7QUFJOUIsbURBQXdEO0FBZ0J4RDtJQUlFLFlBQ1UsV0FBbUIsRUFDakIsSUFBYztRQURoQixnQkFBVyxHQUFYLFdBQVcsQ0FBUTtRQUNqQixTQUFJLEdBQUosSUFBSSxDQUFVO1FBRXhCLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFBO1FBQ3BDLElBQUksQ0FBQyxTQUFTLEdBQUcsRUFBRSxDQUFBO0lBQ3JCLENBQUM7SUFFWSxVQUFVLENBQUUsR0FBaUI7O1lBQ3hDLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQTtRQUNwQixDQUFDO0tBQUE7SUFRZSxRQUFRLENBQUUsWUFBc0IsRUFBRTs7WUFDaEQsTUFBTSxDQUFDLCtCQUFlLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsRUFBRSxJQUFJLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUE7UUFDNUcsQ0FBQztLQUFBO0lBRVMsWUFBWSxDQUFFLEdBQVc7UUFDakMsTUFBTSxHQUFHLEdBQUc7WUFDVixLQUFLLEVBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsa0NBQWtDLEdBQUcsRUFBRSxDQUFDO1lBQ2hFLEtBQUssRUFBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxrQ0FBa0MsR0FBRyxFQUFFLENBQUM7WUFDaEUsS0FBSyxFQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLGtDQUFrQyxHQUFHLEVBQUUsQ0FBQztZQUNoRSxLQUFLLEVBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsa0NBQWtD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Q0FBQyxTQUFTLENBQUMsQ0FBQTtRQUNsRCxFQUFFLENBQUMsQ0FBQyxhQUFhLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN6QixHQUFHLENBQUMsc0JBQXNCLENBQUMsR0FBRyxhQUFhLENBQUE7UUFDN0MsQ0FBQztRQUVELElBQUksQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFBO1FBQ2QsTUFBTSxDQUFDLElBQUksQ0FBQTtJQUNiLENBQUM7Q0FFRjtBQXpGRCxrQ0F5RkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge2RlbGltaXRlcn0gZnJvbSAncGF0aCdcblxuaW1wb3J0IHtDYWJhbENvbW1hbmQsIFRhcmdldFBhcmFtVHlwZX0gZnJvbSAnLi8uLi9jb21tb24nXG5cbmltcG9ydCB7cnVuQ2FiYWxQcm9jZXNzLCBJUGFyYW1zfSBmcm9tICcuL2NhYmFsLXByb2Nlc3MnXG5leHBvcnQge0lQYXJhbXN9XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ3Rvck9wdHMge1xuICBvcHRzOiBJUGFyYW1zLFxuICB0YXJnZXQ6IFRhcmdldFBhcmFtVHlwZSxcbiAgY2FiYWxSb290OiBBdG9tVHlwZXMuRGlyZWN0b3J5XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUmVzdWx0VHlwZSB7XG4gIGV4aXRDb2RlOiBudW1iZXIgfCBudWxsXG4gIGhhc0Vycm9yOiBib29sZWFuXG59XG5cbmV4cG9ydCB0eXBlIFRCdWlsZGVyQmFzZSA9IHtbSyBpbiBDYWJhbENvbW1hbmRdOiAoKSA9PiBQcm9taXNlPFJlc3VsdFR5cGU+fVxuXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgQnVpbGRlckJhc2UgaW1wbGVtZW50cyBUQnVpbGRlckJhc2Uge1xuICBwcm90ZWN0ZWQgY2FiYWxBcmdzOiBzdHJpbmdbXVxuICBwcm90ZWN0ZWQgc3Bhd25PcHRzOiB7Y3dkOiBzdHJpbmcsIGRldGFjaGVkOiBib29sZWFuLCBlbnY6IHsgW2tleTogc3RyaW5nXTogc3RyaW5nIHwgdW5kZWZpbmVkIH19XG5cbiAgY29uc3RydWN0b3IgKFxuICAgIHByaXZhdGUgcHJvY2Vzc05hbWU6IHN0cmluZyxcbiAgICBwcm90ZWN0ZWQgb3B0czogQ3Rvck9wdHNcbiAgKSB7XG4gICAgdGhpcy5zcGF3bk9wdHMgPSB0aGlzLmdldFNwYXduT3B0cygpXG4gICAgdGhpcy5jYWJhbEFyZ3MgPSBbXVxuICB9XG5cbiAgcHVibGljIGFzeW5jIHJ1bkNvbW1hbmQgKGNtZDogQ2FiYWxDb21tYW5kKTogUHJvbWlzZTxSZXN1bHRUeXBlPiB7XG4gICAgcmV0dXJuIHRoaXNbY21kXSgpXG4gIH1cblxuICBwdWJsaWMgYWJzdHJhY3QgYnVpbGQgKCk6IFByb21pc2U8UmVzdWx0VHlwZT5cbiAgcHVibGljIGFic3RyYWN0IHRlc3QgKCk6IFByb21pc2U8UmVzdWx0VHlwZT5cbiAgcHVibGljIGFic3RyYWN0IGJlbmNoICgpOiBQcm9taXNlPFJlc3VsdFR5cGU+XG4gIHB1YmxpYyBhYnN0cmFjdCBjbGVhbiAoKTogUHJvbWlzZTxSZXN1bHRUeXBlPlxuICBwdWJsaWMgYWJzdHJhY3QgZGVwcyAoKTogUHJvbWlzZTxSZXN1bHRUeXBlPlxuXG4gIHByb3RlY3RlZCBhc3luYyBydW5DYWJhbCAoZXh0cmFBcmdzOiBzdHJpbmdbXSA9IFtdKTogUHJvbWlzZTxSZXN1bHRUeXBlPiB7XG4gICAgcmV0dXJuIHJ1bkNhYmFsUHJvY2Vzcyh0aGlzLnByb2Nlc3NOYW1lLCB0aGlzLmNhYmFsQXJncy5jb25jYXQoZXh0cmFBcmdzKSwgdGhpcy5zcGF3bk9wdHMsIHRoaXMub3B0cy5vcHRzKVxuICB9XG5cbiAgcHJvdGVjdGVkIGdldENvbmZpZ09wdCAob3B0OiBzdHJpbmcpIHtcbiAgICBjb25zdCBtYXAgPSB7XG4gICAgICAnNy4yJzogIGF0b20uY29uZmlnLmdldChgaWRlLWhhc2tlbGwtY2FiYWwuY2FiYWwuZ2hjNzAyLiR7b3B0fWApLFxuICAgICAgJzcuNCc6ICBhdG9tLmNvbmZpZy5nZXQoYGlkZS1oYXNrZWxsLWNhYmFsLmNhYmFsLmdoYzcwNC4ke29wdH1gKSxcbiAgICAgICc3LjYnOiAgYXRvbS5jb25maWcuZ2V0KGBpZGUtaGFza2VsbC1jYWJhbC5jYWJhbC5naGM3MDYuJHtvcHR9YCksXG4gICAgICAnNy44JzogIGF0b20uY29uZmlnLmdldChgaWRlLWhhc2tlbGwtY2FiYWwuY2FiYWwuZ2hjNzA4LiR7b3B0fWApLFxuICAgICAgJzcuMTAnOiBhdG9tLmNvbmZpZy5nZXQoYGlkZS1oYXNrZWxsLWNhYmFsLmNhYmFsLmdoYzcxMC4ke29wdH1gKSxcbiAgICAgICc4LjAnOiAgYXRvbS5jb25maWcuZ2V0KGBpZGUtaGFza2VsbC1jYWJhbC5jYWJhbC5naGM4MDAuJHtvcHR9YCksXG4gICAgfVxuICAgIHJldHVybiBtYXBbYXRvbS5jb25maWcuZ2V0KCdpZGUtaGFza2VsbC1jYWJhbC5jYWJhbC5hY3RpdmVHaGNWZXJzaW9uJyldXG4gIH1cblxuICAvKiB0c2xpbnQ6ZGlzYWJsZTogbm8tc3RyaW5nLWxpdGVyYWwgKi9cbiAgcHJpdmF0ZSBnZXRTcGF3bk9wdHMgKCkge1xuICAgIC8vIFNldHVwIGRlZmF1bHQgb3B0c1xuICAgIGNvbnN0IG9wdHMgPSB7XG4gICAgICBjd2Q6IHRoaXMub3B0cy5jYWJhbFJvb3QuZ2V0UGF0aCgpLFxuICAgICAgZGV0YWNoZWQ6IHRydWUsXG4gICAgICBlbnY6IHt9LFxuICAgIH1cblxuICAgIGNvbnN0IGVudiA9IHsuLi5wcm9jZXNzLmVudn1cblxuICAgIGlmIChwcm9jZXNzLnBsYXRmb3JtID09PSAnd2luMzInKSB7XG4gICAgICBjb25zdCBwYXRoOiBzdHJpbmdbXSA9IFtdXG4gICAgICBjb25zdCBjYXBNYXNrID0gKHN0cjogc3RyaW5nLCBtYXNrOiBudW1iZXIpID0+IHtcbiAgICAgICAgY29uc3QgYSA9IHN0ci5zcGxpdCgnJylcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOiBuby1iaXR3aXNlXG4gICAgICAgICAgaWYgKG1hc2sgJiBNYXRoLnBvdygyLCBpKSkge1xuICAgICAgICAgICAgYVtpXSA9IGFbaV0udG9VcHBlckNhc2UoKVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYS5qb2luKCcnKVxuICAgICAgfVxuICAgICAgZm9yIChsZXQgbSA9IDBiMTExMTsgbSA+PSAwOyBtLS0pIHtcbiAgICAgICAgY29uc3Qgdm4gPSBjYXBNYXNrKCdwYXRoJywgbSlcbiAgICAgICAgY29uc3QgZXZuID0gZW52W3ZuXVxuICAgICAgICBpZiAoZXZuICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICBwYXRoLnB1c2goZXZuKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBlbnZbJ1BBVEgnXSA9IHBhdGguam9pbihkZWxpbWl0ZXIpXG4gICAgfVxuXG4gICAgLy8gc2V0IFBBVEggZGVwZW5kaW5nIG9uIGNvbmZpZyBzZXR0aW5nc1xuICAgIGNvbnN0IGdoY1BhdGggPSB0aGlzLmdldENvbmZpZ09wdCgncGF0aFRvJylcbiAgICBpZiAodGhpcy5nZXRDb25maWdPcHQoJ3BhdGhFeGNsdXNpdmUnKSkge1xuICAgICAgZW52WydQQVRIJ10gPSBnaGNQYXRoLmpvaW4oZGVsaW1pdGVyKVxuICAgIH0gZWxzZSBpZiAoZ2hjUGF0aCkge1xuICAgICAgZW52WydQQVRIJ10gPSBnaGNQYXRoLmNvbmNhdCgoZW52WydQQVRIJ10gfHwgJycpLnNwbGl0KGRlbGltaXRlcikpLmpvaW4oZGVsaW1pdGVyKVxuICAgIH1cblxuICAgIC8vIFNldCBzYW5kYm94IGZpbGUgKGlmIHNwZWNpZmllZClcbiAgICBjb25zdCBzYW5kYm94Q29uZmlnID0gdGhpcy5nZXRDb25maWdPcHQoJ3NhbmRib3gnKVxuICAgIGlmIChzYW5kYm94Q29uZmlnICE9PSAnJykge1xuICAgICAgZW52WydDQUJBTF9TQU5EQk9YX0NPTkZJRyddID0gc2FuZGJveENvbmZpZ1xuICAgIH1cblxuICAgIG9wdHMuZW52ID0gZW52XG4gICAgcmV0dXJuIG9wdHNcbiAgfVxuICAvKiB0c2xpbnQ6ZW5hYmxlOiBuby1zdHJpbmctbGl0ZXJhbCAqL1xufVxuIl19