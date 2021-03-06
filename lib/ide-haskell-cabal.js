"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const atom_1 = require("atom");
const ide_backend_1 = require("./ide-backend");
var config_1 = require("./config");
exports.config = config_1.config;
let disposables;
function activate() {
}
exports.activate = activate;
function deactivate() {
    if (disposables) {
        disposables.dispose();
    }
    disposables = undefined;
}
exports.deactivate = deactivate;
function consumeUPI(reg) {
    const backend = new ide_backend_1.IdeBackend(reg);
    disposables = new atom_1.CompositeDisposable();
    disposables.add(new atom_1.Disposable(() => backend.destroy()));
    return disposables;
}
exports.consumeUPI = consumeUPI;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaWRlLWhhc2tlbGwtY2FiYWwuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaWRlLWhhc2tlbGwtY2FiYWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSwrQkFBc0Q7QUFDdEQsK0NBQTBDO0FBRzFDLG1DQUFpQztBQUF4QiwwQkFBQSxNQUFNLENBQUE7QUFFZixJQUFJLFdBQTRDLENBQUE7QUFFaEQsU0FBZ0IsUUFBUTtBQUV4QixDQUFDO0FBRkQsNEJBRUM7QUFFRCxTQUFnQixVQUFVO0lBQ3hCLElBQUksV0FBVyxFQUFFO1FBQ2YsV0FBVyxDQUFDLE9BQU8sRUFBRSxDQUFBO0tBQ3RCO0lBQ0QsV0FBVyxHQUFHLFNBQVMsQ0FBQTtBQUN6QixDQUFDO0FBTEQsZ0NBS0M7QUFFRCxTQUFnQixVQUFVLENBQUMsR0FBeUI7SUFDbEQsTUFBTSxPQUFPLEdBQUcsSUFBSSx3QkFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFBO0lBRW5DLFdBQVcsR0FBRyxJQUFJLDBCQUFtQixFQUFFLENBQUE7SUFDdkMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLGlCQUFVLENBQUMsR0FBRyxFQUFFLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQTtJQUV4RCxPQUFPLFdBQVcsQ0FBQTtBQUNwQixDQUFDO0FBUEQsZ0NBT0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBEaXNwb3NhYmxlLCBDb21wb3NpdGVEaXNwb3NhYmxlIH0gZnJvbSAnYXRvbSdcbmltcG9ydCB7IElkZUJhY2tlbmQgfSBmcm9tICcuL2lkZS1iYWNrZW5kJ1xuaW1wb3J0ICogYXMgVVBJIGZyb20gJ2F0b20taGFza2VsbC11cGknXG5cbmV4cG9ydCB7IGNvbmZpZyB9IGZyb20gJy4vY29uZmlnJ1xuXG5sZXQgZGlzcG9zYWJsZXM6IENvbXBvc2l0ZURpc3Bvc2FibGUgfCB1bmRlZmluZWRcblxuZXhwb3J0IGZ1bmN0aW9uIGFjdGl2YXRlKCkge1xuICAvKiBub29wICovXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBkZWFjdGl2YXRlKCkge1xuICBpZiAoZGlzcG9zYWJsZXMpIHtcbiAgICBkaXNwb3NhYmxlcy5kaXNwb3NlKClcbiAgfVxuICBkaXNwb3NhYmxlcyA9IHVuZGVmaW5lZFxufVxuXG5leHBvcnQgZnVuY3Rpb24gY29uc3VtZVVQSShyZWc6IFVQSS5JVVBJUmVnaXN0cmF0aW9uKSB7XG4gIGNvbnN0IGJhY2tlbmQgPSBuZXcgSWRlQmFja2VuZChyZWcpXG5cbiAgZGlzcG9zYWJsZXMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpXG4gIGRpc3Bvc2FibGVzLmFkZChuZXcgRGlzcG9zYWJsZSgoKSA9PiBiYWNrZW5kLmRlc3Ryb3koKSkpXG5cbiAgcmV0dXJuIGRpc3Bvc2FibGVzXG59XG4iXX0=