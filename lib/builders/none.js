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
            return { exitCode: 0, hasError: false };
        });
    }
    test() {
        return __awaiter(this, void 0, void 0, function* () {
            return { exitCode: 0, hasError: false };
        });
    }
    bench() {
        return __awaiter(this, void 0, void 0, function* () {
            return { exitCode: 0, hasError: false };
        });
    }
    clean() {
        return __awaiter(this, void 0, void 0, function* () {
            return { exitCode: 0, hasError: false };
        });
    }
    deps() {
        return __awaiter(this, void 0, void 0, function* () {
            return { exitCode: 0, hasError: false };
        });
    }
}
exports.Builder = Builder;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9uZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9idWlsZGVycy9ub25lLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFBQSxpQ0FBOEM7QUFFOUMsYUFBcUIsU0FBUSxrQkFBVztJQUN0QyxZQUFZLElBQWM7UUFDeEIsS0FBSyxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQTtJQUN0QixDQUFDO0lBQ1ksS0FBSzs7WUFDaEIsTUFBTSxDQUFDLEVBQUUsUUFBUSxFQUFFLENBQUMsRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFFLENBQUE7UUFDekMsQ0FBQztLQUFBO0lBQ1ksSUFBSTs7WUFDZixNQUFNLENBQUMsRUFBRSxRQUFRLEVBQUUsQ0FBQyxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUUsQ0FBQTtRQUN6QyxDQUFDO0tBQUE7SUFDWSxLQUFLOztZQUNoQixNQUFNLENBQUMsRUFBRSxRQUFRLEVBQUUsQ0FBQyxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUUsQ0FBQTtRQUN6QyxDQUFDO0tBQUE7SUFDWSxLQUFLOztZQUNoQixNQUFNLENBQUMsRUFBRSxRQUFRLEVBQUUsQ0FBQyxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUUsQ0FBQTtRQUN6QyxDQUFDO0tBQUE7SUFDWSxJQUFJOztZQUNmLE1BQU0sQ0FBQyxFQUFFLFFBQVEsRUFBRSxDQUFDLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRSxDQUFBO1FBQ3pDLENBQUM7S0FBQTtDQUNGO0FBbkJELDBCQW1CQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEN0b3JPcHRzLCBCdWlsZGVyQmFzZSB9IGZyb20gJy4vYmFzZSdcblxuZXhwb3J0IGNsYXNzIEJ1aWxkZXIgZXh0ZW5kcyBCdWlsZGVyQmFzZSB7XG4gIGNvbnN0cnVjdG9yKG9wdHM6IEN0b3JPcHRzKSB7XG4gICAgc3VwZXIoJ2NhYmFsJywgb3B0cylcbiAgfVxuICBwdWJsaWMgYXN5bmMgYnVpbGQoKSB7XG4gICAgcmV0dXJuIHsgZXhpdENvZGU6IDAsIGhhc0Vycm9yOiBmYWxzZSB9XG4gIH1cbiAgcHVibGljIGFzeW5jIHRlc3QoKSB7XG4gICAgcmV0dXJuIHsgZXhpdENvZGU6IDAsIGhhc0Vycm9yOiBmYWxzZSB9XG4gIH1cbiAgcHVibGljIGFzeW5jIGJlbmNoKCkge1xuICAgIHJldHVybiB7IGV4aXRDb2RlOiAwLCBoYXNFcnJvcjogZmFsc2UgfVxuICB9XG4gIHB1YmxpYyBhc3luYyBjbGVhbigpIHtcbiAgICByZXR1cm4geyBleGl0Q29kZTogMCwgaGFzRXJyb3I6IGZhbHNlIH1cbiAgfVxuICBwdWJsaWMgYXN5bmMgZGVwcygpIHtcbiAgICByZXR1cm4geyBleGl0Q29kZTogMCwgaGFzRXJyb3I6IGZhbHNlIH1cbiAgfVxufVxuIl19