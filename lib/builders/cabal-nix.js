"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const base_1 = require("./base");
class Builder extends base_1.BuilderBase {
    constructor(opts) {
        super('cabal', opts);
    }
    async build() {
        this.cabalArgs = ['new-build'];
        this.component();
        return this.runCabal();
    }
    async test() {
        atom.notifications.addWarning("Command 'test' is not implemented for cabal-nix");
        throw new Error("Command 'test' is not implemented for cabal-nix");
    }
    async bench() {
        atom.notifications.addWarning("Command 'bench' is not implemented for cabal-nix");
        throw new Error("Command 'bench' is not implemented for cabal-nix");
    }
    async clean() {
        atom.notifications.addWarning("Command 'clean' is not implemented for cabal-nix");
        throw new Error("Command 'clean' is not implemented for cabal-nix");
    }
    async deps() {
        atom.notifications.addWarning("Command 'deps' is not implemented for cabal-nix");
        throw new Error("Command 'deps' is not implemented for cabal-nix");
    }
    component() {
        switch (this.opts.target.type) {
            case 'all':
                this.cabalArgs.push(...this.opts.target.targets.map((x) => x.target));
                break;
            case 'component':
                this.cabalArgs.push(this.opts.target.component);
                break;
            case 'auto':
                break;
        }
    }
}
exports.Builder = Builder;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FiYWwtbml4LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2J1aWxkZXJzL2NhYmFsLW5peC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLGlDQUE4QztBQUU5QyxhQUFxQixTQUFRLGtCQUFXO0lBSXRDLFlBQVksSUFBYztRQUN4QixLQUFLLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFBO0lBQ3RCLENBQUM7SUFFTSxLQUFLLENBQUMsS0FBSztRQUNoQixJQUFJLENBQUMsU0FBUyxHQUFHLENBQUMsV0FBVyxDQUFDLENBQUE7UUFDOUIsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFBO1FBQ2hCLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUE7SUFDeEIsQ0FBQztJQUNNLEtBQUssQ0FBQyxJQUFJO1FBQ2YsSUFBSSxDQUFDLGFBQWEsQ0FBQyxVQUFVLENBQzNCLGlEQUFpRCxDQUNsRCxDQUFBO1FBQ0QsTUFBTSxJQUFJLEtBQUssQ0FBQyxpREFBaUQsQ0FBQyxDQUFBO0lBQ3BFLENBQUM7SUFDTSxLQUFLLENBQUMsS0FBSztRQUNoQixJQUFJLENBQUMsYUFBYSxDQUFDLFVBQVUsQ0FDM0Isa0RBQWtELENBQ25ELENBQUE7UUFDRCxNQUFNLElBQUksS0FBSyxDQUFDLGtEQUFrRCxDQUFDLENBQUE7SUFDckUsQ0FBQztJQUNNLEtBQUssQ0FBQyxLQUFLO1FBQ2hCLElBQUksQ0FBQyxhQUFhLENBQUMsVUFBVSxDQUMzQixrREFBa0QsQ0FDbkQsQ0FBQTtRQUNELE1BQU0sSUFBSSxLQUFLLENBQUMsa0RBQWtELENBQUMsQ0FBQTtJQUNyRSxDQUFDO0lBQ00sS0FBSyxDQUFDLElBQUk7UUFDZixJQUFJLENBQUMsYUFBYSxDQUFDLFVBQVUsQ0FDM0IsaURBQWlELENBQ2xELENBQUE7UUFDRCxNQUFNLElBQUksS0FBSyxDQUFDLGlEQUFpRCxDQUFDLENBQUE7SUFDcEUsQ0FBQztJQUVPLFNBQVM7UUFDZixNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQzlCLEtBQUssS0FBSztnQkFDUixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFBO2dCQUNyRSxLQUFLLENBQUE7WUFDUCxLQUFLLFdBQVc7Z0JBQ2QsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUE7Z0JBQy9DLEtBQUssQ0FBQTtZQUNQLEtBQUssTUFBTTtnQkFDVCxLQUFLLENBQUE7UUFDVCxDQUFDO0lBQ0gsQ0FBQztDQUNGO0FBbERELDBCQWtEQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEN0b3JPcHRzLCBCdWlsZGVyQmFzZSB9IGZyb20gJy4vYmFzZSdcblxuZXhwb3J0IGNsYXNzIEJ1aWxkZXIgZXh0ZW5kcyBCdWlsZGVyQmFzZSB7XG4gIC8vIFRPRE86XG4gIC8vICAgKiBDb21tYW5kcyBvdGhlciB0aGFuICdidWlsZCdcbiAgLy8gICAqIFN1cHBvcnQgZm9yIGJ1aWxkRGlyXG4gIGNvbnN0cnVjdG9yKG9wdHM6IEN0b3JPcHRzKSB7XG4gICAgc3VwZXIoJ2NhYmFsJywgb3B0cylcbiAgfVxuXG4gIHB1YmxpYyBhc3luYyBidWlsZCgpIHtcbiAgICB0aGlzLmNhYmFsQXJncyA9IFsnbmV3LWJ1aWxkJ11cbiAgICB0aGlzLmNvbXBvbmVudCgpXG4gICAgcmV0dXJuIHRoaXMucnVuQ2FiYWwoKVxuICB9XG4gIHB1YmxpYyBhc3luYyB0ZXN0KCk6IFByb21pc2U8eyBleGl0Q29kZTogbnVtYmVyOyBoYXNFcnJvcjogYm9vbGVhbiB9PiB7XG4gICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZFdhcm5pbmcoXG4gICAgICBcIkNvbW1hbmQgJ3Rlc3QnIGlzIG5vdCBpbXBsZW1lbnRlZCBmb3IgY2FiYWwtbml4XCIsXG4gICAgKVxuICAgIHRocm93IG5ldyBFcnJvcihcIkNvbW1hbmQgJ3Rlc3QnIGlzIG5vdCBpbXBsZW1lbnRlZCBmb3IgY2FiYWwtbml4XCIpXG4gIH1cbiAgcHVibGljIGFzeW5jIGJlbmNoKCk6IFByb21pc2U8eyBleGl0Q29kZTogbnVtYmVyOyBoYXNFcnJvcjogYm9vbGVhbiB9PiB7XG4gICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZFdhcm5pbmcoXG4gICAgICBcIkNvbW1hbmQgJ2JlbmNoJyBpcyBub3QgaW1wbGVtZW50ZWQgZm9yIGNhYmFsLW5peFwiLFxuICAgIClcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJDb21tYW5kICdiZW5jaCcgaXMgbm90IGltcGxlbWVudGVkIGZvciBjYWJhbC1uaXhcIilcbiAgfVxuICBwdWJsaWMgYXN5bmMgY2xlYW4oKTogUHJvbWlzZTx7IGV4aXRDb2RlOiBudW1iZXI7IGhhc0Vycm9yOiBib29sZWFuIH0+IHtcbiAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkV2FybmluZyhcbiAgICAgIFwiQ29tbWFuZCAnY2xlYW4nIGlzIG5vdCBpbXBsZW1lbnRlZCBmb3IgY2FiYWwtbml4XCIsXG4gICAgKVxuICAgIHRocm93IG5ldyBFcnJvcihcIkNvbW1hbmQgJ2NsZWFuJyBpcyBub3QgaW1wbGVtZW50ZWQgZm9yIGNhYmFsLW5peFwiKVxuICB9XG4gIHB1YmxpYyBhc3luYyBkZXBzKCk6IFByb21pc2U8eyBleGl0Q29kZTogbnVtYmVyOyBoYXNFcnJvcjogYm9vbGVhbiB9PiB7XG4gICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZFdhcm5pbmcoXG4gICAgICBcIkNvbW1hbmQgJ2RlcHMnIGlzIG5vdCBpbXBsZW1lbnRlZCBmb3IgY2FiYWwtbml4XCIsXG4gICAgKVxuICAgIHRocm93IG5ldyBFcnJvcihcIkNvbW1hbmQgJ2RlcHMnIGlzIG5vdCBpbXBsZW1lbnRlZCBmb3IgY2FiYWwtbml4XCIpXG4gIH1cblxuICBwcml2YXRlIGNvbXBvbmVudCgpIHtcbiAgICBzd2l0Y2ggKHRoaXMub3B0cy50YXJnZXQudHlwZSkge1xuICAgICAgY2FzZSAnYWxsJzpcbiAgICAgICAgdGhpcy5jYWJhbEFyZ3MucHVzaCguLi50aGlzLm9wdHMudGFyZ2V0LnRhcmdldHMubWFwKCh4KSA9PiB4LnRhcmdldCkpXG4gICAgICAgIGJyZWFrXG4gICAgICBjYXNlICdjb21wb25lbnQnOlxuICAgICAgICB0aGlzLmNhYmFsQXJncy5wdXNoKHRoaXMub3B0cy50YXJnZXQuY29tcG9uZW50KVxuICAgICAgICBicmVha1xuICAgICAgY2FzZSAnYXV0byc6XG4gICAgICAgIGJyZWFrXG4gICAgfVxuICB9XG59XG4iXX0=