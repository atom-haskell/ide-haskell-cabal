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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FiYWwtbml4LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2J1aWxkZXJzL2NhYmFsLW5peC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUNBLHdDQUF3QztBQUV4QyxNQUFhLE9BQVEsU0FBUSxpQkFBUztJQUlwQyxZQUFZLElBQWM7UUFDeEIsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFBO0lBQ2IsQ0FBQztJQUVNLEtBQUssQ0FBQyxLQUFLO1FBQ2hCLElBQUksQ0FBQyxTQUFTLEdBQUcsQ0FBQyxXQUFXLENBQUMsQ0FBQTtRQUM5QixJQUFJLENBQUMsU0FBUyxFQUFFLENBQUE7UUFDaEIsT0FBTyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUE7SUFDeEIsQ0FBQztJQUNNLEtBQUssQ0FBQyxJQUFJO1FBQ2YsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsRUFBRSxDQUFBO1FBQ3BDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUM3QixJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQ3hCLEdBQUcsK0JBQStCLENBQUE7UUFDbkMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxHQUFHLE9BQU8sQ0FBQTtRQUNqQyxJQUFJLENBQUMsU0FBUyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUE7UUFDN0IsT0FBTyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUE7SUFDeEIsQ0FBQztJQUNNLEtBQUssQ0FBQyxLQUFLO1FBQ2hCLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGdCQUFnQixHQUFHLEVBQUUsQ0FBQTtRQUNwQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FDN0IsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUN4QixHQUFHLDhCQUE4QixDQUFBO1FBQ2xDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsR0FBRyxPQUFPLENBQUE7UUFDakMsSUFBSSxDQUFDLFNBQVMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxDQUFBO1FBQzlCLE9BQU8sSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFBO0lBQ3hCLENBQUM7SUFDTSxLQUFLLENBQUMsS0FBSztRQUNoQixJQUFJLENBQUMsYUFBYSxDQUFDLFVBQVUsQ0FDM0Isa0RBQWtELENBQ25ELENBQUE7UUFDRCxNQUFNLElBQUksS0FBSyxDQUFDLGtEQUFrRCxDQUFDLENBQUE7SUFDckUsQ0FBQztJQUNNLEtBQUssQ0FBQyxJQUFJO1FBQ2YsSUFBSSxDQUFDLGFBQWEsQ0FBQyxVQUFVLENBQzNCLGlEQUFpRCxDQUNsRCxDQUFBO1FBQ0QsTUFBTSxJQUFJLEtBQUssQ0FBQyxpREFBaUQsQ0FBQyxDQUFBO0lBQ3BFLENBQUM7Q0FDRjtBQTNDRCwwQkEyQ0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDdG9yT3B0cywgUmVzdWx0VHlwZSB9IGZyb20gJy4vYmFzZSdcbmltcG9ydCB7IENhYmFsQmFzZSB9IGZyb20gJy4vYmFzZS9jYWJhbCdcblxuZXhwb3J0IGNsYXNzIEJ1aWxkZXIgZXh0ZW5kcyBDYWJhbEJhc2Uge1xuICAvLyBUT0RPOlxuICAvLyAgICogQ29tbWFuZHMgb3RoZXIgdGhhbiAnYnVpbGQnXG4gIC8vICAgKiBTdXBwb3J0IGZvciBidWlsZERpclxuICBjb25zdHJ1Y3RvcihvcHRzOiBDdG9yT3B0cykge1xuICAgIHN1cGVyKG9wdHMpXG4gIH1cblxuICBwdWJsaWMgYXN5bmMgYnVpbGQoKSB7XG4gICAgdGhpcy5jYWJhbEFyZ3MgPSBbJ25ldy1idWlsZCddXG4gICAgdGhpcy5jb21wb25lbnQoKVxuICAgIHJldHVybiB0aGlzLnJ1bkNhYmFsKClcbiAgfVxuICBwdWJsaWMgYXN5bmMgdGVzdCgpIHtcbiAgICB0aGlzLm9wdHMub3B0cy5zZXZlcml0eUNoYW5nZVJ4ID0ge31cbiAgICB0aGlzLm9wdHMub3B0cy5zZXZlcml0eUNoYW5nZVJ4W1xuICAgICAgdGhpcy5vcHRzLm9wdHMuc2V2ZXJpdHlcbiAgICBdID0gL1J1bm5pbmcgXFxkKyB0ZXN0IHN1aXRlc1xcLlxcLlxcLi9cbiAgICB0aGlzLm9wdHMub3B0cy5zZXZlcml0eSA9ICdidWlsZCdcbiAgICB0aGlzLmNhYmFsQXJncyA9IFsnbmV3LXRlc3QnXVxuICAgIHJldHVybiB0aGlzLnJ1bkNhYmFsKClcbiAgfVxuICBwdWJsaWMgYXN5bmMgYmVuY2goKTogUHJvbWlzZTxSZXN1bHRUeXBlPiB7XG4gICAgdGhpcy5vcHRzLm9wdHMuc2V2ZXJpdHlDaGFuZ2VSeCA9IHt9XG4gICAgdGhpcy5vcHRzLm9wdHMuc2V2ZXJpdHlDaGFuZ2VSeFtcbiAgICAgIHRoaXMub3B0cy5vcHRzLnNldmVyaXR5XG4gICAgXSA9IC9SdW5uaW5nIFxcZCsgYmVuY2htYXJrc1xcLlxcLlxcLi9cbiAgICB0aGlzLm9wdHMub3B0cy5zZXZlcml0eSA9ICdidWlsZCdcbiAgICB0aGlzLmNhYmFsQXJncyA9IFsnbmV3LWJlbmNoJ11cbiAgICByZXR1cm4gdGhpcy5ydW5DYWJhbCgpXG4gIH1cbiAgcHVibGljIGFzeW5jIGNsZWFuKCk6IFByb21pc2U8UmVzdWx0VHlwZT4ge1xuICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRXYXJuaW5nKFxuICAgICAgXCJDb21tYW5kICdjbGVhbicgaXMgbm90IGltcGxlbWVudGVkIGZvciBjYWJhbC1uaXhcIixcbiAgICApXG4gICAgdGhyb3cgbmV3IEVycm9yKFwiQ29tbWFuZCAnY2xlYW4nIGlzIG5vdCBpbXBsZW1lbnRlZCBmb3IgY2FiYWwtbml4XCIpXG4gIH1cbiAgcHVibGljIGFzeW5jIGRlcHMoKTogUHJvbWlzZTxSZXN1bHRUeXBlPiB7XG4gICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZFdhcm5pbmcoXG4gICAgICBcIkNvbW1hbmQgJ2RlcHMnIGlzIG5vdCBpbXBsZW1lbnRlZCBmb3IgY2FiYWwtbml4XCIsXG4gICAgKVxuICAgIHRocm93IG5ldyBFcnJvcihcIkNvbW1hbmQgJ2RlcHMnIGlzIG5vdCBpbXBsZW1lbnRlZCBmb3IgY2FiYWwtbml4XCIpXG4gIH1cbn1cbiJdfQ==