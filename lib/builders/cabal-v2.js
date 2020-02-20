"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cabal_1 = require("./base/cabal");
class Builder extends cabal_1.CabalBase {
    constructor(opts) {
        super(opts);
    }
    async build() {
        return this.commonBuild('build', this.component());
    }
    async test() {
        const severityChangeRx = {};
        severityChangeRx[this.opts.params.severity] = /Running \d+ test suites\.\.\./;
        return this.commonBuild('test', [], { severityChangeRx, severity: 'build' });
    }
    async bench() {
        const severityChangeRx = {};
        severityChangeRx[this.opts.params.severity] = /Running \d+ benchmarks\.\.\./;
        return this.commonBuild('bench', [], {
            severityChangeRx,
            severity: 'build',
        });
    }
    async clean() {
        return this.commonBuild('clean', []);
    }
    async deps() {
        atom.notifications.addWarning("Command 'deps' is not implemented for cabal-v2");
        throw new Error("Command 'deps' is not implemented for cabal-v2");
    }
    async commonBuild(command, args, override = {}) {
        return this.runCabal([
            await this.withPrefix(command),
            ...args,
            '--builddir=' + cabal_1.getCabalOpts().buildDir,
        ], override);
    }
    component() {
        switch (this.opts.target.type) {
            case 'all':
                return this.opts.target.targets.map((x) => this.opts.target.project + ":" + x.target);
            case 'component':
                return [this.opts.target.project + ":" + this.opts.target.component];
            case 'auto':
                return [];
        }
    }
    async withPrefix(cmd) {
        return super.withPrefix(cmd, { oldprefix: 'new-', newprefix: 'v2-' });
    }
}
exports.Builder = Builder;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FiYWwtdjIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvYnVpbGRlcnMvY2FiYWwtdjIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFDQSx3Q0FBc0Q7QUFFdEQsTUFBYSxPQUFRLFNBQVEsaUJBQVM7SUFDcEMsWUFBWSxJQUFjO1FBQ3hCLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQTtJQUNiLENBQUM7SUFFTSxLQUFLLENBQUMsS0FBSztRQUNoQixPQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFBO0lBQ3BELENBQUM7SUFDTSxLQUFLLENBQUMsSUFBSTtRQUNmLE1BQU0sZ0JBQWdCLEdBQUcsRUFBRSxDQUFBO1FBQzNCLGdCQUFnQixDQUNkLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FDMUIsR0FBRywrQkFBK0IsQ0FBQTtRQUNuQyxPQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsTUFBTSxFQUFFLEVBQUUsRUFBRSxFQUFFLGdCQUFnQixFQUFFLFFBQVEsRUFBRSxPQUFPLEVBQUUsQ0FBQyxDQUFBO0lBQzlFLENBQUM7SUFDTSxLQUFLLENBQUMsS0FBSztRQUNoQixNQUFNLGdCQUFnQixHQUFHLEVBQUUsQ0FBQTtRQUMzQixnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsR0FBRyw4QkFBOEIsQ0FBQTtRQUM1RSxPQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxFQUFFLEVBQUUsRUFBRTtZQUNuQyxnQkFBZ0I7WUFDaEIsUUFBUSxFQUFFLE9BQU87U0FDbEIsQ0FBQyxDQUFBO0lBQ0osQ0FBQztJQUNNLEtBQUssQ0FBQyxLQUFLO1FBQ2hCLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDLENBQUE7SUFDdEMsQ0FBQztJQUNNLEtBQUssQ0FBQyxJQUFJO1FBQ2YsSUFBSSxDQUFDLGFBQWEsQ0FBQyxVQUFVLENBQzNCLGdEQUFnRCxDQUNqRCxDQUFBO1FBQ0QsTUFBTSxJQUFJLEtBQUssQ0FBQyxnREFBZ0QsQ0FBQyxDQUFBO0lBQ25FLENBQUM7SUFDTyxLQUFLLENBQUMsV0FBVyxDQUN2QixPQUF5RCxFQUN6RCxJQUFjLEVBQ2QsV0FBNkIsRUFBRTtRQUUvQixPQUFPLElBQUksQ0FBQyxRQUFRLENBQ2xCO1lBQ0UsTUFBTSxJQUFJLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQztZQUM5QixHQUFHLElBQUk7WUFDUCxhQUFhLEdBQUcsb0JBQVksRUFBRSxDQUFDLFFBQVE7U0FDeEMsRUFDRCxRQUFRLENBQ1QsQ0FBQTtJQUNILENBQUM7SUFDUyxTQUFTO1FBQ2pCLFFBQVEsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFO1lBQzdCLEtBQUssS0FBSztnQkFDUixPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sR0FBRyxHQUFHLEdBQUcsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFBO1lBQ3ZGLEtBQUssV0FBVztnQkFDZCxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxHQUFHLEdBQUcsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQTtZQUN0RSxLQUFLLE1BQU07Z0JBQ1QsT0FBTyxFQUFFLENBQUE7U0FDWjtJQUNILENBQUM7SUFDUyxLQUFLLENBQUMsVUFBVSxDQUFDLEdBQVc7UUFDcEMsT0FBTyxLQUFLLENBQUMsVUFBVSxDQUFDLEdBQUcsRUFBRSxFQUFFLFNBQVMsRUFBRSxNQUFNLEVBQUUsU0FBUyxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUE7SUFDdkUsQ0FBQztDQUNGO0FBM0RELDBCQTJEQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEN0b3JPcHRzLCBSZXN1bHRUeXBlLCBJUGFyYW1zIH0gZnJvbSAnLi9iYXNlJ1xuaW1wb3J0IHsgQ2FiYWxCYXNlLCBnZXRDYWJhbE9wdHMgfSBmcm9tICcuL2Jhc2UvY2FiYWwnXG5cbmV4cG9ydCBjbGFzcyBCdWlsZGVyIGV4dGVuZHMgQ2FiYWxCYXNlIHtcbiAgY29uc3RydWN0b3Iob3B0czogQ3Rvck9wdHMpIHtcbiAgICBzdXBlcihvcHRzKVxuICB9XG5cbiAgcHVibGljIGFzeW5jIGJ1aWxkKCkge1xuICAgIHJldHVybiB0aGlzLmNvbW1vbkJ1aWxkKCdidWlsZCcsIHRoaXMuY29tcG9uZW50KCkpXG4gIH1cbiAgcHVibGljIGFzeW5jIHRlc3QoKSB7XG4gICAgY29uc3Qgc2V2ZXJpdHlDaGFuZ2VSeCA9IHt9XG4gICAgc2V2ZXJpdHlDaGFuZ2VSeFtcbiAgICAgIHRoaXMub3B0cy5wYXJhbXMuc2V2ZXJpdHlcbiAgICBdID0gL1J1bm5pbmcgXFxkKyB0ZXN0IHN1aXRlc1xcLlxcLlxcLi9cbiAgICByZXR1cm4gdGhpcy5jb21tb25CdWlsZCgndGVzdCcsIFtdLCB7IHNldmVyaXR5Q2hhbmdlUngsIHNldmVyaXR5OiAnYnVpbGQnIH0pXG4gIH1cbiAgcHVibGljIGFzeW5jIGJlbmNoKCk6IFByb21pc2U8UmVzdWx0VHlwZT4ge1xuICAgIGNvbnN0IHNldmVyaXR5Q2hhbmdlUnggPSB7fVxuICAgIHNldmVyaXR5Q2hhbmdlUnhbdGhpcy5vcHRzLnBhcmFtcy5zZXZlcml0eV0gPSAvUnVubmluZyBcXGQrIGJlbmNobWFya3NcXC5cXC5cXC4vXG4gICAgcmV0dXJuIHRoaXMuY29tbW9uQnVpbGQoJ2JlbmNoJywgW10sIHtcbiAgICAgIHNldmVyaXR5Q2hhbmdlUngsXG4gICAgICBzZXZlcml0eTogJ2J1aWxkJyxcbiAgICB9KVxuICB9XG4gIHB1YmxpYyBhc3luYyBjbGVhbigpOiBQcm9taXNlPFJlc3VsdFR5cGU+IHtcbiAgICByZXR1cm4gdGhpcy5jb21tb25CdWlsZCgnY2xlYW4nLCBbXSlcbiAgfVxuICBwdWJsaWMgYXN5bmMgZGVwcygpOiBQcm9taXNlPFJlc3VsdFR5cGU+IHtcbiAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkV2FybmluZyhcbiAgICAgIFwiQ29tbWFuZCAnZGVwcycgaXMgbm90IGltcGxlbWVudGVkIGZvciBjYWJhbC12MlwiLFxuICAgIClcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJDb21tYW5kICdkZXBzJyBpcyBub3QgaW1wbGVtZW50ZWQgZm9yIGNhYmFsLXYyXCIpXG4gIH1cbiAgcHJpdmF0ZSBhc3luYyBjb21tb25CdWlsZChcbiAgICBjb21tYW5kOiAnYnVpbGQnIHwgJ3Rlc3QnIHwgJ2JlbmNoJyB8ICdpbnN0YWxsJyB8ICdjbGVhbicsXG4gICAgYXJnczogc3RyaW5nW10sXG4gICAgb3ZlcnJpZGU6IFBhcnRpYWw8SVBhcmFtcz4gPSB7fSxcbiAgKSB7XG4gICAgcmV0dXJuIHRoaXMucnVuQ2FiYWwoXG4gICAgICBbXG4gICAgICAgIGF3YWl0IHRoaXMud2l0aFByZWZpeChjb21tYW5kKSxcbiAgICAgICAgLi4uYXJncyxcbiAgICAgICAgJy0tYnVpbGRkaXI9JyArIGdldENhYmFsT3B0cygpLmJ1aWxkRGlyLFxuICAgICAgXSxcbiAgICAgIG92ZXJyaWRlLFxuICAgIClcbiAgfVxuICBwcm90ZWN0ZWQgY29tcG9uZW50KCkge1xuICAgIHN3aXRjaCAodGhpcy5vcHRzLnRhcmdldC50eXBlKSB7XG4gICAgICBjYXNlICdhbGwnOlxuICAgICAgICByZXR1cm4gdGhpcy5vcHRzLnRhcmdldC50YXJnZXRzLm1hcCgoeCkgPT4gdGhpcy5vcHRzLnRhcmdldC5wcm9qZWN0ICsgXCI6XCIgKyB4LnRhcmdldClcbiAgICAgIGNhc2UgJ2NvbXBvbmVudCc6XG4gICAgICAgIHJldHVybiBbdGhpcy5vcHRzLnRhcmdldC5wcm9qZWN0ICsgXCI6XCIgKyB0aGlzLm9wdHMudGFyZ2V0LmNvbXBvbmVudF1cbiAgICAgIGNhc2UgJ2F1dG8nOlxuICAgICAgICByZXR1cm4gW11cbiAgICB9XG4gIH1cbiAgcHJvdGVjdGVkIGFzeW5jIHdpdGhQcmVmaXgoY21kOiBzdHJpbmcpIHtcbiAgICByZXR1cm4gc3VwZXIud2l0aFByZWZpeChjbWQsIHsgb2xkcHJlZml4OiAnbmV3LScsIG5ld3ByZWZpeDogJ3YyLScgfSlcbiAgfVxufVxuIl19