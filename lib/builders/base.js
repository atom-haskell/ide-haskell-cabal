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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFzZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9idWlsZGVycy9iYXNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFBQSwrQkFBOEI7QUFJOUIsbURBQXdEO0FBY3hEO0lBSUUsWUFDVSxXQUFtQixFQUNqQixJQUFjO1FBRGhCLGdCQUFXLEdBQVgsV0FBVyxDQUFRO1FBQ2pCLFNBQUksR0FBSixJQUFJLENBQVU7UUFFeEIsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUE7UUFDcEMsSUFBSSxDQUFDLFNBQVMsR0FBRyxFQUFFLENBQUE7SUFDckIsQ0FBQztJQUVZLFVBQVUsQ0FBRSxHQUFpQjs7WUFDeEMsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFBO1FBQ3BCLENBQUM7S0FBQTtJQUVlLFFBQVEsQ0FBRSxZQUFzQixFQUFFOztZQUNoRCxNQUFNLENBQUMsK0JBQWUsQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxFQUFFLElBQUksQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQTtRQUM1RyxDQUFDO0tBQUE7SUFRUyxZQUFZLENBQUUsR0FBVztRQUNqQyxNQUFNLEdBQUcsR0FBRztZQUNWLEtBQUssRUFBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxrQ0FBa0MsR0FBRyxFQUFFLENBQUM7WUFDaEUsS0FBSyxFQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLGtDQUFrQyxHQUFHLEVBQUUsQ0FBQztZQUNoRSxLQUFLLEVBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsa0NBQWtDLEdBQUcsRUFBRSxDQUFDO1lBQ2hFLEtBQUssRUFBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxrQ0FBa0Ms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QUFDLFNBQVMsQ0FBQyxDQUFBO1FBQ2xELEVBQUUsQ0FBQyxDQUFDLGFBQWEsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3pCLEdBQUcsQ0FBQyxzQkFBc0IsQ0FBQyxHQUFHLGFBQWEsQ0FBQTtRQUM3QyxDQUFDO1FBRUQsSUFBSSxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUE7UUFDZCxNQUFNLENBQUMsSUFBSSxDQUFBO0lBQ2IsQ0FBQztDQUVGO0FBekZELGtDQXlGQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7ZGVsaW1pdGVyfSBmcm9tICdwYXRoJ1xuXG5pbXBvcnQge0NhYmFsQ29tbWFuZCwgVGFyZ2V0UGFyYW1UeXBlfSBmcm9tICcuLy4uL2NvbW1vbidcblxuaW1wb3J0IHtydW5DYWJhbFByb2Nlc3MsIElQYXJhbXN9IGZyb20gJy4vY2FiYWwtcHJvY2VzcydcbmV4cG9ydCB7SVBhcmFtc31cblxuZXhwb3J0IGludGVyZmFjZSBDdG9yT3B0cyB7XG4gIG9wdHM6IGFueSxcbiAgdGFyZ2V0OiBUYXJnZXRQYXJhbVR5cGUsXG4gIGNhYmFsUm9vdDogQXRvbVR5cGVzLkRpcmVjdG9yeVxufVxuXG5leHBvcnQgaW50ZXJmYWNlIFJlc3VsdFR5cGUge1xuICBleGl0Q29kZTogbnVtYmVyIHwgbnVsbFxuICBoYXNFcnJvcjogYm9vbGVhblxufVxuXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgQnVpbGRlckJhc2Uge1xuICBwcm90ZWN0ZWQgY2FiYWxBcmdzOiBzdHJpbmdbXVxuICBwcm90ZWN0ZWQgc3Bhd25PcHRzOiB7Y3dkOiBzdHJpbmcsIGRldGFjaGVkOiBib29sZWFuLCBlbnY6IHsgW2tleTogc3RyaW5nXTogc3RyaW5nIHwgdW5kZWZpbmVkIH19XG5cbiAgY29uc3RydWN0b3IgKFxuICAgIHByaXZhdGUgcHJvY2Vzc05hbWU6IHN0cmluZyxcbiAgICBwcm90ZWN0ZWQgb3B0czogQ3Rvck9wdHNcbiAgKSB7XG4gICAgdGhpcy5zcGF3bk9wdHMgPSB0aGlzLmdldFNwYXduT3B0cygpXG4gICAgdGhpcy5jYWJhbEFyZ3MgPSBbXVxuICB9XG5cbiAgcHVibGljIGFzeW5jIHJ1bkNvbW1hbmQgKGNtZDogQ2FiYWxDb21tYW5kKTogUHJvbWlzZTxSZXN1bHRUeXBlPiB7XG4gICAgcmV0dXJuIHRoaXNbY21kXSgpXG4gIH1cblxuICBwcm90ZWN0ZWQgYXN5bmMgcnVuQ2FiYWwgKGV4dHJhQXJnczogc3RyaW5nW10gPSBbXSk6IFByb21pc2U8UmVzdWx0VHlwZT4ge1xuICAgIHJldHVybiBydW5DYWJhbFByb2Nlc3ModGhpcy5wcm9jZXNzTmFtZSwgdGhpcy5jYWJhbEFyZ3MuY29uY2F0KGV4dHJhQXJncyksIHRoaXMuc3Bhd25PcHRzLCB0aGlzLm9wdHMub3B0cylcbiAgfVxuXG4gIHByb3RlY3RlZCBhYnN0cmFjdCBidWlsZCAoKTogUHJvbWlzZTxSZXN1bHRUeXBlPlxuICBwcm90ZWN0ZWQgYWJzdHJhY3QgdGVzdCAoKTogUHJvbWlzZTxSZXN1bHRUeXBlPlxuICBwcm90ZWN0ZWQgYWJzdHJhY3QgYmVuY2ggKCk6IFByb21pc2U8UmVzdWx0VHlwZT5cbiAgcHJvdGVjdGVkIGFic3RyYWN0IGNsZWFuICgpOiBQcm9taXNlPFJlc3VsdFR5cGU+XG4gIHByb3RlY3RlZCBhYnN0cmFjdCBkZXBzICgpOiBQcm9taXNlPFJlc3VsdFR5cGU+XG5cbiAgcHJvdGVjdGVkIGdldENvbmZpZ09wdCAob3B0OiBzdHJpbmcpIHtcbiAgICBjb25zdCBtYXAgPSB7XG4gICAgICAnNy4yJzogIGF0b20uY29uZmlnLmdldChgaWRlLWhhc2tlbGwtY2FiYWwuY2FiYWwuZ2hjNzAyLiR7b3B0fWApLFxuICAgICAgJzcuNCc6ICBhdG9tLmNvbmZpZy5nZXQoYGlkZS1oYXNrZWxsLWNhYmFsLmNhYmFsLmdoYzcwNC4ke29wdH1gKSxcbiAgICAgICc3LjYnOiAgYXRvbS5jb25maWcuZ2V0KGBpZGUtaGFza2VsbC1jYWJhbC5jYWJhbC5naGM3MDYuJHtvcHR9YCksXG4gICAgICAnNy44JzogIGF0b20uY29uZmlnLmdldChgaWRlLWhhc2tlbGwtY2FiYWwuY2FiYWwuZ2hjNzA4LiR7b3B0fWApLFxuICAgICAgJzcuMTAnOiBhdG9tLmNvbmZpZy5nZXQoYGlkZS1oYXNrZWxsLWNhYmFsLmNhYmFsLmdoYzcxMC4ke29wdH1gKSxcbiAgICAgICc4LjAnOiAgYXRvbS5jb25maWcuZ2V0KGBpZGUtaGFza2VsbC1jYWJhbC5jYWJhbC5naGM4MDAuJHtvcHR9YCksXG4gICAgfVxuICAgIHJldHVybiBtYXBbYXRvbS5jb25maWcuZ2V0KCdpZGUtaGFza2VsbC1jYWJhbC5jYWJhbC5hY3RpdmVHaGNWZXJzaW9uJyldXG4gIH1cblxuICAvKiB0c2xpbnQ6ZGlzYWJsZTogbm8tc3RyaW5nLWxpdGVyYWwgKi9cbiAgcHJpdmF0ZSBnZXRTcGF3bk9wdHMgKCkge1xuICAgIC8vIFNldHVwIGRlZmF1bHQgb3B0c1xuICAgIGNvbnN0IG9wdHMgPSB7XG4gICAgICBjd2Q6IHRoaXMub3B0cy5jYWJhbFJvb3QuZ2V0UGF0aCgpLFxuICAgICAgZGV0YWNoZWQ6IHRydWUsXG4gICAgICBlbnY6IHt9LFxuICAgIH1cblxuICAgIGNvbnN0IGVudiA9IHsuLi5wcm9jZXNzLmVudn1cblxuICAgIGlmIChwcm9jZXNzLnBsYXRmb3JtID09PSAnd2luMzInKSB7XG4gICAgICBjb25zdCBwYXRoOiBzdHJpbmdbXSA9IFtdXG4gICAgICBjb25zdCBjYXBNYXNrID0gKHN0cjogc3RyaW5nLCBtYXNrOiBudW1iZXIpID0+IHtcbiAgICAgICAgY29uc3QgYSA9IHN0ci5zcGxpdCgnJylcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOiBuby1iaXR3aXNlXG4gICAgICAgICAgaWYgKG1hc2sgJiBNYXRoLnBvdygyLCBpKSkge1xuICAgICAgICAgICAgYVtpXSA9IGFbaV0udG9VcHBlckNhc2UoKVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYS5qb2luKCcnKVxuICAgICAgfVxuICAgICAgZm9yIChsZXQgbSA9IDBiMTExMTsgbSA+PSAwOyBtLS0pIHtcbiAgICAgICAgY29uc3Qgdm4gPSBjYXBNYXNrKCdwYXRoJywgbSlcbiAgICAgICAgY29uc3QgZXZuID0gZW52W3ZuXVxuICAgICAgICBpZiAoZXZuICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICBwYXRoLnB1c2goZXZuKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBlbnZbJ1BBVEgnXSA9IHBhdGguam9pbihkZWxpbWl0ZXIpXG4gICAgfVxuXG4gICAgLy8gc2V0IFBBVEggZGVwZW5kaW5nIG9uIGNvbmZpZyBzZXR0aW5nc1xuICAgIGNvbnN0IGdoY1BhdGggPSB0aGlzLmdldENvbmZpZ09wdCgncGF0aFRvJylcbiAgICBpZiAodGhpcy5nZXRDb25maWdPcHQoJ3BhdGhFeGNsdXNpdmUnKSkge1xuICAgICAgZW52WydQQVRIJ10gPSBnaGNQYXRoLmpvaW4oZGVsaW1pdGVyKVxuICAgIH0gZWxzZSBpZiAoZ2hjUGF0aCkge1xuICAgICAgZW52WydQQVRIJ10gPSBnaGNQYXRoLmNvbmNhdCgoZW52WydQQVRIJ10gfHwgJycpLnNwbGl0KGRlbGltaXRlcikpLmpvaW4oZGVsaW1pdGVyKVxuICAgIH1cblxuICAgIC8vIFNldCBzYW5kYm94IGZpbGUgKGlmIHNwZWNpZmllZClcbiAgICBjb25zdCBzYW5kYm94Q29uZmlnID0gdGhpcy5nZXRDb25maWdPcHQoJ3NhbmRib3gnKVxuICAgIGlmIChzYW5kYm94Q29uZmlnICE9PSAnJykge1xuICAgICAgZW52WydDQUJBTF9TQU5EQk9YX0NPTkZJRyddID0gc2FuZGJveENvbmZpZ1xuICAgIH1cblxuICAgIG9wdHMuZW52ID0gZW52XG4gICAgcmV0dXJuIG9wdHNcbiAgfVxuICAvKiB0c2xpbnQ6ZW5hYmxlOiBuby1zdHJpbmctbGl0ZXJhbCAqL1xufVxuIl19