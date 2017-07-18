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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvYnVpbGRlcnMvc3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUFBLGlDQUE0QztBQUU1QyxhQUFxQixTQUFRLGtCQUFXO0lBQ3RDLFlBQWEsSUFBYztRQUN6QixLQUFLLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFBO1FBQ3BCLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMseUNBQXlDLENBQUMsSUFBSSxFQUFFLENBQUE7SUFDbkYsQ0FBQztJQUVlLEtBQUs7O1lBQ25CLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFBO1lBQzVCLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQTtZQUNoQixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsd0NBQXdDLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFBO1lBQ3pGLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUE7UUFDdEIsQ0FBQztLQUFBO0lBQ2UsSUFBSTs7WUFDbEIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUE7WUFDM0IsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFBO1lBQ2hCLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyx1Q0FBdUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUE7WUFDeEYsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQTtRQUN4QixDQUFDO0tBQUE7SUFDZSxLQUFLOztZQUNuQixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQTtZQUM1QixJQUFJLENBQUMsU0FBUyxFQUFFLENBQUE7WUFDaEIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLHdDQUF3QyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQTtZQUN6RixNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFBO1FBQ3hCLENBQUM7S0FBQTtJQUNlLEtBQUs7O1lBQ25CLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFBO1lBQzVCLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQTtZQUNoQixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsd0NBQXdDLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFBO1lBQ3pGLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUE7UUFDdEIsQ0FBQztLQUFBO0lBQ2UsSUFBSTs7WUFDbEIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLHFCQUFxQixDQUFDLENBQUE7WUFDbkQsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFBO1lBQ2hCLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyx1Q0FBdUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUE7WUFDeEYsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQTtRQUN0QixDQUFDO0tBQUE7SUFFTyxTQUFTO1FBQ2YsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUE7UUFDcEUsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUNULEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUFDLElBQUksR0FBRyxLQUFLLENBQUE7WUFBQSxDQUFDO1lBQzVDLElBQUksR0FBRyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sSUFBSSxJQUFJLEVBQUUsQ0FBQTtZQUM1QyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQTtRQUMzQixDQUFDO0lBQ0gsQ0FBQztJQUVhLFFBQVE7O1lBQ3BCLE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQTtZQUMzQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEdBQUcsT0FBTyxDQUFBO1lBQ2pDLE1BQU0sR0FBRyxHQUFHLE1BQU0sSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLGdCQUFnQixFQUFFLHFCQUFxQixDQUFDLENBQUMsQ0FBQTtZQUMxRSxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEdBQUcsV0FBVyxDQUFBO1lBQ3JDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxRQUFRLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDdkIsTUFBTSxDQUFDLEdBQUcsQ0FBQTtZQUNaLENBQUM7WUFBQyxJQUFJLENBQUMsQ0FBQztnQkFDTixNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFBO1lBQ3RCLENBQUM7UUFDSCxDQUFDO0tBQUE7SUFFYSxNQUFNOztZQUNsQixNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFBO1FBQ3hCLENBQUM7S0FBQTtDQUNGO0FBN0RELDBCQTZEQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7Q3Rvck9wdHMsIEJ1aWxkZXJCYXNlfSBmcm9tICcuL2Jhc2UnXG5cbmV4cG9ydCBjbGFzcyBCdWlsZGVyIGV4dGVuZHMgQnVpbGRlckJhc2Uge1xuICBjb25zdHJ1Y3RvciAob3B0czogQ3Rvck9wdHMpIHtcbiAgICBzdXBlcignc3RhY2snLCBvcHRzKVxuICAgIHRoaXMuY2FiYWxBcmdzID0gYXRvbS5jb25maWcuZ2V0KCdpZGUtaGFza2VsbC1jYWJhbC5zdGFjay5nbG9iYWxBcmd1bWVudHMnKSB8fCBbXVxuICB9XG5cbiAgcHJvdGVjdGVkIGFzeW5jIGJ1aWxkICgpIHtcbiAgICB0aGlzLmNhYmFsQXJncy5wdXNoKCdidWlsZCcpXG4gICAgdGhpcy5jb21wb25lbnQoKVxuICAgIHRoaXMuY2FiYWxBcmdzLnB1c2goLi4uKGF0b20uY29uZmlnLmdldCgnaWRlLWhhc2tlbGwtY2FiYWwuc3RhY2suYnVpbGRBcmd1bWVudHMnKSB8fCBbXSkpXG4gICAgcmV0dXJuIHRoaXMuY29tbW9uKClcbiAgfVxuICBwcm90ZWN0ZWQgYXN5bmMgdGVzdCAoKSB7XG4gICAgdGhpcy5jYWJhbEFyZ3MucHVzaCgndGVzdCcpXG4gICAgdGhpcy5jb21wb25lbnQoKVxuICAgIHRoaXMuY2FiYWxBcmdzLnB1c2goLi4uKGF0b20uY29uZmlnLmdldCgnaWRlLWhhc2tlbGwtY2FiYWwuc3RhY2sudGVzdEFyZ3VtZW50cycpIHx8IFtdKSlcbiAgICByZXR1cm4gdGhpcy5ydW5CdWlsZCgpXG4gIH1cbiAgcHJvdGVjdGVkIGFzeW5jIGJlbmNoICgpIHtcbiAgICB0aGlzLmNhYmFsQXJncy5wdXNoKCdiZW5jaCcpXG4gICAgdGhpcy5jb21wb25lbnQoKVxuICAgIHRoaXMuY2FiYWxBcmdzLnB1c2goLi4uKGF0b20uY29uZmlnLmdldCgnaWRlLWhhc2tlbGwtY2FiYWwuc3RhY2suYmVuY2hBcmd1bWVudHMnKSB8fCBbXSkpXG4gICAgcmV0dXJuIHRoaXMucnVuQnVpbGQoKVxuICB9XG4gIHByb3RlY3RlZCBhc3luYyBjbGVhbiAoKSB7XG4gICAgdGhpcy5jYWJhbEFyZ3MucHVzaCgnY2xlYW4nKVxuICAgIHRoaXMuY29tcG9uZW50KClcbiAgICB0aGlzLmNhYmFsQXJncy5wdXNoKC4uLihhdG9tLmNvbmZpZy5nZXQoJ2lkZS1oYXNrZWxsLWNhYmFsLnN0YWNrLmNsZWFuQXJndW1lbnRzJykgfHwgW10pKVxuICAgIHJldHVybiB0aGlzLmNvbW1vbigpXG4gIH1cbiAgcHJvdGVjdGVkIGFzeW5jIGRlcHMgKCkge1xuICAgIHRoaXMuY2FiYWxBcmdzLnB1c2goJ2J1aWxkJywgJy0tb25seS1kZXBlbmRlbmNpZXMnKVxuICAgIHRoaXMuY29tcG9uZW50KClcbiAgICB0aGlzLmNhYmFsQXJncy5wdXNoKC4uLihhdG9tLmNvbmZpZy5nZXQoJ2lkZS1oYXNrZWxsLWNhYmFsLnN0YWNrLmRlcHNBcmd1bWVudHMnKSB8fCBbXSkpXG4gICAgcmV0dXJuIHRoaXMuY29tbW9uKClcbiAgfVxuXG4gIHByaXZhdGUgY29tcG9uZW50ICgpIHtcbiAgICBsZXQgY29tcCA9IHRoaXMub3B0cy50YXJnZXQudGFyZ2V0ICYmIHRoaXMub3B0cy50YXJnZXQudGFyZ2V0LnRhcmdldFxuICAgIGlmIChjb21wKSB7XG4gICAgICBpZiAoY29tcC5zdGFydHNXaXRoKCdsaWI6JykpIHsgY29tcCA9ICdsaWInfVxuICAgICAgY29tcCA9IGAke3RoaXMub3B0cy50YXJnZXQucHJvamVjdH06JHtjb21wfWBcbiAgICAgIHRoaXMuY2FiYWxBcmdzLnB1c2goY29tcClcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHJ1bkJ1aWxkICgpIHtcbiAgICBjb25zdCBvbGRTZXZlcml0eSA9IHRoaXMub3B0cy5vcHRzLnNldmVyaXR5XG4gICAgdGhpcy5vcHRzLm9wdHMuc2V2ZXJpdHkgPSAnYnVpbGQnXG4gICAgY29uc3QgcmVzID0gYXdhaXQgdGhpcy5ydW5DYWJhbChbJy0tbm8tcnVuLXRlc3RzJywgJy0tbm8tcnVuLWJlbmNobWFya3MnXSlcbiAgICB0aGlzLm9wdHMub3B0cy5zZXZlcml0eSA9IG9sZFNldmVyaXR5XG4gICAgaWYgKHJlcy5leGl0Q29kZSAhPT0gMCkge1xuICAgICAgcmV0dXJuIHJlc1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdGhpcy5jb21tb24oKVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgY29tbW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5ydW5DYWJhbCgpXG4gIH1cbn1cbiJdfQ==