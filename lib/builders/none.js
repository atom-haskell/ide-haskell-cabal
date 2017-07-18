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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9uZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9idWlsZGVycy9ub25lLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFBQSxpQ0FBNEM7QUFFNUMsYUFBcUIsU0FBUSxrQkFBVztJQUN0QyxZQUFhLElBQWM7UUFDekIsS0FBSyxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQTtJQUN0QixDQUFDO0lBQ2UsS0FBSzs7WUFDbkIsTUFBTSxDQUFDLEVBQUMsUUFBUSxFQUFFLENBQUMsRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFDLENBQUE7UUFDdkMsQ0FBQztLQUFBO0lBQ2UsSUFBSTs7WUFDbEIsTUFBTSxDQUFDLEVBQUMsUUFBUSxFQUFFLENBQUMsRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFDLENBQUE7UUFDdkMsQ0FBQztLQUFBO0lBQ2UsS0FBSzs7WUFDbkIsTUFBTSxDQUFDLEVBQUMsUUFBUSxFQUFFLENBQUMsRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFDLENBQUE7UUFDdkMsQ0FBQztLQUFBO0lBQ2UsS0FBSzs7WUFDbkIsTUFBTSxDQUFDLEVBQUMsUUFBUSxFQUFFLENBQUMsRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFDLENBQUE7UUFDdkMsQ0FBQztLQUFBO0lBQ2UsSUFBSTs7WUFDbEIsTUFBTSxDQUFDLEVBQUMsUUFBUSxFQUFFLENBQUMsRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFDLENBQUE7UUFDdkMsQ0FBQztLQUFBO0NBQ0Y7QUFuQkQsMEJBbUJDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtDdG9yT3B0cywgQnVpbGRlckJhc2V9IGZyb20gJy4vYmFzZSdcblxuZXhwb3J0IGNsYXNzIEJ1aWxkZXIgZXh0ZW5kcyBCdWlsZGVyQmFzZSB7XG4gIGNvbnN0cnVjdG9yIChvcHRzOiBDdG9yT3B0cykge1xuICAgIHN1cGVyKCdjYWJhbCcsIG9wdHMpXG4gIH1cbiAgcHJvdGVjdGVkIGFzeW5jIGJ1aWxkICgpIHtcbiAgICByZXR1cm4ge2V4aXRDb2RlOiAwLCBoYXNFcnJvcjogZmFsc2V9XG4gIH1cbiAgcHJvdGVjdGVkIGFzeW5jIHRlc3QgKCkge1xuICAgIHJldHVybiB7ZXhpdENvZGU6IDAsIGhhc0Vycm9yOiBmYWxzZX1cbiAgfVxuICBwcm90ZWN0ZWQgYXN5bmMgYmVuY2ggKCkge1xuICAgIHJldHVybiB7ZXhpdENvZGU6IDAsIGhhc0Vycm9yOiBmYWxzZX1cbiAgfVxuICBwcm90ZWN0ZWQgYXN5bmMgY2xlYW4gKCkge1xuICAgIHJldHVybiB7ZXhpdENvZGU6IDAsIGhhc0Vycm9yOiBmYWxzZX1cbiAgfVxuICBwcm90ZWN0ZWQgYXN5bmMgZGVwcyAoKSB7XG4gICAgcmV0dXJuIHtleGl0Q29kZTogMCwgaGFzRXJyb3I6IGZhbHNlfVxuICB9XG59XG4iXX0=