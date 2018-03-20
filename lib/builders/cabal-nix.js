"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cabal_1 = require("./base/cabal");
class Builder extends cabal_1.CabalBase {
    constructor(opts) {
        super(opts);
    }
    async build() {
        this.cabalArgs = ['new-build'];
        this.component();
        return this.runCabal();
    }
    async test() {
        this.opts.opts.severityChangeRx = {};
        this.opts.opts.severityChangeRx[this.opts.opts.severity] = /Running \d+ test suites\.\.\./;
        this.opts.opts.severity = 'build';
        this.cabalArgs = ['new-test'];
        return this.runCabal();
    }
    async bench() {
        this.opts.opts.severityChangeRx = {};
        this.opts.opts.severityChangeRx[this.opts.opts.severity] = /Running \d+ benchmarks\.\.\./;
        this.opts.opts.severity = 'build';
        this.cabalArgs = ['new-bench'];
        return this.runCabal();
    }
    async clean() {
        atom.notifications.addWarning("Command 'clean' is not implemented for cabal-nix");
        throw new Error("Command 'clean' is not implemented for cabal-nix");
    }
    async deps() {
        atom.notifications.addWarning("Command 'deps' is not implemented for cabal-nix");
        throw new Error("Command 'deps' is not implemented for cabal-nix");
    }
}
exports.Builder = Builder;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FiYWwtbml4LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2J1aWxkZXJzL2NhYmFsLW5peC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUNBLHdDQUF3QztBQUV4QyxhQUFxQixTQUFRLGlCQUFTO0lBSXBDLFlBQVksSUFBYztRQUN4QixLQUFLLENBQUMsSUFBSSxDQUFDLENBQUE7SUFDYixDQUFDO0lBRU0sS0FBSyxDQUFDLEtBQUs7UUFDaEIsSUFBSSxDQUFDLFNBQVMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxDQUFBO1FBQzlCLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQTtRQUNoQixNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFBO0lBQ3hCLENBQUM7SUFDTSxLQUFLLENBQUMsSUFBSTtRQUNmLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGdCQUFnQixHQUFHLEVBQUUsQ0FBQTtRQUNwQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FDN0IsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUN4QixHQUFHLCtCQUErQixDQUFBO1FBQ25DLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsR0FBRyxPQUFPLENBQUE7UUFDakMsSUFBSSxDQUFDLFNBQVMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFBO1FBQzdCLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUE7SUFDeEIsQ0FBQztJQUNNLEtBQUssQ0FBQyxLQUFLO1FBQ2hCLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGdCQUFnQixHQUFHLEVBQUUsQ0FBQTtRQUNwQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FDN0IsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUN4QixHQUFHLDhCQUE4QixDQUFBO1FBQ2xDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsR0FBRyxPQUFPLENBQUE7UUFDakMsSUFBSSxDQUFDLFNBQVMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxDQUFBO1FBQzlCLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUE7SUFDeEIsQ0FBQztJQUNNLEtBQUssQ0FBQyxLQUFLO1FBQ2hCLElBQUksQ0FBQyxhQUFhLENBQUMsVUFBVSxDQUMzQixrREFBa0QsQ0FDbkQsQ0FBQTtRQUNELE1BQU0sSUFBSSxLQUFLLENBQUMsa0RBQWtELENBQUMsQ0FBQTtJQUNyRSxDQUFDO0lBQ00sS0FBSyxDQUFDLElBQUk7UUFDZixJQUFJLENBQUMsYUFBYSxDQUFDLFVBQVUsQ0FDM0IsaURBQWlELENBQ2xELENBQUE7UUFDRCxNQUFNLElBQUksS0FBSyxDQUFDLGlEQUFpRCxDQUFDLENBQUE7SUFDcEUsQ0FBQztDQUNGO0FBM0NELDBCQTJDQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEN0b3JPcHRzLCBSZXN1bHRUeXBlIH0gZnJvbSAnLi9iYXNlJ1xuaW1wb3J0IHsgQ2FiYWxCYXNlIH0gZnJvbSAnLi9iYXNlL2NhYmFsJ1xuXG5leHBvcnQgY2xhc3MgQnVpbGRlciBleHRlbmRzIENhYmFsQmFzZSB7XG4gIC8vIFRPRE86XG4gIC8vICAgKiBDb21tYW5kcyBvdGhlciB0aGFuICdidWlsZCdcbiAgLy8gICAqIFN1cHBvcnQgZm9yIGJ1aWxkRGlyXG4gIGNvbnN0cnVjdG9yKG9wdHM6IEN0b3JPcHRzKSB7XG4gICAgc3VwZXIob3B0cylcbiAgfVxuXG4gIHB1YmxpYyBhc3luYyBidWlsZCgpIHtcbiAgICB0aGlzLmNhYmFsQXJncyA9IFsnbmV3LWJ1aWxkJ11cbiAgICB0aGlzLmNvbXBvbmVudCgpXG4gICAgcmV0dXJuIHRoaXMucnVuQ2FiYWwoKVxuICB9XG4gIHB1YmxpYyBhc3luYyB0ZXN0KCkge1xuICAgIHRoaXMub3B0cy5vcHRzLnNldmVyaXR5Q2hhbmdlUnggPSB7fVxuICAgIHRoaXMub3B0cy5vcHRzLnNldmVyaXR5Q2hhbmdlUnhbXG4gICAgICB0aGlzLm9wdHMub3B0cy5zZXZlcml0eVxuICAgIF0gPSAvUnVubmluZyBcXGQrIHRlc3Qgc3VpdGVzXFwuXFwuXFwuL1xuICAgIHRoaXMub3B0cy5vcHRzLnNldmVyaXR5ID0gJ2J1aWxkJ1xuICAgIHRoaXMuY2FiYWxBcmdzID0gWyduZXctdGVzdCddXG4gICAgcmV0dXJuIHRoaXMucnVuQ2FiYWwoKVxuICB9XG4gIHB1YmxpYyBhc3luYyBiZW5jaCgpOiBQcm9taXNlPFJlc3VsdFR5cGU+IHtcbiAgICB0aGlzLm9wdHMub3B0cy5zZXZlcml0eUNoYW5nZVJ4ID0ge31cbiAgICB0aGlzLm9wdHMub3B0cy5zZXZlcml0eUNoYW5nZVJ4W1xuICAgICAgdGhpcy5vcHRzLm9wdHMuc2V2ZXJpdHlcbiAgICBdID0gL1J1bm5pbmcgXFxkKyBiZW5jaG1hcmtzXFwuXFwuXFwuL1xuICAgIHRoaXMub3B0cy5vcHRzLnNldmVyaXR5ID0gJ2J1aWxkJ1xuICAgIHRoaXMuY2FiYWxBcmdzID0gWyduZXctYmVuY2gnXVxuICAgIHJldHVybiB0aGlzLnJ1bkNhYmFsKClcbiAgfVxuICBwdWJsaWMgYXN5bmMgY2xlYW4oKTogUHJvbWlzZTxSZXN1bHRUeXBlPiB7XG4gICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZFdhcm5pbmcoXG4gICAgICBcIkNvbW1hbmQgJ2NsZWFuJyBpcyBub3QgaW1wbGVtZW50ZWQgZm9yIGNhYmFsLW5peFwiLFxuICAgIClcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJDb21tYW5kICdjbGVhbicgaXMgbm90IGltcGxlbWVudGVkIGZvciBjYWJhbC1uaXhcIilcbiAgfVxuICBwdWJsaWMgYXN5bmMgZGVwcygpOiBQcm9taXNlPFJlc3VsdFR5cGU+IHtcbiAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkV2FybmluZyhcbiAgICAgIFwiQ29tbWFuZCAnZGVwcycgaXMgbm90IGltcGxlbWVudGVkIGZvciBjYWJhbC1uaXhcIixcbiAgICApXG4gICAgdGhyb3cgbmV3IEVycm9yKFwiQ29tbWFuZCAnZGVwcycgaXMgbm90IGltcGxlbWVudGVkIGZvciBjYWJhbC1uaXhcIilcbiAgfVxufVxuIl19