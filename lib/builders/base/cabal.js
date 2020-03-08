"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("./index");
const path_1 = require("path");
const child_process = require("child_process");
class CabalBase extends index_1.BuilderBase {
    constructor(opts, globals = {}) {
        super('cabal', opts, globals);
        this.versionPromise = this.getVersion();
    }
    additionalEnvSetup(env) {
        const opts = getCabalOpts();
        const ghcPath = opts.pathTo;
        if (opts.pathExclusive) {
            env.PATH = ghcPath.join(path_1.delimiter);
        }
        else if (ghcPath.length > 0) {
            env.PATH = ghcPath
                .concat((env.PATH || '').split(path_1.delimiter))
                .join(path_1.delimiter);
        }
        return env;
    }
    component() {
        switch (this.opts.target.type) {
            case 'all':
                return this.opts.target.targets.map((x) => x.target);
            case 'component':
                return [this.opts.target.component];
            case 'auto':
                return [];
        }
    }
    async withPrefix(cmd, { oldprefix, newprefix }) {
        const v = await this.versionPromise;
        if (v.major > 2 || (v.major === 2 && v.minor >= 4)) {
            return `${newprefix}${cmd}`;
        }
        else {
            return `${oldprefix}${cmd}`;
        }
    }
    async getVersion() {
        const spawnOpts = this.getSpawnOpts();
        const spawnOptsStr = JSON.stringify({
            path: spawnOpts.env.PATH,
        });
        const result = CabalBase.cabalVersionMap.get(spawnOptsStr);
        if (result) {
            return result;
        }
        else {
            return new Promise((resolve) => {
                child_process.execFile('cabal', ['--numeric-version'], spawnOpts, (error, stdout, stderr) => {
                    var _a, _b;
                    if (error) {
                        const title = 'IDE-Haskell-Cabal failed to get cabal-install version. ' +
                            'Assuming cabal-install < 2.4';
                        const body = `<!-- Provide details about your environment here -->

<!-- Technical details below (please try to provide as much information as
  possible, but feel free to redact to avoid leaking personal information) -->
\`\`\`
Atom: ${atom.getVersion()}
OS: ${process.platform}
Released: ${atom.isReleasedVersion()}
IDE-Haskell-Cabal: ${(_a = atom.packages.getLoadedPackage('ide-haskell-cabal')) === null || _a === void 0 ? void 0 : _a.metadata.version}
IDE-Haskell: ${(_b = atom.packages.getLoadedPackage('ide-haskell')) === null || _b === void 0 ? void 0 : _b.metadata.version}
Error Message: ${error.message}
Error Stack:
${error.stack}
Cabal output (if any):
${stderr.toString()}
PATH: ${spawnOpts.env.PATH}
System PATH: ${process.env.PATH}
\`\`\`
`;
                        const reportUrl = 'https://github.com/atom-haskell/ide-haskell-cabal/issues/new' +
                            `?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`
                                .replace(/\(/g, '%28')
                                .replace(/\)/g, '%29');
                        atom.notifications.addError(title, {
                            dismissable: true,
                            description: 'IDE-Haskell-Cabal encountered the error above while ' +
                                'trying to query cabal-install version. Assuming ' +
                                "cabal-install < 2.4.0.0. If you're reasonably certain this is " +
                                'an issue with IDE-Haskell-Cabal, and not with your ' +
                                `setup, please [file a bug report](${reportUrl}).`,
                            detail: error.message,
                            stack: new Error().stack,
                        });
                        console.error(error);
                        resolve({ major: 0, minor: 0 });
                    }
                    else {
                        const versionraw = stdout
                            .split('.')
                            .slice(0, 2)
                            .map((x) => parseInt(x, 10));
                        const version = { major: versionraw[0], minor: versionraw[1] };
                        CabalBase.cabalVersionMap.set(spawnOptsStr, version);
                        resolve(version);
                    }
                });
            });
        }
    }
}
exports.CabalBase = CabalBase;
CabalBase.cabalVersionMap = new Map();
function getCabalOpts() {
    const vers = atom.config.get('ide-haskell-cabal.cabal.activeGhcVersion');
    const [maj, min] = vers.split('.');
    const key = `ide-haskell-cabal.cabal.ghc${maj}${min.length === 1 ? `0${min}` : min}`;
    return atom.config.get(key);
}
exports.getCabalOpts = getCabalOpts;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FiYWwuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvYnVpbGRlcnMvYmFzZS9jYWJhbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLG1DQUErQztBQUMvQywrQkFBZ0M7QUFFaEMsK0NBQStDO0FBYS9DLE1BQXNCLFNBQVUsU0FBUSxtQkFBVztJQUlqRCxZQUFZLElBQWMsRUFBRSxVQUFrQixFQUFFO1FBQzlDLEtBQUssQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFBO1FBQzdCLElBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFBO0lBQ3pDLENBQUM7SUFFUyxrQkFBa0IsQ0FBQyxHQUF1QjtRQUNsRCxNQUFNLElBQUksR0FBRyxZQUFZLEVBQUUsQ0FBQTtRQUMzQixNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFBO1FBQzNCLElBQUksSUFBSSxDQUFDLGFBQWEsRUFBRTtZQUN0QixHQUFHLENBQUMsSUFBSSxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUMsZ0JBQVMsQ0FBQyxDQUFBO1NBQ25DO2FBQU0sSUFBSSxPQUFPLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtZQUM3QixHQUFHLENBQUMsSUFBSSxHQUFHLE9BQU87aUJBQ2YsTUFBTSxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksSUFBSSxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsZ0JBQVMsQ0FBQyxDQUFDO2lCQUN6QyxJQUFJLENBQUMsZ0JBQVMsQ0FBQyxDQUFBO1NBQ25CO1FBRUQsT0FBTyxHQUFHLENBQUE7SUFDWixDQUFDO0lBRVMsU0FBUztRQUNqQixRQUFRLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRTtZQUM3QixLQUFLLEtBQUs7Z0JBQ1IsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FB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QUNqQyxFQUFFLENBQUE7SUFDRixPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFBO0FBQzdCLENBQUM7QUFQRCxvQ0FPQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEN0b3JPcHRzLCBCdWlsZGVyQmFzZSB9IGZyb20gJy4vaW5kZXgnXG5pbXBvcnQgeyBkZWxpbWl0ZXIgfSBmcm9tICdwYXRoJ1xuaW1wb3J0IHsgQ29uZmlnVmFsdWVzIH0gZnJvbSAnYXRvbSdcbmltcG9ydCBjaGlsZF9wcm9jZXNzID0gcmVxdWlyZSgnY2hpbGRfcHJvY2VzcycpXG5cbnR5cGUgR0hDVmVyUHJvcHMgPSBDb25maWdWYWx1ZXNbJ2lkZS1oYXNrZWxsLWNhYmFsJ11bJ2NhYmFsJ11bJ2doYzgwMCddXG50eXBlIENhYmFsVmVyc2lvbiA9IHsgbWFqb3I6IG51bWJlcjsgbWlub3I6IG51bWJlciB9XG5cbmRlY2xhcmUgbW9kdWxlICdhdG9tJyB7XG4gIGludGVyZmFjZSBQYWNrYWdlIHtcbiAgICBtZXRhZGF0YToge1xuICAgICAgdmVyc2lvbjogc3RyaW5nXG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBDYWJhbEJhc2UgZXh0ZW5kcyBCdWlsZGVyQmFzZSB7XG4gIHByaXZhdGUgc3RhdGljIGNhYmFsVmVyc2lvbk1hcCA9IG5ldyBNYXA8c3RyaW5nLCBDYWJhbFZlcnNpb24+KClcbiAgcHJvdGVjdGVkIHZlcnNpb25Qcm9taXNlOiBQcm9taXNlPENhYmFsVmVyc2lvbj5cblxuICBjb25zdHJ1Y3RvcihvcHRzOiBDdG9yT3B0cywgZ2xvYmFsczogb2JqZWN0ID0ge30pIHtcbiAgICBzdXBlcignY2FiYWwnLCBvcHRzLCBnbG9iYWxzKVxuICAgIHRoaXMudmVyc2lvblByb21pc2UgPSB0aGlzLmdldFZlcnNpb24oKVxuICB9XG5cbiAgcHJvdGVjdGVkIGFkZGl0aW9uYWxFbnZTZXR1cChlbnY6IHR5cGVvZiBwcm9jZXNzLmVudikge1xuICAgIGNvbnN0IG9wdHMgPSBnZXRDYWJhbE9wdHMoKVxuICAgIGNvbnN0IGdoY1BhdGggPSBvcHRzLnBhdGhUb1xuICAgIGlmIChvcHRzLnBhdGhFeGNsdXNpdmUpIHtcbiAgICAgIGVudi5QQVRIID0gZ2hjUGF0aC5qb2luKGRlbGltaXRlcilcbiAgICB9IGVsc2UgaWYgKGdoY1BhdGgubGVuZ3RoID4gMCkge1xuICAgICAgZW52LlBBVEggPSBnaGNQYXRoXG4gICAgICAgIC5jb25jYXQoKGVudi5QQVRIIHx8ICcnKS5zcGxpdChkZWxpbWl0ZXIpKVxuICAgICAgICAuam9pbihkZWxpbWl0ZXIpXG4gICAgfVxuXG4gICAgcmV0dXJuIGVudlxuICB9XG5cbiAgcHJvdGVjdGVkIGNvbXBvbmVudCgpIHtcbiAgICBzd2l0Y2ggKHRoaXMub3B0cy50YXJnZXQudHlwZSkge1xuICAgICAgY2FzZSAnYWxsJzpcbiAgICAgICAgcmV0dXJuIHRoaXMub3B0cy50YXJnZXQudGFyZ2V0cy5tYXAoKHgpID0+IHgudGFyZ2V0KVxuICAgICAgY2FzZSAnY29tcG9uZW50JzpcbiAgICAgICAgcmV0dXJuIFt0aGlzLm9wdHMudGFyZ2V0LmNvbXBvbmVudF1cbiAgICAgIGNhc2UgJ2F1dG8nOlxuICAgICAgICByZXR1cm4gW11cbiAgICB9XG4gIH1cblxuICBwcm90ZWN0ZWQgYXN5bmMgd2l0aFByZWZpeChcbiAgICBjbWQ6IHN0cmluZyxcbiAgICB7IG9sZHByZWZpeCwgbmV3cHJlZml4IH06IHsgb2xkcHJlZml4OiBzdHJpbmc7IG5ld3ByZWZpeDogc3RyaW5nIH0sXG4gICkge1xuICAgIGNvbnN0IHYgPSBhd2FpdCB0aGlzLnZlcnNpb25Qcm9taXNlXG4gICAgaWYgKHYubWFqb3IgPiAyIHx8ICh2Lm1ham9yID09PSAyICYmIHYubWlub3IgPj0gNCkpIHtcbiAgICAgIHJldHVybiBgJHtuZXdwcmVmaXh9JHtjbWR9YFxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gYCR7b2xkcHJlZml4fSR7Y21kfWBcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGdldFZlcnNpb24oKSB7XG4gICAgY29uc3Qgc3Bhd25PcHRzID0gdGhpcy5nZXRTcGF3bk9wdHMoKVxuICAgIGNvbnN0IHNwYXduT3B0c1N0ciA9IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgIHBhdGg6IHNwYXduT3B0cy5lbnYuUEFUSCxcbiAgICB9KVxuICAgIGNvbnN0IHJlc3VsdCA9IENhYmFsQmFzZS5jYWJhbFZlcnNpb25NYXAuZ2V0KHNwYXduT3B0c1N0cilcbiAgICBpZiAocmVzdWx0KSB7XG4gICAgICByZXR1cm4gcmVzdWx0XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZTxDYWJhbFZlcnNpb24+KChyZXNvbHZlKSA9PiB7XG4gICAgICAgIGNoaWxkX3Byb2Nlc3MuZXhlY0ZpbGUoXG4gICAgICAgICAgJ2NhYmFsJyxcbiAgICAgICAgICBbJy0tbnVtZXJpYy12ZXJzaW9uJ10sXG4gICAgICAgICAgc3Bhd25PcHRzLFxuICAgICAgICAgIChlcnJvciwgc3Rkb3V0LCBzdGRlcnIpID0+IHtcbiAgICAgICAgICAgIGlmIChlcnJvcikge1xuICAgICAgICAgICAgICBjb25zdCB0aXRsZSA9XG4gICAgICAgICAgICAgICAgJ0lERS1IYXNrZWxsLUNhYmFsIGZhaWxlZCB0byBnZXQgY2FiYWwtaW5zdGFsbCB2ZXJzaW9uLiAnICtcbiAgICAgICAgICAgICAgICAnQXNzdW1pbmcgY2FiYWwtaW5zdGFsbCA8IDIuNCdcbiAgICAgICAgICAgICAgY29uc3QgYm9keSA9IGA8IS0tIFByb3ZpZGUgZGV0YWlscyBhYm91dCB5b3VyIGVudmlyb25tZW50IGhlcmUgLS0+XG5cbjwhLS0gVGVjaG5pY2FsIGRldGFpbHMgYmVsb3cgKHBsZWFzZSB0cnkgdG8gcHJvdmlkZSBhcyBtdWNoIGluZm9ybWF0aW9uIGFzXG4gIHBvc3NpYmxlLCBidXQgZmVlbCBmcmVlIHRvIHJlZGFjdCB0byBhdm9pZCBsZWFraW5nIHBlcnNvbmFsIGluZm9ybWF0aW9uKSAtLT5cblxcYFxcYFxcYFxuQXRvbTogJHthdG9tLmdldFZlcnNpb24oKX1cbk9TOiAke3Byb2Nlc3MucGxhdGZvcm19XG5SZWxlYXNlZDogJHthdG9tLmlzUmVsZWFzZWRWZXJzaW9uKCl9XG5JREUtSGFza2VsbC1DYWJhbDogJHtcbiAgICAgICAgICAgICAgICBhdG9tLnBhY2thZ2VzLmdldExvYWRlZFBhY2thZ2UoJ2lkZS1oYXNrZWxsLWNhYmFsJyk/Lm1ldGFkYXRhXG4gICAgICAgICAgICAgICAgICAudmVyc2lvblxuICAgICAgICAgICAgICB9XG5JREUtSGFza2VsbDogJHthdG9tLnBhY2thZ2VzLmdldExvYWRlZFBhY2thZ2UoJ2lkZS1oYXNrZWxsJyk/Lm1ldGFkYXRhLnZlcnNpb259XG5FcnJvciBNZXNzYWdlOiAke2Vycm9yLm1lc3NhZ2V9XG5FcnJvciBTdGFjazpcbiR7ZXJyb3Iuc3RhY2t9XG5DYWJhbCBvdXRwdXQgKGlmIGFueSk6XG4ke3N0ZGVyci50b1N0cmluZygpfVxuUEFUSDogJHtzcGF3bk9wdHMuZW52LlBBVEh9XG5TeXN0ZW0gUEFUSDogJHtwcm9jZXNzLmVudi5QQVRIfVxuXFxgXFxgXFxgXG5gXG4gICAgICAgICAgICAgIGNvbnN0IHJlcG9ydFVybCA9XG4gICAgICAgICAgICAgICAgJ2h0dHBzOi8vZ2l0aHViLmNvbS9hdG9tLWhhc2tlbGwvaWRlLWhhc2tlbGwtY2FiYWwvaXNzdWVzL25ldycgK1xuICAgICAgICAgICAgICAgIGA/dGl0bGU9JHtlbmNvZGVVUklDb21wb25lbnQodGl0bGUpfSZib2R5PSR7ZW5jb2RlVVJJQ29tcG9uZW50KFxuICAgICAgICAgICAgICAgICAgYm9keSxcbiAgICAgICAgICAgICAgICApfWBcbiAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cXCgvZywgJyUyOCcpXG4gICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFwpL2csICclMjknKVxuICAgICAgICAgICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkRXJyb3IodGl0bGUsIHtcbiAgICAgICAgICAgICAgICBkaXNtaXNzYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjpcbiAgICAgICAgICAgICAgICAgICdJREUtSGFza2VsbC1DYWJhbCBlbmNvdW50ZXJlZCB0aGUgZXJyb3IgYWJvdmUgd2hpbGUgJyArXG4gICAgICAgICAgICAgICAgICAndHJ5aW5nIHRvIHF1ZXJ5IGNhYmFsLWluc3RhbGwgdmVyc2lvbi4gQXNzdW1pbmcgJyArXG4gICAgICAgICAgICAgICAgICBcImNhYmFsLWluc3RhbGwgPCAyLjQuMC4wLiBJZiB5b3UncmUgcmVhc29uYWJseSBjZXJ0YWluIHRoaXMgaXMgXCIgK1xuICAgICAgICAgICAgICAgICAgJ2FuIGlzc3VlIHdpdGggSURFLUhhc2tlbGwtQ2FiYWwsIGFuZCBub3Qgd2l0aCB5b3VyICcgK1xuICAgICAgICAgICAgICAgICAgYHNldHVwLCBwbGVhc2UgW2ZpbGUgYSBidWcgcmVwb3J0XSgke3JlcG9ydFVybH0pLmAsXG4gICAgICAgICAgICAgICAgZGV0YWlsOiBlcnJvci5tZXNzYWdlLFxuICAgICAgICAgICAgICAgIHN0YWNrOiBuZXcgRXJyb3IoKS5zdGFjayxcbiAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcilcbiAgICAgICAgICAgICAgcmVzb2x2ZSh7IG1ham9yOiAwLCBtaW5vcjogMCB9KVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgY29uc3QgdmVyc2lvbnJhdyA9IHN0ZG91dFxuICAgICAgICAgICAgICAgIC5zcGxpdCgnLicpXG4gICAgICAgICAgICAgICAgLnNsaWNlKDAsIDIpXG4gICAgICAgICAgICAgICAgLm1hcCgoeCkgPT4gcGFyc2VJbnQoeCwgMTApKVxuICAgICAgICAgICAgICBjb25zdCB2ZXJzaW9uID0geyBtYWpvcjogdmVyc2lvbnJhd1swXSwgbWlub3I6IHZlcnNpb25yYXdbMV0gfVxuICAgICAgICAgICAgICBDYWJhbEJhc2UuY2FiYWxWZXJzaW9uTWFwLnNldChzcGF3bk9wdHNTdHIsIHZlcnNpb24pXG4gICAgICAgICAgICAgIHJlc29sdmUodmVyc2lvbilcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9LFxuICAgICAgICApXG4gICAgICB9KVxuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q2FiYWxPcHRzKCk6IEdIQ1ZlclByb3BzIHtcbiAgY29uc3QgdmVycyA9IGF0b20uY29uZmlnLmdldCgnaWRlLWhhc2tlbGwtY2FiYWwuY2FiYWwuYWN0aXZlR2hjVmVyc2lvbicpXG4gIGNvbnN0IFttYWosIG1pbl0gPSB2ZXJzLnNwbGl0KCcuJylcbiAgY29uc3Qga2V5ID0gYGlkZS1oYXNrZWxsLWNhYmFsLmNhYmFsLmdoYyR7bWFqfSR7XG4gICAgbWluLmxlbmd0aCA9PT0gMSA/IGAwJHttaW59YCA6IG1pblxuICB9YFxuICByZXR1cm4gYXRvbS5jb25maWcuZ2V0KGtleSlcbn1cbiJdfQ==