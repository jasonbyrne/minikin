# Minikin

![Version](https://badgen.net/npm/v/minikin)
![Minified](https://badgen.net/bundlephobia/min/minikin)
![Minzipped](https://badgen.net/bundlephobia/minzip/minikin)

SMALL BUT MIGHTY!

Yet another web server? Why?! Well, the other ones are really big. They have dependencies and do too much. I just wanted a simple way to start up an HTTP server, handle some routes, and handle the core use cases that you need most of the time. 80-20 rule. No other fluff.

So here you go.

Install it with:

```
npm i minikin
```

Then start using it:

```javascript
import { Server, Response } from "minikin";

(async () => {
  const server = await Server.create(8000);

  server.route("GET", "/hello", () => {
    return Response.createFromJson({
      message: "Hello from Minikin!",
    });
  });
})();
```

Minikin can also handle URL path params out of the box:

```javascript
server.route("GET", "/hello/:name", (req) => {
  return Response.createFromJson({
    message: `Hello to ${req.params.name} from Minikin!`,
  });
});
```

It will parse the JSON body automatically:

```javascript
server.route("POST", "/person", (req) => {
  const name = req.body.name; // { name: "Jason" }
  return Response.createFromJson({
    message: `You want to create a new person named ${name}`,
  });
});
```

If you want to do HTTPS, pass in your certificate information as the segment argument

```javascript
const server = await Server.create(8000, {
  pfx: fs.readFileSync("test/fixtures/test_cert.pfx"),
  passphrase: "sample",
});
```

For a catch-all route, put it LAST. And do this:

```javascript
server.route("GET", "*", () => {
  return Response.createFromJson(
    {
      message: "File not found",
    },
    { statusCode: 404 }
  );
});
```

You can also wildcard parts of the route like:

```javascript
server.route("GET", "/*/foo", () => {
  return Response.createFromJson({
    message: "This will respond to /hello/foo or /goodbye/foo",
  });
});
```

And you can use regex within your routes

```javascript
server.route("GET", "/hello/?", () => {
  return Response.createFromJson({
    message: "This will respond to /hello or /hello/",
  });
});
```

To serve a response from a local file:

```javascript
server.route("GET", "/hello", () => {
  return Response.createFromFile("/path/to/file");
});
```

Or to respond with a string:

```javascript
server.route("GET", "/hello", () => {
  return Response.createFromString("Hello World!");
});
```

To set status code:

```javascript
server.route("GET", "/hello", () => {
  return Response.createFromString("Forbidden", {
    statusCode: 403,
  });
});
```

And to set any headers:

```javascript
server.route("GET", "/hello", () => {
  return Response.createFromString("Forbidden", {
    statusCode: 403,
    headers: [
      ["X-Custom-Header", "foobar"],
      ["Cache-Control", "no-store"],
    ],
  });
});
```

Minkin also supports middleware, most often used as guards. You can chain callbacks.

```javascript
const requireAuthentication = (req: Request) => {
  if (!req.headers["Authorization"]) {
    return Response.createFromString("Must Authenticate", { statusCode: 401 });
  }
};

server.route("GET", "/protected", requireAuthentication, () => {
  return Response.createFromString("OK");
});
```

You can also chain routes if you prefer that syntax:

```javascript
server
  .route("GET", "/hello", () => Response.createFromString("hello"))
  .route("GET", "/hello/:name", (req) => Response.createFromJson({
    message: `Hello to ${req.params.name} from Minikin!`,
  })
  .route("GET", "/admin", () => Response.createFromString("Forbidden", {
    statusCode: 403
  });
```
