"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const base_1 = require("./base");
class Builder extends base_1.BuilderBase {
    constructor(opts) {
        super('stack', opts);
    }
    async build() {
        return this.runCommon([
            'build',
            ...this.component(),
            ...(atom.config.get('ide-haskell-cabal.stack.buildArguments') || []),
            '--no-run-tests',
            '--no-run-benchmarks',
        ]);
    }
    async test() {
        return this.runBuild([
            'test',
            ...this.project(),
            ...(atom.config.get('ide-haskell-cabal.stack.testArguments') || []),
        ]);
    }
    async bench() {
        return this.runBuild([
            'bench',
            ...this.project(),
            ...(atom.config.get('ide-haskell-cabal.stack.benchArguments') || []),
        ]);
    }
    async clean() {
        return this.runCommon([
            'clean',
            ...this.project(),
            ...(atom.config.get('ide-haskell-cabal.stack.cleanArguments') || []),
        ]);
    }
    async deps() {
        return this.runCommon([
            'build',
            '--only-dependencies',
            ...this.component(),
            ...(atom.config.get('ide-haskell-cabal.stack.depsArguments') || []),
        ]);
    }
    async runCommon(args, overrides = {}) {
        const globalArgs = atom.config.get('ide-haskell-cabal.stack.globalArguments') || [];
        return this.runCabal([...globalArgs, ...args], overrides);
    }
    fixTarget(comp) {
        if (comp.startsWith('lib:')) {
            comp = 'lib';
        }
        return `${this.opts.target.project}:${comp}`;
    }
    project() {
        switch (this.opts.target.type) {
            case 'all':
            case 'component':
                return [this.opts.target.project];
            case 'auto':
                return [];
        }
    }
    component() {
        switch (this.opts.target.type) {
            case 'all':
                return this.opts.target.targets.map((x) => this.fixTarget(x.target));
            case 'component':
                return [this.fixTarget(this.opts.target.component)];
            case 'auto':
                return [];
        }
    }
    async runBuild(args) {
        const res = await this.runCommon([...args, '--no-run-tests', '--no-run-benchmarks'], {
            severity: 'build',
        });
        if (res.exitCode !== 0) {
            console.error(res.exitCode);
            return res;
        }
        else {
            return this.runCommon(args);
        }
    }
}
exports.Builder = Builder;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvYnVpbGRlcnMvc3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxpQ0FBOEM7QUFFOUMsTUFBYSxPQUFRLFNBQVEsa0JBQVc7SUFDdEMsWUFBWSxJQUFjO1FBQ3hCLEtBQUssQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUE7SUFDdEIsQ0FBQztJQUVNLEtBQUssQ0FBQyxLQUFLO1FBQ2hCLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQztZQUNwQixPQUFPO1lBQ1AsR0FBRyxJQUFJLENBQUMsU0FBUyxFQUFFO1lBQ25CLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyx3Q0FBd0MsQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNwRSxnQkFBZ0I7WUFDaEIscUJBQXFCO1NBQ3RCLENBQUMsQ0FBQTtJQUNKLENBQUM7SUFDTSxLQUFLLENBQUMsSUFBSTtRQUNmLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQztZQUNuQixNQUFNO1lBQ04sR0FBRyxJQUFJLENBQUMsT0FBTyxFQUFFO1lBQ2pCLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyx1Q0FBdUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztTQUNwRSxDQUFDLENBQUE7SUFDSixDQUFDO0lBQ00sS0FBSyxDQUFDLEtBQUs7UUFDaEIsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDO1lBQ25CLE9BQU87WUFDUCxHQUFHLElBQUksQ0FBQyxPQUFPLEVBQUU7WUFDakIsR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLHdDQUF3QyxDQUFDLElBQUksRUFBRSxDQUFDO1NBQ3JFLENBQUMsQ0FBQTtJQUNKLENBQUM7SUFDTSxLQUFLLENBQUMsS0FBSztRQUNoQixPQUFPLElBQUksQ0FBQyxTQUFTLENBQUM7WUFDcEIsT0FBTztZQUNQLEdBQUcsSUFBSSxDQUFDLE9BQU8sRUFBRTtZQUNqQixHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsd0NBQXdDLENBQUMsSUFBSSxFQUFFLENBQUM7U0FDckUsQ0FBQyxDQUFBO0lBQ0osQ0FBQztJQUNNLEtBQUssQ0FBQyxJQUFJO1FBQ2YsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDO1lBQ3BCLE9BQU87WUFDUCxxQkFBcUI7WUFDckIsR0FBRyxJQUFJLENBQUMsU0FBUyxFQUFFO1lBQ25CLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyx1Q0FBdUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztTQUNwRSxDQUFDLENBQUE7SUFDSixDQUFDO0lBRU8sS0FBSyxDQUFDLFNBQVMsQ0FBQyxJQUFjLEVBQUUsWUFBZ0IsRUFBRTtRQUN4RCxNQUFNLFVBQVUsR0FDZCxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyx5Q0FBeUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQTtRQUNsRSxPQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLFVBQVUsRUFBRSxHQUFHLElBQUksQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFBO0lBQzNELENBQUM7SUFFTyxTQUFTLENBQUMsSUFBWTtRQUM1QixJQUFJLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLEVBQUU7WUFDM0IsSUFBSSxHQUFHLEtBQUssQ0FBQTtTQUNiO1FBQ0QsT0FBTyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sSUFBSSxJQUFJLEVBQUUsQ0FBQTtJQUM5QyxDQUFDO0lBRU8sT0FBTztRQUNiLFFBQVEsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFO1lBQzdCLEtBQUssS0FBSyxDQUFDO1lBQ1gsS0FBSyxXQUFXO2dCQUNkLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQTtZQUNuQyxLQUFLLE1BQU07Z0JBQ1QsT0FBTyxFQUFFLENBQUE7U0FDWjtJQUNILENBQUM7SUFFTyxTQUFTO1FBQ2YsUUFBUSxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUU7WUFDN0IsS0FBSyxLQUFLO2dCQUNSLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQTtZQUN0RSxLQUFLLFdBQVc7Z0JBQ2QsT0FBTyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQTtZQUNyRCxLQUFLLE1BQU07Z0JBQ1QsT0FBTyxFQUFFLENBQUE7U0FDWjtJQUNILENBQUM7SUFFTyxLQUFLLENBQUMsUUFBUSxDQUFDLElBQWM7UUFDbkMsTUFBTSxHQUFHLEdBQUcsTUFBTSxJQUFJLENBQUMsU0FBUyxDQUM5QixDQUFDLEdBQUcsSUFBSSxFQUFFLGdCQUFnQixFQUFFLHFCQUFxQixDQUFDLEVBQ2xEO1lBQ0UsUUFBUSxFQUFFLE9BQU87U0FDbEIsQ0FDRixDQUFBO1FBQ0QsSUFBSSxHQUFHLENBQUMsUUFBUSxLQUFLLENBQUMsRUFBRTtZQUN0QixPQUFPLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQTtZQUMzQixPQUFPLEdBQUcsQ0FBQTtTQUNYO2FBQU07WUFDTCxPQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUE7U0FDNUI7SUFDSCxDQUFDO0NBQ0Y7QUE1RkQsMEJBNEZDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ3Rvck9wdHMsIEJ1aWxkZXJCYXNlIH0gZnJvbSAnLi9iYXNlJ1xuXG5leHBvcnQgY2xhc3MgQnVpbGRlciBleHRlbmRzIEJ1aWxkZXJCYXNlIHtcbiAgY29uc3RydWN0b3Iob3B0czogQ3Rvck9wdHMpIHtcbiAgICBzdXBlcignc3RhY2snLCBvcHRzKVxuICB9XG5cbiAgcHVibGljIGFzeW5jIGJ1aWxkKCkge1xuICAgIHJldHVybiB0aGlzLnJ1bkNvbW1vbihbXG4gICAgICAnYnVpbGQnLFxuICAgICAgLi4udGhpcy5jb21wb25lbnQoKSxcbiAgICAgIC4uLihhdG9tLmNvbmZpZy5nZXQoJ2lkZS1oYXNrZWxsLWNhYmFsLnN0YWNrLmJ1aWxkQXJndW1lbnRzJykgfHwgW10pLFxuICAgICAgJy0tbm8tcnVuLXRlc3RzJyxcbiAgICAgICctLW5vLXJ1bi1iZW5jaG1hcmtzJyxcbiAgICBdKVxuICB9XG4gIHB1YmxpYyBhc3luYyB0ZXN0KCkge1xuICAgIHJldHVybiB0aGlzLnJ1bkJ1aWxkKFtcbiAgICAgICd0ZXN0JyxcbiAgICAgIC4uLnRoaXMucHJvamVjdCgpLFxuICAgICAgLi4uKGF0b20uY29uZmlnLmdldCgnaWRlLWhhc2tlbGwtY2FiYWwuc3RhY2sudGVzdEFyZ3VtZW50cycpIHx8IFtdKSxcbiAgICBdKVxuICB9XG4gIHB1YmxpYyBhc3luYyBiZW5jaCgpIHtcbiAgICByZXR1cm4gdGhpcy5ydW5CdWlsZChbXG4gICAgICAnYmVuY2gnLFxuICAgICAgLi4udGhpcy5wcm9qZWN0KCksXG4gICAgICAuLi4oYXRvbS5jb25maWcuZ2V0KCdpZGUtaGFza2VsbC1jYWJhbC5zdGFjay5iZW5jaEFyZ3VtZW50cycpIHx8IFtdKSxcbiAgICBdKVxuICB9XG4gIHB1YmxpYyBhc3luYyBjbGVhbigpIHtcbiAgICByZXR1cm4gdGhpcy5ydW5Db21tb24oW1xuICAgICAgJ2NsZWFuJyxcbiAgICAgIC4uLnRoaXMucHJvamVjdCgpLFxuICAgICAgLi4uKGF0b20uY29uZmlnLmdldCgnaWRlLWhhc2tlbGwtY2FiYWwuc3RhY2suY2xlYW5Bcmd1bWVudHMnKSB8fCBbXSksXG4gICAgXSlcbiAgfVxuICBwdWJsaWMgYXN5bmMgZGVwcygpIHtcbiAgICByZXR1cm4gdGhpcy5ydW5Db21tb24oW1xuICAgICAgJ2J1aWxkJyxcbiAgICAgICctLW9ubHktZGVwZW5kZW5jaWVzJyxcbiAgICAgIC4uLnRoaXMuY29tcG9uZW50KCksXG4gICAgICAuLi4oYXRvbS5jb25maWcuZ2V0KCdpZGUtaGFza2VsbC1jYWJhbC5zdGFjay5kZXBzQXJndW1lbnRzJykgfHwgW10pLFxuICAgIF0pXG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHJ1bkNvbW1vbihhcmdzOiBzdHJpbmdbXSwgb3ZlcnJpZGVzOiB7fSA9IHt9KSB7XG4gICAgY29uc3QgZ2xvYmFsQXJncyA9XG4gICAgICBhdG9tLmNvbmZpZy5nZXQoJ2lkZS1oYXNrZWxsLWNhYmFsLnN0YWNrLmdsb2JhbEFyZ3VtZW50cycpIHx8IFtdXG4gICAgcmV0dXJuIHRoaXMucnVuQ2FiYWwoWy4uLmdsb2JhbEFyZ3MsIC4uLmFyZ3NdLCBvdmVycmlkZXMpXG4gIH1cblxuICBwcml2YXRlIGZpeFRhcmdldChjb21wOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGlmIChjb21wLnN0YXJ0c1dpdGgoJ2xpYjonKSkge1xuICAgICAgY29tcCA9ICdsaWInXG4gICAgfVxuICAgIHJldHVybiBgJHt0aGlzLm9wdHMudGFyZ2V0LnByb2plY3R9OiR7Y29tcH1gXG4gIH1cblxuICBwcml2YXRlIHByb2plY3QoKTogc3RyaW5nW10ge1xuICAgIHN3aXRjaCAodGhpcy5vcHRzLnRhcmdldC50eXBlKSB7XG4gICAgICBjYXNlICdhbGwnOlxuICAgICAgY2FzZSAnY29tcG9uZW50JzpcbiAgICAgICAgcmV0dXJuIFt0aGlzLm9wdHMudGFyZ2V0LnByb2plY3RdXG4gICAgICBjYXNlICdhdXRvJzpcbiAgICAgICAgcmV0dXJuIFtdXG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBjb21wb25lbnQoKTogc3RyaW5nW10ge1xuICAgIHN3aXRjaCAodGhpcy5vcHRzLnRhcmdldC50eXBlKSB7XG4gICAgICBjYXNlICdhbGwnOlxuICAgICAgICByZXR1cm4gdGhpcy5vcHRzLnRhcmdldC50YXJnZXRzLm1hcCgoeCkgPT4gdGhpcy5maXhUYXJnZXQoeC50YXJnZXQpKVxuICAgICAgY2FzZSAnY29tcG9uZW50JzpcbiAgICAgICAgcmV0dXJuIFt0aGlzLmZpeFRhcmdldCh0aGlzLm9wdHMudGFyZ2V0LmNvbXBvbmVudCldXG4gICAgICBjYXNlICdhdXRvJzpcbiAgICAgICAgcmV0dXJuIFtdXG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBydW5CdWlsZChhcmdzOiBzdHJpbmdbXSkge1xuICAgIGNvbnN0IHJlcyA9IGF3YWl0IHRoaXMucnVuQ29tbW9uKFxuICAgICAgWy4uLmFyZ3MsICctLW5vLXJ1bi10ZXN0cycsICctLW5vLXJ1bi1iZW5jaG1hcmtzJ10sXG4gICAgICB7XG4gICAgICAgIHNldmVyaXR5OiAnYnVpbGQnLFxuICAgICAgfSxcbiAgICApXG4gICAgaWYgKHJlcy5leGl0Q29kZSAhPT0gMCkge1xuICAgICAgY29uc29sZS5lcnJvcihyZXMuZXhpdENvZGUpXG4gICAgICByZXR1cm4gcmVzXG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0aGlzLnJ1bkNvbW1vbihhcmdzKVxuICAgIH1cbiAgfVxufVxuIl19