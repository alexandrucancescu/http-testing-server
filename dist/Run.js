"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Server_1 = require("./Server");
async function main() {
    const server = await Server_1.default("localhost", 3099, true);
}
main();
//# sourceMappingURL=Run.js.map