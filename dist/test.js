"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mocha_1 = require("mocha");
const chai_1 = require("chai");
const got_1 = require("got");
const server_1 = require("./server");
let server;
const PORT = 40000 + Math.ceil(Math.random() * 20000);
const HOST = "localhost";
const URL = `http://${HOST}:${PORT}`;
mocha_1.before(async () => {
    server = await server_1.default(HOST, PORT);
    console.log("Listening on", PORT, "...");
});
mocha_1.describe("/redirects", () => {
    mocha_1.it("redirect 4 times", async () => {
        const resp = await got_1.default.get(`${URL}/redirects/4`, {
            followRedirect: true,
        });
        chai_1.expect(resp.statusCode).to.equal(200);
        chai_1.expect(resp.redirectUrls.length).to.equal(4);
        chai_1.expect(resp.redirectUrls).to.deep.equal([
            `${URL}/redirects/3`, `${URL}/redirects/2`, `${URL}/redirects/1`, `${URL}/redirects/0`,
        ]);
    });
    mocha_1.it("redirect with 302", async () => {
        const resp = await got_1.default.get(`${URL}/redirects/4`, {
            followRedirect: false,
        });
        chai_1.expect(resp.statusCode).to.equal(302);
    });
});
mocha_1.describe("/redirects/method", () => {
    mocha_1.it("redirect to /redirects/method/mirror", async () => {
        const resp = await got_1.default.get(`${URL}/redirects/method`, {
            followRedirect: true,
            methodRewriting: true,
        });
        chai_1.expect(resp.redirectUrls.pop()).to.equal(`${URL}/redirects/method/mirror`);
    });
    mocha_1.it("redirect with 308", async () => {
        const resp = await got_1.default.get(`${URL}/redirects/method/308`, { followRedirect: false });
        chai_1.expect(resp.statusCode).to.equal(308);
    });
    mocha_1.it("redirect to /redirects/method/mirror", async () => {
        const respPromise = got_1.default.get(`${URL}/redirects/method/400`, { followRedirect: true });
        chai_1.expect(respPromise).to.throw;
    });
    mocha_1.it("return return POST as method used", async () => {
        const respPost = await got_1.default.get(`${URL}/redirects/method/308`, {
            followRedirect: true,
            methodRewriting: false,
            responseType: "json",
        });
        chai_1.expect(respPost.body).to.deep.equal({
            method: "GET"
        });
    });
    mocha_1.it("return return GET as method used", async () => {
        const respPost = await got_1.default.get(`${URL}/redirects/method/308`, {
            followRedirect: true,
            methodRewriting: true,
            responseType: "json",
        });
        chai_1.expect(respPost.body).to.deep.equal({
            method: "GET"
        });
    });
});
mocha_1.describe("/auth", () => {
    mocha_1.it("respond with 401", async () => {
        chai_1.expect(got_1.default.post(`${URL}/auth`, { followRedirect: false })).to.throw;
        chai_1.expect(got_1.default.post(`${URL}/auth`, {
            followRedirect: false,
            json: {
                username: "dsa",
                password: "dsa",
            }
        })).to.throw;
    });
    mocha_1.it("set cookie", async () => {
        const resp = await got_1.default.post(`${URL}/auth`, {
            followRedirect: false,
            json: {
                username: "test",
                password: "test",
            }
        });
        chai_1.expect(resp.statusCode).to.equal(200);
        chai_1.expect(resp.headers["set-cookie"][0]).to.include("allowed=true");
    });
    mocha_1.it("respond with correct content type", async () => {
        const resp = await got_1.default.post(`${URL}/auth`, {
            followRedirect: false,
            json: {
                username: "test",
                password: "test",
            },
            responseType: "json"
        });
        chai_1.expect(resp.body).to.deep.equal({
            contentType: "application/json",
        });
    });
});
mocha_1.describe("/afterAuth", () => {
    mocha_1.it("respond with 401", async () => {
        const respPromise = got_1.default.get(`${URL}/afterAuth`);
        chai_1.expect(respPromise).to.throw;
        try {
            await respPromise;
        }
        catch (err) {
            chai_1.expect(err.response.statusCode).to.equal(401);
        }
    });
    mocha_1.it("respond with ok:true", async () => {
        const resp = await got_1.default.get(`${URL}/afterAuth`, {
            headers: {
                "cookie": "allowed=true",
            },
            responseType: "json"
        });
        chai_1.expect(resp.body).to.deep.equal({
            ok: true
        });
    });
});
mocha_1.describe("/mirror", () => {
    mocha_1.it("should return correct method, headers, query", async () => {
        const sent = {
            headers: {
                "user-agent": "void*",
                "header1": "value1",
                "header2": "value2",
            },
            query: {
                "time": "4000",
                "key1": "val1",
            }
        };
        const resp = await got_1.default.get(`${URL}/mirror`, {
            headers: sent.headers,
            searchParams: sent.query,
            responseType: "json"
        });
        chai_1.expect(resp.body.headers).to.contain(sent.headers);
        chai_1.expect(resp.body.method).to.deep.equal("GET");
        chai_1.expect(resp.body.query).to.deep.equal(sent.query);
    });
    mocha_1.it("should return correct method and body", async () => {
        const body = {
            key1: "val1",
            arr: ["val1", "val2", "val3"],
            nested: {
                level2: {
                    level: 3
                }
            }
        };
        const resp = await got_1.default.post(`${URL}/mirror`, {
            json: body,
            responseType: "json"
        });
        chai_1.expect(resp.body.body).to.deep.equal(body);
        chai_1.expect(resp.body.method).to.deep.equal("POST");
    });
});
//# sourceMappingURL=test.js.map