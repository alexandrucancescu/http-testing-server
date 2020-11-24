import {describe, it, before, after} from "mocha";
import {expect} from "chai";
import got from "got";
import createTestServer from "./server";

let server;

const PORT = 40000 + Math.ceil(Math.random()*20000);
const HOST = "localhost";
const URL  = `http://${HOST}:${PORT}`;

before(async()=>{
	server = await createTestServer(HOST, PORT);
	console.log("Listening on",PORT,"...");
})

describe("/redirects", ()=>{
	it("redirect 4 times",async ()=>{
		const resp = await got.get(`${URL}/redirects/4`,{
			followRedirect: true,
		});
		expect(resp.statusCode).to.equal(200);
		expect(resp.redirectUrls.length).to.equal(4);
		expect(resp.redirectUrls).to.deep.equal([
			`${URL}/redirects/3`, `${URL}/redirects/2`, `${URL}/redirects/1`, `${URL}/redirects/0`,
		])
	})
	it("redirect with 302", async ()=>{
		const resp = await got.get(`${URL}/redirects/4`,{
			followRedirect: false,
		});
		expect(resp.statusCode).to.equal(302);
	})
});

describe("/redirects/method", ()=>{
	it("redirect to /redirects/method/mirror",async()=>{
		const resp = await got.get(`${URL}/redirects/method`, {
			followRedirect: true,
			methodRewriting: true,
		});

		expect(resp.redirectUrls.pop()).to.equal(`${URL}/redirects/method/mirror`);
	});
	it("redirect with 308",async()=>{
		const resp = await got.get(`${URL}/redirects/method/308`, {followRedirect: false});

		expect(resp.statusCode).to.equal(308);
	});
	it("redirect to /redirects/method/mirror",async()=>{
		const respPromise = got.get(`${URL}/redirects/method/400`, {followRedirect: true});

		expect(respPromise).to.throw;
	});
	it("return return POST as method used", async()=>{
		const respPost = await got.get(`${URL}/redirects/method/308`, {
			followRedirect: true,
			methodRewriting: false,
			responseType: "json",
		});

		expect(respPost.body).to.deep.equal({
			method: "GET"
		})
	});
	it("return return GET as method used", async()=>{
		const respPost = await got.get(`${URL}/redirects/method/308`, {
			followRedirect: true,
			methodRewriting: true,
			responseType: "json",
		});

		expect(respPost.body).to.deep.equal({
			method: "GET"
		})
	})
});

describe("/auth", ()=>{
	it("respond with 401", async ()=>{
		expect(got.post(`${URL}/auth`, {followRedirect: false})).to.throw;
		expect(got.post(`${URL}/auth`, {
			followRedirect: false,
			json: {
				username: "dsa",
				password: "dsa",
			}
		})).to.throw;
	});
	it("set cookie", async ()=>{
		const resp = await got.post(`${URL}/auth`, {
			followRedirect: false,
			json: {
				username: "test",
				password: "test",
			}
		});
		expect(resp.statusCode).to.equal(200);
		expect(resp.headers["set-cookie"][0]).to.include("allowed=true");
	});
	it("respond with correct content type", async ()=>{
		const resp = await got.post(`${URL}/auth`, {
			followRedirect: false,
			json: {
				username: "test",
				password: "test",
			},
			responseType: "json"
		});
		expect(resp.body).to.deep.equal({
			contentType: "application/json",
		});
	});
});
describe("/afterAuth", ()=>{
	it("respond with 401", async ()=>{
		const respPromise = got.get(`${URL}/afterAuth`);

		expect(respPromise).to.throw;

		try{
			await respPromise;
		}catch (err){
			expect(err.response.statusCode).to.equal(401);
		}
	});
	it("respond with ok:true",async ()=>{
		const resp = await got.get(`${URL}/afterAuth`,{
			headers: {
				"cookie": "allowed=true",
			},
			responseType: "json"
		});

		expect(resp.body).to.deep.equal({
			ok: true
		});
	});
});

describe("/mirror", ()=>{
	it("should return correct method, headers, query", async ()=>{
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
		const resp = await got.get(`${URL}/mirror`,{
			headers: sent.headers,
			searchParams: sent.query,
			responseType: "json"
		});

		expect((<any>resp.body).headers).to.contain(sent.headers);
		expect((<any>resp.body).method).to.deep.equal("GET");
		expect((<any>resp.body).query).to.deep.equal(sent.query);
	});
	it("should return correct method and body", async()=>{
		const body = {
			key1: "val1",
			arr: ["val1","val2","val3"],
			nested: {
				level2:{
					level: 3
				}
			}
		}
		const resp = await got.post(`${URL}/mirror`,{
			json: body,
			responseType: "json"
		});

		expect((<any>resp.body).body).to.deep.equal(body);
		expect((<any>resp.body).method).to.deep.equal("POST");
	})
});