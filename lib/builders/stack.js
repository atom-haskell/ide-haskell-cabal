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
            return this.runCabal(['--no-run-tests', '--no-run-benchmarks']);
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
            return this.runCabal();
        });
    }
    deps() {
        return __awaiter(this, void 0, void 0, function* () {
            this.cabalArgs.push('build', '--only-dependencies');
            this.component();
            this.cabalArgs.push(...(atom.config.get('ide-haskell-cabal.stack.depsArguments') || []));
            return this.runCabal();
        });
    }
    component() {
        let comp = (this.opts.target.target && this.opts.target.target.target)
            || this.opts.target.component;
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
                return this.runCabal();
            }
        });
    }
}
exports.Builder = Builder;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvYnVpbGRlcnMvc3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUFBLGlDQUE4QztBQUU5QyxhQUFxQixTQUFRLGtCQUFXO0lBQ3RDLFlBQVksSUFBYztRQUN4QixLQUFLLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFBO1FBQ3BCLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMseUNBQXlDLENBQUMsSUFBSSxFQUFFLENBQUE7SUFDbkYsQ0FBQztJQUVZLEtBQUs7O1lBQ2hCLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFBO1lBQzVCLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQTtZQUNoQixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsd0NBQXdDLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFBO1lBQ3pGLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsZ0JBQWdCLEVBQUUscUJBQXFCLENBQUMsQ0FBQyxDQUFBO1FBQ2pFLENBQUM7S0FBQTtJQUNZLElBQUk7O1lBQ2YsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUE7WUFDM0IsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFBO1lBQ2hCLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyx1Q0FBdUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUE7WUFDeEYsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQTtRQUN4QixDQUFDO0tBQUE7SUFDWSxLQUFLOztZQUNoQixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQTtZQUM1QixJQUFJLENBQUMsU0FBUyxFQUFFLENBQUE7WUFDaEIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLHdDQUF3QyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQTtZQUN6RixNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFBO1FBQ3hCLENBQUM7S0FBQTtJQUNZLEtBQUs7O1lBQ2hCLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFBO1lBQzVCLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQTtZQUNoQixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsd0NBQXdDLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFBO1lBQ3pGLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUE7UUFDeEIsQ0FBQztLQUFBO0lBQ1ksSUFBSTs7WUFDZixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUscUJBQXFCLENBQUMsQ0FBQTtZQUNuRCxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUE7WUFDaEIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLHVDQUF1QyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQTtZQUN4RixNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFBO1FBQ3hCLENBQUM7S0FBQTtJQUVPLFNBQVM7UUFDZixJQUFJLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDO2VBQ3pELElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQTtRQUN2QyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ1QsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQUMsSUFBSSxHQUFHLEtBQUssQ0FBQTtZQUFDLENBQUM7WUFDN0MsSUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxJQUFJLElBQUksRUFBRSxDQUFBO1lBQzVDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFBO1FBQzNCLENBQUM7SUFDSCxDQUFDO0lBRWEsUUFBUTs7WUFDcEIsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFBO1lBQzNDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsR0FBRyxPQUFPLENBQUE7WUFDakMsTUFBTSxHQUFHLEdBQUcsTUFBTSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsZ0JBQWdCLEVBQUUscUJBQXFCLENBQUMsQ0FBQyxDQUFBO1lBQzFFLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsR0FBRyxXQUFXLENBQUE7WUFDckMsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLFFBQVEsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUN2QixNQUFNLENBQUMsR0FBRyxDQUFBO1lBQ1osQ0FBQztZQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNOLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUE7WUFDeEIsQ0FBQztRQUNILENBQUM7S0FBQTtDQUNGO0FBMURELDBCQTBEQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEN0b3JPcHRzLCBCdWlsZGVyQmFzZSB9IGZyb20gJy4vYmFzZSdcblxuZXhwb3J0IGNsYXNzIEJ1aWxkZXIgZXh0ZW5kcyBCdWlsZGVyQmFzZSB7XG4gIGNvbnN0cnVjdG9yKG9wdHM6IEN0b3JPcHRzKSB7XG4gICAgc3VwZXIoJ3N0YWNrJywgb3B0cylcbiAgICB0aGlzLmNhYmFsQXJncyA9IGF0b20uY29uZmlnLmdldCgnaWRlLWhhc2tlbGwtY2FiYWwuc3RhY2suZ2xvYmFsQXJndW1lbnRzJykgfHwgW11cbiAgfVxuXG4gIHB1YmxpYyBhc3luYyBidWlsZCgpIHtcbiAgICB0aGlzLmNhYmFsQXJncy5wdXNoKCdidWlsZCcpXG4gICAgdGhpcy5jb21wb25lbnQoKVxuICAgIHRoaXMuY2FiYWxBcmdzLnB1c2goLi4uKGF0b20uY29uZmlnLmdldCgnaWRlLWhhc2tlbGwtY2FiYWwuc3RhY2suYnVpbGRBcmd1bWVudHMnKSB8fCBbXSkpXG4gICAgcmV0dXJuIHRoaXMucnVuQ2FiYWwoWyctLW5vLXJ1bi10ZXN0cycsICctLW5vLXJ1bi1iZW5jaG1hcmtzJ10pXG4gIH1cbiAgcHVibGljIGFzeW5jIHRlc3QoKSB7XG4gICAgdGhpcy5jYWJhbEFyZ3MucHVzaCgndGVzdCcpXG4gICAgdGhpcy5jb21wb25lbnQoKVxuICAgIHRoaXMuY2FiYWxBcmdzLnB1c2goLi4uKGF0b20uY29uZmlnLmdldCgnaWRlLWhhc2tlbGwtY2FiYWwuc3RhY2sudGVzdEFyZ3VtZW50cycpIHx8IFtdKSlcbiAgICByZXR1cm4gdGhpcy5ydW5CdWlsZCgpXG4gIH1cbiAgcHVibGljIGFzeW5jIGJlbmNoKCkge1xuICAgIHRoaXMuY2FiYWxBcmdzLnB1c2goJ2JlbmNoJylcbiAgICB0aGlzLmNvbXBvbmVudCgpXG4gICAgdGhpcy5jYWJhbEFyZ3MucHVzaCguLi4oYXRvbS5jb25maWcuZ2V0KCdpZGUtaGFza2VsbC1jYWJhbC5zdGFjay5iZW5jaEFyZ3VtZW50cycpIHx8IFtdKSlcbiAgICByZXR1cm4gdGhpcy5ydW5CdWlsZCgpXG4gIH1cbiAgcHVibGljIGFzeW5jIGNsZWFuKCkge1xuICAgIHRoaXMuY2FiYWxBcmdzLnB1c2goJ2NsZWFuJylcbiAgICB0aGlzLmNvbXBvbmVudCgpXG4gICAgdGhpcy5jYWJhbEFyZ3MucHVzaCguLi4oYXRvbS5jb25maWcuZ2V0KCdpZGUtaGFza2VsbC1jYWJhbC5zdGFjay5jbGVhbkFyZ3VtZW50cycpIHx8IFtdKSlcbiAgICByZXR1cm4gdGhpcy5ydW5DYWJhbCgpXG4gIH1cbiAgcHVibGljIGFzeW5jIGRlcHMoKSB7XG4gICAgdGhpcy5jYWJhbEFyZ3MucHVzaCgnYnVpbGQnLCAnLS1vbmx5LWRlcGVuZGVuY2llcycpXG4gICAgdGhpcy5jb21wb25lbnQoKVxuICAgIHRoaXMuY2FiYWxBcmdzLnB1c2goLi4uKGF0b20uY29uZmlnLmdldCgnaWRlLWhhc2tlbGwtY2FiYWwuc3RhY2suZGVwc0FyZ3VtZW50cycpIHx8IFtdKSlcbiAgICByZXR1cm4gdGhpcy5ydW5DYWJhbCgpXG4gIH1cblxuICBwcml2YXRlIGNvbXBvbmVudCgpIHtcbiAgICBsZXQgY29tcCA9ICh0aGlzLm9wdHMudGFyZ2V0LnRhcmdldCAmJiB0aGlzLm9wdHMudGFyZ2V0LnRhcmdldC50YXJnZXQpXG4gICAgICAgICAgICAgIHx8IHRoaXMub3B0cy50YXJnZXQuY29tcG9uZW50XG4gICAgaWYgKGNvbXApIHtcbiAgICAgIGlmIChjb21wLnN0YXJ0c1dpdGgoJ2xpYjonKSkgeyBjb21wID0gJ2xpYicgfVxuICAgICAgY29tcCA9IGAke3RoaXMub3B0cy50YXJnZXQucHJvamVjdH06JHtjb21wfWBcbiAgICAgIHRoaXMuY2FiYWxBcmdzLnB1c2goY29tcClcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHJ1bkJ1aWxkKCkge1xuICAgIGNvbnN0IG9sZFNldmVyaXR5ID0gdGhpcy5vcHRzLm9wdHMuc2V2ZXJpdHlcbiAgICB0aGlzLm9wdHMub3B0cy5zZXZlcml0eSA9ICdidWlsZCdcbiAgICBjb25zdCByZXMgPSBhd2FpdCB0aGlzLnJ1bkNhYmFsKFsnLS1uby1ydW4tdGVzdHMnLCAnLS1uby1ydW4tYmVuY2htYXJrcyddKVxuICAgIHRoaXMub3B0cy5vcHRzLnNldmVyaXR5ID0gb2xkU2V2ZXJpdHlcbiAgICBpZiAocmVzLmV4aXRDb2RlICE9PSAwKSB7XG4gICAgICByZXR1cm4gcmVzXG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0aGlzLnJ1bkNhYmFsKClcbiAgICB9XG4gIH1cbn1cbiJdfQ==