"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const base_1 = require("./base");
class Builder extends base_1.BuilderBase {
    constructor(opts) {
        super('cabal', opts);
        this.dummyResult = { exitCode: 0, hasError: false };
    }
    async build() {
        return this.dummyResult;
    }
    async test() {
        return this.dummyResult;
    }
    async bench() {
        return this.dummyResult;
    }
    async clean() {
        return this.dummyResult;
    }
    async deps() {
        return this.dummyResult;
    }
}
exports.Builder = Builder;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9uZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9idWlsZGVycy9ub25lLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsaUNBQThDO0FBRTlDLE1BQWEsT0FBUSxTQUFRLGtCQUFXO0lBRXRDLFlBQVksSUFBYztRQUN4QixLQUFLLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFBO1FBRmQsZ0JBQVcsR0FBRyxFQUFFLFFBQVEsRUFBRSxDQUFDLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRSxDQUFBO0lBR3RELENBQUM7SUFDTSxLQUFLLENBQUMsS0FBSztRQUNoQixPQUFPLElBQUksQ0FBQyxXQUFXLENBQUE7SUFDekIsQ0FBQztJQUNNLEtBQUssQ0FBQyxJQUFJO1FBQ2YsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFBO0lBQ3pCLENBQUM7SUFDTSxLQUFLLENBQUMsS0FBSztRQUNoQixPQUFPLElBQUksQ0FBQyxXQUFXLENBQUE7SUFDekIsQ0FBQztJQUNNLEtBQUssQ0FBQyxLQUFLO1FBQ2hCLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQTtJQUN6QixDQUFDO0lBQ00sS0FBSyxDQUFDLElBQUk7UUFDZixPQUFPLElBQUksQ0FBQyxXQUFXLENBQUE7SUFDekIsQ0FBQztDQUNGO0FBcEJELDBCQW9CQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEN0b3JPcHRzLCBCdWlsZGVyQmFzZSB9IGZyb20gJy4vYmFzZSdcblxuZXhwb3J0IGNsYXNzIEJ1aWxkZXIgZXh0ZW5kcyBCdWlsZGVyQmFzZSB7XG4gIHByaXZhdGUgZHVtbXlSZXN1bHQgPSB7IGV4aXRDb2RlOiAwLCBoYXNFcnJvcjogZmFsc2UgfVxuICBjb25zdHJ1Y3RvcihvcHRzOiBDdG9yT3B0cykge1xuICAgIHN1cGVyKCdjYWJhbCcsIG9wdHMpXG4gIH1cbiAgcHVibGljIGFzeW5jIGJ1aWxkKCkge1xuICAgIHJldHVybiB0aGlzLmR1bW15UmVzdWx0XG4gIH1cbiAgcHVibGljIGFzeW5jIHRlc3QoKSB7XG4gICAgcmV0dXJuIHRoaXMuZHVtbXlSZXN1bHRcbiAgfVxuICBwdWJsaWMgYXN5bmMgYmVuY2goKSB7XG4gICAgcmV0dXJuIHRoaXMuZHVtbXlSZXN1bHRcbiAgfVxuICBwdWJsaWMgYXN5bmMgY2xlYW4oKSB7XG4gICAgcmV0dXJuIHRoaXMuZHVtbXlSZXN1bHRcbiAgfVxuICBwdWJsaWMgYXN5bmMgZGVwcygpIHtcbiAgICByZXR1cm4gdGhpcy5kdW1teVJlc3VsdFxuICB9XG59XG4iXX0=