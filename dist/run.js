"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = require("./server");
async function main() {
    const server = await server_1.default("localhost", 3099, true);
}
main();
//# sourceMappingURL=run.js.map