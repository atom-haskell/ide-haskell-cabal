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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9uZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9idWlsZGVycy9ub25lLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFBQSxpQ0FBNEM7QUFFNUMsYUFBcUIsU0FBUSxrQkFBVztJQUN0QyxZQUFhLElBQWM7UUFDekIsS0FBSyxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQTtJQUN0QixDQUFDO0lBQ1ksS0FBSzs7WUFDaEIsTUFBTSxDQUFDLEVBQUMsUUFBUSxFQUFFLENBQUMsRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFDLENBQUE7UUFDdkMsQ0FBQztLQUFBO0lBQ1ksSUFBSTs7WUFDZixNQUFNLENBQUMsRUFBQyxRQUFRLEVBQUUsQ0FBQyxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUMsQ0FBQTtRQUN2QyxDQUFDO0tBQUE7SUFDWSxLQUFLOztZQUNoQixNQUFNLENBQUMsRUFBQyxRQUFRLEVBQUUsQ0FBQyxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUMsQ0FBQTtRQUN2QyxDQUFDO0tBQUE7SUFDWSxLQUFLOztZQUNoQixNQUFNLENBQUMsRUFBQyxRQUFRLEVBQUUsQ0FBQyxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUMsQ0FBQTtRQUN2QyxDQUFDO0tBQUE7SUFDWSxJQUFJOztZQUNmLE1BQU0sQ0FBQyxFQUFDLFFBQVEsRUFBRSxDQUFDLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBQyxDQUFBO1FBQ3ZDLENBQUM7S0FBQTtDQUNGO0FBbkJELDBCQW1CQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7Q3Rvck9wdHMsIEJ1aWxkZXJCYXNlfSBmcm9tICcuL2Jhc2UnXG5cbmV4cG9ydCBjbGFzcyBCdWlsZGVyIGV4dGVuZHMgQnVpbGRlckJhc2Uge1xuICBjb25zdHJ1Y3RvciAob3B0czogQ3Rvck9wdHMpIHtcbiAgICBzdXBlcignY2FiYWwnLCBvcHRzKVxuICB9XG4gIHB1YmxpYyBhc3luYyBidWlsZCAoKSB7XG4gICAgcmV0dXJuIHtleGl0Q29kZTogMCwgaGFzRXJyb3I6IGZhbHNlfVxuICB9XG4gIHB1YmxpYyBhc3luYyB0ZXN0ICgpIHtcbiAgICByZXR1cm4ge2V4aXRDb2RlOiAwLCBoYXNFcnJvcjogZmFsc2V9XG4gIH1cbiAgcHVibGljIGFzeW5jIGJlbmNoICgpIHtcbiAgICByZXR1cm4ge2V4aXRDb2RlOiAwLCBoYXNFcnJvcjogZmFsc2V9XG4gIH1cbiAgcHVibGljIGFzeW5jIGNsZWFuICgpIHtcbiAgICByZXR1cm4ge2V4aXRDb2RlOiAwLCBoYXNFcnJvcjogZmFsc2V9XG4gIH1cbiAgcHVibGljIGFzeW5jIGRlcHMgKCkge1xuICAgIHJldHVybiB7ZXhpdENvZGU6IDAsIGhhc0Vycm9yOiBmYWxzZX1cbiAgfVxufVxuIl19