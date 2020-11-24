# http-testing-server

### Express HTTP server meant for testing HTTP clients and how they behave in certain situations, written in typescript.

## Features

- [x] Specify listen port
- [x] Request server to redirect given number of times
- [x] Login with cookies
- [x] Request server to make client wait n number of ms, useful for testing timeouts
- [x] Endpoint that responds with copy of request

## Installation

```shell script
npm install --save http-testing-server
```

## Usage

```typescript
//Typescript
import createTestServer from "http-testing-server"
//Javascript
const createTestServer = require("http-testing-server")


async function runTest(){
    const testServer = await createTestServer("localhost", 3099);

    const res = axios.get("http://localhost:3099/redirects/4");

    assert(res.code === 302);
    
    await testServer.close();
}

runTest().catch(err=>console.error(err));
```

## Endpoints

### GET /redirects/:*redirectCount*

Will send 302 as many times as redirectCount with location __/redirects/(redirectCount-1__) while redirectCount is greater than 0

When requesting __/redirects/0__, the server will respond with json ```{ok: true}```

Each request it will also send set-cookie header ```redirCookie=${redirCount}```, to test if the client parses cookies on each redirect, so you should check if at the end redirCookie=0.

Ex: __/redirects/2__ will redirect to __/redirects/1__ which will redirect to __/redirects/0__

### ANY_METHOD /redirects/method/:code

Will redirect to __/redirects/method/mirror__, using response code __code__ if present,
or 302 as a default.

Valid status codes for redirecting are 301, 302, 303, 307, 308

### ANY_METHOD /redirects/method/mirror

Responds with json ```{method: $(METHOD_USED)}``` where METHOD_USED is 
the HTTP method used when requesting.

Useful for testing if your client uses GET when redirected from
a POST/PUT/DELETE/... request.

### POST /auth

Post json or x-www-form-urlencoded data to receive a cookie __allowed=true__.
Should post __username=test__ and __password=test__  

Responds with **200** json ```{contentType: $(CONTENT TYPE USED FOR POST)}``` and cookie __allowed=true__ if username and password is correct  
Responds with **401** otherwise

### GET /afterAuth

Responds with **200** json ```{ok: true}``` if __allowed=true__ cookie is present  
Responds with **401** text ```No cookie man 🍪😨``` otherwise

### GET /mirror

Responds with a json copy of the request, containing:
- Headers
- HTTP method
- Query
- Body

### GET /mirror/:key

Returns same as mirror but only the key requested

ex: __/mirror/headers__ will only send the headers of the request



