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
        super('cabal', opts);
    }
    build() {
        return __awaiter(this, void 0, void 0, function* () {
            this.cabalArgs = ['new-build'];
            if (this.opts.target.target) {
                this.cabalArgs.push(this.opts.target.target.target);
            }
            return this.runCabal();
        });
    }
    test() {
        return __awaiter(this, void 0, void 0, function* () {
            atom.notifications.addWarning("Command 'test' is not implemented for cabal-nix");
            throw new Error("Command 'test' is not implemented for cabal-nix");
        });
    }
    bench() {
        return __awaiter(this, void 0, void 0, function* () {
            atom.notifications.addWarning("Command 'bench' is not implemented for cabal-nix");
            throw new Error("Command 'bench' is not implemented for cabal-nix");
        });
    }
    clean() {
        return __awaiter(this, void 0, void 0, function* () {
            atom.notifications.addWarning("Command 'clean' is not implemented for cabal-nix");
            throw new Error("Command 'clean' is not implemented for cabal-nix");
        });
    }
    deps() {
        return __awaiter(this, void 0, void 0, function* () {
            atom.notifications.addWarning("Command 'deps' is not implemented for cabal-nix");
            throw new Error("Command 'deps' is not implemented for cabal-nix");
        });
    }
}
exports.Builder = Builder;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FiYWwtbml4LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2J1aWxkZXJzL2NhYmFsLW5peC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBQUEsaUNBQTRDO0FBRTVDLGFBQXFCLFNBQVEsa0JBQVc7SUFJdEMsWUFBYSxJQUFjO1FBQ3pCLEtBQUssQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUE7SUFDdEIsQ0FBQztJQUVlLEtBQUs7O1lBQ25CLElBQUksQ0FBQyxTQUFTLEdBQUcsQ0FBQyxXQUFXLENBQUMsQ0FBQTtZQUM5QixFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO2dCQUM1QixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUE7WUFDckQsQ0FBQztZQUNELE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUE7UUFDeEIsQ0FBQztLQUFBO0lBQ2UsSUFBSTs7WUFDbEIsSUFBSSxDQUFDLGFBQWEsQ0FBQyxVQUFVLENBQUMsaURBQWlELENBQUMsQ0FBQTtZQUNoRixNQUFNLElBQUksS0FBSyxDQUFDLGlEQUFpRCxDQUFDLENBQUE7UUFDcEUsQ0FBQztLQUFBO0lBQ2UsS0FBSzs7WUFDbkIsSUFBSSxDQUFDLGFBQWEsQ0FBQyxVQUFVLENBQUMsa0RBQWtELENBQUMsQ0FBQTtZQUNqRixNQUFNLElBQUksS0FBSyxDQUFDLGtEQUFrRCxDQUFDLENBQUE7UUFDckUsQ0FBQztLQUFBO0lBQ2UsS0FBSzs7WUFDbkIsSUFBSSxDQUFDLGFBQWEsQ0FBQyxVQUFVLENBQUMsa0RBQWtELENBQUMsQ0FBQTtZQUNqRixNQUFNLElBQUksS0FBSyxDQUFDLGtEQUFrRCxDQUFDLENBQUE7UUFDckUsQ0FBQztLQUFBO0lBQ2UsSUFBSTs7WUFDbEIsSUFBSSxDQUFDLGFBQWEsQ0FBQyxVQUFVLENBQUMsaURBQWlELENBQUMsQ0FBQTtZQUNoRixNQUFNLElBQUksS0FBSyxDQUFDLGlEQUFpRCxDQUFDLENBQUE7UUFDcEUsQ0FBQztLQUFBO0NBQ0Y7QUEvQkQsMEJBK0JDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtDdG9yT3B0cywgQnVpbGRlckJhc2V9IGZyb20gJy4vYmFzZSdcblxuZXhwb3J0IGNsYXNzIEJ1aWxkZXIgZXh0ZW5kcyBCdWlsZGVyQmFzZSB7XG4gIC8vIFRPRE86XG4gIC8vICAgKiBDb21tYW5kcyBvdGhlciB0aGFuICdidWlsZCdcbiAgLy8gICAqIFN1cHBvcnQgZm9yIGJ1aWxkRGlyXG4gIGNvbnN0cnVjdG9yIChvcHRzOiBDdG9yT3B0cykge1xuICAgIHN1cGVyKCdjYWJhbCcsIG9wdHMpXG4gIH1cblxuICBwcm90ZWN0ZWQgYXN5bmMgYnVpbGQgKCkge1xuICAgIHRoaXMuY2FiYWxBcmdzID0gWyduZXctYnVpbGQnXVxuICAgIGlmICh0aGlzLm9wdHMudGFyZ2V0LnRhcmdldCkge1xuICAgICAgdGhpcy5jYWJhbEFyZ3MucHVzaCh0aGlzLm9wdHMudGFyZ2V0LnRhcmdldC50YXJnZXQpXG4gICAgfVxuICAgIHJldHVybiB0aGlzLnJ1bkNhYmFsKClcbiAgfVxuICBwcm90ZWN0ZWQgYXN5bmMgdGVzdCAoKTogUHJvbWlzZTx7ZXhpdENvZGU6IG51bWJlciwgaGFzRXJyb3I6IGJvb2xlYW59PiB7XG4gICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZFdhcm5pbmcoXCJDb21tYW5kICd0ZXN0JyBpcyBub3QgaW1wbGVtZW50ZWQgZm9yIGNhYmFsLW5peFwiKVxuICAgIHRocm93IG5ldyBFcnJvcihcIkNvbW1hbmQgJ3Rlc3QnIGlzIG5vdCBpbXBsZW1lbnRlZCBmb3IgY2FiYWwtbml4XCIpXG4gIH1cbiAgcHJvdGVjdGVkIGFzeW5jIGJlbmNoICgpOiBQcm9taXNlPHtleGl0Q29kZTogbnVtYmVyLCBoYXNFcnJvcjogYm9vbGVhbn0+IHtcbiAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkV2FybmluZyhcIkNvbW1hbmQgJ2JlbmNoJyBpcyBub3QgaW1wbGVtZW50ZWQgZm9yIGNhYmFsLW5peFwiKVxuICAgIHRocm93IG5ldyBFcnJvcihcIkNvbW1hbmQgJ2JlbmNoJyBpcyBub3QgaW1wbGVtZW50ZWQgZm9yIGNhYmFsLW5peFwiKVxuICB9XG4gIHByb3RlY3RlZCBhc3luYyBjbGVhbiAoKTogUHJvbWlzZTx7ZXhpdENvZGU6IG51bWJlciwgaGFzRXJyb3I6IGJvb2xlYW59PiB7XG4gICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZFdhcm5pbmcoXCJDb21tYW5kICdjbGVhbicgaXMgbm90IGltcGxlbWVudGVkIGZvciBjYWJhbC1uaXhcIilcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJDb21tYW5kICdjbGVhbicgaXMgbm90IGltcGxlbWVudGVkIGZvciBjYWJhbC1uaXhcIilcbiAgfVxuICBwcm90ZWN0ZWQgYXN5bmMgZGVwcyAoKTogUHJvbWlzZTx7ZXhpdENvZGU6IG51bWJlciwgaGFzRXJyb3I6IGJvb2xlYW59PiB7XG4gICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZFdhcm5pbmcoXCJDb21tYW5kICdkZXBzJyBpcyBub3QgaW1wbGVtZW50ZWQgZm9yIGNhYmFsLW5peFwiKVxuICAgIHRocm93IG5ldyBFcnJvcihcIkNvbW1hbmQgJ2RlcHMnIGlzIG5vdCBpbXBsZW1lbnRlZCBmb3IgY2FiYWwtbml4XCIpXG4gIH1cbn1cbiJdfQ==