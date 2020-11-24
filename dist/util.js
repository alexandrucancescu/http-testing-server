"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.copyObjectProps = void 0;
function copyObjectProps(original, props) {
    const copy = {};
    props.forEach(prop => {
        if (prop in original) {
            if (typeof original[prop] === "object" && Object.keys(original[prop]).length === 0) {
                return;
            }
            copy[prop] = original[prop];
        }
    });
    return copy;
}
exports.copyObjectProps = copyObjectProps;
//# sourceMappingURL=util.js.map