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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FiYWwtbml4LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2J1aWxkZXJzL2NhYmFsLW5peC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBQUEsaUNBQThDO0FBRTlDLGFBQXFCLFNBQVEsa0JBQVc7SUFJdEMsWUFBWSxJQUFjO1FBQ3hCLEtBQUssQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUE7SUFDdEIsQ0FBQztJQUVZLEtBQUs7O1lBQ2hCLElBQUksQ0FBQyxTQUFTLEdBQUcsQ0FBQyxXQUFXLENBQUMsQ0FBQTtZQUM5QixFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO2dCQUM1QixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUE7WUFDckQsQ0FBQztZQUNELE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUE7UUFDeEIsQ0FBQztLQUFBO0lBQ1ksSUFBSTs7WUFDZixJQUFJLENBQUMsYUFBYSxDQUFDLFVBQVUsQ0FBQyxpREFBaUQsQ0FBQyxDQUFBO1lBQ2hGLE1BQU0sSUFBSSxLQUFLLENBQUMsaURBQWlELENBQUMsQ0FBQTtRQUNwRSxDQUFDO0tBQUE7SUFDWSxLQUFLOztZQUNoQixJQUFJLENBQUMsYUFBYSxDQUFDLFVBQVUsQ0FBQyxrREFBa0QsQ0FBQyxDQUFBO1lBQ2pGLE1BQU0sSUFBSSxLQUFLLENBQUMsa0RBQWtELENBQUMsQ0FBQTtRQUNyRSxDQUFDO0tBQUE7SUFDWSxLQUFLOztZQUNoQixJQUFJLENBQUMsYUFBYSxDQUFDLFVBQVUsQ0FBQyxrREFBa0QsQ0FBQyxDQUFBO1lBQ2pGLE1BQU0sSUFBSSxLQUFLLENBQUMsa0RBQWtELENBQUMsQ0FBQTtRQUNyRSxDQUFDO0tBQUE7SUFDWSxJQUFJOztZQUNmLElBQUksQ0FBQyxhQUFhLENBQUMsVUFBVSxDQUFDLGlEQUFpRCxDQUFDLENBQUE7WUFDaEYsTUFBTSxJQUFJLEtBQUssQ0FBQyxpREFBaUQsQ0FBQyxDQUFBO1FBQ3BFLENBQUM7S0FBQTtDQUNGO0FBL0JELDBCQStCQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEN0b3JPcHRzLCBCdWlsZGVyQmFzZSB9IGZyb20gJy4vYmFzZSdcblxuZXhwb3J0IGNsYXNzIEJ1aWxkZXIgZXh0ZW5kcyBCdWlsZGVyQmFzZSB7XG4gIC8vIFRPRE86XG4gIC8vICAgKiBDb21tYW5kcyBvdGhlciB0aGFuICdidWlsZCdcbiAgLy8gICAqIFN1cHBvcnQgZm9yIGJ1aWxkRGlyXG4gIGNvbnN0cnVjdG9yKG9wdHM6IEN0b3JPcHRzKSB7XG4gICAgc3VwZXIoJ2NhYmFsJywgb3B0cylcbiAgfVxuXG4gIHB1YmxpYyBhc3luYyBidWlsZCgpIHtcbiAgICB0aGlzLmNhYmFsQXJncyA9IFsnbmV3LWJ1aWxkJ11cbiAgICBpZiAodGhpcy5vcHRzLnRhcmdldC50YXJnZXQpIHtcbiAgICAgIHRoaXMuY2FiYWxBcmdzLnB1c2godGhpcy5vcHRzLnRhcmdldC50YXJnZXQudGFyZ2V0KVxuICAgIH1cbiAgICByZXR1cm4gdGhpcy5ydW5DYWJhbCgpXG4gIH1cbiAgcHVibGljIGFzeW5jIHRlc3QoKTogUHJvbWlzZTx7IGV4aXRDb2RlOiBudW1iZXIsIGhhc0Vycm9yOiBib29sZWFuIH0+IHtcbiAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkV2FybmluZyhcIkNvbW1hbmQgJ3Rlc3QnIGlzIG5vdCBpbXBsZW1lbnRlZCBmb3IgY2FiYWwtbml4XCIpXG4gICAgdGhyb3cgbmV3IEVycm9yKFwiQ29tbWFuZCAndGVzdCcgaXMgbm90IGltcGxlbWVudGVkIGZvciBjYWJhbC1uaXhcIilcbiAgfVxuICBwdWJsaWMgYXN5bmMgYmVuY2goKTogUHJvbWlzZTx7IGV4aXRDb2RlOiBudW1iZXIsIGhhc0Vycm9yOiBib29sZWFuIH0+IHtcbiAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkV2FybmluZyhcIkNvbW1hbmQgJ2JlbmNoJyBpcyBub3QgaW1wbGVtZW50ZWQgZm9yIGNhYmFsLW5peFwiKVxuICAgIHRocm93IG5ldyBFcnJvcihcIkNvbW1hbmQgJ2JlbmNoJyBpcyBub3QgaW1wbGVtZW50ZWQgZm9yIGNhYmFsLW5peFwiKVxuICB9XG4gIHB1YmxpYyBhc3luYyBjbGVhbigpOiBQcm9taXNlPHsgZXhpdENvZGU6IG51bWJlciwgaGFzRXJyb3I6IGJvb2xlYW4gfT4ge1xuICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRXYXJuaW5nKFwiQ29tbWFuZCAnY2xlYW4nIGlzIG5vdCBpbXBsZW1lbnRlZCBmb3IgY2FiYWwtbml4XCIpXG4gICAgdGhyb3cgbmV3IEVycm9yKFwiQ29tbWFuZCAnY2xlYW4nIGlzIG5vdCBpbXBsZW1lbnRlZCBmb3IgY2FiYWwtbml4XCIpXG4gIH1cbiAgcHVibGljIGFzeW5jIGRlcHMoKTogUHJvbWlzZTx7IGV4aXRDb2RlOiBudW1iZXIsIGhhc0Vycm9yOiBib29sZWFuIH0+IHtcbiAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkV2FybmluZyhcIkNvbW1hbmQgJ2RlcHMnIGlzIG5vdCBpbXBsZW1lbnRlZCBmb3IgY2FiYWwtbml4XCIpXG4gICAgdGhyb3cgbmV3IEVycm9yKFwiQ29tbWFuZCAnZGVwcycgaXMgbm90IGltcGxlbWVudGVkIGZvciBjYWJhbC1uaXhcIilcbiAgfVxufVxuIl19