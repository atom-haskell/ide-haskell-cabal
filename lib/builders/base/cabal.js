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
        if (v.major > 2 || (v.major == 2 && v.minor >= 4)) {
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
IDE-Haskell-Cabal: ${atom.packages.getLoadedPackage('ide-haskell-cabal').metadata
                            .version}
IDE-Haskell: ${atom.packages.getLoadedPackage('ide-haskell').metadata.version}
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FiYWwuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvYnVpbGRlcnMvYmFzZS9jYWJhbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLG1DQUErQztBQUMvQywrQkFBZ0M7QUFFaEMsK0NBQStDO0FBYS9DLE1BQXNCLFNBQVUsU0FBUSxtQkFBVztJQUlqRCxZQUFZLElBQWMsRUFBRSxVQUFrQixFQUFFO1FBQzlDLEtBQUssQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFBO1FBQzdCLElBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFBO0lBQ3pDLENBQUM7SUFFUyxrQkFBa0IsQ0FBQyxHQUF1QjtRQUNsRCxNQUFNLElBQUksR0FBRyxZQUFZLEVBQUUsQ0FBQTtRQUMzQixNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFBO1FBQzNCLElBQUksSUFBSSxDQUFDLGFBQWEsRUFBRTtZQUN0QixHQUFHLENBQUMsSUFBSSxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUMsZ0JBQVMsQ0FBQyxDQUFBO1NBQ25DO2FBQU0sSUFBSSxPQUFPLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtZQUM3QixHQUFHLENBQUMsSUFBSSxHQUFHLE9BQU87aUJBQ2YsTUFBTSxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksSUFBSSxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsZ0JBQVMsQ0FBQyxDQUFDO2lCQUN6QyxJQUFJLENBQUMsZ0JBQVMsQ0FBQyxDQUFBO1NBQ25CO1FBRUQsT0FBTyxHQUFHLENBQUE7SUFDWixDQUFDO0lBRVMsU0FBUztRQUNqQixRQUFRLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRTtZQUM3QixLQUFLLEtBQUs7Z0JBQ1IsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FB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QUE7SUFDRixPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFBO0FBQzdCLENBQUM7QUFQRCxvQ0FPQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEN0b3JPcHRzLCBCdWlsZGVyQmFzZSB9IGZyb20gJy4vaW5kZXgnXG5pbXBvcnQgeyBkZWxpbWl0ZXIgfSBmcm9tICdwYXRoJ1xuaW1wb3J0IHsgQ29uZmlnVmFsdWVzIH0gZnJvbSAnYXRvbSdcbmltcG9ydCBjaGlsZF9wcm9jZXNzID0gcmVxdWlyZSgnY2hpbGRfcHJvY2VzcycpXG5cbnR5cGUgR0hDVmVyUHJvcHMgPSBDb25maWdWYWx1ZXNbJ2lkZS1oYXNrZWxsLWNhYmFsJ11bJ2NhYmFsJ11bJ2doYzgwMCddXG50eXBlIENhYmFsVmVyc2lvbiA9IHsgbWFqb3I6IG51bWJlcjsgbWlub3I6IG51bWJlciB9XG5cbmRlY2xhcmUgbW9kdWxlICdhdG9tJyB7XG4gIGludGVyZmFjZSBQYWNrYWdlIHtcbiAgICBtZXRhZGF0YToge1xuICAgICAgdmVyc2lvbjogc3RyaW5nXG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBDYWJhbEJhc2UgZXh0ZW5kcyBCdWlsZGVyQmFzZSB7XG4gIHByb3RlY3RlZCB2ZXJzaW9uUHJvbWlzZTogUHJvbWlzZTxDYWJhbFZlcnNpb24+XG4gIHByaXZhdGUgc3RhdGljIGNhYmFsVmVyc2lvbk1hcCA9IG5ldyBNYXA8c3RyaW5nLCBDYWJhbFZlcnNpb24+KClcblxuICBjb25zdHJ1Y3RvcihvcHRzOiBDdG9yT3B0cywgZ2xvYmFsczogb2JqZWN0ID0ge30pIHtcbiAgICBzdXBlcignY2FiYWwnLCBvcHRzLCBnbG9iYWxzKVxuICAgIHRoaXMudmVyc2lvblByb21pc2UgPSB0aGlzLmdldFZlcnNpb24oKVxuICB9XG5cbiAgcHJvdGVjdGVkIGFkZGl0aW9uYWxFbnZTZXR1cChlbnY6IHR5cGVvZiBwcm9jZXNzLmVudikge1xuICAgIGNvbnN0IG9wdHMgPSBnZXRDYWJhbE9wdHMoKVxuICAgIGNvbnN0IGdoY1BhdGggPSBvcHRzLnBhdGhUb1xuICAgIGlmIChvcHRzLnBhdGhFeGNsdXNpdmUpIHtcbiAgICAgIGVudi5QQVRIID0gZ2hjUGF0aC5qb2luKGRlbGltaXRlcilcbiAgICB9IGVsc2UgaWYgKGdoY1BhdGgubGVuZ3RoID4gMCkge1xuICAgICAgZW52LlBBVEggPSBnaGNQYXRoXG4gICAgICAgIC5jb25jYXQoKGVudi5QQVRIIHx8ICcnKS5zcGxpdChkZWxpbWl0ZXIpKVxuICAgICAgICAuam9pbihkZWxpbWl0ZXIpXG4gICAgfVxuXG4gICAgcmV0dXJuIGVudlxuICB9XG5cbiAgcHJvdGVjdGVkIGNvbXBvbmVudCgpIHtcbiAgICBzd2l0Y2ggKHRoaXMub3B0cy50YXJnZXQudHlwZSkge1xuICAgICAgY2FzZSAnYWxsJzpcbiAgICAgICAgcmV0dXJuIHRoaXMub3B0cy50YXJnZXQudGFyZ2V0cy5tYXAoKHgpID0+IHgudGFyZ2V0KVxuICAgICAgY2FzZSAnY29tcG9uZW50JzpcbiAgICAgICAgcmV0dXJuIFt0aGlzLm9wdHMudGFyZ2V0LmNvbXBvbmVudF1cbiAgICAgIGNhc2UgJ2F1dG8nOlxuICAgICAgICByZXR1cm4gW11cbiAgICB9XG4gIH1cblxuICBwcm90ZWN0ZWQgYXN5bmMgd2l0aFByZWZpeChcbiAgICBjbWQ6IHN0cmluZyxcbiAgICB7IG9sZHByZWZpeCwgbmV3cHJlZml4IH06IHsgb2xkcHJlZml4OiBzdHJpbmc7IG5ld3ByZWZpeDogc3RyaW5nIH0sXG4gICkge1xuICAgIGNvbnN0IHYgPSBhd2FpdCB0aGlzLnZlcnNpb25Qcm9taXNlXG4gICAgaWYgKHYubWFqb3IgPiAyIHx8ICh2Lm1ham9yID09IDIgJiYgdi5taW5vciA+PSA0KSkge1xuICAgICAgcmV0dXJuIGAke25ld3ByZWZpeH0ke2NtZH1gXG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBgJHtvbGRwcmVmaXh9JHtjbWR9YFxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgZ2V0VmVyc2lvbigpIHtcbiAgICBjb25zdCBzcGF3bk9wdHMgPSB0aGlzLmdldFNwYXduT3B0cygpXG4gICAgY29uc3Qgc3Bhd25PcHRzU3RyID0gSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgcGF0aDogc3Bhd25PcHRzLmVudi5QQVRILFxuICAgIH0pXG4gICAgY29uc3QgcmVzdWx0ID0gQ2FiYWxCYXNlLmNhYmFsVmVyc2lvbk1hcC5nZXQoc3Bhd25PcHRzU3RyKVxuICAgIGlmIChyZXN1bHQpIHtcbiAgICAgIHJldHVybiByZXN1bHRcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPENhYmFsVmVyc2lvbj4oKHJlc29sdmUpID0+IHtcbiAgICAgICAgY2hpbGRfcHJvY2Vzcy5leGVjRmlsZShcbiAgICAgICAgICAnY2FiYWwnLFxuICAgICAgICAgIFsnLS1udW1lcmljLXZlcnNpb24nXSxcbiAgICAgICAgICBzcGF3bk9wdHMsXG4gICAgICAgICAgKGVycm9yLCBzdGRvdXQsIHN0ZGVycikgPT4ge1xuICAgICAgICAgICAgaWYgKGVycm9yKSB7XG4gICAgICAgICAgICAgIGNvbnN0IHRpdGxlID1cbiAgICAgICAgICAgICAgICAnSURFLUhhc2tlbGwtQ2FiYWwgZmFpbGVkIHRvIGdldCBjYWJhbC1pbnN0YWxsIHZlcnNpb24uICcgK1xuICAgICAgICAgICAgICAgICdBc3N1bWluZyBjYWJhbC1pbnN0YWxsIDwgMi40J1xuICAgICAgICAgICAgICBjb25zdCBib2R5ID0gYDwhLS0gUHJvdmlkZSBkZXRhaWxzIGFib3V0IHlvdXIgZW52aXJvbm1lbnQgaGVyZSAtLT5cblxuPCEtLSBUZWNobmljYWwgZGV0YWlscyBiZWxvdyAocGxlYXNlIHRyeSB0byBwcm92aWRlIGFzIG11Y2ggaW5mb3JtYXRpb24gYXNcbiAgcG9zc2libGUsIGJ1dCBmZWVsIGZyZWUgdG8gcmVkYWN0IHRvIGF2b2lkIGxlYWtpbmcgcGVyc29uYWwgaW5mb3JtYXRpb24pIC0tPlxuXFxgXFxgXFxgXG5BdG9tOiAke2F0b20uZ2V0VmVyc2lvbigpfVxuT1M6ICR7cHJvY2Vzcy5wbGF0Zm9ybX1cblJlbGVhc2VkOiAke2F0b20uaXNSZWxlYXNlZFZlcnNpb24oKX1cbklERS1IYXNrZWxsLUNhYmFsOiAke1xuICAgICAgICAgICAgICAgIGF0b20ucGFja2FnZXMuZ2V0TG9hZGVkUGFja2FnZSgnaWRlLWhhc2tlbGwtY2FiYWwnKSEubWV0YWRhdGFcbiAgICAgICAgICAgICAgICAgIC52ZXJzaW9uXG4gICAgICAgICAgICAgIH1cbklERS1IYXNrZWxsOiAke2F0b20ucGFja2FnZXMuZ2V0TG9hZGVkUGFja2FnZSgnaWRlLWhhc2tlbGwnKSEubWV0YWRhdGEudmVyc2lvbn1cbkVycm9yIE1lc3NhZ2U6ICR7ZXJyb3IubWVzc2FnZX1cbkVycm9yIFN0YWNrOlxuJHtlcnJvci5zdGFja31cbkNhYmFsIG91dHB1dCAoaWYgYW55KTpcbiR7c3RkZXJyLnRvU3RyaW5nKCl9XG5QQVRIOiAke3NwYXduT3B0cy5lbnYuUEFUSH1cblN5c3RlbSBQQVRIOiAke3Byb2Nlc3MuZW52LlBBVEh9XG5cXGBcXGBcXGBcbmBcbiAgICAgICAgICAgICAgY29uc3QgcmVwb3J0VXJsID1cbiAgICAgICAgICAgICAgICAnaHR0cHM6Ly9naXRodWIuY29tL2F0b20taGFza2VsbC9pZGUtaGFza2VsbC1jYWJhbC9pc3N1ZXMvbmV3JyArXG4gICAgICAgICAgICAgICAgYD90aXRsZT0ke2VuY29kZVVSSUNvbXBvbmVudCh0aXRsZSl9JmJvZHk9JHtlbmNvZGVVUklDb21wb25lbnQoXG4gICAgICAgICAgICAgICAgICBib2R5LFxuICAgICAgICAgICAgICAgICl9YFxuICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcKC9nLCAnJTI4JylcbiAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cXCkvZywgJyUyOScpXG4gICAgICAgICAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRFcnJvcih0aXRsZSwge1xuICAgICAgICAgICAgICAgIGRpc21pc3NhYmxlOiB0cnVlLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOlxuICAgICAgICAgICAgICAgICAgJ0lERS1IYXNrZWxsLUNhYmFsIGVuY291bnRlcmVkIHRoZSBlcnJvciBhYm92ZSB3aGlsZSAnICtcbiAgICAgICAgICAgICAgICAgICd0cnlpbmcgdG8gcXVlcnkgY2FiYWwtaW5zdGFsbCB2ZXJzaW9uLiBBc3N1bWluZyAnICtcbiAgICAgICAgICAgICAgICAgIFwiY2FiYWwtaW5zdGFsbCA8IDIuNC4wLjAuIElmIHlvdSdyZSByZWFzb25hYmx5IGNlcnRhaW4gdGhpcyBpcyBcIiArXG4gICAgICAgICAgICAgICAgICAnYW4gaXNzdWUgd2l0aCBJREUtSGFza2VsbC1DYWJhbCwgYW5kIG5vdCB3aXRoIHlvdXIgJyArXG4gICAgICAgICAgICAgICAgICBgc2V0dXAsIHBsZWFzZSBbZmlsZSBhIGJ1ZyByZXBvcnRdKCR7cmVwb3J0VXJsfSkuYCxcbiAgICAgICAgICAgICAgICBkZXRhaWw6IGVycm9yLm1lc3NhZ2UsXG4gICAgICAgICAgICAgICAgc3RhY2s6IG5ldyBFcnJvcigpLnN0YWNrLFxuICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKVxuICAgICAgICAgICAgICByZXNvbHZlKHsgbWFqb3I6IDAsIG1pbm9yOiAwIH0pXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBjb25zdCB2ZXJzaW9ucmF3ID0gc3Rkb3V0XG4gICAgICAgICAgICAgICAgLnNwbGl0KCcuJylcbiAgICAgICAgICAgICAgICAuc2xpY2UoMCwgMilcbiAgICAgICAgICAgICAgICAubWFwKCh4KSA9PiBwYXJzZUludCh4LCAxMCkpXG4gICAgICAgICAgICAgIGNvbnN0IHZlcnNpb24gPSB7IG1ham9yOiB2ZXJzaW9ucmF3WzBdLCBtaW5vcjogdmVyc2lvbnJhd1sxXSB9XG4gICAgICAgICAgICAgIENhYmFsQmFzZS5jYWJhbFZlcnNpb25NYXAuc2V0KHNwYXduT3B0c1N0ciwgdmVyc2lvbilcbiAgICAgICAgICAgICAgcmVzb2x2ZSh2ZXJzaW9uKVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0sXG4gICAgICAgIClcbiAgICAgIH0pXG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRDYWJhbE9wdHMoKTogR0hDVmVyUHJvcHMge1xuICBjb25zdCB2ZXJzID0gYXRvbS5jb25maWcuZ2V0KCdpZGUtaGFza2VsbC1jYWJhbC5jYWJhbC5hY3RpdmVHaGNWZXJzaW9uJylcbiAgY29uc3QgW21haiwgbWluXSA9IHZlcnMuc3BsaXQoJy4nKVxuICBjb25zdCBrZXkgPSBgaWRlLWhhc2tlbGwtY2FiYWwuY2FiYWwuZ2hjJHttYWp9JHtcbiAgICBtaW4ubGVuZ3RoID09PSAxID8gYDAke21pbn1gIDogbWluXG4gIH1gXG4gIHJldHVybiBhdG9tLmNvbmZpZy5nZXQoa2V5KVxufVxuIl19