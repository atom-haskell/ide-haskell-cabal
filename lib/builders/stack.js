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
class Builder extends base_1.BuilderBase {
    constructor(opts) {
        super('stack', opts);
        this.cabalArgs = atom.config.get('ide-haskell-cabal.stack.globalArguments') || [];
    }
    build() {
        return __awaiter(this, void 0, void 0, function* () {
            this.cabalArgs.push('build');
            this.component();
            this.cabalArgs.push(...(atom.config.get('ide-haskell-cabal.stack.buildArguments') || []));
            return this.common();
        });
    }
    test() {
        return __awaiter(this, void 0, void 0, function* () {
            this.cabalArgs.push('test');
            this.component();
            this.cabalArgs.push(...(atom.config.get('ide-haskell-cabal.stack.testArguments') || []));
            return this.runBuild();
        });
    }
    bench() {
        return __awaiter(this, void 0, void 0, function* () {
            this.cabalArgs.push('bench');
            this.component();
            this.cabalArgs.push(...(atom.config.get('ide-haskell-cabal.stack.benchArguments') || []));
            return this.runBuild();
        });
    }
    clean() {
        return __awaiter(this, void 0, void 0, function* () {
            this.cabalArgs.push('clean');
            this.component();
            this.cabalArgs.push(...(atom.config.get('ide-haskell-cabal.stack.cleanArguments') || []));
            return this.common();
        });
    }
    deps() {
        return __awaiter(this, void 0, void 0, function* () {
            this.cabalArgs.push('build', '--only-dependencies');
            this.component();
            this.cabalArgs.push(...(atom.config.get('ide-haskell-cabal.stack.depsArguments') || []));
            return this.common();
        });
    }
    component() {
        let comp = this.opts.target.target && this.opts.target.target.target;
        if (comp) {
            if (comp.startsWith('lib:')) {
                comp = 'lib';
            }
            comp = `${this.opts.target.project}:${comp}`;
            this.cabalArgs.push(comp);
        }
    }
    runBuild() {
        return __awaiter(this, void 0, void 0, function* () {
            const oldSeverity = this.opts.opts.severity;
            this.opts.opts.severity = 'build';
            const res = yield this.runCabal(['--no-run-tests', '--no-run-benchmarks']);
            this.opts.opts.severity = oldSeverity;
            if (res.exitCode !== 0) {
                return res;
            }
            else {
                return this.common();
            }
        });
    }
    common() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.runCabal();
        });
    }
}
exports.Builder = Builder;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvYnVpbGRlcnMvc3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUFBLGlDQUE0QztBQUU1QyxhQUFxQixTQUFRLGtCQUFXO0lBQ3RDLFlBQWEsSUFBYztRQUN6QixLQUFLLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFBO1FBQ3BCLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMseUNBQXlDLENBQUMsSUFBSSxFQUFFLENBQUE7SUFDbkYsQ0FBQztJQUVZLEtBQUs7O1lBQ2hCLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFBO1lBQzVCLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQTtZQUNoQixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsd0NBQXdDLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFBO1lBQ3pGLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUE7UUFDdEIsQ0FBQztLQUFBO0lBQ1ksSUFBSTs7WUFDZixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQTtZQUMzQixJQUFJLENBQUMsU0FBUyxFQUFFLENBQUE7WUFDaEIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLHVDQUF1QyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQTtZQUN4RixNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFBO1FBQ3hCLENBQUM7S0FBQTtJQUNZLEtBQUs7O1lBQ2hCLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFBO1lBQzVCLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQTtZQUNoQixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsd0NBQXdDLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFBO1lBQ3pGLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUE7UUFDeEIsQ0FBQztLQUFBO0lBQ1ksS0FBSzs7WUFDaEIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUE7WUFDNUIsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFBO1lBQ2hCLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyx3Q0FBd0MsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUE7WUFDekYsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQTtRQUN0QixDQUFDO0tBQUE7SUFDWSxJQUFJOztZQUNmLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxxQkFBcUIsQ0FBQyxDQUFBO1lBQ25ELElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQTtZQUNoQixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsdUNBQXVDLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFBO1lBQ3hGLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUE7UUFDdEIsQ0FBQztLQUFBO0lBRU8sU0FBUztRQUNmLElBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFBO1FBQ3BFLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDVCxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFBQyxJQUFJLEdBQUcsS0FBSyxDQUFBO1lBQUEsQ0FBQztZQUM1QyxJQUFJLEdBQUcsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLElBQUksSUFBSSxFQUFFLENBQUE7WUFDNUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUE7UUFDM0IsQ0FBQztJQUNILENBQUM7SUFFYSxRQUFROztZQUNwQixNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUE7WUFDM0MsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxHQUFHLE9BQU8sQ0FBQTtZQUNqQyxNQUFNLEdBQUcsR0FBRyxNQUFNLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxnQkFBZ0IsRUFBRSxxQkFBcUIsQ0FBQyxDQUFDLENBQUE7WUFDMUUsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxHQUFHLFdBQVcsQ0FBQTtZQUNyQyxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsUUFBUSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3ZCLE1BQU0sQ0FBQyxHQUFHLENBQUE7WUFDWixDQUFDO1lBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ04sTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQTtZQUN0QixDQUFDO1FBQ0gsQ0FBQztLQUFBO0lBRWEsTUFBTTs7WUFDbEIsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQTtRQUN4QixDQUFDO0tBQUE7Q0FDRjtBQTdERCwwQkE2REMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge0N0b3JPcHRzLCBCdWlsZGVyQmFzZX0gZnJvbSAnLi9iYXNlJ1xuXG5leHBvcnQgY2xhc3MgQnVpbGRlciBleHRlbmRzIEJ1aWxkZXJCYXNlIHtcbiAgY29uc3RydWN0b3IgKG9wdHM6IEN0b3JPcHRzKSB7XG4gICAgc3VwZXIoJ3N0YWNrJywgb3B0cylcbiAgICB0aGlzLmNhYmFsQXJncyA9IGF0b20uY29uZmlnLmdldCgnaWRlLWhhc2tlbGwtY2FiYWwuc3RhY2suZ2xvYmFsQXJndW1lbnRzJykgfHwgW11cbiAgfVxuXG4gIHB1YmxpYyBhc3luYyBidWlsZCAoKSB7XG4gICAgdGhpcy5jYWJhbEFyZ3MucHVzaCgnYnVpbGQnKVxuICAgIHRoaXMuY29tcG9uZW50KClcbiAgICB0aGlzLmNhYmFsQXJncy5wdXNoKC4uLihhdG9tLmNvbmZpZy5nZXQoJ2lkZS1oYXNrZWxsLWNhYmFsLnN0YWNrLmJ1aWxkQXJndW1lbnRzJykgfHwgW10pKVxuICAgIHJldHVybiB0aGlzLmNvbW1vbigpXG4gIH1cbiAgcHVibGljIGFzeW5jIHRlc3QgKCkge1xuICAgIHRoaXMuY2FiYWxBcmdzLnB1c2goJ3Rlc3QnKVxuICAgIHRoaXMuY29tcG9uZW50KClcbiAgICB0aGlzLmNhYmFsQXJncy5wdXNoKC4uLihhdG9tLmNvbmZpZy5nZXQoJ2lkZS1oYXNrZWxsLWNhYmFsLnN0YWNrLnRlc3RBcmd1bWVudHMnKSB8fCBbXSkpXG4gICAgcmV0dXJuIHRoaXMucnVuQnVpbGQoKVxuICB9XG4gIHB1YmxpYyBhc3luYyBiZW5jaCAoKSB7XG4gICAgdGhpcy5jYWJhbEFyZ3MucHVzaCgnYmVuY2gnKVxuICAgIHRoaXMuY29tcG9uZW50KClcbiAgICB0aGlzLmNhYmFsQXJncy5wdXNoKC4uLihhdG9tLmNvbmZpZy5nZXQoJ2lkZS1oYXNrZWxsLWNhYmFsLnN0YWNrLmJlbmNoQXJndW1lbnRzJykgfHwgW10pKVxuICAgIHJldHVybiB0aGlzLnJ1bkJ1aWxkKClcbiAgfVxuICBwdWJsaWMgYXN5bmMgY2xlYW4gKCkge1xuICAgIHRoaXMuY2FiYWxBcmdzLnB1c2goJ2NsZWFuJylcbiAgICB0aGlzLmNvbXBvbmVudCgpXG4gICAgdGhpcy5jYWJhbEFyZ3MucHVzaCguLi4oYXRvbS5jb25maWcuZ2V0KCdpZGUtaGFza2VsbC1jYWJhbC5zdGFjay5jbGVhbkFyZ3VtZW50cycpIHx8IFtdKSlcbiAgICByZXR1cm4gdGhpcy5jb21tb24oKVxuICB9XG4gIHB1YmxpYyBhc3luYyBkZXBzICgpIHtcbiAgICB0aGlzLmNhYmFsQXJncy5wdXNoKCdidWlsZCcsICctLW9ubHktZGVwZW5kZW5jaWVzJylcbiAgICB0aGlzLmNvbXBvbmVudCgpXG4gICAgdGhpcy5jYWJhbEFyZ3MucHVzaCguLi4oYXRvbS5jb25maWcuZ2V0KCdpZGUtaGFza2VsbC1jYWJhbC5zdGFjay5kZXBzQXJndW1lbnRzJykgfHwgW10pKVxuICAgIHJldHVybiB0aGlzLmNvbW1vbigpXG4gIH1cblxuICBwcml2YXRlIGNvbXBvbmVudCAoKSB7XG4gICAgbGV0IGNvbXAgPSB0aGlzLm9wdHMudGFyZ2V0LnRhcmdldCAmJiB0aGlzLm9wdHMudGFyZ2V0LnRhcmdldC50YXJnZXRcbiAgICBpZiAoY29tcCkge1xuICAgICAgaWYgKGNvbXAuc3RhcnRzV2l0aCgnbGliOicpKSB7IGNvbXAgPSAnbGliJ31cbiAgICAgIGNvbXAgPSBgJHt0aGlzLm9wdHMudGFyZ2V0LnByb2plY3R9OiR7Y29tcH1gXG4gICAgICB0aGlzLmNhYmFsQXJncy5wdXNoKGNvbXApXG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBydW5CdWlsZCAoKSB7XG4gICAgY29uc3Qgb2xkU2V2ZXJpdHkgPSB0aGlzLm9wdHMub3B0cy5zZXZlcml0eVxuICAgIHRoaXMub3B0cy5vcHRzLnNldmVyaXR5ID0gJ2J1aWxkJ1xuICAgIGNvbnN0IHJlcyA9IGF3YWl0IHRoaXMucnVuQ2FiYWwoWyctLW5vLXJ1bi10ZXN0cycsICctLW5vLXJ1bi1iZW5jaG1hcmtzJ10pXG4gICAgdGhpcy5vcHRzLm9wdHMuc2V2ZXJpdHkgPSBvbGRTZXZlcml0eVxuICAgIGlmIChyZXMuZXhpdENvZGUgIT09IDApIHtcbiAgICAgIHJldHVybiByZXNcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXMuY29tbW9uKClcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGNvbW1vbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMucnVuQ2FiYWwoKVxuICB9XG59XG4iXX0=