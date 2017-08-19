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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvYnVpbGRlcnMvc3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUFBLGlDQUE4QztBQUU5QyxhQUFxQixTQUFRLGtCQUFXO0lBQ3RDLFlBQVksSUFBYztRQUN4QixLQUFLLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFBO1FBQ3BCLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMseUNBQXlDLENBQUMsSUFBSSxFQUFFLENBQUE7SUFDbkYsQ0FBQztJQUVZLEtBQUs7O1lBQ2hCLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFBO1lBQzVCLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQTtZQUNoQixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsd0NBQXdDLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFBO1lBQ3pGLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUE7UUFDdEIsQ0FBQztLQUFBO0lBQ1ksSUFBSTs7WUFDZixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQTtZQUMzQixJQUFJLENBQUMsU0FBUyxFQUFFLENBQUE7WUFDaEIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLHVDQUF1QyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQTtZQUN4RixNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFBO1FBQ3hCLENBQUM7S0FBQTtJQUNZLEtBQUs7O1lBQ2hCLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFBO1lBQzVCLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQTtZQUNoQixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsd0NBQXdDLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFBO1lBQ3pGLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUE7UUFDeEIsQ0FBQztLQUFBO0lBQ1ksS0FBSzs7WUFDaEIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUE7WUFDNUIsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFBO1lBQ2hCLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyx3Q0FBd0MsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUE7WUFDekYsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQTtRQUN0QixDQUFDO0tBQUE7SUFDWSxJQUFJOztZQUNmLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxxQkFBcUIsQ0FBQyxDQUFBO1lBQ25ELElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQTtZQUNoQixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsdUNBQXVDLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFBO1lBQ3hGLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUE7UUFDdEIsQ0FBQztLQUFBO0lBRU8sU0FBUztRQUNmLElBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFBO1FBQ3BFLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDVCxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFBQyxJQUFJLEdBQUcsS0FBSyxDQUFBO1lBQUMsQ0FBQztZQUM3QyxJQUFJLEdBQUcsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLElBQUksSUFBSSxFQUFFLENBQUE7WUFDNUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUE7UUFDM0IsQ0FBQztJQUNILENBQUM7SUFFYSxRQUFROztZQUNwQixNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUE7WUFDM0MsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxHQUFHLE9BQU8sQ0FBQTtZQUNqQyxNQUFNLEdBQUcsR0FBRyxNQUFNLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxnQkFBZ0IsRUFBRSxxQkFBcUIsQ0FBQyxDQUFDLENBQUE7WUFDMUUsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxHQUFHLFdBQVcsQ0FBQTtZQUNyQyxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsUUFBUSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3ZCLE1BQU0sQ0FBQyxHQUFHLENBQUE7WUFDWixDQUFDO1lBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ04sTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQTtZQUN0QixDQUFDO1FBQ0gsQ0FBQztLQUFBO0lBRWEsTUFBTTs7WUFDbEIsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQTtRQUN4QixDQUFDO0tBQUE7Q0FDRjtBQTdERCwwQkE2REMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDdG9yT3B0cywgQnVpbGRlckJhc2UgfSBmcm9tICcuL2Jhc2UnXG5cbmV4cG9ydCBjbGFzcyBCdWlsZGVyIGV4dGVuZHMgQnVpbGRlckJhc2Uge1xuICBjb25zdHJ1Y3RvcihvcHRzOiBDdG9yT3B0cykge1xuICAgIHN1cGVyKCdzdGFjaycsIG9wdHMpXG4gICAgdGhpcy5jYWJhbEFyZ3MgPSBhdG9tLmNvbmZpZy5nZXQoJ2lkZS1oYXNrZWxsLWNhYmFsLnN0YWNrLmdsb2JhbEFyZ3VtZW50cycpIHx8IFtdXG4gIH1cblxuICBwdWJsaWMgYXN5bmMgYnVpbGQoKSB7XG4gICAgdGhpcy5jYWJhbEFyZ3MucHVzaCgnYnVpbGQnKVxuICAgIHRoaXMuY29tcG9uZW50KClcbiAgICB0aGlzLmNhYmFsQXJncy5wdXNoKC4uLihhdG9tLmNvbmZpZy5nZXQoJ2lkZS1oYXNrZWxsLWNhYmFsLnN0YWNrLmJ1aWxkQXJndW1lbnRzJykgfHwgW10pKVxuICAgIHJldHVybiB0aGlzLmNvbW1vbigpXG4gIH1cbiAgcHVibGljIGFzeW5jIHRlc3QoKSB7XG4gICAgdGhpcy5jYWJhbEFyZ3MucHVzaCgndGVzdCcpXG4gICAgdGhpcy5jb21wb25lbnQoKVxuICAgIHRoaXMuY2FiYWxBcmdzLnB1c2goLi4uKGF0b20uY29uZmlnLmdldCgnaWRlLWhhc2tlbGwtY2FiYWwuc3RhY2sudGVzdEFyZ3VtZW50cycpIHx8IFtdKSlcbiAgICByZXR1cm4gdGhpcy5ydW5CdWlsZCgpXG4gIH1cbiAgcHVibGljIGFzeW5jIGJlbmNoKCkge1xuICAgIHRoaXMuY2FiYWxBcmdzLnB1c2goJ2JlbmNoJylcbiAgICB0aGlzLmNvbXBvbmVudCgpXG4gICAgdGhpcy5jYWJhbEFyZ3MucHVzaCguLi4oYXRvbS5jb25maWcuZ2V0KCdpZGUtaGFza2VsbC1jYWJhbC5zdGFjay5iZW5jaEFyZ3VtZW50cycpIHx8IFtdKSlcbiAgICByZXR1cm4gdGhpcy5ydW5CdWlsZCgpXG4gIH1cbiAgcHVibGljIGFzeW5jIGNsZWFuKCkge1xuICAgIHRoaXMuY2FiYWxBcmdzLnB1c2goJ2NsZWFuJylcbiAgICB0aGlzLmNvbXBvbmVudCgpXG4gICAgdGhpcy5jYWJhbEFyZ3MucHVzaCguLi4oYXRvbS5jb25maWcuZ2V0KCdpZGUtaGFza2VsbC1jYWJhbC5zdGFjay5jbGVhbkFyZ3VtZW50cycpIHx8IFtdKSlcbiAgICByZXR1cm4gdGhpcy5jb21tb24oKVxuICB9XG4gIHB1YmxpYyBhc3luYyBkZXBzKCkge1xuICAgIHRoaXMuY2FiYWxBcmdzLnB1c2goJ2J1aWxkJywgJy0tb25seS1kZXBlbmRlbmNpZXMnKVxuICAgIHRoaXMuY29tcG9uZW50KClcbiAgICB0aGlzLmNhYmFsQXJncy5wdXNoKC4uLihhdG9tLmNvbmZpZy5nZXQoJ2lkZS1oYXNrZWxsLWNhYmFsLnN0YWNrLmRlcHNBcmd1bWVudHMnKSB8fCBbXSkpXG4gICAgcmV0dXJuIHRoaXMuY29tbW9uKClcbiAgfVxuXG4gIHByaXZhdGUgY29tcG9uZW50KCkge1xuICAgIGxldCBjb21wID0gdGhpcy5vcHRzLnRhcmdldC50YXJnZXQgJiYgdGhpcy5vcHRzLnRhcmdldC50YXJnZXQudGFyZ2V0XG4gICAgaWYgKGNvbXApIHtcbiAgICAgIGlmIChjb21wLnN0YXJ0c1dpdGgoJ2xpYjonKSkgeyBjb21wID0gJ2xpYicgfVxuICAgICAgY29tcCA9IGAke3RoaXMub3B0cy50YXJnZXQucHJvamVjdH06JHtjb21wfWBcbiAgICAgIHRoaXMuY2FiYWxBcmdzLnB1c2goY29tcClcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHJ1bkJ1aWxkKCkge1xuICAgIGNvbnN0IG9sZFNldmVyaXR5ID0gdGhpcy5vcHRzLm9wdHMuc2V2ZXJpdHlcbiAgICB0aGlzLm9wdHMub3B0cy5zZXZlcml0eSA9ICdidWlsZCdcbiAgICBjb25zdCByZXMgPSBhd2FpdCB0aGlzLnJ1bkNhYmFsKFsnLS1uby1ydW4tdGVzdHMnLCAnLS1uby1ydW4tYmVuY2htYXJrcyddKVxuICAgIHRoaXMub3B0cy5vcHRzLnNldmVyaXR5ID0gb2xkU2V2ZXJpdHlcbiAgICBpZiAocmVzLmV4aXRDb2RlICE9PSAwKSB7XG4gICAgICByZXR1cm4gcmVzXG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0aGlzLmNvbW1vbigpXG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBjb21tb24oKSB7XG4gICAgcmV0dXJuIHRoaXMucnVuQ2FiYWwoKVxuICB9XG59XG4iXX0=