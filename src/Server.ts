import * as express from "express"
import * as bodyParser from "body-parser";
import * as cookieParser from "cookie-parser";
import {createServer} from "http";
import {copyObjectProps} from "./util";

export type TestServer = {
	close(): Promise<void>;
}


export default async function createTestServer(host: string, port: number, log: boolean=false): Promise<TestServer> {
	const app = express();

	app.use(bodyParser.urlencoded({extended: false}));
	app.use(bodyParser.json());
	app.use(cookieParser());

	app.get("/wait/:time",(req,res, next)=>{
		let wait = 1000;
		if(req.query.time){
			let _wait = Number.parseInt(req.params.time);
			if(!isNaN(_wait) && _wait > 0){
				wait = _wait;
			}
		}
		setTimeout(()=>{
			res.json({
				waited: `${wait} ms`,
			})
		}, wait)
	});

	app.use((req,res,next)=>{
		if(log) {
			console.log(`${req.method} ${req.path}`)
			console.log(`Querry: ${JSON.stringify(req.query)}`);
			console.log(`Body: ${JSON.stringify(req.body)}`);
			console.log("Headers:");
			for(let key of Object.keys(req.headers)){
				console.log(`${key}: ${req.headers[key]}`);
			}
		}
		next();

		if(log){
			console.log(`Response ${res.statusCode} ${res.statusMessage}`);
			if(res.get("set-cookie")) console.log("Cookies:",res.get("set-cookie"));
			if(res.get("location")) console.log("Location:",res.get("location"));
			console.log("-".repeat(10));
		}
	});

	app.all("/redirects/method/mirror",(req,res,next)=>{
		return res.json({
			method: req.method,
		})
	});

	app.all("/redirects/method/:code?",(req,res,next)=>{
		let code = Number.parseInt(req.params?.code);
		if([301,302,303,307,308].indexOf(code) < 0 ){
			code = 302;
		}
		return res.redirect(code, "/redirects/method/mirror");
	});

	app.get("/redirects/:redirCount",(req, res, next)=>{
		const redirCount = Number.parseInt(req.params?.redirCount);
		if(isNaN(redirCount) || redirCount<0 ) return res.status(400).send(`Invalid redir count "${req.params?.redirCount}"`);

		res.cookie("redirCookie",redirCount.toString());

		if(redirCount===0){
			return res.status(200).json({ok: true});
		}else{
			res.redirect(302, `/redirects/${redirCount-1}`);
		}
	});

	app.post("/auth",(req,res,next)=>{
		if(!req.body.username || !req.body.password) return res.status(401).send("No username/password. username=test ; password=test");
		if(req.body.username !== "test" || req.body.password !== "test") return res.status(401).send("Incorrect login. username=test ; password=test");

		res.cookie("allowed","true").json({
			contentType: req.get("content-type").split(";")[0]
		});
	});

	app.get("/afterAuth",(req,res,next)=>{
		if(req.cookies?.allowed !== "true") res.status(401).send("No cookie man 🍪😨");
		else res.status(202).json({ok: true});
	})

	app.all("/mirror",(req,res,next)=>{
		const copy: any = copyObjectProps(req,[
			"method","headers","body","query"
		]);

		res.json(copy);
	})

	app.all("/mirror/:key",(req,res,nexy)=>{
		const key = req.params?.key;
		if(["method","headers","body","query"].indexOf(key)<0){
			return res.status(404).send(`Invalid key "${key}"`);
		}
		const copy: any = {};
		copy[key]=req[key];

		res.json(copy);
	});

	app.use((err, req, res, next)=>{
		if (res.headersSent) {
			return next(err)
		}
		res.status(500)
		res.json({ error: err });
	});

	app.use((req,res,next)=>{
		res.status(404).send(`${req.method} ${req.path} does not exist`);
	});

	return new Promise((resolve, reject) => {
		let resolved = false;

		const server = createServer(app);
		server.on("listening",()=>{
			resolved=true;
			if(log) console.log("Listening...");
			resolve({
				async close(){
					return new Promise<void>(resClose=>{
						server.close(()=>resClose());
					})
				}
			})
		}).on("error", (err)=>{
			if(!resolved) reject(err);
			else console.error(err);
		}).listen(port, host);
	})
}